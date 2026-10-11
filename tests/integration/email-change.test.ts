import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { buildWorld, destroyWorld, serviceClient, type World } from './helpers/world'

/**
 * Anmelde-Adresse ändern (11.10.2026).
 *
 * Kern: Erst der Klick an der NEUEN Adresse stellt um, und nur mit dem
 * aktuellen Passwort lässt sich das anstoßen. Eine schon vergebene Adresse
 * verrät sich bei der Anfrage nicht, sondern scheitert erst bei der
 * Umstellung; Reinigungskräfte bleiben außen vor. Nach der Umstellung geht der
 * Hinweis an die ALTE Adresse, und der Stripe-Abgleich wird angestoßen.
 *
 * Mails und Stripe gehen hier nirgends hin: Der Ablauf nimmt beides als
 * Parameter (`EmailChangeEffects`), der Test fängt die Links ab.
 */
vi.mock('next/headers', () => ({
  cookies: async () => { throw new Error('nicht gebraucht') },
  headers: async () => new Headers(),
}))

import {
  cancelEmailChange, confirmEmailChange, peekEmailChange, pendingEmailChange, requestEmailChange,
  type EmailChangeEffects,
} from '@/utils/email-change'
import type { MailResult } from '@/utils/mail'

let world: World

type Captured = {
  confirms: { to: string; userId: string; url: string }[]
  notices: { to: string; userId: string; newEmail: string }[]
  stripe: { userId: string; email: string }[]
}

function capture(mail: MailResult = { logId: 'test' }): { fx: EmailChangeEffects; got: Captured } {
  const got: Captured = { confirms: [], notices: [], stripe: [] }
  return {
    got,
    fx: {
      confirm: async m => { got.confirms.push(m); return mail },
      notice: async m => { got.notices.push(m); return { logId: 'test' } },
      stripe: async (userId, email) => { got.stripe.push({ userId, email }) },
    },
  }
}

const tokenOf = (url: string) => new URL(url).searchParams.get('token')!

async function authEmail(userId: string): Promise<string | undefined> {
  const { data } = await serviceClient().auth.admin.getUserById(userId)
  return data.user?.email
}

beforeAll(async () => {
  world = await buildWorld()
}, 120_000)

afterAll(async () => {
  if (!world) return
  // Offene Änderungen hängen per Kaskade am Auth-Nutzer; ausdrücklich nur die eigenen.
  await serviceClient().from('email_change_requests').delete().in('user_id', world.createdUserIds)
  await destroyWorld(world)
}, 120_000)

describe('Anfrage', () => {
  it('verlangt das richtige aktuelle Passwort und legt sonst nichts an', async () => {
    const r = world.alpha.reception
    const { fx, got } = capture()
    const res = await requestEmailChange(
      { userId: r.id, currentEmail: r.email, password: 'falsch-falsch', newEmail: `${world.token}-x@rose-itest.local` }, fx,
    )
    expect(res).toEqual({ kind: 'error', reason: 'currentWrong' })
    expect(got.confirms).toEqual([])
    expect(await pendingEmailChange(r.id)).toBeNull()
  })

  it('weist die eigene Adresse ab, auch anders geschrieben', async () => {
    const r = world.alpha.reception
    const res = await requestEmailChange(
      { userId: r.id, currentEmail: r.email, password: r.password, newEmail: ` ${r.email.toUpperCase()} ` }, capture().fx,
    )
    expect(res).toEqual({ kind: 'error', reason: 'same' })
  })

  it('lässt Reinigungskräfte nicht zu — ihre Anmeldung hängt an der gebauten Adresse', async () => {
    const m = world.alpha.maid
    const res = await requestEmailChange(
      { userId: m.id, currentEmail: m.email, password: m.password, newEmail: `${world.token}-maid@rose-itest.local` }, capture().fx,
    )
    expect(res).toEqual({ kind: 'error', reason: 'notAllowed' })
  })

  it('legt nichts ab, wenn die Mail nicht übergeben wurde (Drossel)', async () => {
    const o = world.alpha.owner
    const { fx } = capture({ wait: 30, error: 'Gerade erst verschickt' })
    const res = await requestEmailChange(
      { userId: o.id, currentEmail: o.email, password: o.password, newEmail: `${world.token}-gedrosselt@rose-itest.local` }, fx,
    )
    expect(res.kind).toBe('sent')
    expect(res.kind === 'sent' && res.expiresAt).toBeNull()
    expect(await pendingEmailChange(o.id)).toBeNull()
  })
})

describe('Umstellung', () => {
  it('stellt erst mit dem Klick um, die jüngste Anfrage gilt, die alte Adresse bekommt den Hinweis', async () => {
    const r = world.alpha.reception
    const alt = r.email
    const zuerst = `${world.token}-zuerst@rose-itest.local`
    const neu = `${world.token}-Neu-Rezeption@rose-itest.local`
    const { fx, got } = capture()

    await requestEmailChange({ userId: r.id, currentEmail: alt, password: r.password, newEmail: zuerst }, fx)
    const res = await requestEmailChange({ userId: r.id, currentEmail: alt, password: r.password, newEmail: neu }, fx)
    expect(res.kind).toBe('sent')
    expect(got.confirms.map(c => c.to)).toEqual([zuerst, neu.toLowerCase()])

    // Noch nichts umgestellt — die Anmeldung läuft weiter über die alte Adresse.
    expect(await authEmail(r.id)).toBe(alt)
    expect(await pendingEmailChange(r.id)).toMatchObject({ email: neu.toLowerCase() })

    // Der erste Link ist durch den zweiten ersetzt.
    const alterLink = tokenOf(got.confirms[0].url)
    expect(await peekEmailChange(alterLink)).toBeNull()
    expect(await confirmEmailChange(alterLink, fx)).toEqual({ kind: 'invalid' })

    const link = tokenOf(got.confirms[1].url)
    expect(await peekEmailChange(link)).toEqual({ email: neu.toLowerCase() })
    expect(await confirmEmailChange(link, fx)).toEqual({ kind: 'ok', email: neu.toLowerCase() })

    expect(await authEmail(r.id)).toBe(neu.toLowerCase())
    expect(got.notices).toEqual([{ to: alt, userId: r.id, newEmail: neu.toLowerCase() }])
    expect(got.stripe).toEqual([{ userId: r.id, email: neu.toLowerCase() }])
    expect(await pendingEmailChange(r.id)).toBeNull()

    // Einmal benutzt ist verbraucht.
    expect(await confirmEmailChange(link, fx)).toEqual({ kind: 'invalid' })
    r.email = neu.toLowerCase()
  })

  it('verrät eine vergebene Adresse nicht bei der Anfrage — die Umstellung scheitert erst beim Klick', async () => {
    const mgr = world.alpha.manager
    const fremd = world.beta.owner.email
    const { fx, got } = capture()

    const res = await requestEmailChange({ userId: mgr.id, currentEmail: mgr.email, password: mgr.password, newEmail: fremd }, fx)
    expect(res.kind).toBe('sent')
    expect(got.confirms).toHaveLength(1)

    expect(await confirmEmailChange(tokenOf(got.confirms[0].url), fx)).toEqual({ kind: 'taken' })
    expect(await authEmail(mgr.id)).toBe(mgr.email)
    expect(await authEmail(world.beta.owner.id)).toBe(fremd)
    expect(got.notices).toEqual([])
    expect(await pendingEmailChange(mgr.id)).toBeNull()
  })

  it('abgelaufene und abgebrochene Links gelten nicht', async () => {
    const o = world.alpha.owner
    const { fx, got } = capture()
    await requestEmailChange({ userId: o.id, currentEmail: o.email, password: o.password, newEmail: `${world.token}-spaet@rose-itest.local` }, fx)
    const link = tokenOf(got.confirms[0].url)

    await serviceClient().from('email_change_requests')
      .update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq('user_id', o.id)
    expect(await peekEmailChange(link)).toBeNull()
    expect(await confirmEmailChange(link, fx)).toEqual({ kind: 'invalid' })

    await requestEmailChange({ userId: o.id, currentEmail: o.email, password: o.password, newEmail: `${world.token}-abbruch@rose-itest.local` }, fx)
    const zweiter = tokenOf(got.confirms[1].url)
    expect(await peekEmailChange(zweiter)).not.toBeNull()
    await cancelEmailChange(o.id)
    expect(await confirmEmailChange(zweiter, fx)).toEqual({ kind: 'invalid' })
    expect(await authEmail(o.id)).toBe(o.email)
  })
})
