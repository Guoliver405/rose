'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/utils/supabase/service'
import { getMaidContext, type MaidContext } from '@/utils/maid-auth'
import { deriveShiftState, type ShiftState } from '@/lib/shift'
import { clampStaleMinutes, isCleaningFresh, isRoomActive } from '@/lib/board'

type ActionResult = { error?: string }

/** Attribution-Trio für room_states-Writes (Audit-Trigger liest source/by). */
function auditFields(profileId: string) {
  return {
    last_updated_at: new Date().toISOString(),
    last_update_source: 'maid',
    last_updated_by: profileId,
  }
}

async function loadShiftState(admin: SupabaseClient, profileId: string): Promise<ShiftState> {
  const { data } = await admin
    .from('staff_log')
    .select('kind, at')
    .eq('profile_id', profileId)
    .in('kind', ['shift_start', 'shift_end', 'break_start', 'break_end'])
    .order('at', { ascending: false })
    .limit(50)
  return deriveShiftState(data ?? [])
}

async function logStitch(
  admin: SupabaseClient,
  ctx: MaidContext,
  kind: string,
  roomId: string | null = null,
): Promise<ActionResult> {
  const { error } = await admin.from('staff_log').insert({
    hotel_id: ctx.hotelId,
    profile_id: ctx.profileId,
    room_id: roomId,
    kind,
  })
  if (error) return { error: `Logging fehlgeschlagen: ${error.message}` }
  return {}
}

/** Zimmer, das diese Kraft gerade (frisch) reinigt — oder null. */
async function findMyCleaningRoom(
  admin: SupabaseClient,
  ctx: MaidContext,
): Promise<string | null> {
  const { data } = await admin
    .from('room_states')
    .select('room_id, cleaning_by, cleaning_started_at')
    .eq('cleaning_by', ctx.profileId)
    .limit(1)
    .maybeSingle()
  if (!data) return null
  const staleMinutes = clampStaleMinutes(ctx.policies.cleaningStaleMinutes)
  return isCleaningFresh(data, staleMinutes) ? data.room_id : null
}

// ── Schicht & Pause ──────────────────────────────────────────────────────────

export async function shiftStartAction(): Promise<ActionResult> {
  const ctx = await getMaidContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const shift = await loadShiftState(admin, ctx.profileId)
  if (shift.onShift) return { error: 'Schicht läuft bereits.' }

  const res = await logStitch(admin, ctx, 'shift_start')
  if (res.error) return res
  revalidatePath('/service')
  return {}
}

export async function shiftEndAction(): Promise<ActionResult> {
  const ctx = await getMaidContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const shift = await loadShiftState(admin, ctx.profileId)
  if (!shift.onShift) return { error: 'Keine laufende Schicht.' }

  // Slider-Rahmen: laufende Zimmer-Reinigung blockiert das Schichtende.
  const cleaningRoom = await findMyCleaningRoom(admin, ctx)
  if (cleaningRoom) {
    return { error: 'Erst die laufende Reinigung abschließen (oder abbrechen).' }
  }

  // Offene Pause implizit schließen — ein vergessener Pausen-Stich soll
  // das Schichtende nicht blockieren.
  if (shift.onBreak) {
    const res = await logStitch(admin, ctx, 'break_end')
    if (res.error) return res
  }

  const res = await logStitch(admin, ctx, 'shift_end')
  if (res.error) return res
  revalidatePath('/service')
  return {}
}

export async function breakToggleAction(): Promise<ActionResult> {
  const ctx = await getMaidContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const shift = await loadShiftState(admin, ctx.profileId)
  if (!shift.onShift) return { error: 'Pause nur während der Schicht.' }

  const res = await logStitch(admin, ctx, shift.onBreak ? 'break_end' : 'break_start')
  if (res.error) return res
  revalidatePath('/service')
  return {}
}

/** Sonstige Reinigung (Flur, Lobby, …): frei stechbar, wird nur geloggt. */
export async function otherCleaningAction(): Promise<ActionResult> {
  const ctx = await getMaidContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const shift = await loadShiftState(admin, ctx.profileId)
  if (!shift.onShift) return { error: 'Nur während der Schicht.' }

  const res = await logStitch(admin, ctx, 'other_cleaning')
  if (res.error) return res
  revalidatePath('/service')
  return {}
}

// ── Zimmer-Reinigung ─────────────────────────────────────────────────────────

export async function startCleaningAction(roomId: string): Promise<ActionResult> {
  const ctx = await getMaidContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const shift = await loadShiftState(admin, ctx.profileId)
  if (!shift.onShift) return { error: 'Erst die Schicht beginnen.' }

  // Slider-Logik: nach „Reinigung starten" ist nur „abschließen" erlaubt —
  // kein zweites Zimmer parallel.
  const alreadyCleaning = await findMyCleaningRoom(admin, ctx)
  if (alreadyCleaning) {
    return { error: 'Es läuft bereits eine Reinigung — erst abschließen oder abbrechen.' }
  }

  const { data: state } = await admin
    .from('room_states')
    .select('room_id, hotel_id, guest_signal, checkout_pending, priority, cleaning_by, cleaning_started_at')
    .eq('room_id', roomId)
    .maybeSingle()
  if (!state || state.hotel_id !== ctx.hotelId) return { error: 'Zimmer nicht gefunden.' }
  if (state.guest_signal === 'dnd') return { error: 'Der Gast möchte nicht gestört werden (DND).' }
  if (!isRoomActive(state)) return { error: 'Für dieses Zimmer ist keine Reinigung offen.' }

  const staleMinutes = clampStaleMinutes(ctx.policies.cleaningStaleMinutes)
  if (state.cleaning_by && isCleaningFresh(state, staleMinutes)) {
    return { error: 'Zimmer wird bereits von einer Kollegin gereinigt.' }
  }

  // Race-sicheres Claiming: Update greift nur, wenn cleaning_by noch dem
  // gelesenen Stand entspricht (null oder stale Besitzerin) — die zweite
  // Kraft, die gleichzeitig startet, bekommt 0 Zeilen zurück.
  const claim = admin
    .from('room_states')
    .update({
      cleaning_by: ctx.profileId,
      cleaning_started_at: new Date().toISOString(),
      ...auditFields(ctx.profileId),
    })
    .eq('room_id', roomId)
  const { data: claimed, error: claimErr } = await (state.cleaning_by
    ? claim.eq('cleaning_by', state.cleaning_by)
    : claim.is('cleaning_by', null)
  ).select('room_id')
  if (claimErr) return { error: claimErr.message }
  if (!claimed || claimed.length === 0) {
    return { error: 'Zimmer wurde gerade von einer Kollegin übernommen.' }
  }

  const res = await logStitch(admin, ctx, 'clean_start', roomId)
  if (res.error) return res

  revalidatePath('/service')
  revalidatePath('/admin', 'layout')
  return {}
}

export async function finishCleaningAction(roomId: string): Promise<ActionResult> {
  const ctx = await getMaidContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const { data: state } = await admin
    .from('room_states')
    .select('room_id, hotel_id, guest_signal, cleaning_by')
    .eq('room_id', roomId)
    .maybeSingle()
  if (!state || state.hotel_id !== ctx.hotelId) return { error: 'Zimmer nicht gefunden.' }
  // Auch stale Reinigungen dürfen von der Besitzerin regulär abgeschlossen werden.
  if (state.cleaning_by !== ctx.profileId) {
    return { error: 'Diese Reinigung läuft nicht auf deinen Namen.' }
  }

  const { error } = await admin
    .from('room_states')
    .update({
      checkout_pending: false,
      priority: false,
      // DND bleibt stehen — aktives Gast-Signal, keine Reinigungs-Anforderung.
      guest_signal: state.guest_signal === 'please_clean' ? 'none' : state.guest_signal,
      cleaning_by: null,
      cleaning_started_at: null,
      ...auditFields(ctx.profileId),
    })
    .eq('room_id', roomId)
  if (error) return { error: error.message }

  const res = await logStitch(admin, ctx, 'clean_done', roomId)
  if (res.error) return res

  revalidatePath('/service')
  revalidatePath('/admin', 'layout')
  return {}
}

/** Reinigung abbrechen: Zimmer fällt zurück auf offen, nichts wird erledigt. */
export async function abortCleaningAction(roomId: string): Promise<ActionResult> {
  const ctx = await getMaidContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const { data: state } = await admin
    .from('room_states')
    .select('room_id, hotel_id, cleaning_by')
    .eq('room_id', roomId)
    .maybeSingle()
  if (!state || state.hotel_id !== ctx.hotelId) return { error: 'Zimmer nicht gefunden.' }
  if (state.cleaning_by !== ctx.profileId) {
    return { error: 'Diese Reinigung läuft nicht auf deinen Namen.' }
  }

  const { error } = await admin
    .from('room_states')
    .update({
      cleaning_by: null,
      cleaning_started_at: null,
      ...auditFields(ctx.profileId),
    })
    .eq('room_id', roomId)
  if (error) return { error: error.message }

  const res = await logStitch(admin, ctx, 'clean_aborted', roomId)
  if (res.error) return res

  revalidatePath('/service')
  revalidatePath('/admin', 'layout')
  return {}
}
