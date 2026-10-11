import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { buildWorld, destroyWorld, serviceClient, type World } from './helpers/world'
import { settleAccountBeforeDeletion, type GatewayInvoice, type InvoiceGateway } from '@/utils/invoicing'
import { deleteAccountData } from '@/utils/deletion'
import { MIN_MONTHLY_CENTS } from '@/lib/pricing'
import { monthPeriod, periodKey } from '@/lib/rooms'
import { previousMonthPeriod } from '@/lib/invoice'

/**
 * Schlussrechnung beim Löschen des Kontos — § 7 Abs. 2 AGB: Die Vergütung des
 * Monats, in dem das Konto gelöscht wird, bleibt geschuldet. Vorher fand der
 * Monatslauf am Ersten kein Konto mehr, der angebrochene Monat blieb offen.
 *
 * Geprüft wird ohne Stripe (Fake hinter `InvoiceGateway`, `deleteStripeCustomer`
 * nur mitgeschrieben): Freimonat ⇒ nichts; fehlende Rechnungsdaten ⇒ nicht
 * gelöscht, und der laufende Monat hinterlässt keine Spiegel-Zeile; Vormonat
 * und laufender Monat werden berechnet; bei offener Rechnung bleibt der
 * Stripe-Kunde stehen, bei bezahlter geht er mit.
 */

const stripeMock = vi.hoisted(() => ({ deleted: [] as string[] }))
vi.mock('@/utils/stripe', async importOriginal => ({
  ...(await importOriginal<typeof import('@/utils/stripe')>()),
  deleteStripeCustomer: async (id: string) => { stripeMock.deleted.push(id) },
}))

let world: World
const admin = () => serviceClient()

async function zurueckdatieren(accountId: string, hotelIds: string[]) {
  const vorDreiMonaten = new Date(); vorDreiMonaten.setMonth(vorDreiMonaten.getMonth() - 3)
  await admin().from('accounts').update({ created_at: vorDreiMonaten.toISOString() }).eq('id', accountId)
  await admin().from('hotels').update({ created_at: vorDreiMonaten.toISOString() }).in('id', hotelIds)
  await admin().from('rooms').update({ created_at: vorDreiMonaten.toISOString() }).in('hotel_id', hotelIds)
}

/** Karte ⇒ sofort bezahlt, sonst offen — wie Stripe nach `invoices.pay`. */
function fakeGateway() {
  const created: Parameters<InvoiceGateway['createInvoice']>[0][] = []
  const gw: InvoiceGateway & { created: typeof created } = {
    created,
    async createInvoice(input) {
      created.push(input)
      const paid = input.collection === 'charge'
      const inv: GatewayInvoice = {
        id: `in_fake_final_${created.length}_${input.accountId.slice(0, 8)}`,
        status: paid ? 'paid' : 'open', number: `FINAL-${created.length}`,
        totalCents: Math.round(input.amountCents * 1.19), taxCents: Math.round(input.amountCents * 0.19),
        hostedInvoiceUrl: `https://example.invalid/${input.idempotencyKey}`, invoicePdf: null, dueAt: null,
        paidAt: paid ? new Date().toISOString() : null,
      }
      return inv
    },
    async retrieveInvoice() { throw new Error('nicht gebraucht') },
  }
  return gw
}

const adresse = { line1: 'Weg 1', line2: null, postal_code: '10115', city: 'Berlin', country: 'DE' }

beforeAll(async () => {
  world = await buildWorld()
  await zurueckdatieren(world.alpha.accountId, [world.alpha.a1.id, world.alpha.a2.id])
  await admin().from('accounts').update({
    stripe_customer_id: `cus_${world.token}_alpha`,
    billing_name: 'Alpha GmbH', billing_address: adresse,
    payment_method_kind: 'card', stripe_payment_method: 'pm_fake', payment_method_label: 'Visa •••• 4242',
  }).eq('id', world.alpha.accountId)
  // Beta bleibt zunächst im Registrierungsmonat (frei) und ohne Rechnungsdaten.
  await admin().from('accounts').update({ stripe_customer_id: `cus_${world.token}_beta` }).eq('id', world.beta.accountId)
}, 60_000)

afterAll(async () => {
  if (!world) return
  const ids = [world.alpha.accountId, world.beta.accountId]
  await admin().from('invoices').delete().in('account_id', ids)
  await admin().from('billing_snapshots').delete().in('account_id', ids)
  await destroyWorld(world)
})

async function zeilen(accountId: string) {
  const { data } = await admin().from('invoices')
    .select('period_start, status, rooms, net_cents, stripe_invoice_id').eq('account_id', accountId)
  return data ?? []
}

async function kontoDa(accountId: string) {
  const { data } = await admin().from('accounts').select('id').eq('id', accountId).maybeSingle()
  return Boolean(data)
}

describe('Schlussrechnung beim Löschen des Kontos', () => {
  it('berechnet im Freimonat nichts', async () => {
    const gw = fakeGateway()
    const res = await settleAccountBeforeDeletion(world.beta.accountId, { gateway: gw })
    expect(res).toEqual({ openInvoices: false })
    expect(gw.created).toHaveLength(0)
    expect(await zeilen(world.beta.accountId)).toHaveLength(0)
  })

  it('löscht nicht, wenn die Rechnung nicht entstehen kann — und hinterlässt für den laufenden Monat nichts', async () => {
    await zurueckdatieren(world.beta.accountId, [world.beta.b1.id])
    const gw = fakeGateway()
    const res = await deleteAccountData(world.beta.accountId, { gateway: gw })
    expect(res.finalInvoiceError).toMatch(/Rechnungsdaten fehlen/)
    expect(gw.created).toHaveLength(0)
    expect(await kontoDa(world.beta.accountId)).toBe(true)
    // Der Vormonat bleibt als `draft` mit Grund stehen wie im Monatslauf; der
    // laufende Monat ist noch veränderlich und bekommt keine Zeile.
    const rows = await zeilen(world.beta.accountId)
    expect(rows.map(r => String(r.period_start).slice(0, 10))).toEqual([periodKey(previousMonthPeriod(new Date()))])
    expect(rows[0].status).toBe('draft')
  }, 60_000)

  it('stellt Vormonat und laufenden Monat in Rechnung und lässt den Stripe-Kunden bei offener Rechnung stehen', async () => {
    await admin().from('accounts').update({ billing_name: 'Beta KG', billing_address: adresse }).eq('id', world.beta.accountId)
    const gw = fakeGateway()
    stripeMock.deleted.length = 0

    const res = await deleteAccountData(world.beta.accountId, { gateway: gw })
    expect(res.error).toBeUndefined()
    expect(await kontoDa(world.beta.accountId)).toBe(false)
    // Nach dem Löschen gibt es keine Konto-Seite mehr — der Dialog zeigt die Zahlungsseiten.
    expect(res.openInvoiceUrls).toHaveLength(2)

    const now = new Date()
    expect(gw.created.map(c => periodKey(c.period))).toEqual([
      periodKey(previousMonthPeriod(now)), periodKey(monthPeriod(now)),
    ])
    for (const c of gw.created) {
      expect(c.amountCents).toBe(MIN_MONTHLY_CENTS)   // 1 Zimmer ⇒ Mindestbetrag
      expect(c.collection).toBe('bank_transfer')       // kein Zahlungsweg ⇒ Zahlungslink
    }
    // Belege überleben das Konto (kein Fremdschlüssel).
    const rows = await zeilen(world.beta.accountId)
    expect(rows).toHaveLength(2)
    expect(rows.every(r => r.status === 'open' && r.stripe_invoice_id && r.rooms === 1)).toBe(true)
    expect(stripeMock.deleted).toEqual([])
  }, 60_000)

  it('entfernt den Stripe-Kunden, wenn die Schlussrechnung sofort bezahlt ist', async () => {
    const gw = fakeGateway()
    stripeMock.deleted.length = 0

    const res = await deleteAccountData(world.alpha.accountId, { gateway: gw })
    expect(res).toEqual({})
    expect(await kontoDa(world.alpha.accountId)).toBe(false)
    expect(gw.created).toHaveLength(2)
    expect(gw.created[1]).toMatchObject({ collection: 'charge', amountCents: MIN_MONTHLY_CENTS })
    expect(gw.created[1].description).toContain('3 Zimmer')
    expect(stripeMock.deleted).toEqual([`cus_${world.token}_alpha`])
  }, 60_000)
})
