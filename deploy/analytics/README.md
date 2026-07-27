# Site analytics (Umami)

Self-hosted Umami at **https://analytics.joed.dev** (glados infra, peer of Dozzle).

Plan: [`docs/site-analytics-umami.md`](../../docs/site-analytics-umami.md)

## Layout

| Path | Role |
|------|------|
| `deploy/compose/umami.yml` | Committed compose template |
| `/opt/services/infra/umami/` | Runtime copy on glados |
| `/opt/services/data/app-env/umami.env` | Secrets (`POSTGRES_PASSWORD`, `APP_SECRET`, admin password) |
| `/opt/services/data/app-assets/umami/db` | Postgres data |
| `deploy/analytics/websites.json` | Non-secret website UUID registry |

## Bring-up

```sh
sudo mkdir -p /opt/services/infra/umami /opt/services/data/app-assets/umami/db
sudo cp deploy/compose/umami.yml /opt/services/infra/umami/compose.yml
# create /opt/services/data/app-env/umami.env from umami.env.example
cd /opt/services/infra/umami
sudo docker compose --env-file /opt/services/data/app-env/umami.env -f compose.yml up -d
```

## Cloudflare

```sh
CLOUDFLARE_API_TOKEN=... node scripts/analytics/ensure-analytics-hostname.mjs
```

Dashboard fallback: Zero Trust → Tunnels → glados → Public Hostname `analytics.joed.dev` → `http://traefik:80`.

## Provision websites

After Umami is reachable and admin password is set:

```sh
node scripts/analytics/provision-websites.mjs
```

Writes `deploy/analytics/websites.json`. Commit that file — UUIDs are not secrets.

### Adding a new site

1. Add the app-slug to `scripts/analytics/provision-websites.mjs` `SITES`.
2. Re-run the provision script; commit the updated registry.
3. Wire `new AnalyticsManager({ websiteId })` in the SPA `App.jsx` (+ `logPageView` on routes).
4. Optional server shell hits: set `UMAMI_SERVER_TRACKING=1` and `UMAMI_WEBSITE_ID=...` in the app's `/opt/services/data/app-env/<app>.env`.

## Client config

```js
import { AnalyticsManager } from "./libraries/Web-Legos/api/analytics.ts";

const analyticsManager = new AnalyticsManager({
  url: "https://analytics.joed.dev",
  websiteId: "<uuid from websites.json>",
});
analyticsManager.initialize();
```

Optional CRA env: `REACT_APP_UMAMI_URL`, `REACT_APP_UMAMI_WEBSITE_ID` (baked at image build).

**QA:** `*.qa.joed.dev` does not send beacons by default (client + server).

## Server shell hits (optional)

`packages/server-legos/siteUmami.js` — fire-and-forget on SPA document GETs when `UMAMI_SERVER_TRACKING=1`. Off by default.
