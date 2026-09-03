import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildWorld, destroyWorld, serviceClient, type World } from './helpers/world'
import { deleteAccountData, previewAccountDeletion } from '@/utils/deletion'

/**
 * Löschbegehren — „entfernt alle meine Daten".
 *
 * Der Test besteht auf dem, was die Kaskade **nicht** erledigt: Das Projekt
 * hält `room_state_transitions` und `billing_snapshots` bewusst frei von
 * Fremdschlüsseln, damit Nachweise Löschungen überleben, und `profiles` hängt
 * am Auth-Konto statt umgekehrt. Wer nur `accounts` löscht, hinterlässt also
 * Verlauf, Abrechnungsbelege und — das Wesentliche — die Anmeldekonten samt
 * E-Mail-Adressen.
 *
 * Geprüft wird deshalb beides: dass wirklich nichts übrig bleibt, und dass das
 * Nachbarkonto dabei unberührt bleibt.
 */

let world: World

beforeAll(async () => { world = await buildWorld() }, 60_000)
afterAll(async () => { if (world) await destroyWorld(world) })

const admin = () => serviceClient()

async function zaehle(table: string, spalte: string, wert: string): Promise<number> {
  const { count } = await admin()
    .from(table).select('*', { count: 'exact', head: true }).eq(spalte, wert)
  return count ?? 0
}

async function authUserExistiert(userId: string): Promise<boolean> {
  const { data } = await admin().auth.admin.getUserById(userId)
  return Boolean(data?.user)
}

describe('Löschbegehren — ganzes Konto', () => {
  it('räumt auch das ab, woran keine Kaskade hängt', async () => {
    const beta = world.beta

    // Spuren erzeugen, die von selbst NICHT verschwinden würden.
    await admin().from('room_state_transitions').insert({
      room_id: beta.b1.rooms['101'],
      hotel_id: beta.b1.id,
      field: 'priority',
      old_value: 'false',
      new_value: 'true',
      source: 'admin',
    })
    await admin().from('billing_snapshots').insert({
      hotel_id: beta.b1.id,
      account_id: beta.accountId,
      period_start: '2026-08-01',
      rooms: 1,
    })

    expect(await zaehle('room_state_transitions', 'hotel_id', beta.b1.id)).toBe(1)
    expect(await zaehle('billing_snapshots', 'hotel_id', beta.b1.id)).toBe(1)

    // Die Vorschau muss die Anmeldekonten benennen — sie sind der Kern eines
    // Löschbegehrens, alles andere sind Betriebsdaten.
    const preview = await previewAccountDeletion(beta.accountId)
    expect(preview.hotels).toHaveLength(1)
    expect(preview.transitions).toBe(1)
    expect(preview.snapshots).toBe(1)
    expect(preview.authUsers).toBeGreaterThanOrEqual(2) // Inhaber + Reinigungskraft
    expect(preview.authUsersKept).toBe(0)

    const res = await deleteAccountData(beta.accountId)
    expect(res.error).toBeUndefined()

    // 1) Betriebsdaten — über die Kaskade
    expect(await zaehle('hotels', 'id', beta.b1.id)).toBe(0)
    expect(await zaehle('rooms', 'hotel_id', beta.b1.id)).toBe(0)
    expect(await zaehle('accounts', 'id', beta.accountId)).toBe(0)
    expect(await zaehle('account_members', 'account_id', beta.accountId)).toBe(0)

    // 2) Ohne Fremdschlüssel — nur weil die Routine sie ausdrücklich abräumt
    expect(await zaehle('room_state_transitions', 'hotel_id', beta.b1.id)).toBe(0)
    expect(await zaehle('billing_snapshots', 'hotel_id', beta.b1.id)).toBe(0)

    // 3) Die Anmeldekonten selbst — das Wesentliche
    expect(await authUserExistiert(beta.owner.id)).toBe(false)
    expect(await authUserExistiert(beta.maid.id)).toBe(false)
  }, 60_000)

  it('lässt das Nachbarkonto vollständig unberührt', async () => {
    const alpha = world.alpha
    expect(await zaehle('hotels', 'id', alpha.a1.id)).toBe(1)
    expect(await zaehle('hotels', 'id', alpha.a2.id)).toBe(1)
    expect(await zaehle('accounts', 'id', alpha.accountId)).toBe(1)
    expect(await authUserExistiert(alpha.owner.id)).toBe(true)
    expect(await authUserExistiert(alpha.maid.id)).toBe(true)
    expect(await authUserExistiert(alpha.manager.id)).toBe(true)
  })
})
