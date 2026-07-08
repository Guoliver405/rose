/**
 * Test-Mandant anlegen (solange es keine Self-Service-Registrierung gibt):
 * Hotel-Zeile + Auth-User + Management-Profil in einem Rutsch.
 *
 *   node scripts/create-tenant.mjs "Hotelname" email@rose.local [passwort]
 *
 * Ohne Passwort-Argument wird eines generiert und ausgegeben.
 * Braucht .env.local im Projekt-Root (SUPABASE_SECRET_KEY).
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'

const [hotelName, email, pwArg] = process.argv.slice(2)
if (!hotelName || !email) {
  console.error('Aufruf: node scripts/create-tenant.mjs "Hotelname" email@rose.local [passwort]')
  process.exit(1)
}

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// lesbar, ohne verwechselbare Zeichen (0/O, 1/l/I)
const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
const password =
  pwArg ?? Array.from(randomBytes(12), (b) => alphabet[b % alphabet.length]).join('')

const { data: userData, error: userErr } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})
if (userErr) { console.error('FEHLER User:', userErr.message); process.exit(1) }

const { data: hotel, error: hotelErr } = await admin
  .from('hotels').insert({ name: hotelName }).select('id').single()
if (hotelErr) {
  await admin.auth.admin.deleteUser(userData.user.id)
  console.error('FEHLER Hotel:', hotelErr.message)
  process.exit(1)
}

const { error: profErr } = await admin
  .from('profiles')
  .insert({ id: userData.user.id, hotel_id: hotel.id, display_name: 'Rezeption' })
if (profErr) {
  await admin.auth.admin.deleteUser(userData.user.id)
  await admin.from('hotels').delete().eq('id', hotel.id)
  console.error('FEHLER Profil:', profErr.message)
  process.exit(1)
}

console.log(`Angelegt: ${hotelName}`)
console.log(`  Login:    ${email}`)
console.log(`  Passwort: ${password}`)
console.log(`  hotel_id: ${hotel.id}`)
