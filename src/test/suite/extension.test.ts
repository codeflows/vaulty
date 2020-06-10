import * as vscode from 'vscode'
import * as assert from 'assert'
import { teardown, before } from 'mocha'
import { readFileSync, writeFileSync } from 'fs'

const delay = (delayMs: number) => new Promise((resolve) => setTimeout(resolve, delayMs))

const waitTickMs = 50

const waitFor = async (condition: () => boolean, timeLeftMs: number = 15 * 1000): Promise<void> => {
  if (condition()) {
    return
  } else if (timeLeftMs <= 0) {
    throw new Error('Timed out waiting for condition')
  } else {
    await delay(waitTickMs)
    return waitFor(condition, timeLeftMs - waitTickMs)
  }
}

const decryptedFileIsOpen = () => vscode.window.activeTextEditor?.document.uri.scheme === 'vaulty'

const getWorkspaceRootPath = () => {
  const folders = vscode.workspace.workspaceFolders
  assert.ok(folders)
  assert.equal(folders.length, 1)

  return folders[0].uri
}

// Generates an `ansible.cfg` with an absolute password file
// path for the `absolute_password_file_path` test
const generateConfigWithAbsolutePasswordPath = () => {
  const ansibleCfgTemplate = vscode.Uri.joinPath(getWorkspaceRootPath(), 'absolute_password_file_path/_ansible.cfg')

  const absolutePasswordFilePath = vscode.Uri.joinPath(ansibleCfgTemplate, '..', '..', 'password')
  const template = readFileSync(ansibleCfgTemplate.fsPath, {
    encoding: 'utf-8'
  })
  const processedTemplate = template.replace('$ABSOLUTE_PASSWORD_FILE_PATH$', absolutePasswordFilePath.fsPath)

  const ansibleCfg = vscode.Uri.joinPath(ansibleCfgTemplate, '..', 'ansible.cfg')
  writeFileSync(ansibleCfg.fsPath, processedTemplate, {
    encoding: 'utf-8'
  })
}

suite('Vaulty', () => {
  before(generateConfigWithAbsolutePasswordPath)

  teardown(async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors')
  })

  test('can be activated', async () => {
    const vaulty = vscode.extensions.getExtension('codeflows.vaulty')
    assert.ok(vaulty)
    await vaulty.activate()
    const commands = await vscode.commands.getCommands()
    assert.ok(commands.includes('vaulty.decrypt'))
  })

  const validVaults = [
    'absolute_password_file_path/secrets.yml',
    'configuration_in_parent_directory/subdirectory/secrets.yml',
    'configuration_in_same_directory/secrets.yml',
    'multiple_configurations_with_password_in_parent_directory/subdirectory/secrets.yml',
    'multiple_configurations_with_password_in_same_directory/subdirectory/secrets.yml',
    'non_yaml_file/secrets.json',
    'password_in_bash_script/secrets.yml',
    'vault with spaces in directory name/secrets.yml'
  ]

  const invalidVaults = [
    'invalid_vault_password_file_in_configuration/secrets.yml',
    'no_configuration/secrets.yml',
    'no_vault_password_file_in_configuration/secrets.yml'
  ]

  const vaultTest = (expectValidVault: boolean) => (vault: string) => {
    test(vault, async () => {
      const secretsUri = vscode.Uri.joinPath(getWorkspaceRootPath(), vault)

      const textDocument = await vscode.workspace.openTextDocument(secretsUri)
      await vscode.window.showTextDocument(textDocument)
      await vscode.commands.executeCommand('vaulty.decrypt')

      await waitFor(decryptedFileIsOpen)
      const editor = vscode.window.activeTextEditor
      assert.ok(editor)

      const expectedContent = vault.endsWith('.yml') ? 'test: true' : '"test": true'
      assert.ok(editor.document.getText().includes(expectedContent) === expectValidVault)
    })
  }

  suite('valid vaults', () => {
    validVaults.forEach(vaultTest(true))
  })

  suite('invalid vaults', () => {
    invalidVaults.forEach(vaultTest(false))
  })
})
