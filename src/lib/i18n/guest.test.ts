import { describe, expect, it } from 'vitest'
import { guest } from './de/guest'
import { buildGuestSheet } from '../guest-guide'

/** Alle Texte eines Sprach-Objekts mit ihrem Schlüsselpfad. */
function texts(obj: object, prefix = ''): [string, string][] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'string' ? [[`${prefix}${k}`, v] as [string, string]] : texts(v, `${prefix}${k}.`),
  )
}

/*
 * Die Entscheidungen aus `Sessions/Begriffe-Entscheidungen.md` als Wächter —
 * sie sollen nicht beim nächsten Feinschliff still zurückrutschen.
 */
describe('Gästeportal — Begriffe und Schreibweise (deutsch)', () => {
  const all = texts(guest)

  it('siezt den Gast (Entscheidung 1)', () => {
    const du = all.filter(([, t]) => /\b(du|dein\w*|dich|dir)\b/i.test(t))
    expect(du).toEqual([])
  })

  it('kennt kein „Hotel“, keinen „Zettel“ und keinen „Reinigungsdienst“ (Entscheidungen 2, 3, 9)', () => {
    expect(all.filter(([, t]) => /\bHotel|Zettel|Reinigungsdienst|Check-in-Beleg/.test(t))).toEqual([])
  })

  it('schreibt „Gästeportal“, nicht „Gäste-Portal“ oder „Gastportal“ (Entscheidung 4)', () => {
    expect(all.filter(([, t]) => /Gäste-Portal|Gastportal|Gast-Portal|Zimmerservice/.test(t))).toEqual([])
  })

  it('setzt deutsche Anführungszeichen und den kurzen Gedankenstrich (Entscheidung 13)', () => {
    expect(all.filter(([, t]) => t.includes('"'))).toEqual([])
    expect(all.filter(([, t]) => t.includes('—'))).toEqual([])
    // Jedes „ wird mit “ geschlossen.
    expect(all.filter(([, t]) => (t.match(/„/g) ?? []).length !== (t.match(/“/g) ?? []).length)).toEqual([])
  })

  it('trennt „Bitte nicht stören“ und „Heute keine Reinigung“ in den Hinweisen (Entscheidung 11)', () => {
    expect(guest.signal.dnd.idle).toMatch(/auch kein Service/)
    expect(guest.signal.skip.idle).toMatch(/kommen trotzdem/)
  })
})

describe('Gästeportal und gedrucktes Blatt', () => {
  it('die Legende auf dem Blatt trägt die Beschriftungen der Knöpfe im Portal', () => {
    const sheet = buildGuestSheet({}, { accessMode: 'pin', deepLink: true }, 'de')
    expect(sheet.buttons.clean.label).toBe(guest.signal.clean.label)
    expect(sheet.buttons.dnd.label).toBe(guest.signal.dnd.label)
    expect(sheet.buttons.services.label).toBe(guest.services.heading)
  })
})
