import * as assert from 'assert'

import * as vscode from 'vscode'
import * as vaulty from '../src/extension'

suite('Vaulty', () => {
  test('can be activated', async () => {
    const vaulty = vscode.extensions.getExtension('codeflows.vaulty')
    await vaulty.activate()
  })
})
