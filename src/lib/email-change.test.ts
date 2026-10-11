import { describe, expect, it } from 'vitest'
import {
  checkNewEmail, EMAIL_CHANGE_TTL_HOURS, hashEmailChangeToken, isEmailChangeExpired,
  isWellFormedEmailChangeToken, maskEmail, newEmailChangeToken, normalizeEmail,
} from './email-change'
import { emailChangeConfirmMail, emailChangedNoticeMail } from './mail-templates'
import { admin } from './i18n/de/admin'

describe('Anmelde-Adresse ändern', () => {
  it('normalisiert die Adresse', () => {
    expect(normalizeEmail('  Anna.Muster@Example.COM ')).toBe('anna.muster@example.com')
  })

  it('weist Unsinn und die eigene Adresse ab — Groß-/Kleinschreibung zählt nicht', () => {
    expect(checkNewEmail('kein-at', 'a@b.de')).toEqual({ ok: false, reason: 'invalid' })
    expect(checkNewEmail('a@b', 'x@b.de')).toEqual({ ok: false, reason: 'invalid' })
    expect(checkNewEmail(' A@B.de ', 'a@b.de')).toEqual({ ok: false, reason: 'same' })
    expect(checkNewEmail('Neu@B.de', 'a@b.de')).toEqual({ ok: true, email: 'neu@b.de' })
  })

  it('erzeugt Schlüssel mit Hash und Ablauf — gespeichert wird nur der Hash', () => {
    const now = new Date('2026-10-11T10:00:00Z')
    const t = newEmailChangeToken(now)
    expect(isWellFormedEmailChangeToken(t.token)).toBe(true)
    expect(t.hash).toBe(hashEmailChangeToken(t.token))
    expect(t.hash).not.toContain(t.token)
    expect(Date.parse(t.expiresAt) - now.getTime()).toBe(EMAIL_CHANGE_TTL_HOURS * 3_600_000)
    expect(newEmailChangeToken(now).token).not.toBe(t.token)
  })

  it('läuft genau zur Ablaufzeit ab', () => {
    const exp = '2026-10-12T10:00:00.000Z'
    expect(isEmailChangeExpired(exp, new Date('2026-10-12T09:59:59Z'))).toBe(false)
    expect(isEmailChangeExpired(exp, new Date('2026-10-12T10:00:00Z'))).toBe(true)
  })

  it('schlägt fremd geformte Schlüssel gar nicht erst nach', () => {
    expect(isWellFormedEmailChangeToken(null)).toBe(false)
    expect(isWellFormedEmailChangeToken('abc')).toBe(false)
    expect(isWellFormedEmailChangeToken(`${'a'.repeat(42)}'`)).toBe(false)
  })

  it('blendet den Namen vor dem @ aus', () => {
    expect(maskEmail('anna.muster@example.com')).toBe('a••••••@example.com')
    expect(maskEmail('ab@x.de')).toBe('a••@x.de')
    expect(maskEmail('kaputt')).toBe('kaputt')
  })
})

describe('E-Mails zur Adressänderung', () => {
  const texts = admin.settings.myAccess.mails

  it('Bestätigung: Link in HTML und Reintext, Gültigkeit genannt', () => {
    const url = 'https://rose.test/auth/email-bestaetigen?token=x&y=1'
    const m = emailChangeConfirmMail({ url, hours: 24, texts })
    expect(m.html).toContain('token=x&amp;y=1')
    expect(m.text).toContain(url)
    expect(m.text).toContain('24 Stunden')
    expect(m.subject).toBe(texts.confirm.subject)
  })

  it('Hinweis an die alte Adresse: neue Adresse escaped, Impressum verlinkt', () => {
    const m = emailChangedNoticeMail({ newEmail: 'neu<x>@b.de', imprintUrl: 'https://rose.test/impressum', texts })
    expect(m.html).toContain('<strong>neu&lt;x&gt;@b.de</strong>')
    expect(m.html).not.toContain('<x>')
    expect(m.text).toContain('neu<x>@b.de')
    expect(m.text).toContain('https://rose.test/impressum')
    expect(m.text).not.toContain('<b>')
  })
})
