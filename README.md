# Tanta Financial System API

[![NestJS](https://img.shields.io/badge/framework-NestJS-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/orm-Prisma-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![pnpm](https://img.shields.io/badge/package--manager-pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

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
- **Package Manager**: [pnpm](https://pnpm.io/)
- **Validation**: [Joi](https://joi.dev/) & [Class-Validator](https://github.com/typestack/class-validator)
- **Documentation**: [Swagger (OpenAPI)](https://swagger.io/)

---

## Getting Started

Follow these steps to get a local development environment up and running.

### Prerequisites

Ensure the following are installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/installation)
- [PostgreSQL](https://www.postgresql.org/download/)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/AlMahllawi/tanta-financial-system-api.git
cd tanta-financial-system-api
pnpm install
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
> **Prisma Client Generation**: The `postinstall` script runs `prisma generate` automatically after `pnpm install`, but it should be run manually if changes are made to `schema.prisma`.

```bash
# Generate the Prisma Client (outputting to prisma/generated)
npx prisma generate

# Apply migrations to the database
npx prisma migrate dev

# Seed the database
pnpm run seed
```

---

## Running the Application

```bash
# Development mode (with watch mode)
pnpm run start:dev

# Production mode
pnpm run build
pnpm run start:prod
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

```bash
# Run unit tests
pnpm run test

# Run end-to-end tests
pnpm run test:e2e

# Get test coverage
pnpm run test:cov
```

---

## Development Notes

### Swagger Documentation

When generating new resources using the Nest CLI (`nest generate resource`), the automatically created DTOs and entities will **not** appear in the Swagger documentation by default.  
Add the `@ApiProperty()` decorator to each property in DTO and Entity classes.  
`@nestjs/swagger` plugin in `nest-cli.json` is not used due to a compatibility issue with ESM.
