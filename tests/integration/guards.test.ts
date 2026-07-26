import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { buildWorld, destroyWorld, type World } from './helpers/world'
import { signedInStore, type FakeCookieStore } from './helpers/cookies'

/**
 * Die Guards der Anwendung — `getManagementContext(slug)` und Verwandte.
 *
 * Die RLS-Tests prüfen, was die Datenbank freigibt; hier geht es darum, was
 * die App daraus macht: Welche Rolle bekommt wer in welchem Haus, und wo
 * bekommt er gar nichts. Beides zusammen ist die Mandantengrenze.
 *
 * `next/headers` wird ersetzt, weil die Guards die Session aus den Cookies
 * lesen. Der Speicher enthält eine ECHTE Supabase-Session (siehe
 * helpers/cookies.ts) — kein nachgebautes Token.
 */
const cookieState = vi.hoisted(() => ({ store: null as FakeCookieStore | null }))

vi.mock('next/headers', () => ({
  cookies: async () => {
    if (!cookieState.store) throw new Error('Kein Cookie-Speicher gesetzt — alsUser() vergessen?')
    return cookieState.store
  },
}))

// Statischer Import — `vi.mock` wird darüber gehoben und greift trotzdem.
import {
  getAccountContext, getAdminContext, getManagementContext, listAccessibleHotels,
} from '@/utils/auth'

let world: World

/** Ab hier laufen die Guards im Namen dieses Nutzers. */
async function alsUser(user: { id: string; email: string; password: string }): Promise<void> {
  cookieState.store = await signedInStore(user)
}

/** Leerer Speicher = niemand angemeldet. */
function abgemeldet(): void {
  cookieState.store = {
    map: new Map<string, string>(),
    get: () => undefined,
    getAll: () => [],
    set: () => {},
    delete: () => {},
  }
}

beforeAll(async () => {
  world = await buildWorld()
}, 120_000)

// Die Testwelt lebt neben den echten Daten — sie muss wieder verschwinden.
afterAll(async () => {
  if (world) await destroyWorld(world)
}, 120_000)

describe('getManagementContext — Kontoinhaber', () => {
  it('bekommt in jedem Haus seines Kontos die Admin-Rolle', async () => {
    await alsUser(world.alpha.owner)

    const a1 = await getManagementContext(world.alpha.a1.slug)
    expect(a1).toMatchObject({ role: 'admin', isOwner: true, hotelId: world.alpha.a1.id })

    const a2 = await getManagementContext(world.alpha.a2.slug)
    expect(a2).toMatchObject({ role: 'admin', isOwner: true, hotelId: world.alpha.a2.id })
  })

  it('bekommt im Haus eines FREMDEN Kontos nichts', async () => {
    await alsUser(world.alpha.owner)
    expect(await getManagementContext(world.beta.b1.slug)).toBeNull()
  })
})

describe('getManagementContext — Manager', () => {
  it('bekommt in seinem Haus die Manager-Rolle', async () => {
    await alsUser(world.alpha.manager)
    expect(await getManagementContext(world.alpha.a2.slug)).toMatchObject({
      role: 'manager', isOwner: false, hotelId: world.alpha.a2.id,
    })
  })

  it('bekommt im Nachbarhaus DESSELBEN Kontos nichts', async () => {
    await alsUser(world.alpha.manager)
    expect(await getManagementContext(world.alpha.a1.slug)).toBeNull()
  })

  it('darf verwalten — getAdminContext lässt ihn durch', async () => {
    await alsUser(world.alpha.manager)
    expect(await getAdminContext(world.alpha.a2.slug)).not.toBeNull()
  })
})

describe('getManagementContext — Rezeption', () => {
  it('bekommt im eigenen Haus die Rezeptions-Rolle', async () => {
    await alsUser(world.alpha.reception)
    expect(await getManagementContext(world.alpha.a1.slug)).toMatchObject({
      role: 'reception', isOwner: false,
    })
  })

  it('darf NICHT verwalten — getAdminContext weist ab', async () => {
    await alsUser(world.alpha.reception)
    expect(await getAdminContext(world.alpha.a1.slug)).toBeNull()
  })

  it('kommt nicht ins Nachbarhaus', async () => {
    await alsUser(world.alpha.reception)
    expect(await getManagementContext(world.alpha.a2.slug)).toBeNull()
  })
})

describe('getManagementContext — Ränder', () => {
  it('gibt bei unbekanntem Slug nichts zurück', async () => {
    await alsUser(world.alpha.owner)
    expect(await getManagementContext('gibt-es-nicht')).toBeNull()
  })

  it('gibt ohne Anmeldung nichts zurück', async () => {
    abgemeldet()
    expect(await getManagementContext(world.alpha.a1.slug)).toBeNull()
  })

  it('lässt eine Reinigungskraft nicht ins Management-Portal', async () => {
    // Reinigungskräfte stehen weder in account_members noch in hotel_members.
    await alsUser(world.alpha.maid)
    expect(await getManagementContext(world.alpha.a1.slug)).toBeNull()
  })
})

describe('listAccessibleHotels', () => {
  it('listet dem Inhaber alle Häuser seines Kontos', async () => {
    await alsUser(world.alpha.owner)
    const hotels = await listAccessibleHotels()
    expect(hotels.map(h => h.slug).sort()).toEqual(
      [world.alpha.a1.slug, world.alpha.a2.slug].sort(),
    )
    expect(hotels.every(h => h.role === 'admin')).toBe(true)
  })

  it('listet dem Manager nur seine Teilmenge', async () => {
    await alsUser(world.alpha.manager)
    const hotels = await listAccessibleHotels()
    expect(hotels).toHaveLength(1)
    expect(hotels[0]).toMatchObject({ slug: world.alpha.a2.slug, role: 'manager' })
  })

  it('listet der Rezeption ihr eines Haus', async () => {
    await alsUser(world.alpha.reception)
    const hotels = await listAccessibleHotels()
    expect(hotels).toHaveLength(1)
    expect(hotels[0]).toMatchObject({ slug: world.alpha.a1.slug, role: 'reception' })
  })

  it('ist ohne Anmeldung leer', async () => {
    abgemeldet()
    expect(await listAccessibleHotels()).toEqual([])
  })
})

describe('getAccountContext — der Riegel vor /konto', () => {
  it('lässt den Inhaber durch', async () => {
    await alsUser(world.alpha.owner)
    expect(await getAccountContext()).toMatchObject({ accountId: world.alpha.accountId })
  })

  it('weist den Manager ab', async () => {
    await alsUser(world.alpha.manager)
    expect(await getAccountContext()).toBeNull()
  })

  it('weist die Rezeption ab', async () => {
    await alsUser(world.alpha.reception)
    expect(await getAccountContext()).toBeNull()
  })
})
