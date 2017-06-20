# vaulty
A simple & safe plugin for viewing [Ansible Vault](https://docs.ansible.com/ansible/playbooks_vault.html)
files in [Visual Studio Code](https://code.visualstudio.com/).

No configuration: expects to find `ansible-vault` in PATH and an `ansible.cfg` with `vault_password_file=...`
specified in a parent directory of the encrypted vault file.

TODO replace instructions with image

1. Open an encrypted Ansible Vault file in VS Code
2. Open Command Palette with `shift+cmd+p`
3. `>Vaulty: decrypt and view Ansible vault file`

DISCLAIMER: This is an early release. Use with caution.

## Security

The plugin never prompts for a Vault password. It always uses the `vault_password_file=...` statement from a suitable Ansible configuration file. The contents of `vault_password_file` are never read into memory, instead the file name is passed to the `ansible-vault` command as a parameter. The contents of the vault are decrypted into a temporary VS Code editor buffer via stdout, so they should not hit the disk (TODO unless VS Code buffers them to disk?)

## Future work

- Allow editing the Vault file and encrypting back to disk

## TODO / known issues

- Report missing `ansible-vault` gracefully
- Proper testing
- The name of the decrypted file buffer is the same as the original file's name
- After first decryption error, subsequent tries fail with `An error occured while running command vaulty.decrypt TextEditor disposed`
- How to open a temporary buffer for editing, and encrypt its contents back to the original file on save?
  - If we do this, we need to check the original file wasn't modified in the meanwhile