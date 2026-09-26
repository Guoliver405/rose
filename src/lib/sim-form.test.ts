import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from './cleaning-sim'
import { DEFAULT_FORM, changedDetails, configFromForm, formFromConfig, fromClock, occupancyOf, sharesTotal, toClock, withOccupancy } from './sim-form'

describe('Simulator-Formular', () => {
  it('die Vorgabe des Formulars ist exakt die Konfiguration der Landing Page', () => {
    const { config, errors } = configFromForm(DEFAULT_FORM)
    expect(errors).toEqual([])
    expect(config).toEqual(DEFAULT_CONFIG)
    expect(DEFAULT_FORM.times.shiftStart).toBe('08:00')
    expect(DEFAULT_FORM.guest.dndAllDay).toBe(33.3)
  })

  it('Uhrzeiten hin und zurück; Unsinn wird NaN und fällt in der Prüfung auf', () => {
    expect(fromClock('7:05')).toBe(425)
    expect(toClock(425)).toBe('07:05')
    expect(fromClock('24:00')).toBeNaN()
    expect(fromClock('')).toBeNaN()
  })

  it('Belegung muss 100 % ergeben — keine stille Normierung', () => {
    const f = { ...DEFAULT_FORM, shares: { ...DEFAULT_FORM.shares, empty: 20 } }
    expect(sharesTotal(f)).toBe(103)
    expect(configFromForm(f).errors.join(' ')).toMatch(/103 %/)
  })

  it('anderes Haus: Anteile auf die Zimmerzahl, geänderte Anteile genau übernommen', () => {
    const f = { ...formFromConfig(DEFAULT_CONFIG, 30), floors: 3, roomsPerFloor: 7, guest: { ...DEFAULT_FORM.guest, dndAllDay: 50 } }
    const { config } = configFromForm(f)
    expect(Object.values(config.mix).reduce((a, b) => a + b, 0)).toBe(21)
    expect(config.guest.dndAllDay).toBe(0.5)
  })
})

describe('Wesentliches und Details', () => {
  it('Vorgabe: 83 % belegt, 25 % Abreisen, keine Detail-Abweichung', () => {
    expect(occupancyOf(DEFAULT_FORM)).toBe(83)
    expect(DEFAULT_FORM.shares.departure).toBe(25)
    expect(changedDetails(DEFAULT_FORM)).toBe(0)
  })

  it('Belegung ändern: Summe bleibt 100, Bleibegäste behalten ihr Verhältnis, zählt nicht als Detail', () => {
    const f = withOccupancy(DEFAULT_FORM, 60, 20)
    expect(sharesTotal(f)).toBe(100)
    expect(f.shares.empty).toBe(40)
    expect(f.shares.departure).toBe(20)
    expect(f.shares.outWants / f.shares.declines).toBeCloseTo(47 / 5, 0)
    expect(changedDetails(f)).toBe(0)
    expect(configFromForm(f).errors).toEqual([])
  })

  it('Abreisen höchstens so viele wie belegt; Details werden gezählt', () => {
    expect(withOccupancy(DEFAULT_FORM, 30, 50).shares.departure).toBe(30)
    const f = { ...DEFAULT_FORM, days: 30, guest: { ...DEFAULT_FORM.guest, signals: 50 }, duration: { ...DEFAULT_FORM.duration, walkFloor: 3, stay: 20 } }
    expect(changedDetails(f)).toBe(3)
  })
})
