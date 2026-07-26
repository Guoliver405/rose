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

// Slug = Mandanten-Kennung in der URL (/h/<slug>/guest). Spiegelt die Regeln
// aus src/lib/slug.ts — der Node-Skript-Kontext kann das TS-Modul nicht laden.
const slugify = (raw) =>
  raw
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
    .replace(/Ä/g, 'ae').replace(/Ö/g, 'oe').replace(/Ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '') || 'hotel'

const { data: existing } = await admin.from('hotels').select('slug')
const taken = new Set((existing ?? []).map((h) => h.slug))
const base = slugify(hotelName)
let slug = base
for (let n = 2; taken.has(slug); n++) slug = `${base.slice(0, 60 - String(n).length - 1)}-${n}`

const { data: hotel, error: hotelErr } = await admin
  .from('hotels').insert({ name: hotelName, slug }).select('id').single()
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

// Beispiel-Services seeden (gleiche Vorlagen wie der Button im
// Service-Konfigurator) — löschbar wie jeder andere Service.
const templates = JSON.parse(
  readFileSync(new URL('../src/lib/service-templates.json', import.meta.url), 'utf8')
)
for (const t of templates) {
  const { data: svc, error: svcErr } = await admin
    .from('service_definitions')
    .insert({ hotel_id: hotel.id, name: t.name, description: t.description, urgent: t.urgent })
    .select('id')
    .single()
  if (svcErr) { console.error('WARNUNG Beispiel-Service:', svcErr.message); continue }
  if (t.items.length > 0) {
    const { error: itemErr } = await admin.from('service_items').insert(
      t.items.map((i, idx) => ({
        service_id: svc.id,
        hotel_id: hotel.id,
        label: i.label,
        price_cents: i.price_cents,
        sort_order: idx,
      }))
    )
    if (itemErr) console.error('WARNUNG Beispiel-Service-Optionen:', itemErr.message)
  }
}

const origin = (env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
console.log(`Angelegt: ${hotelName}`)
console.log(`  Login:    ${email}`)
console.log(`  Passwort: ${password}`)
console.log(`  hotel_id: ${hotel.id}`)
console.log(`  Slug:     ${slug}`)
console.log(`  Gast:     ${origin}/h/${slug}/guest`)
console.log(`  Reinigung:${origin}/h/${slug}/service/login`)
console.log(`  Beispiel-Services: ${templates.map((t) => t.name).join(', ')}`)
