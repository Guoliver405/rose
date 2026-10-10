import { describe, expect, it } from 'vitest'
import { format, parseRich } from './format'

describe('format', () => {
  it('ersetzt Platzhalter, auch mehrfach und mit Zahlen', () => {
    expect(format('Zimmer {number}', { number: '204' })).toBe('Zimmer 204')
    expect(format('{a}–{b} Uhr, ab {a}', { a: 10, b: 12 })).toBe('10–12 Uhr, ab 10')
  })

  it('lässt einen fehlenden Wert sichtbar stehen, statt ihn zu verschlucken', () => {
    expect(format('ab {time} Uhr', {})).toBe('ab {time} Uhr')
  })
})

describe('parseRich', () => {
  it('zerlegt einen Satz in Text und Hervorhebungen', () => {
    expect(parseRich('bis <b>{limit} Uhr</b> aufschieben', { limit: '11:00' })).toEqual([
      { text: 'bis ' },
      { text: '11:00 Uhr', tag: 'b' },
      { text: ' aufschieben' },
    ])
  })

  it('kennt mehrere Tags und Tags am Rand', () => {
    expect(parseRich('<b>{s}</b> bis <b>{e}</b>', { s: '8', e: '12' })).toEqual([
      { text: '8', tag: 'b' },
      { text: ' bis ' },
      { text: '12', tag: 'b' },
    ])
  })

  it('gibt Text ohne Tags unverändert als einen Abschnitt zurück', () => {
    expect(parseRich('Abmelden')).toEqual([{ text: 'Abmelden' }])
  })
})
