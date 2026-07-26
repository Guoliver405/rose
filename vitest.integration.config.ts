import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * Integrationstests gegen eine LOKALE Supabase-Instanz (Docker).
 *
 *   npm run db:start        einmalig, braucht Docker Desktop
 *   npm run db:reset        Migrationen aus Supabase_sql/archive einspielen
 *   npm run test:integration
 *
 * Bewusst getrennt vom Unit-Lauf: die Unit-Tests brauchen nichts und laufen in
 * CI, diese hier brauchen eine Datenbank.
 *
 * `fileParallelism: false` ist Pflicht — alle Testdateien teilen sich dieselbe
 * Datenbank und bauen die Testwelt neu auf; parallel würden sie sich
 * gegenseitig die Fixtures unter den Füßen wegräumen.
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
