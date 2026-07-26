import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * Unit-Tests der reinen Rechenlogik unter `src/lib` — kein I/O, keine DB,
 * kein React. Alles, was Supabase oder Next braucht (Server-Actions, RLS,
 * Portale), gehört in die Integrationsstufe und läuft hier bewusst nicht mit.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
