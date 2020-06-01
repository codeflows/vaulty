import { resolve, dirname, basename } from 'path'
import { readFile, exec, isFileAccessible } from './util'
import { workspace, window, Uri, Progress } from 'vscode'
import { log } from './log'

export const isEncryptedVaultFile = (content: string) => content.match(/^\$ANSIBLE_VAULT/)

const longestFirst = (a: Uri, b: Uri) => b.fsPath.length - a.fsPath.length

const logFileList = (files: Uri[]) => log.appendLine(`${files.map((file) => `- ${file}`).join('\n')}`)

async function findAnsibleConfigurationsInParentDirectoriesWithinWorkspace(vaultFile: Uri): Promise<Uri[]> {
  const files = await workspace.findFiles('**/ansible.cfg')
  const vaultFileDirectory = dirname(vaultFile.path)
  const filesInParentDirectories = files.filter((file) => vaultFileDirectory.startsWith(dirname(file.path)))
  log.appendLine(`Found ${files.length} ansible.cfg file(s) in workspace:`)
  logFileList(files)
  log.appendLine(`${filesInParentDirectories.length} of these are located in parent directories of the Vault file:`)
  logFileList(filesInParentDirectories)
  return filesInParentDirectories.sort(longestFirst)
}

async function findAnsibleConfigurationFileInHomeDirectory(): Promise<Uri | null> {
  const homedir = require('os').homedir()
  const path = resolve(homedir, '.ansible.cfg')
  if (await isFileAccessible(path)) {
    log.appendLine(`Found ${path} in home directory`)
    return Uri.file(path)
  } else {
    log.appendLine('No Ansible configuration found in home directory')
    return null
  }
}

async function parseVaultPasswordFilePath(ansibleCfgFile: Uri): Promise<Uri | null> {
  const content = await readFile(ansibleCfgFile.path)
  const passwordFile = content.match(/^\s*vault_password_file\s*=\s*(.*?)\s*$/m)
  if (passwordFile) {
    const vaultPasswordFile = passwordFile[1]
    const ansibleCfgDirectory = dirname(ansibleCfgFile.path)
    const fullPath = resolve(ansibleCfgDirectory, vaultPasswordFile)
    log.appendLine(`Found vault_password_file in ${ansibleCfgFile.path}, resolved ${vaultPasswordFile} to ${fullPath}`)
    return Uri.parse(fullPath)
  } else {
    log.appendLine(`No vault_password_file found in ${ansibleCfgFile.path}`)
    return null
  }
}

interface AnsibleConfiguration {
  configurationFile: Uri
  passwordFile: Uri
}

// Finds eligible Ansible configuration files
// - in parent directories of the encrypted file, within the open workspaces
// - in the user home directory (~/.ansible.cfg)
// and returns the first one that contains a valid `vault_password_file` configuration
async function findAnsibleConfiguration(vaultFile: Uri): Promise<AnsibleConfiguration | null> {
  const workspaceFiles = await findAnsibleConfigurationsInParentDirectoriesWithinWorkspace(vaultFile)
  const homeDirectoryFile = await findAnsibleConfigurationFileInHomeDirectory()
  const candidates = workspaceFiles.concat(homeDirectoryFile || [])
  for await (const candidate of candidates) {
    const passwordFile = await parseVaultPasswordFilePath(candidate)
    if (passwordFile != null) {
      return {
        configurationFile: candidate,
        passwordFile
      }
    }
  }
  return null
}

class DecryptionError extends Error {
  readonly ansibleVaultOutput: string

  constructor(message: string, ansibleVaultOutput: string) {
    super(message)
    this.ansibleVaultOutput = ansibleVaultOutput
  }
}

function decryptVault(vaultFile: Uri, configuration: AnsibleConfiguration) {
  const args = ['decrypt', `--vault-password-file=${configuration.passwordFile.path}`, '--output=-', vaultFile.path]
  log.appendLine(`Decrypting vault with arguments "${args.join(' ')}"`)
  return exec('ansible-vault', args).catch((error) => {
    throw new DecryptionError(
      `Decryption failed using password file ${configuration.passwordFile.path} defined in ${configuration.configurationFile.path}`,
      error.message
    )
  })
}

export async function openVault(progress: Progress<{ message: string }>, vaultFile: Uri): Promise<string> {
  progress.report({ message: 'Searching for Vault configuration...' })
  try {
    const configuration = await findAnsibleConfiguration(vaultFile)
    if (configuration == null) {
      throw new Error(
        `No Vault configuration found.

Vaulty tried to find an \`ansible.cfg\` file with \`vault_password_file=...\` defined in
- the same directory as ${basename(vaultFile.fsPath)}
- its parent directories in the VS Code workspace
- the home directory`
      )
    }
    progress.report({ message: 'Found Vault configuration, decrypting...' })
    return await decryptVault(vaultFile, configuration)
  } catch (error) {
    console.error(error)
    window.showErrorMessage(error.message)
    const vaultOutput = error instanceof DecryptionError ? error.ansibleVaultOutput : ''
    return `ERROR: ${error.message}\n${vaultOutput}`
  }
}
