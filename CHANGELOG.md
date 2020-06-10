# Changelog

## [0.3.1] - 2020-06-10

### Fixes

- [Handle Ansible password files with an absolute path](https://github.com/codeflows/vaulty/issues/22), thanks [@fessmage](https://github.com/fessmage)!

## [0.3.0] - 2020-06-02

### Added

- User-friendly error messages!
- A better Ansible configuration file discovery mechanism which ignores `ansible.cfg` files with no `vault_password_file` definitions.
- Preliminary Windows support. Only tested on VirtualBox with Win10 (bug reports welcome!)

### Fixes

- [Handle multiple Ansible configuration files gracefully](https://github.com/codeflows/vaulty/issues/8), thanks [@D-side-BL](https://github.com/D-side-BL)!
- [Fix path handling on Windows](https://github.com/codeflows/vaulty/issues/6), thanks [@anonfriese](https://github.com/anonfriese), [@mrackers](https://github.com/mrackers), [@Rabusek](https://github.com/Rabusek)

## [0.2.1] - 2020-05-30

### Fixes

- Fix a bug where [decryption fails on Ansible 2.9.9](https://github.com/codeflows/vaulty/issues/9) (thanks [@silviuvulcan](https://github.com/silviuvulcan)!)

## [0.2.0] - 2018-01-20

### Added

- Also resolve vault password from ~/.ansible.cfg if available

## [0.1.2] - 2017-08-16

### Added

- Fix handling of paths with spaces in them.

## [0.1.0] - 2017-06-25

### Added

- Initial release. Basic functionality for decrypting and viewing vaults.
