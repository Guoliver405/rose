import { describe, expect, it } from 'vitest'
import {
  LOGO_BUCKET, LOGO_MAX_BYTES, detectLogoMime, logoFolder, logoObjectPath, logoPublicUrl,
  validateLogoUpload,
} from './logo'

const HOTEL = '3f1c9a2e-7b4d-4c8a-9e1f-2a5b6c7d8e9f'

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13])
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46])
const ZIP = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 20, 0, 0, 0])
const bytes = (s: string) => new TextEncoder().encode(s)

describe('detectLogoMime — die Bytes entscheiden', () => {
  it('erkennt PNG, JPG und SVG', () => {
    expect(detectLogoMime(PNG)).toBe('image/png')
    expect(detectLogoMime(JPG)).toBe('image/jpeg')
    expect(detectLogoMime(bytes('<svg xmlns="http://www.w3.org/2000/svg"></svg>')))
      .toBe('image/svg+xml')
  })

  it('erkennt SVG auch hinter XML-Deklaration und Doctype', () => {
    const svg = '<?xml version="1.0" encoding="UTF-8"?>\n'
      + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n'
      + '<svg viewBox="0 0 10 10"></svg>'
    expect(detectLogoMime(bytes(svg))).toBe('image/svg+xml')
  })

  it('lässt ein umbenanntes ZIP nicht durch', () => {
    // Der Grund für die Byte-Prüfung: Endung und gemeldeter Typ sind beide
    // frei wählbar.
    expect(detectLogoMime(ZIP)).toBeNull()
  })

  it('nimmt kein GIF und kein WebP — nicht in der Liste', () => {
    expect(detectLogoMime(bytes('GIF89a'))).toBeNull()
    expect(detectLogoMime(bytes('RIFF....WEBPVP8 '))).toBeNull()
  })

  it('verträgt einen leeren oder abgeschnittenen Kopf', () => {
    expect(detectLogoMime(new Uint8Array())).toBeNull()
    expect(detectLogoMime(PNG.slice(0, 4))).toBeNull()
  })
})

describe('validateLogoUpload', () => {
  it('nimmt ein Logo im Rahmen an', () => {
    expect(validateLogoUpload(50_000, PNG)).toEqual({ mime: 'image/png' })
  })

  it('weist zu große Dateien mit Zahl ab', () => {
    const res = validateLogoUpload(LOGO_MAX_BYTES + 1, PNG)
    expect('error' in res && res.error).toMatch(/zu groß/)
    expect('error' in res && res.error).toMatch(/1 MB/)
    // Genau an der Grenze noch erlaubt.
    expect(validateLogoUpload(LOGO_MAX_BYTES, PNG)).toEqual({ mime: 'image/png' })
  })

  it('weist Leeres und Fremdes ab', () => {
    expect('error' in validateLogoUpload(0, PNG)).toBe(true)
    expect('error' in validateLogoUpload(NaN, PNG)).toBe(true)
    const res = validateLogoUpload(1000, ZIP)
    expect('error' in res && res.error).toMatch(/PNG, JPG oder SVG/)
  })
})

describe('logoObjectPath', () => {
  it('beginnt mit der Hotel-ID und trägt die passende Endung', () => {
    expect(logoObjectPath(HOTEL, 'image/png')).toMatch(new RegExp(`^${HOTEL}/logo-[0-9a-f]{8}\\.png$`))
    expect(logoObjectPath(HOTEL, 'image/jpeg')).toMatch(/\.jpg$/)
    expect(logoObjectPath(HOTEL, 'image/svg+xml')).toMatch(/\.svg$/)
  })

  it('ist bei jedem Aufruf ein anderer Pfad', () => {
    // Sonst liefert der CDN nach einem Logo-Wechsel das alte Bild aus.
    const pfade = new Set(Array.from({ length: 20 }, () => logoObjectPath(HOTEL, 'image/png')))
    expect(pfade.size).toBe(20)
  })

  it('nimmt nur eine Hotel-UUID — kein Ausbrechen aus dem Ordner', () => {
    expect(() => logoObjectPath('../anderes-haus', 'image/png')).toThrow()
    expect(() => logoFolder('')).toThrow()
    expect(() => logoFolder(`${HOTEL}/..`)).toThrow()
  })
})

describe('logoPublicUrl', () => {
  it('baut die öffentliche URL aus der Basis', () => {
    expect(logoPublicUrl('https://abc.supabase.co', `${HOTEL}/logo-deadbeef.png`))
      .toBe(`https://abc.supabase.co/storage/v1/object/public/${LOGO_BUCKET}/${HOTEL}/logo-deadbeef.png`)
  })

  it('verträgt einen abschließenden Schrägstrich', () => {
    expect(logoPublicUrl('https://abc.supabase.co/', 'x/y.png'))
      .toBe(`https://abc.supabase.co/storage/v1/object/public/${LOGO_BUCKET}/x/y.png`)
  })
})
