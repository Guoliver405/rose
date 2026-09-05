/**
 * Nachfrage-Auswertung: WANN wünschen Gäste Reinigung, wann reisen sie ab,
 * und wie viele Kräfte sind zu diesen Zeiten im Dienst?
 *
 * Anlass (06.09.2026): Die Frage, ob Gäste eine Wunsch-Reinigungszeit angeben
 * sollen, um die Schichten des Housekeepings zu planen. Antwort: Die Daten
 * gibt es schon — jeder Tipp auf „Zimmer reinigen" steht mit Zeitstempel im
 * Verlauf (`room_state_transitions`), jeder Check-out in `stays`, jede
 * Schicht in `staff_log`. Es fehlte nur die Auswertung. Der Zeitpunkt, an dem
 * ein Gast tatsächlich tippt, sagt über die Nachfrage mehr als eine vorab
 * eingetragene Wunschzeit — und kostet den Gast keinen Klick.
 *
 * Reine Rechenlogik ohne I/O; der Loader der Auswertung lädt, diese Datei
 * bündelt nach Stunde des Tages und nach Wochentag.
 *
 * **Zeitzone:** Die Stunde muss in der Zeit des Hauses gebildet werden, nicht
 * in der des Servers (Vercel läuft in UTC, das Haus in Mitteleuropa — der
 * Vormittag würde sonst um zwei Stunden verrutschen). Deshalb `Intl` mit
 * fester Zeitzone; bis Häuser eine eigene Zeitzone einstellen können, gilt
 * `HOTEL_TIME_ZONE` für alle.
 */

import { MAX_SHIFT_HOURS } from './worklog'

export const HOTEL_TIME_ZONE = 'Europe/Berlin'

export type DemandInput = {
  /** Zeitpunkte, zu denen ein Gast „Zimmer reinigen" gesetzt hat (ISO). */
  wishes: string[]
  /** Zeitpunkte, zu denen ein Gast „Bitte nicht stören" gesetzt hat (ISO). */
  dnd: string[]
  /** Check-out-Zeitpunkte (ISO). */
  checkouts: string[]
  /** Schicht-Stiche je Kraft, chronologisch: nur `shift_start`/`shift_end` werden gelesen. */
  shiftRows: { profileId: string; kind: string; at: string }[]
  range: { start: Date; end: Date }
  now?: Date
  timeZone?: string
}

export type HourBucket = {
  hour: number
  wishes: number
  dnd: number
  checkouts: number
  /** Durchschnittlich im Dienst befindliche Kräfte in dieser Stunde (über alle Tage des Zeitraums). */
  staffAvg: number
}

export type WeekdayBucket = {
  /** 0 = Montag … 6 = Sonntag. */
  weekday: number
  wishes: number
  dnd: number
  checkouts: number
}

export type DemandStats = {
  hours: HourBucket[]
  weekdays: WeekdayBucket[]
  days: number
  totalWishes: number
  totalDnd: number
  totalCheckouts: number
  /** Stunde mit den meisten Wünschen, null ohne Wünsche. */
  peakWishHour: number | null
  /** Anteil der Wünsche, die in Stunden ohne eine einzige Kraft im Dienst fielen (0…1), null ohne Wünsche. */
  uncoveredShare: number | null
}

const WEEKDAY_INDEX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }

/** Stunde (0–23) und Wochentag (0 = Montag) eines Zeitpunkts in der Zeitzone des Hauses. */
export function localParts(date: Date, timeZone: string = HOTEL_TIME_ZONE): { hour: number; weekday: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hour: 'numeric', hourCycle: 'h23', weekday: 'short',
  }).formatToParts(date)
  const hour = Number(parts.find(p => p.type === 'hour')?.value ?? 0) % 24
  const weekday = WEEKDAY_INDEX[parts.find(p => p.type === 'weekday')?.value ?? 'Mon'] ?? 0
  return { hour, weekday }
}

/** Anzahl Kalendertage im Zeitraum, mindestens 1. */
export function daysInRange(range: { start: Date; end: Date }): number {
  const ms = range.end.getTime() - range.start.getTime()
  return Math.max(1, Math.round(ms / 86_400_000))
}

type Interval = { start: Date; end: Date }

/**
 * Schichtintervalle aus den Stichen, je Kraft sequenziell gepaart und an den
 * Zeitraum geklammert. Schichten ohne Ende laufen bis „jetzt" bzw. zum
 * Zeitraumende; Schichten über `MAX_SHIFT_HOURS` gelten als vergessenes
 * Schichtende und werden — wie in worklog.ts — nicht gezählt.
 */
export function shiftIntervals(
  rows: DemandInput['shiftRows'],
  range: { start: Date; end: Date },
  now: Date = new Date(),
): Interval[] {
  const byProfile = new Map<string, { kind: string; at: Date }[]>()
  for (const r of rows) {
    if (r.kind !== 'shift_start' && r.kind !== 'shift_end') continue
    const list = byProfile.get(r.profileId) ?? []
    list.push({ kind: r.kind, at: new Date(r.at) })
    byProfile.set(r.profileId, list)
  }
  const cap = new Date(Math.min(range.end.getTime(), now.getTime()))
  const out: Interval[] = []
  for (const list of byProfile.values()) {
    list.sort((a, b) => a.at.getTime() - b.at.getTime())
    let open: Date | null = null
    for (const r of list) {
      if (r.kind === 'shift_start') {
        if (open) out.push({ start: open, end: r.at }) // Beginn ohne Ende: bis zum nächsten Beginn
        open = r.at
      } else if (open) {
        out.push({ start: open, end: r.at })
        open = null
      } else {
        out.push({ start: range.start, end: r.at }) // Ende ohne Beginn: ab Zeitraumbeginn
      }
    }
    if (open) out.push({ start: open, end: cap })
  }
  return out
    .map(i => ({
      start: new Date(Math.max(i.start.getTime(), range.start.getTime())),
      end: new Date(Math.min(i.end.getTime(), range.end.getTime())),
    }))
    .filter(i => i.end > i.start && i.end.getTime() - i.start.getTime() <= MAX_SHIFT_HOURS * 3_600_000)
}

/**
 * Minuten je lokaler Stunde, die ein Intervall abdeckt — in Schritten von
 * einer Minute gezählt, damit Zeitzonen-Übergänge und Mitternacht ohne
 * Sonderfälle richtig landen. Schichten sind kurz genug, dass das billig ist.
 */
function addMinutesPerHour(target: number[], interval: Interval, timeZone: string): void {
  const startMin = Math.floor(interval.start.getTime() / 60_000)
  const endMin = Math.ceil(interval.end.getTime() / 60_000)
  for (let m = startMin; m < endMin; m++) {
    target[localParts(new Date(m * 60_000), timeZone).hour] += 1
  }
}

export function computeDemand(input: DemandInput): DemandStats {
  const tz = input.timeZone ?? HOTEL_TIME_ZONE
  const days = daysInRange(input.range)
  const hours: HourBucket[] = Array.from({ length: 24 }, (_, hour) => ({
    hour, wishes: 0, dnd: 0, checkouts: 0, staffAvg: 0,
  }))
  const weekdays: WeekdayBucket[] = Array.from({ length: 7 }, (_, weekday) => ({
    weekday, wishes: 0, dnd: 0, checkouts: 0,
  }))

  const inRange = (iso: string) => {
    const t = new Date(iso).getTime()
    return t >= input.range.start.getTime() && t < input.range.end.getTime()
  }
  const count = (list: string[], key: 'wishes' | 'dnd' | 'checkouts') => {
    for (const iso of list) {
      if (!inRange(iso)) continue
      const p = localParts(new Date(iso), tz)
      hours[p.hour][key] += 1
      weekdays[p.weekday][key] += 1
    }
  }
  count(input.wishes, 'wishes')
  count(input.dnd, 'dnd')
  count(input.checkouts, 'checkouts')

  const staffMinutes = new Array<number>(24).fill(0)
  for (const i of shiftIntervals(input.shiftRows, input.range, input.now)) {
    addMinutesPerHour(staffMinutes, i, tz)
  }
  for (const h of hours) h.staffAvg = staffMinutes[h.hour] / (days * 60)

  const totalWishes = hours.reduce((s, h) => s + h.wishes, 0)
  const totalDnd = hours.reduce((s, h) => s + h.dnd, 0)
  const totalCheckouts = hours.reduce((s, h) => s + h.checkouts, 0)

  let peakWishHour: number | null = null
  for (const h of hours) {
    if (h.wishes > 0 && (peakWishHour === null || h.wishes > hours[peakWishHour].wishes)) peakWishHour = h.hour
  }

  const uncovered = hours.filter(h => staffMinutes[h.hour] === 0).reduce((s, h) => s + h.wishes, 0)
  const uncoveredShare = totalWishes > 0 ? uncovered / totalWishes : null

  return { hours, weekdays, days, totalWishes, totalDnd, totalCheckouts, peakWishHour, uncoveredShare }
}

export const WEEKDAY_LABEL = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
