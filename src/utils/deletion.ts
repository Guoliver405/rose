/**
 * Vollständiges Löschen von Haus und Konto — die Gegenrichtung zu allem, was
 * das Projekt sonst aufbewahrt.
 *
 * Überall sonst gilt: Belege überleben. `room_state_transitions` und
 * `billing_snapshots` tragen deshalb **bewusst keine Fremdschlüssel**, damit
 * Arbeitsnachweis und Abrechnungsgrundlage das Löschen von Zimmer, Haus und
 * Konto überstehen. Genau das macht sie hier zum Problem: Ein Löschbegehren
 * („entfernt alle meine Daten") wird von der Kaskade **nicht** erfüllt.
 *
 * Drei Dinge räumt die Kaskade nicht ab, und alle drei stehen unten:
 *
 * 1. `room_state_transitions` — hängt an keinem Fremdschlüssel und enthält mit
 *    `actor_id` einen Personenbezug.
 * 2. `billing_snapshots` — ebenfalls ohne Fremdschlüssel. Enthält zwar nur
 *    Zimmerzahlen, ist ohne das Konto aber gegenstandslos.
 * 3. **`auth.users`** — das Wesentliche. `profiles` hängt per Kaskade am
 *    Auth-Konto, nicht umgekehrt: Wer das Haus löscht, verliert die Profile,
 *    während die Anmeldekonten mitsamt E-Mail-Adressen stehen bleiben. Sie
 *    müssen über die Admin-API einzeln entfernt werden.
 *
 * Alles andere (`rooms`, `stays`, `room_states`, `service_*`, `staff_log`,
 * `maid_*`, `hotel_members`, `profiles`) hängt per `on delete cascade` an
 * `hotels` bzw. `accounts` und geht von selbst mit.
 */

import { createAdminClient } from '@/utils/supabase/service'
import type { SupabaseClient } from '@supabase/supabase-js'

export type DeletionPreview = {
  hotels: { id: string; name: string }[]
  rooms: number
  stays: number
  orders: number
  staffLog: number
  transitions: number
  snapshots: number
  /** Anmeldekonten, die dabei endgültig verschwinden. */
  authUsers: number
  /**
   * Anmeldekonten, die bestehen bleiben, weil die Person noch anderswo im
   * System steht — beim Löschen eines einzelnen Hauses etwa ein Manager, der
   * weitere Häuser betreut.
   */
  authUsersKept: number
}

/** Alle Auth-Konten, die mit diesen Häusern zu tun haben. */
async function userIdsOfHotels(admin: SupabaseClient, hotelIds: string[]): Promise<Set<string>> {
  if (hotelIds.length === 0) return new Set()
  const [{ data: profiles }, { data: members }] = await Promise.all([
    admin.from('profiles').select('id').in('hotel_id', hotelIds),
    admin.from('hotel_members').select('user_id').in('hotel_id', hotelIds),
  ])
  const ids = new Set<string>()
  for (const p of profiles ?? []) ids.add(p.id as string)
  for (const m of members ?? []) ids.add(m.user_id as string)
  return ids
}

/**
 * Bleibt dieses Anmeldekonto nach dem Löschen noch gebraucht?
 *
 * Wird **nach** dem eigentlichen Löschen aufgerufen: Was dann noch auf den
 * Nutzer zeigt, gehört zu einem anderen Haus oder Konto und ist tabu.
 */
async function nochGebraucht(admin: SupabaseClient, userId: string): Promise<boolean> {
  const [{ data: profile }, { data: member }, { data: owner }] = await Promise.all([
    admin.from('profiles').select('id').eq('id', userId).limit(1),
    admin.from('hotel_members').select('user_id').eq('user_id', userId).limit(1),
    admin.from('account_members').select('user_id').eq('user_id', userId).limit(1),
  ])
  return (profile ?? []).length > 0 || (member ?? []).length > 0 || (owner ?? []).length > 0
}

async function count(admin: SupabaseClient, table: string, hotelIds: string[]): Promise<number> {
  if (hotelIds.length === 0) return 0
  const { count: n } = await admin
    .from(table).select('*', { count: 'exact', head: true }).in('hotel_id', hotelIds)
  return n ?? 0
}

async function buildPreview(
  admin: SupabaseClient,
  hotelRows: { id: string; name: string }[],
  /** Gesetzt, wenn das Konto selbst mit verschwindet (Konto-Löschung). */
  entferntesKonto?: string,
): Promise<DeletionPreview> {
  const hotelIds = hotelRows.map(h => h.id)
  const kandidaten = await userIdsOfHotels(admin, hotelIds)

  // Wer hängt außerhalb dieser Häuser noch drin? Der bleibt.
  let kept = 0
  for (const userId of kandidaten) {
    const [{ data: members }, { data: owner }, { data: profile }] = await Promise.all([
      admin.from('hotel_members').select('hotel_id').eq('user_id', userId),
      admin.from('account_members').select('account_id').eq('user_id', userId),
      admin.from('profiles').select('hotel_id').eq('id', userId).maybeSingle(),
    ])
    const draussenMitglied = (members ?? []).some(m => !hotelIds.includes(m.hotel_id as string))
    const draussenProfil =
      profile?.hotel_id !== undefined && !hotelIds.includes(profile.hotel_id as string)
    // Inhaberschaft hält den Zugang nur, wenn sie das Löschen überlebt: Beim
    // Haus-Löschen bleibt sie bestehen, beim Konto-Löschen verschwindet sie
    // mit. Ohne diese Unterscheidung zählte der Inhaber als „bleibt" und die
    // Vorschau wies ein Anmeldekonto zu wenig aus.
    const draussenInhaber = (owner ?? []).some(o => o.account_id !== entferntesKonto)
    if (draussenMitglied || draussenProfil || draussenInhaber) kept++
  }

  const [rooms, stays, orders, staffLog, transitions, snapshots] = await Promise.all([
    count(admin, 'rooms', hotelIds),
    count(admin, 'stays', hotelIds),
    count(admin, 'service_orders', hotelIds),
    count(admin, 'staff_log', hotelIds),
    count(admin, 'room_state_transitions', hotelIds),
    count(admin, 'billing_snapshots', hotelIds),
  ])

  return {
    hotels: hotelRows,
    rooms, stays, orders, staffLog, transitions, snapshots,
    authUsers: kandidaten.size - kept,
    authUsersKept: kept,
  }
}

export async function previewHotelDeletion(hotelId: string): Promise<DeletionPreview | null> {
  const admin = createAdminClient()
  const { data: hotel } = await admin.from('hotels').select('id, name').eq('id', hotelId).maybeSingle()
  if (!hotel) return null
  return buildPreview(admin, [hotel as { id: string; name: string }])
}

export async function previewAccountDeletion(accountId: string): Promise<DeletionPreview> {
  const admin = createAdminClient()
  const { data: hotels } = await admin
    .from('hotels').select('id, name').eq('account_id', accountId).order('name')

  const preview = await buildPreview(
    admin, (hotels ?? []) as { id: string; name: string }[], accountId,
  )

  // Inhaber ohne eigenes Haus tauchen in der Haus-Betrachtung nicht auf.
  const { data: owners } = await admin
    .from('account_members').select('user_id').eq('account_id', accountId)
  const hotelIds = (hotels ?? []).map(h => h.id)
  const bekannt = await userIdsOfHotels(admin, hotelIds)
  let zusaetzlich = 0
  for (const o of owners ?? []) {
    if (!bekannt.has(o.user_id as string)) zusaetzlich++
  }

  return { ...preview, authUsers: preview.authUsers + zusaetzlich }
}

/**
 * Ein Haus restlos entfernen. Reihenfolge ist wesentlich:
 * erst die kaskadenfreien Zeilen, dann das Haus (Kaskade), dann die
 * Anmeldekonten — die lassen sich erst danach zuverlässig beurteilen.
 */
async function purgeHotel(admin: SupabaseClient, hotelId: string): Promise<string | null> {
  const kandidaten = await userIdsOfHotels(admin, [hotelId])

  for (const table of ['room_state_transitions', 'billing_snapshots']) {
    const { error } = await admin.from(table).delete().eq('hotel_id', hotelId)
    if (error) return `${table}: ${error.message}`
  }

  const { error } = await admin.from('hotels').delete().eq('id', hotelId)
  if (error) return `hotels: ${error.message}`

  for (const userId of kandidaten) {
    if (await nochGebraucht(admin, userId)) continue
    const { error: authErr } = await admin.auth.admin.deleteUser(userId)
    // Ein einzelnes Auth-Konto darf den Rest nicht aufhalten; der Datenbestand
    // ist zu diesem Zeitpunkt bereits fort.
    if (authErr) console.error('[deletion] Auth-Konto blieb stehen:', userId, authErr.message)
  }
  return null
}

export async function deleteHotelData(hotelId: string): Promise<{ error?: string }> {
  const admin = createAdminClient()
  const fehler = await purgeHotel(admin, hotelId)
  return fehler ? { error: fehler } : {}
}

/**
 * Das gesamte Konto entfernen — der Fall „löscht alle meine Daten".
 *
 * Löscht auch das eigene Anmeldekonto des Inhabers; die Sitzung ist danach
 * ungültig, die aufrufende Seite muss auf die Anmeldung führen.
 */
export async function deleteAccountData(accountId: string): Promise<{ error?: string }> {
  const admin = createAdminClient()

  const { data: hotels } = await admin.from('hotels').select('id').eq('account_id', accountId)
  for (const h of hotels ?? []) {
    const fehler = await purgeHotel(admin, h.id as string)
    if (fehler) return { error: fehler }
  }

  const { data: owners } = await admin
    .from('account_members').select('user_id').eq('account_id', accountId)
  const ownerIds = (owners ?? []).map(o => o.user_id as string)

  const { error } = await admin.from('accounts').delete().eq('id', accountId)
  if (error) return { error: `accounts: ${error.message}` }

  for (const userId of ownerIds) {
    if (await nochGebraucht(admin, userId)) continue
    const { error: authErr } = await admin.auth.admin.deleteUser(userId)
    if (authErr) console.error('[deletion] Auth-Konto blieb stehen:', userId, authErr.message)
  }

  return {}
}
