# Deploy

This folder holds shared deployment building blocks.

- `docker/node-react-express.Dockerfile` builds apps that have an Express server at the package root and a React client in `client/`.
- `compose/*.yml` contains app-level compose templates. Host-specific paths should be passed with environment variables or left as defaults in the deploy host's service directory.

Future apps should reuse the shared Dockerfile when they follow the same shape as NicoleLevin.

## glados Deploys

GitHub Actions publishes images to GHCR, then deploys explicitly from a self-hosted runner on glados.

The self-hosted runner must have the labels:

- `self-hosted`
- `glados`

This avoids opening inbound SSH to the home network. The runner keeps an outbound connection to GitHub, checks out this repository, copies `deploy/compose/<app>.yml` into `/opt/services/apps/<app>/compose.yml`, then runs:

```sh
sudo docker compose -f /opt/services/apps/<app>/compose.yml pull
sudo docker compose -f /opt/services/apps/<app>/compose.yml up -d
```

Runtime data stays outside the repository under `/opt/services/data`:

- Env and service account files: `/opt/services/data/app-env`
- App-uploaded/static assets: `/opt/services/data/app-assets`

Cloudflare Tunnel public hostnames still need to point each external hostname at Traefik on glados.

## Site analytics (Umami)

Self-hosted Umami runs as infra (like Dozzle), not as a GHCR app image:

- Compose template: `deploy/compose/umami.yml`
- Runtime: `/opt/services/infra/umami/`
- Secrets: `/opt/services/data/app-env/umami.env`
- Docs: [`deploy/analytics/README.md`](analytics/README.md) and [`docs/site-analytics-umami.md`](../docs/site-analytics-umami.md)
- Public host: `analytics.joed.dev`
