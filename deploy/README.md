# Deploy

This folder holds shared deployment building blocks.

- `docker/node-react-express.Dockerfile` builds apps that have an Express server at the package root and a React client in `client/`.
- `compose/*.yml` contains app-level compose templates. Host-specific paths should be passed with environment variables or left as defaults in the deploy host's service directory.

Future apps should reuse the shared Dockerfile when they follow the same shape as NicoleLevin.

## glados Deploys

GitHub Actions publishes images to GHCR, then deploys explicitly from a self-hosted runner on glados.

On push to `main`, `publish-app-images.yml` **detects which apps changed** (via `scripts/qa/detect-changed-apps.mjs --scope publish`) and only builds/deploys those. Shared `web-legos` / `server-legos` changes fan out to all SPA apps; a single site package change rebuilds only that site.

Manual full rebuild: Actions → Publish app images → Run workflow → `apps=all`.

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

## Ephemeral QA

PR preview hosts use `pr-<n>.<app>.qa.joed.dev`. See [`deploy/qa/README.md`](./qa/README.md) and [`docs/ephemeral-qa-environments.md`](../docs/ephemeral-qa-environments.md).
## Site analytics (Umami)

Self-hosted Umami runs as infra (like Dozzle), not as a GHCR app image:

- Compose template: `deploy/compose/umami.yml`
- Runtime: `/opt/services/infra/umami/`
- Secrets: `/opt/services/data/app-env/umami.env`
- Docs: [`deploy/analytics/README.md`](analytics/README.md) and [`docs/site-analytics-umami.md`](../docs/site-analytics-umami.md)
- Public host: `analytics.joed.dev`
