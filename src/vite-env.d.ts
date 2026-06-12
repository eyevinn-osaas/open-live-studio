/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly OPEN_LIVE_URL: string
  // OSC_PAT is intentionally absent — it is a secret injected at runtime via
  // window._env_ (docker-entrypoint.sh) and must never be baked into the bundle.
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
