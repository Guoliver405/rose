'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/service'
import { getManagementContext } from '@/utils/auth'
import { generatePin, generateToken, clampPinLength } from '@/lib/ids'
import {
  parseGuestAccessMode, roomAccessUrl, stayAccessUrl, type GuestAccessMode,
} from '@/lib/guest-access'
import { mailReady, sendGuestAccessMail } from '@/utils/mail'

export type CheckInResult = {
  /** Nur beim Verfahren `pin`. */
  pin?: string
  /** Nur beim Verfahren `link` — der individuelle Zugang dieses Aufenthalts. */
  guestToken?: string
  accessMode?: GuestAccessMode
  warning?: { reasons: string[] }
  error?: string
}

/** Attribution-Trio für room_states-Writes (Audit-Trigger liest source/by). */
function auditFields(userId: string) {
  return {
    last_updated_at: new Date().toISOString(),
    last_update_source: 'admin',
    last_updated_by: userId,
  }
}

/**
 * Check-in per Klick: erzeugt den anonymen Stay + Gast-PIN.
 * Ohne `force` kommt bei ungereinigtem Zimmer eine Warnung zurück
 * (Override-Pattern aus HotCord).
 */
export async function checkInAction(slug: string, roomId: string, force = false): Promise<CheckInResult> {
  const ctx = await getManagementContext(slug)
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const { data: room } = await admin
    .from('rooms').select('id, hotel_id, number, deactivated_at').eq('id', roomId).single()
  if (!room || room.hotel_id !== ctx.hotelId) return { error: 'Zimmer nicht gefunden.' }
  if (room.deactivated_at) {
    return { error: 'Zimmer ist außer Betrieb — erst unter Einstellungen → Zimmer zurückholen.' }
  }

  const { data: activeStay } = await admin
    .from('stays').select('id').eq('room_id', roomId).is('checked_out_at', null).maybeSingle()
  if (activeStay) return { error: 'Zimmer ist bereits belegt.' }

  if (!force) {
    const { data: state } = await admin
      .from('room_states')
      .select('checkout_pending, cleaning_by, priority')
      .eq('room_id', roomId)
      .maybeSingle()

    const reasons: string[] = []
    if (state?.checkout_pending) reasons.push('Das Zimmer ist seit dem letzten Check-out noch nicht gereinigt.')
    if (state?.priority) reasons.push('Für das Zimmer ist eine priorisierte Reinigung offen.')
    if (state?.cleaning_by) reasons.push('Das Zimmer wird gerade gereinigt.')
    if (reasons.length > 0) return { warning: { reasons } }
  }

  const { data: hotel } = await admin
    .from('hotels').select('policies').eq('id', ctx.hotelId).single()
  const policies = (hotel?.policies ?? {}) as Record<string, unknown>

  // Das Verfahren wird HIER festgehalten und nicht bei jedem Zugriff neu aus
  // den Policies gelesen. Dadurch behalten laufende Aufenthalte ihren
  // ausgegebenen Zugang, wenn das Haus die Einstellung wechselt — erst der
  // nächste Check-in folgt dem neuen Verfahren.
  const accessMode = parseGuestAccessMode(policies)

  let pin: string | null = null
  let guestToken: string | null = null

  if (accessMode === 'pin') {
    const pinLength = clampPinLength(policies.pinLength as number | undefined)

    // PIN darf nicht mit einem aktiven Aufenthalt auf einem Zimmer GLEICHER
    // Nummer kollidieren (Nummern sind nur je Gebäudeteil eindeutig; der
    // Gast-Login löst Duplikate über die PIN auf).
    // ZWINGEND auf das eigene Hotel eingrenzen: ohne den Filter liest der
    // Admin-Client (RLS-Bypass) Klartext-PINs fremder Mandanten.
    const { data: sameNumberRooms } = await admin
      .from('rooms')
      .select('id')
      .eq('hotel_id', ctx.hotelId)
      .ilike('number', room.number)
      .neq('id', roomId)
      .limit(10)
    const takenPins = new Set<string>()
    if (sameNumberRooms && sameNumberRooms.length > 0) {
      const { data: siblingStays } = await admin
        .from('stays')
        .select('pin')
        .in('room_id', sameNumberRooms.map(r => r.id))
        .is('checked_out_at', null)
      for (const s of siblingStays ?? []) if (s.pin) takenPins.add(s.pin)
    }
    pin = generatePin(pinLength)
    for (let i = 0; i < 20 && takenPins.has(pin); i++) pin = generatePin(pinLength)
  } else {
    // Beim individuellen Verfahren entsteht bewusst KEINE PIN: sie wäre ein
    // zweiter Zugangsweg, den niemand erfährt und den niemand braucht.
    guestToken = generateToken(24)
  }

  const { error: insErr } = await admin.from('stays').insert({
    hotel_id: ctx.hotelId,
    room_id: roomId,
    pin,
    guest_token: guestToken,
    access_mode: accessMode,
    session_token: generateToken(24),
    created_by: ctx.userId,
  })
  if (insErr) {
    // 23505 = Partial-Unique verletzt → paralleler Check-in gewann das Race
    if (insErr.code === '23505') return { error: 'Zimmer ist bereits belegt.' }
    return { error: `Check-in fehlgeschlagen: ${insErr.message}` }
  }

  // Stale Gast-Signale des Vorgängers sterben mit dem neuen Check-in.
  await admin.from('room_states')
    .update({ guest_signal: 'none', ...auditFields(ctx.userId) })
    .eq('room_id', roomId)
    .eq('hotel_id', ctx.hotelId)

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return { pin: pin ?? undefined, guestToken: guestToken ?? undefined, accessMode }
}

/** Check-out per Klick: beendet den Stay (PIN + Gast-Cookie sofort tot). */
export async function checkOutAction(slug: string, roomId: string): Promise<{ error?: string }> {
  const ctx = await getManagementContext(slug)
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const { data: stay } = await admin
    .from('stays')
    .select('id, hotel_id')
    .eq('room_id', roomId)
    .is('checked_out_at', null)
    .maybeSingle()
  if (!stay || stay.hotel_id !== ctx.hotelId) return { error: 'Kein aktiver Aufenthalt auf diesem Zimmer.' }

  // checked_out_by spiegelt created_by: der Zimmer-Verlauf nennt sonst beim
  // Check-in die Person und beim Check-out nur „Rezeption".
  const { error: updErr } = await admin
    .from('stays')
    .update({ checked_out_at: new Date().toISOString(), checked_out_by: ctx.userId })
    .eq('id', stay.id)
  if (updErr) return { error: `Check-out fehlgeschlagen: ${updErr.message}` }

  await admin.from('room_states')
    .update({ checkout_pending: true, guest_signal: 'none', ...auditFields(ctx.userId) })
    .eq('room_id', roomId)
    .eq('hotel_id', ctx.hotelId)

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return {}
}

/** Priorisierte Reinigung an/aus — manueller Rezeptions-Eingriff. */
export async function setPriorityAction(slug: string, roomId: string, value: boolean): Promise<{ error?: string }> {
  const ctx = await getManagementContext(slug)
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const { error } = await admin.from('room_states')
    .update({ priority: value, ...auditFields(ctx.userId) })
    .eq('room_id', roomId)
    .eq('hotel_id', ctx.hotelId)
  if (error) return { error: error.message }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return {}
}

/**
 * Status-Korrektur der Rezeption: Reinigung als erledigt markieren.
 * Löscht checkout_pending + priority + please_clean (DND bleibt —
 * das ist ein aktives Gast-Signal, keine Reinigungs-Anforderung).
 */
export async function markCleanedAction(slug: string, roomId: string): Promise<{ error?: string }> {
  const ctx = await getManagementContext(slug)
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const { data: state } = await admin
    .from('room_states')
    .select('guest_signal')
    .eq('room_id', roomId)
    .eq('hotel_id', ctx.hotelId)
    .maybeSingle()

  const { error } = await admin.from('room_states')
    .update({
      checkout_pending: false,
      priority: false,
      guest_signal: state?.guest_signal === 'please_clean' ? 'none' : (state?.guest_signal ?? 'none'),
      cleaning_by: null,
      cleaning_started_at: null,
      ...auditFields(ctx.userId),
    })
    .eq('room_id', roomId)
    .eq('hotel_id', ctx.hotelId)
  if (error) return { error: error.message }

  // clean_done auch bei Rezeptions-Korrektur stechen — die Stayover-
  // Ableitung ("heute schon gereinigt?") liest staff_log.
  await admin.from('staff_log').insert({
    hotel_id: ctx.hotelId,
    profile_id: ctx.userId,
    room_id: roomId,
    kind: 'clean_done',
  })

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return {}
}

// ═══════════════════════════════════════════════════════════════════════════
// GAST-ZUGANG — anzeigen, drucken, mailen.
//
// Was ein Gast bekommt, hängt am Aufenthalt (`stays.access_mode`), nicht an
// der aktuellen Hotel-Einstellung: Wer beim Check-in einen Link erhalten hat,
// behält ihn auch dann, wenn das Haus danach auf das PIN-Verfahren wechselt.
// ═══════════════════════════════════════════════════════════════════════════

export type GuestAccess = {
  accessMode: GuestAccessMode
  roomNumber: string
  hotelName: string
  /** Adresse, die den Gast ins Portal bringt (Zimmer-QR bzw. Aufenthalts-Link). */
  url: string
  /** Nur beim PIN-Verfahren. */
  pin?: string
  /** Steuert, ob die Oberfläche den Mail-Versand anbietet. */
  mailReady: boolean
}

/** Zugangsdaten des laufenden Aufenthalts — für Dialog, Druck und Mail. */
export async function getGuestAccessAction(
  slug: string,
  roomId: string,
): Promise<{ access?: GuestAccess; error?: string }> {
  const ctx = await getManagementContext(slug)
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const { data: room } = await admin
    .from('rooms').select('id, hotel_id, number').eq('id', roomId).maybeSingle()
  if (!room || room.hotel_id !== ctx.hotelId) return { error: 'Zimmer nicht gefunden.' }

  const { data: stay } = await admin
    .from('stays')
    .select('pin, guest_token, access_mode')
    .eq('room_id', roomId)
    .is('checked_out_at', null)
    .maybeSingle()
  if (!stay) return { error: 'Für dieses Zimmer läuft kein Aufenthalt.' }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const mode = stay.access_mode === 'link' ? 'link' : 'pin'

  if (mode === 'link') {
    if (!stay.guest_token) return { error: 'Diesem Aufenthalt fehlt der Zugang.' }
    return {
      access: {
        accessMode: 'link',
        roomNumber: room.number,
        hotelName: ctx.hotelName,
        url: stayAccessUrl(site, stay.guest_token),
        mailReady: mailReady(),
      },
    }
  }

  // PIN-Verfahren: Der Zimmer-QR ist der Einstieg, die PIN der zweite Faktor.
  const { data: token } = await admin
    .from('room_guest_tokens').select('token').eq('room_id', roomId).maybeSingle()

  return {
    access: {
      accessMode: 'pin',
      roomNumber: room.number,
      hotelName: ctx.hotelName,
      url: token ? roomAccessUrl(site, token.token) : `${site}/h/${ctx.hotelSlug}/guest`,
      pin: stay.pin ?? undefined,
      mailReady: mailReady(),
    },
  }
}

/**
 * Zugang per Mail schicken.
 *
 * Die Adresse wird **nicht gespeichert** — sie lebt nur für die Dauer dieses
 * Aufrufs. `stays` bleibt anonym.
 */
export async function mailGuestAccessAction(
  slug: string,
  roomId: string,
  email: string,
): Promise<{ error?: string }> {
  const { access, error } = await getGuestAccessAction(slug, roomId)
  if (!access) return { error: error ?? 'Zugang nicht gefunden.' }

  return sendGuestAccessMail({
    to: email.trim(),
    hotelName: access.hotelName,
    roomNumber: access.roomNumber,
    url: access.url,
    pin: access.pin,
  })
}
