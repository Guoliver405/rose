import { describe, expect, it } from 'vitest'
import { landing } from './de/landing'
import { flattenMessages } from './format'

/*
 * Wächter für die Entscheidungen aus `Sessions/Begriffe-Entscheidungen.md` —
 * Landing Page. Abweichend von der Verwaltung sind „Hotel“ (Branche) und
 * „Housekeeping“ (Abteilung, Produktname) erlaubt.
 */
describe('Landing Page — Begriffe und Schreibweise (deutsch)', () => {
  const all = flattenMessages(landing)
  const hits = (re: RegExp) => all.filter(([, t]) => re.test(t))

  it('siezt (Entscheidung 1)', () => {
    expect(hits(/\b(du|dein\w*|dich|dir)\b/i)).toEqual([])
  })

  it('kennt keine „Kollegin“ und kein „Zimmermädchen“ (Entscheidung 3)', () => {
    expect(hits(/Kollegin|Zimmermädchen/)).toEqual([])
  })

  it('schreibt „Gästeportal“ und „Gästezugang“ (Entscheidung 4)', () => {
    expect(hits(/Gäste-Portal|Gastportal|Gast-Portal|Gäste-Zugang/)).toEqual([])
  })

  it('sagt „Anfrage“ statt „Bestellung“ (Entscheidung 5)', () => {
    expect(hits(/Bestellung|Services-Board/)).toEqual([])
  })

  it('sagt „tägliche Reinigung“ statt „Routine“ oder „Stayover“ (Entscheidung 6)', () => {
    expect(hits(/Routine|Stayover/)).toEqual([])
  })

  it('sagt „Anmeldung“, „Zugangskarte“, „Check-in-Blatt“ (Entscheidungen 8, 9)', () => {
    // „Zettel“ bleibt erlaubt: Die Landing meint damit Papiernotizen ohne RoSe
    // („kein Zettel“, „Zettelwirtschaft“), nicht das Check-in-Blatt.
    expect(hits(/Login|einlogg|eingeloggt|Handout|QR-Aush/)).toEqual([])
  })

  it('sagt „Bitte nicht stören“, „Eintrag“ und „Schieber“ (Entscheidungen 11, 12)', () => {
    expect(hits(/(?<!Bitte )(?<!bitte )[Nn]icht stören/)).toEqual([])
    expect(hits(/\bDND\b|\bStich|Slider/)).toEqual([])
  })

  it('setzt deutsche Anführungszeichen, den kurzen Gedankenstrich und „E-Mail“ (Entscheidung 13)', () => {
    expect(hits(/"|—/)).toEqual([])
    expect(all.filter(([, t]) => (t.match(/„/g) ?? []).length !== (t.match(/“/g) ?? []).length)).toEqual([])
    expect(hits(/(?<![-\w])Mails?\b/)).toEqual([])
  })
})
