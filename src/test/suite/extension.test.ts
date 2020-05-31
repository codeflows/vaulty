import * as vscode from 'vscode'
import * as assert from 'assert'
import { teardown } from 'mocha'

const delay = (delayMs: number) => new Promise((resolve) => setTimeout(resolve, delayMs))

const waitTickMs = 50

const waitFor = async (condition: () => boolean, timeLeftMs: number = 5000): Promise<void> => {
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

suite('Vaulty', () => {
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

  test('can run decrypt on a sample file', async () => {
    const secretsUri = vscode.Uri.joinPath(getWorkspaceRootPath(), 'configuration_in_same_directory', 'secrets.yml')

    const textDocument = await vscode.workspace.openTextDocument(secretsUri)
    await vscode.window.showTextDocument(textDocument)
    await vscode.commands.executeCommand('vaulty.decrypt')

    await waitFor(decryptedFileIsOpen)
    const editor = vscode.window.activeTextEditor
    assert.ok(editor)
    assert.ok(editor.document.getText().includes('test: true'))
  })
})
