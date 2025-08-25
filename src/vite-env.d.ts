/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly PROD: boolean;
    readonly DEV: boolean;
    readonly MODE: string;
    readonly VITE_APP_ENV?: string;
    [key: string]: string | boolean | undefined;
  }
}