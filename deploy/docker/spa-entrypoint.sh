#!/bin/sh
set -eu

CONFIG=/usr/share/nginx/html/wl-config.js

q() {
  # Escape for double-quoted JS string
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

cat > "$CONFIG" <<EOF
window.__WL_CMS__={url:"$(q "${WL_CMS_URL:-}")",apiKey:"$(q "${WL_CMS_API_KEY:-}")",site:"$(q "${WL_CMS_SITE:-}")"};
window.__WL_AUTH__={url:"$(q "${WL_AUTH_URL:-}")",apiKey:"$(q "${WL_AUTH_API_KEY:-}")",site:"$(q "${WL_AUTH_SITE:-}")"};
window.__WL_FORMS__={url:"$(q "${WL_FORMS_URL:-}")",apiKey:"$(q "${WL_FORMS_API_KEY:-}")",site:"$(q "${WL_FORMS_SITE:-}")"};
window.__WL_SITE_MAIL__={url:"$(q "${SITE_MAIL_URL:-}")",apiKey:"$(q "${SITE_MAIL_API_KEY:-}")",site:"$(q "${SITE_MAIL_SITE_SLUG:-}")"};
EOF

if [ -f /usr/share/nginx/html/index.html ] && ! grep -q 'wl-config.js' /usr/share/nginx/html/index.html; then
  sed -i 's|</head>|<script src="/wl-config.js"></script></head>|' /usr/share/nginx/html/index.html
fi

exec nginx -g 'daemon off;'
