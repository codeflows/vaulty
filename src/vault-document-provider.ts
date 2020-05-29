import { window, Uri, ProgressLocation, TextDocumentContentProvider, CancellationToken } from 'vscode'
import { openVault } from './vault'

// VSCode seems to cache editors/files at least for custom provider schemes,
// so that if we open `vaulty:///file.txt` once, then change the original
// file and re-open with the same URI, we get the old version, so we have to use
// a counter to make the URI unique. This is also done in the sample code:
// https://github.com/Microsoft/vscode-extension-samples/blob/6ae1ea637f959b48ec4d72a22e3018a6e76edcce/contentprovider-sample/src/provider.ts#L93-L98
const sequence = (() => {
  let seq = 0
  return () => seq++
})()

export class VaultDocumentContentProvider implements TextDocumentContentProvider {
  static scheme = 'vaulty'

  static encodeLocation(uri: Uri) {
    return Uri.parse(`${this.scheme}:${uri.path}#${sequence()}`)
  }

  provideTextDocumentContent(uri: Uri, token: CancellationToken) {
    return window.withProgress({ location: ProgressLocation.Window, title: 'Decrypting Ansible Vault' }, (progress) =>
      openVault(progress, uri)
    )
  }
}
