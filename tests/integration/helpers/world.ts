import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { buildMaidEmail } from '@/lib/maid'

/**
 * Testwelt für die Integrationstests: **zwei Konten** mit den Kollisionen, die
 * uns in der Praxis eingeholt haben.
 *
 *   Konto Alpha
 *     Haus A1 „test-alpha-eins"  — Zimmer 101, 102 · Rezeption · Reinigung @maria
 *     Haus A2 „test-alpha-zwei"  — Zimmer 201     · Manager (NUR hier)
 *     Inhaber: alle Häuser des Kontos
 *   Konto Beta
 *     Haus B1 „test-beta-eins"   — Zimmer 101 (gleiche Nummer wie A1!)
 *                                · Reinigung @maria (gleicher Benutzername!)
 *     Inhaber: nur Beta
 *
 * Zimmernummer und Benutzername sind absichtlich doppelt vergeben — sie sind
 * laut Schema nur JE HOTEL eindeutig, und genau daran hingen die Fehler aus
 * Phase 6c.
 */

const PW = 'IntegrationTest!2026'

export type UserHandle = { id: string; email: string; password: string }
export type HotelHandle = { id: string; slug: string; name: string; rooms: Record<string, string> }

export type World = {
  alpha: {
    accountId: string
    owner: UserHandle
    manager: UserHandle
    reception: UserHandle
    maid: UserHandle & { username: string }
    a1: HotelHandle
    a2: HotelHandle
  }
  beta: {
    accountId: string
    owner: UserHandle
    maid: UserHandle & { username: string }
    b1: HotelHandle
  }
}

export function serviceClient(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Anonymer Client — sieht nur, was die RLS Unangemeldeten erlaubt. */
export function anonClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/**
 * Client im Namen eines angemeldeten Nutzers — die RLS sieht dessen `auth.uid()`.
 * Genau so prüfen wir die Mandanten- und Rollengrenzen an der Quelle.
 */
export async function clientAs(user: UserHandle): Promise<SupabaseClient> {
  const auth = anonClient()
  const { data, error } = await auth.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  })
  if (error || !data.session) throw new Error(`Anmeldung fehlgeschlagen für ${user.email}: ${error?.message}`)

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
    },
  )
}

/** Räumt die lokale Testdatenbank vollständig ab. */
export async function resetDatabase(): Promise<void> {
  const admin = serviceClient()

  // Konten kaskadieren auf Hotels und damit auf Zimmer, Aufenthalte, Zustände,
  // Service-Katalog und Bestellungen.
  const { data: accounts } = await admin.from('accounts').select('id')
  for (const a of accounts ?? []) await admin.from('accounts').delete().eq('id', a.id)

  // Häuser ohne Konto kann es nach der Migration nicht geben — sicherheitshalber.
  const { data: hotels } = await admin.from('hotels').select('id')
  for (const h of hotels ?? []) await admin.from('hotels').delete().eq('id', h.id)

  // Auth-Nutzer kaskadieren auf profiles, account_members und hotel_members.
  for (let page = 1; page <= 20; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 50 })
    const users = data?.users ?? []
    if (users.length === 0) break
    for (const u of users) await admin.auth.admin.deleteUser(u.id)
    if (users.length < 50) break
  }
}

async function createAuthUser(email: string): Promise<UserHandle> {
  const admin = serviceClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PW,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`createUser(${email}): ${error?.message}`)
  return { id: data.user.id, email, password: PW }
}

async function createHotel(
  accountId: string,
  name: string,
  slug: string,
  roomNumbers: string[],
): Promise<HotelHandle> {
  const admin = serviceClient()
  const { data: hotel, error } = await admin
    .from('hotels')
    .insert({ name, slug, account_id: accountId, policies: { pinLength: 6 } })
    .select('id')
    .single()
  if (error || !hotel) throw new Error(`createHotel(${slug}): ${error?.message}`)

  const rooms: Record<string, string> = {}
  for (const number of roomNumbers) {
    const { data: room, error: roomErr } = await admin
      .from('rooms')
      .insert({ hotel_id: hotel.id, number, floor: Number(number[0]) || 0 })
      .select('id')
      .single()
    if (error || !room) throw new Error(`createRoom(${slug}/${number}): ${roomErr?.message}`)
    await admin.from('room_states').insert({ room_id: room.id, hotel_id: hotel.id })
    rooms[number] = room.id
  }
  return { id: hotel.id, slug, name, rooms }
}

/**
 * Management-Nutzer: Auth-Konto + `profiles`-Zeile.
 *
 * Die profiles-Zeile ist auch für Management PFLICHT — `stays.created_by` und
 * `service_orders.done_by` zeigen darauf. Der Zugriff hängt dagegen an
 * `account_members` / `hotel_members`.
 */
async function createManagementUser(
  email: string,
  displayName: string,
  stammhausId: string,
): Promise<UserHandle> {
  const user = await createAuthUser(email)
  const admin = serviceClient()
  const { error } = await admin
    .from('profiles')
    .insert({ id: user.id, hotel_id: stammhausId, display_name: displayName })
  if (error) throw new Error(`profiles(${email}): ${error.message}`)
  return user
}

async function createMaid(
  hotelId: string,
  username: string,
  displayName: string,
): Promise<UserHandle & { username: string }> {
  const email = buildMaidEmail(username, hotelId)
  const user = await createAuthUser(email)
  const admin = serviceClient()
  const { error } = await admin
    .from('profiles')
    .insert({ id: user.id, hotel_id: hotelId, display_name: displayName, username })
  if (error) throw new Error(`maid profiles(${email}): ${error.message}`)
  return { ...user, username }
}

export async function buildWorld(): Promise<World> {
  await resetDatabase()
  const admin = serviceClient()

  const account = async (name: string) => {
    const { data, error } = await admin.from('accounts').insert({ name }).select('id').single()
    if (error || !data) throw new Error(`createAccount(${name}): ${error?.message}`)
    return data.id as string
  }

  // ── Konto Alpha ────────────────────────────────────────────────────────
  const alphaId = await account('Konto Alpha')
  const a1 = await createHotel(alphaId, 'Alpha Eins', 'test-alpha-eins', ['101', '102'])
  const a2 = await createHotel(alphaId, 'Alpha Zwei', 'test-alpha-zwei', ['201'])

  const alphaOwner = await createManagementUser('alpha-owner@test.local', 'Alpha Inhaber', a1.id)
  await admin.from('account_members').insert({
    account_id: alphaId, user_id: alphaOwner.id, role: 'owner', display_name: 'Alpha Inhaber',
  })

  // Manager NUR für A2 — die Teilmenge ist der Kern der Rolle.
  const alphaManager = await createManagementUser('alpha-manager@test.local', 'Alpha Manager', a2.id)
  await admin.from('hotel_members').insert({
    hotel_id: a2.id, user_id: alphaManager.id, role: 'manager', display_name: 'Alpha Manager',
  })

  const alphaReception = await createManagementUser('alpha-reception@test.local', 'Alpha Rezeption', a1.id)
  await admin.from('hotel_members').insert({
    hotel_id: a1.id, user_id: alphaReception.id, role: 'reception', display_name: 'Alpha Rezeption',
  })

  const alphaMaid = await createMaid(a1.id, 'maria', 'Maria Alpha')

  // ── Konto Beta ─────────────────────────────────────────────────────────
  const betaId = await account('Konto Beta')
  const b1 = await createHotel(betaId, 'Beta Eins', 'test-beta-eins', ['101'])

  const betaOwner = await createManagementUser('beta-owner@test.local', 'Beta Inhaber', b1.id)
  await admin.from('account_members').insert({
    account_id: betaId, user_id: betaOwner.id, role: 'owner', display_name: 'Beta Inhaber',
  })

  const betaMaid = await createMaid(b1.id, 'maria', 'Maria Beta')

  return {
    alpha: { accountId: alphaId, owner: alphaOwner, manager: alphaManager, reception: alphaReception, maid: alphaMaid, a1, a2 },
    beta: { accountId: betaId, owner: betaOwner, maid: betaMaid, b1 },
  }
}
