import { describe, expect, it } from 'vitest'
import { guest as de } from './de/guest'
import { guest as en } from './en/guest'
import { guestContext } from './de/guest.context'
import { flattenContext, flattenMessages } from './format'
import { buildGuestSheet } from '../guest-guide'
import { sheet as enSheet } from './en/sheet'

/*
 * Englisch fürs Gästeportal (17.10.2026, amerikanisches Englisch) und die
 * Erläuterungen für Übersetzer. Wächter wie für Deutsch in `guest.test.ts`:
 * Entscheidungen sollen nicht still zurückrutschen.
 */
const deAll = flattenMessages(de)
const enAll = new Map(flattenMessages(en))
const ctxAll = new Map(flattenContext(guestContext))

/** Platzhalter und Tags eines Textes, sortiert — sie müssen jede Übersetzung überleben. */
function tokens(text: string): string[] {
  return [...(text.match(/\{\w+\}|<\/?\w+>/g) ?? [])].sort()
}

describe('Gästeportal — Englisch', () => {
  it('behält in jedem Text Platzhalter und Tags der deutschen Fassung', () => {
    const abweichend = deAll.filter(([k, t]) => tokens(t).join() !== tokens(enAll.get(k) ?? '').join())
    expect(abweichend).toEqual([])
  })

  it('enthält keine deutschen Reste', () => {
    expect([...enAll].filter(([, t]) => /[äöüÄÖÜß„]|\b(Uhr|Zimmer|und|bitte)\b/.test(t))).toEqual([])
  })

  it('sagt nicht „hotel“ — das Haus spricht als „we“ (wie „unser Haus“)', () => {
    expect([...enAll].filter(([, t]) => /\bhotel\b/i.test(t))).toEqual([])
  })

  it('setzt typografische Anführungszeichen und Auslassungspunkte', () => {
    expect([...enAll].filter(([, t]) => t.includes('"') || t.includes('...'))).toEqual([])
    expect([...enAll].filter(([, t]) => (t.match(/“/g) ?? []).length !== (t.match(/”/g) ?? []).length)).toEqual([])
  })

  it('schreibt amerikanisch, nicht britisch — auch auf dem englischen Blatt', () => {
    const british = /colour|favour|organis|centre|cancelled|travell|licence/i
    expect([...enAll].filter(([, t]) => british.test(t))).toEqual([])
    expect(flattenMessages(enSheet).filter(([, t]) => british.test(t))).toEqual([])
  })

  it('hält die Knopf-Beschriftungen kurz — sie stehen auch auf dem gedruckten Blatt', () => {
    for (const label of [en.signal.clean.label, en.signal.dnd.label, en.signal.skip.label, en.services.heading]) {
      expect(label.length).toBeLessThanOrEqual(20)
    }
  })

  it('nennt Knöpfe im Fließtext wortgleich mit ihrer Beschriftung', () => {
    expect(en.status.done.text).toContain(`“${en.signal.clean.label}”`)
    expect(en.status.dnd.text).toContain(`“${en.signal.dnd.label}”`)
    expect(en.status.scheduledFrom.daily).toContain(`“${en.signal.skip.label}”`)
  })

  it('das englische Blatt trägt die englischen Knöpfe', () => {
    const sheet = buildGuestSheet({}, { accessMode: 'pin', deepLink: true }, 'en')
    expect(sheet.buttons.clean.label).toBe(en.signal.clean.label)
    expect(sheet.buttons.services.label).toBe(en.services.heading)
  })
})

describe('Erläuterungen für Übersetzer', () => {
  it('jeder Text hat Ort und Erläuterung', () => {
    const ohne = deAll.filter(([k]) => !ctxAll.get(k)?.where.trim() || !ctxAll.get(k)?.note.trim())
    expect(ohne).toEqual([])
  })

  it('erklärt jeden Platzhalter und jedes Tag des Textes', () => {
    const fehlt = deAll.flatMap(([k, t]) =>
      tokens(t)
        .filter(tok => !tok.startsWith('</'))
        .filter(tok => !ctxAll.get(k)?.note.includes(tok))
        .map(tok => `${k}: ${tok}`),
    )
    expect(fehlt).toEqual([])
  })
})
