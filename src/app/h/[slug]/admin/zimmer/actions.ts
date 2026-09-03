'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/utils/supabase/service'
import { getAdminContext } from '@/utils/auth'

export type CreateRoomsResult = { created?: number; skipped?: number; error?: string }

/**
 * Legt Zimmer auf einer oder mehreren Etagen an (Nummern bereits vom Client
 * expandiert, inkl. optionalem Etagen-Präfix). Bereits existierende Nummern
 * werden übersprungen — Nummern sind je Gebäudeteil unique.
 * Für jedes neue Zimmer wird die room_states-Zeile miterzeugt.
 */
export async function createRoomsAction(
  slug: string,
  building: string | null,
  groups: { floor: number; numbers: string[] }[],
): Promise<CreateRoomsResult> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }

  if (!Array.isArray(groups) || groups.length === 0) {
    return { error: 'Keine Zimmernummern angegeben.' }
  }
  // Über alle Etagen deduplizieren (Nummern sind je Gebäudeteil unique,
  // ein Aufruf betrifft genau einen Gebäudeteil) — erste Etage gewinnt,
  // Rest zählt als übersprungen.
  const seen = new Set<string>()
  const rows: { floor: number; number: string }[] = []
  let requested = 0
  for (const g of groups) {
    if (!Number.isInteger(g.floor)) return { error: 'Ungültige Etage.' }
    for (const raw of g.numbers) {
      const number = raw.trim()
      if (!number) continue
      requested++
      if (seen.has(number)) continue
      seen.add(number)
      rows.push({ floor: g.floor, number })
    }
  }
  if (requested === 0) return { error: 'Keine Zimmernummern angegeben.' }
  if (requested > 500) return { error: 'Maximal 500 Zimmer pro Vorgang.' }

  const admin = createAdminClient()
  const trimmedBuilding = building?.trim() || null

  const { data: inserted, error: insErr } = await admin
    .from('rooms')
    .upsert(
      rows.map(r => ({
        hotel_id: ctx.hotelId,
        number: r.number,
        floor: r.floor,
        building: trimmedBuilding,
      })),
      { onConflict: 'hotel_id,building,number', ignoreDuplicates: true },
    )
    .select('id')
  if (insErr) return { error: `Anlegen fehlgeschlagen: ${insErr.message}` }

  const created = inserted?.length ?? 0
  if (created > 0) {
    const { error: stateErr } = await admin
      .from('room_states')
      .upsert(
        inserted!.map(r => ({ room_id: r.id, hotel_id: ctx.hotelId })),
        { onConflict: 'room_id', ignoreDuplicates: true },
      )
    if (stateErr) return { error: `room_states-Anlage fehlgeschlagen: ${stateErr.message}` }
  }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return { created, skipped: requested - created }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bereiche: Zimmer · Etage · Gebäudeteil
//
// Alle drei Ebenen teilen sich dieselben Vorgänge (außer Betrieb nehmen,
// bearbeiten, löschen). Deshalb werden sie zu einem Bereich aufgelöst und ab
// da gleich behandelt — sonst driften die Ebenen in Prüfungen und Meldungen
// auseinander, und genau daraus entsteht der Eindruck, auf einer Ebene sei
// etwas "nicht vorgesehen".
// ─────────────────────────────────────────────────────────────────────────────

export type RoomScope =
  | { kind: 'room'; roomId: string }
  | { kind: 'floor'; building: string | null; floor: number }
  | { kind: 'building'; building: string | null }

type ResolvedScope = {
  ids: string[]
  label: string
  /**
   * Was der Bediener beim Löschen mit Historie abtippen muss. Die Formulierung
   * gibt der Server vor, damit Anzeige und Prüfung nicht auseinanderlaufen.
   */
  confirmPhrase: string
}

function floorLabel(building: string | null, floor: number): string {
  return `${building ? `${building} · ` : ''}Etage ${floor}`
}

/**
 * Löst einen Bereich in Zimmer-IDs auf. Gebäudeteil `null` heißt dabei
 * ausdrücklich "ohne Gebäudeteil", nicht "beliebig".
 */
async function resolveScope(
  admin: SupabaseClient,
  hotelId: string,
  scope: RoomScope,
): Promise<{ scope?: ResolvedScope; error?: string }> {
  if (scope.kind === 'room') {
    const { data: room } = await admin
      .from('rooms').select('id, hotel_id, number').eq('id', scope.roomId).maybeSingle()
    if (!room || room.hotel_id !== hotelId) return { error: 'Zimmer nicht gefunden.' }
    return { scope: { ids: [room.id], label: `Zimmer ${room.number}`, confirmPhrase: room.number } }
  }

  if (scope.kind === 'floor') {
    if (!Number.isInteger(scope.floor)) return { error: 'Ungültige Etage.' }
    const base = admin
      .from('rooms').select('id').eq('hotel_id', hotelId).eq('floor', scope.floor)
    const { data, error } = scope.building === null
      ? await base.is('building', null)
      : await base.eq('building', scope.building)
    if (error) return { error: `Laden fehlgeschlagen: ${error.message}` }
    return {
      scope: {
        ids: (data ?? []).map(r => r.id),
        label: floorLabel(scope.building, scope.floor),
        confirmPhrase: `Etage ${scope.floor}`,
      },
    }
  }

  const base = admin.from('rooms').select('id').eq('hotel_id', hotelId)
  const { data, error } = scope.building === null
    ? await base.is('building', null)
    : await base.eq('building', scope.building)
  if (error) return { error: `Laden fehlgeschlagen: ${error.message}` }
  return {
    scope: {
      ids: (data ?? []).map(r => r.id),
      label: scope.building ?? 'Zimmer ohne Gebäudeteil',
      // Der namenlose Gebäudeteil hat keine Bezeichnung zum Abtippen.
      confirmPhrase: scope.building ?? 'LÖSCHEN',
    },
  }
}

/** Zimmer-IDs des Bereichs, die gerade belegt sind. */
async function occupiedIds(admin: SupabaseClient, roomIds: string[]): Promise<Set<string>> {
  if (roomIds.length === 0) return new Set()
  const { data } = await admin
    .from('stays').select('room_id').in('room_id', roomIds).is('checked_out_at', null)
  return new Set((data ?? []).map(s => s.room_id))
}

function auditFields(userId: string) {
  return {
    last_updated_at: new Date().toISOString(),
    last_update_source: 'admin',
    last_updated_by: userId,
  }
}

// ─── Außer Betrieb nehmen / zurückholen ──────────────────────────────────────

export type ScopeActiveResult = { changed?: number; skippedOccupied?: number; error?: string }

/**
 * Der schonende Weg: das Zimmer verschwindet von den Boards, nimmt keine
 * Check-ins mehr an und taucht in keinem QR-Aushang auf — Historie und
 * Abrechnungsgrundlage bleiben vollständig erhalten. Die Zimmernummer bleibt
 * belegt (`unique (hotel_id, building, number)` gilt weiter).
 *
 * Belegte Zimmer werden übersprungen; betrifft der Aufruf genau ein belegtes
 * Zimmer, ist die Rückmeldung ein Fehler statt einer stillen Null.
 */
export async function setScopeActiveAction(
  slug: string,
  scope: RoomScope,
  active: boolean,
): Promise<ScopeActiveResult> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }
  const admin = createAdminClient()

  const resolved = await resolveScope(admin, ctx.hotelId, scope)
  if (!resolved.scope) return { error: resolved.error }
  const { ids } = resolved.scope
  if (ids.length === 0) return { changed: 0, skippedOccupied: 0 }

  let targets = ids
  let skippedOccupied = 0
  if (!active) {
    const occupied = await occupiedIds(admin, ids)
    skippedOccupied = occupied.size
    targets = ids.filter(id => !occupied.has(id))
    if (targets.length === 0 && ids.length === 1) {
      return { error: 'Zimmer ist belegt — bitte zuerst auschecken.' }
    }
  }
  if (targets.length === 0) return { changed: 0, skippedOccupied }

  const { error } = await admin
    .from('rooms')
    .update({ deactivated_at: active ? null : new Date().toISOString() })
    .in('id', targets)
    .eq('hotel_id', ctx.hotelId)
  if (error) return { error: error.message }

  if (!active) {
    // Offene Reinigungs-Signale eines außer Betrieb genommenen Zimmers
    // stehen sonst für immer auf den Zählern.
    await admin
      .from('room_states')
      .update({
        guest_signal: 'none',
        checkout_pending: false,
        priority: false,
        cleaning_by: null,
        cleaning_started_at: null,
        ...auditFields(ctx.userId),
      })
      .in('room_id', targets)
      .eq('hotel_id', ctx.hotelId)
  }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return { changed: targets.length, skippedOccupied }
}

// ─── Bearbeiten ──────────────────────────────────────────────────────────────

/**
 * Änderbare Felder. Ein fehlendes Feld bleibt unverändert; `building: null`
 * heißt ausdrücklich "keinem Gebäudeteil zuordnen".
 */
export type ScopePatch = {
  number?: string
  floor?: number
  building?: string | null
}

export type EditScopeResult = { changed?: number; error?: string }

/**
 * Korrigieren statt neu anlegen — der häufigste Fall beim Einrichten ist der
 * Vertipper, nicht das überflüssige Zimmer.
 *
 * Unkritisch für die Historie: sie hängt an `rooms.id`, nicht an Nummer,
 * Etage oder Gebäudeteil. Auch der QR-Token bleibt gültig
 * (`room_guest_tokens.room_id`) — nur der **gedruckte** Aushang trägt danach
 * die alte Nummer und muss neu gedruckt werden.
 *
 * Die Eindeutigkeit wird von Hand geprüft, statt sie in den Unique-Index
 * laufen zu lassen: bei einer Etagen- oder Gebäude-Umbenennung wäre sonst ein
 * Teil der Zimmer schon verschoben, wenn das erste kollidiert.
 */
export async function editScopeAction(
  slug: string,
  scope: RoomScope,
  patch: ScopePatch,
): Promise<EditScopeResult> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }
  const admin = createAdminClient()

  const resolved = await resolveScope(admin, ctx.hotelId, scope)
  if (!resolved.scope) return { error: resolved.error }
  const { ids, label } = resolved.scope
  if (ids.length === 0) return { error: `${label}: keine Zimmer gefunden.` }

  const nextNumber = patch.number === undefined ? undefined : patch.number.trim()
  if (nextNumber !== undefined && !nextNumber) {
    return { error: 'Zimmernummer darf nicht leer sein.' }
  }
  if (nextNumber !== undefined && nextNumber.length > 20) {
    return { error: 'Zimmernummer ist zu lang (maximal 20 Zeichen).' }
  }
  if (nextNumber !== undefined && ids.length > 1) {
    return { error: 'Eine Zimmernummer lässt sich nur einzeln vergeben.' }
  }
  if (patch.floor !== undefined && !Number.isInteger(patch.floor)) {
    return { error: 'Ungültige Etage.' }
  }
  // `undefined` = unverändert, `null` = ausdrücklich ohne Gebäudeteil.
  const nextBuilding =
    patch.building === undefined ? undefined : (patch.building?.trim() || null)
  if (typeof nextBuilding === 'string' && nextBuilding.length > 60) {
    return { error: 'Bezeichnung des Gebäudeteils ist zu lang (maximal 60 Zeichen).' }
  }
  if (nextNumber === undefined && patch.floor === undefined && nextBuilding === undefined) {
    return { error: 'Nichts zu ändern.' }
  }

  // Alle Zimmer des Hauses laden: die betroffenen für den Zielzustand, die
  // übrigen als Kollisionspartner.
  const { data: allRooms, error: loadErr } = await admin
    .from('rooms').select('id, number, floor, building').eq('hotel_id', ctx.hotelId)
  if (loadErr) return { error: `Laden fehlgeschlagen: ${loadErr.message}` }

  const idSet = new Set(ids)
  const targets = (allRooms ?? []).filter(r => idSet.has(r.id))
  const others = (allRooms ?? []).filter(r => !idSet.has(r.id))

  const taken = new Map(others.map(r => [`${r.building ?? ''}#${r.number}`, r]))
  const planned = new Set<string>()
  const updates: { id: string; number: string; floor: number; building: string | null }[] = []

  for (const room of targets) {
    const target = {
      id: room.id,
      number: nextNumber ?? room.number,
      floor: patch.floor ?? room.floor,
      building: nextBuilding === undefined ? room.building : nextBuilding,
    }
    if (
      target.number === room.number &&
      target.floor === room.floor &&
      target.building === room.building
    ) {
      continue
    }
    const key = `${target.building ?? ''}#${target.number}`
    const blocker = taken.get(key)
    if (blocker) {
      return {
        error: `Zimmernummer ${target.number} ist ${
          target.building ? `im Gebäudeteil „${target.building}“` : 'ohne Gebäudeteil'
        } bereits vergeben (Etage ${blocker.floor}).`,
      }
    }
    if (planned.has(key)) {
      return {
        error: `Zimmernummer ${target.number} käme dabei doppelt vor — Nummern sind je Gebäudeteil eindeutig.`,
      }
    }
    planned.add(key)
    updates.push(target)
  }

  if (updates.length === 0) return { changed: 0 }

  for (const u of updates) {
    const { error } = await admin
      .from('rooms')
      .update({ number: u.number, floor: u.floor, building: u.building })
      .eq('id', u.id)
      .eq('hotel_id', ctx.hotelId)
    if (error) return { error: `Ändern fehlgeschlagen: ${error.message}` }
  }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return { changed: updates.length }
}

// ─── Löschen ─────────────────────────────────────────────────────────────────

/**
 * Was ein Löschen kostet — wird vor dem Bestätigen angezeigt, damit die
 * Entscheidung an Zahlen hängt und nicht an einem abstrakten Warnsatz.
 */
export type DeletionImpact = {
  label: string
  /** Bei belasteten Bereichen abzutippen; sonst leer. */
  confirmPhrase: string
  requiresPhrase: boolean
  rooms: number
  /** Belegte Zimmer blockieren das Löschen vollständig. */
  occupied: number
  stays: number
  ordersOpen: number
  ordersDone: number
  ordersDoneCents: number
  /** Reinigungs-Stiche: bleiben erhalten, verlieren nur den Zimmerbezug. */
  cleaningLogs: number
  transitions: number
  qrPosters: number
}

async function countByRoom(
  admin: SupabaseClient,
  table: string,
  roomIds: string[],
): Promise<number> {
  if (roomIds.length === 0) return 0
  const { count } = await admin
    .from(table).select('*', { count: 'exact', head: true }).in('room_id', roomIds)
  return count ?? 0
}

async function countOrders(
  admin: SupabaseClient,
  roomIds: string[],
  status: 'open' | 'done',
): Promise<number> {
  if (roomIds.length === 0) return 0
  const { count } = await admin
    .from('service_orders')
    .select('*', { count: 'exact', head: true })
    .in('room_id', roomIds)
    .eq('status', status)
  return count ?? 0
}

/** Summe der Preisangaben erledigter Bestellungen (reine Anzeige-Info). */
async function doneOrderCents(admin: SupabaseClient, roomIds: string[]): Promise<number> {
  if (roomIds.length === 0) return 0
  const { data } = await admin
    .from('service_orders')
    .select('items_snapshot')
    .in('room_id', roomIds)
    .eq('status', 'done')
    .limit(2000)
  let cents = 0
  for (const row of data ?? []) {
    const items = Array.isArray(row.items_snapshot) ? row.items_snapshot : []
    for (const item of items as { price_cents?: number | null }[]) {
      if (typeof item?.price_cents === 'number') cents += item.price_cents
    }
  }
  return cents
}

async function buildImpact(
  admin: SupabaseClient,
  resolved: ResolvedScope,
): Promise<DeletionImpact> {
  const { ids, label, confirmPhrase } = resolved

  const [occupied, stays, ordersOpen, ordersDone, ordersDoneCents, cleaningLogs, transitions, qrPosters] =
    await Promise.all([
      occupiedIds(admin, ids),
      countByRoom(admin, 'stays', ids),
      countOrders(admin, ids, 'open'),
      countOrders(admin, ids, 'done'),
      doneOrderCents(admin, ids),
      countByRoom(admin, 'staff_log', ids),
      countByRoom(admin, 'room_state_transitions', ids),
      countByRoom(admin, 'room_guest_tokens', ids),
    ])

  const hasHistory =
    stays > 0 || ordersOpen > 0 || ordersDone > 0 || cleaningLogs > 0 || transitions > 0

  return {
    label,
    confirmPhrase: hasHistory ? confirmPhrase : '',
    requiresPhrase: hasHistory,
    rooms: ids.length,
    occupied: occupied.size,
    stays,
    ordersOpen,
    ordersDone,
    ordersDoneCents,
    cleaningLogs,
    transitions,
    qrPosters,
  }
}

/** Vorschau für den Löschdialog — verändert nichts. */
export async function getDeletionImpactAction(
  slug: string,
  scope: RoomScope,
): Promise<{ impact?: DeletionImpact; error?: string }> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }
  const admin = createAdminClient()

  const resolved = await resolveScope(admin, ctx.hotelId, scope)
  if (!resolved.scope) return { error: resolved.error }
  if (resolved.scope.ids.length === 0) return { error: 'Keine Zimmer in diesem Bereich.' }

  return { impact: await buildImpact(admin, resolved.scope) }
}

export type DeleteScopeResult = { deleted?: number; label?: string; error?: string }

/**
 * Endgültiges Löschen — ein regulärer Vorgang, kein Notausgang.
 *
 * Was mitgeht, hängt an den Fremdschlüsseln: `stays`, `service_orders`,
 * `room_states` und `room_guest_tokens` kaskadieren mit. `staff_log` steht auf
 * `on delete set null` — die Arbeitszeiten der Reinigungskräfte **bleiben**
 * erhalten und verlieren nur den Zimmerbezug, die Auswertung bleibt also
 * vollständig. `room_state_transitions` trägt bewusst keinen Fremdschlüssel
 * (der Verlauf soll Löschungen überleben) und wird deshalb hier ausdrücklich
 * mitgelöscht — sonst bliebe unauflösbarer Müll im Haus stehen.
 *
 * Zwei Riegel bleiben: belegte Zimmer werden nie gelöscht, und ein Bereich mit
 * Historie verlangt die abgetippte Bezeichnung. Wer die Belege behalten will,
 * nimmt das Zimmer außer Betrieb — der Dialog bietet beides nebeneinander an.
 */
export async function deleteScopeAction(
  slug: string,
  scope: RoomScope,
  confirmPhrase: string,
): Promise<DeleteScopeResult> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }
  const admin = createAdminClient()

  const resolved = await resolveScope(admin, ctx.hotelId, scope)
  if (!resolved.scope) return { error: resolved.error }
  const { ids, label } = resolved.scope
  if (ids.length === 0) return { error: 'Keine Zimmer in diesem Bereich.' }

  const impact = await buildImpact(admin, resolved.scope)
  if (impact.occupied > 0) {
    return {
      error: impact.rooms === 1
        ? 'Zimmer ist belegt — bitte zuerst auschecken.'
        : `${impact.occupied} Zimmer sind belegt — bitte zuerst auschecken.`,
    }
  }
  if (impact.requiresPhrase && confirmPhrase.trim() !== impact.confirmPhrase) {
    return { error: `Bitte „${impact.confirmPhrase}“ zur Bestätigung eingeben.` }
  }

  // Ohne Fremdschlüssel gibt es hier keine Kaskade — von Hand, vor den Zimmern.
  const { error: transErr } = await admin
    .from('room_state_transitions').delete().in('room_id', ids).eq('hotel_id', ctx.hotelId)
  if (transErr) return { error: `Verlauf löschen fehlgeschlagen: ${transErr.message}` }

  const { error } = await admin
    .from('rooms').delete().in('id', ids).eq('hotel_id', ctx.hotelId)
  if (error) return { error: `Löschen fehlgeschlagen: ${error.message}` }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return { deleted: ids.length, label }
}
