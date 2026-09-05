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

import {
  DEFAULT_TIME_ZONE, addDaysKey, formatHHMM, zonedDateKey, zonedMinutesOfDay,
  zonedTimeToday, zonedTodayStart,
} from './tz'

export const CLEANING_STALE_MINUTES_DEFAULT = 90

/** Etagenscore-Gewichte: leichte Priorisierungshilfe fürs Reinigungsboard. */
export const SCORE_WEIGHTS = { priority: 3, checkoutPending: 2, pleaseClean: 1 } as const

export type RoomStateLike = {
  guest_signal: 'none' | 'please_clean' | 'dnd'
  checkout_pending: boolean
  priority: boolean
  cleaning_by: string | null
  cleaning_started_at: string | null
  /** „Frühestens ab" des Gastes — zählt nur, solange guest_signal = please_clean. */
  clean_not_before?: string | null
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

/**
 * Zeitpunkt, an dem eine laufende Reinigung in den Stale-Timeout gelaufen ist
 * (Start + cleaningStaleMinutes) — null, solange sie frisch ist oder niemand
 * reinigt. Der Wert wird als `at` des `clean_aborted`-Stichs festgeschrieben:
 * Er benennt, WANN das Zeitlimit riss, nicht wann es jemand bemerkt hat.
 */
export function staleCleaningCutoff(
  state: Pick<RoomStateLike, 'cleaning_by' | 'cleaning_started_at'>,
  staleMinutes: number,
  now: Date = new Date(),
): string | null {
  if (!state.cleaning_by || !state.cleaning_started_at) return null
  const cutoff = new Date(state.cleaning_started_at).getTime() + staleMinutes * 60_000
  if (now.getTime() < cutoff) return null
  return new Date(cutoff).toISOString()
}

type ActiveLike = Pick<RoomStateLike, 'guest_signal' | 'checkout_pending' | 'priority' | 'clean_not_before'>

/**
 * „Frühestens ab" (06.09.2026): Der Gast wünscht Reinigung, aber nicht vor
 * einer Uhrzeit. Bis dahin ist der Wunsch aufgeschoben — das Zimmer gilt als
 * nicht aktiv und zeigt „Reinigung ab HH:MM". Reine Ableitung: kein Cron
 * kippt den Zustand, die Boards lesen ihn beim nächsten Rendern (Realtime
 * plus Poll-Fallback).
 */
export function isCleanDeferred(state: ActiveLike, now: Date = new Date()): boolean {
  if (state.guest_signal !== 'please_clean' || !state.clean_not_before) return false
  return new Date(state.clean_not_before).getTime() > now.getTime()
}

/** Zimmer braucht Reinigung (unabhängig davon, ob schon jemand drin ist). */
export function isRoomActive(state: ActiveLike, now: Date = new Date()): boolean {
  return state.checkout_pending || state.priority
    || (state.guest_signal === 'please_clean' && !isCleanDeferred(state, now))
}

/** Gewichteter Beitrag eines Zimmers zum Etagenscore (0 wenn nicht aktiv). */
export function roomScore(state: ActiveLike, stayoverDue = false, now: Date = new Date()): number {
  let score = 0
  if (state.priority) score += SCORE_WEIGHTS.priority
  if (state.checkout_pending) score += SCORE_WEIGHTS.checkoutPending
  if (state.guest_signal === 'please_clean' && !isCleanDeferred(state, now)) score += SCORE_WEIGHTS.pleaseClean
  else if (stayoverDue) score += SCORE_WEIGHTS.pleaseClean // Routine wiegt wie ein Wunsch
  return score
}

// ── „Frühestens ab" — Grenze des Hauses ────────────────────────────────────
//
// Das Haus bestimmt, bis wann ein Gast aufschieben darf (Default 11:00): Wer
// bis 15:00 reinigt, kann einen Wunsch „ab 14:30" nicht mehr bedienen. Der
// Gast wählt volle Stunden zwischen jetzt und dieser Grenze.

export type CleanDeferPolicy = { enabled: boolean; hour: number; minute: number }

export function parseCleanDefer(policies: Record<string, unknown>): CleanDeferPolicy {
  const enabled = policies.cleanDeferEnabled !== false // Default an
  const raw = typeof policies.cleanDeferUntil === 'string' ? policies.cleanDeferUntil : '11:00'
  const match = /^(\d{1,2}):(\d{2})$/.exec(raw.trim())
  return {
    enabled,
    hour: match ? Math.min(23, Math.max(0, Number(match[1]))) : 11,
    minute: match ? Math.min(59, Math.max(0, Number(match[2]))) : 0,
  }
}

/** Spätester Zeitpunkt heute, bis zu dem der Gast aufschieben darf. */
export function cleanDeferLimit(policy: CleanDeferPolicy, now: Date, tz: string = DEFAULT_TIME_ZONE): Date {
  return zonedTimeToday(now, tz, policy.hour, policy.minute)
}

/**
 * Wählbare „frühestens ab"-Zeiten: volle Stunden nach jetzt bis einschließlich
 * der Grenze (die Grenze selbst auch, wenn sie keine volle Stunde ist). Leer,
 * wenn die Grenze schon vorbei ist oder das Haus es nicht anbietet.
 */
export function cleanDeferOptions(
  policy: CleanDeferPolicy, now: Date, tz: string = DEFAULT_TIME_ZONE,
): { label: string; iso: string }[] {
  if (!policy.enabled) return []
  const limit = cleanDeferLimit(policy, now, tz)
  const out: { label: string; iso: string }[] = []
  for (let h = 0; h <= 23; h++) {
    const t = zonedTimeToday(now, tz, h, 0)
    if (t.getTime() <= now.getTime() || t.getTime() > limit.getTime()) continue
    out.push({ label: formatHHMM(t, tz), iso: t.toISOString() })
  }
  if (limit.getTime() > now.getTime() && policy.minute !== 0) {
    out.push({ label: formatHHMM(limit, tz), iso: limit.toISOString() })
  }
  return out
}

// ── Stayover-Routine-Reinigung (Hotel-Policy, Default aus) ──────────────────
//
// Reine Ableitung, kein Cron und kein persistentes Flag: Ein belegtes Zimmer
// ist „routine-fällig", sobald die konfigurierte Uhrzeit erreicht ist, der
// Gast mindestens eine Nacht da ist (Check-in vor heute), kein DND anliegt
// und heute noch niemand gereinigt hat. „Heute gereinigt" kommt aus
// staff_log.clean_done (schreiben Maid-Abschluss UND Rezeptions-Korrektur).

//
// Zwei Schranken gegen die doppelte Reinigung am Abreisetag (06.09.2026):
//   1. Die Routine wird NIE vor der Check-out-Zeit des Hauses fällig
//      (`policies.checkoutUntil`, Default 11:00). Wer nach der Check-out-Frist
//      noch im Zimmer ist, bleibt per Definition — Abreisen laufen vormittags
//      über den Check-out-Klick, Stayovers danach.
//   2. Ist am Aufenthalt ein Abreisedatum hinterlegt (`stays.expected_checkout`,
//      optional), gibt es an diesem Tag gar keine Routine — gereinigt wird
//      nach dem Check-out. Ein überfälliges Datum (gestern) zählt als unbekannt.

export type StayoverPolicy = {
  enabled: boolean
  hour: number
  minute: number
  /** Check-out-Frist des Hauses — Untergrenze für die Routine. */
  checkoutHour: number
  checkoutMinute: number
}

function parseHHMM(raw: unknown, fallbackHour: number, fallbackMinute: number): { hour: number; minute: number } {
  const match = typeof raw === 'string' ? /^(\d{1,2}):(\d{2})$/.exec(raw.trim()) : null
  return {
    hour: match ? Math.min(23, Math.max(0, Number(match[1]))) : fallbackHour,
    minute: match ? Math.min(59, Math.max(0, Number(match[2]))) : fallbackMinute,
  }
}

export function parseStayoverPolicy(policies: Record<string, unknown>): StayoverPolicy {
  const enabled = policies.stayoverAutoClean === true
  const routine = parseHHMM(policies.stayoverAutoCleanTime, 10, 0)
  const checkout = parseHHMM(policies.checkoutUntil, 11, 0)
  return {
    enabled, hour: routine.hour, minute: routine.minute,
    checkoutHour: checkout.hour, checkoutMinute: checkout.minute,
  }
}

/** Uhrzeit, ab der die Routine tatsächlich fällig wird: das Spätere aus Routine-Zeit und Check-out-Frist. */
export function stayoverDueTime(policy: StayoverPolicy): { hour: number; minute: number } {
  const routine = policy.hour * 60 + policy.minute
  const checkout = policy.checkoutHour * 60 + policy.checkoutMinute
  const m = Math.max(routine, checkout)
  return { hour: Math.floor(m / 60), minute: m % 60 }
}

/** Datum vor Ort als `YYYY-MM-DD` — in der Zeitzone des Hauses, nie in Server-Zeit. */
export function localDateKey(d: Date, tz: string = DEFAULT_TIME_ZONE): string {
  return zonedDateKey(d, tz)
}

/** Datum nach `nights` Nächten ab `now` — „1 Nacht" beim Check-in heute = morgen. */
export function dateKeyAfterNights(now: Date, nights: number, tz: string = DEFAULT_TIME_ZONE): string {
  return addDaysKey(zonedDateKey(now, tz), Math.max(0, Math.floor(nights)))
}

/** Ist der geplante Abreisetag heute (vor Ort)? Fehlendes oder ungültiges Datum ⇒ false. */
export function isDepartureToday(
  expectedCheckout: string | null | undefined, now: Date = new Date(), tz: string = DEFAULT_TIME_ZONE,
): boolean {
  if (!expectedCheckout) return false
  return expectedCheckout.slice(0, 10) === zonedDateKey(now, tz)
}

export function isStayoverDue(args: {
  policy: StayoverPolicy
  occupied: boolean
  checkedInAt: string | null
  guestSignal: 'none' | 'please_clean' | 'dnd'
  cleanedToday: boolean
  /** Geplanter Abreisetag (`YYYY-MM-DD`), optional — am Abreisetag keine Routine. */
  expectedCheckout?: string | null
  now?: Date
  /** Zeitzone des Hauses — „heute" und die Uhrzeit gelten vor Ort. */
  timeZone?: string
}): boolean {
  const { policy, occupied, checkedInAt, guestSignal, cleanedToday } = args
  if (!policy.enabled || !occupied || !checkedInAt || cleanedToday) return false
  // DND: nicht stören. Wunsch: der Gast hat selbst entschieden (sofort oder
  // „frühestens ab") — die Routine hat dann nichts mehr zu sagen.
  if (guestSignal !== 'none') return false

  const now = args.now ?? new Date()
  const tz = args.timeZone ?? DEFAULT_TIME_ZONE
  if (new Date(checkedInAt) >= zonedTodayStart(now, tz)) return false // erst ab der zweiten Nacht
  if (isDepartureToday(args.expectedCheckout, now, tz)) return false // Abreisetag: erst nach dem Check-out

  const due = stayoverDueTime(policy)
  return now.getTime() >= zonedTimeToday(now, tz, due.hour, due.minute).getTime()
}

/** Beginn des heutigen Tages VOR ORT als ISO — für staff_log-Queries („heute gereinigt"). */
export function todayStartIso(now: Date = new Date(), tz: string = DEFAULT_TIME_ZONE): string {
  return zonedTodayStart(now, tz).toISOString()
}

// ── Reinigungs-Zeitfenster (Hotel-Policy, Default aus) ──────────────────────
//
// Begrenzt, wann Gäste den Reinigungswunsch absetzen dürfen. Betrifft NUR
// `please_clean` — DND und das Zurücknehmen eines Wunsches bleiben jederzeit
// möglich. Bereits gesetzte Wünsche laufen weiter (kein Auto-Reset).

export type CleaningWindowPolicy = { enabled: boolean; start: string; end: string }

const DEFAULT_WINDOW = { start: '08:00', end: '16:00' }

function parseHhMm(raw: unknown, fallback: string): string {
  const value = typeof raw === 'string' ? raw.trim() : ''
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!match) return fallback
  const hour = Math.min(23, Math.max(0, Number(match[1])))
  const minute = Math.min(59, Math.max(0, Number(match[2])))
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function parseCleaningWindow(policies: Record<string, unknown>): CleaningWindowPolicy {
  return {
    enabled: policies.cleaningWindowEnabled === true,
    start: parseHhMm(policies.cleaningWindowStart, DEFAULT_WINDOW.start),
    end: parseHhMm(policies.cleaningWindowEnd, DEFAULT_WINDOW.end),
  }
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/**
 * Liegt `now` im Wunsch-Zeitfenster? Bei ausgeschalteter Policy immer true.
 * Start > Ende wird als über Mitternacht laufendes Fenster gelesen
 * (z. B. 22:00–02:00); Start === Ende bedeutet „ganztägig".
 */
export function isWithinCleaningWindow(
  policy: CleaningWindowPolicy,
  now: Date = new Date(),
  tz: string = DEFAULT_TIME_ZONE,
): boolean {
  if (!policy.enabled) return true
  const start = toMinutes(policy.start)
  const end = toMinutes(policy.end)
  if (start === end) return true
  const minutes = zonedMinutesOfDay(now, tz)
  return start < end
    ? minutes >= start && minutes < end
    : minutes >= start || minutes < end
}

// ── Etagen-Verortung (maid_presence) ────────────────────────────────────────
//
// Präsenz wird beim Schichtende und per "Zurück"-Button gelöscht; vergessene
// Zeilen (Schichtende nie gestochen) altern heraus — reine Loader-Ableitung.

export const PRESENCE_STALE_HOURS = 16

export function isPresenceFresh(enteredAt: string, now: Date = new Date()): boolean {
  return now.getTime() - new Date(enteredAt).getTime() < PRESENCE_STALE_HOURS * 60 * 60_000
}
