import { describe, expect, it } from 'vitest'
import { ROI_DEFAULTS, ROI_PRESETS, computeRoi, stayoverShare } from './roi'

describe('stayoverShare', () => {
  it('ist 0 bei einer Nacht oder weniger', () => {
    expect(stayoverShare(1)).toBe(0)
    expect(stayoverShare(0.5)).toBe(0)
    expect(stayoverShare(Number.NaN)).toBe(0)
  })

  it('steigt mit der Aufenthaltsdauer', () => {
    expect(stayoverShare(2)).toBeCloseTo(0.5)
    expect(stayoverShare(2.5)).toBeCloseTo(0.6)
    expect(stayoverShare(10)).toBeCloseTo(0.9)
  })
})

describe('computeRoi', () => {
  it('liefert das Beispiel aus dem Konzept (40 Zimmer, Vorgaben)', () => {
    const r = computeRoi(ROI_DEFAULTS)
    expect(r.occupiedPerDay).toBeCloseTo(26)
    expect(r.stayoverPerDay).toBeCloseTo(15.6)
    expect(r.skippedPerMonth).toBeCloseTo(93.6)
    expect(r.remainingPerMonth).toBeCloseTo(686.4)
    expect(r.hoursSkipped).toBeCloseTo(28.08)
    expect(r.hoursCoordination).toBeCloseTo(22.88)
    expect(r.hoursTotal).toBeCloseTo(50.96)
    expect(r.savingsCents).toBe(86632)
    expect(r.costCents).toBe(2000)
    expect(r.netCents).toBe(84632)
  })

  it('hat ohne Stayover keinen Hebel A, aber weiter Hebel B', () => {
    const r = computeRoi({ ...ROI_DEFAULTS, nights: 1 })
    expect(r.stayoverPerDay).toBe(0)
    expect(r.hoursSkipped).toBe(0)
    expect(r.hoursCoordination).toBeCloseTo((26 * 30 * 2) / 60)
  })

  it('hat ohne Verzicht keinen Hebel A', () => {
    const r = computeRoi({ ...ROI_DEFAULTS, optOutRate: 0 })
    expect(r.skippedPerMonth).toBe(0)
    expect(r.remainingPerMonth).toBeCloseTo(26 * 30)
  })

  it('kostet und spart nichts ohne Zimmer', () => {
    const r = computeRoi({ ...ROI_DEFAULTS, rooms: 0 })
    expect(r.savingsCents).toBe(0)
    expect(r.costCents).toBe(0)
    expect(r.netCents).toBe(0)
  })

  it('klemmt unsinnige Eingaben ab statt negativ zu werden', () => {
    const r = computeRoi({ ...ROI_DEFAULTS, occupancy: 1.7, optOutRate: -1, coordinationMinutes: -5 })
    expect(r.occupiedPerDay).toBe(40)
    expect(r.hoursSkipped).toBe(0)
    expect(r.hoursCoordination).toBe(0)
  })

  it('rechnet die vorsichtige Stellung niedriger als die typische', () => {
    const vorsichtig = computeRoi({ ...ROI_DEFAULTS, ...ROI_PRESETS.vorsichtig })
    const typisch = computeRoi({ ...ROI_DEFAULTS, ...ROI_PRESETS.typisch })
    expect(vorsichtig.savingsCents).toBeLessThan(typisch.savingsCents)
    // Auch vorsichtig bleibt die Ersparnis weit über den Kosten — das ist
    // die Aussage, die die Seite macht; ändert sich das, muss der Text mit.
    expect(vorsichtig.netCents).toBeGreaterThan(0)
  })
})
