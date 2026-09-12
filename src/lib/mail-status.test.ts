import { describe, expect, it } from 'vitest'
import { createHmac } from 'node:crypto'
import {
  advance, detailFromEvent, isFinalMailStatus, isMailFailure, logIdFromEvent,
  mailStatusText, statusFromEvent, verifyResendSignature,
} from './mail-status'
import { inviteMail, recoveryMail } from './mail-templates'

describe('Statusfolge', () => {
  it('geht nur nach vorn — ein verspätetes „sent" überschreibt kein „delivered"', () => {
    expect(advance('queued', 'sent')).toBe(true)
    expect(advance('sent', 'delivered')).toBe(true)
    expect(advance('delivered', 'sent')).toBe(false)
    expect(advance('delivered', 'delivered')).toBe(false)
    expect(advance('delayed', 'delivered')).toBe(true)
    expect(advance('delivered', 'bounced')).toBe(true)
  })

  it('kennt End- und Fehlzustände', () => {
    expect(isFinalMailStatus('sent')).toBe(false)
    expect(isFinalMailStatus('delayed')).toBe(false)
    expect(isFinalMailStatus('delivered')).toBe(true)
    expect(isFinalMailStatus('bounced')).toBe(true)
    expect(isMailFailure('delivered')).toBe(false)
    expect(isMailFailure('bounced')).toBe(true)
    expect(isMailFailure('failed')).toBe(true)
  })

  it('bildet Resend-Ereignisse ab und ignoriert Öffnen/Klicken', () => {
    expect(statusFromEvent('email.delivered')).toBe('delivered')
    expect(statusFromEvent('email.delivery_delayed')).toBe('delayed')
    expect(statusFromEvent('email.bounced')).toBe('bounced')
    expect(statusFromEvent('email.opened')).toBeNull()
    expect(statusFromEvent('irgendwas')).toBeNull()
  })

  it('liest Protokoll-ID und Grund aus beiden Tag-Gestalten', () => {
    expect(logIdFromEvent({ type: 'x', data: { tags: { log: 'abc' } } })).toBe('abc')
    expect(logIdFromEvent({ type: 'x', data: { tags: [{ name: 'log', value: 'def' }] } })).toBe('def')
    expect(logIdFromEvent({ type: 'x', data: {} })).toBeNull()

    expect(detailFromEvent({
      type: 'email.bounced',
      data: { bounce: { message: 'mailbox unavailable', type: 'Permanent', subType: 'General' } },
    })).toBe('mailbox unavailable (Permanent/General)')
    expect(detailFromEvent({ type: 'email.failed', data: { failed: { reason: 'domain not verified' } } }))
      .toBe('domain not verified')
    expect(detailFromEvent({ type: 'email.delivered', data: {} })).toBeNull()
  })

  it('formuliert den Grund mit, wenn es einen gibt', () => {
    expect(mailStatusText('bounced', 'user unknown')).toContain('user unknown')
    expect(mailStatusText('bounced', null)).toMatch(/abgewiesen/)
    expect(mailStatusText('delivered', null)).toBe('Zugestellt.')
  })
})

describe('Webhook-Signatur', () => {
  const secretRaw = Buffer.from('geheim-geheim-geheim-geheim-1234')
  const secret = `whsec_${secretRaw.toString('base64')}`
  const body = '{"type":"email.delivered"}'
  const id = 'msg_1'
  const ts = '1700000000'
  const sig = createHmac('sha256', secretRaw).update(`${id}.${ts}.${body}`).digest('base64')

  it('nimmt eine korrekte Signatur an, auch unter mehreren', () => {
    expect(verifyResendSignature({ secret, id, timestamp: ts, signature: `v1,${sig}`, body, nowSeconds: 1700000010 })).toBe(true)
    expect(verifyResendSignature({ secret, id, timestamp: ts, signature: `v1,falsch v1,${sig}`, body, nowSeconds: 1700000010 })).toBe(true)
  })

  it('weist falsche Signatur, fremden Body und alten Zeitstempel ab', () => {
    expect(verifyResendSignature({ secret, id, timestamp: ts, signature: 'v1,QUJD', body, nowSeconds: 1700000010 })).toBe(false)
    expect(verifyResendSignature({ secret, id, timestamp: ts, signature: `v1,${sig}`, body: body + ' ', nowSeconds: 1700000010 })).toBe(false)
    expect(verifyResendSignature({ secret, id, timestamp: ts, signature: `v1,${sig}`, body, nowSeconds: 1700000000 + 3600 })).toBe(false)
    expect(verifyResendSignature({ secret, id: null, timestamp: ts, signature: `v1,${sig}`, body })).toBe(false)
  })
})

describe('Vorlagen', () => {
  it('Einladung nennt Haus, Rolle, Anrede und den Link in HTML und Text', () => {
    const m = inviteMail({ hotelName: 'Hotel <Sonne> & Mond', displayName: 'Anna', rolle: 'Rezeption', url: 'https://x.test/auth/confirm?token_hash=a&b=c' })
    expect(m.subject).toContain('Hotel <Sonne> & Mond')
    expect(m.html).toContain('Hotel &lt;Sonne&gt; &amp; Mond')
    expect(m.html).not.toContain('<Sonne>')
    expect(m.html).toContain('token_hash=a&amp;b=c')
    expect(m.text).toContain('https://x.test/auth/confirm?token_hash=a&b=c')
    expect(m.text).toContain('Guten Tag Anna')
    expect(m.text).toContain('als Rezeption')
  })

  it('Passwort-Link unterscheidet Einladung und Zurücksetzen', () => {
    expect(recoveryMail({ url: 'https://x.test/l' }).subject).toBe('Neues Passwort für RoSe')
    expect(recoveryMail({ url: 'https://x.test/l', einladung: true }).text).toContain('zu vergeben')
    expect(recoveryMail({ url: 'https://x.test/l' }).text).toContain('https://x.test/l')
  })
})
