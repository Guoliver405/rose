import { describe, expect, it } from 'vitest'
import { simulator as deSim } from './de/simulator'
import { simulator as enSim } from './en/simulator'
import { day as deDay } from './de/landing/day'
import { day as enDay } from './en/landing/day'
import { simulatorContext, dayContext } from './de/simulator/context'
import { guest as enGuest } from './en/guest'
import { contextFor, flattenMessages } from './format'

/*
 * Simulator auf Englisch (18.10.2026): dieselben Wächter wie für die
 * Verwaltung, dazu neutrale Pronomen für simulierte Reinigungskräfte.
 */
const pairs = [
  { name: 'simulator', de: deSim, en: enSim, ctx: simulatorContext },
  { name: 'day', de: deDay, en: enDay, ctx: dayContext },
] as const

const tokens = (text: string) => [...(text.match(/\{\w+\}|<\/?\w+>/g) ?? [])].sort()

describe.each(pairs)('Simulator auf Englisch — $name', ({ de, en, ctx }) => {
  const deAll = flattenMessages(de)
  const enAll = new Map(flattenMessages(en))

  it('behält Platzhalter und Tags der deutschen Fassung', () => {
    expect(deAll.filter(([k, t]) => tokens(t).join() !== tokens(enAll.get(k) ?? '').join())).toEqual([])
  })
  it('enthält keine deutschen Reste', () => {
    expect([...enAll].filter(([, t]) => /[äöüÄÖÜß„]|\b(und|oder|Zimmer|Etage|Kraft|bitte)\b/.test(t))).toEqual([])
  })
  it('schreibt amerikanisch, typografisch, neutral und sagt „property“', () => {
    expect([...enAll].filter(([, t]) => t.includes('"') || t.includes('...'))).toEqual([])
    expect([...enAll].filter(([, t]) => /colour|favour|organis|behaviour|centre|cancelled|licence/i.test(t))).toEqual([])
    expect([...enAll].filter(([, t]) => /\b(she|her|hers)\b/i.test(t))).toEqual([])
    expect([...enAll].filter(([, t]) => /\bhotels?\b/i.test(t))).toEqual([])
  })
  it('hat zu jedem Text eine Erläuterung', () => {
    expect(deAll.filter(([k]) => !contextFor(ctx, k)?.note.trim())).toEqual([])
  })
})

describe('Simulator spricht die Begriffe des Gästeportals', () => {
  it('nennt die Knöpfe wortgleich', () => {
    const all = flattenMessages(enSim).map(([, t]) => t).join(' ')
    expect(all).toContain(`“${enGuest.signal.clean.label}”`)
    expect(all).toContain(`“${enGuest.signal.dnd.label}`)
  })
})
