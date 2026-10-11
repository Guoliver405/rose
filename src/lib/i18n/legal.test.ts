import { describe, expect, it } from 'vitest'
import { legal } from './de/legal'
import { flattenMessages } from './format'

/*
 * Wächter für die Rechtstexte (`de/legal`). Geprüft wird nur die Typografie
 * und die Anrede aus `Sessions/Begriffe-Entscheidungen.md` (Entscheidungen 1
 * und 13). Die übrigen Begriffs-Regeln gelten hier bewusst nicht: Rechtstexte
 * sprechen von „Hotel“ (Branche, Vertragspartner), von „Zahlungsmittel“
 * (Entscheidung 10) und behalten ihren Wortlaut bis zur anwaltlichen Prüfung.
 */
describe('Rechtstexte – Schreibweise (deutsch)', () => {
  const all = flattenMessages(legal).map(([k, t]) => [`legal.${k}`, t] as const)
  const hits = (re: RegExp) => all.filter(([, t]) => re.test(t))

  it('enthält Texte aus allen vier Seiten', () => {
    for (const page of ['impressum', 'datenschutz', 'agb', 'simulatorUse']) {
      expect(all.some(([k]) => k.startsWith(`legal.${page}.sections.`))).toBe(true)
    }
  })

  it('siezt (Entscheidung 1)', () => {
    expect(hits(/\b(du|dein\w*|dich|dir)\b/i)).toEqual([])
  })

  it('setzt deutsche Anführungszeichen paarig und kein gerades " (Entscheidung 13)', () => {
    expect(hits(/"/)).toEqual([])
    expect(all.filter(([, t]) => (t.match(/„/g) ?? []).length !== (t.match(/“/g) ?? []).length)).toEqual([])
  })

  it('setzt den kurzen Gedankenstrich „ – “ statt „ — “ (Entscheidung 13)', () => {
    expect(hits(/—/)).toEqual([])
  })

  it('schreibt „E-Mail“, nicht „Mail“ (Entscheidung 13)', () => {
    expect(hits(/(?<![-\w])Mails?\b|(?<!E)-Mails?\b/)).toEqual([])
  })
})
