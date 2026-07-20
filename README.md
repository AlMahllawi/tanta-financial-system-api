# Tanta Financial System API

[![NestJS](https://img.shields.io/badge/framework-NestJS-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/orm-Prisma-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

Backend API for tracking financial and administrative transactions progress, submission and review.

---

## Features

- **Transaction Tracking**: Real-time progress monitoring of financial requests.
- **Workflow Management**: Efficient submission and review cycles.
- **Role-based Access**: Secure handling of administrative tasks.
- **Document Management**: Integration for handling transaction-related documents.

---

## Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Validation**: [Joi](https://joi.dev/) & [Class-Validator](https://github.com/typestack/class-validator)
- **Documentation**: [Swagger (OpenAPI)](https://swagger.io/)

---

## Getting Started

Follow these steps to get a local development environment up and running.

### Prerequisites

Ensure the following are installed:

- [Bun](https://bun.com/)
- [PostgreSQL](https://www.postgresql.org/download/)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/AlMahllawi/tanta-financial-system-api.git
cd tanta-financial-system-api
bun install
```

### Environment Configuration

Copy the example environment file and update the values to match the local setup:

```bash
cp .env.example .env
```

#### Edit the `.env` file

- provide the database credentials:

```env
# Example DATABASE_URL
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/TantaFinancial?schema=public"
```

### Database Setup & Prisma (Crucial Steps)

These steps are often forgotten but are essential for the app to function.

> [!TIP]
> **Prisma Client Generation**: The `postinstall` script runs `prisma generate` automatically after `bun install`, but it should be run manually if changes are made to `schema.prisma`.

```bash
# Generate the Prisma Client (outputting to prisma/generated)
bun prisma generate

# Apply migrations to the database
bun prisma migrate dev

# Seed the database
bun run seed
```

---

## Running the Application

```bash
# Development mode (with watch mode)
bun run start:dev

# Production mode
bun run build
bun run start:prod
```

The API will be available at `http://localhost:3000` (or the port specified in the `.env` file).

---

## Testing

### Environment Configuration

Copy the example environment file and update the values to match the local setup:

```bash
cp .env.example .env.test
```

#### Edit the `.env.test` file

- provide the database credentials:

```env
# Example DATABASE_URL
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/TantaFinancialTest?schema=public"
```

#### End-to-End API URL (`E2E_API_URL`)

By default, E2E tests boot a fresh NestJS application instance internally. You can optionally run tests against an external, already running API instance by setting the `E2E_API_URL` variable in `.env.test`.

- **Internal Mode (Default)**: Tests boot and manage the application lifecycle.
- **External Mode**: Tests target the provided URL.
  - > [!IMPORTANT]
    > The external API **must** connect to the same database as defined in `DATABASE_URL` in `.env.test` for seeding and cleanup to function correctly.

```bash
# Run unit tests
bun run test

# Run end-to-end tests
bun run test:e2e

# Get test coverage
bun run test:cov
```

---

## Development Notes

### Swagger Documentation

When generating new resources using the Nest CLI (`nest generate resource`), the automatically created DTOs and entities will **not** appear in the Swagger documentation by default.  
Add the `@ApiProperty()` decorator to each property in DTO and Entity classes.  
`@nestjs/swagger` plugin in `nest-cli.json` is not used due to a compatibility issue with ESM.
