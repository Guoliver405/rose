'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/utils/supabase/service'
import { getAdminContext } from '@/utils/auth'
import { ensureBillingSnapshots } from '@/utils/billing'
import { format, getMessages, intlLocale, plural } from '@/lib/i18n'
import { getLocale } from '@/utils/locale'

/**
 * Texte der Meldungen: eigene plus die gemeinsamen (`noPermission`,
 * `roomNotFound`), dazu die Bezeichnungen der Bereiche und der Sprach-Tag
 * für Pluralformen.
 */
async function messages() {
  const locale = await getLocale()
  const admin = getMessages(locale).admin
  return {
    e: { ...admin.common.errors, ...admin.rooms.errors },
    scope: admin.rooms.scope,
    intl: intlLocale(locale),
  }
}

type ScopeTexts = Awaited<ReturnType<typeof messages>>

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
  const { e } = await messages()
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: e.noPermission }

  if (!Array.isArray(groups) || groups.length === 0) {
    return { error: e.noRoomNumbers }
  }
  // Über alle Etagen deduplizieren (Nummern sind je Gebäudeteil unique,
  // ein Aufruf betrifft genau einen Gebäudeteil) — erste Etage gewinnt,
  // Rest zählt als übersprungen.
  const seen = new Set<string>()
  const rows: { floor: number; number: string }[] = []
  let requested = 0
  for (const g of groups) {
    if (!Number.isInteger(g.floor)) return { error: e.invalidFloor }
    for (const raw of g.numbers) {
      const number = raw.trim()
      if (!number) continue
      requested++
      if (seen.has(number)) continue
      seen.add(number)
      rows.push({ floor: g.floor, number })
    }
  }
  if (requested === 0) return { error: e.noRoomNumbers }
  if (requested > 500) return { error: format(e.tooMany, { max: 500 }) }

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
  if (insErr) return { error: format(e.createFailed, { message: insErr.message }) }

  const created = inserted?.length ?? 0
  if (created > 0) {
    const { error: stateErr } = await admin
      .from('room_states')
      .upsert(
        inserted!.map(r => ({ room_id: r.id, hotel_id: ctx.hotelId })),
        { onConflict: 'room_id', ignoreDuplicates: true },
      )
    if (stateErr) return { error: format(e.roomStatesFailed, { message: stateErr.message }) }
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

function floorLabel(t: ScopeTexts, building: string | null, floor: number): string {
  return building
    ? format(t.scope.floorInBuilding, { building, floor })
    : format(t.scope.floor, { floor })
}

/**
 * Löst einen Bereich in Zimmer-IDs auf. Gebäudeteil `null` heißt dabei
 * ausdrücklich "ohne Gebäudeteil", nicht "beliebig".
 */
async function resolveScope(
  admin: SupabaseClient,
  hotelId: string,
  scope: RoomScope,
  t: ScopeTexts,
): Promise<{ scope?: ResolvedScope; error?: string }> {
  const { e } = t
  if (scope.kind === 'room') {
    const { data: room } = await admin
      .from('rooms').select('id, hotel_id, number').eq('id', scope.roomId).maybeSingle()
    if (!room || room.hotel_id !== hotelId) return { error: e.roomNotFound }
    return { scope: { ids: [room.id], label: format(t.scope.room, { number: room.number }), confirmPhrase: room.number } }
  }

  if (scope.kind === 'floor') {
    if (!Number.isInteger(scope.floor)) return { error: e.invalidFloor }
    const base = admin
      .from('rooms').select('id').eq('hotel_id', hotelId).eq('floor', scope.floor)
    const { data, error } = scope.building === null
      ? await base.is('building', null)
      : await base.eq('building', scope.building)
    if (error) return { error: format(e.loadFailed, { message: error.message }) }
    return {
      scope: {
        ids: (data ?? []).map(r => r.id),
        label: floorLabel(t, scope.building, scope.floor),
        confirmPhrase: format(t.scope.confirmFloor, { floor: scope.floor }),
      },
    }
  }

  const base = admin.from('rooms').select('id').eq('hotel_id', hotelId)
  const { data, error } = scope.building === null
    ? await base.is('building', null)
    : await base.eq('building', scope.building)
  if (error) return { error: format(e.loadFailed, { message: error.message }) }
  return {
    scope: {
      ids: (data ?? []).map(r => r.id),
      label: scope.building ?? t.scope.unnamedBuilding,
      // Der namenlose Gebäudeteil hat keine Bezeichnung zum Abtippen.
      confirmPhrase: scope.building ?? t.scope.confirmUnnamedBuilding,
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
  const t = await messages()
  const { e } = t
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: e.noPermission }
  const admin = createAdminClient()

  const resolved = await resolveScope(admin, ctx.hotelId, scope, t)
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
      return { error: e.roomOccupied }
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
        clean_not_before: null,
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
  const t = await messages()
  const { e } = t
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: e.noPermission }
  const admin = createAdminClient()

  const resolved = await resolveScope(admin, ctx.hotelId, scope, t)
  if (!resolved.scope) return { error: resolved.error }
  const { ids, label } = resolved.scope
  if (ids.length === 0) return { error: format(e.noRoomsFound, { label }) }

  const nextNumber = patch.number === undefined ? undefined : patch.number.trim()
  if (nextNumber !== undefined && !nextNumber) {
    return { error: e.numberEmpty }
  }
  if (nextNumber !== undefined && nextNumber.length > 20) {
    return { error: format(e.numberTooLong, { max: 20 }) }
  }
  if (nextNumber !== undefined && ids.length > 1) {
    return { error: e.numberSingleOnly }
  }
  if (patch.floor !== undefined && !Number.isInteger(patch.floor)) {
    return { error: e.invalidFloor }
  }
  // `undefined` = unverändert, `null` = ausdrücklich ohne Gebäudeteil.
  const nextBuilding =
    patch.building === undefined ? undefined : (patch.building?.trim() || null)
  if (typeof nextBuilding === 'string' && nextBuilding.length > 60) {
    return { error: format(e.buildingTooLong, { max: 60 }) }
  }
  if (nextNumber === undefined && patch.floor === undefined && nextBuilding === undefined) {
    return { error: e.nothingToChange }
  }

  // Alle Zimmer des Hauses laden: die betroffenen für den Zielzustand, die
  // übrigen als Kollisionspartner.
  const { data: allRooms, error: loadErr } = await admin
    .from('rooms').select('id, number, floor, building').eq('hotel_id', ctx.hotelId)
  if (loadErr) return { error: format(e.loadFailed, { message: loadErr.message }) }

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
        error: target.building
          ? format(e.numberTakenInBuilding, { number: target.number, building: target.building, floor: blocker.floor })
          : format(e.numberTakenNoBuilding, { number: target.number, floor: blocker.floor }),
      }
    }
    if (planned.has(key)) {
      return {
        error: format(e.numberDuplicate, { number: target.number }),
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
    if (error) return { error: format(e.editFailed, { message: error.message }) }
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
  /** Summe erledigter Bestellungen je Währung. */
  ordersDoneAmounts: { currency: string; amount: number }[]
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
  // 'cancelled' (nicht erbracht) gehört zu den abgeschlossenen: Ein Bereich,
  // dessen Anfragen alle beim Check-out geschlossen wurden, sähe sonst
  // historienfrei aus und ließe sich ohne Abtipp-Riegel löschen.
  statuses: ('open' | 'done' | 'cancelled')[],
): Promise<number> {
  if (roomIds.length === 0) return 0
  const { count } = await admin
    .from('service_orders')
    .select('*', { count: 'exact', head: true })
    .in('room_id', roomIds)
    .in('status', statuses)
  return count ?? 0
}

/**
 * Summe der Preisangaben erledigter Bestellungen (reine Anzeige-Info), je
 * Währung — die Geschichte eines Zimmers kann einen Währungswechsel des
 * Hauses enthalten, und Euro plus Baht ergibt keine Zahl.
 */
async function doneOrderAmounts(admin: SupabaseClient, roomIds: string[]): Promise<{ currency: string; amount: number }[]> {
  if (roomIds.length === 0) return []
  const { data } = await admin
    .from('service_orders')
    .select('items_snapshot, currency')
    .in('room_id', roomIds)
    .eq('status', 'done')
    .limit(2000)
  const sums = new Map<string, number>()
  for (const row of data ?? []) {
    const items = Array.isArray(row.items_snapshot) ? row.items_snapshot : []
    const currency = (row.currency as string | null) ?? 'EUR'
    for (const item of items as { price_cents?: number | null }[]) {
      if (typeof item?.price_cents === 'number') sums.set(currency, (sums.get(currency) ?? 0) + item.price_cents)
    }
  }
  return [...sums].filter(([, amount]) => amount > 0).map(([currency, amount]) => ({ currency, amount }))
}

async function buildImpact(
  admin: SupabaseClient,
  resolved: ResolvedScope,
): Promise<DeletionImpact> {
  const { ids, label, confirmPhrase } = resolved

  const [occupied, stays, ordersOpen, ordersDone, ordersDoneAmounts, cleaningLogs, transitions, qrPosters] =
    await Promise.all([
      occupiedIds(admin, ids),
      countByRoom(admin, 'stays', ids),
      countOrders(admin, ids, ['open']),
      countOrders(admin, ids, ['done', 'cancelled']),
      doneOrderAmounts(admin, ids),
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
    ordersDoneAmounts,
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
  const t = await messages()
  const { e } = t
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: e.noPermission }
  const admin = createAdminClient()

  const resolved = await resolveScope(admin, ctx.hotelId, scope, t)
  if (!resolved.scope) return { error: resolved.error }
  if (resolved.scope.ids.length === 0) return { error: e.noRoomsInScope }

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
  const t = await messages()
  const { e } = t
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: e.noPermission }
  const admin = createAdminClient()

  const resolved = await resolveScope(admin, ctx.hotelId, scope, t)
  if (!resolved.scope) return { error: resolved.error }
  const { ids, label } = resolved.scope
  if (ids.length === 0) return { error: e.noRoomsInScope }

  const impact = await buildImpact(admin, resolved.scope)
  if (impact.occupied > 0) {
    return {
      error: impact.rooms === 1
        ? e.roomOccupied
        : plural(t.intl, impact.occupied, e.roomsOccupied),
    }
  }
  if (impact.requiresPhrase && confirmPhrase.trim() !== impact.confirmPhrase) {
    return { error: format(e.confirmMismatch, { phrase: impact.confirmPhrase }) }
  }

  // Abrechnungsstand festschreiben, BEVOR die Grundlage verschwindet: die
  // Zimmerzahl abgeschlossener Perioden wird aus `rooms` abgeleitet, ein
  // gelöschtes Zimmer fehlte dort sonst rückwirkend. Schlägt das fehl, wird
  // nicht gelöscht — ein Beleg, der erst nach dem Löschen entsteht, ist keiner.
  const snap = await ensureBillingSnapshots(ctx.accountId)
  if (snap.error) {
    return { error: format(e.snapshotFailed, { message: snap.error }) }
  }

  // Ohne Fremdschlüssel gibt es hier keine Kaskade — von Hand, vor den Zimmern.
  const { error: transErr } = await admin
    .from('room_state_transitions').delete().in('room_id', ids).eq('hotel_id', ctx.hotelId)
  if (transErr) return { error: format(e.historyDeleteFailed, { message: transErr.message }) }

  const { error } = await admin
    .from('rooms').delete().in('id', ids).eq('hotel_id', ctx.hotelId)
  if (error) return { error: format(e.deleteFailed, { message: error.message }) }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return { deleted: ids.length, label }
}
