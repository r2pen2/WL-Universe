#!/bin/sh
# nginx /docker-entrypoint.d hook: expose the catalog's CMS settings to the browser as /wl-config.js.
# WL_CMS_READ_API_KEY is wl-cms's read-only key (GET/HEAD only), so it's fine to be public.
set -eu
CONFIG=/usr/share/nginx/html/wl-config.js
url="${WL_CMS_URL:-https://wl-cms.joed.dev}"
key="${WL_CMS_READ_API_KEY:-}"
printf 'window.__WL_CMS__={url:"%s",apiKey:"%s",site:"",readOnly:true};\n' "$url" "$key" > "$CONFIG"
[ -n "$key" ] || echo "storybook: WL_CMS_READ_API_KEY not set; stories will show fallbacks only" >&2
