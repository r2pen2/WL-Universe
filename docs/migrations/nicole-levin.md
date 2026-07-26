# NicoleLevin Migration

NicoleLevin was moved into `WL-Universe` as `packages/nicole-levin`.

## Current Deployment Flow

1. Changes are pushed to `main`.
2. `.github/workflows/nicole-levin-image.yml` builds the app with `deploy/docker/node-react-express.Dockerfile`.
3. The image is published to `ghcr.io/r2pen2/wl-universe-nicole-levin:latest`.
4. glados runs `/opt/services/apps/nicole-levin/compose.yml`, which points at the WL-Universe image.
5. Watchtower can update the container when a new `latest` image is published.

## Verification

- `https://nicolelevin.org` returned `200`.
- `https://nicolelevin.org/site-text?id=splash-title` returned `200`.

## Runtime Data

Runtime data remains outside git on glados:

- Static assets: `/opt/services/data/app-assets/nicole-levin/static`
- App env file: `/opt/services/data/app-env/nicole-levin.env`
- Firebase service account: `/opt/services/data/app-env/nicole-levin-serviceAccountKey.json`
