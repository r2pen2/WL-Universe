# WL-Universe

Monorepo for WL shared packages and applications.

## Layout

- `packages/web-legos` contains the shared React UI/API source.
- `packages/server-legos` contains the shared Express/Firebase server helpers.
- `packages/nicole-levin` contains the NicoleLevin app and server.
- `deploy/docker` contains shared Dockerfiles for app image builds.
- `deploy/compose` contains app compose templates.
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
