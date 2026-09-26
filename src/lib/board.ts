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

/**
 * Etagenscore-Gewichte: leichte Priorisierungshilfe fürs Reinigungsboard.
 * Seit 26.09.2026 wiegt ein Reinigungswunsch mehr als eine fällige Routine:
 * Der Gast hat angezeigt, dass er weg ist und Reinigung will — dort ist das
 * Klopfen ein sicherer Erfolg, bei der Routine eines ins Ungewisse. Vorher
 * wogen beide gleich, und ein früher Wunsch zog keine Kraft auf seine Etage.
 */
export const SCORE_WEIGHTS = { priority: 4, checkoutPending: 3, pleaseClean: 2, stayover: 1 } as const

export type RoomStateLike = {
  guest_signal: 'none' | 'please_clean' | 'dnd'
  checkout_pending: boolean
  priority: boolean
  cleaning_by: string | null
  cleaning_started_at: string | null
  /**
   * „Frühestens ab" — vom Gast (mit seinem Wunsch) oder seit 26.09.2026 von
   * der Reinigungskraft an der Tür („bitte später"). Gilt für den Wunsch und
   * die Routine gleichermaßen, nie für eine Abreise.
   */
  clean_not_before?: string | null
  /**
   * Verzicht für heute (`YYYY-MM-DD` vor Ort): vom Gast im Portal („Heute
   * keine Reinigung") oder von der Kraft an der Tür („heute nicht"). Gilt nur,
   * solange das Datum heute ist — verfällt um Mitternacht von selbst.
   */
  clean_declined_on?: string | null
}

/** Verzicht gilt heute? Ein Datum von gestern ist erledigt, nicht gesperrt. */
export function isDeclinedToday(
  declinedOn: string | null | undefined, now: Date = new Date(), tz: string = DEFAULT_TIME_ZONE,
): boolean {
  return !!declinedOn && declinedOn.slice(0, 10) === zonedDateKey(now, tz)
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
 *
 * Seit 26.09.2026 setzt auch die Reinigungskraft den Aufschub („Gast an der
 * Tür: bitte später") — dann meist ohne Wunsch, für die Routine. Deshalb hängt
 * er nicht mehr am Signal. Ausgenommen ist die Abreise: ein ausgechecktes
 * Zimmer hat keinen Gast mehr, der „später" sagen könnte.
 */
export function isCleanDeferred(state: ActiveLike, now: Date = new Date()): boolean {
  if (state.checkout_pending || !state.clean_not_before) return false
  if (state.guest_signal === 'dnd') return false
  return new Date(state.clean_not_before).getTime() > now.getTime()
}

/** Zimmer braucht Reinigung (unabhängig davon, ob schon jemand drin ist). */
export function isRoomActive(state: ActiveLike, now: Date = new Date()): boolean {
  return state.checkout_pending || state.priority
    || (state.guest_signal === 'please_clean' && !isCleanDeferred(state, now))
}

/** Gewichteter Beitrag eines Zimmers zum Etagenscore (0 wenn nicht aktiv). */
export function roomScore(
  state: ActiveLike, stayoverDue = false, now: Date = new Date(),
  /** Gewicht einer Abreise — mit Check-out-Druck `departureWeight(…)`, sonst das Grundgewicht. */
  departureW: number = SCORE_WEIGHTS.checkoutPending,
): number {
  let score = 0
  if (state.priority) score += SCORE_WEIGHTS.priority
  if (state.checkout_pending) score += departureW
  if (state.guest_signal === 'please_clean' && !isCleanDeferred(state, now)) score += SCORE_WEIGHTS.pleaseClean
  else if (stayoverDue) score += SCORE_WEIGHTS.stayover // Routine: Gast vielleicht noch da
  return score
}

// ── Check-out-Druck (26.09.2026, Idee des Users) ─────────────────────────────
//
// Abreisen müssen bis zum Check-in bezugsfertig sein. Mit festen Gewichten
// blieb eine einzelne Abreise hinter einer Etage voller Routine-Zimmer liegen
// (8 × 1 schlägt 3), am Landing-Vergleich bis zu 3½ Stunden. Deshalb wächst das
// Gewicht einer Abreise mit dem Druck — und nur dann: An ruhigen Tagen bleibt
// die gewohnte Etagenlogik, an harten Abreisetagen ziehen Abreisen Kräfte an.

/** Planwert einer Abreise-Reinigung (Minuten) — Grundlage des Drucks. */
export const DEPARTURE_MINUTES = 30

/**
 * Druck: benötigte Zeit für die offenen Abreisen ÷ verfügbare Zeit bis zum
 * Check-in. Unter 0,5 entspannt, um 1 knapp, über 1 nicht mehr zu schaffen.
 * Relativ zu den Kräften: zehn offene Abreisen sind bei zwanzig Kräften kein
 * Druck, bei zwei ein Notfall. Ist der Check-in schon da (oder fast), gilt die
 * Restzeit als eine Viertelstunde — der Druck ist dann hoch, aber endlich.
 */
export function departurePressure(openDepartures: number, maidsOnShift: number, minutesToCheckin: number): number {
  if (openDepartures <= 0) return 0
  const needed = openDepartures * DEPARTURE_MINUTES
  return needed / (Math.max(1, maidsOnShift) * Math.max(15, minutesToCheckin))
}

/** Obergrenze des Drucks für das Gewicht — darüber ändert sich an der Reihenfolge nichts mehr. */
const PRESSURE_CAP = 2

/**
 * Gewicht einer offenen Abreise im Etagenscore: wächst exponentiell mit dem
 * Druck (Grundgewicht × 2^(4 × Druck)): 0 → 3, 0,25 → 6, 0,5 → 12, 1 → 48.
 * Zum Vergleich: eine Etage mit acht fälligen Routinen wiegt 8.
 */
export function departureWeight(pressure: number): number {
  return SCORE_WEIGHTS.checkoutPending * 2 ** (4 * Math.min(Math.max(pressure, 0), PRESSURE_CAP))
}

/**
 * Nach jedem Zimmer: Lohnt der Wechsel auf eine andere Etage? Nur wenn sie
 * deutlich mehr wiegt als der Rest der eigenen Etage (beide Werte schon durch
 * die Kräfte vor Ort geteilt) — sonst pendelt eine Kraft zwischen zwei Etagen.
 * Die Kraft entscheidet, das Board empfiehlt.
 */
export const SWITCH_FACTOR = 2

export function shouldSwitchFloor(currentFloorValue: number, bestOtherValue: number): boolean {
  if (currentFloorValue <= 0) return bestOtherValue > 0
  return bestOtherValue > SWITCH_FACTOR * currentFloorValue
}

/** Eine Etage, wie die Empfehlung sie sieht — Summen über die noch offenen Zimmer. */
export type RecommendFloor = {
  key: string
  floor: number
  building: string
  /** Summe der Zimmer-Scores (mit Check-out-Druck), laufende Reinigungen nicht mitgezählt. */
  score: number
  /** Eingebuchte Kräfte auf der Etage (bei der eigenen Etage einschließlich mir). */
  maids: number
  openPriority: boolean
  openDepartures: number
}

/** Wert einer fremden Etage: wo schon jemand arbeitet, lohnt der Weg weniger. */
const otherValue = (f: RecommendFloor) => f.score / (f.maids + 1)

/** Höherer Wert zuerst; bei Gleichstand die untere Etage, dann der Gebäudeteil — die Empfehlung springt nicht. */
const byValue = (a: RecommendFloor, b: RecommendFloor) =>
  otherValue(b) - otherValue(a) || a.floor - b.floor || a.building.localeCompare(b.building)

/**
 * „Als Nächstes" in der Etagen-Übersicht. **Priorität geht vor allem**: Hat
 * irgendeine Etage ein offenes priorisiertes Zimmer, kommen nur solche Etagen
 * in Frage — eine Entscheidung der Rezeption überstimmt keine Automatik,
 * auch nicht der Check-out-Druck (26.09.2026). Sonst die höchste Summe.
 */
export function recommendFloor(floors: RecommendFloor[]): string | null {
  const open = floors.filter(f => f.score > 0)
  const pool = open.some(f => f.openPriority) ? open.filter(f => f.openPriority) : open
  return [...pool].sort(byValue)[0]?.key ?? null
}

export type FloorSwitchHint = { key: string; reason: 'priority' | 'departures' | 'more' }

/**
 * Hinweis für die eingebuchte Kraft, nach jedem Zimmer neu gerechnet: Lohnt
 * ein Wechsel? Ja, wenn anderswo eine Priorität offen ist und hier keine —
 * oder wenn eine andere Etage deutlich mehr wiegt (`shouldSwitchFloor`), was
 * an ruhigen Tagen kaum, an harten Abreisetagen oft passiert. Die Kraft
 * entscheidet; das Board empfiehlt.
 */
export function floorSwitchHint(myKey: string, floors: RecommendFloor[]): FloorSwitchHint | null {
  const mine = floors.find(f => f.key === myKey)
  if (!mine || mine.openPriority) return null
  const others = floors.filter(f => f.key !== myKey && f.score > 0)
  const prio = others.filter(f => f.openPriority).sort(byValue)[0]
  if (prio) return { key: prio.key, reason: 'priority' }
  const best = [...others].sort(byValue)[0]
  if (!best) return null
  const myValue = mine.score / Math.max(1, mine.maids)
  if (!shouldSwitchFloor(myValue, otherValue(best))) return null
  return { key: best.key, reason: best.openDepartures > 0 ? 'departures' : 'more' }
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
//   1. Die Routine wird nicht vor der Check-out-Zeit des Hauses fällig — es sei
//      denn, ein eingetragenes Abreisedatum nach heute belegt, dass der Gast
//      bleibt (26.09.2026, `isKnownStayover`); dann gilt die Routine-Zeit.
//      Bisher: NIE vor der Check-out-Zeit
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

/**
 * „Check-in ab" (`policies.checkinFrom`, Vorgabe 15:00, seit 26.09.2026) —
 * bis dahin sollen die Abreisezimmer bezugsfertig sein; Grundlage des
 * Check-out-Drucks.
 */
export function parseCheckinFrom(policies: Record<string, unknown>): { hour: number; minute: number } {
  return parseHHMM(policies.checkinFrom, 15, 0)
}

/** Minuten von `now` bis zum Check-in heute (Ortszeit des Hauses); negativ, wenn er schon war. */
export function minutesToCheckin(policies: Record<string, unknown>, now: Date, timeZone: string = DEFAULT_TIME_ZONE): number {
  const { hour, minute } = parseCheckinFrom(policies)
  return (zonedTimeToday(now, timeZone, hour, minute).getTime() - now.getTime()) / 60_000
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

/**
 * Uhrzeit, ab der die Routine tatsächlich fällig wird: das Spätere aus
 * Routine-Zeit und Check-out-Frist — weil RoSe ohne Abreisedatum nicht weiß,
 * ob der Gast bleibt. Steht fest, dass er bleibt (`knownStayover`, siehe
 * `isKnownStayover`), gilt die Routine-Zeit selbst (26.09.2026).
 */
export function stayoverDueTime(policy: StayoverPolicy, knownStayover = false): { hour: number; minute: number } {
  if (knownStayover) return { hour: policy.hour, minute: policy.minute }
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

/**
 * Bleibt der Gast heute sicher? Nur wenn ein Abreisedatum eingetragen ist und
 * es NACH heute liegt. Ohne Datum, am Abreisetag und bei überfälligem Datum
 * (gestern, nicht nachgezogen) ist das unbekannt.
 */
export function isKnownStayover(
  expectedCheckout: string | null | undefined, now: Date = new Date(), tz: string = DEFAULT_TIME_ZONE,
): boolean {
  if (!expectedCheckout) return false
  return expectedCheckout.slice(0, 10) > zonedDateKey(now, tz)
}

export function isStayoverDue(args: {
  policy: StayoverPolicy
  occupied: boolean
  checkedInAt: string | null
  guestSignal: 'none' | 'please_clean' | 'dnd'
  cleanedToday: boolean
  /** Geplanter Abreisetag (`YYYY-MM-DD`), optional — am Abreisetag keine Routine. */
  expectedCheckout?: string | null
  /** Aufschub an der Tür („bitte später") — bis dahin nicht fällig. */
  cleanNotBefore?: string | null
  /** Verzicht für heute (Gast im Portal oder an der Tür) — heute keine Routine. */
  cleanDeclinedOn?: string | null
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

  if (args.cleanNotBefore && new Date(args.cleanNotBefore).getTime() > now.getTime()) return false
  if (isDeclinedToday(args.cleanDeclinedOn, now, tz)) return false

  const due = stayoverDueTime(policy, isKnownStayover(args.expectedCheckout, now, tz))
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

// ── Reinigungsstatus fürs Gastportal (16.09.2026) ───────────────────────────
//
// Der Gast soll sehen, woran er ist: keine Reinigung vorgesehen, vorgesehen
// (ab einer Uhrzeit oder „das Team kommt"), gerade in Arbeit, heute erledigt.
// Reine Ableitung aus denselben Quellen wie die Boards — kein eigener
// Zustand, der auseinanderlaufen könnte. „Heute" ist der Ortstag des Hauses.
//
// Rangfolge: laufende Reinigung → Wunsch/Priorität (auch NACH einer
// Reinigung: der Abschluss setzt den Wunsch zurück, ein neuer Wunsch ist also
// ein neuer Wunsch) → Nicht stören → heute erledigt → Routine → nichts.
// „Erledigt" zählt nur ab Check-in: der `clean_done` von gestern Abend gehört
// zum Vorgänger-Check-out, nicht zu diesem Gast.

export type GuestCleaningStatus =
  | { kind: 'in_progress' }
  /** Vorgesehen, das Team kommt — Wunsch, Priorität oder fällige Routine. */
  | { kind: 'scheduled' }
  /**
   * Vorgesehen ab einer Uhrzeit: „frühestens ab" des Gastes, an der Tür
   * vereinbart („bitte später") oder Routine vor der Fälligkeit.
   */
  | { kind: 'scheduled_from'; at: Date; reason: 'guest' | 'door' | 'routine' }
  | { kind: 'dnd' }
  | { kind: 'done'; at: Date }
  /** Heute keine Reinigung — vom Gast oder an der Tür, bis er doch noch wünscht. */
  | { kind: 'declined' }
  /** Heute nichts vorgesehen — mit dem Grund, damit der Text ehrlich bleibt. */
  | { kind: 'none'; reason: 'first_day' | 'departure' | 'no_routine' }

export function guestCleaningStatus(args: {
  state: Pick<RoomStateLike, 'guest_signal' | 'priority' | 'cleaning_by' | 'cleaning_started_at' | 'clean_not_before' | 'clean_declined_on'>
  staleMinutes: number
  policy: StayoverPolicy
  checkedInAt: string
  expectedCheckout?: string | null
  /** Letzter `clean_done` des Zimmers seit Check-in (ISO), sonst null. */
  lastCleanDoneAt: string | null
  now?: Date
  timeZone?: string
}): GuestCleaningStatus {
  const { state, policy } = args
  const now = args.now ?? new Date()
  const tz = args.timeZone ?? DEFAULT_TIME_ZONE

  if (isCleaningFresh(state, args.staleMinutes, now)) return { kind: 'in_progress' }

  if (state.guest_signal === 'please_clean') {
    const notBefore = state.clean_not_before ? new Date(state.clean_not_before) : null
    // `reason: 'guest'` heißt hier „zum Wunsch des Gastes": die Uhrzeit kann auch an der
    // Tür vereinbart sein (dasselbe Feld), die Anzeige bleibt deshalb neutral.
    if (notBefore && notBefore > now) return { kind: 'scheduled_from', at: notBefore, reason: 'guest' }
    return { kind: 'scheduled' }
  }
  if (state.priority) return { kind: 'scheduled' }
  if (state.guest_signal === 'dnd') return { kind: 'dnd' }

  const todayStart = zonedTodayStart(now, tz)
  const checkedIn = new Date(args.checkedInAt)
  if (args.lastCleanDoneAt) {
    const doneAt = new Date(args.lastCleanDoneAt)
    if (doneAt >= todayStart && doneAt >= checkedIn && doneAt <= now) return { kind: 'done', at: doneAt }
  }
  // Verzicht erst nach „gereinigt": wer heute schon gereinigt wurde, erfährt das.
  if (isDeclinedToday(state.clean_declined_on, now, tz)) return { kind: 'declined' }

  if (!policy.enabled) return { kind: 'none', reason: 'no_routine' }
  if (checkedIn >= todayStart) return { kind: 'none', reason: 'first_day' }
  if (isDepartureToday(args.expectedCheckout, now, tz)) return { kind: 'none', reason: 'departure' }

  const due = stayoverDueTime(policy, isKnownStayover(args.expectedCheckout, now, tz))
  const dueAt = zonedTimeToday(now, tz, due.hour, due.minute)
  const doorAt = state.clean_not_before ? new Date(state.clean_not_before) : null
  if (doorAt && doorAt > now && doorAt >= dueAt) return { kind: 'scheduled_from', at: doorAt, reason: 'door' }
  if (now < dueAt) return { kind: 'scheduled_from', at: dueAt, reason: 'routine' }
  return { kind: 'scheduled' }
}

// ── Gast an der Tür (26.09.2026) ────────────────────────────────────────────
//
// Die Kraft klopft, der Gast ist da und will gerade keine Reinigung. Drei
// Antworten: später (30 min, 1 h) oder heute nicht. Wann das geht, entscheidet
// diese Funktion — Dialog und Server-Action fragen dieselbe.

export const DOOR_DEFER_MINUTES = [30, 60] as const
export type DoorChoice = '30' | '60' | 'today'

/**
 * Darf die Kraft hier „Gast an der Tür" wählen? Nur bei einem belegten Zimmer
 * mit offener Routine oder offenem Wunsch — eine Abreise hat keinen Gast mehr,
 * „Nicht stören" wird ohnehin nicht geklopft, und eine laufende Reinigung
 * gehört dem Abschluss.
 */
export function canAnswerAtDoor(room: {
  occupied: boolean
  checkoutPending: boolean
  guestSignal: 'none' | 'please_clean' | 'dnd'
  stayoverDue: boolean
  deferred: boolean
  cleaningFresh: boolean
}): boolean {
  if (!room.occupied || room.checkoutPending || room.cleaningFresh || room.deferred) return false
  if (room.guestSignal === 'dnd') return false
  return room.guestSignal === 'please_clean' || room.stayoverDue
}

/** Zeitpunkt des Aufschubs „in X Minuten" — auf die volle Minute. */
export function doorDeferUntil(minutes: number, now: Date = new Date()): Date {
  const t = new Date(now.getTime() + minutes * 60_000)
  t.setUTCSeconds(0, 0)
  return t
}
