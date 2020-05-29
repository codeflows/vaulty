import * as vscode from 'vscode'

suite('Vaulty', () => {
  test('can be activated', async () => {
    const vaulty = vscode.extensions.getExtension('codeflows.vaulty')
    await vaulty?.activate()
  })
})
