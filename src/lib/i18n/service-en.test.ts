import { describe, expect, it } from 'vitest'
import { service as de } from './de/service'
import { service as en } from './en/service'
import { guest as enGuest } from './en/guest'
import { serviceContext } from './de/service.context'
import { flattenContext, flattenMessages } from './format'

/*
 * Englisch fürs Reinigungsboard (17.10.2026) und die Erläuterungen für
 * Übersetzer — dieselben Wächter wie fürs Gästeportal (`guest-en.test.ts`).
 */
const deAll = flattenMessages(de)
const enAll = new Map(flattenMessages(en))
const ctxAll = new Map(flattenContext(serviceContext))

function tokens(text: string): string[] {
  return [...(text.match(/\{\w+\}|<\/?\w+>/g) ?? [])].sort()
}

describe('Reinigungsboard — Englisch', () => {
  it('behält in jedem Text Platzhalter und Tags der deutschen Fassung', () => {
    expect(deAll.filter(([k, t]) => tokens(t).join() !== tokens(enAll.get(k) ?? '').join())).toEqual([])
  })

  it('enthält keine deutschen Reste', () => {
    expect([...enAll].filter(([, t]) => /[äöüÄÖÜß„]|\b(Uhr|Zimmer|Etage|Schicht|und)\b/.test(t))).toEqual([])
  })

  it('setzt typografische Zeichen und schreibt amerikanisch', () => {
    expect([...enAll].filter(([, t]) => t.includes('"') || t.includes('...'))).toEqual([])
    expect([...enAll].filter(([, t]) => /colour|favour|organis|centre|cancelled/i.test(t))).toEqual([])
  })

  it('Zustände auf der Kachel bleiben kurz — die Kachel am Handy ist schmal', () => {
    for (const [key, text] of Object.entries(en.board.state)) {
      if (key === 'dndLifted' || key === 'from') continue
      expect(text.length, key).toBeLessThanOrEqual(20)
    }
  })

  it('nennt Gast-Zustände wortgleich wie das Gästeportal', () => {
    expect(en.board.state.dnd).toBe(enGuest.signal.dnd.label)
    expect(en.board.state.declined).toBe(enGuest.signal.skip.label)
  })

  it('der Hinweis an der Tür nennt die drei Knöpfe wortgleich', () => {
    for (const label of [en.board.door.in30, en.board.door.in60, en.board.door.today]) {
      expect(en.board.door.hint).toContain(`“${label}`)
    }
  })
})

describe('Reinigungsboard — Erläuterungen für Übersetzer', () => {
  it('jeder Text hat Ort und Erläuterung', () => {
    expect(deAll.filter(([k]) => !ctxAll.get(k)?.where.trim() || !ctxAll.get(k)?.note.trim())).toEqual([])
  })

  it('erklärt jeden Platzhalter des Textes', () => {
    const fehlt = deAll.flatMap(([k, t]) =>
      tokens(t).filter(tok => !tok.startsWith('</') && !ctxAll.get(k)?.note.includes(tok)).map(tok => `${k}: ${tok}`),
    )
    expect(fehlt).toEqual([])
  })
})
