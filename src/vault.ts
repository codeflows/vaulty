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
    return Uri.file(path)
  } else {
    throw new Error(`No Ansible configuration found in home directory, or file not accessible: ${path}`)
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

async function parseVaultPasswordFilePath(ansibleCfgFile: Uri) {
  const content = await readFile(ansibleCfgFile.path)
  const passwordFile = content.match(/^\s*vault_password_file\s*=\s*(.*?)\s*$/m)
  if (passwordFile) {
    const vaultPasswordFile = passwordFile[1]
    const ansibleCfgDirectory = dirname(ansibleCfgFile.path)
    const fullPath = resolve(ansibleCfgDirectory, vaultPasswordFile)
    log.appendLine(`Found vault_password_file in ansible.cfg, resolved ${vaultPasswordFile} to ${fullPath}`)
    return Uri.parse(fullPath)
  }
  throw new Error(`Expected to find vault_password_file definition in ${ansibleCfgFile.path}`)
}

function decryptVault(passwordFile: Uri, vaultFile: Uri) {
  const args = [`--vault-password-file=${passwordFile.path}`, '--output=-', 'decrypt', vaultFile.path]
  log.appendLine(`Decrypting vault with arguments "${args.join(' ')}`)
  return exec('ansible-vault', args)
}

export function openVault(progress: Progress<{ message: string }>, vaultFile: Uri): Promise<string> {
  progress.report({ message: 'Searching for Vault configuration...' })
  return findAnsibleConfigurationFile(vaultFile)
    .then(ansibleCfgFile => parseVaultPasswordFilePath(ansibleCfgFile))
    .then(passwordFile => {
      progress.report({ message: 'Found Vault configuration, decrypting...' })
      return decryptVault(passwordFile, vaultFile)
    })
    .catch(error => {
      console.error(error)
      window.showErrorMessage(`Failed decrypting Vault: ${error.message}`)
      return ''
    })
}
