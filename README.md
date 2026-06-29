# KŻ-Panel

Aggregates IT job offers from multiple Polish and global job boards into one place, deduplicates them per saved search, and lets you track which ones you applied to.

## Authors

| Author | Backend | Frontend |
| :---: | :---: | :---: |
| **Kamil Żegleń** ([kamyrdol32](https://github.com/kamyrdol32)) | 100% | 100% |

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Angular 20 (standalone, signals), NgRx (Store/Effects/Entity), RxJS, SCSS, ngx-translate, PWA |
| Backend | NestJS, TypeScript, PostgreSQL, TypeORM (migrations), JWT + Passport, Swagger, class-validator |
| Scraper | NestJS, Playwright (+ stealth), Strategy Pattern |
| Tooling | Docker, Docker Compose, Nginx, ESLint + Prettier, TypeScript strict |

## Highlights

- **Multiple sources, one inbox** — NoFluffJobs, JustJoinIT, Pracuj.pl, BulldogJob, LinkedIn, theProtocol and OLX, each behind its own scraping strategy.
- **Dedicated scraper microservice** — a stateless NestJS + Playwright worker. API-based boards use their JSON APIs; JS-rendered / Cloudflare-protected ones are driven through a stealth browser.
- **Per-account saved searches** — every scraper belongs to the user who created it; offers are deduplicated per scraper so two searches on different boards never clash.
- **Rich, normalized offers** — title, company, salary, work modes, contract types, seniority levels, tech stack, requirements and full description — mapped into one model regardless of source.
- **Per-user permissions** — admin can grant granular permissions (scraper run, scraper management, job view, recruitment management) per user; carried in JWT and enforced on both backend and frontend.
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

- **frontend** — Angular SPA served by Nginx, which also reverse-proxies `/api` and `/ws` to the backend.
- **backend** — owns auth, persistence, orchestration and offer normalization.
- **scraper** — one guarded endpoint (`POST /scrape`); given a source + query it runs the matching strategy and returns raw offers. No state, no database access.

## Installation

### Requirements

- Docker & Docker Compose
- External PostgreSQL (not included in the compose stack)

### Environment Variables

**`backend/.env`**

```bash
# --- App ---
NODE_ENV=production
TZ=Europe/Warsaw
BACKEND_PORT=5001

# --- Database ---
POSTGRES_HOST=
POSTGRES_PORT=5432
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
DB_SYNC=false

# --- Auth ---
JWT_ACCESS_SECRET=
JWT_ACCESS_TTL=900s
JWT_REFRESH_SECRET=
JWT_REFRESH_TTL=30d

# --- CORS ---
CORS_ORIGIN=https://panel.kamilzeglen.pl

# --- Internal services ---
SCRAPER_INTERNAL_URL=http://kzpanel-scraper:4001
INTERNAL_API_TOKEN=

```

**`scraper/.env`**

```bash
# --- App ---
NODE_ENV=production
TZ=Europe/Warsaw
SCRAPER_PORT=4001

# --- Scraper ---
SCRAPER_ENABLED=true
SCRAPER_INTERVAL_CRON=0 0 4 * * *
SCRAPER_LIMIT=20
SCRAPER_MOCK=false

# --- Internal services ---
BACKEND_INTERNAL_URL=http://kzpanel-backend:5001
INTERNAL_API_TOKEN=
```

### Run with Docker

```bash
cp backend/.env.example backend/.env
cp scraper/.env.example scraper/.env
# fill in the values, then:
docker compose up -d --build
```

Ports: frontend `3001`, backend `5001`, scraper `4001`.  
Database migrations run automatically on backend start.

### Run locally

```bash
cd backend  && npm install && npm run start:dev
cd scraper  && npm install && npm run start:dev
cd frontend && npm install && npm start
```

- App: http://localhost:4200
- Swagger: http://localhost:5001/api/docs
- Health: http://localhost:5001/api/health

### Database migrations

```bash
cd backend
npm run migration:generate -- src/database/migrations/MigrationName
npm run migration:run
```

## Demo

🔗 **Live:** [evpanel.kamilzeglen.pl](https://evpanel.kamilzeglen.pl)

## Screenshots

<!--
Add screenshots after first deploy.
Example:
### Job offers list
![Job offers list](https://i.imgur.com/example.png)
-->
