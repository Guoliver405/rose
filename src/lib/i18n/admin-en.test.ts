import { describe, expect, it } from 'vitest'
import { admin as deAdmin } from './de/admin'
import { admin as enAdmin } from './en/admin'
import { mail as deMail } from './de/mail'
import { mail as enMail } from './en/mail'
import { print as dePrint } from './de/print'
import { print as enPrint } from './en/print'
import { guest as enGuest } from './en/guest'
import { adminContext } from './de/admin/context'
import { mailContext } from './de/mail.context'
import { printContext } from './de/print.context'
import { contextFor, flattenMessages } from './format'

/*
 * Englisch für die Verwaltung (17.10.2026): Rezeption, Mails, Druckseiten.
 * Dieselben Wächter wie für die Portale — Platzhalter, deutsche Reste,
 * Schreibweise —, dazu Erläuterungen für jeden Text (geerbt oder eigen).
 */
const pairs = [
  { name: 'admin', de: deAdmin, en: enAdmin, ctx: adminContext },
  { name: 'mail', de: deMail, en: enMail, ctx: mailContext },
  { name: 'print', de: dePrint, en: enPrint, ctx: printContext },
] as const

function tokens(text: string): string[] {
  return [...(text.match(/\{\w+\}|<\/?\w+>/g) ?? [])].sort()
}

describe.each(pairs)('Verwaltung auf Englisch — $name', ({ de, en, ctx }) => {
  const deAll = flattenMessages(de)
  const enAll = new Map(flattenMessages(en))

  it('behält in jedem Text Platzhalter und Tags der deutschen Fassung', () => {
    expect(deAll.filter(([k, t]) => tokens(t).join() !== tokens(enAll.get(k) ?? '').join())).toEqual([])
  })

  it('enthält keine deutschen Reste', () => {
    expect([...enAll].filter(([, t]) => /[äöüÄÖÜß„]|\b(und|oder|Zimmer|Etage|bitte)\b/.test(t))).toEqual([])
  })

  it('setzt typografische Zeichen und schreibt amerikanisch', () => {
    expect([...enAll].filter(([, t]) => t.includes('"') || t.includes('...'))).toEqual([])
    expect([...enAll].filter(([, t]) => /colour|favour|organis|centre|cancelled|licence/i.test(t))).toEqual([])
  })

  it('hat zu jedem Text eine Erläuterung (eigene oder vom Abschnitt)', () => {
    expect(deAll.filter(([k]) => !contextFor(ctx, k)?.note.trim())).toEqual([])
  })
})

describe('Verwaltung und Portale sprechen dieselben Begriffe', () => {
  it('Gast-Zustände wortgleich wie im Gästeportal', () => {
    expect(enAdmin.overview.status.dnd).toBe(enGuest.signal.dnd.label)
    expect(enAdmin.overview.status.declined).toBe(enGuest.signal.skip.label)
  })
  it('sagt „property“, nicht „hotel“ — außer im Platzhalter und in Beispieladressen', () => {
    const hits = flattenMessages(enAdmin).filter(([, t]) => /\bhotels?\b/i.test(t.replace(/\{hotel\}|myhotel/g, '')))
    expect(hits).toEqual([])
  })
})
