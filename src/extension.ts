;('use strict')

import { commands, workspace, ExtensionContext } from 'vscode'
import { VaultDocumentContentProvider } from './vault-document-provider'
import { decryptCommand } from './decrypt-command'

export function activate(context: ExtensionContext) {
  console.log('vaulty activated')

  const provider = new VaultDocumentContentProvider()

  const providerRegistration = workspace.registerTextDocumentContentProvider(
    VaultDocumentContentProvider.scheme,
    provider
  )
  const commandRegistration = commands.registerTextEditorCommand('vaulty.decrypt', decryptCommand)

  context.subscriptions.push(providerRegistration, commandRegistration)
}

export function deactivate() {}
