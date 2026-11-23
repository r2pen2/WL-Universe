#!/usr/bin/env bash
# Read-only wl-cms access for the component catalog (storybook.joed.dev and pr-<n>-storybook).
# Idempotent; run by publish-app-images.yml (storybook / wl-cms deploys) and, for QA previews, by
# r2pen2/devops deploy-pr.mjs (storybook's qaPreDeploy in deploy/apps.json).
#
# - Generates WL_CMS_READ_API_KEY in wl-cms.env if missing and recreates wl-cms so it takes effect.
#   wl-cms accepts that key for GET/HEAD only (packages/wl-cms/lib/auth.js); writes get 403.
# - Writes the catalog's env files (prod storybook.env and QA qa/storybook.env) with prod's CMS URL
#   and that read-only key. The catalog serves them to the browser in /wl-config.js; the key can't
#   change anything, which is the point.
#
# Secret values are never printed.
set -euo pipefail

ENV_DIR=/opt/services/data/app-env
APPS_DIR=/opt/services/apps
CMS_ENV="$ENV_DIR/wl-cms.env"

get() { [ -f "$1" ] && sed -n "s/^$2=//p" "$1" | tail -n1 | tr -d '\r' || true; }

if [ ! -f "$CMS_ENV" ]; then
  echo "::warning::$CMS_ENV missing; can't provision the read-only CMS key"
  exit 0
fi

key="$(get "$CMS_ENV" WL_CMS_READ_API_KEY)"
if [ -z "$key" ]; then
  key="ro_$(openssl rand -hex 24)"
  tmp="$(mktemp)"
  grep -v '^WL_CMS_READ_API_KEY=' "$CMS_ENV" > "$tmp" || true
  printf 'WL_CMS_READ_API_KEY=%s\n' "$key" >> "$tmp"
  cat "$tmp" > "$CMS_ENV"; rm -f "$tmp"
  echo "== WL_CMS_READ_API_KEY: generated"
  if [ -f "$APPS_DIR/wl-cms/compose.yml" ]; then
    (cd "$APPS_DIR/wl-cms" && docker compose -f compose.yml up -d --force-recreate)
  fi
else
  echo "== WL_CMS_READ_API_KEY: kept existing"
fi

write_env() {
  local file="$1"
  mkdir -p "$(dirname "$file")"
  umask 077
  printf '# Written by scripts/glados/provision-cms-read-key.sh\nWL_CMS_URL=https://wl-cms.joed.dev\nWL_CMS_READ_API_KEY=%s\n' "$key" > "$file"
  chmod 640 "$file"
  echo "== $file: written"
}
write_env "$ENV_DIR/storybook.env"
write_env "$ENV_DIR/qa/storybook.env"
