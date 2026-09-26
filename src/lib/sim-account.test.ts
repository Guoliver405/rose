import { describe, expect, it } from 'vitest'
import {
  MARKETING_TEXT, SIGNUP_MAX_PER_HOUR, SIGNUP_WINDOW_MS, isExpiredUnconfirmed, parseSignup, signupThrottled,
} from './sim-account'
import { simConfirmMail, simExistsMail } from './mail-templates'

const form = (v: Record<string, string>) => ({ get: (k: string) => v[k] ?? null })

describe('Simulator-Konto', () => {
  it('Registrierung: Adresse klein, Passwortlänge, Häkchen nur bei „on“', () => {
    expect(parseSignup(form({ email: ' Test@Example.COM ', password: 'geheim123' }))).toEqual({
      input: { email: 'test@example.com', password: 'geheim123', marketing: false },
    })
    expect(parseSignup(form({ email: 'a@b.de', password: 'geheim123', marketing: 'on' })).input?.marketing).toBe(true)
    expect(parseSignup(form({ email: 'kein-at', password: 'geheim123' })).error).toMatch(/E-Mail/)
    expect(parseSignup(form({ email: 'a@b.de', password: 'kurz' })).error).toMatch(/8 Zeichen/)
    expect(parseSignup(form({ email: 'a@b.de', password: 'x'.repeat(73) })).error).toMatch(/72/)
  })

  it('Drossel: fünf Versuche je Stunde, ältere zählen nicht', () => {
    const now = 10 * SIGNUP_WINDOW_MS
    const recent = Array.from({ length: SIGNUP_MAX_PER_HOUR - 1 }, (_, i) => now - i * 60_000)
    expect(signupThrottled(recent, now)).toBe(false)
    expect(signupThrottled([...recent, now - 1000], now)).toBe(true)
    expect(signupThrottled([...recent, now - SIGNUP_WINDOW_MS - 1], now)).toBe(false)
  })

  it('unbestätigte Konten verfallen nach sieben Tagen, bestätigte nie', () => {
    const now = Date.parse('2026-10-10T12:00:00Z')
    expect(isExpiredUnconfirmed('2026-10-03T11:59:00Z', null, now)).toBe(true)
    expect(isExpiredUnconfirmed('2026-10-03T12:01:00Z', null, now)).toBe(false)
    expect(isExpiredUnconfirmed('2026-01-01T00:00:00Z', '2026-01-01T01:00:00Z', now)).toBe(false)
  })

  it('Einwilligung: nur RoSe, keine Weitergabe, abbestellbar', () => {
    expect(MARKETING_TEXT).toMatch(/ausschließlich zu RoSe/)
    expect(MARKETING_TEXT).toMatch(/nicht weitergegeben/)
    expect(MARKETING_TEXT).toMatch(/Abbestellen/)
  })

  it('Bestätigungsmail nennt die Einwilligung nur, wenn angekreuzt; Link in HTML und Text', () => {
    const url = 'https://rose.test/auth/confirm?token_hash=abc&type=signup&next=%2Fsimulator'
    const mit = simConfirmMail({ url, marketing: true, toolName: 'Housekeeping-Simulator' })
    const ohne = simConfirmMail({ url, marketing: false, toolName: 'Housekeeping-Simulator' })
    expect(mit.text).toMatch(/Einwilligung/)
    expect(ohne.text).not.toMatch(/Einwilligung/)
    for (const m of [mit, ohne]) {
      expect(m.text).toContain(url)
      expect(m.html).toContain(url.replace(/&/g, '&amp;'))
    }
    const exists = simExistsMail({ loginUrl: 'https://rose.test/login', resetUrl: 'https://rose.test/passwort-vergessen', toolName: 'Housekeeping-Simulator' })
    expect(exists.text).toMatch(/bereits einen Zugang/)
  })
})
