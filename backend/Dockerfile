# ── KŻ-Panel backend (NestJS) ──────────────────────────────────
# Build context = ./backend (self-contained — shared types are inlined under src/shared).
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ── runtime ───────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

EXPOSE 5001
# Migrations are the single source of truth (DB_SYNC=false): apply any pending
# migrations against the compiled data-source, then boot the API.
CMD ["sh", "-c", "node_modules/.bin/typeorm migration:run -d dist/database/data-source.js && node dist/main.js"]
