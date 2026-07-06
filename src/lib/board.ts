/**
 * Board-Ableitung (im Code, nicht in der DB — siehe AGENTS.md):
 *
 *   aktiv      = checkout_pending || priority || guest_signal === 'please_clean'
 *   in Arbeit  = cleaning_by !== null UND nicht stale
 *   ausgegraut = alles andere (frei, belegt ohne Wunsch, DND)
 *
 * Stale-Timeout: Reinigungen, deren Start älter als
 * policies.cleaningStaleMinutes ist, gelten als vergessener Abschluss und
 * fallen zurück auf offen. Reine Ableitung im Loader — kein Cron.
 */

export const CLEANING_STALE_MINUTES_DEFAULT = 90

/** Etagenscore-Gewichte: leichte Priorisierungshilfe fürs Reinigungsboard. */
export const SCORE_WEIGHTS = { priority: 3, checkoutPending: 2, pleaseClean: 1 } as const

export type RoomStateLike = {
  guest_signal: 'none' | 'please_clean' | 'dnd'
  checkout_pending: boolean
  priority: boolean
  cleaning_by: string | null
  cleaning_started_at: string | null
}

/** cleaningStaleMinutes aus der Hotel-Policy, geclampt auf 5–24h. */
export function clampStaleMinutes(value: unknown): number {
  const n = typeof value === 'number' ? Math.floor(value) : CLEANING_STALE_MINUTES_DEFAULT
  if (!Number.isFinite(n)) return CLEANING_STALE_MINUTES_DEFAULT
  return Math.min(24 * 60, Math.max(5, n))
}

/** Reinigung läuft und ist noch nicht in den Stale-Timeout gelaufen. */
export function isCleaningFresh(
  state: Pick<RoomStateLike, 'cleaning_by' | 'cleaning_started_at'>,
  staleMinutes: number,
  now: Date = new Date(),
): boolean {
  if (!state.cleaning_by) return false
  if (!state.cleaning_started_at) return true
  const startedAt = new Date(state.cleaning_started_at).getTime()
  return now.getTime() - startedAt < staleMinutes * 60_000
}

/** Zimmer braucht Reinigung (unabhängig davon, ob schon jemand drin ist). */
export function isRoomActive(
  state: Pick<RoomStateLike, 'guest_signal' | 'checkout_pending' | 'priority'>,
): boolean {
  return state.checkout_pending || state.priority || state.guest_signal === 'please_clean'
}

/** Gewichteter Beitrag eines Zimmers zum Etagenscore (0 wenn nicht aktiv). */
export function roomScore(
  state: Pick<RoomStateLike, 'guest_signal' | 'checkout_pending' | 'priority'>,
  stayoverDue = false,
): number {
  let score = 0
  if (state.priority) score += SCORE_WEIGHTS.priority
  if (state.checkout_pending) score += SCORE_WEIGHTS.checkoutPending
  if (state.guest_signal === 'please_clean') score += SCORE_WEIGHTS.pleaseClean
  else if (stayoverDue) score += SCORE_WEIGHTS.pleaseClean // Routine wiegt wie ein Wunsch
  return score
}

// ── Stayover-Routine-Reinigung (Hotel-Policy, Default aus) ──────────────────
//
// Reine Ableitung, kein Cron und kein persistentes Flag: Ein belegtes Zimmer
// ist „routine-fällig", sobald die konfigurierte Uhrzeit erreicht ist, der
// Gast mindestens eine Nacht da ist (Check-in vor heute), kein DND anliegt
// und heute noch niemand gereinigt hat. „Heute gereinigt" kommt aus
// staff_log.clean_done (schreiben Maid-Abschluss UND Rezeptions-Korrektur).

export type StayoverPolicy = { enabled: boolean; hour: number; minute: number }

export function parseStayoverPolicy(policies: Record<string, unknown>): StayoverPolicy {
  const enabled = policies.stayoverAutoClean === true
  const raw = typeof policies.stayoverAutoCleanTime === 'string' ? policies.stayoverAutoCleanTime : '10:00'
  const match = /^(\d{1,2}):(\d{2})$/.exec(raw.trim())
  const hour = match ? Math.min(23, Math.max(0, Number(match[1]))) : 10
  const minute = match ? Math.min(59, Math.max(0, Number(match[2]))) : 0
  return { enabled, hour, minute }
}

export function isStayoverDue(args: {
  policy: StayoverPolicy
  occupied: boolean
  checkedInAt: string | null
  guestSignal: 'none' | 'please_clean' | 'dnd'
  cleanedToday: boolean
  now?: Date
}): boolean {
  const { policy, occupied, checkedInAt, guestSignal, cleanedToday } = args
  if (!policy.enabled || !occupied || !checkedInAt || cleanedToday) return false
  if (guestSignal === 'dnd') return false

  const now = args.now ?? new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (new Date(checkedInAt) >= todayStart) return false // erst ab der zweiten Nacht

  const dueAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), policy.hour, policy.minute)
  return now >= dueAt
}

/** Beginn des heutigen Tages (Server-Lokalzeit) als ISO — für staff_log-Queries. */
export function todayStartIso(now: Date = new Date()): string {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
}
