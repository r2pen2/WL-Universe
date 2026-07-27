#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="${WL_UNIVERSE_ROOT:-/home/joe/src/WL-Universe}"
NODE_BIN="${WL_NODE_BIN:-/opt/actions-runner/externals/node24/bin/node}"
CONFIG="${WL_LIVENESS_CONFIG:-/opt/services/data/app-assets/liveness/sites.json}"
mkdir -p "$(dirname "$CONFIG")"
if [[ ! -x "$NODE_BIN" ]]; then NODE_BIN="$(command -v node)"; fi
if [[ ! -f "$CONFIG" ]]; then CONFIG="${REPO_ROOT}/deploy/liveness/sites.json"; fi
exec "$NODE_BIN" "${REPO_ROOT}/scripts/liveness/check.mjs" --config "$CONFIG"
