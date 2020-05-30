import * as vscode from 'vscode'
import * as assert from 'assert'

suite('Vaulty', () => {
  test('can be activated', async () => {
    const vaulty = vscode.extensions.getExtension('codeflows.vaulty')
    assert.ok(vaulty)
    await vaulty.activate()
    const commands = await vscode.commands.getCommands()
    assert.ok(commands.includes('vaulty.decrypt'))
  })
})
