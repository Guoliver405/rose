/**
 * Zeitzone des Hauses — die eine Stelle, an der aus einem Zeitpunkt „Uhrzeit
 * und Datum vor Ort" wird.
 *
 * Warum das nötig ist (06.09.2026): Die Server laufen in UTC (Vercel, Region
 * Dublin), die Häuser in Mitteleuropa. Alle Regeln, die mit „heute" oder
 * einer Uhrzeit rechnen — Routine-Reinigung ab 10:00, Reinigungs-Zeitfenster,
 * „heute gereinigt", Abreisetag, Tagesprotokoll der Auswertung — rechneten in
 * Server-Zeit und lagen in Produktion damit um ein bis zwei Stunden daneben.
 * Seither trägt jedes Haus `policies.timeZone` (IANA-Name, Default
 * Europe/Berlin), und diese Helfer rechnen mit `Intl`, nicht mit `getHours()`.
 *
 * Reine Rechenlogik ohne I/O, ohne Bibliothek: `Intl.DateTimeFormat` liefert
 * die Ortszeit-Teile, die Umkehrung (Ortszeit → Zeitpunkt) läuft über zwei
 * Korrekturschritte, die auch Sommerzeit-Wechsel richtig treffen.
 */

export const DEFAULT_TIME_ZONE = 'Europe/Berlin'

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || tz.length === 0) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** Zeitzone aus den Hotel-Policies, sonst der Default. */
export function parseTimeZone(policies: Record<string, unknown>): string {
  return isValidTimeZone(policies.timeZone) ? policies.timeZone : DEFAULT_TIME_ZONE
}

/** Alle IANA-Zeitzonen der Laufzeit, für die Auswahl in den Einstellungen. */
export function listTimeZones(): string[] {
  try {
    const list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('timeZone')
    if (list && list.length > 0) return list
  } catch { /* ältere Laufzeit */ }
  return [DEFAULT_TIME_ZONE]
}

export type ZonedParts = {
  year: number
  /** 1–12 */
  month: number
  day: number
  hour: number
  minute: number
  /** 0 = Montag … 6 = Sonntag */
  weekday: number
}

const WEEKDAY_INDEX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }
const pad = (n: number) => String(n).padStart(2, '0')

/** Datum, Uhrzeit und Wochentag eines Zeitpunkts in der Zeitzone. */
export function zonedParts(date: Date, tz: string = DEFAULT_TIME_ZONE): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
  }).formatToParts(date)
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '0'
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')) % 24,
    minute: Number(get('minute')),
    weekday: WEEKDAY_INDEX[get('weekday')] ?? 0,
  }
}

/** Lokales Datum als `YYYY-MM-DD`. */
export function zonedDateKey(date: Date, tz: string = DEFAULT_TIME_ZONE): string {
  const p = zonedParts(date, tz)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`
}

/** Minuten seit Mitternacht vor Ort. */
export function zonedMinutesOfDay(date: Date, tz: string = DEFAULT_TIME_ZONE): number {
  const p = zonedParts(date, tz)
  return p.hour * 60 + p.minute
}

/** „HH:MM" vor Ort. */
export function formatHHMM(date: Date, tz: string = DEFAULT_TIME_ZONE): string {
  const p = zonedParts(date, tz)
  return `${pad(p.hour)}:${pad(p.minute)}`
}

/**
 * Zeitpunkt einer Ortszeit (Datum + Uhrzeit in der Zeitzone). Zwei
 * Korrekturschritte: der erste trifft den Versatz, der zweite fängt den Fall,
 * dass die Ortszeit auf der anderen Seite eines Sommerzeit-Wechsels liegt.
 */
export function zonedInstant(
  tz: string, year: number, month: number, day: number, hour = 0, minute = 0,
): Date {
  const wanted = Date.UTC(year, month - 1, day, hour, minute)
  let guess = wanted
  for (let i = 0; i < 2; i++) {
    const p = zonedParts(new Date(guess), tz)
    const got = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute)
    guess += wanted - got
  }
  return new Date(guess)
}

export function parseDateKey(key: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
  if (!m) return null
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) }
}

/** Datumsschlüssel um `n` Tage verschoben — reine Kalenderrechnung, ohne Zeitzone. */
export function addDaysKey(key: string, n: number): string {
  const k = parseDateKey(key)
  if (!k) return key
  const d = new Date(Date.UTC(k.year, k.month - 1, k.day + n))
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** Tagesgrenzen vor Ort für einen Datumsschlüssel (Ende exklusiv). */
export function zonedDayRange(key: string, tz: string = DEFAULT_TIME_ZONE): { start: Date; end: Date } {
  const k = parseDateKey(key) ?? { year: 1970, month: 1, day: 1 }
  const next = parseDateKey(addDaysKey(key, 1)) ?? k
  return {
    start: zonedInstant(tz, k.year, k.month, k.day),
    end: zonedInstant(tz, next.year, next.month, next.day),
  }
}

/** Mitternacht vor Ort des Tages, in dem `now` liegt. */
export function zonedTodayStart(now: Date, tz: string = DEFAULT_TIME_ZONE): Date {
  return zonedDayRange(zonedDateKey(now, tz), tz).start
}

/** Heute vor Ort um HH:MM als Zeitpunkt. */
export function zonedTimeToday(now: Date, tz: string, hour: number, minute: number): Date {
  const p = zonedParts(now, tz)
  return zonedInstant(tz, p.year, p.month, p.day, hour, minute)
}
