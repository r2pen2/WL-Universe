#!/usr/bin/env bash
# Provision a new v2 WL site on glados (idempotent; run by publish-app-images.yml before deploy).
#
#   provision-site.sh <slug> <service-account-from-slug> [mail-profile-from-prefix]
#
# - Creates /opt/services/data/app-env/<slug>.env from deploy/compose/<slug>.env.example if missing
#   and fills WL_CMS_* / WL_AUTH_* / WL_FORMS_* / SITE_MAIL_* from the shared service env files.
# - Copies <service-account-from-slug>-serviceAccountKey.json to <slug>-serviceAccountKey.json when the
#   site has none (v2 sites share the wladminportal project; data is split by siteKey collections).
# - Generates WL_AUTH_USERKEY_<SLUG> / WL_FORMS_FORMKEY_<SLUG> when missing.
# - Copies SITE_<FROM>_{USER,PASS,FROM} to SITE_<SLUG>_* in site-mail.env when missing.
# - Recreates wl-auth / wl-forms / site-mail only if their env changed.
#
# Existing non-empty values are never overwritten. Secret values are never printed.
set -euo pipefail

SLUG="${1:?slug}"
SA_FROM="${2:?service-account-from slug}"
MAIL_FROM="${3:-}"

ENV_DIR=/opt/services/data/app-env
APPS_DIR=/opt/services/apps
REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
UPPER="$(printf '%s' "$SLUG" | tr 'a-z-' 'A-Z_')"

log() { echo "== $*"; }
get() { [ -f "$1" ] && sed -n "s/^$2=//p" "$1" | tail -n1 | tr -d '\r' || true; }
CHANGED=0
put() {
  local file="$1" key="$2" value="$3"
  if [ -n "$(get "$file" "$key")" ]; then echo "   $key: kept existing"; return; fi
  if [ -z "$value" ]; then echo "   $key: no value available (left unset)"; return; fi
  local tmp; tmp="$(mktemp)"
  grep -v "^$key=" "$file" > "$tmp" || true
  printf '%s=%s\n' "$key" "$value" >> "$tmp"
  cat "$tmp" > "$file"; rm -f "$tmp"
  echo "   $key: set"
  CHANGED=1
}
recreate() {
  local app="$1"
  if [ -f "$APPS_DIR/$app/compose.yml" ]; then
    log "recreating $app"
    (cd "$APPS_DIR/$app" && docker compose -f compose.yml up -d --force-recreate)
  else
    echo "   no $APPS_DIR/$app/compose.yml, skipped recreate"
  fi
}

site_env="$ENV_DIR/$SLUG.env"
log "$SLUG.env"
if [ ! -f "$site_env" ]; then
  cp "$REPO_DIR/deploy/compose/$SLUG.env.example" "$site_env"
  chmod 600 "$site_env"
  echo "   created from example"
fi
put "$site_env" WL_CMS_URL https://wl-cms.joed.dev
put "$site_env" WL_CMS_API_KEY "$(get "$ENV_DIR/wl-cms.env" WL_CMS_API_KEY)"
put "$site_env" WL_CMS_SITE "$SLUG"
put "$site_env" WL_AUTH_URL https://wl-auth.joed.dev
put "$site_env" WL_AUTH_API_KEY "$(get "$ENV_DIR/wl-auth.env" WL_AUTH_API_KEY)"
put "$site_env" WL_AUTH_SITE "$SLUG"
put "$site_env" WL_FORMS_URL https://wl-forms.joed.dev
put "$site_env" WL_FORMS_API_KEY "$(get "$ENV_DIR/wl-forms.env" WL_FORMS_API_KEY)"
put "$site_env" WL_FORMS_SITE "$SLUG"
mail_key="$(get "$ENV_DIR/site-mail.env" SITE_MAIL_API_KEY)"
put "$site_env" SITE_MAIL_API_KEY "$mail_key"
put "$site_env" REACT_APP_SITE_MAIL_API_KEY "$mail_key"

log "service account"
sa="$ENV_DIR/$SLUG-serviceAccountKey.json"
if [ -f "$sa" ]; then
  echo "   present"
elif [ -f "$ENV_DIR/$SA_FROM-serviceAccountKey.json" ]; then
  # -p keeps the source's owner/mode, which the service containers already read.
  cp -p "$ENV_DIR/$SA_FROM-serviceAccountKey.json" "$sa"
  echo "   copied from $SA_FROM ($(sed -n 's/.*"project_id": *"\([^"]*\)".*/\1/p' "$sa" | head -1))"
else
  echo "::error::No $sa and no $SA_FROM-serviceAccountKey.json to copy"
  exit 1
fi

log "wl-auth.env"
CHANGED=0
put "$ENV_DIR/wl-auth.env" "WL_AUTH_USERKEY_$UPPER" "$(openssl rand -hex 20)"
[ "$CHANGED" = 1 ] && recreate wl-auth

log "wl-forms.env"
CHANGED=0
put "$ENV_DIR/wl-forms.env" "WL_FORMS_FORMKEY_$UPPER" "$(openssl rand -hex 20)"
[ "$CHANGED" = 1 ] && recreate wl-forms

if [ -n "$MAIL_FROM" ] && [ -f "$ENV_DIR/site-mail.env" ]; then
  log "site-mail.env"
  CHANGED=0
  for part in USER PASS FROM; do
    put "$ENV_DIR/site-mail.env" "SITE_${UPPER}_$part" "$(get "$ENV_DIR/site-mail.env" "SITE_${MAIL_FROM}_$part")"
  done
  [ "$CHANGED" = 1 ] && recreate site-mail
fi

# wl-cms reads <slug>-serviceAccountKey.json lazily per request, so it needs no restart here; its
# new SITE_REGISTRY entry ships with its own image.
log "done"
