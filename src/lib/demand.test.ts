import { describe, expect, it } from 'vitest'
import { computeDemand, daysInRange, localParts, shiftIntervals } from './demand'

// Feste Zeitpunkte in UTC; das Haus rechnet in Europe/Berlin (Sommerzeit: +2 h).
const range = { start: new Date('2026-08-31T22:00:00Z'), end: new Date('2026-09-07T22:00:00Z') } // Mo 01.09. – So 07.09. lokal
const now = new Date('2026-09-10T12:00:00Z')

describe('localParts', () => {
  it('bildet Stunde und Wochentag in der Zeit des Hauses, nicht in UTC', () => {
    // 07:30 UTC = 09:30 in Berlin, Dienstag 01.09.2026
    expect(localParts(new Date('2026-09-01T07:30:00Z'))).toEqual({ hour: 9, weekday: 1 })
    // 22:30 UTC Sonntag = 00:30 Montag in Berlin
    expect(localParts(new Date('2026-09-06T22:30:00Z'))).toEqual({ hour: 0, weekday: 0 })
  })
})

describe('daysInRange', () => {
  it('zählt Kalendertage, mindestens einen', () => {
    expect(daysInRange(range)).toBe(7)
    expect(daysInRange({ start: new Date(0), end: new Date(0) })).toBe(1)
  })
})

describe('shiftIntervals', () => {
  it('paart Beginn und Ende je Kraft und klammert an den Zeitraum', () => {
    const rows = [
      { profileId: 'a', kind: 'shift_start', at: '2026-09-01T06:00:00Z' },
      { profileId: 'a', kind: 'shift_end', at: '2026-09-01T12:00:00Z' },
      { profileId: 'b', kind: 'shift_end', at: '2026-09-01T02:00:00Z' }, // Ende ohne Beginn → ab Zeitraumbeginn
    ]
    const out = shiftIntervals(rows, range, now)
    expect(out).toHaveLength(2)
    expect(out[0]).toEqual({ start: new Date('2026-09-01T06:00:00Z'), end: new Date('2026-09-01T12:00:00Z') })
    expect(out[1]).toEqual({ start: range.start, end: new Date('2026-09-01T02:00:00Z') })
  })

  it('lässt eine vergessene Schicht (über 16 h) aus — wie worklog.ts', () => {
    const rows = [{ profileId: 'a', kind: 'shift_start', at: '2026-09-01T06:00:00Z' }]
    expect(shiftIntervals(rows, range, now)).toHaveLength(0)
  })

  it('beendet eine offene Schicht bei „jetzt", wenn das vor dem Zeitraumende liegt', () => {
    const rows = [{ profileId: 'a', kind: 'shift_start', at: '2026-09-07T06:00:00Z' }]
    const out = shiftIntervals(rows, range, new Date('2026-09-07T10:00:00Z'))
    expect(out[0].end).toEqual(new Date('2026-09-07T10:00:00Z'))
  })
})

describe('computeDemand', () => {
  const wishes = [
    '2026-09-01T07:15:00Z', // Di 09:15
    '2026-09-01T07:50:00Z', // Di 09:50
    '2026-09-03T12:05:00Z', // Do 14:05
    '2026-09-20T07:00:00Z', // außerhalb des Zeitraums
  ]
  const checkouts = ['2026-09-02T08:40:00Z'] // Mi 10:40
  const dnd = ['2026-09-05T06:30:00Z'] // Sa 08:30
  const shiftRows = [
    { profileId: 'a', kind: 'shift_start', at: '2026-09-01T06:00:00Z' }, // Di 08:00–12:00 lokal
    { profileId: 'a', kind: 'shift_end', at: '2026-09-01T10:00:00Z' },
  ]

  it('bündelt Wünsche, DND und Abreisen nach lokaler Stunde und Wochentag', () => {
    const d = computeDemand({ wishes, dnd, checkouts, shiftRows, range, now })
    expect(d.totalWishes).toBe(3)
    expect(d.hours[9].wishes).toBe(2)
    expect(d.hours[14].wishes).toBe(1)
    expect(d.hours[10].checkouts).toBe(1)
    expect(d.hours[8].dnd).toBe(1)
    expect(d.weekdays[1].wishes).toBe(2) // Dienstag
    expect(d.weekdays[3].wishes).toBe(1) // Donnerstag
    expect(d.weekdays[2].checkouts).toBe(1) // Mittwoch
    expect(d.peakWishHour).toBe(9)
  })

  it('rechnet Kräfte im Dienst als Durchschnitt über die Tage des Zeitraums', () => {
    const d = computeDemand({ wishes, dnd, checkouts, shiftRows, range, now })
    // Eine Kraft, vier Stunden an einem von sieben Tagen: in diesen Stunden 1/7.
    expect(d.hours[8].staffAvg).toBeCloseTo(1 / 7, 5)
    expect(d.hours[11].staffAvg).toBeCloseTo(1 / 7, 5)
    expect(d.hours[12].staffAvg).toBe(0)
  })

  it('weist den Anteil der Wünsche ohne eine Kraft im Dienst aus', () => {
    const d = computeDemand({ wishes, dnd, checkouts, shiftRows, range, now })
    // Zwei Wünsche um 9 Uhr (abgedeckt), einer um 14 Uhr (niemand im Dienst).
    expect(d.uncoveredShare).toBeCloseTo(1 / 3, 5)
  })

  it('liefert null-Kennzahlen ohne Wünsche', () => {
    const d = computeDemand({ wishes: [], dnd: [], checkouts: [], shiftRows: [], range, now })
    expect(d.peakWishHour).toBeNull()
    expect(d.uncoveredShare).toBeNull()
    expect(d.totalWishes).toBe(0)
  })
})
