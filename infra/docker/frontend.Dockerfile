# ── EvPanel frontend + edge Nginx (single container) ──────────
# Build context = repo root (needs ./shared and ./frontend)
FROM node:20-alpine AS build
WORKDIR /app

COPY shared/package*.json ./shared/
RUN cd shared && npm install
COPY shared ./shared
RUN cd shared && npm run build

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend ./frontend
RUN cd frontend && npm run build:prod

# ── runtime: Nginx serves the SPA AND proxies /api → backend ──
FROM nginx:alpine AS runtime
RUN apk add --no-cache bash curl

# Self-contained config (SPA + reverse proxy)
COPY infra/nginx/nginx.conf /etc/nginx/nginx.conf

# Built Angular app
COPY --from=build /app/frontend/dist/evpanel/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
