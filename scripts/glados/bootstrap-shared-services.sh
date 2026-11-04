#!/usr/bin/env bash
# One-off: bring up wl-auth and wl-forms on glados and point the sites at them.
# Run on glados (via .github/workflows/glados-bootstrap-services.yml) with sudo.
#
# Additive only: existing non-empty values are never overwritten, except that
# each site's WL_AUTH_API_KEY / WL_FORMS_API_KEY is kept equal to the service's.
# The whole app-env dir is backed up first. Secret values are never printed.
set -euo pipefail

ENV_DIR=/opt/services/data/app-env
APPS_DIR=/opt/services/apps
REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SITES=(nicole-levin beyond-the-bell you-can-do-it-gardening talk-about-dreams boston-mixtape a-new-day-coaching)
FORM_SITES=(beyond-the-bell boston-mixtape a-new-day-coaching talk-about-dreams)
USER_KEYS=(NLUSERKEY TAGUSERKEY BBMUSERKEY ANDCUSERKEY BTBUSERKEY YCDUSERKEY)
FORM_KEYS=(BTBFORMKEY BBMFORMKEY ANDCFORMKEY)

log() { echo "== $*"; }

# Current value of KEY in FILE ("" if missing). Never echoed by callers.
get() { [ -f "$1" ] && sed -n "s/^$2=//p" "$1" | tail -n1 | tr -d '\r' || true; }

# Set KEY=VALUE in FILE. mode "fill" only sets it when missing/empty; "force" always.
put() {
  local file="$1" key="$2" value="$3" mode="${4:-fill}"
  local current; current="$(get "$file" "$key")"
  if [ "$mode" = fill ] && [ -n "$current" ]; then echo "   $key: kept existing"; return; fi
  if [ "$current" = "$value" ]; then echo "   $key: unchanged"; return; fi
  local tmp; tmp="$(mktemp)"
  grep -v "^$key=" "$file" > "$tmp" || true
  printf '%s=%s\n' "$key" "$value" >> "$tmp"
  cat "$tmp" > "$file"; rm -f "$tmp"
  echo "   $key: set"
}

# First non-empty value of KEY in any env file under ENV_DIR other than SKIP.
find_existing() {
  local key="$1" skip="$2" f v
  for f in "$ENV_DIR"/*.env; do
    [ "$f" = "$skip" ] && continue
    v="$(get "$f" "$key")"
    [ -n "$v" ] && { printf '%s' "$v"; return; }
  done
}

ensure_service_env() {
  local name="$1" api_var="$2"; shift 2
  local file="$ENV_DIR/$name.env"
  log "$name.env"
  if [ ! -f "$file" ]; then
    cp "$REPO_DIR/deploy/compose/$name.env.example" "$file"
    chmod 600 "$file"
    echo "   created from example"
  fi
  put "$file" "$api_var" "$(openssl rand -hex 20)" fill
  local key v
  for key in "$@"; do
    v="$(find_existing "$key" "$file")"
    if [ -n "$v" ]; then put "$file" "$key" "$v" fill; else
      [ -n "$(get "$file" "$key")" ] && echo "   $key: kept existing" || echo "   $key: NOT FOUND in any env file (left unset)"
    fi
  done
}

log "backing up $ENV_DIR"
backup="/opt/services/data/app-env-backup-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"
tar -czf "$backup" -C /opt/services/data app-env
chmod 600 "$backup"
echo "   $backup"

ensure_service_env wl-auth WL_AUTH_API_KEY "${USER_KEYS[@]}"
ensure_service_env wl-forms WL_FORMS_API_KEY "${FORM_KEYS[@]}"
AUTH_KEY="$(get "$ENV_DIR/wl-auth.env" WL_AUTH_API_KEY)"
FORMS_KEY="$(get "$ENV_DIR/wl-forms.env" WL_FORMS_API_KEY)"

log "service accounts"
for slug in "${SITES[@]}"; do
  [ -f "$ENV_DIR/$slug-serviceAccountKey.json" ] && echo "   $slug: present" || echo "   $slug: MISSING $ENV_DIR/$slug-serviceAccountKey.json"
done

for slug in "${SITES[@]}"; do
  file="$ENV_DIR/$slug.env"
  log "$slug.env"
  if [ ! -f "$file" ]; then echo "   MISSING, skipped"; continue; fi
  put "$file" WL_AUTH_URL https://wl-auth.joed.dev fill
  put "$file" WL_AUTH_API_KEY "$AUTH_KEY" force
  put "$file" WL_AUTH_SITE "$slug" fill
  if printf '%s\n' "${FORM_SITES[@]}" | grep -qx "$slug"; then
    put "$file" WL_FORMS_URL https://wl-forms.joed.dev fill
    put "$file" WL_FORMS_API_KEY "$FORMS_KEY" force
    put "$file" WL_FORMS_SITE "$slug" fill
  fi
done

log "wl-admin-portal.env"
portal="$ENV_DIR/wl-admin-portal.env"
if [ -f "$portal" ]; then
  put "$portal" WL_AUTH_URL https://wl-auth.joed.dev fill
  put "$portal" WL_AUTH_API_KEY "$AUTH_KEY" force
  for key in BTBUSERKEY YCDUSERKEY; do
    v="$(get "$ENV_DIR/wl-auth.env" "$key")"
    [ -n "$v" ] && put "$portal" "$key" "$v" fill || echo "   $key: no value in wl-auth.env"
  done
else
  echo "   MISSING, skipped"
fi

for app in wl-auth wl-forms; do
  log "deploying $app"
  mkdir -p "$APPS_DIR/$app"
  cp "$REPO_DIR/deploy/compose/$app.yml" "$APPS_DIR/$app/compose.yml"
  (cd "$APPS_DIR/$app" && docker compose -f compose.yml pull -q && docker compose -f compose.yml up -d --force-recreate)
done

for app in "${SITES[@]}" wl-admin-portal; do
  log "recreating $app"
  if [ -f "$APPS_DIR/$app/compose.yml" ]; then
    (cd "$APPS_DIR/$app" && docker compose -f compose.yml up -d --force-recreate)
  else
    echo "   no $APPS_DIR/$app/compose.yml, skipped"
  fi
done

sleep 5
log "verify"
for pair in wl-auth:3022 wl-forms:3023; do
  name="${pair%%:*}"; port="${pair##*:}"
  echo "-- $name liveness:"
  docker exec "$name" node -e "fetch('http://localhost:$port/liveness').then(r=>r.text()).then(t=>console.log(t)).catch(e=>console.log('ERR',e.message))" || true
  echo "-- $name logs:"
  docker logs --tail 15 "$name" 2>&1 | sed -E 's/(apiKey|KEY)[^ ]*/\1=…/g' || true
done
for slug in "${SITES[@]}"; do
  echo "-- $slug wl-config.js:"
  docker exec "$slug" cat /usr/share/nginx/html/wl-config.js 2>/dev/null | sed -E 's/apiKey:"[^"]+"/apiKey:"(set)"/g' || echo "   (could not read)"
done
