/**
 * Einmaliges Bootstrap-Skript: legt das Hotel und den ersten
 * Rezeptions-Login an. Aufruf:
 *
 *   node scripts/bootstrap.mjs "Hotelname" "email@beispiel.de" "passwort"
 *
 * Läuft gefahrlos erneut: existiert bereits ein Hotel, bricht es ab.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// .env.local von Hand parsen (kein dotenv-Package nötig)
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const [hotelName = 'Mein Hotel', email = 'rezeption@rose.local', password] = process.argv.slice(2)

if (!password) {
  console.error('Aufruf: node scripts/bootstrap.mjs "Hotelname" "email" "passwort"')
  process.exit(1)
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: existing, error: checkErr } = await admin.from('hotels').select('id, name').limit(1)
if (checkErr) { console.error('Schema-Check fehlgeschlagen:', checkErr.message); process.exit(1) }
if (existing.length > 0) {
  console.error(`Abbruch: Hotel "${existing[0].name}" existiert bereits (${existing[0].id}).`)
  process.exit(1)
}

const { data: hotel, error: hotelErr } = await admin
  .from('hotels').insert({ name: hotelName }).select('id').single()
if (hotelErr) { console.error('Hotel-Anlage fehlgeschlagen:', hotelErr.message); process.exit(1) }

const { data: user, error: userErr } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})
if (userErr) { console.error('User-Anlage fehlgeschlagen:', userErr.message); process.exit(1) }

const { error: profileErr } = await admin.from('profiles').insert({
  id: user.user.id,
  hotel_id: hotel.id,
  display_name: 'Rezeption',
  username: null, // NULL = Management
})
if (profileErr) { console.error('Profil-Anlage fehlgeschlagen:', profileErr.message); process.exit(1) }

console.log('Bootstrap erfolgreich:')
console.log(`  Hotel:    ${hotelName} (${hotel.id})`)
console.log(`  Login:    ${email}`)
console.log(`  Passwort: (wie angegeben)`)
