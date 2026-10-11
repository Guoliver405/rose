import { describe, expect, it } from 'vitest'
import { mail } from './de/mail'
import { print } from './de/print'
import { flattenMessages } from './format'
import { GUIDE_LANGS, SHEETS } from './sheets'

/*
 * Wächter für die Entscheidungen aus `Sessions/Begriffe-Entscheidungen.md` —
 * Druckseiten, Mails und das deutsche Gastblatt.
 */
describe('Druck und Mail — Begriffe und Schreibweise (deutsch)', () => {
  const all = [
    ...flattenMessages(mail).map(([k, t]) => [`mail.${k}`, t] as const),
    ...flattenMessages(print).map(([k, t]) => [`print.${k}`, t] as const),
    ...flattenMessages(SHEETS.de).map(([k, t]) => [`sheet.${k}`, t] as const),
  ]

  it('sagt „Check-in-Blatt“, „Aushang“, „Zugangskarte“, „Gästeportal“ (Entscheidungen 4, 8, 9)', () => {
    expect(all.filter(([, t]) => /Handout|Zettel|Gäste-Portal|Gastportal|Login-Karte|eingeloggt|Zimmer-QR-Aush|QR-Aush/.test(t))).toEqual([])
  })

  it('schreibt „E-Mail“, nicht „Mail“ (Entscheidung 13)', () => {
    expect(all.filter(([, t]) => /(?<![-\w])Mails?\b|(?<!E)-Mails?\b/.test(t))).toEqual([])
  })

  it('setzt deutsche Anführungszeichen und den kurzen Gedankenstrich (Entscheidung 13)', () => {
    expect(all.filter(([, t]) => t.includes('"') || t.includes('—'))).toEqual([])
    expect(all.filter(([, t]) => (t.match(/„/g) ?? []).length !== (t.match(/“/g) ?? []).length)).toEqual([])
  })

  it('kennt beim Abschluss nur „erledigt“ (Entscheidung 5)', () => {
    expect(print.statement.done).toBe('Erledigt')
  })
})

describe('Blatt-Sprachen', () => {
  it('haben in jeder Sprache alle Texte — keiner bleibt leer', () => {
    // Der Type-Check sichert die Schlüssel (`Shape`), dieser Test die Inhalte.
    for (const lang of GUIDE_LANGS) {
      for (const [k, t] of flattenMessages(SHEETS[lang])) {
        expect(t.trim().length, `${lang}.${k}`).toBeGreaterThan(1)
      }
    }
  })

  it('tragen in der Mail dieselben Platzhalter in jeder Sprache', () => {
    for (const lang of GUIDE_LANGS) {
      expect(SHEETS[lang].mail.subject, lang).toMatch(/\{hotel\}.*\{room\}/)
      expect(SHEETS[lang].mail.intro, lang).toMatch(/<b>\{hotel\}<\/b>.*<b>\{room\}<\/b>/)
      expect(SHEETS[lang].cleaningRoutine, lang).toContain('{due}')
    }
  })
})
