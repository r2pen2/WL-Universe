#!/usr/bin/env bash
# Pre-render the component catalog's "On each site" and Fonts data: headless Chromium (Playwright
# image, nothing to install) opens the deployed catalog and runs its live harvest of every site
# (tools/storybook/scripts/snapshot.mjs). The JSON lands in the data dir the storybook container
# serves at /snapshot/ (deploy/compose/storybook.yml), so visitors get it instantly.
# Run by publish-app-images.yml after deploys and by storybook-snapshot.yml on a schedule.
# A failed or partial harvest keeps the previous snapshot.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR=/opt/services/data/app-assets/storybook
URL="${STORYBOOK_URL:-https://storybook.joed.dev}"
IMAGE="${PLAYWRIGHT_IMAGE:-mcr.microsoft.com/playwright:v1.65.1-noble}"

mkdir -p "$OUT_DIR"
docker run --rm --init --shm-size=1g \
  -v "$REPO/tools/storybook/scripts:/work:ro" \
  -v "$OUT_DIR:/out" \
  "$IMAGE" node /work/snapshot.mjs "$URL" /out/usages.json
