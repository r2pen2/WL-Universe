# Ephemeral QA on glados

Short-lived preview hosts for pull requests. Authoritative plan: [`docs/ephemeral-qa-environments.md`](../../docs/ephemeral-qa-environments.md).

## Hostname scheme

```text
pr-<PR_NUMBER>-<app-slug>.joed.dev
```

- `app-slug` = compose / CI matrix name (`beyond-the-bell`, `site-mail`, …), **not** the marketing domain.
- Example: `https://pr-42-beyond-the-bell.joed.dev`
- First-level `joed.dev` label so Cloudflare Universal SSL (`*.joed.dev`) and the `*.joed.dev` DNS/tunnel wildcard match.

After one-time Cloudflare wildcard bootstrap (`*.joed.dev` → Traefik), **per-PR routing is Traefik labels only** — no new Cloudflare hostnames.

## Compose conventions

| Concern | Prod | QA |
|--------|------|-----|
| Compose project | `/opt/services/apps/<app>` | `qa-pr-<n>-<app>` under `/opt/services/data/app-assets/qa/compose/` |
| `container_name` | `<app>` | `qa-pr-<n>-<app>` |
| Traefik router | `<app>` | `qa-pr-<n>-<app>` |
| Host rule | marketing / `*.joed.dev` | `Host(\`pr-<n>-<app>.joed.dev\`)` |
| Image tag | `latest` / sha | `pr-<n>` |
| Watchtower | enabled | `watchtower.enable=false` |
| Env | `/opt/services/data/app-env/<app>.env` | `/opt/services/data/app-env/qa/<app>.env` + `CMS_COLLECTION_PREFIX=qa-pr-<n>-` for CMS apps |
| Assets | `/opt/services/data/app-assets/<app>/` | CMS apps: prod `images`/`static` **:ro**; others: `/opt/services/data/app-assets/qa/pr-<n>/<app>/` |
| Firestore CMS | `siteText` / `siteImages` / … | Seeded copy at `qa-pr-<n>-siteText` etc.; deleted on PR close |

Generator:

```sh
node scripts/qa/generate-compose.mjs --pr 42 --app beyond-the-bell
```

Example output: [`examples/pr-42-beyond-the-bell.compose.yml`](./examples/pr-42-beyond-the-bell.compose.yml). Prod routers stay `beyond-the-bell`; QA uses `qa-pr-42-beyond-the-bell` — no label collision.

## Feature listing (no wl-status)

**Do not revive wl-status.** **Do not** put this on Dozzle at `status.joed.dev`.

Active deployments are:

1. Registry file `/opt/services/data/app-assets/qa/active.json` (updated by deploy/cleanup jobs)
2. Sticky PR comments from `qa-preview.yml`

Schema example: [`active.json.example`](./active.json.example).

## CMS content (Firestore)

Marketing SPAs with `cms: true` in [`scripts/qa/apps.mjs`](../../scripts/qa/apps.mjs):

1. **Deploy** copies prod root collections (except `users` / `siteForms`) into `qa-pr-<n>-*` via [`scripts/qa/firestore-qa.mjs`](../../scripts/qa/firestore-qa.mjs).
2. App gets `CMS_COLLECTION_PREFIX=qa-pr-<n>-` so Server-Legos reads/writes only those collections.
3. Prod `images` / `static` mount **read-only**; prod service account mounts **read-only** (needed to read/write the QA-prefixed collections in the same Firebase project).
4. **Cleanup** (PR close) deletes `qa-pr-<n>-*` collections.

Auth/permissions stay on the shared `users` collection. SMTP/Stripe stay QA-stubbed.

## Safety (non-negotiable)

- Never point QA SMTP/Stripe at prod. `site-mail` QA sets `SITE_MAIL_DISABLE_SEND=1`.
- QA env stubs: `deploy/qa/env/*.env.example` → seeded once to `/opt/services/data/app-env/qa/<app>.env`.
- Non-CMS SPAs still use placeholder Firebase SA under the PR asset dir (`deploy/qa/firebase-placeholder.json`).
- CMS QA may use the prod Firebase **service account read-only**, but only talks to `qa-pr-*` collections when prefix is set.
- To add real QA-only secrets: edit the host file under `/opt/services/data/app-env/qa/` (outside git).

## Cloudflare bootstrap (one-time)

```sh
# Token via env or GitHub secret CLOUDFLARE_API_TOKEN — never commit
CLOUDFLARE_API_TOKEN=... node scripts/qa/ensure-qa-wildcard.mjs
```

Required token permissions:

- **Zone → DNS → Edit** on `joed.dev`
- **Account → Cloudflare Tunnel → Edit** (or Cloudflare One Connector: cloudflared Write)

Idempotent: safe to re-run. Creates/updates `*.joed.dev` (and legacy `*.qa.joed.dev`) DNS CNAMEs to the glados tunnel and matching tunnel ingress → `http://traefik:80`.

Workflow: `.github/workflows/qa-wildcard-bootstrap.yml` (`workflow_dispatch`).

## CI

| Workflow | Trigger | Action |
|----------|---------|--------|
| `qa-preview.yml` | PR open/sync/reopen | detect apps → build/push `:pr-<n>` → glados deploy → sticky comment → update `active.json` |
| `qa-preview-cleanup.yml` | PR closed | compose down → remove `active.json` entries |
| `qa-wildcard-bootstrap.yml` | manual | run Cloudflare wildcard script |

Changed-app detection: `scripts/qa/detect-changed-apps.mjs`

- Direct package/compose paths
- `web-legos` / `server-legos` → all SPA apps
- Shared Dockerfiles / root lockfile → all apps

## Local helpers

```sh
node scripts/qa/detect-changed-apps.mjs --base origin/main --head HEAD --json
node scripts/qa/deploy-pr.mjs --pr 42 --apps beyond-the-bell --sha "$(git rev-parse --short HEAD)"
node scripts/qa/cleanup-pr.mjs --pr 42
node scripts/qa/update-active-json.mjs list
```
