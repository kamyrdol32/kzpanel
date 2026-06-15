# ── EvPanel scraper (NestJS worker) ───────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY shared/package*.json ./shared/
RUN cd shared && npm install
COPY shared ./shared
RUN cd shared && npm run build

COPY scraper/package*.json ./scraper/
RUN cd scraper && npm install
COPY scraper ./scraper
RUN cd scraper && npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# System Chromium for Playwright (playwright-core uses this binary, no browser download).
RUN apk add --no-cache \
      chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV CHROMIUM_PATH=/usr/bin/chromium-browser
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY --from=build /app/shared ./shared
COPY --from=build /app/scraper/package*.json ./scraper/
RUN cd scraper && npm install --omit=dev
COPY --from=build /app/scraper/dist ./scraper/dist

WORKDIR /app/scraper
CMD ["node", "dist/main.js"]
