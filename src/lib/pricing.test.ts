import { describe, expect, it } from 'vitest'
import {
  FREE_MONTHS, MIN_COVERS_ROOMS, MIN_MONTHLY_CENTS, PRICE_PER_ROOM_CENTS,
  billingLine, isFreePeriod, monthlyPriceCents,
} from './pricing'

describe('monthlyPriceCents', () => {
  it('kostet nichts ohne abrechenbare Zimmer', () => {
    expect(monthlyPriceCents(0)).toBe(0)
    expect(monthlyPriceCents(-3)).toBe(0)
    expect(monthlyPriceCents(Number.NaN)).toBe(0)
  })

  it('greift ab dem ersten Zimmer mit dem Mindestbetrag', () => {
    expect(monthlyPriceCents(1)).toBe(MIN_MONTHLY_CENTS)
    expect(monthlyPriceCents(MIN_COVERS_ROOMS)).toBe(MIN_MONTHLY_CENTS)
  })

  it('rechnet oberhalb des Mindestbetrags zimmergenau', () => {
    expect(monthlyPriceCents(MIN_COVERS_ROOMS + 1)).toBe((MIN_COVERS_ROOMS + 1) * PRICE_PER_ROOM_CENTS)
    expect(monthlyPriceCents(40)).toBe(2000)
    expect(monthlyPriceCents(120)).toBe(6000)
  })

  it('ignoriert Nachkommastellen bei der Zimmerzahl', () => {
    expect(monthlyPriceCents(40.9)).toBe(2000)
  })

  it('hält die veröffentlichten Eckwerte', () => {
    // Landing Page und AGB nennen diese Zahlen — ändert sich eine, müssen
    // beide Texte mitziehen.
    expect(PRICE_PER_ROOM_CENTS).toBe(50)
    expect(MIN_MONTHLY_CENTS).toBe(500)
    expect(MIN_COVERS_ROOMS).toBe(10)
    expect(FREE_MONTHS).toBe(1)
  })
})

describe('isFreePeriod', () => {
  const registriert = new Date(2026, 8, 28, 15, 30) // 28.09.2026

  it('macht den Kalendermonat der Registrierung frei', () => {
    expect(isFreePeriod(registriert, new Date(2026, 8, 1))).toBe(true)
  })

  it('berechnet ab dem Folgemonat', () => {
    expect(isFreePeriod(registriert, new Date(2026, 9, 1))).toBe(false)
  })

  it('macht Monate vor der Registrierung nicht frei', () => {
    expect(isFreePeriod(registriert, new Date(2026, 7, 1))).toBe(false)
  })

  it('läuft über den Jahreswechsel', () => {
    const dezember = new Date(2026, 11, 31)
    expect(isFreePeriod(dezember, new Date(2026, 11, 1))).toBe(true)
    expect(isFreePeriod(dezember, new Date(2027, 0, 1))).toBe(false)
  })
})

describe('billingLine', () => {
  const registriert = new Date(2026, 8, 5) // 05.09.2026

  it('schuldet im Registrierungsmonat nichts, weist den regulären Betrag aber aus', () => {
    const line = billingLine(12, registriert, new Date(2026, 8, 1))
    expect(line).toEqual({ rooms: 12, cents: 0, regularCents: 600, free: true })
  })

  it('rechnet ab dem Folgemonat regulär, mit Mindestbetrag', () => {
    expect(billingLine(3, registriert, new Date(2026, 9, 1)))
      .toEqual({ rooms: 3, cents: MIN_MONTHLY_CENTS, regularCents: MIN_MONTHLY_CENTS, free: false })
    expect(billingLine(12, registriert, new Date(2026, 9, 1)).cents).toBe(600)
  })

  it('schuldet ohne Zimmer nichts — auch außerhalb des freien Monats', () => {
    expect(billingLine(0, registriert, new Date(2026, 9, 1)))
      .toEqual({ rooms: 0, cents: 0, regularCents: 0, free: false })
  })
})
