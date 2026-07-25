/**
 * Auswertung der Reinigungs-Tätigkeiten aus `staff_log` — reine Rechenlogik,
 * kein I/O (der Loader lädt, diese Datei aggregiert).
 *
 * Die Stiche sind Zeitpunkte; Zeiträume entstehen durch Paarbildung:
 *   shift_start → shift_end       = Arbeitszeit
 *   break_start → break_end       = Pause
 *   clean_start → clean_done/-aborted = Zimmerreinigung
 *
 * Randfälle bewusst geregelt (Schichten laufen über Mitternacht, Abschlüsse
 * werden vergessen):
 *   * Paar ohne Anfang  → Anfang = Beginn des Auswertungszeitraums
 *   * Paar ohne Ende    → Ende   = Ende des Zeitraums, höchstens „jetzt"
 *   * Reinigungen, die länger als `cleaningStaleMinutes` dauern, gelten als
 *     „nicht plausibel" (vergessener Abschluss) und fließen NICHT in den
 *     Durchschnitt ein — sie werden separat ausgewiesen statt still gekappt.
 *
 * `other_cleaning` ist im Reinigungsportal ein einzelner Stich ohne Ende —
 * daraus lässt sich keine Dauer ableiten, nur eine Anzahl. Die dafür
 * aufgewendete Zeit steckt in `otherMs` („übrige Zeit").
 */

export type StaffLogRow = { kind: string; at: string; room_id: string | null }

export type CleaningRun = {
  roomId: string | null
  startedAt: string
  endedAt: string | null
  ms: number
  outcome: 'done' | 'aborted' | 'open'
  /** länger als der Stale-Timeout → vermutlich vergessener Abschluss */
  implausible: boolean
}

export type WorkStats = {
  shiftMs: number
  shiftCount: number
  breakMs: number
  /** Arbeitszeit abzüglich Pause */
  netMs: number
  /** Summe der plausiblen, abgeschlossenen Zimmerreinigungen */
  cleaningMs: number
  cleaningCount: number
  /** Anzahl der Reinigungen hinter `cleaningMs` — Basis des Durchschnitts */
  countedCount: number
  abortedCount: number
  openCount: number
  implausibleCount: number
  otherCleaningCount: number
  avgCleaningMs: number | null
  /** Netto minus Zimmerreinigung: Wege, Rüstzeiten, sonstige Reinigung */
  otherMs: number
}

export type Range = { start: Date; end: Date }

function ts(iso: string): number {
  return new Date(iso).getTime()
}

/** Intervall-Summe für ein Stich-Paar, mit Klammerung an den Zeitraum. */
function sumIntervals(
  rows: StaffLogRow[],
  startKind: string,
  endKind: string,
  range: Range,
  now: Date,
): { total: number; count: number } {
  let total = 0
  let count = 0
  let open: number | null = null

  for (const r of rows) {
    if (r.kind === startKind) {
      open = ts(r.at)
    } else if (r.kind === endKind) {
      const start = open ?? range.start.getTime()
      const end = ts(r.at)
      if (end > start) { total += end - start; count++ }
      open = null
    }
  }

  if (open !== null) {
    const end = Math.min(range.end.getTime(), now.getTime())
    if (end > open) { total += end - open; count++ }
  }
  return { total, count }
}

/** Einzelne Reinigungs-Vorgänge (für Ø-Dauer und das Detail-Protokoll). */
export function extractCleanings(
  rows: StaffLogRow[],
  range: Range,
  staleMinutes: number,
  now: Date = new Date(),
): CleaningRun[] {
  const staleMs = staleMinutes * 60_000
  const runs: CleaningRun[] = []
  let open: { roomId: string | null; startedAt: string; start: number } | null = null

  const push = (
    roomId: string | null,
    startedAt: string,
    start: number,
    endedAt: string | null,
    end: number,
    outcome: CleaningRun['outcome'],
  ) => {
    const ms = Math.max(0, end - start)
    runs.push({ roomId, startedAt, endedAt, ms, outcome, implausible: ms > staleMs })
  }

  for (const r of rows) {
    const t = ts(r.at)
    if (r.kind === 'clean_start') {
      // Zweiter Start ohne Abschluss: der erste bleibt offen stehen.
      if (open) push(open.roomId, open.startedAt, open.start, null, t, 'open')
      open = { roomId: r.room_id, startedAt: r.at, start: t }
    } else if (r.kind === 'clean_done' || r.kind === 'clean_aborted') {
      const start = open ? open.start : range.start.getTime()
      const startedAt = open ? open.startedAt : range.start.toISOString()
      push(
        open?.roomId ?? r.room_id,
        startedAt,
        start,
        r.at,
        t,
        r.kind === 'clean_aborted' ? 'aborted' : 'done',
      )
      open = null
    }
  }

  if (open) {
    push(open.roomId, open.startedAt, open.start, null, Math.min(range.end.getTime(), now.getTime()), 'open')
  }
  return runs
}

/** Kennzahlen einer Kraft (oder eines Tages) aus ihren Stichen. */
export function computeWorkStats(
  rows: StaffLogRow[],
  range: Range,
  staleMinutes: number,
  now: Date = new Date(),
): WorkStats {
  const sorted = [...rows].sort((a, b) => a.at.localeCompare(b.at))

  const shift = sumIntervals(sorted, 'shift_start', 'shift_end', range, now)
  const brk = sumIntervals(sorted, 'break_start', 'break_end', range, now)
  const cleanings = extractCleanings(sorted, range, staleMinutes, now)

  const counted = cleanings.filter(c => c.outcome === 'done' && !c.implausible)
  const cleaningMs = counted.reduce((sum, c) => sum + c.ms, 0)
  const netMs = Math.max(0, shift.total - brk.total)

  return {
    shiftMs: shift.total,
    shiftCount: shift.count,
    breakMs: brk.total,
    netMs,
    cleaningMs,
    cleaningCount: cleanings.filter(c => c.outcome === 'done').length,
    countedCount: counted.length,
    abortedCount: cleanings.filter(c => c.outcome === 'aborted').length,
    openCount: cleanings.filter(c => c.outcome === 'open').length,
    implausibleCount: cleanings.filter(c => c.implausible).length,
    otherCleaningCount: sorted.filter(r => r.kind === 'other_cleaning').length,
    avgCleaningMs: counted.length > 0 ? Math.round(cleaningMs / counted.length) : null,
    otherMs: Math.max(0, netMs - cleaningMs),
  }
}

export function emptyStats(): WorkStats {
  return {
    shiftMs: 0, shiftCount: 0, breakMs: 0, netMs: 0, cleaningMs: 0, cleaningCount: 0,
    countedCount: 0, abortedCount: 0, openCount: 0, implausibleCount: 0,
    otherCleaningCount: 0, avgCleaningMs: null, otherMs: 0,
  }
}

/** Summiert Kennzahlen mehrerer Kräfte zu einer Hausbilanz. */
export function sumStats(all: WorkStats[]): WorkStats {
  const total = all.reduce((acc, s) => ({
    shiftMs: acc.shiftMs + s.shiftMs,
    shiftCount: acc.shiftCount + s.shiftCount,
    breakMs: acc.breakMs + s.breakMs,
    netMs: acc.netMs + s.netMs,
    cleaningMs: acc.cleaningMs + s.cleaningMs,
    cleaningCount: acc.cleaningCount + s.cleaningCount,
    countedCount: acc.countedCount + s.countedCount,
    abortedCount: acc.abortedCount + s.abortedCount,
    openCount: acc.openCount + s.openCount,
    implausibleCount: acc.implausibleCount + s.implausibleCount,
    otherCleaningCount: acc.otherCleaningCount + s.otherCleaningCount,
    avgCleaningMs: null,
    otherMs: acc.otherMs + s.otherMs,
  }), emptyStats())
  // Ø aus den Summen, nicht als Mittel der Mittelwerte (sonst zählte die
  // Kraft mit zwei Reinigungen so schwer wie die mit zwanzig).
  total.avgCleaningMs = total.countedCount > 0
    ? Math.round(total.cleaningMs / total.countedCount)
    : null
  return total
}

// ── Formatierung ────────────────────────────────────────────────────────────

/** „3 h 25 min", „42 min", „—" */
export function formatDuration(ms: number | null): string {
  if (ms === null || ms <= 0) return '—'
  const totalMin = Math.round(ms / 60_000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

/** Lokaler Tagesschlüssel „YYYY-MM-DD" (Server-Zeitzone, wie todayStartIso). */
export function dayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Tagesgrenzen (lokal) für einen „YYYY-MM-DD"-Schlüssel. */
export function dayRange(key: string): Range {
  const [y, m, d] = key.split('-').map(Number)
  return { start: new Date(y, m - 1, d), end: new Date(y, m - 1, d + 1) }
}
