import { describe, expect, it } from 'vitest'
import { buildGuestGuide, guideLines } from './guest-guide'

const pinDeep = { accessMode: 'pin' as const, deepLink: true }

describe('buildGuestGuide — Reinigung', () => {
  it('ohne Routine-Reinigung muss der Gast anfordern', () => {
    const g = buildGuestGuide({}, pinDeep)
    expect(g.cleaning).toMatch(/auf Wunsch/)
    expect(g.cleaning).toMatch(/fordern Sie die Reinigung im Portal an/)
    expect(g.cleaning).not.toMatch(/täglich ab/)
  })

  it('mit Routine-Reinigung muss der Gast nichts anfordern und sieht die Uhrzeit', () => {
    // Routine 9:30, aber Check-out-Frist (Default 11:00) ist die Untergrenze.
    const g = buildGuestGuide({ stayoverAutoClean: true, stayoverAutoCleanTime: '9:30' }, pinDeep)
    expect(g.cleaning).toMatch(/täglich ab 11:00 Uhr/)
    expect(g.cleaning).toMatch(/am Abreisetag nach dem Check-out/)
    const frueh = buildGuestGuide({ stayoverAutoClean: true, stayoverAutoCleanTime: '9:30', checkoutUntil: '09:00' }, pinDeep)
    expect(frueh.cleaning).toMatch(/täglich ab 09:30 Uhr/)
    expect(g.cleaning).toMatch(/Sie müssen nichts anfordern/)
  })

  it('Zeitfenster wird genannt, wenn es aktiv ist — in beiden Modi', () => {
    const win = { cleaningWindowEnabled: true, cleaningWindowStart: '08:00', cleaningWindowEnd: '15:00' }
    expect(buildGuestGuide(win, pinDeep).cleaning).toMatch(/von 08:00 bis 15:00 Uhr/)
    expect(buildGuestGuide({ ...win, stayoverAutoClean: true }, pinDeep).cleaning).toMatch(/von 08:00 bis 15:00 Uhr/)
  })

  it('ausgeschaltetes Zeitfenster taucht nicht auf', () => {
    const g = buildGuestGuide({ cleaningWindowEnabled: false, cleaningWindowStart: '08:00' }, pinDeep)
    expect(g.cleaning).not.toMatch(/Uhr entgegen/)
  })
})

describe('buildGuestGuide — Zugang', () => {
  it('Link-Verfahren: ohne PIN, erlischt mit dem Check-out', () => {
    const g = buildGuestGuide({}, { accessMode: 'link', deepLink: true })
    expect(g.access).toMatch(/ohne PIN/)
    expect(g.access).toMatch(/erlischt mit dem Check-out/)
    expect(g.access).not.toMatch(/PIN eingeben/)
  })

  it('PIN-Verfahren mit Zimmer-QR: scannen + PIN', () => {
    expect(buildGuestGuide({}, pinDeep).access).toMatch(/QR-Code scannen und PIN eingeben/)
  })

  it('PIN-Verfahren ohne Zimmer-QR: Adresse, Zimmernummer + PIN', () => {
    const g = buildGuestGuide({}, { accessMode: 'pin', deepLink: false })
    expect(g.access).toMatch(/Zimmernummer und PIN/)
  })
})

describe('guideLines', () => {
  it('liefert alle fünf Punkte in Lesereihenfolge', () => {
    const g = buildGuestGuide({}, pinDeep)
    expect(guideLines(g)).toEqual([g.purpose, g.cleaning, g.dnd, g.services, g.access])
  })
})
