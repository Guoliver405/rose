import { describe, expect, it } from 'vitest'
import {
  addDaysKey, formatHHMM, isValidTimeZone, parseTimeZone, zonedDateKey, zonedDayRange,
  zonedInstant, zonedMinutesOfDay, zonedParts, zonedTimeToday, zonedTodayStart,
} from './tz'

const BERLIN = 'Europe/Berlin'

describe('zonedParts / zonedDateKey', () => {
  it('rechnet UTC in die Ortszeit um — Sommerzeit +2', () => {
    const p = zonedParts(new Date('2026-09-06T22:30:00Z'), BERLIN)
    expect(p).toMatchObject({ year: 2026, month: 9, day: 7, hour: 0, minute: 30, weekday: 0 })
    expect(zonedDateKey(new Date('2026-09-06T22:30:00Z'), BERLIN)).toBe('2026-09-07')
  })

  it('rechnet im Winter +1', () => {
    expect(zonedParts(new Date('2026-01-10T23:30:00Z'), BERLIN)).toMatchObject({ day: 11, hour: 0, minute: 30 })
  })

  it('kennt andere Zeitzonen', () => {
    expect(zonedParts(new Date('2026-09-06T22:30:00Z'), 'Asia/Bangkok').hour).toBe(5)
    expect(zonedParts(new Date('2026-09-06T22:30:00Z'), 'America/New_York').hour).toBe(18)
  })
})

describe('zonedInstant', () => {
  it('bildet die Ortszeit auf den richtigen Zeitpunkt ab', () => {
    expect(zonedInstant(BERLIN, 2026, 9, 7, 0, 30).toISOString()).toBe('2026-09-06T22:30:00.000Z')
    expect(zonedInstant(BERLIN, 2026, 1, 11, 0, 30).toISOString()).toBe('2026-01-10T23:30:00.000Z')
  })

  it('trifft den Tag des Sommerzeit-Wechsels', () => {
    // 29.03.2026: 02:00 → 03:00. 01:30 ist noch Winterzeit (+1), 03:30 schon Sommerzeit (+2).
    expect(zonedInstant(BERLIN, 2026, 3, 29, 1, 30).toISOString()).toBe('2026-03-29T00:30:00.000Z')
    expect(zonedInstant(BERLIN, 2026, 3, 29, 3, 30).toISOString()).toBe('2026-03-29T01:30:00.000Z')
  })

  it('ist die Umkehrung von zonedParts', () => {
    const t = new Date('2026-07-15T10:17:00Z')
    const p = zonedParts(t, BERLIN)
    expect(zonedInstant(BERLIN, p.year, p.month, p.day, p.hour, p.minute).getTime()).toBe(t.getTime())
  })
})

describe('Tagesgrenzen und Uhrzeiten', () => {
  it('zonedDayRange liefert Mitternacht bis Mitternacht vor Ort', () => {
    const r = zonedDayRange('2026-09-07', BERLIN)
    expect(r.start.toISOString()).toBe('2026-09-06T22:00:00.000Z')
    expect(r.end.toISOString()).toBe('2026-09-07T22:00:00.000Z')
  })

  it('zonedTodayStart und zonedTimeToday beziehen sich auf den Ortstag von now', () => {
    const now = new Date('2026-09-06T22:30:00Z') // 07.09. 00:30 Berlin
    expect(zonedTodayStart(now, BERLIN).toISOString()).toBe('2026-09-06T22:00:00.000Z')
    expect(zonedTimeToday(now, BERLIN, 11, 0).toISOString()).toBe('2026-09-07T09:00:00.000Z')
  })

  it('zonedMinutesOfDay und formatHHMM', () => {
    const t = new Date('2026-09-07T09:05:00Z')
    expect(zonedMinutesOfDay(t, BERLIN)).toBe(11 * 60 + 5)
    expect(formatHHMM(t, BERLIN)).toBe('11:05')
  })

  it('addDaysKey rechnet über Monats- und Jahresgrenzen', () => {
    expect(addDaysKey('2026-09-30', 1)).toBe('2026-10-01')
    expect(addDaysKey('2027-01-01', -1)).toBe('2026-12-31')
    expect(addDaysKey('kaputt', 1)).toBe('kaputt')
  })
})

describe('parseTimeZone', () => {
  it('nimmt eine gültige Zone und fällt sonst auf Europe/Berlin zurück', () => {
    expect(parseTimeZone({ timeZone: 'Asia/Bangkok' })).toBe('Asia/Bangkok')
    expect(parseTimeZone({ timeZone: 'Mars/Olympus' })).toBe(BERLIN)
    expect(parseTimeZone({})).toBe(BERLIN)
    expect(isValidTimeZone('')).toBe(false)
  })
})
