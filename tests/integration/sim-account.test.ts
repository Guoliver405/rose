import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { anonClient, buildWorld, clientAs, destroyWorld, serviceClient, type World } from './helpers/world'
import { signedInStore, type FakeCookieStore } from './helpers/cookies'

/**
 * Konto des Housekeeping-Simulators (Phase 2, 26.09.2026).
 *
 * Kern: Ein Simulator-Konto bekommt **nirgends im Hotelprodukt Rechte** —
 * weder in den Guards noch über RLS —, und seine Szenarien sieht niemand
 * außer ihm. Dazu der Ablauf selbst: Registrierung legt einen UNbestätigten
 * Nutzer an, erst der Link aus der Mail schaltet frei; eine schon bekannte
 * Adresse bekommt keinen zweiten Zugang, sondern einen Hinweis; die Drossel
 * greift je IP.
 *
 * Mails gehen hier nirgends hin: `registerSimAccount` nimmt den Versand als
 * Parameter, der Test fängt die Links ab. Das Aufräumen verfallener Konten
 * ist abgeschaltet (`purge: false`), weil es auf die ganze Datenbank wirkt.
 */
const cookieState = vi.hoisted(() => ({ store: null as FakeCookieStore | null }))
vi.mock('next/headers', () => ({
  cookies: async () => {
    if (!cookieState.store) throw new Error('Kein Cookie-Speicher gesetzt')
    return cookieState.store
  },
}))

import {
  getAccountContext, getAdminContext, getManagementContext, getSimContext, landingRoute, listAccessibleHotels,
} from '@/utils/auth'
import {
  deleteSimAccount, markSimConfirmed, registerSimAccount, type SimSenders,
} from '@/utils/sim-account'

let world: World
const PW = 'SimulatorTest!2026'

type Sent = { kind: 'confirm' | 'exists'; to: string; userId: string; url?: string; marketing?: boolean }
function capture(): { senders: SimSenders; sent: Sent[] } {
  const sent: Sent[] = []
  return {
    sent,
    senders: {
      confirm: async m => { sent.push({ kind: 'confirm', ...m }); return { logId: 'test' } },
      exists: async m => { sent.push({ kind: 'exists', ...m }); return { logId: 'test' } },
    },
  }
}

const ip = () => `itest-ip-${Math.random().toString(16).slice(2)}`

/** Token-Hash und Typ aus einem Bestätigungslink. */
function linkParts(url: string): { tokenHash: string; type: string; next: string } {
  const u = new URL(url)
  return { tokenHash: u.searchParams.get('token_hash')!, type: u.searchParams.get('type')!, next: u.searchParams.get('next')! }
}

beforeAll(async () => {
  world = await buildWorld()
}, 120_000)

afterAll(async () => {
  await serviceClient().from('signup_attempts').delete().like('ip_hash', 'itest-ip-%')
  if (world) await destroyWorld(world)
}, 120_000)

describe('Simulator-Konto', () => {
  let sim: { id: string; email: string; password: string }

  it('Registrierung legt einen unbestätigten Nutzer an und schickt den Bestätigungslink', async () => {
    const email = `${world.token}-sim@rose-itest.local`
    const { senders, sent } = capture()
    const res = await registerSimAccount({ email, password: PW, marketing: true }, ip(), senders, { purge: false })
    expect(res).toEqual({ sent: true })
    expect(sent).toHaveLength(1)
    expect(sent[0]).toMatchObject({ kind: 'confirm', to: email, marketing: true })
    world.createdUserIds.push(sent[0].userId)
    sim = { id: sent[0].userId, email, password: PW }

    const admin = serviceClient()
    const { data: row } = await admin.from('sim_accounts').select('*').eq('user_id', sim.id).single()
    expect(row.confirmed_at).toBeNull()
    expect(row.marketing_opt_in).toBe(true)
    // Die Einwilligung ist erst mit der Bestätigung wirksam.
    expect(row.marketing_opt_in_at).toBeNull()
    expect(linkParts(sent[0].url!).next).toBe('/simulator?willkommen=1')

    // Vor der Bestätigung keine Anmeldung.
    const { error } = await anonClient().auth.signInWithPassword({ email, password: PW })
    expect(error).not.toBeNull()
  })

  it('eine schon bekannte Adresse: kein zweiter Zugang — unbestätigt neuer Link, sonst Hinweis', async () => {
    const again = capture()
    expect(await registerSimAccount({ email: sim.email, password: 'anderes-Passwort', marketing: false }, ip(), again.senders, { purge: false }))
      .toEqual({ sent: true })
    expect(again.sent).toEqual([expect.objectContaining({ kind: 'confirm', userId: sim.id, marketing: true })])

    const hotel = capture()
    expect(await registerSimAccount({ email: world.alpha.reception.email, password: PW, marketing: false }, ip(), hotel.senders, { purge: false }))
      .toEqual({ sent: true })
    expect(hotel.sent).toEqual([expect.objectContaining({ kind: 'exists', userId: world.alpha.reception.id })])
    const { data } = await serviceClient().from('sim_accounts').select('user_id').eq('user_id', world.alpha.reception.id)
    expect(data).toEqual([])

    // Eingelöst wird der zuletzt verschickte Link (Magic-Link bestätigt die Adresse ebenso).
    const { tokenHash, type } = linkParts(again.sent[0].url!)
    const { data: verified, error } = await anonClient().auth.verifyOtp({ token_hash: tokenHash, type: type as 'magiclink' })
    expect(error).toBeNull()
    expect(verified.user?.id).toBe(sim.id)
    await markSimConfirmed(sim.id)

    const { data: row } = await serviceClient().from('sim_accounts').select('confirmed_at, marketing_opt_in_at').eq('user_id', sim.id).single()
    expect(row!.confirmed_at).not.toBeNull()
    expect(row!.marketing_opt_in_at).toBe(row!.confirmed_at)
  })

  it('bestätigt: Anmeldung geht, Simulator ja — im Hotelprodukt nirgends Rechte', async () => {
    cookieState.store = await signedInStore(sim)
    expect(await getSimContext()).toMatchObject({ userId: sim.id, kind: 'sim' })
    expect(await landingRoute()).toBe('/simulator')
    expect(await listAccessibleHotels()).toEqual([])
    expect(await getAccountContext()).toBeNull()
    for (const slug of [world.alpha.a1.slug, world.alpha.a2.slug, world.beta.b1.slug]) {
      expect(await getManagementContext(slug)).toBeNull()
      expect(await getAdminContext(slug)).toBeNull()
    }
  })

  it('RLS: Hotel-Tabellen leer, Szenarien nur die eigenen', async () => {
    const own = await clientAs(sim)
    for (const table of ['hotels', 'rooms', 'stays', 'profiles', 'accounts']) {
      const { data } = await own.from(table).select('id').limit(5)
      expect(data ?? [], table).toEqual([])
    }
    const { data: mine, error } = await own.from('sim_scenarios').insert({ user_id: sim.id, name: 'Test', config: { floors: 3 } }).select('id').single()
    expect(error).toBeNull()
    // Für jemand anderen anlegen geht nicht.
    const { error: foreign } = await own.from('sim_scenarios').insert({ user_id: world.alpha.owner.id, name: 'x', config: {} })
    expect(foreign).not.toBeNull()

    const other = await clientAs(world.alpha.owner)
    const { data: seen } = await other.from('sim_scenarios').select('id').eq('id', mine!.id)
    expect(seen).toEqual([])
    const { data: acc } = await other.from('sim_accounts').select('user_id').eq('user_id', sim.id)
    expect(acc).toEqual([])
    const { data: ownAcc } = await own.from('sim_accounts').select('user_id')
    expect(ownAcc).toEqual([{ user_id: sim.id }])
  })

  it('Hotelzugang: Simulator ja, Anmeldung landet weiter im Haus', async () => {
    cookieState.store = await signedInStore(world.alpha.owner)
    expect(await getSimContext()).toMatchObject({ kind: 'hotel' })
    expect(await landingRoute()).toBe('/admin')
  })

  it('Drossel: ab dem sechsten Versuch je IP und Stunde abgewiesen', async () => {
    const hash = ip()
    const { senders } = capture()
    for (let i = 0; i < 5; i++) {
      const r = await registerSimAccount({ email: sim.email, password: PW, marketing: false }, hash, senders, { purge: false })
      expect(r).toEqual({ sent: true })
    }
    const r6 = await registerSimAccount({ email: sim.email, password: PW, marketing: false }, hash, senders, { purge: false })
    expect(r6.error).toMatch(/zu viele/)
    // Eine andere IP kommt durch.
    expect(await registerSimAccount({ email: sim.email, password: PW, marketing: false }, ip(), senders, { purge: false })).toEqual({ sent: true })
  })

  it('Löschen: Simulator-Konto ganz weg (samt Szenarien); beim Hotelzugang bleibt die Anmeldung', async () => {
    const admin = serviceClient()
    expect(await deleteSimAccount(sim.id)).toEqual({})
    const { data: user } = await admin.auth.admin.getUserById(sim.id)
    expect(user.user).toBeNull()
    const { data: scen } = await admin.from('sim_scenarios').select('id').eq('user_id', sim.id)
    expect(scen).toEqual([])

    await admin.from('sim_accounts').insert({ user_id: world.alpha.manager.id, confirmed_at: new Date().toISOString() })
    expect(await deleteSimAccount(world.alpha.manager.id)).toEqual({ keptLogin: true })
    const { data: still } = await admin.auth.admin.getUserById(world.alpha.manager.id)
    expect(still.user?.id).toBe(world.alpha.manager.id)
    const { data: gone } = await admin.from('sim_accounts').select('user_id').eq('user_id', world.alpha.manager.id)
    expect(gone).toEqual([])
  })
})
