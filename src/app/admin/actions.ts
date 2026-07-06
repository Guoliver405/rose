'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/service'
import { getManagementContext } from '@/utils/auth'
import { generatePin, generateToken, clampPinLength } from '@/lib/ids'

export type CheckInResult = {
  pin?: string
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
export async function checkInAction(roomId: string, force = false): Promise<CheckInResult> {
  const ctx = await getManagementContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const { data: room } = await admin
    .from('rooms').select('id, hotel_id').eq('id', roomId).single()
  if (!room || room.hotel_id !== ctx.hotelId) return { error: 'Zimmer nicht gefunden.' }

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
  const policies = (hotel?.policies ?? {}) as { pinLength?: number }
  const pin = generatePin(clampPinLength(policies.pinLength))

  const { error: insErr } = await admin.from('stays').insert({
    hotel_id: ctx.hotelId,
    room_id: roomId,
    pin,
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

  revalidatePath('/admin', 'layout')
  return { pin }
}

/** Check-out per Klick: beendet den Stay (PIN + Gast-Cookie sofort tot). */
export async function checkOutAction(roomId: string): Promise<{ error?: string }> {
  const ctx = await getManagementContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const { data: stay } = await admin
    .from('stays')
    .select('id, hotel_id')
    .eq('room_id', roomId)
    .is('checked_out_at', null)
    .maybeSingle()
  if (!stay || stay.hotel_id !== ctx.hotelId) return { error: 'Kein aktiver Aufenthalt auf diesem Zimmer.' }

  const { error: updErr } = await admin
    .from('stays')
    .update({ checked_out_at: new Date().toISOString() })
    .eq('id', stay.id)
  if (updErr) return { error: `Check-out fehlgeschlagen: ${updErr.message}` }

  await admin.from('room_states')
    .update({ checkout_pending: true, guest_signal: 'none', ...auditFields(ctx.userId) })
    .eq('room_id', roomId)

  revalidatePath('/admin', 'layout')
  return {}
}

/** Priorisierte Reinigung an/aus — manueller Rezeptions-Eingriff. */
export async function setPriorityAction(roomId: string, value: boolean): Promise<{ error?: string }> {
  const ctx = await getManagementContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const { error } = await admin.from('room_states')
    .update({ priority: value, ...auditFields(ctx.userId) })
    .eq('room_id', roomId)
    .eq('hotel_id', ctx.hotelId)
  if (error) return { error: error.message }

  revalidatePath('/admin', 'layout')
  return {}
}

/**
 * Status-Korrektur der Rezeption: Reinigung als erledigt markieren.
 * Löscht checkout_pending + priority + please_clean (DND bleibt —
 * das ist ein aktives Gast-Signal, keine Reinigungs-Anforderung).
 */
export async function markCleanedAction(roomId: string): Promise<{ error?: string }> {
  const ctx = await getManagementContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const { data: state } = await admin
    .from('room_states').select('guest_signal').eq('room_id', roomId).maybeSingle()

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

  revalidatePath('/admin', 'layout')
  return {}
}
