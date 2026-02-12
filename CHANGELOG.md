# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - YYYY-MM-DD

### Added

- Versioning URI.
- Departments resource.
- User attributes
  - Department.
  - Activation.
  - Last login.
- Uploaded documents endpoint.
- Transaction type creator.
- Transaction forward attributes
  - Seen.
  - Sender Comment.
  - Receiver Comment.
- Lookup endpoint.

### Changed

- Replaced documentURI with documentId.
- User group renamed to user role.
- User "change password" endpoint replaced with "update" endpoint.
- Soft delete resources.

### Removed

- `WAITING` from `UpdateTransactionForwardDto.status`
