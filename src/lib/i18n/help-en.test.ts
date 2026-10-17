import { describe, expect, it } from 'vitest'
import { help as deHelp } from './de/help'
import { help as enHelp } from './en/help'
import { symbols as deSymbols } from './de/symbols'
import { symbols as enSymbols } from './en/symbols'
import { admin as enAdmin } from './en/admin'
import { helpContext, symbolsContext } from './de/help/context'
import { contextFor, flattenMessages } from './format'

/*
 * Englisch für Hilfe, Lotsen und Zimmer-Symbole (17.10.2026). Wie bei den
 * übrigen Bereichen: Platzhalter, deutsche Reste, Schreibweise, Erläuterung
 * je Text. Datenfelder der Themen (Zeichen-IDs, Farbtöne, Link-Ziele) sind
 * keine Texte und bleiben außen vor.
 */
const DATA_KEY = /\.(art|id|ton|icon|href)$/

function texts(obj: object): [string, string][] {
  return flattenMessages(obj).filter(([k]) => !DATA_KEY.test(k))
}

function tokens(text: string): string[] {
  return [...(text.match(/\{\w+\}|<\/?\w+>/g) ?? [])].sort()
}

describe.each([
  { name: 'help', de: deHelp, en: enHelp, ctx: helpContext },
  { name: 'symbols', de: deSymbols, en: enSymbols, ctx: symbolsContext },
])('Hilfe auf Englisch — $name', ({ de, en, ctx }) => {
  const deAll = texts(de)
  const enAll = new Map(texts(en))

  it('hat dieselben Schlüssel und dieselben Datenfelder wie die deutsche Fassung', () => {
    expect([...enAll.keys()].sort()).toEqual(deAll.map(([k]) => k).sort())
    const deData = flattenMessages(de).filter(([k]) => DATA_KEY.test(k))
    const enData = new Map(flattenMessages(en).filter(([k]) => DATA_KEY.test(k)))
    expect(deData.filter(([k, v]) => enData.get(k) !== v)).toEqual([])
  })

  it('behält in jedem Text Platzhalter und Tags', () => {
    expect(deAll.filter(([k, t]) => tokens(t).join() !== tokens(enAll.get(k) ?? '').join())).toEqual([])
  })

  it('enthält keine deutschen Reste', () => {
    expect([...enAll].filter(([, t]) => /[äöüÄÖÜß„]|\b(und|oder|Zimmer|Etage|bitte|nicht)\b/.test(t))).toEqual([])
  })

  it('setzt typografische Zeichen und schreibt amerikanisch', () => {
    expect([...enAll].filter(([, t]) => t.includes('"') || t.includes('...'))).toEqual([])
    expect([...enAll].filter(([, t]) => /colour|favour|organis|centre|cancelled|licence/i.test(t))).toEqual([])
  })

  it('hat zu jedem Text eine Erläuterung', () => {
    expect(deAll.filter(([k]) => !contextFor(ctx, k)?.note.trim())).toEqual([])
  })
})

describe('Hilfe nennt die Oberfläche wortgleich', () => {
  it('Seitennamen der Verwaltung', () => {
    expect(enHelp.topics.regeln.title).toBe(enAdmin.settings.house.title)
    expect(enHelp.topics.gastzugang.title).toBe(enAdmin.settings.guestAccess.title)
    expect(enHelp.topics.zugang.title).toBe(enAdmin.settings.myAccess.title)
  })
})
