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
  building: string | null,
  groups: { floor: number; numbers: string[] }[],
): Promise<CreateRoomsResult> {
  const ctx = await getAdminContext()
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

  revalidatePath('/admin', 'layout')
  return { created, skipped: requested - created }
}

export type DeleteFloorResult = { deleted?: number; skippedOccupied?: number; error?: string }

/**
 * Löscht alle Zimmer einer Etage (innerhalb eines Gebäudeteils). Belegte
 * Zimmer bleiben stehen und werden als übersprungen gemeldet.
 */
export async function deleteFloorRoomsAction(
  building: string | null,
  floor: number,
): Promise<DeleteFloorResult> {
  const ctx = await getAdminContext()
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
  if (!floorRooms || floorRooms.length === 0) return { deleted: 0, skippedOccupied: 0 }

  const roomIds = floorRooms.map(r => r.id)
  const { data: activeStays } = await admin
    .from('stays').select('room_id').in('room_id', roomIds).is('checked_out_at', null)
  const occupied = new Set((activeStays ?? []).map(s => s.room_id))
  const deletable = roomIds.filter(id => !occupied.has(id))

  if (deletable.length > 0) {
    // Cascade räumt room_states, room_guest_tokens, stays, service_orders mit ab.
    const { error } = await admin.from('rooms').delete().in('id', deletable)
    if (error) return { error: `Löschen fehlgeschlagen: ${error.message}` }
  }

  revalidatePath('/admin', 'layout')
  return { deleted: deletable.length, skippedOccupied: occupied.size }
}

export async function deleteRoomAction(roomId: string): Promise<{ error?: string }> {
  const ctx = await getAdminContext()
  if (!ctx) return { error: 'Keine Berechtigung.' }
  const admin = createAdminClient()

  const { data: room } = await admin
    .from('rooms').select('id, hotel_id').eq('id', roomId).single()
  if (!room || room.hotel_id !== ctx.hotelId) return { error: 'Zimmer nicht gefunden.' }

  const { data: activeStay } = await admin
    .from('stays').select('id').eq('room_id', roomId).is('checked_out_at', null).maybeSingle()
  if (activeStay) return { error: 'Zimmer ist belegt — bitte zuerst auschecken.' }

  // Cascade räumt room_states, room_guest_tokens, stays, service_orders mit ab.
  const { error } = await admin.from('rooms').delete().eq('id', roomId)
  if (error) return { error: `Löschen fehlgeschlagen: ${error.message}` }

  revalidatePath('/admin', 'layout')
  return {}
}
