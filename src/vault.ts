import { resolve, dirname } from 'path'
import { readFile, exec, isFileAccessible } from './util'
import { workspace, window, Uri, Progress } from 'vscode'
import { log } from './log'

export const isEncryptedVaultFile = (content: string) => content.match(/^\$ANSIBLE_VAULT/)

async function findAnsibleConfigurationFileInWorkspace(vaultFile: Uri) {
  const files = await workspace.findFiles('**/ansible.cfg')
  if (files.length === 0) {
    throw new Error('No ansible.cfg files found in workspace')
  }
  const vaultFileDirectory = dirname(vaultFile.path)
  const candidates = files.filter(file => vaultFileDirectory.startsWith(dirname(file.path)))
  log.appendLine(`Found ${files.length} ansible.cfg file(s) in workspace: ${files}`)
  log.appendLine(`${candidates.length} of these are located in parent directories of the Vault file: ${candidates}`)
  if (candidates.length === 0) {
    throw new Error('No ansible.cfg files found in any parent directories of the Vault file')
  } else if (candidates.length > 1) {
    throw new Error('Found more than one ansible.cfg files in parent directories of the Vault file')
  } else {
    const ansibleCfgFile = candidates[0]
    log.appendLine(`Found exactly one configuration file: ${ansibleCfgFile}`)
    return ansibleCfgFile
  }
}

async function findAnsibleConfigurationFileInHomeDirectory() {
  const homedir = require('os').homedir()
  const path = resolve(homedir, '.ansible.cfg')
  if (await isFileAccessible(path)) {
    log.appendLine(`Found ${path} in the home directory`)
    return Uri.file(path)
  } else {
    throw new Error(`Also tried ${path} but it was not found`)
  }
}

function findAnsibleConfigurationFile(vaultFile: Uri): Promise<Uri> {
  return findAnsibleConfigurationFileInWorkspace(vaultFile).catch(workspaceError => {
    log.appendLine(`Could not find configuration in workspace: ${workspaceError.message}, trying home directory`)
    return findAnsibleConfigurationFileInHomeDirectory().catch(homeDirectoryError => {
      throw new Error(`${workspaceError.message}. ${homeDirectoryError.message}`)
    })
  })
}

async function findVaultPasswordFilePath(ansibleCfgFile: Uri) {
  if (process.env.ANSIBLE_VAULT_PASSWORD_FILE) {
      progress.report({ message: 'ANSIBLE_VAULT_PASSWORD_FILE is set in environment, awesome!' })
      return Uri.parse(process.env.ANSIBLE_VAULT_PASSWORD_FILE)
    } else {
      const content = await readFile(ansibleCfgFile.path)
      const passwordFile = content.match(/^\s*vault_password_file\s*=\s*(.*?)\s*$/m)
      if (passwordFile) {
        const vaultPasswordFile = passwordFile[1]
        const ansibleCfgDirectory = dirname(ansibleCfgFile.path)
        const fullPath = resolve(ansibleCfgDirectory, vaultPasswordFile)
        log.appendLine(`Found vault_password_file in ${ansibleCfgFile.path}, resolved ${vaultPasswordFile} to ${fullPath}`)
        return Uri.parse(fullPath)
      }
  throw new Error(`Expected to find vault_password_file definition in ${ansibleCfgFile.path}`)
}

class DecryptionError extends Error {
  readonly ansibleVaultOutput: string

  constructor(message: string, ansibleVaultOutput: string) {
    super(message)
    this.ansibleVaultOutput = ansibleVaultOutput
  }
}

function decryptVault(ansibleCfgFile: Uri, passwordFile: Uri, vaultFile: Uri) {
  const args = [`--vault-password-file=${passwordFile.path}`, '--output=-', 'decrypt', vaultFile.path]
  log.appendLine(`Decrypting vault with arguments "${args.join(' ')}"`)
  return exec('ansible-vault', args).catch(error => {
    throw new DecryptionError(
      `Decryption failed using password file ${passwordFile.path} defined in ${ansibleCfgFile.path}`,
      error.message
    )
  })
}

export async function openVault(progress: Progress<{ message: string }>, vaultFile: Uri): Promise<string> {
  progress.report({ message: 'Searching for Vault configuration...' })
  try {
    const ansibleCfgFile = await findAnsibleConfigurationFile(vaultFile)
    const passwordFile = await findVaultPasswordFilePath(ansibleCfgFile)
    progress.report({ message: 'Decrypting...' })
    return await decryptVault(ansibleCfgFile, passwordFile, vaultFile)
  } catch (error) {
    console.error(error)
    window.showErrorMessage(error.message)
    if (error instanceof DecryptionError) {
      window.showErrorMessage(error.ansibleVaultOutput)
    }
    return ''
  }
}
