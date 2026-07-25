import { redirect } from 'next/navigation'
import { getMaidContext } from '@/utils/maid-auth'
import { createAdminClient } from '@/utils/supabase/service'
import { deriveShiftState } from '@/lib/shift'
import { clampStaleMinutes, isCleaningFresh } from '@/lib/board'
import { computeWorkStats, dayKey, dayRange, type StaffLogRow } from '@/lib/worklog'
import StatusPanel from './StatusPanel'

/**
 * „Mein Status" — alle Zustandswechsel der Reinigungskraft auf einer eigenen
 * Seite (eigene Route statt Overlay, damit die Zurück-Taste am Handy greift).
 * Das Board trägt dadurch nur noch eine kompakte Statusleiste.
 */
export default async function ServiceStatusPage() {
  const ctx = await getMaidContext()
  if (!ctx) redirect('/service/login')

  const admin = createAdminClient()
  const today = dayKey(new Date())
  const todayRange = dayRange(today)

  const [{ data: shiftLog }, { data: todayLog }, { data: states }] = await Promise.all([
    admin
      .from('staff_log')
      .select('kind, at')
      .eq('profile_id', ctx.profileId)
      .in('kind', ['shift_start', 'shift_end', 'break_start', 'break_end', 'other_start', 'other_end'])
      .order('at', { ascending: false })
      .limit(50),
    // Tagesbilanz: alle Stiche von heute (auch clean_*, für die Zimmerzeit).
    admin
      .from('staff_log')
      .select('kind, at, room_id')
      .eq('profile_id', ctx.profileId)
      .gte('at', todayRange.start.toISOString())
      .lt('at', todayRange.end.toISOString())
      .order('at'),
    admin
      .from('room_states')
      .select('room_id, cleaning_by, cleaning_started_at, rooms(number)')
      .eq('cleaning_by', ctx.profileId)
      .limit(1),
  ])

  const shift = deriveShiftState(shiftLog ?? [])
  const staleMinutes = clampStaleMinutes(ctx.policies.cleaningStaleMinutes)
  const stats = computeWorkStats((todayLog ?? []) as StaffLogRow[], todayRange, staleMinutes)

  // Laufende Zimmerreinigung (nur frische zählt — Stale gilt als vergessen).
  const state = states?.[0]
  const room = state?.rooms as unknown as { number: string } | null
  const cleaning = state && isCleaningFresh(state, staleMinutes)
    ? { roomNumber: room?.number ?? '?', startedAt: state.cleaning_started_at }
    : null

  return (
    <StatusPanel
      displayName={ctx.displayName}
      shift={{
        onShift: shift.onShift,
        onBreak: shift.onBreak,
        onOther: shift.onOther,
        shiftStartedAt: shift.shiftStartedAt,
        breakStartedAt: shift.breakStartedAt,
        otherStartedAt: shift.otherStartedAt,
      }}
      cleaning={cleaning}
      today={{
        workMs: stats.shiftMs,
        breakMs: stats.breakMs,
        cleaningMs: stats.cleaningMs,
        cleaningCount: stats.cleaningCount,
        otherCleaningMs: stats.otherCleaningMs,
      }}
    />
  )
}
