/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MAIN_VITE_API_URL: string
  readonly MAIN_VITE_CLERK_PUBLISHABLE_KEY: string
  readonly MAIN_VITE_CLERK_FRONTEND_API: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
