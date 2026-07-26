/**
 * Spiegelt `Supabase_sql/archive/` nach `supabase/migrations/`.
 *
 * Wir pflegen Migrationen weiter in der Projekt-Ablage (siehe AGENTS.md:
 * neue Datei in `Supabase_sql/`, nach dem Einspielen per `git mv` ins Archiv).
 * Die Supabase-CLI braucht für `supabase db reset` aber ihr eigenes Format
 * `<14-stelliger Zeitstempel>_name.sql` in `supabase/migrations/`.
 *
 * Statt die Ablage umzustellen — und damit die eingespielte Reihenfolge der
 * Produktion zu verlieren — erzeugt dieses Skript die CLI-Sicht neu. Einzige
 * Quelle der Wahrheit bleibt `Supabase_sql/archive/`.
 *
 *   node scripts/sync-migrations.mjs
 *
 * Reihenfolge: Basis-Schema zuerst, danach die datierten Dateien aufsteigend
 * nach Dateinamen. Innerhalb eines Tages entscheidet der Name — die
 * Migrationen eines Tages sind bewusst voneinander unabhängig.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ARCHIVE = new URL('../Supabase_sql/archive/', import.meta.url)
const TARGET = new URL('../supabase/migrations/', import.meta.url)

/** Basis-Schema; muss vor allen datierten Migrationen laufen. */
const BASE = 'supabase_schema_v1.sql'
const BASE_STAMP = '20260705000000'

const files = readdirSync(ARCHIVE).filter((f) => f.endsWith('.sql'))
if (!files.includes(BASE)) {
  console.error(`FEHLER: ${BASE} fehlt in Supabase_sql/archive/`)
  process.exit(1)
}

const dated = files.filter((f) => f !== BASE).sort()

// Gleicher Tag → laufende Nummer, damit die Zeitstempel eindeutig bleiben.
const perDay = new Map()
const planned = [{ source: BASE, target: `${BASE_STAMP}_schema_v1.sql` }]

for (const file of dated) {
  const match = /^(\d{4})-(\d{2})-(\d{2})_(.+)\.sql$/.exec(file)
  if (!match) {
    console.error(`FEHLER: unerwarteter Dateiname "${file}" — erwartet YYYY-MM-DD_name.sql`)
    process.exit(1)
  }
  const [, y, m, d, name] = match
  const day = `${y}${m}${d}`
  const seq = (perDay.get(day) ?? 0) + 1
  perDay.set(day, seq)
  const stamp = `${day}${String(seq).padStart(6, '0')}`
  planned.push({ source: file, target: `${stamp}_${name}.sql` })
}

rmSync(TARGET, { recursive: true, force: true })
mkdirSync(TARGET, { recursive: true })

for (const { source, target } of planned) {
  const sql = readFileSync(new URL(source, ARCHIVE), 'utf8')
  writeFileSync(new URL(target, TARGET), sql)
  console.log(`${source}  ->  ${target}`)
}

console.log(`\n${planned.length} Migrationen gespiegelt nach ${join('supabase', 'migrations')}.`)
