/**
 * Simulator über viele Tage (Phase 1, 26.09.2026): derselbe Rechenkern wie
 * der Tagesvergleich der Landing Page (`cleaning-sim.ts`), aber für ein
 * beliebiges Haus und viele Tage. Jeder Tag ist ein eigener Startwert —
 * andere Gäste, andere Abreisen —, beide Reinigungspolitiken und beide
 * Koordinationen laufen auf denselben Gästen.
 *
 * Hier liegt nur Rechnung ohne I/O: ein Tag (`runDay`), die Auswertung
 * (`summarize`) und das Protokoll des Web Workers (`runBatch`) — der Worker
 * selbst reicht nur die Nachrichten durch und ist dadurch hier testbar.
 */

import {
  LIMITS, buildScenario, middleSeed, paramsFor, simulate, validateConfig,
  type Coordination, type Policy, type ScenarioConfig, type SimResult,
} from './cleaning-sim'

export type RunMetrics = SimResult['metrics']

export type DayRun = {
  seed: number
  /** Meldung des Sonderfalls (Schichtminute), null = kein passendes Zimmer an diesem Tag. */
  complaintAt: number | null
} & Record<Policy, Record<Coordination, RunMetrics>>

export const POLICIES: Policy[] = ['routine', 'onDemand']
export const COORDS: Coordination[] = ['paper', 'rose']

export function runDay(config: ScenarioConfig, seed: number): DayRun {
  const scn = buildScenario(seed, config)
  const side = (p: Policy) => Object.fromEntries(COORDS.map(c => [c, simulate(c, p, scn).metrics])) as Record<Coordination, RunMetrics>
  return { seed, complaintAt: scn.complaint?.at ?? null, routine: side('routine'), onDemand: side('onDemand') }
}

// ── Auswertung ────────────────────────────────────────────────────────────

/** Verteilung über die Tage: 10. Perzentil, Median, 90. Perzentil, Mittel. */
export type Dist = { p10: number; median: number; p90: number; mean: number }

/** Perzentile über den nächsten Rang — bei 101 Tagen ist der Median genau der 51. Wert. */
export function dist(values: number[]): Dist {
  if (values.length === 0) return { p10: NaN, median: NaN, p90: NaN, mean: NaN }
  const s = [...values].sort((a, b) => a - b)
  const at = (q: number) => s[Math.round(q * (s.length - 1))]
  return { p10: at(0.1), median: at(0.5), p90: at(0.9), mean: s.reduce((a, b) => a + b, 0) / s.length }
}

export type SideSummary = {
  /** Letzte Abreise bezugsfertig (Schichtminute); nie fertig zählt als Ende des Rechenfensters. */
  departuresReady: Dist
  /** Anteil der Tage, an denen zum Check-in noch ein Abreisezimmer offen war. */
  missedCheckin: number
  /** Abreisezimmer, die zum Check-in noch offen sind. */
  departuresOpenAtCheckin: Dist
  /** Bis zum Arbeitsende liegen geblieben. */
  leftUndone: Dist
  finishedAt: Dist
  /** Vergeblich an der Tür: Gast noch da, lehnt ab, „Nicht stören". */
  turnedAway: Dist
  /** Minuten aller Kräfte zusammen. */
  walkMinutes: Dist
  doorMinutes: Dist
  idleMinutes: Dist
  /** Anteil der Dienstzeit bis Feierabend, der aufs Reinigen fällt. */
  cleaningShare: Dist
  /** Sonderfall: Minuten von der Meldung bis erledigt; null, wenn es an keinem Tag einen gab. */
  complaintMinutes: Dist | null
}

export type PolicySummary = Record<Coordination, SideSummary> & {
  /** Vorsprung von RoSe bei den Abreisen je Tag, Minuten (positiv = RoSe früher). */
  departureLead: Dist
  /** Abreisen, die mit RoSe zum Check-in mehr fertig sind — die Kennzahl, wenn das Team es nie ganz schafft. */
  departuresReadyMore: Dist
  /** Eingesparte Minuten aller Kräfte je Tag: Wege und vergebliche Gänge ohne gegen mit RoSe. */
  savedMinutes: Dist
  /** Anteil der Tage, an denen RoSe mit allem früher fertig ist. */
  roseFinishesEarlier: number
}

export type Summary = {
  days: number
  /** Der mittlere Tag (wie `typicalSeed` auf der Landing Page), zum Ansehen. */
  typicalSeed: number
} & Record<Policy, PolicySummary>

export function summarize(runs: DayRun[], config: ScenarioConfig): Summary {
  const P = paramsFor(config.times, config.duration)
  const ready = (m: RunMetrics) => m.departuresReadyAt ?? P.horizon
  const side = (p: Policy, c: Coordination): SideSummary => {
    const ms = runs.map(r => r[p][c])
    const complaints = runs.flatMap(r => {
      const done = r[p][c].complaintDoneAt
      return r.complaintAt !== null && done !== null ? [done - r.complaintAt] : []
    })
    return {
      departuresReady: dist(ms.map(ready)),
      missedCheckin: ms.filter(m => ready(m) > P.checkinAt).length / Math.max(1, ms.length),
      departuresOpenAtCheckin: dist(ms.map(m => m.departuresOpenAtCheckin)),
      leftUndone: dist(ms.map(m => m.leftUndone)),
      finishedAt: dist(ms.map(m => m.finishedAt)),
      turnedAway: dist(ms.map(m => m.knocks + m.declined + m.skips)),
      walkMinutes: dist(ms.map(m => m.walkMinutes)),
      doorMinutes: dist(ms.map(m => m.doorMinutes)),
      idleMinutes: dist(ms.map(m => m.idleMinutes)),
      cleaningShare: dist(ms.map(m => {
        const total = m.cleanMinutes + m.walkMinutes + m.doorMinutes + m.idleMinutes
        return total > 0 ? m.cleanMinutes / total : 0
      })),
      complaintMinutes: complaints.length > 0 ? dist(complaints) : null,
    }
  }
  const policy = (p: Policy): PolicySummary => ({
    paper: side(p, 'paper'),
    rose: side(p, 'rose'),
    departureLead: dist(runs.map(r => ready(r[p].paper) - ready(r[p].rose))),
    departuresReadyMore: dist(runs.map(r => r[p].paper.departuresOpenAtCheckin - r[p].rose.departuresOpenAtCheckin)),
    savedMinutes: dist(runs.map(r => (r[p].paper.walkMinutes + r[p].paper.doorMinutes) - (r[p].rose.walkMinutes + r[p].rose.doorMinutes))),
    roseFinishesEarlier: runs.filter(r => r[p].rose.finishedAt < r[p].paper.finishedAt).length / Math.max(1, runs.length),
  })
  const typicalSeed = runs.length === 0 ? 1 : middleSeed(runs.map(r => ({
    seed: r.seed,
    routine: ready(r.routine.paper) - ready(r.routine.rose),
    onDemand: ready(r.onDemand.paper) - ready(r.onDemand.rose),
  })))
  return { days: runs.length, typicalSeed, routine: policy('routine'), onDemand: policy('onDemand') }
}

// ── Überlast ───────────────────────────────────────────────────────────────

/**
 * Grobe Vorprüfung ohne Simulation: Reinigungsminuten eines gewöhnlichen
 * Tages gegen die Dienstzeit aller Kräfte bis zum Arbeitsende. Reicht die
 * Zeit schon rechnerisch nicht, zeigt der Vergleich vor allem, was liegen
 * bleibt — das soll die Seite vorher sagen.
 */
export function workload(config: ScenarioConfig, policy: Policy): { needMinutes: number; haveMinutes: number } {
  const { mix, guest, duration, times } = config
  // Wer den ganzen Tag „Nicht stören“ hat, wird nicht gereinigt.
  const out = (n: number) => n * (1 - guest.dndMorning * guest.dndAllDay)
  const stays = policy === 'routine' ? out(mix.outWants + mix.outNoRequest) : out(mix.outWants)
  return {
    needMinutes: mix.departure * duration.departure + stays * duration.stay,
    haveMinutes: config.maids * Math.max(0, times.shiftEnd - times.shiftStart),
  }
}

// ── Protokoll des Web Workers ─────────────────────────────────────────────
//
// Abbruch: Die Seite beendet den Worker (`terminate`) und startet für den
// nächsten Lauf einen neuen — ein synchron rechnender Worker nähme eine
// Abbruch-Nachricht ohnehin erst nach dem Lauf entgegen.

export type SimRequest = { type: 'run'; id: number; config: ScenarioConfig; days: number; firstSeed?: number }

export type SimMessage =
  | { type: 'progress'; id: number; done: number; total: number }
  | { type: 'done'; id: number; runs: DayRun[]; summary: Summary }
  | { type: 'invalid'; id: number; errors: string[] }

export function validateRun(config: ScenarioConfig, days: number): string[] {
  const errs = validateConfig(config)
  const rooms = config.floors * config.roomsPerFloor
  const maxDays = Math.max(1, Math.min(LIMITS.days, Math.floor(LIMITS.roomDays / Math.max(1, rooms))))
  if (!Number.isInteger(days) || days < 1 || days > LIMITS.days) errs.push(`Tage: ganze Zahl von 1 bis ${LIMITS.days}.`)
  else if (days > maxDays) errs.push(`Bei ${rooms} Zimmern höchstens ${maxDays} Tage – sonst rechnet der Browser zu lange.`)
  return errs
}

/** Ein Lauf als Folge von Nachrichten: Fortschritt nach jedem Tag, am Ende das Ergebnis. */
export function* runBatch(req: SimRequest): Generator<SimMessage> {
  const errors = validateRun(req.config, req.days)
  if (errors.length > 0) {
    yield { type: 'invalid', id: req.id, errors }
    return
  }
  const first = req.firstSeed ?? 1
  const runs: DayRun[] = []
  for (let i = 0; i < req.days; i++) {
    runs.push(runDay(req.config, first + i))
    yield { type: 'progress', id: req.id, done: i + 1, total: req.days }
  }
  yield { type: 'done', id: req.id, runs, summary: summarize(runs, req.config) }
}
