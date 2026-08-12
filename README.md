# WL-Universe

Monorepo for WL shared packages and applications.

## Layout

- `packages/web-legos` — shared React UI/API source
- `packages/server-legos` — shared Express helpers (auth/forms shells, config shims)
- `packages/wl-cms` — shared CMS microservice (site text, images, models)
- `packages/site-mail` — shared mail microservice
- `packages/<site>` — marketing apps (thin Express shell + CRA client)
- `deploy/` — Docker, compose, local stack
- `scripts/sync-local-packages.mjs` — copies shared packages into nested `libraries` layouts

# Local development (multi-site)

```powershell
copy deploy\local\.env.example deploy\local\.env
npm install --legacy-peer-deps

npm run stack                          # wl-cms + wl-auth (+ forms/mail)
npm run client -- nicole-levin         # CRA HMR
npm run client -- beyond-the-bell
```

Marketing CMS sites are **static** (no `server.js`). See [deploy/local/README.md](deploy/local/README.md).

## NicoleLevin

Run these commands from the repo root:

```powershell
npm install --legacy-peer-deps
npm run test:nicole
npm run build:nicole
npm run docker:build:nicole
```

The Nicole image is published by `.github/workflows/nicole-levin-image.yml` when any of these paths change:

- `packages/nicole-levin/**`
- `packages/web-legos/**`
- `packages/server-legos/**`
- `scripts/**`
