import { window, Uri, TextDocumentContentProvider, CancellationToken } from 'vscode'
import { openVault } from './vault'

export class VaultDocumentContentProvider implements TextDocumentContentProvider {
  static scheme = 'vaulty'

  static encodeLocation(uri: Uri) {
    return Uri.parse(`${this.scheme}:${uri.path}`)
  }

  provideTextDocumentContent(uri: Uri, token: CancellationToken) {
    return openVault(uri)
  }
}
