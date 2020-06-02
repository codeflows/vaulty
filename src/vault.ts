import { basename, resolve } from 'path'
import { readFile, exec, isFileAccessible } from './util'
import { workspace, window, Uri, Progress } from 'vscode'
import { log } from './log'

export const isEncryptedVaultFile = (content: string) => content.match(/^\$ANSIBLE_VAULT/)

const longestFirst = (a: Uri, b: Uri) => b.fsPath.length - a.fsPath.length

const logFileList = (files: Uri[]) => log.appendLine(`${files.map((file) => `- ${file.fsPath}`).join('\n')}`)

const parent = (uri: Uri) => Uri.joinPath(uri, '..')

async function findAnsibleConfigurationsInParentDirectoriesWithinWorkspace(vaultFile: Uri): Promise<Uri[]> {
  const files = await workspace.findFiles('**/ansible.cfg')
  const vaultFileDirectory = parent(vaultFile)
  const filesInParentDirectories = files.filter((file) => vaultFileDirectory.fsPath.startsWith(parent(file).fsPath))
  log.appendLine(`Found ${files.length} ansible.cfg file(s) in workspace:`)
  logFileList(files)
  log.appendLine(`${filesInParentDirectories.length} of these are located in parent directories of the Vault file:`)
  logFileList(filesInParentDirectories)
  return filesInParentDirectories.sort(longestFirst)
}

const getHomeDirectoryConfigurationFilePath = () => {
  const homedir = require('os').homedir()
  return resolve(homedir, '.ansible.cfg')
}

async function findAnsibleConfigurationFileInHomeDirectory(): Promise<Uri | null> {
  const path = getHomeDirectoryConfigurationFilePath()
  if (await isFileAccessible(path)) {
    log.appendLine(`Found ${path} in home directory`)
    return Uri.file(path)
  } else {
    log.appendLine('No Ansible configuration found in home directory')
    return null
  }
}

async function parseVaultPasswordFilePath(ansibleCfgFile: Uri): Promise<Uri | null> {
  const content = await readFile(ansibleCfgFile.fsPath)
  const passwordFileMatch = content.match(/^\s*vault_password_file\s*=\s*(.*?)\s*$/m)
  if (passwordFileMatch) {
    const relativePasswordFile = passwordFileMatch[1]
    const passwordFile = Uri.joinPath(ansibleCfgFile, '..', relativePasswordFile)
    log.appendLine(
      `Found vault_password_file in ${ansibleCfgFile.fsPath}, resolved ${relativePasswordFile} to ${passwordFile.fsPath}`
    )
    return passwordFile
  } else {
    log.appendLine(`No vault_password_file found in ${ansibleCfgFile.fsPath}`)
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

class VaultyError extends Error {
  readonly additionalInfo: string

  constructor(message: string, additionalInfo: string) {
    super(message)
    this.additionalInfo = additionalInfo
  }
}

function decryptVault(vaultFile: Uri, configuration: AnsibleConfiguration) {
  const args = ['decrypt', `--vault-password-file=${configuration.passwordFile.fsPath}`, '--output=-', vaultFile.fsPath]
  log.appendLine(`Decrypting vault with arguments "${args.join(' ')}"`)
  return exec('ansible-vault', args).catch((error) => {
    throw new VaultyError(
      `Decryption failed`,
      `Vaulty found an Ansible configuration file

${configuration.configurationFile.fsPath}

which points to the password file

${configuration.passwordFile.fsPath}

but decryption failed. This is the error message from \`ansible-vault\`:

${error.message}`
    )
  })
}

const commentedText = (text: string) => {
  return text
    .split('\n')
    .map((line) => '# ' + line)
    .join('\n')
}

export async function openVault(progress: Progress<{ message: string }>, vaultFile: Uri): Promise<string> {
  progress.report({ message: 'Searching for Vault configuration...' })
  try {
    const configuration = await findAnsibleConfiguration(vaultFile)
    if (configuration == null) {
      throw new VaultyError(
        'No Vault configuration found',
        `Vaulty tried to find \`ansible.cfg\` with \`vault_password_file=...\` defined in
- the same directory as "${basename(vaultFile.fsPath)}"
- its parent directories in the VS Code workspace
- in the home directory (${getHomeDirectoryConfigurationFilePath()})

but could not find a valid configuration.`
      )
    }
    progress.report({ message: 'Found Vault configuration, decrypting...' })
    return await decryptVault(vaultFile, configuration)
  } catch (error) {
    console.error(error)
    window.showErrorMessage(error.message)
    const additionalInfo = error instanceof VaultyError ? '\n\n' + error.additionalInfo : ''
    return commentedText(`ERROR: ${error.message}${additionalInfo}`)
  }
}
