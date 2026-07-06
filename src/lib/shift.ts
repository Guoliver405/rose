/**
 * Schicht-Zustand einer Reinigungskraft, abgeleitet aus staff_log-Stichen.
 *
 * Kein eigener Zustands-Speicher: der jüngste shift_start/shift_end bzw.
 * break_start/break_end entscheidet. Schichtbeginn/-ende rahmen die
 * Reinigungs-Aktionen ein; Pause + sonstige Reinigung sind frei stechbar
 * und werden nur geloggt.
 */

export type StaffLogEntry = { kind: string; at: string }

export type ShiftState = {
  onShift: boolean
  onBreak: boolean
  shiftStartedAt: string | null
  breakStartedAt: string | null
}

/** Erwartet Einträge absteigend nach `at` sortiert (jüngster zuerst). */
export function deriveShiftState(entries: StaffLogEntry[]): ShiftState {
  const lastShift = entries.find(e => e.kind === 'shift_start' || e.kind === 'shift_end')
  const onShift = lastShift?.kind === 'shift_start'

  if (!onShift) {
    return { onShift: false, onBreak: false, shiftStartedAt: null, breakStartedAt: null }
  }

  // Pause zählt nur innerhalb der laufenden Schicht.
  const lastBreak = entries.find(
    e => (e.kind === 'break_start' || e.kind === 'break_end') && e.at >= lastShift!.at,
  )
  const onBreak = lastBreak?.kind === 'break_start'

  return {
    onShift: true,
    onBreak,
    shiftStartedAt: lastShift!.at,
    breakStartedAt: onBreak ? lastBreak!.at : null,
  }
}
