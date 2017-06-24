# Vaulty
A plugin for viewing [Ansible Vault](https://docs.ansible.com/ansible/playbooks_vault.html) files in [Visual Studio Code](https://code.visualstudio.com/).

![Decrypting Vault with Vaulty](demo/vaulty.gif)

## Usage

Currently no configuration, just conventions:

1. Install [Ansible](https://www.ansible.com/) and ensure `ansible-vault` is in PATH.
1. Place `ansible.cfg` with `vault_password_file` specified in a parent directory of the encrypted Vault file.
1. Run the plugin on the Vault file to decrypt it.

For example, to decrypt a Vault located at `$ROOT/src/secrets.yml`, the plugin looks for `ansible.cfg` in either `$ROOT/src/ansible.cfg` or `$ROOT/ansible.cfg`, resolves the `vault_password_file` and shows the decrypted Vault content in a new tab.

For examples, see the [test vaults](https://github.com/codeflows/vaulty/tree/master/test/vaults).

## Security

The plugin never prompts for a Vault password. It always uses the `vault_password_file=...` statement from a suitable Ansible configuration file. The contents of the `vault_password_file` are not read into memory, instead the file name is passed to the `ansible-vault` command as a parameter. The contents of the Vault are decrypted into a temporary VS Code virtual document that can't be saved nor modified.

## Future ideas

It would be nice to be able to edit the decrypted Vault, and save it back to disk encrypted, but currently (2016-06-25) the virtual documents created by VSCode [can't be edited](https://github.com/Microsoft/vscode/issues/10547), so this would require a different approach.

## Known issues

Currently only tested on OS X with Ansible version 2.3
