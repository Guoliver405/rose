import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, SCENARIO_SEED, TYPICAL_DAYS, buildScenario, mixFromShares, simulate, MIX } from './cleaning-sim'
import { dist, runBatch, runDay, summarize, workload, type SimMessage } from './sim-batch'

describe('Simulator über viele Tage', () => {
  it('Verteilung: nächster Rang, Median bei ungerader Zahl genau der mittlere Wert', () => {
    const d = dist(Array.from({ length: 101 }, (_, i) => 100 - i))
    expect(d).toEqual({ p10: 10, median: 50, p90: 90, mean: 50 })
    expect(dist([]).median).toBeNaN()
  })

  it('ein Tag rechnet dasselbe wie die Landing Page', () => {
    const day = runDay(DEFAULT_CONFIG, SCENARIO_SEED)
    const scn = buildScenario(SCENARIO_SEED)
    expect(day.onDemand.rose).toEqual(simulate('rose', 'onDemand', scn).metrics)
    expect(day.complaintAt).toBe(scn.complaint!.at)
  })

  it('Protokoll: Fortschritt je Tag, dann Ergebnis; der mittlere Tag ist der der Landing Page', () => {
    const msgs: SimMessage[] = [...runBatch({ type: 'run', id: 7, config: DEFAULT_CONFIG, days: TYPICAL_DAYS })]
    const progress = msgs.filter(m => m.type === 'progress')
    expect(progress).toHaveLength(TYPICAL_DAYS)
    expect(progress.at(-1)).toEqual({ type: 'progress', id: 7, done: TYPICAL_DAYS, total: TYPICAL_DAYS })
    const done = msgs.at(-1)!
    if (done.type !== 'done') throw new Error('kein Ergebnis')
    expect(done.runs).toHaveLength(TYPICAL_DAYS)
    const s = done.summary
    expect(s.typicalSeed).toBe(SCENARIO_SEED)
    // Dieselben Zahlen, die AGENTS.md für die Landing Page nennt: RoSe jeden Tag früher fertig.
    expect(s.routine.roseFinishesEarlier).toBe(1)
    expect(s.onDemand.roseFinishesEarlier).toBe(1)
    expect(s.routine.departureLead.median).toBeGreaterThan(0)
    expect(s.routine.rose.missedCheckin).toBe(0)
    expect(s.routine.paper.missedCheckin).toBeGreaterThan(0.5)
    expect(s.routine.savedMinutes.median).toBeGreaterThan(0)
    for (const p of ['routine', 'onDemand'] as const) {
      for (const c of ['paper', 'rose'] as const) {
        const share = s[p][c].cleaningShare
        expect(share.p10).toBeGreaterThan(0)
        expect(share.p90).toBeLessThanOrEqual(1)
        expect(s[p][c].complaintMinutes).not.toBeNull()
      }
    }
  }, 60000)

  it('ungültige Konfiguration: nur die Meldungen, kein Lauf', () => {
    const msgs = [...runBatch({ type: 'run', id: 1, config: { ...DEFAULT_CONFIG, floors: 11 }, days: 400 })]
    expect(msgs).toHaveLength(1)
    const m = msgs[0]
    expect(m.type).toBe('invalid')
    if (m.type === 'invalid') expect(m.errors.length).toBe(2)
  })

  it('beliebiges Haus: Folge von Startwerten ab firstSeed, Auswertung über alle Tage', () => {
    const config = { ...DEFAULT_CONFIG, floors: 4, roomsPerFloor: 9, maids: 3, mix: mixFromShares(36, MIX) }
    const msgs = [...runBatch({ type: 'run', id: 2, config, days: 5, firstSeed: 11 })]
    const done = msgs.at(-1)!
    if (done.type !== 'done') throw new Error('kein Ergebnis')
    expect(done.runs.map(r => r.seed)).toEqual([11, 12, 13, 14, 15])
    expect(summarize(done.runs, config)).toEqual(done.summary)
    expect(done.runs.map(r => r.seed)).toContain(done.summary.typicalSeed)
  })

  it('Landing-Haus: nichts bleibt liegen, offene Abreisen zum Check-in passen zu „verpasst“', () => {
    const day = runDay(DEFAULT_CONFIG, SCENARIO_SEED)
    for (const p of ['routine', 'onDemand'] as const) {
      for (const c of ['paper', 'rose'] as const) {
        const m = day[p][c]
        expect(m.leftUndone).toBe(0)
        expect(m.departuresOpenAtCheckin > 0).toBe(m.departuresReadyAt === null || m.departuresReadyAt > 420)
      }
    }
    const w = workload(DEFAULT_CONFIG, 'routine')
    expect(w.needMinutes).toBeLessThan(w.haveMinutes)
  })

  it('überlastetes Haus: Vorprüfung warnt, die Auswertung zählt, was liegen bleibt, und RoSe schafft zum Check-in mehr', () => {
    const config = { ...DEFAULT_CONFIG, floors: 13, roomsPerFloor: 22, maids: 4, mix: mixFromShares(286, MIX) }
    const w = workload(config, 'routine')
    expect(w.needMinutes).toBeGreaterThan(w.haveMinutes)
    const runs = Array.from({ length: 5 }, (_, i) => runDay(config, i + 1))
    const s = summarize(runs, config)
    expect(s.routine.paper.missedCheckin).toBe(1)
    expect(s.routine.rose.leftUndone.median).toBeGreaterThan(0)
    expect(s.routine.departuresReadyMore.median).toBeGreaterThan(0)
  })

  it('das Arbeitsende begrenzt die Rechnung', () => {
    const early = { ...DEFAULT_CONFIG, times: { ...DEFAULT_CONFIG.times, shiftEnd: 12 * 60 } }
    const m = runDay(early, 3).routine.rose
    expect(m.finishedAt).toBeLessThanOrEqual(4 * 60 + DEFAULT_CONFIG.duration.departure)
    expect(m.leftUndone).toBeGreaterThan(0)
  })

  it('Rechenbudget: große Häuser weniger Tage', () => {
    const big = { ...DEFAULT_CONFIG, floors: 60, roomsPerFloor: 50, maids: 200, mix: mixFromShares(3000, MIX) }
    const msgs = [...runBatch({ type: 'run', id: 3, config: big, days: 26 })]
    expect(msgs[0].type === 'invalid' && msgs[0].errors[0]).toMatch(/höchstens 25 Tage/)
    expect([...runBatch({ type: 'run', id: 4, config: DEFAULT_CONFIG, days: 365 })][0].type).toBe('progress')
  })
})
