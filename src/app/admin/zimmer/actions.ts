'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/service'
import { getManagementContext } from '@/utils/auth'

export type CreateRoomsResult = { created?: number; skipped?: number; error?: string }

/**
 * Legt mehrere Zimmer auf einer Etage an (Nummern-Liste, bereits vom Client
 * expandiert). Bereits existierende Nummern werden übersprungen.
 * Für jedes neue Zimmer wird die room_states-Zeile miterzeugt.
 */
export async function createRoomsAction(
  building: string | null,
  floor: number,
  numbers: string[],
): Promise<CreateRoomsResult> {
  const ctx = await getManagementContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }

  const clean = [...new Set(numbers.map(n => n.trim()).filter(Boolean))]
  if (clean.length === 0) return { error: 'Keine Zimmernummern angegeben.' }
  if (clean.length > 500) return { error: 'Maximal 500 Zimmer pro Vorgang.' }
  if (!Number.isInteger(floor)) return { error: 'Ungültige Etage.' }

  const admin = createAdminClient()
  const trimmedBuilding = building?.trim() || null

  const { data: inserted, error: insErr } = await admin
    .from('rooms')
    .upsert(
      clean.map(number => ({
        hotel_id: ctx.hotelId,
        number,
        floor,
        building: trimmedBuilding,
      })),
      { onConflict: 'hotel_id,number', ignoreDuplicates: true },
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
  return { created, skipped: clean.length - created }
}

export async function deleteRoomAction(roomId: string): Promise<{ error?: string }> {
  const ctx = await getManagementContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
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
