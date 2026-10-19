import { describe, expect, it } from 'vitest'
import {
  MARKETING_TEXT_VERSION, MARKETING_TEXT_VERSIONS, SIGNUP_MAX_PER_HOUR, SIGNUP_WINDOW_MS, isExpiredUnconfirmed, parseSignup, signupThrottled,
} from './sim-account'
import { simConfirmMail, simExistsMail } from './mail-templates'
import { account } from './i18n/de/simulator/account'
import { account as enAccount } from './i18n/en/simulator/account'
import { flattenMessages } from './i18n/format'

const MARKETING_TEXT = account.marketing.text
const e = account.errors

const form = (v: Record<string, string>) => ({ get: (k: string) => v[k] ?? null })

describe('Simulator-Konto', () => {
  it('Registrierung: Adresse klein, Passwortlänge, Häkchen nur bei „on“', () => {
    expect(parseSignup(form({ email: ' Test@Example.COM ', password: 'geheim123' }), e)).toEqual({
      input: { email: 'test@example.com', password: 'geheim123', marketing: false },
    })
    expect(parseSignup(form({ email: 'a@b.de', password: 'geheim123', marketing: 'on' }), e).input?.marketing).toBe(true)
    expect(parseSignup(form({ email: 'kein-at', password: 'geheim123' }), e).error).toMatch(/E-Mail/)
    expect(parseSignup(form({ email: 'a@b.de', password: 'kurz' }), e).error).toMatch(/8 Zeichen/)
    expect(parseSignup(form({ email: 'a@b.de', password: 'x'.repeat(73) }), e).error).toMatch(/72/)
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

  it('Einwilligung: Wortlaut gehört zur Fassung — Text geändert ⇒ MARKETING_TEXT_VERSION hochzählen und hier nachziehen', () => {
    expect(MARKETING_TEXT_VERSION).toBe('2026-09-26')
    expect(MARKETING_TEXT).toBe(
      'Ja, RoSe darf mich gelegentlich per E-Mail über neue Funktionen und besondere Angebote informieren – ausschließlich zu RoSe. Meine Adresse wird nicht weitergegeben. Abbestellen jederzeit mit einem Klick oder im Konto.',
    )
  })

  it('Einwilligung auf Englisch: eigener Wortlaut, eigene Fassung — Text geändert ⇒ Version hochzählen', () => {
    expect(MARKETING_TEXT_VERSIONS).toEqual({ de: '2026-09-26', en: '2026-10-18-en', fr: '2026-10-19-fr', es: '2026-10-19-es' })
    expect(enAccount.marketing.text).toBe(
      'Yes, RoSe may occasionally inform me by email about new features and special offers — about RoSe only. My address will not be passed on. I can unsubscribe at any time with one click or in my account.',
    )
  })

  it('Texte: gesiezt, „Haus & Regeln“, „E-Mail“, „…“ und „ – “ (Begriffs-Entscheidungen)', () => {
    const all = flattenMessages(account)
    const hits = (re: RegExp) => all.filter(([, t]) => re.test(t)).map(([k]) => k)
    expect(hits(/\b(du|dein\w*|dich|dir)\b/i)).toEqual([])
    expect(hits(/Hotel (&|und) Regeln|Login|einlogg/)).toEqual([])
    expect(hits(/(?<!E-)\bMails?\b|Mailversand|Werbe-Mail/)).toEqual([])
    expect(hits(/"|—|\.\.\./)).toEqual([])
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
