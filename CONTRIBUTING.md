# Contributing
A guide for contributing to the project, including setup and guidelines.

## Development Setup
Configure tools, environments and dependencies to build code locally.

### Prerequisites
- [Node.js v20+](https://nodejs.org/en)
- [PNPM](https://pnpm.io/)

### Install dependencies
```bash
pnpm install
```

### Set up the environment
```bash
cp example.env .env
```
Change the environment to be `development` and insert the [database connection URL](https://stackoverflow.com/questions/3582552/what-is-the-format-for-the-postgresql-connection-string-url).
```properties
NODE_ENV=development

DB_CONNECTION_URL="postgres://almahllawi:n0nS3cure@localhost:5432/TantaFinancial"
```

### Run the migrations
```bash
pnpm migrations
```

### Launch the API
```bash
pnpm dev
```

## Guidelines
Best practices for coding, testing, and submitting contributions to ensure consistency and quality.

### Generate migrations after modifying any [entity](./src/entities/)
```bash
pnpm run migration:generate unique-user-name
```