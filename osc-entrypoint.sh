#!/bin/bash
set -e

# === OSC Public URL Configuration ===
if [ -n "$OSC_HOSTNAME" ]; then
  export PUBLIC_URL="https://$OSC_HOSTNAME"
fi

# === Default PORT for OSC ===
export PORT="${PORT:-8080}"

# === Inject runtime environment variables into the SPA ===
cat > /usr/share/nginx/html/env-config.js <<EOF
window._env_ = {
  VITE_API_URL: "${VITE_API_URL:-}",
};
EOF

# === Execute the original command ===
exec "$@"
