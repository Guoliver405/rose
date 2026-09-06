import { describe, expect, it } from 'vitest'
import {
  MIN_COVERS_ROOMS, MIN_MONTHLY_CENTS, PRICE_PER_ROOM_CENTS,
  billingLine, isFreePeriod, lastFreePeriodStart, monthlyPriceCents,
} from './pricing'
import { zonedInstant } from './tz'

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
  })
})

describe('isFreePeriod', () => {
  // Registrierung am 28.09.2026 mittags: Registrierungsmonat UND Folgemonat frei.
  const registriert = new Date(2026, 8, 28, 15, 30)

  it('macht den Kalendermonat der Registrierung frei', () => {
    expect(isFreePeriod(registriert, new Date(2026, 8, 1))).toBe(true)
  })

  it('macht den Folgemonat frei, wenn nicht am Monatsersten registriert wurde', () => {
    expect(isFreePeriod(registriert, new Date(2026, 9, 1))).toBe(true)
    expect(isFreePeriod(registriert, new Date(2026, 10, 1))).toBe(false)
  })

  it('gibt bei Registrierung am Monatsersten nur diesen einen Monat', () => {
    const amErsten = new Date(2026, 8, 1, 9, 0)
    expect(isFreePeriod(amErsten, new Date(2026, 8, 1))).toBe(true)
    expect(isFreePeriod(amErsten, new Date(2026, 9, 1))).toBe(false)
  })

  it('zählt den Zweiten schon als „nicht am Ersten"', () => {
    const amZweiten = new Date(2026, 8, 2, 0, 5)
    expect(isFreePeriod(amZweiten, new Date(2026, 9, 1))).toBe(true)
  })

  it('macht Monate vor der Registrierung nicht frei', () => {
    expect(isFreePeriod(registriert, new Date(2026, 7, 1))).toBe(false)
  })

  it('läuft über den Jahreswechsel', () => {
    const dezember = new Date(2026, 11, 31)
    expect(isFreePeriod(dezember, new Date(2026, 11, 1))).toBe(true)
    expect(isFreePeriod(dezember, new Date(2027, 0, 1))).toBe(true)
    expect(isFreePeriod(dezember, new Date(2027, 1, 1))).toBe(false)
  })

  it('bestimmt den Registrierungstag in der Zeitzone des Hauses, nicht in UTC', () => {
    // 1. Oktober 00:30 Berlin = 30. September 22:30 UTC. In Berlin ist das
    // „am Ersten" ⇒ nur der Oktober frei; in UTC wäre es der 30.09. und
    // September + Oktober frei.
    const ersterOktoberNachts = zonedInstant('Europe/Berlin', 2026, 10, 1, 0, 30)
    expect(isFreePeriod(ersterOktoberNachts, new Date(2026, 9, 1), 'Europe/Berlin')).toBe(true)
    expect(isFreePeriod(ersterOktoberNachts, new Date(2026, 10, 1), 'Europe/Berlin')).toBe(false)
    expect(isFreePeriod(ersterOktoberNachts, new Date(2026, 8, 1), 'Europe/Berlin')).toBe(false)
    // In UTC gelesen: Registrierung am 30.09. ⇒ September und Oktober frei.
    expect(isFreePeriod(ersterOktoberNachts, new Date(2026, 8, 1), 'UTC')).toBe(true)
    expect(isFreePeriod(ersterOktoberNachts, new Date(2026, 9, 1), 'UTC')).toBe(true)
  })
})

describe('lastFreePeriodStart', () => {
  it('nennt den Folgemonat, wenn nicht am Ersten registriert wurde', () => {
    const ende = lastFreePeriodStart(new Date(2026, 8, 27, 12))
    expect([ende.getFullYear(), ende.getMonth(), ende.getDate()]).toEqual([2026, 9, 1])
  })

  it('nennt den Registrierungsmonat selbst bei Registrierung am Ersten', () => {
    const ende = lastFreePeriodStart(new Date(2026, 8, 1, 12))
    expect([ende.getFullYear(), ende.getMonth(), ende.getDate()]).toEqual([2026, 8, 1])
  })

  it('läuft über den Jahreswechsel', () => {
    const ende = lastFreePeriodStart(new Date(2026, 11, 15))
    expect([ende.getFullYear(), ende.getMonth()]).toEqual([2027, 0])
  })
})

describe('billingLine', () => {
  const registriert = new Date(2026, 8, 5) // 05.09.2026

  it('schuldet im Registrierungsmonat nichts, weist den regulären Betrag aber aus', () => {
    const line = billingLine(12, registriert, new Date(2026, 8, 1))
    expect(line).toEqual({ rooms: 12, cents: 0, regularCents: 600, free: true })
  })

  it('schuldet auch im ersten vollen Monat nichts', () => {
    expect(billingLine(12, registriert, new Date(2026, 9, 1)).free).toBe(true)
  })

  it('rechnet ab dem ersten kostenpflichtigen Monat regulär, mit Mindestbetrag', () => {
    expect(billingLine(3, registriert, new Date(2026, 10, 1)))
      .toEqual({ rooms: 3, cents: MIN_MONTHLY_CENTS, regularCents: MIN_MONTHLY_CENTS, free: false })
    expect(billingLine(12, registriert, new Date(2026, 10, 1)).cents).toBe(600)
  })

  it('schuldet ohne Zimmer nichts — auch außerhalb des freien Monats', () => {
    expect(billingLine(0, registriert, new Date(2026, 10, 1)))
      .toEqual({ rooms: 0, cents: 0, regularCents: 0, free: false })
  })
})
