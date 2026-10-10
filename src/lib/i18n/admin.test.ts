import { describe, expect, it } from 'vitest'
import { admin } from './de/admin'
import { symbols } from './de/symbols'
import { auth } from './de/auth'
import { account } from './de/account'
import { simulator } from './de/simulator'
import { flattenMessages } from './format'

/*
 * Wächter für die Entscheidungen aus `Sessions/Begriffe-Entscheidungen.md` —
 * Rezeption (alle Bereiche) und die Zeichensprache der Zimmer-Kacheln.
 * Die Verwaltung wird gesiezt.
 */
describe('Rezeption, Anmeldung, Konto und Simulator — Begriffe und Schreibweise (deutsch)', () => {
  const all = [
    ...flattenMessages(admin).map(([k, t]) => [`admin.${k}`, t] as const),
    ...flattenMessages(symbols).map(([k, t]) => [`symbols.${k}`, t] as const),
    ...flattenMessages(auth).map(([k, t]) => [`auth.${k}`, t] as const),
    ...flattenMessages(account).map(([k, t]) => [`account.${k}`, t] as const),
    ...flattenMessages(simulator).map(([k, t]) => [`simulator.${k}`, t] as const),
  ]
  const hits = (re: RegExp) => all.filter(([, t]) => re.test(t))

  it('siezt (Entscheidung 1)', () => {
    expect(hits(/\b(du|dein\w*|dich|dir)\b/i)).toEqual([])
  })

  it('sagt „Haus“ und „Haus & Regeln“, nicht „Hotel & Regeln“ (Entscheidung 2)', () => {
    expect(hits(/Hotel (&|und) Regeln|in diesem Hotel|Hotelname/)).toEqual([])
    // „Hotel“ nur, wo es um die Branche geht: Hotelkonto, Hotelzugang, „als Hotel“.
    const branche = /Hotelkonto|Hotelzugang|[Aa]ls Hotel\b/
    expect(all.filter(([, t]) => /\bHotel/.test(t.replace(new RegExp(branche, 'g'), ''))).map(([k]) => k)).toEqual([])
  })

  it('kennt keine „Kollegin“ und kein „Zimmermädchen“ (Entscheidung 3)', () => {
    expect(hits(/Kollegin|Zimmermädchen/)).toEqual([])
  })

  it('schreibt „Gästeportal“ und „Gästezugang“ (Entscheidung 4)', () => {
    expect(hits(/Gäste-Portal|Gastportal|Gast-Portal|Gäste-Zugang/)).toEqual([])
  })

  it('sagt „Anfrage“ statt „Bestellung“ und „erledigt“ statt „erbracht“ beim Abschluss (Entscheidung 5)', () => {
    expect(hits(/Bestellung|Services-Board/)).toEqual([])
  })

  it('sagt „tägliche Reinigung“ statt „Routine“ oder „Stayover“ (Entscheidung 6)', () => {
    expect(hits(/Routine|Stayover/)).toEqual([])
  })

  it('sagt „Anmeldung“ und „Zugangskarte“ statt „Login“ (Entscheidung 8)', () => {
    expect(hits(/Login|einlogg|eingeloggt/)).toEqual([])
  })

  it('sagt „Check-in-Blatt“ und „Aushang“ (Entscheidung 9)', () => {
    expect(hits(/Handout|Zettel|QR-Aush|Zimmer-QR-Aush/)).toEqual([])
  })

  it('sagt „Zahlungsweg“, nicht „Zahlungsverfahren“ oder „Zahlungsmittel“ (Entscheidung 10)', () => {
    expect(hits(/Zahlungsverfahren|Zahlungsmittel/)).toEqual([])
  })

  it('sagt „Bitte nicht stören“, „Eintrag“ und „Schieber“ (Entscheidungen 11, 12)', () => {
    expect(hits(/(?<!Bitte )(?<!bitte )[Nn]icht stören(?!“)/).filter(([, t]) => !/Bitte nicht stören/.test(t))).toEqual([])
    expect(hits(/\bDND\b|\bStich|Slider/)).toEqual([])
  })

  it('setzt deutsche Anführungszeichen, den kurzen Gedankenstrich und „E-Mail“ (Entscheidung 13)', () => {
    expect(hits(/"|—/)).toEqual([])
    expect(all.filter(([, t]) => (t.match(/„/g) ?? []).length !== (t.match(/“/g) ?? []).length)).toEqual([])
    expect(hits(/(?<![-\w])Mails?\b/)).toEqual([])
  })
})
