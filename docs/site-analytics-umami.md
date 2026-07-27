# Site Analytics (Umami) — Agent Handoff Plan

> **Goal:** Self-host **Umami** at `analytics.joed.dev` for all WL-Universe sites: page views, unique visitors, referrers — owned dashboard on glados. Retarget existing `web-legos` `AnalyticsManager` away from Firebase Analytics. Optional Express middleware for document/shell hits.

## Hard requirements (from product owner)

1. **Server-owned analytics** (not Google GA4 as system of record).
2. Dashboard at **`analytics.joed.dev`** (status-page style ops surface — pageviews / uniques / etc.).
3. Cover **all** marketing/admin SPA sites in the monorepo.
4. Prefer a **Docker container** on glados (same pattern as Dozzle / site-mail ingress), not a greenfield custom microservice.
5. Reuse the monorepo where it helps (`AnalyticsManager`); do **not** reinvent unique-visitor math.

## Current platform facts

| Piece | Today |
|-------|--------|
| Client analytics | `packages/web-legos/api/analytics.ts` → **Firebase Analytics** (`getAnalytics` / `logEvent`) |
| Wired sites | `you-can-do-it-gardening`, `nicole-levin`, `boston-mixtape`, `talk-about-dreams` (partial / buggy Provider path) |
| Commented / unused | `joe-dobbelaar` (Provider commented out) |
| Unwired | `beyond-the-bell`, `a-new-day-coaching`, `a-new-day-coaching-crm`, `wl-admin-portal` |
| Firebase role elsewhere | Admin SDK + Firestore for CMS — **keep**; unrelated to analytics product |
| Ingress | cloudflared (remotely managed) → Traefik `:80` on `proxy` |
| Infra peers | `/opt/services/infra/{traefik,cloudflared,dozzle,coredns}` |
| Secrets | `/opt/services/data/app-env/` (never commit) |

## SPA caveat (non-negotiable)

These apps are React SPAs. Express mostly sees:

- one document GET for `/`
- assets + API calls

**Per-route** page views (`/gallery`, `/faq`) require a **client beacon** to Umami (retarget `AnalyticsManager.logPageView`). Pure server-side alone cannot replace SPA route analytics.

Server middleware is a **complement** (shell hits, bots, uptime-ish traffic), not a substitute.

## Recommended stack

```text
SPA (AnalyticsManager) ──POST /api/send──► umami:3000 ──► postgres
Express (optional middleware) ─────────────►     ▲
                                                 │
                                    analytics.joed.dev (Traefik)
```

| Layer | Choice |
|-------|--------|
| Product | **Umami** official image (`ghcr.io/umami-software/umami` or current documented image) |
| DB | **Postgres** (dedicated compose service); data under `/opt/services/data/...` |
| Host | `analytics.joed.dev` |
| App IDs | One Umami “website” per app-slug (`beyond-the-bell`, …) |
| Client | Retarget `AnalyticsManager` → Umami tracker (website UUID + script or fetch API) |
| Server (optional) | Thin Express middleware → Umami collect API on HTML document responses |
| Auth | Umami login (strong admin password); optionally Cloudflare Access later |

**Out of scope:** custom `packages/site-analytics` product, Firebase Analytics as SoR, Plausible/Goat unless Umami blocked, putting this on Dozzle/`status.joed.dev`.

## Architecture details

### Deploy layout (infra-style, not app matrix)

Prefer infra peer of Dozzle (not GHCR publish of our code):

```text
deploy/compose/umami.yml          # committed template
/opt/services/infra/umami/        # runtime copy on glados
/opt/services/data/app-env/umami.env
/opt/services/data/app-assets/umami/  # or named docker volume for postgres
```

Compose services:

- `umami-db` (postgres)
- `umami` (app) on `proxy` network
- Traefik labels: `Host(\`analytics.joed.dev\`)`

Do **not** add Umami to `publish-app-images.yml` matrix (upstream image).

### Cloudflare

One-time public hostname / DNS for `analytics.joed.dev` → same tunnel → Traefik (same as `site-mail.joed.dev`). Prefer programmatic via existing `CLOUDFLARE_API_TOKEN` + small script or documented dashboard step. No wildcard needed.

### Website registry

After Umami admin creates websites, store mapping outside git secrets if needed:

```json
// e.g. deploy/analytics/websites.json (UUIDs are not secrets; OK to commit)
{
  "beyond-the-bell": { "websiteId": "...", "domain": "beyondthebelleducation.com" },
  "joe-dobbelaar": { "websiteId": "...", "domain": "joed.dev" }
}
```

Per-app client env (examples only in git):

```text
REACT_APP_UMAMI_URL=https://analytics.joed.dev
REACT_APP_UMAMI_WEBSITE_ID=...
```

### AnalyticsManager migration

Replace Firebase Analytics usage in `packages/web-legos/api/analytics.ts`:

- Construct with `{ url, websiteId }` (not FirebaseOptions)
- `logPageView(pageId)` → Umami `pageview` (use official tracker or `/api/send`)
- Keep `Context` API so existing route calls keep working
- Remove `@firebase/analytics` dependency from the analytics path (Firestore clients stay)

Sync into each site’s `libraries/Web-Legos` via existing sync scripts / image build.

### Site rollout

| App | Action |
|-----|--------|
| YCDIG, nicole-levin, boston-mixtape | Swap config to Umami; keep `logPageView` calls |
| talk-about-dreams | Fix broken `AnalyticsManager.Provider.Context` → `AnalyticsManager.Context`; Umami config |
| joe-dobbelaar | Uncomment / wire Provider |
| beyond-the-bell, ANDC, ANDC-CRM, wl-admin-portal | Initialize manager + home (and key routes) `logPageView` |
| site-mail | Skip (API service) |
| docs | Optional later |

### Optional Express middleware

Shared helper (e.g. `packages/server-legos` or tiny inline):

- On successful HTML / SPA shell responses, fire-and-forget Umami pageview with path `/` (or request URL)
- Must not block responses; must not send prod secrets
- Disable in QA unless pointing at a QA Umami (default: prod host only when `UMAMI_SERVER_TRACKING=1`)

### Privacy / safety

- No PII in custom events by default
- Do not log auth tokens, form bodies, Firebase keys
- QA hosts: prefer no tracking or separate Umami website “qa” (document choice; default **off** on `*.qa.joed.dev`)
- Dashboard password only in `/opt/services/data/app-env/umami.env`

## CI / deploy notes

- Infra compose: copy + `docker compose up -d` on glados (manual or small workflow_dispatch) — same spirit as other `/opt/services/infra/*`
- App changes: normal `publish-app-images.yml` after `AnalyticsManager` + site wiring lands on `main`
- Liveness: optional probe `https://analytics.joed.dev/login` or Umami health if exposed — add to `deploy/liveness/sites.json` only if stable

## Agent operating notes

- Work from a **stable clone**: `/home/joe/src/WL-Universe` (not Actions `_work` while jobs run).
- Branch: `feature/analytics-umami` off latest `main`.
- Never commit secrets; Umami DB password / app secret in `umami.env` only.
- Follow issue order; close with `Closes #N` as appropriate.
- Final PR to `main` links all `[analytics n/N]` issues.
- Do **not** revive wl-status; do **not** put analytics on `status.joed.dev` (Dozzle).

## Issue map

| # | Title |
|---|--------|
| [#39](https://github.com/r2pen2/WL-Universe/issues/39) | Umami + Postgres compose on glados |
| [#40](https://github.com/r2pen2/WL-Universe/issues/40) | Cloudflare / Traefik: `analytics.joed.dev` |
| [#41](https://github.com/r2pen2/WL-Universe/issues/41) | Provision Umami websites per app + ID registry |
| [#42](https://github.com/r2pen2/WL-Universe/issues/42) | Retarget `web-legos` `AnalyticsManager` to Umami |
| [#43](https://github.com/r2pen2/WL-Universe/issues/43) | Wire all SPA sites (migrate off Firebase Analytics) |
| [#44](https://github.com/r2pen2/WL-Universe/issues/44) | Optional Express shell-hit middleware |
| [#45](https://github.com/r2pen2/WL-Universe/issues/45) | Dashboard auth + e2e verify + PR to main |

## Acceptance (program-level)

- [ ] `https://analytics.joed.dev` loads Umami UI (auth required)
- [ ] Each production site appears as a website with live pageviews after browsing
- [ ] No Firebase Analytics dependency in `AnalyticsManager`
- [ ] Prod Firebase/Firestore CMS unchanged
- [ ] Secrets not in git
- [ ] Implementation PR links all analytics issues
