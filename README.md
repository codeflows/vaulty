# Vaulty

[![Marketplace Version](https://vsmarketplacebadge.apphb.com/version/codeflows.vaulty.svg)](https://marketplace.visualstudio.com/items?itemName=codeflows.vaulty)
[![Installs](https://vsmarketplacebadge.apphb.com/installs-short/codeflows.vaulty.svg)](https://marketplace.visualstudio.com/items?itemName=codeflows.vaulty)
[![Rating](https://vsmarketplacebadge.apphb.com/rating-short/codeflows.vaulty.svg)](https://marketplace.visualstudio.com/items?itemName=codeflows.vaulty)

A plugin for viewing [Ansible Vault](https://docs.ansible.com/ansible/playbooks_vault.html) files in [Visual Studio Code](https://code.visualstudio.com/).

![Decrypting Vault with Vaulty](demo/vaulty.gif)

## Prerequisites

Install [Ansible](https://www.ansible.com/) and ensure `ansible-vault` is in PATH.

## Usage

No configuration, just conventions:

1. Place `ansible.cfg` file in the same directory as the encrypted Vault file, or in any of its parent directories in the workspace.
1. Alternatively, you can place `.ansible.cfg` in your home directory.
1. Add `vault_password_file=<your_password_file>` to the configuration file
1. Run the plugin on the encrypted Vault file to decrypt it (`Vaulty: decrypt and view Ansible Vault file` in the command palette)

For example, if your encrypted Vault file is located at `YOUR_PROJECT/src/secrets.yml`, the plugin looks for `ansible.cfg` in either `YOUR_PROJECT/src/ansible.cfg` or `YOUR_PROJECT/ansible.cfg`, then falls back to `~/.ansible.cfg` and finally decrypts the Vault content using `vault_password_file` to a new editor tab.

For more examples, see the [test vaults](https://github.com/codeflows/vaulty/tree/master/test-vaults).

## Known issues

Decryption does not work on Ansible 2.4.0 - please upgrade to a newer version (e.g. 2.4.2) if you're having issues.

## Security

The plugin never prompts for a Vault password. It always uses the `vault_password_file=...` statement from a suitable Ansible configuration file. The contents of the `vault_password_file` are not read into memory, instead the file name is passed to the `ansible-vault` command as a parameter. The contents of the Vault are decrypted into a temporary VS Code virtual document that can't be saved nor modified.

## Future ideas

It would be nice to be able to edit the decrypted Vault, and save it back to disk encrypted, but currently (2016-06-25) the virtual documents created by VSCode [can't be edited](https://github.com/Microsoft/vscode/issues/10547), so this would require a different approach.

## Alternative plugins / prior work

[vscode-ansible-vault](https://github.com/dhoeric/vscode-ansible-vault): also allows editing Vaults, but replaces the encrypted file with the decrypted content instead of opening a new buffer.
