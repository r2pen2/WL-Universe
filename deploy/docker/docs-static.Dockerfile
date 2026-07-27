# Static docs site for https://wl-universe.joed.dev
# Build context: monorepo root

FROM node:20-bookworm AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/docs/package.json packages/docs/
# Generator walks web-legos, server-legos, and site components
COPY packages packages
COPY scripts scripts

RUN npm install --workspace=@wl-universe/docs
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w @wl-universe/docs

FROM nginx:1.27-alpine
COPY deploy/docker/docs-nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/docs/out /usr/share/nginx/html
EXPOSE 8080
