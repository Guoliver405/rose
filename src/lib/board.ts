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
): number {
  let score = 0
  if (state.priority) score += SCORE_WEIGHTS.priority
  if (state.checkout_pending) score += SCORE_WEIGHTS.checkoutPending
  if (state.guest_signal === 'please_clean') score += SCORE_WEIGHTS.pleaseClean
  return score
}
