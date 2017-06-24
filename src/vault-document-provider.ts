import { window, Uri, ProgressLocation, TextDocumentContentProvider, CancellationToken } from 'vscode'
import { openVault } from './vault'

export class VaultDocumentContentProvider implements TextDocumentContentProvider {
  static scheme = 'vaulty'

  static encodeLocation(uri: Uri) {
    return Uri.parse(`${this.scheme}:${uri.path}`)
  }

  provideTextDocumentContent(uri: Uri, token: CancellationToken) {
    return window.withProgress({ location: ProgressLocation.Window, title: 'Decrypting Ansible Vault' }, progress =>
      openVault(progress, uri)
    )
  }
}
