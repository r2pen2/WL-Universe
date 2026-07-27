# Site-Mail Microservice — Cutover Plan

> **Agent handoff:** Extract all WL-Universe mail into a standalone microservice, deploy on glados, and remove per-app mail routes. Clean cutover — no dual-running period required if cutover is coordinated in one release.

## Agent operating rules (mandatory)

1. **Workspace:** `/opt/actions-runner/_work/WL-Universe/WL-Universe` (repo: https://github.com/r2pen2/WL-Universe).
2. **Default branch:** `main`. Never commit directly to `main`.
3. **Branch first:** Before any code changes, create and check out a new branch, e.g. `feature/site-mail-microservice`.
4. **Issues first:** Before implementing, create GitHub issues (via `gh issue create`) for every task below, **in order**, with sequential titles like `[site-mail 1/N] …`. Link them in a tracking comment or milestone if useful.
5. **Work the queue:** Autonomously implement each issue in order. After finishing an issue: commit on the feature branch, close the issue with a comment referencing the commit (`Closes #N` in commit message when appropriate), then move to the next.
6. **PR at the end:** When all issues are done, push the branch and open a PR to `main` with `gh pr create`, linking all issues in the PR body.
7. **Hostname:** Public Traefik host is **`site-mail.joed.dev`** (not `mail.joed.dev`). User adds the Cloudflare tunnel route themselves.
8. **Do not push secrets** into the repo. Runtime secrets live under `/opt/services/data/app-env/`.

### Suggested issue list (create these in order)

Use `gh issue create --title "..." --body "..."` for each:

| # | Title | Scope |
|---|-------|--------|
| 1 | `[site-mail 1/8] Scaffold packages/site-mail Express service` | Package, `/health`, `/v1/send` stub, site profile loader, API key auth, rate limit, proper JSON responses |
| 2 | `[site-mail 2/8] Dockerfile + CI matrix + deploy compose templates` | `deploy/docker` (server-only), `publish-app-images.yml` matrix entry, `deploy/compose/site-mail.yml` + `.env.example` |
| 3 | `[site-mail 3/8] Deploy site-mail on glados at site-mail.joed.dev` | `/opt/services/apps/site-mail/`, migrate SMTP creds into `site-mail.env`, compose up, verify `/health` (tunnel may be pending) |
| 4 | `[site-mail 4/8] Point web-legos MailManager at site-mail microservice` | Update `packages/web-legos/api/mail.ts` to call `https://site-mail.joed.dev` with auth + site slug |
| 5 | `[site-mail 5/8] Migrate CRM invoice mail to site-mail` | Replace nodemailer in `a-new-day-coaching-crm/routes/invoices.js`; remove `/mail` mount |
| 6 | `[site-mail 6/8] Remove per-app SiteMailManager mounts` | Strip `/site-mail` from ANDC, BTB, BBM; fix talk-about-dreams; deprecate `server-legos/siteMail.js` |
| 7 | `[site-mail 7/8] Per-app env cutover for SITE_MAIL_*` | Update deploy compose env examples + glados app-env files for consumers |
| 8 | `[site-mail 8/8] End-to-end verify + open PR to main` | Smoke-test sends/logs; push branch; `gh pr create` against `main` linking issues 1–8 |

Adjust N if you split further, but keep numbering sequential and create **all** issues before starting #1.

## Goal

Mail today is embedded in each site's Express server via `SiteMailManager`. That makes it hard to track, secure, or change independently. This work creates `packages/site-mail` as its own service with its own deploy, logs, and credentials — separate from site front/backends.

## Repository

- **Path:** `/opt/actions-runner/_work/WL-Universe/WL-Universe`
- **GitHub:** https://github.com/r2pen2/WL-Universe
- **Default branch:** `main`
- **Deploy host:** glados (`10.0.0.172`), `/opt/services/apps/<app>/compose.yml`

## Current Architecture

### Core library

`packages/server-legos/siteMail.js` — Express router mounted at `POST /` on each app:

- Uses nodemailer + Gmail
- **Bug:** never calls `res.status(...).json(...)` — clients hang
- Hardcoded `from`: `joed.dev Forms <forms@joed.dev>`
- No auth, no logging, no retry

### Client

`packages/web-legos/api/mail.ts` — `MailManager.sendMail()` POSTs to same-origin `${developmentHostname}/site-mail`.

### Apps using mail today

| App | Route | SMTP user | Env password |
|-----|-------|-----------|--------------|
| a-new-day-coaching | `/site-mail` | `joedobbelaar@gmail.com` | `ANDCEMAILPASSWORD` |
| beyond-the-bell | `/site-mail` | `joedobbelaar@gmail.com` | `BTBEMAILPASSWORD` |
| boston-mixtape | `/site-mail` | `joedobbelaar@gmail.com` | `BBMEMAILPASSWORD` |
| a-new-day-coaching-crm | `/mail` | `EMAIL_USER` | `EMAIL_PASS` |
| talk-about-dreams | *(disabled)* | — | server mount commented out; client still calls `/site-mail` |

### CRM duplicate logic

`packages/a-new-day-coaching-crm/routes/invoices.js` has its own nodemailer path:

- Supports Gmail **or** GoDaddy SMTP (`EMAIL_SERVICE=godaddy`, `smtpout.secureserver.net:587`)
- Sends HTML invoice emails via `sendEmailWithMailManager()`
- Uses `DOMAIN_EMAIL` for display From

Consolidate this into site-mail as a richer send API (text + optional html, per-site profile).

## Target Architecture

```
[Site React apps]  --POST-->  site-mail.joed.dev  --SMTP-->  Gmail / GoDaddy
[CRM server]       --POST-->  (site-mail microservice)
```

### New package: `packages/site-mail/`

Express microservice (no React client). Suggested port: **3020**.

**Endpoints (proposal):**

- `GET /health` — liveness for Traefik / monitoring
- `POST /v1/send` — authenticated send

**Request body:**

```json
{
  "site": "beyond-the-bell",
  "to": "user@example.com",
  "subject": "...",
  "text": "...",
  "html": "..."
}
```

**Auth:** `Authorization: Bearer <SITE_MAIL_API_KEY>` (shared secret in env; sites get key via their env files).

**Site profiles** in `/opt/services/data/app-env/site-mail.env`:

```env
PORT=3020
SITE_MAIL_API_KEY=<generate-strong-key>

# Per-site SMTP (service reads SITE_<SLUG>_USER, _PASS, _FROM, optional _SERVICE/_HOST/_PORT)
SITE_BEYOND_THE_BELL_USER=joedobbelaar@gmail.com
SITE_BEYOND_THE_BELL_PASS=...
SITE_BEYOND_THE_BELL_FROM=Beyond the Bell <forms@beyondthebelleducation.com>

SITE_ANDC_USER=...
SITE_ANDC_PASS=...
SITE_ANDC_FROM=...

SITE_BBM_USER=...
SITE_BBM_PASS=...

SITE_CRM_USER=...
SITE_CRM_PASS=...
SITE_CRM_FROM=billing@anewdaycoaching.com
SITE_CRM_SERVICE=godaddy
```

**Fixes to include in the new service:**

1. Always return JSON + proper HTTP status on success/failure
2. Structured logging (site, to, subject, messageId, error)
3. Rate limiting (express-rate-limit)
4. Optional send log file or SQLite under `/opt/services/data/app-assets/site-mail/`

### Dockerfile

Unlike other apps, site-mail is server-only. Options:

- New `deploy/docker/node-express.Dockerfile` (no client build), **or**
- Minimal Dockerfile in `packages/site-mail/Dockerfile`

Add to CI matrix in `.github/workflows/publish-app-images.yml`:

```yaml
- app: site-mail
  port: 3020
```

### Deploy on glados

Create `/opt/services/apps/site-mail/compose.yml` (copy pattern from `deploy/compose/` + Traefik labels):

- Host: **`site-mail.joed.dev`**
- Image: `ghcr.io/r2pen2/wl-universe-site-mail:latest`
- env_file: `/opt/services/data/app-env/site-mail.env`
- network: `proxy`
- watchtower label

Also add `deploy/compose/site-mail.yml` + `site-mail.env.example` to the repo.

**User action:** Add Cloudflare tunnel public hostname `site-mail.joed.dev` → Traefik (same as other joed.dev subdomains).

## Cutover Steps (single coordinated release)

These map 1:1 to the GitHub issues above. Implement via the issue queue, not as a freeform dump.

### 1. Build site-mail service

- [ ] Create `packages/site-mail` with Express server
- [ ] Site profile loader from env
- [ ] `/v1/send` + `/health`
- [ ] Dockerfile + CI matrix entry
- [ ] `deploy/compose/site-mail.yml` + env example

### 2. Deploy to glados

- [ ] Create `/opt/services/data/app-env/site-mail.env` with migrated credentials from:
  - `beyond-the-bell.env` → `BTBEMAILPASSWORD`
  - `a-new-day-coaching.env` → `ANDCEMAILPASSWORD`
  - `boston-mixtape.env` → `BBMEMAILPASSWORD`
  - `a-new-day-coaching-crm.env` → `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_SERVICE`, `DOMAIN_EMAIL`
- [ ] `deploy-app site-mail` or manual compose up
- [ ] Verify: `curl https://site-mail.joed.dev/health` (or LAN/`localhost:3020` until tunnel exists)

### 3. Update consumers

- [ ] **`packages/web-legos/api/mail.ts`**
  - Replace same-origin `/site-mail` with `https://site-mail.joed.dev` (or env `REACT_APP_SITE_MAIL_URL`)
  - Add `Authorization` header with API key
  - Include `site` slug in body
  - Await fetch; handle errors

- [ ] **Remove server mounts** from:
  - `packages/a-new-day-coaching/server.js`
  - `packages/beyond-the-bell/server.js`
  - `packages/boston-mixtape/server.js`
  - `packages/a-new-day-coaching-crm/server.js` (`/mail` route)

- [ ] **CRM invoices:** replace `sendEmailWithMailManager()` in `routes/invoices.js` with HTTP call to site-mail

- [ ] **talk-about-dreams:** wire client to site-mail; no local server route needed

- [ ] Remove or deprecate `packages/server-legos/siteMail.js` after all callers migrated

### 4. Env updates per app

Add to each site's env on glados (and `.env.example` in deploy/compose):

```env
SITE_MAIL_URL=https://site-mail.joed.dev
SITE_MAIL_API_KEY=<same-as-site-mail-service-or-per-site-key>
SITE_MAIL_SITE_SLUG=beyond-the-bell
```

Rebuild/redeploy all affected app images after web-legos change.

### 5. Verify + PR

- [ ] Form submit on each site sends mail
- [ ] CRM invoice email sends (HTML + GoDaddy path if used)
- [ ] talk-about-dreams form works
- [ ] Old `/site-mail` and `/mail` routes return 404 on site containers
- [ ] site-mail logs show all sends in one place
- [ ] Push feature branch and open PR → `main` with all issues linked

## Reference Files

| Purpose | Path |
|---------|------|
| Current mail library | `packages/server-legos/siteMail.js` |
| Client mail helper | `packages/web-legos/api/mail.ts` |
| CRM invoice mail | `packages/a-new-day-coaching-crm/routes/invoices.js` |
| CI publish workflow | `.github/workflows/publish-app-images.yml` |
| Shared Dockerfile | `deploy/docker/node-react-express.Dockerfile` |
| Compose template pattern | `deploy/compose/beyond-the-bell.yml` |
| glados wl-status example | `/opt/services/apps/wl-status/compose.yml` |
| Deploy helper | `/opt/services/bin/deploy-app` |

## Security Notes

Current endpoints are **unauthenticated public POST** — anyone who discovers a site URL can send mail. The microservice must require API key auth. Consider IP allowlisting to Traefik internal network only if sites call via internal DNS later; for now HTTPS + API key from browser/server is acceptable if key is server-side only (CRM) or injected at build for client (less ideal — prefer server-side proxy for forms long-term).

## Out of Scope (future)

- Mail queue / retry / dead-letter
- Admin UI for send history
- Per-recipient unsubscribe
- Moving form POST through site backend instead of client-direct-to-mail-service
