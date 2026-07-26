import { describe, expect, it } from 'vitest'
import { isValidSlug, slugify, SLUG_MAX_LENGTH, uniqueSlug } from './slug'

describe('slugify', () => {
  it('macht aus einem Hotelnamen eine URL-taugliche Kennung', () => {
    expect(slugify('Stadthotel Krone')).toBe('stadthotel-krone')
  })

  it('entfaltet deutsche Umlaute statt sie wegzuwerfen', () => {
    expect(slugify('Gasthaus Löwenbräu')).toBe('gasthaus-loewenbraeu')
    expect(slugify('Schloß Ähren Über')).toBe('schloss-aehren-ueber')
  })

  it('führt Akzente auf den Grundbuchstaben zurück', () => {
    // Ohne die NFD-Zerlegung würde daraus caf-r-slein.
    expect(slugify('Café Röslein')).toBe('cafe-roeslein')
  })

  it('faltet Sonderzeichen und Mehrfach-Trenner zu einem Bindestrich', () => {
    expect(slugify('Hotel   am  See & Meer!')).toBe('hotel-am-see-meer')
  })

  it('lässt keine Bindestriche am Rand stehen', () => {
    expect(slugify('  -- Hotel --  ')).toBe('hotel')
  })

  it('kürzt auf die Maximallänge, ohne mit Bindestrich zu enden', () => {
    const slug = slugify('a'.repeat(40) + ' ' + 'b'.repeat(40))
    expect(slug.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH)
    expect(slug.endsWith('-')).toBe(false)
  })

  it('fällt auf "hotel" zurück, wenn nichts Verwertbares übrig bleibt', () => {
    expect(slugify('!!!')).toBe('hotel')
    expect(slugify('')).toBe('hotel')
  })
})

describe('isValidSlug', () => {
  it('akzeptiert Kleinbuchstaben, Ziffern und innenliegende Bindestriche', () => {
    expect(isValidSlug('krone')).toBe(true)
    expect(isValidSlug('hotel-42')).toBe(true)
    expect(isValidSlug('a')).toBe(true)
  })

  it('weist Rand-Bindestriche, Großbuchstaben und Leerzeichen ab', () => {
    expect(isValidSlug('-krone')).toBe(false)
    expect(isValidSlug('krone-')).toBe(false)
    expect(isValidSlug('Krone')).toBe(false)
    expect(isValidSlug('zwei worte')).toBe(false)
    expect(isValidSlug('')).toBe(false)
  })

  it('weist zu lange Kennungen ab', () => {
    expect(isValidSlug('a'.repeat(SLUG_MAX_LENGTH))).toBe(true)
    expect(isValidSlug('a'.repeat(SLUG_MAX_LENGTH + 1))).toBe(false)
  })
})

describe('uniqueSlug', () => {
  it('lässt dem ersten Haus den unverzierten Slug', () => {
    expect(uniqueSlug('krone', [])).toBe('krone')
    expect(uniqueSlug('krone', ['adler'])).toBe('krone')
  })

  it('zählt erst ab dem zweiten Treffer hoch', () => {
    expect(uniqueSlug('krone', ['krone'])).toBe('krone-2')
    expect(uniqueSlug('krone', ['krone', 'krone-2'])).toBe('krone-3')
  })

  it('bleibt auch mit Zähler innerhalb der Maximallänge', () => {
    const base = 'a'.repeat(SLUG_MAX_LENGTH)
    const result = uniqueSlug(base, [base])
    expect(result.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH)
    expect(result.endsWith('-2')).toBe(true)
  })
})
