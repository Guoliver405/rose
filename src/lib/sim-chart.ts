/**
 * Verteilung über viele Tage als Säulen je Zeitklasse (Simulator Phase 3,
 * 26.09.2026). Beide Reihen — ohne Steuerung und mit RoSe — teilen sich die
 * Achse, sonst sähe ein Vorsprung größer oder kleiner aus, als er ist.
 * Werte ab dem Arbeitsende gelten als „nicht fertig" und stehen in einer
 * eigenen Klasse rechts. Reine Rechnung ohne I/O.
 */

export type Bin = { from: number; to: number; count: number }

export type Histogram = {
  /** Achse in Schichtminuten, auf volle Stunden gerundet. */
  domain: [number, number]
  bins: Bin[]
  /** Tage, an denen der Wert das Arbeitsende erreicht (nicht fertig). */
  notDone: number
  maxCount: number
}

export const BIN_MINUTES = 10

/**
 * Klassen für mehrere Reihen auf gemeinsamer Achse. `shiftStart` (Minuten
 * des Tages) rundet die Achse auf volle Uhrzeit-Stunden, nicht Schichtstunden.
 */
export function histograms(series: number[][], opts: { horizon: number; shiftStart: number; binMinutes?: number }): Histogram[] {
  const bin = opts.binMinutes ?? BIN_MINUTES
  const done = series.map(vs => vs.filter(v => v < opts.horizon))
  const all = done.flat()
  const toClockHour = (rel: number, dir: 'floor' | 'ceil') => Math[dir]((rel + opts.shiftStart) / 60) * 60 - opts.shiftStart
  const lo = all.length ? toClockHour(Math.min(...all), 'floor') : 0
  let hi = all.length ? toClockHour(Math.max(...all) + 1, 'ceil') : 60
  if (hi <= lo) hi = lo + 60
  const n = Math.ceil((hi - lo) / bin)
  const result = series.map((vs, i) => {
    const bins: Bin[] = Array.from({ length: n }, (_, k) => ({ from: lo + k * bin, to: lo + (k + 1) * bin, count: 0 }))
    for (const v of done[i]) bins[Math.min(n - 1, Math.floor((v - lo) / bin))].count++
    return { domain: [lo, hi] as [number, number], bins, notDone: vs.length - done[i].length, maxCount: 0 }
  })
  // Gemeinsame Höhe: sonst wöge eine Säule links anders als rechts.
  const maxCount = Math.max(1, ...result.flatMap(h => [...h.bins.map(b => b.count), h.notDone]))
  return result.map(h => ({ ...h, maxCount }))
}
