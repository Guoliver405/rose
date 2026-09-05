import { randomBytes } from 'node:crypto'
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import { buildMaidEmail } from '@/lib/maid'

/**
 * Testwelt für die Integrationstests: **zwei Konten** mit den Kollisionen, die
 * uns in der Praxis eingeholt haben.
 *
 *   Konto Alpha
 *     Haus A1 — Zimmer 101, 102 · Rezeption · Reinigung @maria-…
 *     Haus A2 — Zimmer 201      · Manager (NUR hier)
 *     Inhaber: alle Häuser des Kontos
 *   Konto Beta
 *     Haus B1 — Zimmer 101 (gleiche Nummer wie A1!)
 *             · Reinigung mit dem GLEICHEN Benutzernamen wie in A1
 *     Inhaber: nur Beta
 *
 * Zimmernummer und Benutzername sind absichtlich doppelt vergeben — sie sind
 * laut Schema nur JE HOTEL eindeutig, und genau daran hingen die Fehler aus
 * Phase 6c.
 *
 * ── Warum diese Welt neben echten Daten leben darf ──────────────────────────
 *
 * Die Tests laufen gegen die gemeinsame Supabase-Instanz des Projekts. Damit
 * das gefahrlos ist, gilt hier eine einzige, strikt durchgehaltene Regel:
 *
 *   **Angefasst wird ausschließlich, was dieser Lauf selbst erzeugt hat.**
 *
 * Umgesetzt in drei Schichten:
 *   1. Jeder Lauf zieht eine zufällige Kennung und schreibt sie in JEDEN Namen
 *      (Konto, Slug, E-Mail, Benutzername). Zwei Läufe kollidieren nie —
 *      auch nicht lokal-gegen-CI.
 *   2. `destroyWorld()` löscht ausschließlich über eingesammelte IDs, nie über
 *      Aufzählen oder Muster.
 *   3. Vor jedem Löschen wird die Zeile gelesen und geprüft, ob sie die Kennung
 *      DIESES Laufs trägt. Trifft das nicht zu, bricht der Lauf ab, statt zu
 *      löschen. Ein Fehler in der Aufräumroutine kostet damit einen roten Test,
 *      keine Daten.
 *
 * Ein früherer Entwurf hat schlicht alle Konten und alle Auth-Nutzer der
 * Datenbank gelöscht. Das erzwang eine eigene lokale Instanz (Docker + WSL +
 * CLI) und war der einzige Grund dafür. Die Regel oben ersetzt den ganzen
 * Unterbau.
 */

/** Erkennungsmarke in jedem erzeugten Namen. Nichts Echtes trägt sie je. */
const MARKER = 'itest'

/** Muster einer vollständigen Lauf-Kennung, z. B. `itest-3f9a12`. */
const TOKEN_RE = /itest-[0-9a-f]{6}/

/** Reste eines abgestürzten Laufs gelten ab hier als verwaist. */
const STALE_MS = 2 * 60 * 60 * 1000

const PW = 'IntegrationTest!2026'

export type UserHandle = { id: string; email: string; password: string }
export type HotelHandle = { id: string; slug: string; name: string; rooms: Record<string, string> }

export type World = {
  /** Kennung dieses Laufs, z. B. `3f9a12`. Steckt in jedem erzeugten Namen. */
  runId: string
  /** Vollständige Marke, z. B. `itest-3f9a12` — der Riegel der Aufräumroutine. */
  token: string
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
  /** Was dieser Lauf erzeugt hat — die einzige Grundlage des Aufräumens. */
  createdAccountIds: string[]
  createdUserIds: string[]
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

// ── Anmeldungen bündeln ─────────────────────────────────────────────────────
//
// Supabase Auth drosselt Passwort-Anmeldungen je IP (Standard: 30 in fünf
// Minuten). Vor der Bündelung meldete sich jeder Test einzeln an — rund 40
// Anmeldungen je Lauf, zwei Läufe kurz nacheinander rissen das Limit
// („Request rate limit reached"). Deshalb wird je Nutzer und Testdatei genau
// EINMAL angemeldet und die Sitzung danach wiederverwendet.
//
// Das ist fachlich sogar die schärfere Probe: Die RLS-Funktionen und die Guards
// schauen bei jedem Zugriff in die Tabellen, nicht ins Token — ein Rechte-Entzug
// muss also auch für eine BEREITS OFFENE Sitzung gelten. Genau das prüfen die
// „vorher/nachher"-Tests jetzt mit demselben Token.
//
// Der Cache lebt im Modul, und Vitest lädt jede Testdatei isoliert — er ist
// damit je Datei, so wie die Welt selbst.

const sessions = new Map<string, Session>()

/**
 * Sitzung eines Nutzers — angemeldet wird nur beim ersten Aufruf je Datei.
 * Ein Token, das in unter einer Minute abliefe, wird erneuert; in der Praxis
 * läuft keine Testdatei so lange.
 */
export async function sessionFor(user: UserHandle): Promise<Session> {
  const cached = sessions.get(user.email)
  if (cached && (cached.expires_at ?? 0) * 1000 > Date.now() + 60_000) return cached

  const auth = anonClient()
  const { data, error } = await auth.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  })
  if (error || !data.session) throw new Error(`Anmeldung fehlgeschlagen für ${user.email}: ${error?.message}`)

  sessions.set(user.email, data.session)
  return data.session
}

/**
 * Client im Namen eines angemeldeten Nutzers — die RLS sieht dessen `auth.uid()`.
 * Genau so prüfen wir die Mandanten- und Rollengrenzen an der Quelle.
 */
export async function clientAs(user: UserHandle): Promise<SupabaseClient> {
  const session = await sessionFor(user)
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${session.access_token}` } },
    },
  )
}

// ── Aufräumen ───────────────────────────────────────────────────────────────

/**
 * Der Riegel. Jedes Löschen läuft hierdurch: trägt der gelesene Name bzw. die
 * E-Mail nicht die Kennung DIESES Laufs, wird nicht gelöscht, sondern
 * abgebrochen.
 */
function assertOwnedByRun(label: string, token: string, was: string): void {
  if (label.includes(token)) return
  throw new Error(
    `Aufräumen abgebrochen: ${was} „${label}" trägt nicht die Lauf-Kennung ${token}. ` +
    'Es wurde nichts gelöscht.',
  )
}

/**
 * Räumt genau die Zeilen ab, die `buildWorld()` erzeugt hat.
 *
 * Reihenfolge: erst die Konten (die Kaskade nimmt Häuser, Zimmer, Aufenthalte,
 * Zustände, Service-Katalog und Bestellungen mit), dann die Auth-Nutzer (die
 * Kaskade nimmt `profiles`, `account_members` und `hotel_members` mit).
 */
export async function destroyWorld(world: World): Promise<void> {
  const admin = serviceClient()

  for (const id of world.createdAccountIds) {
    const { data } = await admin.from('accounts').select('id, name').eq('id', id).maybeSingle()
    if (!data) continue
    assertOwnedByRun(data.name, world.token, 'Konto')
    await admin.from('accounts').delete().eq('id', id)
  }

  for (const id of world.createdUserIds) {
    const { data } = await admin.auth.admin.getUserById(id)
    const email = data?.user?.email
    if (!email) continue
    assertOwnedByRun(email, world.token, 'Auth-Nutzer')
    await admin.auth.admin.deleteUser(id)
  }
}

/**
 * Kehrt Reste abgestürzter Läufe auf — Läufe, die vor `destroyWorld()`
 * abgebrochen sind.
 *
 * Bewusst eng: gelöscht wird nur, was das vollständige Muster `itest-<6 hex>`
 * im Namen trägt UND älter als zwei Stunden ist. Die Altersgrenze schützt
 * einen parallel laufenden zweiten Lauf.
 */
async function sweepStaleRuns(): Promise<void> {
  const admin = serviceClient()
  const cutoff = new Date(Date.now() - STALE_MS).toISOString()

  const { data: accounts } = await admin
    .from('accounts')
    .select('id, name')
    .like('name', `${MARKER}-%`)
    .lt('created_at', cutoff)

  for (const a of accounts ?? []) {
    if (!TOKEN_RE.test(a.name)) continue
    await admin.from('accounts').delete().eq('id', a.id)
  }

  // Auth-Nutzer hängen an keiner Kaskade der Konten und müssen einzeln weg.
  for (let page = 1; page <= 20; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    const users = data?.users ?? []
    if (users.length === 0) break

    for (const u of users) {
      if (!u.email || !TOKEN_RE.test(u.email)) continue
      if (u.created_at && u.created_at > cutoff) continue
      await admin.auth.admin.deleteUser(u.id)
    }
    if (users.length < 200) break
  }
}

// ── Aufbau ──────────────────────────────────────────────────────────────────

async function createAuthUser(email: string, tracker: string[], password = PW): Promise<UserHandle> {
  const admin = serviceClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`createUser(${email}): ${error?.message}`)
  tracker.push(data.user.id)
  return { id: data.user.id, email, password }
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
    if (roomErr || !room) throw new Error(`createRoom(${slug}/${number}): ${roomErr?.message}`)
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
  tracker: string[],
): Promise<UserHandle> {
  const user = await createAuthUser(email, tracker)
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
  tracker: string[],
  pin = PW,
): Promise<UserHandle & { username: string }> {
  // Die E-Mail baut die Anwendung selbst — Benutzername + Hotel-ID. Die
  // Lauf-Kennung steckt deshalb im Benutzernamen, damit sie auch hier greift.
  const email = buildMaidEmail(username, hotelId)
  const user = await createAuthUser(email, tracker, pin)
  const admin = serviceClient()
  const { error } = await admin
    .from('profiles')
    .insert({ id: user.id, hotel_id: hotelId, display_name: displayName, username })
  if (error) throw new Error(`maid profiles(${email}): ${error.message}`)
  return { ...user, username }
}

export async function buildWorld(): Promise<World> {
  await sweepStaleRuns()

  const runId = randomBytes(3).toString('hex')
  const token = `${MARKER}-${runId}`
  const admin = serviceClient()

  const createdAccountIds: string[] = []
  const createdUserIds: string[] = []

  const account = async (name: string) => {
    const { data, error } = await admin.from('accounts').insert({ name }).select('id').single()
    if (error || !data) throw new Error(`createAccount(${name}): ${error?.message}`)
    createdAccountIds.push(data.id as string)
    return data.id as string
  }

  // ── Konto Alpha ────────────────────────────────────────────────────────
  const alphaId = await account(`${token}-alpha`)
  const a1 = await createHotel(alphaId, `${token} Alpha Eins`, `${token}-alpha-eins`, ['101', '102'])
  const a2 = await createHotel(alphaId, `${token} Alpha Zwei`, `${token}-alpha-zwei`, ['201'])

  const alphaOwner = await createManagementUser(
    `${token}-alpha-owner@rose-itest.local`, 'Alpha Inhaber', a1.id, createdUserIds,
  )
  await admin.from('account_members').insert({
    account_id: alphaId, user_id: alphaOwner.id, role: 'owner', display_name: 'Alpha Inhaber',
  })

  // Manager NUR für A2 — die Teilmenge ist der Kern der Rolle.
  const alphaManager = await createManagementUser(
    `${token}-alpha-manager@rose-itest.local`, 'Alpha Manager', a2.id, createdUserIds,
  )
  await admin.from('hotel_members').insert({
    hotel_id: a2.id, user_id: alphaManager.id, role: 'manager', display_name: 'Alpha Manager',
  })

  const alphaReception = await createManagementUser(
    `${token}-alpha-reception@rose-itest.local`, 'Alpha Rezeption', a1.id, createdUserIds,
  )
  await admin.from('hotel_members').insert({
    hotel_id: a1.id, user_id: alphaReception.id, role: 'reception', display_name: 'Alpha Rezeption',
  })

  // Derselbe Benutzername in beiden Häusern — die Kollision ist der Testzweck.
  const maidName = `maria-${token}`
  const alphaMaid = await createMaid(a1.id, maidName, 'Maria Alpha', createdUserIds)

  // ── Konto Beta ─────────────────────────────────────────────────────────
  const betaId = await account(`${token}-beta`)
  const b1 = await createHotel(betaId, `${token} Beta Eins`, `${token}-beta-eins`, ['101'])

  const betaOwner = await createManagementUser(
    `${token}-beta-owner@rose-itest.local`, 'Beta Inhaber', b1.id, createdUserIds,
  )
  await admin.from('account_members').insert({
    account_id: betaId, user_id: betaOwner.id, role: 'owner', display_name: 'Beta Inhaber',
  })

  // Eigene PIN für die Namensvetterin: Der Login-Test muss sehen können, ob
  // die PIN aus Haus A1 im Haus B1 abgewiesen wird — mit derselben PIN in
  // beiden Häusern wäre das nicht unterscheidbar.
  const betaMaid = await createMaid(b1.id, maidName, 'Maria Beta', createdUserIds, `${PW}-beta`)

  return {
    runId,
    token,
    alpha: { accountId: alphaId, owner: alphaOwner, manager: alphaManager, reception: alphaReception, maid: alphaMaid, a1, a2 },
    beta: { accountId: betaId, owner: betaOwner, maid: betaMaid, b1 },
    createdAccountIds,
    createdUserIds,
  }
}
