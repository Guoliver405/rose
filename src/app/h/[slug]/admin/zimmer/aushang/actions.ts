'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/service'
import { getAdminContext, getManagementContext } from '@/utils/auth'
import { generateToken } from '@/lib/ids'
import { getMessages } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'

/** Meldungen der Aushang-Seite in der Sprache der Anfrage. */
async function messages() {
  return getMessages(await getAdminLocale()).print.roomSigns.errors
}

/**
 * Fehlende Zimmer-QR-Tokens erzeugen (idempotent): bestehende Tokens
 * bleiben unangetastet — bereits aufgehängte Aushänge werden nicht
 * versehentlich invalidiert.
 */
export async function ensureRoomTokensAction(slug: string): Promise<{ created?: number; error?: string }> {
  const e = await messages()
  const ctx = await getManagementContext(slug)
  if (!ctx) return { error: e.notSignedIn }
  const admin = createAdminClient()

  const [{ data: rooms }, { data: existing }] = await Promise.all([
    admin.from('rooms').select('id').eq('hotel_id', ctx.hotelId),
    admin.from('room_guest_tokens').select('room_id').eq('hotel_id', ctx.hotelId),
  ])

  const have = new Set((existing ?? []).map(t => t.room_id))
  const missing = (rooms ?? []).filter(r => !have.has(r.id))
  if (missing.length === 0) return { created: 0 }

  const { error } = await admin.from('room_guest_tokens').insert(
    missing.map(r => ({ room_id: r.id, hotel_id: ctx.hotelId, token: generateToken(24) })),
  )
  if (error) return { error: error.message }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return { created: missing.length }
}

/**
 * Token eines Zimmers neu erzeugen — der alte QR-Aushang wird sofort
 * ungültig (z. B. wenn ein Aushang abhandengekommen ist). Invalidiert
 * Bestehendes → nur Admin; Rezeption darf Aushänge nur (nach-)drucken.
 */
export async function regenerateRoomTokenAction(slug: string, roomId: string): Promise<{ error?: string }> {
  const e = await messages()
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: e.noPermission }
  const admin = createAdminClient()

  const { data: room } = await admin
    .from('rooms').select('id, hotel_id').eq('id', roomId).maybeSingle()
  if (!room || room.hotel_id !== ctx.hotelId) return { error: e.roomNotFound }

  const { error } = await admin.from('room_guest_tokens').upsert(
    { room_id: roomId, hotel_id: ctx.hotelId, token: generateToken(24) },
    { onConflict: 'room_id' },
  )
  if (error) return { error: error.message }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return {}
}
