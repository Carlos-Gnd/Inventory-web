// frontend/src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // Agrega más variables aquí si las necesitas
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}