import { cookies } from 'next/headers'
import { createAdminClient } from '@/utils/supabase/service'

/**
 * Gast-Session: Cookie trägt den `stays.session_token` des Aufenthalts.
 * Check-out beendet den Stay → der Lookup schlägt fehl → Zugang tot.
 * Gäste sind anonym (kein Supabase-Auth), alle Zugriffe laufen
 * serverseitig über den Admin-Client.
 */
export const GUEST_COOKIE = 'rose_guest'

export type GuestContext = {
  stayId: string
  roomId: string
  roomNumber: string
  hotelId: string
  hotelName: string
  guestSignal: 'none' | 'please_clean' | 'dnd'
  cleaningActive: boolean
}

export async function getGuestContext(): Promise<GuestContext | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(GUEST_COOKIE)?.value
  if (!token) return null

  const admin = createAdminClient()
  const { data: stay } = await admin
    .from('stays')
    .select('id, room_id, hotel_id')
    .eq('session_token', token)
    .is('checked_out_at', null)
    .maybeSingle()
  if (!stay) return null

  const [{ data: room }, { data: state }, { data: hotel }] = await Promise.all([
    admin.from('rooms').select('number').eq('id', stay.room_id).single(),
    admin.from('room_states').select('guest_signal, cleaning_by').eq('room_id', stay.room_id).maybeSingle(),
    admin.from('hotels').select('name').eq('id', stay.hotel_id).single(),
  ])
  if (!room) return null

  return {
    stayId: stay.id,
    roomId: stay.room_id,
    roomNumber: room.number,
    hotelId: stay.hotel_id,
    hotelName: hotel?.name ?? 'Hotel',
    guestSignal: (state?.guest_signal ?? 'none') as GuestContext['guestSignal'],
    cleaningActive: Boolean(state?.cleaning_by),
  }
}
