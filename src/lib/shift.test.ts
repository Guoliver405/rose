import { describe, expect, it } from 'vitest'
import { deriveShiftState, type StaffLogEntry } from './shift'

/**
 * `deriveShiftState` erwartet die Stiche ABSTEIGEND sortiert (jüngster zuerst)
 * — genau so lädt der Loader sie.
 */
function log(...entries: [string, string][]): StaffLogEntry[] {
  return entries.map(([kind, at]) => ({ kind, at }))
}

describe('deriveShiftState', () => {
  it('ist ohne Stiche außerhalb der Schicht', () => {
    expect(deriveShiftState([])).toMatchObject({ onShift: false, onBreak: false, onOther: false })
  })

  it('erkennt die laufende Schicht am jüngsten Stich', () => {
    const s = deriveShiftState(log(['shift_start', '2026-07-26T08:00:00Z']))
    expect(s.onShift).toBe(true)
    expect(s.shiftStartedAt).toBe('2026-07-26T08:00:00Z')
  })

  it('ist nach dem Schichtende wieder außerhalb', () => {
    const s = deriveShiftState(log(
      ['shift_end', '2026-07-26T16:00:00Z'],
      ['shift_start', '2026-07-26T08:00:00Z'],
    ))
    expect(s.onShift).toBe(false)
    expect(s.shiftStartedAt).toBeNull()
  })

  it('erkennt die laufende Pause innerhalb der Schicht', () => {
    const s = deriveShiftState(log(
      ['break_start', '2026-07-26T12:00:00Z'],
      ['shift_start', '2026-07-26T08:00:00Z'],
    ))
    expect(s.onBreak).toBe(true)
    expect(s.breakStartedAt).toBe('2026-07-26T12:00:00Z')
  })

  it('ist nach dem Pausenende wieder auf Schicht', () => {
    const s = deriveShiftState(log(
      ['break_end', '2026-07-26T12:30:00Z'],
      ['break_start', '2026-07-26T12:00:00Z'],
      ['shift_start', '2026-07-26T08:00:00Z'],
    ))
    expect(s.onShift).toBe(true)
    expect(s.onBreak).toBe(false)
    expect(s.breakStartedAt).toBeNull()
  })

  it('ignoriert Pausen aus einer FRÜHEREN Schicht', () => {
    // Sonst schleppte eine vergessene Pause von gestern in die neue Schicht.
    const s = deriveShiftState(log(
      ['shift_start', '2026-07-26T08:00:00Z'],
      ['break_start', '2026-07-25T12:00:00Z'],
      ['shift_end', '2026-07-25T16:00:00Z'],
    ))
    expect(s.onShift).toBe(true)
    expect(s.onBreak).toBe(false)
  })

  it('erkennt die laufende sonstige Reinigung', () => {
    const s = deriveShiftState(log(
      ['other_start', '2026-07-26T09:00:00Z'],
      ['shift_start', '2026-07-26T08:00:00Z'],
    ))
    expect(s.onOther).toBe(true)
    expect(s.otherStartedAt).toBe('2026-07-26T09:00:00Z')
  })

  it('meldet außerhalb der Schicht weder Pause noch sonstige Reinigung', () => {
    const s = deriveShiftState(log(
      ['shift_end', '2026-07-26T16:00:00Z'],
      ['break_start', '2026-07-26T12:00:00Z'],
      ['other_start', '2026-07-26T09:00:00Z'],
      ['shift_start', '2026-07-26T08:00:00Z'],
    ))
    expect(s).toMatchObject({ onShift: false, onBreak: false, onOther: false })
  })
})
