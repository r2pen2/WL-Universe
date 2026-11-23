# Ephemeral QA previews

Short-lived preview hosts for pull requests, on whichever host is active. Authoritative plan: [`docs/ephemeral-qa-environments.md`](../../docs/ephemeral-qa-environments.md).

**The deploy code lives in r2pen2/devops** (`reusable-qa-preview.yml`, `reusable-qa-cleanup.yml`, `ci/scripts/qa/*`), shared with the other repos that preview. This repo only describes its apps in [`deploy/apps.json`](../apps.json): ports, Dockerfiles, which paths rebuild which app, companions (a static site's preview also runs `wl-cms`, `wl-auth`, `wl-forms` and `site-mail`), extra QA volumes and env, and the Firestore seed script. Field reference: devops `ci/scripts/lib/catalog.mjs`. [`scripts/qa/apps.mjs`](../../scripts/qa/apps.mjs) reads the same file for this repo's own scripts.

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

Generator (in a devops checkout):

```sh
node ci/scripts/qa/generate-compose.mjs --catalog <WL-Universe>/deploy/apps.json --pr 42 --app beyond-the-bell
```

Example output: [`examples/pr-42-beyond-the-bell.compose.yml`](./examples/pr-42-beyond-the-bell.compose.yml). Prod routers stay `beyond-the-bell`; QA uses `qa-pr-42-beyond-the-bell` — no label collision.

## Feature listing (no wl-status)

**Do not revive wl-status.** **Do not** put this on Dozzle at `status.joed.dev`.

Active deployments are:

1. Registry file `/opt/services/data/app-assets/qa/active.json` (updated by deploy/cleanup jobs)
2. Sticky PR comments from `qa-preview.yml`

Schema example: [`active.json.example`](./active.json.example).

## CMS content (Firestore)

Marketing SPAs with `cms: true` in [`deploy/apps.json`](../apps.json) (`qaSeed` runs the script in the `wl-cms` image):

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
# Token via env or GitHub secret CLOUDFLARE_API_TOKEN — never commit. Script is in r2pen2/devops.
CLOUDFLARE_API_TOKEN=... node ci/scripts/qa/ensure-qa-wildcard.mjs
```

Required token permissions:

- **Zone → DNS → Edit** on `joed.dev`
- **Account → Cloudflare Tunnel → Edit** (or Cloudflare One Connector: cloudflared Write)

Idempotent: safe to re-run. Creates/updates `*.joed.dev` (and legacy `*.qa.joed.dev`) DNS CNAMEs to the glados tunnel and matching tunnel ingress → `http://traefik:80`.

Workflow: `.github/workflows/qa-wildcard-bootstrap.yml` (`workflow_dispatch`).

## CI

| Workflow | Trigger | Action |
|----------|---------|--------|
| `qa-preview.yml` | PR open/sync/reopen | devops `reusable-qa-preview`: detect apps → build/push `:pr-<n>` → deploy → sticky comment → `active.json`; then this repo's feature liveness and Lighthouse checks |
| `qa-preview-cleanup.yml` | PR closed | devops `reusable-qa-cleanup`: compose down, delete cloned data, sweep closed PRs' leftovers |
| `qa-wildcard-bootstrap.yml` | manual | devops `reusable-qa-wildcard` |

Changed-app detection: each app's `watchPaths` in `deploy/apps.json` (prefixes, `re:` regexes, `!` exclusions) plus top-level `sharedPaths`:

- Direct package/compose/DNS paths
- `web-legos` / `scripts/vite` / `server-legos` → all SPA apps (`server-legos` CMS modules → CMS sites only)
- Each Dockerfile → the apps built with it; any other `deploy/docker/` file or the root lockfile → all apps

## Local helpers (in a devops checkout)

```sh
node ci/scripts/detect-changed-apps.mjs --catalog <WL-Universe>/deploy/apps.json --base origin/main --head HEAD --scope qa --json
node ci/scripts/qa/update-active-json.mjs list   # on the host
```
