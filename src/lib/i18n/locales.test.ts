import { describe, expect, it } from 'vitest'
import { matchAcceptLanguage, parseFallbackLanguage, resolveLocale } from './locales'

describe('matchAcceptLanguage', () => {
  it('nimmt die erste angebotene Sprache nach Gewichtung', () => {
    expect(matchAcceptLanguage('fr-FR,fr;q=0.9,en-US;q=0.8,de;q=0.7', ['de', 'en'])).toBe('en')
    expect(matchAcceptLanguage('de;q=0.5,en;q=0.9', ['de', 'en'])).toBe('en')
  })
  it('Regionen zählen zur Sprache', () => {
    expect(matchAcceptLanguage('en-GB', ['de', 'en'])).toBe('en')
  })
  it('nichts Angebotenes, leer oder Stern ⇒ null', () => {
    expect(matchAcceptLanguage('it-IT,it;q=0.9', ['de', 'en'])).toBeNull()
    expect(matchAcceptLanguage('', ['de', 'en'])).toBeNull()
    expect(matchAcceptLanguage('*', ['de', 'en'])).toBeNull()
    expect(matchAcceptLanguage('en;q=0', ['de', 'en'])).toBeNull()
  })
})

describe('resolveLocale — eigene Wahl → Gerät → Rückfall → Vorgabe', () => {
  it('die eigene Wahl geht vor', () => {
    expect(resolveLocale({ chosen: 'de', acceptLanguage: 'en' })).toBe('de')
  })
  it('eine unbekannte Wahl zählt nicht', () => {
    expect(resolveLocale({ chosen: 'xx', acceptLanguage: 'en' })).toBe('en')
  })
  it('ohne Treffer am Gerät gilt die Rückfallsprache des Hauses', () => {
    expect(resolveLocale({ acceptLanguage: 'it', fallback: 'en' })).toBe('en')
  })
  it('ganz ohne Angaben Deutsch', () => {
    expect(resolveLocale({})).toBe('de')
  })
  it('nur angebotene Sprachen', () => {
    expect(resolveLocale({ chosen: 'en', acceptLanguage: 'en', fallback: 'en', offered: ['de'] })).toBe('de')
  })
})

describe('parseFallbackLanguage', () => {
  it('liest die Policy, sonst Deutsch', () => {
    expect(parseFallbackLanguage({ fallbackLanguage: 'en' })).toBe('en')
    expect(parseFallbackLanguage({ fallbackLanguage: 'xx' })).toBe('de')
    expect(parseFallbackLanguage({})).toBe('de')
  })
})
