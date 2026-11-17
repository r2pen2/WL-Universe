# Component catalog (tools/storybook) for https://storybook.joed.dev and pr-<n>-storybook.joed.dev
# Build context: monorepo root. The catalog renders web-legos and every site's client source, so it
# needs the workspace dependencies (root npm ci) plus its own (tools/storybook).

FROM node:22-bookworm AS build
WORKDIR /app
COPY . .
RUN npm ci --no-audit --no-fund --ignore-scripts
RUN npm ci --prefix tools/storybook --no-audit --no-fund
RUN npm run build --prefix tools/storybook

FROM nginx:1.27-alpine
COPY deploy/docker/storybook-nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/tools/storybook/storybook-static /usr/share/nginx/html
EXPOSE 8080
