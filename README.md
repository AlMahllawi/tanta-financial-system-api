# Tanta Financial System API
Track financial and administrative transactions progress, submission and review.  
Checkout [contributing](./CONTRIBUTING.md#development-setup).

## [Docker](https://www.docker.com/) deployment using [compose](https://docs.docker.com/compose/)

### Setup
```bash
cp .env.example .env
```
Change the port if `3000` is in use, e.g.
```dotenv
PORT=3000
```
Modify CORS allowed origins if needed:
```dotenv
ALLOWED_ORIGINS=http://localhost:8080
```

### Build
```bash
docker compose build
```

### Optionally seeding the database for testing
```bash
docker compose up -d && docker compose exec -e NODE_ENV=testing app pnpm seed:run && docker compose down
```

### Start
```bash
docker compose up
```

### Stop
```bash
docker-compose down
```
