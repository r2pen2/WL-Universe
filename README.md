# WL-Universe

Monorepo for WL shared packages and applications.

## Layout

- `packages/web-legos` contains the shared React UI/API source.
- `packages/server-legos` contains the shared Express/Firebase server helpers.
- `packages/nicole-levin` contains the NicoleLevin app and server.
- `deploy/glados` contains compose files intended for `/opt/services/apps/*` on glados.
- `scripts/sync-local-packages.mjs` materializes shared package source into apps that still expect the old nested `libraries` layout.

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

The image tag used by glados is:

```text
ghcr.io/r2pen2/wl-universe/nicole-levin:latest
```

## Glados Deployment

The compose file for NicoleLevin is `deploy/glados/nicole-levin.compose.yml`.

On glados, install it as:

```bash
sudo mkdir -p /opt/services/apps/nicole-levin
sudo cp nicole-levin.compose.yml /opt/services/apps/nicole-levin/compose.yml
sudo /opt/services/bin/deploy-app nicole-levin
```

Secrets and runtime assets stay outside git:

- `/opt/services/data/app-env/nicole-levin.env`
- `/opt/services/data/app-env/nicole-levin-serviceAccountKey.json`
- `/opt/services/data/app-assets/nicole-levin/static`
