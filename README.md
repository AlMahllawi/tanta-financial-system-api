# Tanta Financial System API
Track financial and administrative transactions progress, submission and review.  
Checkout [contributing](./CONTRIBUTING.md#development-setup).

## [Docker](https://www.docker.com/) deployment using [compose](https://docs.docker.com/compose/)

### Setup
```bash
cp .env.docker.example .env.docker
```
Change the port if `3000` is in use, e.g.
```dotenv
PORT=3000
```

### Build and Start
```bash
docker-compose --env-file .env.docker up --build 
```

### Optionally seeding the database for testing
```bash
docker compose up -d && docker compose exec -e NODE_ENV=testing app pnpm seed:run && docker compose down
```

### Stop
```bash
docker-compose down
```

## TODO
Update postman and document the endpoints.
