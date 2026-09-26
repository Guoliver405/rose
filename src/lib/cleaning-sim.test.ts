import { describe, expect, it } from 'vitest'
import {
  ALL_RUNS, CHECKIN_AT, CHECKOUT_AT, COMPLAINT, MAIDS, MIX, SCENARIO, SCENARIO_SEED,
  buildScenario, floorOf, highlights, maidsAt, simulate, tilesAt, turnedAwayAt, typicalSeed,
  type Coordination, type Policy, type SimResult,
} from './cleaning-sim'

describe('Reinigungs-Simulation', () => {
  const run = Object.fromEntries(ALL_RUNS.map(([c, p]) => [`${c}-${p}`, simulate(c, p)])) as Record<`${Coordination}-${Policy}`, SimResult>
  const all = Object.values(run)
  const decliners = SCENARIO.rooms.filter(r => r.kind === 'stay' && r.presence === 'declines').map(r => r.nr)
  const dnd = SCENARIO.rooms.filter(r => r.kind === 'stay' && r.presence === 'dnd').map(r => r.nr)
  const deps = SCENARIO.rooms.filter(r => r.kind === 'departure').map(r => r.nr)
  const stays = MIX.declines + MIX.outWants + MIX.outNoRequest // ohne Türschild

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

  it('Verzicht wie im Nutzenrechner: täglich ohne Steuerung 0, mit RoSe ≈ 10 %, auf Wunsch ≈ 20 %', () => {
    const cleanedStays = (r: SimResult) => r.metrics.cleaned - MIX.departure - 1 // ohne Sonderfall
    expect(cleanedStays(run['paper-routine'])).toBe(stays - MIX.declines) // abgelehnt an der Tür
    expect(1 - cleanedStays(run['rose-routine']) / stays).toBeCloseTo(0.1, 1)
    for (const c of ['paper', 'rose'] as const) {
      expect(1 - cleanedStays(run[`${c}-onDemand`]) / stays).toBeCloseTo(0.2, 1)
    }
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
