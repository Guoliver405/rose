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
import { deleteScenario, listScenarios, renameScenario, saveScenario } from '@/utils/sim-scenarios'
import { DEFAULT_FORM } from '@/lib/sim-form'
import { policiesFromForm, roomsFromForm } from '@/lib/sim-convert'
import {
  convertSimAccount, deleteSimAccount, markSimConfirmed, registerSimAccount, resendSimConfirmation, type SimSenders,
} from '@/utils/sim-account'

let world: World
const PW = 'SimulatorTest!2026'

type Sent = { kind: 'confirm' | 'exists'; to: string; userId: string | null; url?: string; marketing?: boolean }
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
  let capturedFirst: string | null = null

  it('Registrierung legt einen unbestätigten Nutzer an und schickt den Bestätigungslink', async () => {
    const email = `${world.token}-sim@rose-itest.local`
    const { senders, sent } = capture()
    const res = await registerSimAccount({ email, password: PW, marketing: true }, ip(), senders, { purge: false })
    expect(res).toEqual({ sent: true })
    expect(sent).toHaveLength(1)
    expect(sent[0]).toMatchObject({ kind: 'confirm', to: email, marketing: true })
    world.createdUserIds.push(sent[0].userId!)
    sim = { id: sent[0].userId!, email, password: PW }

    const admin = serviceClient()
    const { data: row } = await admin.from('sim_accounts').select('*').eq('user_id', sim.id).single()
    expect(row.confirmed_at).toBeNull()
    expect(row.marketing_opt_in).toBe(true)
    // Die Einwilligung ist erst mit der Bestätigung wirksam.
    expect(row.marketing_opt_in_at).toBeNull()
    expect(linkParts(sent[0].url!).next).toBe('/simulator?willkommen=1')
    capturedFirst = sent[0].url!

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
    expect(hotel.sent).toEqual([expect.objectContaining({ kind: 'exists', to: world.alpha.reception.email })])
    const { data } = await serviceClient().from('sim_accounts').select('user_id').eq('user_id', world.alpha.reception.id)
    expect(data).toEqual([])

    // Der Nutzer von eben besteht weiter (die erste Fassung löschte ihn hier beim Zurückrollen).
    const { data: stillThere } = await serviceClient().auth.admin.getUserById(sim.id)
    expect(stillThere.user?.id).toBe(sim.id)

    // Der alte Link ist durch den neuen ungültig; eingelöst wird der neue.
    const old = linkParts(capturedFirst!)
    expect((await anonClient().auth.verifyOtp({ token_hash: old.tokenHash, type: old.type as 'signup' })).error).not.toBeNull()
    const { tokenHash, type } = linkParts(again.sent[0].url!)
    const { data: verified, error } = await anonClient().auth.verifyOtp({ token_hash: tokenHash, type: type as 'signup' })
    expect(error).toBeNull()
    expect(verified.user?.id).toBe(sim.id)
    await markSimConfirmed(sim.id)

    const { data: row } = await serviceClient().from('sim_accounts').select('confirmed_at, marketing_opt_in_at').eq('user_id', sim.id).single()
    expect(row!.confirmed_at).not.toBeNull()
    expect(row!.marketing_opt_in_at).toBe(row!.confirmed_at)

    // Das Passwort der zweiten Registrierung hat nichts geändert.
    expect((await anonClient().auth.signInWithPassword({ email: sim.email, password: 'anderes-Passwort' })).error).not.toBeNull()
  })

  it('erneut senden: unbekannte Adresse legt nichts an und verschickt nichts; bestätigte bekommt den Hinweis', async () => {
    const unknown = `${world.token}-unbekannt@rose-itest.local`
    const a = capture()
    expect(await resendSimConfirmation(unknown, ip(), a.senders)).toEqual({ sent: true })
    expect(a.sent).toEqual([])
    const { data: probe } = await serviceClient().auth.admin.generateLink({ type: 'signup', email: unknown, password: 'Probe!12345' })
    // generateLink legt ihn jetzt an — frisch, also gab es ihn vorher nicht. Wieder weg damit.
    expect(Date.parse(probe.user!.created_at)).toBeGreaterThan(Date.now() - 15_000)
    await serviceClient().auth.admin.deleteUser(probe.user!.id)

    const b = capture()
    expect(await resendSimConfirmation(sim.email, ip(), b.senders)).toEqual({ sent: true })
    expect(b.sent).toEqual([expect.objectContaining({ kind: 'exists', to: sim.email })])
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

  it('Szenarien: speichern, überschreiben, umbenennen, löschen — nur die eigenen', async () => {
    const created = await saveScenario(sim.id, '  Sommer,   6 Kräfte ', { ...DEFAULT_FORM, maids: 6 }) as { id: string }
    expect(created.id).toBeTruthy()
    let list = await listScenarios(sim.id)
    const mine = list.find(x => x.id === created.id)!
    expect(mine.name).toBe('Sommer, 6 Kräfte')
    expect(mine.form.maids).toBe(6)
    expect((await saveScenario(sim.id, 'Sommer', { ...DEFAULT_FORM, maids: 7 }, created.id)).id).toBe(created.id)
    expect(await renameScenario(sim.id, created.id, 'Hochsaison')).toEqual({})
    list = await listScenarios(sim.id)
    expect(list.find(x => x.id === created.id)).toMatchObject({ name: 'Hochsaison', form: { maids: 7 } })

    // Fremde Nutzer: weder überschreiben noch umbenennen noch löschen, und sie sehen es nicht.
    const other = world.alpha.owner.id
    expect((await saveScenario(other, 'x', DEFAULT_FORM, created.id)).error).toBeTruthy()
    expect((await renameScenario(other, created.id, 'x')).error).toBeTruthy()
    expect((await deleteScenario(other, created.id)).error).toBeTruthy()
    expect((await listScenarios(other)).some(x => x.id === created.id)).toBe(false)

    expect(await deleteScenario(sim.id, created.id)).toEqual({})
    expect((await listScenarios(sim.id)).some(x => x.id === created.id)).toBe(false)
    expect((await saveScenario(sim.id, '   ', DEFAULT_FORM)).error).toMatch(/Namen/)
  })

  it('Hotelzugang: Inhaber und Manager ja, Rezeption und Reinigung nicht; Anmeldung landet weiter im Haus', async () => {
    cookieState.store = await signedInStore(world.alpha.owner)
    expect(await getSimContext()).toMatchObject({ kind: 'hotel' })
    expect(await landingRoute()).toBe('/admin')
    cookieState.store = await signedInStore(world.alpha.manager)
    expect(await getSimContext()).toMatchObject({ kind: 'hotel' })
    cookieState.store = await signedInStore(world.alpha.reception)
    expect(await getSimContext()).toBeNull()
    cookieState.store = await signedInStore(world.alpha.maid)
    expect(await getSimContext()).toBeNull()
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

  it('Umwandlung: derselbe Nutzer wird Inhaber, Zimmer und Regeln kommen mit, nur einmal, nur bestätigt', async () => {
    const admin = serviceClient()
    const email = `${world.token}-umwandlung@rose-itest.local`
    const { data: created } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true })
    const userId = created.user!.id
    world.createdUserIds.push(userId)
    await admin.from('sim_accounts').insert({ user_id: userId })

    const form = { ...DEFAULT_FORM, floors: 2, roomsPerFloor: 3 }
    const input = {
      hotelName: `${world.token} Umwandlung`, displayName: 'Uma Wandel',
      rooms: roomsFromForm(form), policies: policiesFromForm(form, 'onDemand'),
    }
    // Unbestätigt: nicht erlaubt.
    expect((await convertSimAccount(userId, input)).error).toMatch(/bestätigte/)
    await admin.from('sim_accounts').update({ confirmed_at: new Date().toISOString() }).eq('user_id', userId)

    const res = await convertSimAccount(userId, input)
    expect(res.error).toBeUndefined()
    const { data: sim } = await admin.from('sim_accounts').select('converted_account_id').eq('user_id', userId).single()
    const accountId = sim!.converted_account_id as string
    expect(accountId).toBeTruthy()
    world.createdAccountIds.push(accountId)

    const { data: owner } = await admin.from('account_members').select('user_id, role').eq('account_id', accountId).single()
    expect(owner).toEqual({ user_id: userId, role: 'owner' })
    const { data: hotel } = await admin.from('hotels').select('id, slug, policies').eq('account_id', accountId).single()
    expect(hotel!.slug).toBe(res.slug)
    expect(hotel!.policies).toMatchObject({ stayoverAutoClean: false, checkoutUntil: '11:00', checkinFrom: '15:00' })
    expect(hotel!.policies).not.toHaveProperty('timeZone')
    const { data: rooms } = await admin.from('rooms').select('id, number').eq('hotel_id', hotel!.id).order('number')
    expect(rooms!.map(r => r.number)).toEqual(['101', '102', '103', '201', '202', '203'])
    const { count } = await admin.from('room_states').select('room_id', { count: 'exact', head: true }).eq('hotel_id', hotel!.id)
    expect(count).toBe(6)

    // Im Produkt jetzt Inhaber, im Simulator als Hotelzugang.
    cookieState.store = await signedInStore({ id: userId, email, password: PW })
    expect(await getAccountContext()).toMatchObject({ accountId })
    expect(await getSimContext()).toMatchObject({ kind: 'hotel' })
    expect(await getManagementContext(hotel!.slug)).toMatchObject({ role: 'admin', isOwner: true })

    // Nur einmal — und nie für einen Hotelzugang.
    expect((await convertSimAccount(userId, input)).error).toMatch(/bereits/)
    await admin.from('sim_accounts').insert({ user_id: world.alpha.manager.id, confirmed_at: new Date().toISOString() })
    expect((await convertSimAccount(world.alpha.manager.id, input)).error).toMatch(/bereits/)
    await admin.from('sim_accounts').delete().eq('user_id', world.alpha.manager.id)
  })
})

