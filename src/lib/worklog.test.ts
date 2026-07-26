import { describe, expect, it } from 'vitest'
import {
  computeWorkStats, dayKey, dayRange, extractCleanings, formatDuration,
  MAX_BREAK_HOURS, MAX_SHIFT_HOURS, sumStats, type StaffLogRow,
} from './worklog'

/** Stich am 26.07.2026 zur angegebenen Uhrzeit (lokal). */
function stich(kind: string, h: number, m = 0, roomId: string | null = null): StaffLogRow {
  return { kind, at: new Date(2026, 6, 26, h, m).toISOString(), room_id: roomId }
}

const TAG = dayRange('2026-07-26')
const ENDE_DES_TAGES = new Date(2026, 6, 26, 23, 59)
const STALE = 90

describe('computeWorkStats — Paarbildung', () => {
  it('rechnet Schicht, Pause und Netto zusammen', () => {
    const rows = [
      stich('shift_start', 8), stich('break_start', 12), stich('break_end', 12, 30),
      stich('shift_end', 16),
    ]
    const s = computeWorkStats(rows, TAG, STALE, ENDE_DES_TAGES)
    expect(s.shiftMs).toBe(8 * 3_600_000)
    expect(s.breakMs).toBe(30 * 60_000)
    expect(s.netMs).toBe(8 * 3_600_000 - 30 * 60_000)
    expect(s.shiftCount).toBe(1)
  })

  it('klammert ein Paar ohne Anfang an den Zeitraumbeginn', () => {
    // Schicht lief über Mitternacht: heute gibt es nur das Ende.
    const s = computeWorkStats([stich('shift_end', 6)], TAG, STALE, ENDE_DES_TAGES)
    expect(s.shiftMs).toBe(6 * 3_600_000)
  })

  it('klammert ein Paar ohne Ende an "jetzt"', () => {
    const jetzt = new Date(2026, 6, 26, 11, 0)
    const s = computeWorkStats([stich('shift_start', 8)], TAG, STALE, jetzt)
    expect(s.shiftMs).toBe(3 * 3_600_000)
  })

  it('sortiert unsortierte Stiche vor der Auswertung', () => {
    const s = computeWorkStats(
      [stich('shift_end', 16), stich('shift_start', 8)], TAG, STALE, ENDE_DES_TAGES,
    )
    expect(s.shiftMs).toBe(8 * 3_600_000)
  })
})

describe('computeWorkStats — Plausibilitätsgrenzen', () => {
  it('nimmt eine Schicht über der Grenze aus der Summe und zählt sie separat', () => {
    // Vergessenes Schichtende: ohne diese Regel liefe der Zähler tagelang
    // weiter und machte die Arbeitszeit-Summe unbrauchbar.
    const start = new Date(2026, 6, 26, 0, 0)
    const zuSpaet = new Date(start.getTime() + (MAX_SHIFT_HOURS + 1) * 3_600_000)
    const rows: StaffLogRow[] = [
      { kind: 'shift_start', at: start.toISOString(), room_id: null },
      { kind: 'shift_end', at: zuSpaet.toISOString(), room_id: null },
    ]
    const zweiTage = { start, end: new Date(2026, 6, 28) }

    const s = computeWorkStats(rows, zweiTage, STALE, zweiTage.end)
    expect(s.shiftMs).toBe(0)
    expect(s.implausibleShiftCount).toBe(1)
    expect(s.shiftCount).toBe(0)
  })

  it('nimmt eine Pause über der Grenze aus der Summe', () => {
    const rows: StaffLogRow[] = [
      stich('shift_start', 0),
      stich('break_start', 1),
      stich('break_end', 1 + MAX_BREAK_HOURS + 1),
      stich('shift_end', 23),
    ]
    const s = computeWorkStats(rows, TAG, STALE, ENDE_DES_TAGES)
    expect(s.breakMs).toBe(0)
    expect(s.implausibleBreakCount).toBe(1)
  })

  it('lässt eine Schicht knapp unter der Grenze normal durchlaufen', () => {
    const start = new Date(2026, 6, 26, 0, 0)
    const knapp = new Date(start.getTime() + (MAX_SHIFT_HOURS - 1) * 3_600_000)
    const rows: StaffLogRow[] = [
      { kind: 'shift_start', at: start.toISOString(), room_id: null },
      { kind: 'shift_end', at: knapp.toISOString(), room_id: null },
    ]
    const s = computeWorkStats(rows, { start, end: new Date(2026, 6, 28) }, STALE, new Date(2026, 6, 28))
    expect(s.shiftMs).toBe((MAX_SHIFT_HOURS - 1) * 3_600_000)
    expect(s.implausibleShiftCount).toBe(0)
  })
})

describe('extractCleanings', () => {
  it('bildet abgeschlossene und abgebrochene Reinigungen', () => {
    const rows = [
      stich('clean_start', 9, 0, 'r1'), stich('clean_done', 9, 20, 'r1'),
      stich('clean_start', 10, 0, 'r2'), stich('clean_aborted', 10, 5, 'r2'),
    ]
    const runs = extractCleanings(rows, TAG, STALE, ENDE_DES_TAGES)
    expect(runs).toHaveLength(2)
    expect(runs[0]).toMatchObject({ roomId: 'r1', outcome: 'done', ms: 20 * 60_000 })
    expect(runs[1]).toMatchObject({ roomId: 'r2', outcome: 'aborted' })
  })

  it('lässt einen zweiten Start den ersten als offen zurück', () => {
    const rows = [stich('clean_start', 9, 0, 'r1'), stich('clean_start', 9, 30, 'r2')]
    const runs = extractCleanings(rows, TAG, STALE, ENDE_DES_TAGES)
    expect(runs.map(r => r.outcome)).toEqual(['open', 'open'])
    expect(runs[0].roomId).toBe('r1')
  })

  it('markiert eine Reinigung über dem Stale-Timeout als unplausibel', () => {
    const rows = [stich('clean_start', 8, 0, 'r1'), stich('clean_done', 11, 0, 'r1')]
    const runs = extractCleanings(rows, TAG, STALE, ENDE_DES_TAGES)
    expect(runs[0].implausible).toBe(true)
  })
})

describe('computeWorkStats — Reinigungen', () => {
  it('zählt nur plausible Abschlüsse in Summe und Durchschnitt', () => {
    const rows = [
      stich('shift_start', 8),
      stich('clean_start', 9, 0, 'r1'), stich('clean_done', 9, 20, 'r1'),   // 20 min, zählt
      stich('clean_start', 10, 0, 'r2'), stich('clean_done', 12, 30, 'r2'), // 2,5 h → unplausibel
      stich('clean_start', 13, 0, 'r3'), stich('clean_aborted', 13, 10, 'r3'),
      stich('shift_end', 16),
    ]
    const s = computeWorkStats(rows, TAG, STALE, ENDE_DES_TAGES)
    expect(s.cleaningCount).toBe(2)      // beide abgeschlossen
    expect(s.countedCount).toBe(1)       // nur einer plausibel
    expect(s.cleaningMs).toBe(20 * 60_000)
    expect(s.avgCleaningMs).toBe(20 * 60_000)
    expect(s.implausibleCount).toBe(1)
    expect(s.abortedCount).toBe(1)
  })

  it('weist sonstige Reinigung als Zeitraum aus und rechnet die übrige Zeit', () => {
    const rows = [
      stich('shift_start', 8),
      stich('other_start', 9), stich('other_end', 9, 30),
      stich('clean_start', 10, 0, 'r1'), stich('clean_done', 10, 30, 'r1'),
      stich('shift_end', 12),
    ]
    const s = computeWorkStats(rows, TAG, STALE, ENDE_DES_TAGES)
    expect(s.otherCleaningMs).toBe(30 * 60_000)
    expect(s.otherCleaningCount).toBe(1)
    // Netto 4 h − 30 min Zimmer − 30 min sonstige = 3 h
    expect(s.unassignedMs).toBe(3 * 3_600_000)
  })

  it('zählt Alt-Stiche other_cleaning separat, ohne Dauer', () => {
    const s = computeWorkStats([stich('other_cleaning', 9)], TAG, STALE, ENDE_DES_TAGES)
    expect(s.legacyOtherCount).toBe(1)
    expect(s.otherCleaningMs).toBe(0)
  })

  it('liefert keinen Durchschnitt ohne gezählte Reinigung', () => {
    expect(computeWorkStats([], TAG, STALE, ENDE_DES_TAGES).avgCleaningMs).toBeNull()
  })
})

describe('sumStats', () => {
  it('bildet den Durchschnitt aus den Summen, nicht aus den Mittelwerten', () => {
    const wenig = computeWorkStats(
      [stich('clean_start', 9, 0, 'r1'), stich('clean_done', 9, 10, 'r1')],
      TAG, STALE, ENDE_DES_TAGES,
    )
    const viel = computeWorkStats(
      [
        stich('clean_start', 9, 0, 'a'), stich('clean_done', 9, 30, 'a'),
        stich('clean_start', 10, 0, 'b'), stich('clean_done', 10, 30, 'b'),
        stich('clean_start', 11, 0, 'c'), stich('clean_done', 11, 30, 'c'),
      ],
      TAG, STALE, ENDE_DES_TAGES,
    )
    const total = sumStats([wenig, viel])
    expect(total.countedCount).toBe(4)
    // (10 + 30 + 30 + 30) / 4 = 25 min — nicht (10 + 30) / 2 = 20 min
    expect(total.avgCleaningMs).toBe(25 * 60_000)
  })
})

describe('formatDuration', () => {
  it('formatiert Stunden und Minuten', () => {
    expect(formatDuration(3 * 3_600_000 + 25 * 60_000)).toBe('3 h 25 min')
    expect(formatDuration(2 * 3_600_000)).toBe('2 h')
    expect(formatDuration(42 * 60_000)).toBe('42 min')
  })

  it('kennzeichnet Kleinstwerte und Nichts', () => {
    expect(formatDuration(5_000)).toBe('< 1 min')
    expect(formatDuration(0)).toBe('—')
    expect(formatDuration(null)).toBe('—')
  })
})

describe('dayKey / dayRange', () => {
  it('erzeugt einen lokalen Tagesschlüssel', () => {
    expect(dayKey(new Date(2026, 6, 5, 23, 30))).toBe('2026-07-05')
  })

  it('spannt den lokalen Tag auf, Ende exklusiv', () => {
    const r = dayRange('2026-07-05')
    expect(r.start).toEqual(new Date(2026, 6, 5))
    expect(r.end).toEqual(new Date(2026, 6, 6))
  })

  it('rollt über den Monatswechsel', () => {
    expect(dayRange('2026-07-31').end).toEqual(new Date(2026, 7, 1))
  })
})
