import { workspace, window, Uri, TextEditor, TextEditorEdit } from 'vscode'
import { VaultDocumentContentProvider } from './vault-document-provider'
import { isEncryptedVaultFile } from './vault'
import { log } from './log'

export async function decryptCommand(editor: TextEditor, edit: TextEditorEdit) {
  if (!isEncryptedVaultFile(editor.document.getText())) {
    return window.showErrorMessage(
      'This does not look like an encrypted Ansible Vault file: expecting a file starting with $ANSIBLE_VAULT'
    )
  }

  const vaultyUri = VaultDocumentContentProvider.encodeLocation(editor.document.uri)
  log.appendLine(`Attempting to delegate to ${vaultyUri}`)
  return workspace.openTextDocument(vaultyUri).then(
    (doc) => window.showTextDocument(doc, editor.viewColumn),
    (err) => {
      log.appendLine(`Opening text document in vaulty failed ${err.stack}`)
      window.showErrorMessage(`Opening the Vault failed: ${err.message}`)
    }
  )
}
