# Component catalog (tools/storybook) for https://storybook.joed.dev and pr-<n>-storybook.joed.dev
# Build context: monorepo root. The catalog renders web-legos and every site's client source, so it
# needs the workspace dependencies (root npm ci) plus its own (tools/storybook).

FROM node:22-bookworm AS build
WORKDIR /app
COPY . .
# The root lockfile isn't kept in sync with every workspace (sites build from their own client
# lockfiles), so resolve the workspaces' dependencies with install, like docs-static does.
# Only what the catalog renders: web-legos and the sites' clients (not the CRM / admin portal).
RUN npm install --no-audit --no-fund --ignore-scripts --package-lock=false --legacy-peer-deps       -w packages/web-legos       -w packages/a-new-day-coaching/client       -w packages/beyond-the-bell/client       -w packages/boston-mixtape/client       -w packages/joe-dobbelaar/client       -w packages/nicole-levin/client       -w packages/room01890/client       -w packages/talk-about-dreams/client       -w packages/you-can-do-it-gardening/client
RUN npm ci --prefix tools/storybook --no-audit --no-fund
RUN npm run build --prefix tools/storybook

FROM nginx:1.27-alpine
COPY deploy/docker/storybook-nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/docker/storybook-config.sh /docker-entrypoint.d/40-wl-config.sh
RUN chmod +x /docker-entrypoint.d/40-wl-config.sh
COPY --from=build /app/tools/storybook/storybook-static /usr/share/nginx/html
EXPOSE 8080
