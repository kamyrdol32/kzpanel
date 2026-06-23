# EvPanel

Aggregates IT job offers from six Polish and global boards into one place, deduplicates them per saved search, and lets you track which ones you applied to.

## Demo

🔗 **Live:** [evpanel.kamilzeglen.pl](https://evpanel.kamilzeglen.pl)

## Authors

| Author | Backend | Frontend |
| :---: | :---: | :---: |
| **Kamil Żegleń** ([kamyrdol32](https://github.com/kamyrdol32)) | 100% | 100% |

## Tech stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Angular 20 (standalone, signals), NgRx (Store/Effects/Entity), RxJS, SCSS, ngx-translate, PWA |
| Backend | NestJS, TypeScript, PostgreSQL, TypeORM (migrations), JWT + Passport, Swagger, class-validator |
| Scraper | NestJS, Playwright (+ stealth), Strategy Pattern |
| Tooling | Docker, Docker Compose, Nginx, ESLint + Prettier, TypeScript strict |

## Highlights

- **Six sources, one inbox** — NoFluffJobs, JustJoinIT, Pracuj.pl, BulldogJob, LinkedIn and theProtocol, each behind its own scraping strategy.
- **Dedicated scraper microservice** — a stateless NestJS + Playwright worker. API-based boards use their JSON APIs; JS-rendered / Cloudflare-protected ones are driven through a stealth browser.
- **Per-account saved searches** — every scraper belongs to the user who created it; offers are deduplicated per scraper so two searches on different boards never clash.
- **Rich, normalized offers** — title, company, salary, work modes, contract types, seniority levels, tech stack, requirements and full description — mapped into one model regardless of source.
- **Polished SPA** — Angular standalone components with signals, NgRx behind a facade layer, i18n (PL/EN), light/dark themes, PWA, and a sliding JWT session.

## Architecture

```
┌────────────┐      ┌────────────┐      ┌──────────────────┐
│  frontend  │ ───▶ │  backend   │ ───▶ │  scraper worker  │
│ Angular SPA│ HTTP │ NestJS API │ HTTP │ NestJS+Playwright │
└────────────┘      └─────┬──────┘      └──────────────────┘
                          │
                    ┌─────▼──────┐
                    │ PostgreSQL │  (external)
                    └────────────┘
```

- **frontend** — Angular SPA, served by Nginx which also reverse-proxies `/api`.
- **backend** — owns auth, persistence, orchestration and offer normalization.
- **scraper** — one guarded endpoint (`POST /scrape`); given a source + query it runs the matching strategy and returns raw offers. No state, no database access.

## Requirements

- Docker & Docker Compose
- External PostgreSQL (not included in the compose stack)

## Environment variables

### `backend/.env`

```bash
POSTGRES_HOST=
POSTGRES_PORT=5432
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=

JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

PORT=3000
CORS_ORIGIN=https://evpanel.kamilzeglen.pl

SCRAPER_URL=http://scraper:3100
SCRAPER_INTERNAL_TOKEN=
```

### `scraper/.env`

```bash
SCRAPER_PORT=3100
INTERNAL_TOKEN=
```

## Getting started

```bash
cp backend/.env.example backend/.env
cp scraper/.env.example scraper/.env
docker compose up -d --build
```

Nginx serves the app on port `80` (`/` → frontend, `/api` → backend).
Database migrations run automatically on backend start.

### Run locally (without Docker)

```bash
cd backend  && npm install && npm run start:dev
cd scraper  && npm install && npm run start:dev
cd frontend && npm install && npm start
```

- App: http://localhost:4200
- Swagger: http://localhost:3000/api/docs
- Health: http://localhost:3000/api/health

### Database migrations

```bash
cd backend
npm run migration:generate -- src/database/migrations/MigrationName
npm run migration:run
```
