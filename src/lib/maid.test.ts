import { describe, expect, it } from 'vitest'
import { buildMaidEmail, normalizeUsername } from './maid'

describe('buildMaidEmail', () => {
  it('bindet die Hotel-ID ein und ist damit global eindeutig', () => {
    // Genau deshalb war der QR-Auto-Login nie vom Doppelnamen-Problem betroffen:
    // Benutzernamen sind nur je Hotel eindeutig, diese Adresse ist es global.
    const a = buildMaidEmail('maria', 'hotel-a')
    const b = buildMaidEmail('maria', 'hotel-b')
    expect(a).toBe('maria@hotel-a.rose.svc')
    expect(a).not.toBe(b)
  })

  it('normalisiert Groß-/Kleinschreibung und Rand-Leerzeichen', () => {
    expect(buildMaidEmail('  Maria  ', 'h1')).toBe('maria@h1.rose.svc')
  })
})

describe('normalizeUsername', () => {
  it('senkt auf Kleinbuchstaben', () => {
    expect(normalizeUsername('Maria')).toBe('maria')
  })

  it('lässt nur [a-z0-9._-] übrig', () => {
    expect(normalizeUsername('m a r i a!')).toBe('maria')
    expect(normalizeUsername('anna.b_c-1')).toBe('anna.b_c-1')
  })

  it('wirft Umlaute weg, statt sie zu entfalten', () => {
    // Anders als beim Hotel-Slug: der Benutzername wird eingetippt, nicht
    // abgeleitet — hier ist Wegwerfen die ehrlichere Rückmeldung.
    expect(normalizeUsername('Jörg')).toBe('jrg')
  })

  it('kommt mit leerer Eingabe klar', () => {
    expect(normalizeUsername('   ')).toBe('')
  })
})
