;('use strict')

import { commands, workspace, window, Uri, ExtensionContext, TextEditor, TextEditorEdit } from 'vscode'
import { VaultDocumentContentProvider } from './vault-document-provider'
import { isEncryptedVaultFile } from './vault'

export async function decryptCommand(editor: TextEditor, edit: TextEditorEdit) {
  if (!isEncryptedVaultFile(editor.document.getText())) {
    return window.showErrorMessage(
      'This does not look like an encrypted Ansible Vault file: expecting a file starting with $ANSIBLE_VAULT'
    )
  }

  const vaultyUri = VaultDocumentContentProvider.encodeLocation(editor.document.uri)
  console.log(`Attempting to delegate to ${vaultyUri}`)
  return workspace.openTextDocument(vaultyUri).then(
    doc => window.showTextDocument(doc, editor.viewColumn),
    err => {
      console.error('Opening text document in vaulty failed', err)
      window.showErrorMessage(`Couldn't open Ansible Vault file in vaulty: ${err.message}`)
    }
  )
}
