# ── KŻ-Panel frontend + edge Nginx (single container) ─────────
# Build context = ./frontend (self-contained — shared types inlined under src/shared).
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:prod

# ── runtime: Nginx serves the SPA AND proxies /api → backend ──
FROM nginx:alpine AS runtime
RUN apk add --no-cache bash curl

# Self-contained config (SPA + reverse proxy)
COPY nginx.conf /etc/nginx/nginx.conf

# Built Angular app
COPY --from=build /app/dist/kzpanel/browser /usr/share/nginx/html

EXPOSE 3001
CMD ["nginx", "-g", "daemon off;"]
