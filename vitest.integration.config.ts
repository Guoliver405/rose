import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * Integrationstests gegen die Supabase-Instanz des Projekts.
 *
 *   npm run test:integration
 *
 * Kein Docker, kein WSL, keine Supabase-CLI: die Testwelt legt eigene Konten,
 * Häuser und Nutzer mit einer Lauf-Kennung an und räumt sie wieder ab
 * (tests/integration/helpers/world.ts). Verbindungsdaten kommen aus
 * `.env.local` bzw. aus der Job-Umgebung in CI.
 *
 * Bewusst getrennt vom Unit-Lauf: die Unit-Tests brauchen keine Datenbank und
 * laufen deshalb in jeder Umgebung ohne Secrets.
 *
 * `fileParallelism: false`: jede Testdatei baut ihre eigene Welt auf. Die
 * Lauf-Kennung würde sie zwar auch parallel trennen, aber seriell bleibt der
 * Fehlerfall lesbar und die Last auf der gemeinsamen Instanz klein.
 */
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['tests/integration/setup.ts'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
