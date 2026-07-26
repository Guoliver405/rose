import { describe, expect, it } from 'vitest'
import { countBillableRooms, isBillable, monthPeriod, type BillableRoom } from './rooms'

/**
 * Abrechnungsregel (entschieden 26.07.2026):
 * Jedes Zimmer, das in der Periode AUCH NUR VORÜBERGEHEND aktiv war, zählt.
 * Nur wer die ganze Periode über deaktiviert war (oder noch gar nicht
 * existierte), fällt heraus.
 */

const JULI = { start: new Date(2026, 6, 1), end: new Date(2026, 7, 1) }

function room(created: string, deactivated: string | null = null): BillableRoom {
  return { created_at: created, deactivated_at: deactivated }
}

describe('isBillable', () => {
  it('zählt ein durchgehend aktives Zimmer', () => {
    expect(isBillable(room('2026-01-15T10:00:00Z'), JULI)).toBe(true)
  })

  it('zählt ein mitten im Monat deaktiviertes Zimmer noch mit', () => {
    // Der Kern der Regel: vorübergehend aktiv genügt.
    expect(isBillable(room('2026-01-15T10:00:00Z', '2026-07-15T10:00:00Z'), JULI)).toBe(true)
  })

  it('zählt ein mitten im Monat angelegtes Zimmer', () => {
    expect(isBillable(room('2026-07-20T10:00:00Z'), JULI)).toBe(true)
  })

  it('zählt NICHT, wer vor dem Monat schon deaktiviert war', () => {
    expect(isBillable(room('2026-01-15T10:00:00Z', '2026-06-30T10:00:00Z'), JULI)).toBe(false)
  })

  it('zählt NICHT, wer erst nach dem Monat angelegt wurde', () => {
    expect(isBillable(room('2026-08-02T10:00:00Z'), JULI)).toBe(false)
  })

  it('behandelt die Periodenränder als [start, end)', () => {
    // Genau zum Periodenende angelegt → gehört in den Folgemonat.
    expect(isBillable(room(JULI.end.toISOString()), JULI)).toBe(false)
    // Genau zum Periodenbeginn deaktiviert → war in diesem Monat nie aktiv.
    expect(isBillable(room('2026-01-01T00:00:00Z', JULI.start.toISOString()), JULI)).toBe(false)
  })
})

describe('countBillableRooms', () => {
  it('summiert nur die abrechenbaren Zimmer', () => {
    const rooms = [
      room('2026-01-01T00:00:00Z'),                            // aktiv
      room('2026-01-01T00:00:00Z', '2026-07-15T00:00:00Z'),    // im Monat deaktiviert → zählt
      room('2026-01-01T00:00:00Z', '2026-05-01T00:00:00Z'),    // lange vorher raus
      room('2026-09-01T00:00:00Z'),                            // erst später angelegt
    ]
    expect(countBillableRooms(rooms, JULI)).toBe(2)
  })

  it('ist bei leerer Liste 0', () => {
    expect(countBillableRooms([], JULI)).toBe(0)
  })
})

describe('monthPeriod', () => {
  it('spannt den Kalendermonat des Stichtags auf, Ende exklusiv', () => {
    const p = monthPeriod(new Date(2026, 6, 26, 13, 45))
    expect(p.start).toEqual(new Date(2026, 6, 1))
    expect(p.end).toEqual(new Date(2026, 7, 1))
  })

  it('rollt über den Jahreswechsel', () => {
    const p = monthPeriod(new Date(2026, 11, 31))
    expect(p.end).toEqual(new Date(2027, 0, 1))
  })
})
