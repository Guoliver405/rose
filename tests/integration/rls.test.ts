import { beforeAll, describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { anonClient, buildWorld, clientAs, serviceClient, type World } from './helpers/world'

/**
 * Mandanten- und Rollengrenzen **an der Quelle** — direkt gegen die
 * Row-Level-Security, nicht über die Anwendung.
 *
 * Alle 14 Policies laufen über `is_hotel_member` / `is_hotel_management`.
 * Hier wird geprüft, was diese beiden Funktionen tatsächlich freigeben.
 */
let world: World

/** Wie viele Zimmer sieht dieser Client im angegebenen Haus? */
async function sichtbareZimmer(client: SupabaseClient, hotelId: string): Promise<number> {
  const { data } = await client.from('rooms').select('id').eq('hotel_id', hotelId)
  return (data ?? []).length
}

beforeAll(async () => {
  world = await buildWorld()
}, 120_000)

describe('Unangemeldet', () => {
  it('sieht keine Zimmer', async () => {
    expect(await sichtbareZimmer(anonClient(), world.alpha.a1.id)).toBe(0)
  })

  it('sieht keine Aufenthalte', async () => {
    const { data } = await anonClient().from('stays').select('id')
    expect(data ?? []).toHaveLength(0)
  })
})

describe('Kontoinhaber', () => {
  it('sieht ALLE Häuser seines Kontos', async () => {
    const client = await clientAs(world.alpha.owner)
    expect(await sichtbareZimmer(client, world.alpha.a1.id)).toBe(2)
    expect(await sichtbareZimmer(client, world.alpha.a2.id)).toBe(1)
  })

  it('sieht KEIN Haus eines fremden Kontos', async () => {
    const client = await clientAs(world.alpha.owner)
    expect(await sichtbareZimmer(client, world.beta.b1.id)).toBe(0)
  })

  it('gilt auch umgekehrt — Beta sieht Alpha nicht', async () => {
    const client = await clientAs(world.beta.owner)
    expect(await sichtbareZimmer(client, world.beta.b1.id)).toBe(1)
    expect(await sichtbareZimmer(client, world.alpha.a1.id)).toBe(0)
    expect(await sichtbareZimmer(client, world.alpha.a2.id)).toBe(0)
  })
})

describe('Manager', () => {
  it('sieht nur die ihm zugeordneten Häuser — auch im EIGENEN Konto nicht mehr', async () => {
    // Der Kern der Rolle: Teilmenge der Häuser, nicht das ganze Konto.
    const client = await clientAs(world.alpha.manager)
    expect(await sichtbareZimmer(client, world.alpha.a2.id)).toBe(1)
    expect(await sichtbareZimmer(client, world.alpha.a1.id)).toBe(0)
  })

  it('sieht kein fremdes Konto', async () => {
    const client = await clientAs(world.alpha.manager)
    expect(await sichtbareZimmer(client, world.beta.b1.id)).toBe(0)
  })
})

describe('Rezeption', () => {
  it('sieht nur das eigene Haus', async () => {
    const client = await clientAs(world.alpha.reception)
    expect(await sichtbareZimmer(client, world.alpha.a1.id)).toBe(2)
    expect(await sichtbareZimmer(client, world.alpha.a2.id)).toBe(0)
  })

  it('darf die Aufenthalte des eigenen Hauses lesen', async () => {
    const admin = serviceClient()
    await admin.from('stays').insert({
      hotel_id: world.alpha.a1.id,
      room_id: world.alpha.a1.rooms['101'],
      pin: '123456',
      session_token: 'token-rezeption-test',
    })
    const client = await clientAs(world.alpha.reception)
    const { data } = await client.from('stays').select('id').eq('hotel_id', world.alpha.a1.id)
    expect((data ?? []).length).toBeGreaterThan(0)
  })
})

describe('Reinigungskraft', () => {
  it('sieht die Zimmer ihres Hauses', async () => {
    const client = await clientAs(world.alpha.maid)
    expect(await sichtbareZimmer(client, world.alpha.a1.id)).toBe(2)
  })

  it('sieht weder das Nachbarhaus noch ein fremdes Konto', async () => {
    const client = await clientAs(world.alpha.maid)
    expect(await sichtbareZimmer(client, world.alpha.a2.id)).toBe(0)
    expect(await sichtbareZimmer(client, world.beta.b1.id)).toBe(0)
  })

  it('kommt NICHT an die Aufenthalte — die sind Management-Sache', async () => {
    // stays_select_mgmt: Gast-PINs gehören nicht aufs Reinigungsboard.
    const client = await clientAs(world.alpha.maid)
    const { data } = await client.from('stays').select('id')
    expect(data ?? []).toHaveLength(0)
  })

  it('gleicher Benutzername in zwei Häusern bleibt sauber getrennt', async () => {
    // @maria gibt es in A1 und B1 — Benutzernamen sind nur je Hotel eindeutig.
    expect(world.alpha.maid.username).toBe(world.beta.maid.username)
    expect(world.alpha.maid.id).not.toBe(world.beta.maid.id)

    const beta = await clientAs(world.beta.maid)
    expect(await sichtbareZimmer(beta, world.beta.b1.id)).toBe(1)
    expect(await sichtbareZimmer(beta, world.alpha.a1.id)).toBe(0)
  })
})

describe('Rechte-Entzug', () => {
  it('wirkt sofort — die profiles-Zeile hält keine Hintertür offen', async () => {
    // Genau diese Lücke wäre entstanden, wenn der profiles-Zweig in
    // is_hotel_member nicht auf Reinigungskräfte (username is not null)
    // eingeschränkt wäre: profiles.hotel_id des Managers zeigt weiterhin auf
    // sein Stammhaus A2.
    const vorher = await clientAs(world.alpha.manager)
    expect(await sichtbareZimmer(vorher, world.alpha.a2.id)).toBe(1)

    await serviceClient()
      .from('hotel_members')
      .delete()
      .eq('hotel_id', world.alpha.a2.id)
      .eq('user_id', world.alpha.manager.id)

    const nachher = await clientAs(world.alpha.manager)
    expect(await sichtbareZimmer(nachher, world.alpha.a2.id)).toBe(0)

    // Zustand für nachfolgende Läufe wiederherstellen.
    await serviceClient().from('hotel_members').insert({
      hotel_id: world.alpha.a2.id,
      user_id: world.alpha.manager.id,
      role: 'manager',
      display_name: 'Alpha Manager',
    })
  })
})
