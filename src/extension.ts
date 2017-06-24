import { commands, workspace, ExtensionContext } from 'vscode'
import { VaultDocumentContentProvider } from './vault-document-provider'
import { decryptCommand } from './decrypt-command'
import { log } from './log'

export function activate(context: ExtensionContext) {
  log.appendLine('vaulty activated')

  const provider = new VaultDocumentContentProvider()

  const providerRegistration = workspace.registerTextDocumentContentProvider(
    VaultDocumentContentProvider.scheme,
    provider
  )
  const commandRegistration = commands.registerTextEditorCommand('vaulty.decrypt', decryptCommand)

  context.subscriptions.push(providerRegistration, commandRegistration)
}

export function deactivate() {}
