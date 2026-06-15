# EvPanel 2.0

Prywatna aplikacja operacyjna: centrum zarządzania projektami, monitoringu usług,
procesem rekrutacyjnym, agregator ofert pracy oraz dashboard administracyjny własnych aplikacji.

> **To nie jest portfolio.** To produkcyjny system klasy SaaS premium, projektowany pod
> wieloletni rozwój o kolejne moduły.

## Stack

| Warstwa  | Technologie |
|----------|-------------|
| Frontend | Angular 20 (standalone, signals), RxJS, NgRx (Store/Effects/Entity), Angular Material, SCSS, ngx-translate, PWA |
| Backend  | NestJS, TypeScript, PostgreSQL, TypeORM, JWT + Passport, Swagger, class-validator/transformer |
| Scraper  | NestJS worker, @nestjs/schedule, Strategy Pattern |
| DevOps   | Docker, Docker Compose, Nginx (reverse proxy), GitHub Actions CI/CD, healthchecks |

## Struktura repo

```
frontend/   Angular 20 SPA (serwowany przez Nginx w produkcji)
backend/    NestJS API (JWT, Swagger, TypeORM)
scraper/    NestJS worker (harmonogram + strategie portali)
shared/     współdzielone enumy i kontrakty DTO (jedno źródło prawdy)
infra/      nginx, dockerfiles, postgres init
.github/    workflowy CI/CD
```

Pełna architektura: zobacz `docs/ARCHITECTURE.md` (jeśli wygenerowany) lub plan projektu.

## Szybki start (dev)

```bash
cp .env.example .env          # uzupełnij sekrety
docker compose -f docker-compose.dev.yml --env-file .env up
```

- Frontend: http://localhost:4200
- Backend API: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs
- Health: http://localhost:3000/api/health

## Uruchomienie lokalne bez Dockera

Każdy pakiet niezależnie:

```bash
# shared (zbuduj raz, konsumowane przez resztę)
cd shared && npm i && npm run build

cd ../backend && npm i && npm run start:dev
cd ../scraper && npm i && npm run start:dev
cd ../frontend && npm i && npm start
```

## Produkcja

```bash
docker compose --env-file .env up -d --build
```

Aplikacja dostępna przez Nginx na porcie `80` (`/` → frontend, `/api` → backend).

## Migracje (backend)

```bash
cd backend
npm run migration:generate -- src/database/migrations/NazwaMigracji
npm run migration:run
```

## Konwencje

- TypeScript `strict`, ESLint + Prettier (config w roocie).
- Frontend: standalone components, `OnPush`, **Facade-only** (komponenty nie dotykają Store).
- Backend: moduły domenowe, DTO + walidacja, cienkie serwisy.
- Commity: Conventional Commits.
