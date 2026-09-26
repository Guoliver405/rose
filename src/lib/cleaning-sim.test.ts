import { describe, expect, it } from 'vitest'
import {
  ALL_RUNS, CHECKIN_AT, CHECKOUT_AT, COMPLAINT, DEFAULT_CONFIG, MAIDS, MIX, SCENARIO, SCENARIO_SEED,
  assignFloors, buildScenario, clockLabel, floorOf, highlights, maidLabel, maidsAt, mixFromShares, simulate, tilesAt,
  turnedAwayAt, typicalSeed, validateConfig, type ScenarioConfig,
  type Coordination, type Policy, type SimResult,
} from './cleaning-sim'

describe('Reinigungs-Simulation', () => {
  const run = Object.fromEntries(ALL_RUNS.map(([c, p]) => [`${c}-${p}`, simulate(c, p)])) as Record<`${Coordination}-${Policy}`, SimResult>
  const all = Object.values(run)
  const decliners = SCENARIO.rooms.filter(r => r.kind === 'stay' && r.presence === 'declines').map(r => r.nr)
  const dnd = SCENARIO.rooms.filter(r => r.kind === 'stay' && r.presence === 'dnd').map(r => r.nr)
  const deps = SCENARIO.rooms.filter(r => r.kind === 'departure').map(r => r.nr)

  it('Szenario: 10 × 10 Zimmer in der Mischung aus MIX, Etagen auch zweistellig', () => {
    expect(SCENARIO.rooms).toHaveLength(100)
    expect(new Set(SCENARIO.rooms.map(r => r.nr)).size).toBe(100)
    expect(SCENARIO.rooms.filter(r => r.kind === 'departure')).toHaveLength(MIX.departure)
    expect(decliners).toHaveLength(MIX.declines)
    expect(SCENARIO.rooms.every(r => floorOf(r.nr) === r.floor)).toBe(true)
    expect(floorOf('1004')).toBe(10)
    expect(SCENARIO.maidFloors).toHaveLength(MAIDS)
  })

  it('der gezeigte Tag ist der mittlere, nicht ausgesucht', () => {
    expect(typicalSeed()).toBe(SCENARIO_SEED)
  })

  it('Abreisen: ohne Software erst zur Check-out-Frist, mit RoSe ab dem Check-out — in beiden Stellungen', () => {
    const firstDep = (r: SimResult) => Math.min(...r.segments.filter(g => g.kind === 'clean' && deps.includes(g.nr)).map(g => g.start))
    for (const p of ['routine', 'onDemand'] as const) {
      expect(firstDep(run[`paper-${p}`])).toBeGreaterThanOrEqual(CHECKOUT_AT)
      expect(firstDep(run[`rose-${p}`])).toBeLessThan(CHECKOUT_AT)
    }
  })

  it('am gezeigten Tag ist RoSe bei den Abreisen und beim Ende vorn, in beiden Stellungen', () => {
    for (const p of ['routine', 'onDemand'] as const) {
      const [a, b] = [run[`paper-${p}`].metrics, run[`rose-${p}`].metrics]
      expect(b.departuresReadyAt!).toBeLessThan(a.departuresReadyAt!)
      expect(b.finishedAt).toBeLessThan(a.finishedAt)
    }
  })

  it('über 101 Tage: RoSe ist jeden Tag früher fertig; bei den Abreisen im Mittel vorn', () => {
    for (const p of ['routine', 'onDemand'] as const) {
      const leads: number[] = []
      for (let seed = 1; seed <= 101; seed++) {
        const scn = buildScenario(seed)
        const [a, b] = [simulate('paper', p, scn).metrics, simulate('rose', p, scn).metrics]
        expect(b.finishedAt).toBeLessThan(a.finishedAt)
        leads.push((a.departuresReadyAt ?? Infinity) - (b.departuresReadyAt ?? Infinity))
      }
      leads.sort((x, y) => x - y)
      expect(leads[50]).toBeGreaterThan(0)
      if (p === 'routine') expect(leads[0]).toBeGreaterThan(0)
    }
  })

  it('ab 8:00 ist schon manches Zimmer frei: vor 9:00 wird in beiden Bildern gereinigt', () => {
    for (const c of ['paper', 'rose'] as const) {
      expect(run[`${c}-routine`].segments.some(g => g.kind === 'clean' && g.start < 60)).toBe(true)
    }
  })

  it('an der Tür weggeschickt: mit RoSe seltener — am gezeigten Tag und im Mittel über 101 Tage', () => {
    const away = (r: SimResult) => turnedAwayAt(r, Infinity)
    expect(away(run['rose-routine'])).toBeLessThan(away(run['paper-routine']))
    const saved: number[] = []
    for (let seed = 1; seed <= 101; seed++) {
      const scn = buildScenario(seed)
      saved.push(simulate('paper', 'routine', scn).metrics.knocks - simulate('rose', 'routine', scn).metrics.knocks)
    }
    expect(saved.sort((a, b) => a - b)[50]).toBeGreaterThan(0)
  })

  it('„später“ an der Tür: ohne Software kennt es nur, wer geklopft hat; mit RoSe klopft niemand vor der Zeit', () => {
    for (const p of ['routine', 'onDemand'] as const) {
      const r = run[`rose-${p}`]
      expect(r.segments.some(g => g.again)).toBe(false)
      const knocks = r.segments.filter(g => g.kind === 'knock')
      for (const k of knocks) {
        const earlier = knocks.filter(o => o.nr === k.nr && o.start < k.start)
        for (const e of earlier) expect(k.start).toBeGreaterThanOrEqual(e.end + 30)
      }
    }
  })

  it('täglich: Bleibezimmer in beiden Bildern schon vor 11:00', () => {
    const stayNrs = SCENARIO.rooms.filter(r => r.kind === 'stay').map(r => r.nr)
    for (const c of ['paper', 'rose'] as const) {
      expect(run[`${c}-routine`].segments.some(g => g.kind === 'clean' && stayNrs.includes(g.nr) && g.start < CHECKOUT_AT)).toBe(true)
    }
  })

  it('wer im Zimmer bleibt und nichts will: mit RoSe genau einmal an der Tür, ohne Steuerung auch öfter, auf Wunsch nie', () => {
    expect(run['paper-routine'].metrics.declined).toBeGreaterThanOrEqual(MIX.declines)
    expect(run['rose-routine'].metrics.declined).toBe(MIX.declines)
    for (const c of ['paper', 'rose'] as const) {
      expect(run[`${c}-onDemand`].metrics.declined).toBe(0)
      expect(run[`${c}-onDemand`].metrics.knocks).toBe(0)
    }
    expect(run['rose-routine'].segments.some(g => g.again)).toBe(false)
  })

  it('Türanhänger ohne Software: gereinigt erst, nachdem eine Kraft ihn auf der Etage gesehen hat', () => {
    const r = run['paper-onDemand']
    const hangers = SCENARIO.rooms.flatMap(x => (x.kind === 'stay' && x.presence === 'out' && x.wants ? [x] : []))
    for (const h of hangers) {
      const seen = r.noticedAt[h.nr]
      expect(seen).toBeGreaterThanOrEqual(h.outAt)
      const clean = r.segments.find(g => g.kind === 'clean' && g.jobId === h.nr)!
      expect(clean.start).toBeGreaterThanOrEqual(seen)
    }
    expect(run['rose-onDemand'].segments.some(g => g.kind === 'patrol')).toBe(false)
  })

  it('„frühestens ab“ und „Nicht stören“: RoSe klopft dort nicht vorher, ohne Software steht man vor der Tür', () => {
    const guests = SCENARIO.rooms.flatMap(r => (r.kind === 'stay' && r.presence === 'out' ? [r] : []))
    for (const p of ['routine', 'onDemand'] as const) {
      const r = run[`rose-${p}`]
      expect(r.metrics.skips).toBe(0)
      for (const g of r.segments.filter(x => x.kind === 'knock' || x.kind === 'clean')) {
        const gst = guests.find(x => x.nr === g.nr)
        if (!gst) continue
        if (gst.notBefore !== null) expect(g.start).toBeGreaterThanOrEqual(gst.notBefore)
        if (gst.dndUntil !== null) expect(g.start).toBeGreaterThanOrEqual(gst.dndUntil)
      }
    }
    expect(run['paper-routine'].metrics.skips).toBeGreaterThan(0)
  })

  it('gereinigt wird in beiden Bildern dasselbe: täglich alle, die gehen; auf Wunsch nur, wer es will', () => {
    const cleanedStays = (r: SimResult) => r.metrics.cleaned - MIX.departure - 1 // ohne Sonderfall
    const out = SCENARIO.rooms.filter(r => r.kind === 'stay' && r.presence === 'out')
    const wanting = out.filter(r => r.kind === 'stay' && r.presence === 'out' && r.wants)
    for (const c of ['paper', 'rose'] as const) {
      expect(cleanedStays(run[`${c}-routine`])).toBe(out.length)
      expect(cleanedStays(run[`${c}-onDemand`])).toBe(wanting.length)
    }
    // Verzicht auf Wunsch in der Größenordnung „typisch" des Nutzenrechners (≈ 20 %).
    expect(1 - wanting.length / (out.length + decliners.length)).toBeGreaterThan(0.1)
    expect(1 - wanting.length / (out.length + decliners.length)).toBeLessThan(0.3)
  })

  it('Sonderfall trifft ein Zimmer, das in allen vier Abläufen schon gereinigt ist; mit RoSe schneller', () => {
    const c = SCENARIO.complaint!
    expect(c).not.toBeNull()
    for (const r of all) {
      const first = r.segments.find(g => g.kind === 'clean' && g.jobId === c.nr)!
      expect(first.end).toBeLessThanOrEqual(c.at)
    }
    for (const p of ['routine', 'onDemand'] as const) {
      const paper = run[`paper-${p}`]
      expect(run[`rose-${p}`].metrics.complaintDoneAt!).toBeLessThan(paper.metrics.complaintDoneAt!)
      const start = paper.segments.find(g => g.jobId === `${c.nr}!` && g.kind === 'clean')!.start
      expect(start).toBeGreaterThanOrEqual(c.at + COMPLAINT.reachDelay)
    }
  })

  it('Hinweise: zeitlich geordnet, Töne passen zum Bild, Check-in aus dem Ablauf', () => {
    for (const r of all) {
      const h = highlights(r)
      expect(h.length).toBeGreaterThanOrEqual(3)
      expect(h.map(x => x.at)).toEqual([...h.map(x => x.at)].sort((a, b) => a - b))
      const ready = r.metrics.departuresReadyAt!
      const checkin = h.find(x => x.text.includes('Check-in'))!
      expect(checkin.tone).toBe(ready <= CHECKIN_AT ? 'good' : 'bad')
      if (r.coord === 'rose') expect(h.every(x => x.tone !== 'bad')).toBe(true)
      // Ohne Software ist der Check-in-Eintrag der einzige, der gut ausgehen kann.
      else expect(h.filter(x => x.tone === 'good').every(x => x === checkin)).toBe(true)
    }
    const live = highlights(run['rose-routine']).find(x => x.text.includes('sofort auf dem Board'))!
    expect(live.at).toBeLessThan(CHECKOUT_AT)
    expect(run['rose-routine'].segments.some(g => g.kind === 'clean' && g.start === live.at)).toBe(true)
  })

  it('ohne Steuerung bleibt jede Kraft auf ihren Etagen, bis dort alles vergeben ist', () => {
    for (const p of ['routine', 'onDemand'] as const) {
      const r = run[`paper-${p}`]
      const cleans = r.segments.filter(g => g.kind === 'clean')
      for (const g of r.segments.filter(x => x.nr && x.kind !== 'walk' && x.kind !== 'idle')) {
        const own = SCENARIO.maidFloors[g.maid]
        if (own.includes(floorOf(g.nr))) continue
        // Nur ihre eigenen Reinigungen — eine aushelfende Kollegin darf dort später noch arbeiten.
        const lastOwnStart = Math.max(...cleans.filter(o => o.maid === g.maid && own.includes(floorOf(o.nr))).map(o => o.start))
        expect(g.start).toBeGreaterThanOrEqual(lastOwnStart)
      }
    }
  })

  it('Türschild und ablehnende Gäste werden nie gereinigt, kein Auftrag doppelt, keine Überlappung', () => {
    for (const r of all) {
      const cleaned = r.segments.filter(g => g.kind === 'clean')
      expect(cleaned.map(g => g.nr).filter(nr => [...dnd, ...decliners].includes(nr))).toEqual([])
      expect(new Set(cleaned.map(g => g.jobId)).size).toBe(cleaned.length)
      for (let i = 1; i < r.segments.length; i++) {
        const [a, b] = [r.segments[i - 1], r.segments[i]]
        if (a.maid === b.maid) expect(b.start).toBeGreaterThanOrEqual(a.end)
      }
    }
  })

  it('Anzeige: vor 8:00 steht keine Kraft, am Ende ist jede Abreise fertig und jede Ablehnung vermerkt', () => {
    expect(maidsAt(run['rose-routine'], -1)).toEqual(Array(MAIDS).fill(null))
    for (const c of ['paper', 'rose'] as const) {
      const r = run[`${c}-routine`]
      const end = tilesAt(r, r.metrics.finishedAt)
      expect(end.filter(x => deps.includes(x.nr)).every(x => x.state === 'done')).toBe(true)
      expect(end.filter(x => decliners.includes(x.nr)).every(x => x.state === 'declined')).toBe(true)
    }
    const od = run['rose-onDemand']
    expect(tilesAt(od, od.metrics.finishedAt).filter(x => decliners.includes(x.nr)).every(x => x.state === 'skipped')).toBe(true)
  })
})

describe('Simulator-Konfiguration', () => {
  it('die Vorgabe ist das Haus der Landing Page', () => {
    expect(buildScenario(SCENARIO_SEED, DEFAULT_CONFIG)).toEqual(SCENARIO)
    expect(validateConfig(DEFAULT_CONFIG)).toEqual([])
  })

  it('eine um eine Stunde verschobene Schicht mit verschobenen Zeiten rechnet denselben Tag', () => {
    const t = DEFAULT_CONFIG.times
    const early: ScenarioConfig = { ...DEFAULT_CONFIG, times: Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v - 60])) as typeof t }
    const scn = buildScenario(7, early)
    const ref = buildScenario(7)
    expect(scn.rooms).toEqual(ref.rooms)
    for (const [c, p] of ALL_RUNS) expect(simulate(c, p, scn).metrics).toEqual(simulate(c, p, ref).metrics)
    const r = simulate('rose', 'routine', scn)
    expect(highlights(r, scn).map(h => h.text)).toEqual(
      highlights(simulate('rose', 'routine', ref), ref).map(h => h.text.replace(/\b(\d{1,2}):(\d\d)\b/g, (_, h, m) => `${Number(h) - 1}:${m}`)))
    expect(clockLabel(0, early.times.shiftStart)).toBe('7:00')
  })

  it('Etagen ohne Software: Rest reihum, mehr Kräfte als Etagen teilen sich Etagen', () => {
    expect(assignFloors(10, 5)).toEqual([[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]])
    expect(assignFloors(7, 3)).toEqual([[1, 2, 3], [4, 5], [6, 7]])
    expect(assignFloors(2, 5)).toEqual([[1], [2], [1], [2], [1]])
    for (const [f, m] of [[13, 4], [60, 7], [3, 3]]) {
      expect(assignFloors(f, m).flat().sort((a, b) => a - b)).toEqual(Array.from({ length: f }, (_, i) => i + 1))
    }
  })

  it('ungleiche Aufteilung: jede Kraft arbeitet zuerst ihre eigenen Etagen', () => {
    const cfg: ScenarioConfig = { ...DEFAULT_CONFIG, floors: 7, roomsPerFloor: 12, maids: 3, mix: mixFromShares(84, MIX) }
    const scn = buildScenario(3, cfg)
    expect(scn.maidFloors).toEqual([[1, 2, 3], [4, 5], [6, 7]])
    const r = simulate('paper', 'routine', scn)
    for (let i = 0; i < 3; i++) {
      const first = r.segments.find(g => g.maid === i && g.kind === 'clean')!
      expect(scn.maidFloors[i]).toContain(floorOf(first.nr))
    }
  })

  it('Anteile auf Zimmer: Summe stimmt immer, 100 Zimmer ergeben genau MIX', () => {
    expect(mixFromShares(100, MIX)).toEqual(MIX)
    for (const n of [1, 7, 33, 999, 3000]) {
      const m = mixFromShares(n, MIX)
      expect(Object.values(m).reduce((a, b) => a + b, 0)).toBe(n)
    }
    expect(mixFromShares(10, { departure: 1, empty: 0, declines: 0, outWants: 0, outNoRequest: 0 }).departure).toBe(10)
  })

  it('Gültigkeitsgrenzen mit Meldungen', () => {
    const bad = (patch: Partial<ScenarioConfig>) => validateConfig({ ...DEFAULT_CONFIG, ...patch })
    expect(bad({ floors: 61 })).not.toEqual([])
    expect(bad({ roomsPerFloor: 51 })).not.toEqual([])
    expect(bad({ maids: 0 })).not.toEqual([])
    expect(bad({ floors: 11 }).join(' ')).toMatch(/110 Zimmer/)
    expect(bad({ guest: { ...DEFAULT_CONFIG.guest, signals: 1.2 } })).not.toEqual([])
    expect(bad({ times: { ...DEFAULT_CONFIG.times, checkinFrom: DEFAULT_CONFIG.times.checkoutUntil } })).not.toEqual([])
    expect(bad({ duration: { ...DEFAULT_CONFIG.duration, stay: 0 } })).not.toEqual([])
  })

  it('Kräfte über Z hinaus bekommen Nummern', () => {
    expect([maidLabel(0), maidLabel(25), maidLabel(26)]).toEqual(['A', 'Z', '27'])
  })
})
