import { describe, expect, it } from 'vitest'
import { COMPLAINT, MIX, ROUTINE_AT, SCENARIO, buildScenario, highlights, roseHighlights, maidsAt, simulate, tilesAt } from './cleaning-sim'

describe('Reinigungs-Simulation', () => {
  const [linear, score, onDemand] = (['linear', 'score', 'onDemand'] as const).map(s => simulate(s))
  const decliners = SCENARIO.rooms.filter(r => r.kind === 'stay' && r.presence === 'declines').map(r => r.nr)
  const dnd = SCENARIO.rooms.filter(r => r.kind === 'stay' && r.presence === 'dnd').map(r => r.nr)

  it('mit RoSe sind die Abreisen vor 14:00 bezugsfertig, ohne Steuerung nicht', () => {
    const at14 = 14 * 60 - 9 * 60
    expect(score.metrics.departuresReadyAt!).toBeLessThan(at14)
    expect(onDemand.metrics.departuresReadyAt!).toBeLessThan(at14)
    expect(linear.metrics.departuresReadyAt!).toBeGreaterThan(at14)
  })

  it('Hinweise: zeitlich geordnet, jeder belegt durch den Ablauf, Bild 3 wiederholt Bild 2 nicht', () => {
    const texts2 = highlights(score).map(x => x.text)
    expect(highlights(onDemand).some(x => texts2.includes(x.text))).toBe(false)
    for (const r of [linear, score, onDemand]) {
      const h = highlights(r)
      expect(h.length).toBeGreaterThanOrEqual(2)
      expect(h.map(x => x.at)).toEqual([...h.map(x => x.at)].sort((a, b) => a - b))
    }
    // Ohne Steuerung nur Warnungen/Neutrales, mit RoSe nur Vorteile.
    expect(highlights(linear).some(x => x.tone === 'good')).toBe(false)
    expect(highlights(score).every(x => x.tone === 'good')).toBe(true)
    // Der „sofort auf dem Board"-Hinweis fällt auf einen echten Reinigungsbeginn vor der Frist.
    const live = highlights(score).find(x => x.text.includes('sofort auf dem Board'))!
    expect(live.at).toBeLessThan(ROUTINE_AT)
    expect(score.segments.some(g => g.kind === 'clean' && g.start === live.at)).toBe(true)
  })

  it('Szenario: 6 × 6 Zimmer in der Mischung aus MIX', () => {
    expect(SCENARIO.rooms).toHaveLength(36)
    expect(SCENARIO.rooms.filter(r => r.kind === 'departure')).toHaveLength(MIX.departure)
    expect(decliners).toHaveLength(MIX.declines)
    expect(new Set(SCENARIO.rooms.map(r => r.nr)).size).toBe(36)
  })

  it('ohne Software beginnt die Reinigung erst zur Check-out-Frist, mit RoSe beim Check-out', () => {
    const first = (r: typeof linear) => Math.min(...r.segments.filter(g => g.kind === 'clean').map(g => g.start))
    expect(first(linear)).toBeGreaterThanOrEqual(ROUTINE_AT)
    const earliestCheckout = Math.min(...SCENARIO.rooms.flatMap(r => (r.kind === 'departure' ? [r.checkoutAt] : [])))
    expect(first(score)).toBeLessThan(ROUTINE_AT)
    expect(first(score)).toBeGreaterThanOrEqual(earliestCheckout)
  })

  it('wer im Zimmer bleibt und nichts will: mit RoSe genau einmal an der Tür, ohne Steuerung auch öfter, auf Wunsch nie', () => {
    expect(linear.metrics.declined).toBeGreaterThan(MIX.declines) // die aushelfende Kraft klopft erneut
    expect(score.metrics.declined).toBe(MIX.declines) // RoSe merkt es sich für alle
    expect(onDemand.metrics.declined).toBe(0)
  })

  it('der gezeigte Tag: RoSe + auf Wunsch liegt bei beiden Zeiten vorn', () => {
    expect(onDemand.metrics.departuresReadyAt!).toBeLessThan(score.metrics.departuresReadyAt!)
    expect(onDemand.metrics.finishedAt).toBeLessThan(score.metrics.finishedAt)
    expect(score.metrics.departuresReadyAt!).toBeLessThan(linear.metrics.departuresReadyAt!)
  })

  it('Sonderfall trifft ein Zimmer, das in allen drei Bildern schon gereinigt ist', () => {
    const c = SCENARIO.complaint!
    for (const r of [linear, score, onDemand]) {
      const first = r.segments.find(g => g.kind === 'clean' && g.jobId === c.nr)!
      expect(first.end).toBeLessThanOrEqual(c.at)
    }
  })

  it('das gemeinsame RoSe-Protokoll stimmt für beide Bilder', () => {
    const shared = roseHighlights(score, onDemand)
    const c = SCENARIO.complaint!
    const line = shared.find(h => h.text.startsWith('Sonderfall'))!
    const within = (res: typeof score) => {
      const min = Math.round((res.metrics.complaintDoneAt! - c.at) / 5) * 5
      return line.text.includes(String(min))
    }
    expect(within(score) && within(onDemand)).toBe(true)
    expect(line.at).toBe(Math.max(score.metrics.complaintDoneAt!, onDemand.metrics.complaintDoneAt!))
  })

  it('Sonderfall: mit RoSe sofort bei der nächsten freien Kraft, ohne erst nach dem Erreichen', () => {
    const c = SCENARIO.complaint!
    expect(c).not.toBeNull()
    expect(score.metrics.complaintDoneAt! - c.at).toBeLessThan(linear.metrics.complaintDoneAt! - c.at)
    const firstLinear = linear.segments.find(g => g.jobId === `${c.nr}!` && g.kind === 'clean')!
    expect(firstLinear.start).toBeGreaterThanOrEqual(c.at + COMPLAINT.reachDelay)
  })

  it('Aushelfen ohne Software: die zweite Kraft klopft, wo die erste schon abgewiesen wurde', () => {
    const again = linear.segments.filter(g => g.kind === 'declined' && g.again)
    expect(again.length).toBeGreaterThan(0)
    for (const g of again) {
      const first = linear.segments.find(o => o.kind === 'declined' && !o.again && o.nr === g.nr)!
      expect(first.maid).not.toBe(g.maid)
      expect(first.start).toBeLessThan(g.start)
    }
    expect(score.segments.some(g => g.again)).toBe(false)
  })

  it('Verzicht wie im Nutzenrechner: ohne Steuerung 0, mit RoSe ≈ 10 %, auf Wunsch ≈ 20 %', () => {
    const stays = MIX.declines + MIX.outWants + MIX.outNoRequest // ohne Türschild
    const cleanedStays = (r: typeof linear) => r.metrics.cleaned - MIX.departure - 1 // ohne Sonderfall
    expect(cleanedStays(linear)).toBe(stays - MIX.declines) // abgelehnt an der Tür
    expect(1 - cleanedStays(score) / stays).toBeCloseTo(0.1, 1)
    expect(1 - cleanedStays(onDemand) / stays).toBeCloseTo(0.2, 1)
  })

  it('auf Wunsch entfällt zusätzlich, wer unterwegs ist und nichts anfordert', () => {
    expect(score.metrics.cleaned).toBe(linear.metrics.cleaned)
    expect(onDemand.metrics.cleaned).toBe(score.metrics.cleaned - MIX.outNoRequest)
  })

  it('über viele Tage: im Mittel ist jede Stufe früher fertig als die vorige', () => {
    const seeds = Array.from({ length: 20 }, (_, i) => i + 1)
    const avg = (s: 'linear' | 'score' | 'onDemand') =>
      seeds.reduce((sum, seed) => sum + simulate(s, buildScenario(seed)).metrics.finishedAt, 0) / seeds.length
    expect(avg('score')).toBeLessThan(avg('linear'))
    expect(avg('onDemand')).toBeLessThan(avg('score'))
  })

  it('der gezeigte Tag ordnet sich wie der Mittelwert', () => {
    expect(score.metrics.finishedAt).toBeLessThan(linear.metrics.finishedAt)
    expect(score.metrics.departuresReadyAt!).toBeLessThan(linear.metrics.departuresReadyAt!)
    expect(onDemand.metrics.finishedAt).toBeLessThan(score.metrics.finishedAt)
  })

  it('an jedem von 20 Tagen ist jede Stufe früher fertig als die vorige', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const scn = buildScenario(seed)
      const [l, sc, od] = (['linear', 'score', 'onDemand'] as const).map(s => simulate(s, scn).metrics.finishedAt)
      expect(sc).toBeLessThan(l)
      expect(od).toBeLessThan(sc)
    }
  })

  it('mit Routine erscheint kein Bleibezimmer vor der Routine-Zeit', () => {
    const stays = SCENARIO.rooms.filter(r => r.kind === 'stay').map(r => r.nr)
    const early = score.segments.filter(g => (g.kind === 'clean' || g.kind === 'declined') && stays.includes(g.nr) && g.start < ROUTINE_AT)
    expect(early).toEqual([])
  })

  it('ohne Steuerung bleibt jede Kraft auf ihren Etagen, bis dort alles vergeben ist', () => {
    const cleans = linear.segments.filter(g => g.kind === 'clean')
    for (const g of linear.segments.filter(x => x.nr && x.kind !== 'walk')) {
      const own = SCENARIO.maidFloors[g.maid]
      if (own.includes(Number(g.nr[0]))) continue
      const lastOwnStart = Math.max(...cleans.filter(o => own.includes(Number(o.nr[0]))).map(o => o.start))
      expect(g.start).toBeGreaterThanOrEqual(lastOwnStart)
    }
  })

  it('Türschild und ablehnende Gäste werden in keiner Strategie gereinigt, kein Auftrag doppelt', () => {
    for (const r of [linear, score, onDemand]) {
      const cleaned = r.segments.filter(g => g.kind === 'clean')
      expect(cleaned.map(g => g.nr).filter(nr => [...dnd, ...decliners].includes(nr))).toEqual([])
      expect(new Set(cleaned.map(g => g.jobId)).size).toBe(cleaned.length)
    }
  })

  it('Abschnitte einer Kraft überlappen nicht', () => {
    for (const r of [linear, score, onDemand]) {
      for (let i = 1; i < r.segments.length; i++) {
        const [a, b] = [r.segments[i - 1], r.segments[i]]
        if (a.maid === b.maid) expect(b.start).toBeGreaterThanOrEqual(a.end)
      }
    }
  })

  it('Anzeige: vor 9:00 steht keine Kraft, am Ende ist jede Abreise fertig und jede Ablehnung vermerkt', () => {
    expect(maidsAt(score, -1)).toEqual([null, null])
    const end = tilesAt(score, score.metrics.finishedAt)
    const deps = SCENARIO.rooms.filter(r => r.kind === 'departure').map(r => r.nr)
    expect(end.filter(x => deps.includes(x.nr)).every(x => x.state === 'done')).toBe(true)
    expect(end.filter(x => decliners.includes(x.nr)).every(x => x.state === 'declined')).toBe(true)
    const endLinear = tilesAt(linear, linear.metrics.finishedAt)
    expect(endLinear.filter(x => decliners.includes(x.nr)).every(x => x.state === 'declined')).toBe(true)
  })
})
