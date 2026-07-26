'use server'

import { revalidatePath } from 'next/cache'
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

/**
 * Zimmer außer Betrieb nehmen oder wieder in Betrieb setzen.
 *
 * Der Normalweg — Zimmer werden NICHT gelöscht. Hartes Löschen kaskadiert auf
 * `room_guest_tokens`, `stays`, `room_states` und `service_orders` und macht
 * eine bereits abgerechnete Periode unrekonstruierbar (Abrechnung läuft je
 * Zimmer). Ein deaktiviertes Zimmer verschwindet von den Boards, nimmt keine
 * Check-ins mehr an und taucht in keinem QR-Aushang auf — seine Historie
 * bleibt vollständig erhalten.
 *
 * Die Zimmernummer bleibt belegt: `unique (hotel_id, building, number)` gilt
 * weiter, ein deaktiviertes Zimmer gibt seine Nummer also nicht frei.
 */
export async function setRoomActiveAction(
  slug: string,
  roomId: string,
  active: boolean,
): Promise<{ error?: string }> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }
  const admin = createAdminClient()

  const { data: room } = await admin
    .from('rooms').select('id, hotel_id, number').eq('id', roomId).maybeSingle()
  if (!room || room.hotel_id !== ctx.hotelId) return { error: 'Zimmer nicht gefunden.' }

  if (!active) {
    const { data: activeStay } = await admin
      .from('stays').select('id').eq('room_id', roomId).is('checked_out_at', null).maybeSingle()
    if (activeStay) return { error: 'Zimmer ist belegt — bitte zuerst auschecken.' }
  }

  const { error } = await admin
    .from('rooms')
    .update({ deactivated_at: active ? null : new Date().toISOString() })
    .eq('id', roomId)
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
        last_updated_at: new Date().toISOString(),
        last_update_source: 'admin',
        last_updated_by: ctx.userId,
      })
      .eq('room_id', roomId)
      .eq('hotel_id', ctx.hotelId)
  }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return {}
}

export type FloorActiveResult = { changed?: number; skippedOccupied?: number; error?: string }

/** Ganze Etage außer Betrieb nehmen bzw. zurückholen. Belegte Zimmer bleiben. */
export async function setFloorRoomsActiveAction(
  slug: string,
  building: string | null,
  floor: number,
  active: boolean,
): Promise<FloorActiveResult> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }
  if (!Number.isInteger(floor)) return { error: 'Ungültige Etage.' }

  const admin = createAdminClient()
  const trimmedBuilding = building?.trim() || null

  let roomsQuery = admin
    .from('rooms').select('id').eq('hotel_id', ctx.hotelId).eq('floor', floor)
  roomsQuery = trimmedBuilding === null
    ? roomsQuery.is('building', null)
    : roomsQuery.eq('building', trimmedBuilding)
  const { data: floorRooms, error: selErr } = await roomsQuery
  if (selErr) return { error: `Laden fehlgeschlagen: ${selErr.message}` }
  if (!floorRooms || floorRooms.length === 0) return { changed: 0, skippedOccupied: 0 }

  const roomIds = floorRooms.map(r => r.id)
  let targets = roomIds
  let occupiedCount = 0

  if (!active) {
    const { data: activeStays } = await admin
      .from('stays').select('room_id').in('room_id', roomIds).is('checked_out_at', null)
    const occupied = new Set((activeStays ?? []).map(s => s.room_id))
    occupiedCount = occupied.size
    targets = roomIds.filter(id => !occupied.has(id))
  }

  if (targets.length > 0) {
    const { error } = await admin
      .from('rooms')
      .update({ deactivated_at: active ? null : new Date().toISOString() })
      .in('id', targets)
      .eq('hotel_id', ctx.hotelId)
    if (error) return { error: error.message }

    if (!active) {
      await admin
        .from('room_states')
        .update({
          guest_signal: 'none',
          checkout_pending: false,
          priority: false,
          cleaning_by: null,
          cleaning_started_at: null,
          last_updated_at: new Date().toISOString(),
          last_update_source: 'admin',
          last_updated_by: ctx.userId,
        })
        .in('room_id', targets)
        .eq('hotel_id', ctx.hotelId)
    }
  }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return { changed: targets.length, skippedOccupied: occupiedCount }
}

/**
 * Notausgang für Fehlanlagen: Zimmer endgültig löschen.
 *
 * Nur erlaubt, solange das Zimmer **keine Historie** hat — kein Aufenthalt,
 * keine Service-Anfrage, kein Reinigungs-Stich, keine Status-Änderung. Sobald
 * etwas daran hängt, ist Deaktivieren der einzige Weg: die Kaskade würde sonst
 * genau die Belege wegräumen, auf denen Abrechnung und Nachweis beruhen.
 */
export async function deleteRoomAction(slug: string, roomId: string): Promise<{ error?: string }> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }
  const admin = createAdminClient()

  const { data: room } = await admin
    .from('rooms').select('id, hotel_id').eq('id', roomId).maybeSingle()
  if (!room || room.hotel_id !== ctx.hotelId) return { error: 'Zimmer nicht gefunden.' }

  const [{ data: stays }, { data: orders }, { data: log }, { data: transitions }] = await Promise.all([
    admin.from('stays').select('id').eq('room_id', roomId).limit(1),
    admin.from('service_orders').select('id').eq('room_id', roomId).limit(1),
    admin.from('staff_log').select('id').eq('room_id', roomId).limit(1),
    admin.from('room_state_transitions').select('id').eq('room_id', roomId).limit(1),
  ])
  const hasHistory =
    (stays ?? []).length > 0 || (orders ?? []).length > 0 ||
    (log ?? []).length > 0 || (transitions ?? []).length > 0
  if (hasHistory) {
    return {
      error: 'Für dieses Zimmer gibt es bereits Aufenthalte oder Vorgänge — es lässt sich nur außer Betrieb nehmen, nicht löschen.',
    }
  }

  const { error } = await admin
    .from('rooms').delete().eq('id', roomId).eq('hotel_id', ctx.hotelId)
  if (error) return { error: `Löschen fehlgeschlagen: ${error.message}` }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return {}
}
