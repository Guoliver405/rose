'use server'

import { revalidatePath } from 'next/cache'
import { formatHHMM, parseTimeZone, zonedDateKey } from '@/lib/tz'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/utils/supabase/service'
import { getMaidContext, type MaidContext } from '@/utils/maid-auth'
import { reapStaleCleanings } from '@/utils/stale-cleaning'
import { anonymizeSession, anonymizeStale } from '@/utils/staff-tracking'
import { parseStaffTracking } from '@/lib/staff-tracking'
import { randomUUID } from 'node:crypto'
import { deriveShiftState, type ShiftState } from '@/lib/shift'
import {
  DOOR_DEFER_MINUTES, canAnswerAtDoor, clampStaleMinutes, doorDeferUntil, isCleanDeferred,
  isCleaningFresh, isRoomActive, isStayoverDue, parseStayoverPolicy, todayStartIso, type DoorChoice,
} from '@/lib/board'

type ActionResult = { error?: string }

/**
 * Board-Pfad des eigenen Mandanten. Die Revalidierung muss den Slug tragen —
 * `/service` allein ist seit dem Mandanten-Umbau keine Seite mehr.
 */
function boardPath(ctx: MaidContext): string {
  return `/h/${ctx.hotelSlug}/service`
}

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
    .select('kind, at, session_id')
    .eq('profile_id', profileId)
    .in('kind', ['shift_start', 'shift_end', 'break_start', 'break_end', 'other_start', 'other_end'])
    .order('at', { ascending: false })
    .limit(50)
  return deriveShiftState(data ?? [])
}

/**
 * Stich schreiben. `sessionId` ist der Zufallsschlüssel der laufenden
 * Schicht (aus dem shift_start-Stich): Im Team-Modus verliert der Stich
 * später seine Person, die Auswertung paart dann über die Session.
 */
async function logStitch(
  admin: SupabaseClient,
  ctx: MaidContext,
  kind: string,
  roomId: string | null,
  sessionId: string | null,
): Promise<ActionResult> {
  const { error } = await admin.from('staff_log').insert({
    hotel_id: ctx.hotelId,
    profile_id: ctx.profileId,
    room_id: roomId,
    kind,
    session_id: sessionId,
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

/** Belegung und Routine-Fälligkeit eines Zimmers — dieselbe Ableitung wie im Board-Loader. */
async function loadRoutine(
  admin: SupabaseClient,
  ctx: MaidContext,
  roomId: string,
  state: { guest_signal: 'none' | 'please_clean' | 'dnd'; clean_not_before: string | null; clean_declined_on: string | null },
): Promise<{ occupied: boolean; stayoverDue: boolean }> {
  const tz = parseTimeZone(ctx.policies)
  const [{ data: stay }, { data: handled }] = await Promise.all([
    admin
      .from('stays')
      .select('checked_in_at, expected_checkout')
      .eq('room_id', roomId)
      .is('checked_out_at', null)
      .maybeSingle(),
    admin
      .from('staff_log')
      .select('id')
      .eq('room_id', roomId)
      .eq('kind', 'clean_done')
      .gte('at', todayStartIso(new Date(), tz))
      .limit(1),
  ])
  const stayoverDue = isStayoverDue({
    policy: parseStayoverPolicy(ctx.policies),
    occupied: Boolean(stay),
    checkedInAt: stay?.checked_in_at ?? null,
    guestSignal: state.guest_signal,
    cleanedToday: (handled ?? []).length > 0,
    expectedCheckout: stay?.expected_checkout ?? null,
    cleanNotBefore: state.clean_not_before,
    cleanDeclinedOn: state.clean_declined_on,
    timeZone: tz,
  })
  return { occupied: Boolean(stay), stayoverDue }
}

// ── Schicht & Pause ──────────────────────────────────────────────────────────

export async function shiftStartAction(): Promise<ActionResult> {
  const ctx = await getMaidContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const shift = await loadShiftState(admin, ctx.profileId)
  if (shift.onShift) return { error: 'Schicht läuft bereits.' }

  // Team-Modus: Alles, was älter als 24 h ist, verliert jetzt seine Person
  // (Stale-Reaper, vergessene Schichtenden, Rezeptions-Stiche). Kein Cron —
  // der Schichtbeginn ist der Moment, in dem ohnehin geschrieben wird.
  if (parseStaffTracking(ctx.policies) === 'team') await anonymizeStale(admin, ctx.hotelId)

  const res = await logStitch(admin, ctx, 'shift_start', null, randomUUID())
  if (res.error) return res
  revalidatePath(boardPath(ctx))
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

  // Offene Pause bzw. sonstige Reinigung implizit schließen — ein
  // vergessener Stich soll das Schichtende nicht blockieren, die Zeiträume
  // müssen aber sauber enden, damit die Auswertung stimmt.
  if (shift.onBreak) {
    const res = await logStitch(admin, ctx, 'break_end', null, shift.sessionId)
    if (res.error) return res
  }
  if (shift.onOther) {
    const res = await logStitch(admin, ctx, 'other_end', null, shift.sessionId)
    if (res.error) return res
  }

  const res = await logStitch(admin, ctx, 'shift_end', null, shift.sessionId)
  if (res.error) return res

  // Etagen-Verortung endet mit der Schicht.
  await admin.from('maid_presence').delete().eq('profile_id', ctx.profileId)

  // Team-Modus: Die Stiche dieser Schicht verlieren ihre Person — jetzt, wo
  // die Zustandsmaschine sie nicht mehr braucht. Der Session-Schlüssel
  // bleibt, damit die Auswertung Schicht, Pause und Zimmer paaren kann.
  if (parseStaffTracking(ctx.policies) === 'team' && shift.sessionId) {
    await anonymizeSession(admin, ctx.hotelId, shift.sessionId)
  }

  revalidatePath(boardPath(ctx))
  revalidatePath('/admin', 'layout')
  return {}
}

// ── Etagen-Verortung ─────────────────────────────────────────────────────────

/** Auf eine Etage einbuchen — live sichtbar für Kolleginnen und Rezeption. */
export async function enterFloorAction(
  building: string | null,
  floor: number,
): Promise<ActionResult> {
  const ctx = await getMaidContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
  if (!Number.isInteger(floor)) return { error: 'Ungültige Etage.' }
  const admin = createAdminClient()

  const shift = await loadShiftState(admin, ctx.profileId)
  if (!shift.onShift) return { error: 'Erst die Schicht beginnen.' }

  const { error } = await admin.from('maid_presence').upsert(
    {
      profile_id: ctx.profileId,
      hotel_id: ctx.hotelId,
      building: building ?? null,
      floor,
      entered_at: new Date().toISOString(),
    },
    { onConflict: 'profile_id' },
  )
  if (error) return { error: `Einbuchen fehlgeschlagen: ${error.message}` }

  revalidatePath(boardPath(ctx))
  revalidatePath('/admin', 'layout')
  return {}
}

/** Etage verlassen (Zurück zur Etagen-Übersicht). */
export async function leaveFloorAction(): Promise<ActionResult> {
  const ctx = await getMaidContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  await admin.from('maid_presence').delete().eq('profile_id', ctx.profileId)

  revalidatePath(boardPath(ctx))
  revalidatePath('/admin', 'layout')
  return {}
}

export async function breakToggleAction(): Promise<ActionResult> {
  const ctx = await getMaidContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const shift = await loadShiftState(admin, ctx.profileId)
  if (!shift.onShift) return { error: 'Pause nur während der Schicht.' }

  // Tätigkeiten dürfen sich nicht überlappen, sonst zählt die Auswertung
  // dieselbe Minute doppelt: Pausenbeginn beendet die sonstige Reinigung.
  if (!shift.onBreak && shift.onOther) {
    const res = await logStitch(admin, ctx, 'other_end', null, shift.sessionId)
    if (res.error) return res
  }

  const res = await logStitch(admin, ctx, shift.onBreak ? 'break_end' : 'break_start', null, shift.sessionId)
  if (res.error) return res
  revalidatePath(boardPath(ctx))
  return {}
}

/**
 * Sonstige Reinigung (Flur, Lobby, …) als Zeitraum an/aus. Früher ein
 * einzelner Stich ohne Ende — dadurch war die Dauer nicht auswertbar.
 */
export async function otherCleaningToggleAction(): Promise<ActionResult> {
  const ctx = await getMaidContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const shift = await loadShiftState(admin, ctx.profileId)
  if (!shift.onShift) return { error: 'Nur während der Schicht.' }
  if (!shift.onOther && shift.onBreak) {
    return { error: 'Erst die Pause beenden.' }
  }

  const res = await logStitch(admin, ctx, shift.onOther ? 'other_end' : 'other_start', null, shift.sessionId)
  if (res.error) return res
  revalidatePath(boardPath(ctx))
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
    .select('room_id, hotel_id, guest_signal, clean_not_before, clean_declined_on, checkout_pending, priority, cleaning_by, cleaning_started_at')
    .eq('room_id', roomId)
    .maybeSingle()
  if (!state || state.hotel_id !== ctx.hotelId) return { error: 'Zimmer nicht gefunden.' }
  if (state.guest_signal === 'dnd') return { error: 'Der Gast möchte nicht gestört werden (DND).' }
  const tz = parseTimeZone(ctx.policies)
  if (isCleanDeferred(state)) {
    return { error: `Der Gast möchte die Reinigung erst ab ${formatHHMM(new Date(state.clean_not_before as string), tz)} Uhr.` }
  }

  // Neben den persistenten Signalen zählt auch die abgeleitete
  // Stayover-Routine als „offen" (gleiche Logik wie im Board-Loader).
  if (!isRoomActive(state)) {
    const { stayoverDue } = await loadRoutine(admin, ctx, roomId, state)
    if (!stayoverDue) return { error: 'Für dieses Zimmer ist keine Reinigung offen.' }
  }

  const staleMinutes = clampStaleMinutes(ctx.policies.cleaningStaleMinutes)
  if (state.cleaning_by && isCleaningFresh(state, staleMinutes)) {
    return { error: 'Zimmer wird bereits von einer Kollegin gereinigt.' }
  }
  // Stale Besitzerin: erst den vergessenen Abschluss festschreiben
  // (clean_aborted, Quelle system), sonst verschwände ihr Start spurlos unter
  // dem neuen Claim. Danach ist die Zeile frei (`cleaning_by` null).
  if (state.cleaning_by) {
    await reapStaleCleanings(admin, ctx.hotelId, [state], staleMinutes)
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

  // Zimmerreinigung beendet eine laufende sonstige Reinigung (keine
  // Überlappung — siehe breakToggleAction).
  if (shift.onOther) {
    const endRes = await logStitch(admin, ctx, 'other_end', null, shift.sessionId)
    if (endRes.error) return endRes
  }

  const res = await logStitch(admin, ctx, 'clean_start', roomId, shift.sessionId)
  if (res.error) return res

  revalidatePath(boardPath(ctx))
  revalidatePath('/admin', 'layout')
  return {}
}

export async function finishCleaningAction(roomId: string): Promise<ActionResult> {
  const ctx = await getMaidContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const [{ data: state }, shift] = await Promise.all([
    admin
      .from('room_states')
      .select('room_id, hotel_id, guest_signal, cleaning_by')
      .eq('room_id', roomId)
      .maybeSingle(),
    loadShiftState(admin, ctx.profileId),
  ])
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
      clean_not_before: null,
      cleaning_by: null,
      cleaning_started_at: null,
      ...auditFields(ctx.profileId),
    })
    .eq('room_id', roomId)
  if (error) return { error: error.message }

  const res = await logStitch(admin, ctx, 'clean_done', roomId, shift.sessionId)
  if (res.error) return res

  revalidatePath(boardPath(ctx))
  revalidatePath('/admin', 'layout')
  return {}
}

/** Reinigung abbrechen: Zimmer fällt zurück auf offen, nichts wird erledigt. */
export async function abortCleaningAction(roomId: string): Promise<ActionResult> {
  const ctx = await getMaidContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const [{ data: state }, shift] = await Promise.all([
    admin
      .from('room_states')
      .select('room_id, hotel_id, cleaning_by')
      .eq('room_id', roomId)
      .maybeSingle(),
    loadShiftState(admin, ctx.profileId),
  ])
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

  const res = await logStitch(admin, ctx, 'clean_aborted', roomId, shift.sessionId)
  if (res.error) return res

  revalidatePath(boardPath(ctx))
  revalidatePath('/admin', 'layout')
  return {}
}

/**
 * Gast an der Tür (26.09.2026): Die Kraft klopft, der Gast ist da und will
 * gerade keine Reinigung. „Später" (30 min / 1 h) schiebt das Zimmer auf
 * beiden Boards bis zur Uhrzeit weg — für alle Kräfte, nicht nur für die, die
 * geklopft hat. „Heute nicht" erledigt die Routine für heute, ohne als
 * Reinigung zu zählen, und nimmt einen offenen Wunsch zurück; tippt der Gast
 * später doch „Zimmer reinigen", gilt das wieder.
 */
export async function guestAtDoorAction(roomId: string, choice: DoorChoice): Promise<ActionResult> {
  const ctx = await getMaidContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
  if (choice !== 'today' && !DOOR_DEFER_MINUTES.includes(Number(choice) as 30 | 60)) {
    return { error: 'Unbekannte Auswahl.' }
  }
  const admin = createAdminClient()

  const shift = await loadShiftState(admin, ctx.profileId)
  if (!shift.onShift) return { error: 'Erst die Schicht beginnen.' }

  const { data: state } = await admin
    .from('room_states')
    .select('room_id, hotel_id, guest_signal, clean_not_before, clean_declined_on, checkout_pending, priority, cleaning_by, cleaning_started_at')
    .eq('room_id', roomId)
    .maybeSingle()
  if (!state || state.hotel_id !== ctx.hotelId) return { error: 'Zimmer nicht gefunden.' }

  const staleMinutes = clampStaleMinutes(ctx.policies.cleaningStaleMinutes)
  const { occupied, stayoverDue } = await loadRoutine(admin, ctx, roomId, state)
  const allowed = canAnswerAtDoor({
    occupied,
    checkoutPending: state.checkout_pending,
    guestSignal: state.guest_signal,
    stayoverDue,
    deferred: isCleanDeferred(state),
    cleaningFresh: isCleaningFresh(state, staleMinutes),
  })
  if (!allowed) return { error: 'Für dieses Zimmer ist gerade keine Reinigung offen.' }

  if (choice === 'today') {
    const { error } = await admin
      .from('room_states')
      .update({
        guest_signal: state.guest_signal === 'please_clean' ? 'none' : state.guest_signal,
        clean_not_before: null,
        // Derselbe Verzicht wie „Heute keine Reinigung" im Portal — gilt bis Mitternacht vor Ort.
        clean_declined_on: zonedDateKey(new Date(), parseTimeZone(ctx.policies)),
        ...auditFields(ctx.profileId),
      })
      .eq('room_id', roomId)
      .eq('hotel_id', ctx.hotelId)
    if (error) return { error: error.message }
    const res = await logStitch(admin, ctx, 'clean_declined', roomId, shift.sessionId)
    if (res.error) return res
  } else {
    const until = doorDeferUntil(Number(choice))
    const { error } = await admin
      .from('room_states')
      .update({ clean_not_before: until.toISOString(), ...auditFields(ctx.profileId) })
      .eq('room_id', roomId)
      .eq('hotel_id', ctx.hotelId)
    if (error) return { error: error.message }
    const res = await logStitch(admin, ctx, 'clean_deferred', roomId, shift.sessionId)
    if (res.error) return res
  }

  revalidatePath(boardPath(ctx))
  revalidatePath('/admin', 'layout')
  return {}
}
