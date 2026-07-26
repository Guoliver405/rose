import { execSync } from 'node:child_process'

/**
 * Setup-Datei der Integrationstests: legt die Verbindungsdaten der LOKALEN
 * Supabase-Instanz als Umgebungsvariablen ab, bevor irgendein Test lädt.
 *
 * Läuft bewusst als `setupFiles` (einmal je Worker) statt als `globalSetup` —
 * so stehen die Variablen garantiert in dem Prozess, der die Tests ausführt.
 * `fileParallelism: false` in der Config sorgt dafür, dass es genau ein Worker
 * bleibt; alle Tests teilen sich dieselbe Datenbank und dürfen sich nicht
 * gegenseitig die Fixtures wegräumen.
 *
 * Nichts ist hartkodiert: die Schlüssel der lokalen Instanz stehen zwar fest,
 * aber ein kopierter Schlüssel im Repo lädt dazu ein, ihn irgendwann gegen die
 * echte Datenbank zu richten.
 */
type Status = Record<string, string>

function readStatus(): Status {
  // execSync statt execFileSync mit shell:true — sonst warnt Node (DEP0190)
  // über nicht escapte Argumente. Das Kommando ist hier fest, nichts kommt
  // von außen.
  const raw = execSync('npx supabase status -o json', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return JSON.parse(raw) as Status
}

/** CLI-Versionen benennen die Felder leicht unterschiedlich. */
function pick(status: Status, ...names: string[]): string | undefined {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')
  for (const name of names) {
    const hit = Object.entries(status).find(([key]) => norm(key) === norm(name))
    if (hit?.[1]) return hit[1]
  }
  return undefined
}

let status: Status
try {
  status = readStatus()
} catch {
  throw new Error(
    '\nLokale Supabase-Instanz nicht erreichbar.\n' +
    '  1. Docker Desktop starten\n' +
    '  2. npm run db:start\n' +
    '  3. npm run db:reset   (spielt die Migrationen aus Supabase_sql/archive ein)\n',
  )
}

const url = pick(status, 'API_URL', 'apiUrl')
const anon = pick(status, 'ANON_KEY', 'anonKey', 'PUBLISHABLE_KEY')
const service = pick(status, 'SERVICE_ROLE_KEY', 'serviceRoleKey', 'SECRET_KEY')

if (!url || !anon || !service) {
  throw new Error(
    `supabase status lieferte keine vollständigen Verbindungsdaten. Felder: ${Object.keys(status).join(', ')}`,
  )
}

// Sicherheitsnetz: niemals versehentlich gegen die echte Stage laufen.
if (!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(url)) {
  throw new Error(`Integrationstests laufen nur lokal — erhalten: ${url}`)
}

// Die App liest genau diese Namen; dadurch arbeiten die echten Client-Fabriken
// aus src/utils/supabase unverändert gegen die lokale Instanz.
process.env.NEXT_PUBLIC_SUPABASE_URL = url
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = anon
process.env.SUPABASE_SECRET_KEY = service
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
