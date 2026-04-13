#!/bin/sh
set -e

# Inject runtime environment variables into the SPA.
# Vite bakes VITE_* vars at build time, so we use a runtime-loaded script
# (/env-config.js) that docker-entrypoint.sh regenerates on every container
# start from the current process environment.
cat > /usr/share/nginx/html/env-config.js <<EOF
window._env_ = {
  VITE_API_URL: "${VITE_API_URL:-}",
};
EOF

exec "$@"
