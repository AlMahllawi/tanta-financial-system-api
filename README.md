# Tanta Financial System API
Track financial and administrative transactions progress, submission and review.  
Checkout [Development Setup](./CONTRIBUTING.md#development-setup).

## Prerequisites
- [Node.js v20+](https://nodejs.org/en)
- [PNPM](https://pnpm.io/)

## Quick Start

### Install dependencies
```bash
pnpm install --prod
```

### Set up the environment
```bash
cp example.env .env
```

Edit the [database connection URL](https://stackoverflow.com/questions/3582552/what-is-the-format-for-the-postgresql-connection-string-url) in `.env` e.g.:
```env
DB_CONNECTION_URL="postgres://almahllawi:n0nS3cure@localhost:5432/TantaFinancial"
```

### Run the migrations
```bash
pnpm typeorm migration:run
```

### Build the API
```bash
pnpm build
```

### Launch the API
```bash
pnpm start
```