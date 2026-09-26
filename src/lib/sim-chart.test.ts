import { describe, expect, it } from 'vitest'
import { histograms } from './sim-chart'

describe('Verteilung je Zeitklasse', () => {
  it('gemeinsame Achse auf volle Stunden, gemeinsame Höhe, nicht fertig extra', () => {
    const [a, b] = histograms([[275, 280, 281, 600], [140, 155]], { horizon: 600, shiftStart: 480 })
    // 8:00 + 140 = 10:20 → Achse ab 10:00 (120); 8:00 + 281 = 12:41 → bis 13:00 (300).
    expect(a.domain).toEqual([120, 300])
    expect(b.domain).toEqual(a.domain)
    expect(a.bins).toHaveLength(18)
    expect(a.bins.find(x => x.from === 270)?.count).toBe(1)
    expect(a.bins.find(x => x.from === 280)?.count).toBe(2)
    expect(a.notDone).toBe(1)
    expect(a.maxCount).toBe(2)
    expect(b.maxCount).toBe(2)
    expect(a.bins.reduce((s, x) => s + x.count, 0) + a.notDone).toBe(4)
  })

  it('Schichtbeginn krumm: Stunden der Uhr, nicht der Schicht', () => {
    const [h] = histograms([[10, 50]], { horizon: 600, shiftStart: 7 * 60 + 30 })
    // 7:30 + 10 = 7:40 → ab 7:00 (−30); 7:30 + 50 = 8:20 → bis 9:00 (90).
    expect(h.domain).toEqual([-30, 90])
  })

  it('alles nicht fertig: Achse bleibt gültig', () => {
    const [h] = histograms([[600, 600]], { horizon: 600, shiftStart: 480 })
    expect(h.notDone).toBe(2)
    expect(h.domain[1]).toBeGreaterThan(h.domain[0])
  })
})
