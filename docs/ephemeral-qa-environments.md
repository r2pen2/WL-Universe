# Ephemeral QA Environments — Agent Handoff Plan

> **Goal:** On every PR, deploy affected WL-Universe apps to short-lived QA hosts on glados (via Cloudflare → Traefik), comment the URLs on the PR, tear them down when the PR merges/closes, and list active feature deployments on the status dashboard with links.

## Hard requirements (from product owner)

1. **Programmatic Cloudflare** setup for QA hostnames (not one-off manual dashboard clicks per PR).
2. Example shape: friendly QA URLs under `joed.dev` (e.g. conceptually `qa.beyondthebell.joed.dev`).
3. **On PR push:** build + deploy ephemeral stack; **print/comment deployment URL(s)**.
4. **On PR merge/close:** tear down that temporary deployment.
5. **Status page:** list live feature deployments with links (see naming note below).

## Current platform facts (glados)

| Piece | Today |
|-------|--------|
| Ingress | `cloudflared` token tunnel (**remotely managed**, no local `config.yml`) → Traefik `:80` on `proxy` network |
| Prod routing | Compose Traefik `Host(...)` labels in `deploy/compose/<app>.yml` |
| CI | GitHub-hosted **publish** to GHCR (`:latest` + `:<sha>`); self-hosted **deploy** on `main` only |
| CF API on host | **None** — only `TUNNEL_TOKEN` in `/opt/services/data/app-env/cloudflared.env` |
| `status.joed.dev` | **Dozzle** (container logs) |
| `REMOVED(wl-status)` | Site DNS/liveness dashboard (`/opt/services/apps/wl-status`) |

**Status page note:** Feature-deployment listing is **`active.json` + sticky PR comments**. Do **not** revive wl-status. Do not overload Dozzle at `status.joed.dev`.

## Recommended hostname scheme

Support **concurrent PRs** (true ephemeral), while staying close to the owner’s example:

```text
pr-<PR_NUMBER>.<app-slug>.qa.joed.dev
```

Examples:

- `pr-42.beyond-the-bell.qa.joed.dev`
- `pr-42.a-new-day-coaching.qa.joed.dev`
- `pr-42.site-mail.qa.joed.dev` (only if that app changed)

**One-time Cloudflare (programmatic):**

1. DNS: `*.qa.joed.dev` CNAME/pointed per tunnel docs for `joed.dev`.
2. Tunnel public hostname / ingress: `*.qa.joed.dev` → `http://traefik:80`.

After the wildcard exists, **each PR only changes Traefik labels** (no per-PR CF API calls). Still “programmatic CF” for the bootstrap (API token in GitHub secrets / agent-run once).

**Optional later:** vanity alias `qa.<short>.joed.dev` → “latest open PR for that app” (single slot). Do **not** use a single shared `qa.*` host as the only mechanism if concurrent PRs matter.

`app-slug` = compose / matrix app name (`beyond-the-bell`, not the marketing domain).

## Architecture

```text
PR opened / synchronized
  ├─ detect changed apps (paths under packages/<app>, deploy/compose/<app>.yml, shared web-legos/server-legos → rebuild dependents)
  ├─ GitHub-hosted: docker build/push ghcr.io/r2pen2/wl-universe-<app>:pr-<n> (+ sha)
  ├─ self-hosted glados:
  │     compose project `qa-pr-<n>-<app>`
  │     unique container_name
  │     Traefik Host(`pr-<n>.<app>.qa.joed.dev`)
  │     IMAGE_TAG=pr-<n>
  │     watchtower.enable=false
  │     isolated env/volumes (see Safety)
  └─ PR comment: markdown table of app → https://pr-<n>.<app>.qa.joed.dev

PR closed / merged
  └─ self-hosted: docker compose down for `qa-pr-<n>-*`; prune dangling QA images optional

active.json + PR comments
  └─ registry of active QA envs at `/opt/services/data/app-assets/qa/active.json`; sticky PR comment with links (wl-status retired)
```

### Changed-app detection

- Direct: `packages/<app>/**`, `deploy/compose/<app>.yml`
- Shared libs: if `packages/web-legos/**` or `packages/server-legos/**` change → rebuild all SPA apps that sync those libs (conservative matrix), or a documented allowlist
- `site-mail` only when `packages/site-mail/**` / its compose/docker change

### Safety (non-negotiable)

- **No real mail / Stripe:** QA `SITE_MAIL_*` must point at a sink (`SITE_MAIL_DISABLE_SEND=1`) — never prod Gmail/GoDaddy.
- **CMS QA:** seed `qa-pr-<n>-*` Firestore collections from prod; set `CMS_COLLECTION_PREFIX`; mount prod images/static **:ro** and prod Firebase SA **:ro**. Cleanup deletes the prefixed collections on PR close.
- Non-CMS SPAs: placeholder SA + empty per-PR asset dirs under `/opt/services/data/app-assets/qa/pr-<n>/<app>/`.
- QA containers must not collide with prod `container_name`s (`beyond-the-bell`, etc.).

### PR comment format (required)

Bot/workflow comment (create-or-update sticky comment):

```markdown
## QA deployments
| App | URL |
|-----|-----|
| beyond-the-bell | https://pr-42.beyond-the-bell.qa.joed.dev |
```

Include `/liveness` link optional second column once probes exist on QA hosts.

## Feature deployment registry (wl-status retired)

Do **not** revive wl-status. Do **not** put feature listings on Dozzle at `status.joed.dev`.

Keep a file registry plus sticky PR comments:

- Data source: `/opt/services/data/app-assets/qa/active.json` written by deploy/cleanup jobs:

```json
{
  "updatedAt": "...",
  "deployments": [
    {
      "pr": 42,
      "app": "beyond-the-bell",
      "url": "https://pr-42.beyond-the-bell.qa.joed.dev",
      "sha": "abc1234",
      "updatedAt": "..."
    }
  ]
}
```

- Visibility: sticky PR comment (App → URL table) + `active.json` on glados.
- Helpers: `scripts/qa/update-active-json.mjs`, documented in `deploy/qa/README.md`.

## Cloudflare programmatic bootstrap

Requires a **Cloudflare API token** (GitHub Actions secret `CLOUDFLARE_API_TOKEN`) with permissions to manage the `joed.dev` zone DNS + Zero Trust tunnel config (or Account tunnel routes).

Script: `scripts/qa/ensure-qa-wildcard.mjs` (workflow: `qa-wildcard-bootstrap.yml`)

- Idempotent: ensure DNS record `*.qa.joed.dev` → tunnel
- Idempotent: ensure tunnel ingress/public hostname for `*.qa.joed.dev` → `http://traefik:80`
- Document exact API calls; prefer Cloudflare’s current Tunnel Config / Ingress APIs

If API surface for tunnel hostname is awkward, acceptable fallback: one documented dashboard wildcard + script verifies DNS only — but **prefer full API** per owner request.

## CI workflows (new)

| Workflow | Trigger | Runner | Action |
|----------|---------|--------|--------|
| `qa-preview.yml` | `pull_request` synchronize/open/reopen | ubuntu-latest → then glados | build/push `pr-<n>` tags; deploy compose; comment URLs; update `active.json` |
| `qa-preview-cleanup.yml` | `pull_request` closed | glados | compose down; update `active.json` |
| `qa-wildcard-bootstrap.yml` | `workflow_dispatch` | ubuntu-latest | ensure `*.qa.joed.dev` DNS + tunnel ingress |

Reuse Dockerfile(s) from `deploy/docker/*`. Do **not** run QA deploy on `push` to `main` (prod path stays `publish-app-images.yml`).

## Out of scope

- Replacing production Traefik hosts  
- Full prod data clones  
- Previewing every marketing apex (`beyondthebelleducation.com`) on Cloudflare — QA lives under `*.qa.joed.dev` only  
- Changing Dozzle’s `status.joed.dev` hostname in this project (unless owner reopens)  
- Reviving `wl-status`  

## Agent operating notes

- Work from a **stable clone** (e.g. `/home/joe/src/WL-Universe`), not `/opt/actions-runner/_work/...` while Actions jobs run (worktree gets reset).
- Branch: `feature/ephemeral-qa` off `main`.
- Never commit secrets; QA env files stay under `/opt/services/data/app-env/qa/`.
- Follow issue order below; close with `Closes #N` as appropriate.
- Final PR to `main` links all QA issues.

## Issue map

| # | Title |
|---|--------|
| [#25](https://github.com/r2pen2/WL-Universe/issues/25) | Cloudflare: programmatic `*.qa.joed.dev` → Traefik wildcard |
| [#26](https://github.com/r2pen2/WL-Universe/issues/26) | QA hostname + Traefik/compose conventions |
| [#27](https://github.com/r2pen2/WL-Universe/issues/27) | PR workflow: build/push GHCR `:pr-<n>` for changed apps |
| [#28](https://github.com/r2pen2/WL-Universe/issues/28) | Glados: spin up ephemeral compose (isolated env/volumes) |
| [#29](https://github.com/r2pen2/WL-Universe/issues/29) | PR comment with deployment URLs |
| [#30](https://github.com/r2pen2/WL-Universe/issues/30) | Cleanup on PR close/merge |
| [#31](https://github.com/r2pen2/WL-Universe/issues/31) | Feature deployments registry (`active.json` + PR comments; no wl-status) |
| [#32](https://github.com/r2pen2/WL-Universe/issues/32) | Safety docs: no prod SMTP/Firebase; verify end-to-end on a sample PR |

