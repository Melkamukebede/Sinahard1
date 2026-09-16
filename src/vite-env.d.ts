/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHAPA_PUBLIC_KEY?: string;
  readonly VITE_CHAPA_SECRET_KEY?: string;
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
