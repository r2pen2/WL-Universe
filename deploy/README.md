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

## Mail DNS (MX + SPF) after Cloudflare NS cutover

Moving a domain’s nameservers to Cloudflare does **not** copy registrar mail records. Without MX, addresses like `nancy@beyondthebelleducation.com` stop receiving mail even when site-mail sends successfully.

Canonical config: [`deploy/dns/mail-zones.json`](./dns/mail-zones.json)  
Idempotent apply: [`scripts/dns/ensure-mail-dns.mjs`](../scripts/dns/ensure-mail-dns.mjs)  
CI: Actions → **Ensure mail DNS (MX + SPF)** (`ensure-mail-dns.yml`, uses `CLOUDFLARE_API_TOKEN`)

```sh
# Dry-run
DRY_RUN=1 CLOUDFLARE_API_TOKEN=... node scripts/dns/ensure-mail-dns.mjs

# Apply
CLOUDFLARE_API_TOKEN=... node scripts/dns/ensure-mail-dns.mjs
```

Rules:

- MX records must stay **DNS-only** (grey cloud), never proxied.
- Pick the profile that matches the mailbox product (NetSol Cloud Mail vs Professional; GoDaddy Professional Email).
- When onboarding a new marketing apex onto Cloudflare NS, add it to `mail-zones.json` and re-run the ensure script **before** cutting over nameservers (or immediately after).
- `joed.dev` only needs Gmail SPF today (`forms@joed.dev` outbound via site-mail); it has no registrar hosted inbox MX in this config.

Verify: `dig +short MX <domain>` and `dig +short TXT <domain>`.

## Ephemeral QA

PR preview hosts use `pr-<n>.<app>.qa.joed.dev`. See [`deploy/qa/README.md`](./qa/README.md) and [`docs/ephemeral-qa-environments.md`](../docs/ephemeral-qa-environments.md).

## Site analytics (Umami)

Self-hosted Umami runs as infra (like Dozzle), not as a GHCR app image:

- Compose template: `deploy/compose/umami.yml`
- Runtime: `/opt/services/infra/umami/`
- Secrets: `/opt/services/data/app-env/umami.env`
- Docs: [`deploy/analytics/README.md`](analytics/README.md) and [`docs/site-analytics-umami.md`](../docs/site-analytics-umami.md)
- Public host: `analytics.joed.dev`
