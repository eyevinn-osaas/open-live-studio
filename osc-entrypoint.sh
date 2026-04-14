#!/bin/bash
set -e

# === Default PORT for OSC ===
export PORT="${PORT:-8080}"

# === Inject runtime environment variables into the SPA ===
cat > /usr/share/nginx/html/env-config.js <<EOF
window._env_ = {
  OPEN_LIVE_URL: "${OPEN_LIVE_URL:-}",
  OSC_PAT: "${OSC_PAT:-}",
};
EOF

# === Execute the original command ===
exec "$@"
