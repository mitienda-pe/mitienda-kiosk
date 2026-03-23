/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_DEV_TENANT: string
  readonly VITE_TENANT_ID: string
  readonly VITE_BRANCH_NAME: string
  readonly VITE_KIOSK_ID: string
  readonly VITE_STORE_ID: string
  readonly VITE_INACTIVITY_TIMEOUT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
