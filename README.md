# EvPanel 2.0

Private operational application: project management hub, service monitoring,
recruitment pipeline, job offer aggregator, and admin dashboard for personal apps.

> **This is not a portfolio.** It is a production-grade SaaS-class system designed
> for long-term, multi-module growth.

## Stack

| Layer    | Technologies |
|----------|-------------|
| Frontend | Angular 20 (standalone, signals), RxJS, NgRx (Store/Effects/Entity), Angular Material, SCSS, ngx-translate, PWA |
| Backend  | NestJS, TypeScript, PostgreSQL, TypeORM, JWT + Passport, Swagger, class-validator/transformer |
| Scraper  | Stateless NestJS worker (endpoint + Playwright, Strategy Pattern) |
| DevOps   | Docker, Docker Compose, Nginx (reverse proxy), healthchecks |

## Repo structure

```
frontend/   Angular 20 SPA + Nginx (Dockerfile, nginx.conf, src/shared contracts)
backend/    NestJS API (JWT, Swagger, TypeORM, migrations, Dockerfile, src/shared contracts)
scraper/    Stateless worker (endpoint + Playwright, Dockerfile, src/shared contracts)
```

Each package is self-contained: it has its own `Dockerfile`, and contracts (enums/DTOs)
are duplicated locally in `src/shared` (`@evpanel/shared` alias in the frontend tsconfig,
relative paths in backend/scraper).

Full architecture: see `docs/ARCHITECTURE.md` (if generated) or the project plan.

## Database (external)

The project uses a **shared, external PostgreSQL** (separate repo:
`C:\Users\<user>\docker\postgres`) — it does not spin up its own database. Start that
server once, then point `.env` at it (defaults: `localhost:5432`, database/role/password `evpanel`).

## Quick start (dev)

```bash
cp backend/.env.example backend/.env   # fill in secrets
cp scraper/.env.example scraper/.env   # fill in secrets
# then run each service natively (see below)
```

- Frontend: http://localhost:4200
- Backend API: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs
- Health: http://localhost:3000/api/health

## Running locally without Docker

Each package independently:

```bash
cd backend && npm i && npm run start:dev
cd scraper && npm i && npm run start:dev
cd frontend && npm i && npm start
```

## Production

```bash
cp backend/.env.example backend/.env   # fill in secrets
cp scraper/.env.example scraper/.env   # fill in secrets
docker compose up -d --build
```

App served by Nginx on port `80` (`/` → frontend, `/api` → backend).

## Migrations (backend)

```bash
cd backend
npm run migration:generate -- src/database/migrations/MigrationName
npm run migration:run
```

## Conventions

- TypeScript `strict`, ESLint + Prettier (config at root).
- Frontend: standalone components, `OnPush`, **Facade-only** (components do not touch the Store directly).
- Backend: domain modules, DTO + validation, thin services.
- Commits: Conventional Commits.
