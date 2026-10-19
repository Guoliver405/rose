import { describe, expect, it } from 'vitest'
import {
  BODY_MAX, SUBJECT_MAX, canSeeTicket, detectScreenshotMime, mailableAddress, parseContext, parseSupportIds,
  sanitizeContext, screenshotPath, validateScreenshot, validateTicketInput, type ViewerAccess,
} from './tickets'

const ACC_A = '11111111-1111-4111-8111-111111111111'
const ACC_B = '22222222-2222-4222-8222-222222222222'
const H1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const H2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const ME = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const OTHER = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'

const ticket = (o: Partial<{ accountId: string; hotelId: string | null; reporterId: string | null }> = {}) => ({
  accountId: ACC_A, hotelId: H1, reporterId: OTHER, ...o,
})

describe('canSeeTicket – wer eine Meldung sieht', () => {
  const owner: ViewerAccess[] = [{ hotelId: H1, accountId: ACC_A, role: 'admin' }, { hotelId: H2, accountId: ACC_A, role: 'admin' }]
  const managerH1: ViewerAccess[] = [{ hotelId: H1, accountId: ACC_A, role: 'manager' }]
  const managerH2: ViewerAccess[] = [{ hotelId: H2, accountId: ACC_A, role: 'manager' }]
  const receptionH1: ViewerAccess[] = [{ hotelId: H1, accountId: ACC_A, role: 'reception' }]

  it('der Inhaber sieht alle Meldungen seines Kontos, auch ohne Haus', () => {
    expect(canSeeTicket(ticket(), ME, owner)).toBe(true)
    expect(canSeeTicket(ticket({ hotelId: null }), ME, owner)).toBe(true)
  })

  it('ein Manager sieht die Meldungen seines Hauses, nicht die anderer Häuser', () => {
    expect(canSeeTicket(ticket(), ME, managerH1)).toBe(true)
    expect(canSeeTicket(ticket(), ME, managerH2)).toBe(false)
    expect(canSeeTicket(ticket({ hotelId: null }), ME, managerH1)).toBe(false)
  })

  it('die Rezeption sieht nur ihre eigenen', () => {
    expect(canSeeTicket(ticket(), ME, receptionH1)).toBe(false)
    expect(canSeeTicket(ticket({ reporterId: ME }), ME, receptionH1)).toBe(true)
  })

  it('wer das Konto verlassen hat, sieht auch die eigene Meldung nicht mehr', () => {
    expect(canSeeTicket(ticket({ reporterId: ME }), ME, [])).toBe(false)
    expect(canSeeTicket(ticket({ reporterId: ME }), ME, [{ hotelId: H1, accountId: ACC_B, role: 'admin' }])).toBe(false)
  })

  it('ein Inhaber eines anderen Kontos sieht nichts', () => {
    expect(canSeeTicket(ticket(), ME, [{ hotelId: H2, accountId: ACC_B, role: 'admin' }])).toBe(false)
  })
})

describe('validateTicketInput', () => {
  it('nimmt eine gültige Meldung und bereinigt Leerraum', () => {
    expect(validateTicketInput({ kind: 'bug', subject: '  Knopf   tot ', body: '\r\nZeile 1\r\nZeile 2  ' }))
      .toEqual({ kind: 'bug', subject: 'Knopf tot', body: 'Zeile 1\nZeile 2' })
  })

  it('weist unbekannte Arten, leere und zu lange Texte ab', () => {
    expect(validateTicketInput({ kind: 'rant', subject: 'x', body: 'y' })).toEqual({ error: 'kind' })
    expect(validateTicketInput({ kind: 'idea', subject: ' ', body: 'y' })).toEqual({ error: 'subject' })
    expect(validateTicketInput({ kind: 'idea', subject: 'x'.repeat(SUBJECT_MAX + 1), body: 'y' })).toEqual({ error: 'subject' })
    expect(validateTicketInput({ kind: 'idea', subject: 'x', body: 'y'.repeat(BODY_MAX + 1) })).toEqual({ error: 'body' })
  })
})

describe('Kontext aus dem Browser', () => {
  it('kürzt, entfernt Steuerzeichen und behält höchstens zehn Fehler', () => {
    const c = sanitizeContext({
      path: '/h/x/admin\n', locale: 'de', viewport: '1280×800', userAgent: 'a'.repeat(500),
      errors: Array.from({ length: 15 }, (_, i) => `e${i}`), extra: 'weg',
    })
    expect(c.path).toBe('/h/x/admin')
    expect(c.userAgent).toHaveLength(300)
    expect(c.errors).toEqual(['e5', 'e6', 'e7', 'e8', 'e9', 'e10', 'e11', 'e12', 'e13', 'e14'])
    expect(c).not.toHaveProperty('extra')
  })

  it('kaputtes JSON kostet nur den Kontext, nicht die Meldung', () => {
    expect(parseContext('{nope')).toEqual({ path: null, locale: null, viewport: null, userAgent: null, errors: [] })
  })
})

describe('Bildschirmfoto', () => {
  const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0])
  const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])
  const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>')

  it('die Bytes entscheiden – SVG ist kein Bildschirmfoto', () => {
    expect(detectScreenshotMime(PNG)).toBe('image/png')
    expect(detectScreenshotMime(JPG)).toBe('image/jpeg')
    expect(detectScreenshotMime(WEBP)).toBe('image/webp')
    expect(detectScreenshotMime(SVG)).toBeNull()
  })

  it('weist zu große Dateien ab', () => {
    expect(validateScreenshot(2 * 1024 * 1024, PNG)).toEqual({ error: 'tooLarge' })
    expect(validateScreenshot(1000, SVG)).toEqual({ error: 'wrongType' })
  })

  it('legt im Ordner des Kontos ab, mit Zufallsanteil', () => {
    const p = screenshotPath(ACC_A, H1, 'image/jpeg')
    expect(p).toMatch(new RegExp(`^${ACC_A}/${H1}-[0-9a-f]{8}\\.jpg$`))
    expect(screenshotPath(ACC_A, H1, 'image/jpeg')).not.toBe(p)
    expect(() => screenshotPath('../x', H1, 'image/png')).toThrow()
  })
})

describe('Mails und Support-Konten', () => {
  it('schreibt nicht an Testadressen', () => {
    expect(mailableAddress('rezeption@rose.local')).toBeNull()
    expect(mailableAddress(' anna@example.com ')).toBe('anna@example.com')
    expect(mailableAddress(null)).toBeNull()
  })

  it('liest nur gültige Auth-IDs aus SUPPORT_USER_IDS', () => {
    expect(parseSupportIds(`${ME.toUpperCase()}, quatsch ${OTHER}`)).toEqual([ME, OTHER])
    expect(parseSupportIds(undefined)).toEqual([])
  })
})
