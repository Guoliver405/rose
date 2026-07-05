'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/service'
import { getGuestContext, GUEST_COOKIE } from '@/utils/guest'

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15

/** Generische Fehlermeldung — verrät nicht, ob Zimmer existiert/belegt ist. */
const FAIL = { error: 'Anmeldung fehlgeschlagen — Zimmernummer oder PIN falsch.' }

export type GuestLoginInput = {
  roomNumber?: string
  roomToken?: string
  pin: string
}

export async function guestLoginAction(input: GuestLoginInput): Promise<{ error?: string }> {
  const pin = (input.pin ?? '').trim()
  if (!/^\d{4,8}$/.test(pin)) return { error: 'Bitte die PIN eingeben (nur Ziffern).' }

  const admin = createAdminClient()

  // Zimmer auflösen: QR-Deep-Link-Token ODER Zimmernummer (Single-Property:
  // Nummer ist eindeutig; bei Mehrdeutigkeit über Hotels hinweg → Fehlschlag).
  let roomId: string | null = null
  if (input.roomToken) {
    const { data } = await admin
      .from('room_guest_tokens').select('room_id').eq('token', input.roomToken).maybeSingle()
    roomId = data?.room_id ?? null
  } else if (input.roomNumber?.trim()) {
    const { data } = await admin
      .from('rooms').select('id').ilike('number', input.roomNumber.trim()).limit(2)
    if (data && data.length === 1) roomId = data[0].id
  }
  if (!roomId) return FAIL

  const { data: stay } = await admin
    .from('stays')
    .select('id, pin, session_token, pin_attempts, pin_locked_until')
    .eq('room_id', roomId)
    .is('checked_out_at', null)
    .maybeSingle()
  if (!stay) return FAIL

  // Rate-Limit: 5 Fehlversuche → 15 Minuten Sperre
  if (stay.pin_locked_until && new Date(stay.pin_locked_until) > new Date()) {
    const mins = Math.max(1, Math.ceil((new Date(stay.pin_locked_until).getTime() - Date.now()) / 60000))
    return { error: `Zu viele Fehlversuche — bitte in ${mins} Min. erneut versuchen.` }
  }

  if (stay.pin !== pin) {
    const attempts = (stay.pin_attempts ?? 0) + 1
    const patch = attempts >= MAX_ATTEMPTS
      ? { pin_attempts: 0, pin_locked_until: new Date(Date.now() + LOCK_MINUTES * 60000).toISOString() }
      : { pin_attempts: attempts }
    await admin.from('stays').update(patch).eq('id', stay.id)
    return FAIL
  }

  // Erfolg: Zähler zurücksetzen + Session-Cookie setzen
  if ((stay.pin_attempts ?? 0) > 0 || stay.pin_locked_until) {
    await admin.from('stays').update({ pin_attempts: 0, pin_locked_until: null }).eq('id', stay.id)
  }

  const cookieStore = await cookies()
  cookieStore.set(GUEST_COOKIE, stay.session_token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // Cookie-Lebensdauer; effektive Grenze ist der Check-out
  })

  redirect('/guest/status')
}

/** Gast-Signal setzen: Zimmer reinigen / DND / zurücknehmen. */
export async function setGuestSignalAction(
  signal: 'none' | 'please_clean' | 'dnd',
): Promise<{ error?: string }> {
  if (!['none', 'please_clean', 'dnd'].includes(signal)) return { error: 'Ungültiges Signal.' }

  const ctx = await getGuestContext()
  if (!ctx) return { error: 'Sitzung abgelaufen — bitte neu anmelden.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('room_states')
    .update({
      guest_signal: signal,
      last_updated_at: new Date().toISOString(),
      last_update_source: 'guest',
      last_updated_by: null,
    })
    .eq('room_id', ctx.roomId)
  if (error) return { error: 'Speichern fehlgeschlagen — bitte erneut versuchen.' }

  revalidatePath('/guest/status')
  return {}
}

export async function guestLogoutAction(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(GUEST_COOKIE, '', { maxAge: 0, path: '/' })
  redirect('/guest')
}
