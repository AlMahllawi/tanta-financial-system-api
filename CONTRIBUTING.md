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
cp .env.example .env
```
Change the environment to be `development`.
```dotenv
NODE_ENV=development
```

### Run the migrations
```bash
pnpm migration:run
```

### Seed the database
```bash
pnpm build && pnpm seed:run
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