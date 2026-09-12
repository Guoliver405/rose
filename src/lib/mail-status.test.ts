import { describe, expect, it } from 'vitest'
import { createHmac } from 'node:crypto'
import {
  advance, detailFromEvent, domainPattern, isFinalMailStatus, isMailFailure, logIdFromEvent,
  mailStatusText, recipientDomain, recipientHash, statusFromEvent, verifyResendSignature,
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
    expect(statusFromEvent('email.suppressed')).toBe('suppressed')
    expect(isMailFailure('suppressed')).toBe(true)
    expect(isFinalMailStatus('suppressed')).toBe(true)
    expect(detailFromEvent({ type: 'email.suppressed', data: { suppressed: { message: 'on list', type: 'OnAccountSuppressionList' } } }))
      .toBe('on list')
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

describe('Adresse und Provider-Muster', () => {
  it('hasht unabhängig von Schreibweise und trennt die Domain ab', () => {
    expect(recipientHash('Anna@Freenet.de ')).toBe(recipientHash('anna@freenet.de'))
    expect(recipientHash('a@x.de')).not.toBe(recipientHash('b@x.de'))
    expect(recipientHash('a@x.de')).toHaveLength(32)
    expect(recipientDomain('Anna@Freenet.DE')).toBe('freenet.de')
    expect(recipientDomain('kaputt')).toBe('')
  })

  it('warnt erst bei zwei verschiedenen abgewiesenen Adressen ohne Zustellung', () => {
    const t = (n: number) => `2026-09-12T10:0${n}:00Z`
    // Eine Adresse, zweimal abgewiesen: Tippfehler, kein Muster.
    expect(domainPattern([
      { recipientHash: 'a', status: 'bounced', createdAt: t(1) },
      { recipientHash: 'a', status: 'bounced', createdAt: t(2) },
    ])).toBeNull()
    // Zwei Adressen abgewiesen, nichts zugestellt: Muster.
    expect(domainPattern([
      { recipientHash: 'a', status: 'bounced', createdAt: t(1) },
      { recipientHash: 'b', status: 'bounced', createdAt: t(2) },
    ])).toEqual({ bounced: 2, since: t(1) })
    // Danach eine Zustellung: Muster erloschen.
    expect(domainPattern([
      { recipientHash: 'a', status: 'bounced', createdAt: t(1) },
      { recipientHash: 'b', status: 'bounced', createdAt: t(2) },
      { recipientHash: 'c', status: 'delivered', createdAt: t(3) },
    ])).toBeNull()
    // Zustellung VOR den Bounces zählt nicht dagegen.
    expect(domainPattern([
      { recipientHash: 'c', status: 'delivered', createdAt: t(0) },
      { recipientHash: 'a', status: 'bounced', createdAt: t(1) },
      { recipientHash: 'b', status: 'bounced', createdAt: t(2) },
    ])).not.toBeNull()
    // Unterdrückte Sendungen sind Folge, nicht Ursache.
    expect(domainPattern([
      { recipientHash: 'a', status: 'bounced', createdAt: t(1) },
      { recipientHash: 'b', status: 'suppressed', createdAt: t(2) },
    ])).toBeNull()
  })
})
