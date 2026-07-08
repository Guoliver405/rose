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

  // Zimmer auflösen: QR-Deep-Link-Token (eindeutig) ODER Zimmernummer.
  // Nummern sind nur je Gebäudeteil eindeutig — dieselbe Nummer kann in
  // mehreren Gebäuden existieren; dann entscheidet die PIN, welcher
  // Aufenthalt gemeint ist.
  let roomIds: string[] = []
  if (input.roomToken) {
    const { data } = await admin
      .from('room_guest_tokens').select('room_id').eq('token', input.roomToken).maybeSingle()
    if (data?.room_id) roomIds = [data.room_id]
  } else if (input.roomNumber?.trim()) {
    const { data } = await admin
      .from('rooms').select('id').ilike('number', input.roomNumber.trim()).limit(10)
    roomIds = (data ?? []).map(r => r.id)
  }
  if (roomIds.length === 0) return FAIL

  const { data: candidates } = await admin
    .from('stays')
    .select('id, pin, session_token, pin_attempts, pin_locked_until')
    .in('room_id', roomIds)
    .is('checked_out_at', null)
  if (!candidates || candidates.length === 0) return FAIL

  // Rate-Limit je Aufenthalt: 5 Fehlversuche → 15 Minuten Sperre.
  // Gesperrte Aufenthalte nehmen nicht an der PIN-Prüfung teil.
  const nowMs = Date.now()
  const unlocked = candidates.filter(
    s => !s.pin_locked_until || new Date(s.pin_locked_until).getTime() <= nowMs,
  )
  if (unlocked.length === 0) {
    const latest = Math.max(...candidates.map(s => new Date(s.pin_locked_until!).getTime()))
    const mins = Math.max(1, Math.ceil((latest - nowMs) / 60000))
    return { error: `Zu viele Fehlversuche — bitte in ${mins} Min. erneut versuchen.` }
  }

  const stay = unlocked.find(s => s.pin === pin)
  if (!stay) {
    for (const s of unlocked) {
      const attempts = (s.pin_attempts ?? 0) + 1
      const patch = attempts >= MAX_ATTEMPTS
        ? { pin_attempts: 0, pin_locked_until: new Date(nowMs + LOCK_MINUTES * 60000).toISOString() }
        : { pin_attempts: attempts }
      await admin.from('stays').update(patch).eq('id', s.id)
    }
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

/**
 * Service-Bestellung des Gastes. `items_snapshot` friert Name + Preis der
 * gewählten Optionen zum Bestellzeitpunkt ein — spätere Baukasten-Änderungen
 * verfälschen alte Bestellungen nicht.
 */
export async function placeOrderAction(
  serviceId: string,
  itemIds: string[],
  note: string,
): Promise<{ error?: string }> {
  const ctx = await getGuestContext()
  if (!ctx) return { error: 'Sitzung abgelaufen — bitte neu anmelden.' }

  const admin = createAdminClient()

  const { data: service } = await admin
    .from('service_definitions')
    .select('id, hotel_id, archived_at')
    .eq('id', serviceId)
    .maybeSingle()
  if (!service || service.hotel_id !== ctx.hotelId || service.archived_at) {
    return { error: 'Dieser Service ist nicht mehr verfügbar.' }
  }

  const { data: activeItems } = await admin
    .from('service_items')
    .select('id, label, price_cents')
    .eq('service_id', serviceId)
    .is('archived_at', null)

  const hasItems = (activeItems ?? []).length > 0
  const chosen = (activeItems ?? []).filter(i => itemIds.includes(i.id))
  if (hasItems && chosen.length === 0) {
    return { error: 'Bitte mindestens eine Option auswählen.' }
  }

  const trimmedNote = note.trim().slice(0, 500)
  const { error } = await admin.from('service_orders').insert({
    hotel_id: ctx.hotelId,
    room_id: ctx.roomId,
    stay_id: ctx.stayId,
    service_id: serviceId,
    items_snapshot: chosen.map(i => ({ label: i.label, price_cents: i.price_cents })),
    note: trimmedNote || null,
  })
  if (error) return { error: 'Bestellung fehlgeschlagen — bitte erneut versuchen.' }

  revalidatePath('/guest/status')
  return {}
}

export async function guestLogoutAction(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(GUEST_COOKIE, '', { maxAge: 0, path: '/' })
  redirect('/guest')
}
