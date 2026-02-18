/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BRY_CLIENT_ID: string;
  readonly VITE_BRY_CLIENT_SECRET: string;
  readonly VITE_BRY_CERT_UUID: string;
  readonly VITE_BRY_AUTH_URL: string;
  readonly VITE_BRY_SIGN_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}