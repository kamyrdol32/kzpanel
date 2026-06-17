# ── EvPanel scraper (stateless NestJS worker) ─────────────────
# Build context = ./scraper (self-contained — shared types inlined under src/shared).
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

# System Chromium for Playwright (playwright-core uses this binary, no browser download).
RUN apk add --no-cache \
      chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV CHROMIUM_PATH=/usr/bin/chromium-browser
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

CMD ["node", "dist/main.js"]
