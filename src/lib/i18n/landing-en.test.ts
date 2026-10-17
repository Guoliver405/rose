import { describe, expect, it } from 'vitest'
import { landing as deLanding } from './de/landing'
import { landing as enLanding } from './en/landing'
import { landingContext } from './de/landing/context'
import { guest as enGuest } from './en/guest'
import { service as enService } from './en/service'
import { contextFor, flattenMessages } from './format'

/* Landing Page auf Englisch (18.10.2026): Wächter wie für die übrigen Bereiche. */
const tokens = (text: string) => [...(text.match(/\{\w+\}|<\/?\w+>/g) ?? [])].sort()
const deAll = flattenMessages(deLanding)
const enAll = new Map(flattenMessages(enLanding))

describe('Landing Page auf Englisch', () => {
  it('behält Platzhalter und Tags der deutschen Fassung', () => {
    expect(deAll.filter(([k, t]) => tokens(t).join() !== tokens(enAll.get(k) ?? '').join())).toEqual([])
  })
  it('enthält keine deutschen Reste (außer in Quellentiteln)', () => {
    expect([...enAll].filter(([k, t]) => !k.startsWith('roi.sources.items') && /[äöüÄÖÜß„]|\b(und|oder|Zimmer|Etage|bitte)\b/.test(t))).toEqual([])
  })
  it('schreibt amerikanisch, typografisch und neutral', () => {
    expect([...enAll].filter(([, t]) => t.includes('"') || t.includes('...'))).toEqual([])
    expect([...enAll].filter(([k, t]) => !k.startsWith('roi.sources.items') && /colour|favour|organis|behaviour|centre|cancelled|licence/i.test(t))).toEqual([])
    expect([...enAll].filter(([, t]) => /\b(she|her)\b/i.test(t))).toEqual([])
  })
  it('hat zu jedem Text eine Erläuterung', () => {
    expect(deAll.filter(([k]) => !contextFor(landingContext, k)?.note.trim())).toEqual([])
  })
  it('die Vorschau spricht wie die Portale', () => {
    expect(enLanding.demo.guest.clean).toBe(enGuest.signal.clean.label)
    expect(enLanding.demo.guest.dnd).toBe(enGuest.signal.dnd.label)
    expect(enLanding.demo.board.finish).toBe(enService.board.finish)
  })
})
