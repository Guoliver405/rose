import { describe, expect, it } from 'vitest'
import { service } from './de/service'
import { flattenMessages, plural } from './format'

/*
 * Die Entscheidungen aus `Sessions/Begriffe-Entscheidungen.md` als Wächter —
 * für das Reinigungsboard gilt das „du“.
 */
describe('Reinigungsboard — Begriffe und Schreibweise (deutsch)', () => {
  const all = flattenMessages(service)

  it('duzt die Reinigungskraft (Entscheidung 1)', () => {
    expect(all.filter(([, t]) => /\b(Sie|Ihr|Ihre|Ihren|Ihrem|Ihnen)\b/.test(t))).toEqual([])
  })

  it('kennt keine „Kollegin“, kein „Hotel“, kein „Management“ (Entscheidungen 2, 3)', () => {
    expect(all.filter(([, t]) => /Kollegin|\bHotel|Management/.test(t))).toEqual([])
  })

  it('sagt „tägliche Reinigung“, „Bitte nicht stören“ und „Eintrag“ (Entscheidungen 6, 11, 12)', () => {
    expect(all.filter(([, t]) => /Routine|Stayover|\bStich|Slider|\bDND\b/.test(t))).toEqual([])
    expect(all.filter(([, t]) => /(?<!Bitte )[Nn]icht stören/.test(t) && !/möchte nicht gestört/.test(t))).toEqual([])
  })

  it('setzt deutsche Anführungszeichen und den kurzen Gedankenstrich (Entscheidung 13)', () => {
    expect(all.filter(([, t]) => t.includes('"') || t.includes('—'))).toEqual([])
    expect(all.filter(([, t]) => (t.match(/„/g) ?? []).length !== (t.match(/“/g) ?? []).length)).toEqual([])
  })
})

describe('plural', () => {
  it('wählt die Form nach den Regeln der Sprache und setzt die Anzahl ein', () => {
    const forms = service.board.switchDepartures
    expect(plural('de-DE', 1, forms, { floor: 'Etage 3' })).toBe('Eine Abreise wartet auf Etage 3 – der Check-in rückt näher. Wechseln?')
    expect(plural('de-DE', 4, forms, { floor: 'Etage 3' })).toBe('4 Abreisen warten auf Etage 3 – der Check-in rückt näher. Wechseln?')
  })

  it('fällt auf „other“ zurück, wenn eine Sprache eine Form verlangt, die fehlt', () => {
    // Polnisch kennt „few“ (2–4) — ohne eigene Form gilt „other“.
    expect(plural('pl-PL', 3, { one: 'eins', other: '{count} viele' })).toBe('3 viele')
  })
})
