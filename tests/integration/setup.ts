import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Setup-Datei der Integrationstests: legt die Verbindungsdaten als
 * Umgebungsvariablen ab, bevor irgendein Test lädt.
 *
 * Die Tests laufen gegen die **gemeinsame Supabase-Instanz des Projekts**, nicht
 * gegen eine lokale Kopie — kein Docker, kein WSL, keine Supabase-CLI. Das ist
 * gefahrlos, weil die Testwelt rein additiv arbeitet: jeder Lauf erzeugt eigene
 * Konten, Häuser und Nutzer, die eine Lauf-Kennung im Namen tragen
 * (`itest-<lauf>-…`), und räumt am Ende genau diese Zeilen wieder ab. Nichts
 * Fremdes wird verändert; die Aufräumroutine bricht ab, sobald eine Zeile die
 * Kennung nicht trägt. Details in helpers/world.ts.
 *
 * Läuft bewusst als `setupFiles` (im Testprozess selbst) statt als
 * `globalSetup` — so stehen die Variablen garantiert in dem Prozess, der die
 * Tests ausführt.
 *
 * Reihenfolge der Quellen:
 *   1. bereits gesetzte Umgebungsvariablen — so füttert CI seine Secrets ein
 *   2. `.env.local` im Projektwurzelverzeichnis — der Entwicklerrechner
 */
const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
] as const

/**
 * Minimaler .env-Parser. Bewusst kein `dotenv` als Abhängigkeit: gebraucht wird
 * `KEY=VALUE`, Kommentarzeilen raus, umschließende Anführungszeichen weg.
 */
function parseEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    // Werte dürfen '=' enthalten (JWTs tun das) — nur am ersten trennen.
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue

    const key = trimmed.slice(0, eq).trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue

    out[key] = trimmed.slice(eq + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
  }
  return out
}

const envPath = fileURLToPath(new URL('../../.env.local', import.meta.url))
const fromFile = existsSync(envPath) ? parseEnvFile(envPath) : {}

for (const key of REQUIRED) {
  // Kein `??=` — eine fehlende Datei würde sonst den String "undefined" setzen.
  if (!process.env[key] && fromFile[key]) process.env[key] = fromFile[key]
}
if (!process.env.NEXT_PUBLIC_SITE_URL) {
  process.env.NEXT_PUBLIC_SITE_URL = fromFile.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}

const missing = REQUIRED.filter((key) => !process.env[key])
if (missing.length > 0) {
  throw new Error(
    '\nVerbindungsdaten für die Integrationstests fehlen: ' + missing.join(', ') + '\n' +
    `  lokal: in .env.local eintragen (${envPath})\n` +
    '  in CI: als Secrets in die Job-Umgebung legen\n',
  )
}
