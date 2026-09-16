import { describe, expect, it } from 'vitest'
import { SERVICE_LINK_TEMPLATES, normalizeLinkUrl } from './service-link-templates'

describe('normalizeLinkUrl', () => {
  it('nimmt http(s) und normalisiert', () => {
    expect(normalizeLinkUrl('  https://www.lieferando.de/lieferservice ')).toBe('https://www.lieferando.de/lieferservice')
    expect(normalizeLinkUrl('http://example.org')).toBe('http://example.org/')
  })

  it('weist alles ab, was im Gastportal nicht landen darf', () => {
    expect(normalizeLinkUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeLinkUrl('data:text/html,hi')).toBeNull()
    expect(normalizeLinkUrl('mailto:x@y.z')).toBeNull()
    expect(normalizeLinkUrl('lieferando.de')).toBeNull() // kein Schema
    expect(normalizeLinkUrl('https://localhost')).toBeNull() // kein Punkt im Host
    expect(normalizeLinkUrl('')).toBeNull()
  })

  it('Vorlagen tragen entweder eine gültige Adresse oder bewusst keine', () => {
    for (const t of SERVICE_LINK_TEMPLATES) {
      if (t.url) expect(normalizeLinkUrl(t.url)).toBe(t.url)
      else expect(t.hinweis.length).toBeGreaterThan(20) // ohne URL muss der Hinweis sagen, was einzutragen ist
    }
    expect(new Set(SERVICE_LINK_TEMPLATES.map(t => t.id)).size).toBe(SERVICE_LINK_TEMPLATES.length)
  })
})
