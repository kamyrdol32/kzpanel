# ── EvPanel backend (NestJS) ──────────────────────────────────
# Build context = repo root (needs ./shared and ./backend)
FROM node:20-alpine AS build
WORKDIR /app

# shared package first (backend depends on it via file:../shared)
COPY shared/package*.json ./shared/
RUN cd shared && npm install
COPY shared ./shared
RUN cd shared && npm run build

COPY backend/package*.json ./backend/
RUN cd backend && npm install
COPY backend ./backend
RUN cd backend && npm run build

# ── runtime ───────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/shared ./shared
COPY --from=build /app/backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev
COPY --from=build /app/backend/dist ./backend/dist

WORKDIR /app/backend
EXPOSE 3000
# Migrations are the single source of truth (DB_SYNC=false). Apply any pending
# migrations against the compiled data-source, then boot the API. `depends_on`
# with service_healthy guarantees the DB is up before this runs.
CMD ["sh", "-c", "node_modules/.bin/typeorm migration:run -d dist/database/data-source.js && node dist/main.js"]
