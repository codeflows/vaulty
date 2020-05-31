import * as vscode from 'vscode'
import * as assert from 'assert'
import { teardown } from 'mocha'

suite('Vaulty', () => {
  test('can be activated', async () => {
    const vaulty = vscode.extensions.getExtension('codeflows.vaulty')
    assert.ok(vaulty)
    await vaulty.activate()
    const commands = await vscode.commands.getCommands()
    assert.ok(commands.includes('vaulty.decrypt'))
  })

  teardown(async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors')
  })

  test('can run decrypt on a sample file', async () => {
    const folders = vscode.workspace.workspaceFolders
    assert.ok(folders)
    assert.equal(folders.length, 1)

    const root = folders[0].uri
    const secrets = vscode.Uri.joinPath(root, 'configuration_in_same_directory', 'secrets.yml')

    const textDocument = await vscode.workspace.openTextDocument(secrets)
    await vscode.window.showTextDocument(textDocument)
    await vscode.commands.executeCommand('vaulty.decrypt')

    await new Promise((resolve) => setTimeout(resolve, 1000))
    const editor = vscode.window.activeTextEditor
    assert.ok(editor)
    assert.ok(editor.document.getText().includes('test: true'))
  }).timeout(10000)
})
