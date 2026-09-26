import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from './cleaning-sim'
import { DEFAULT_FORM, configFromForm, formFromConfig, fromClock, sharesTotal, toClock } from './sim-form'

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
