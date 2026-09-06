import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildWorld, destroyWorld, serviceClient, type World } from './helpers/world'
import { runMonthlyInvoicing, type GatewayInvoice, type InvoiceGateway } from '@/utils/invoicing'
import { MIN_MONTHLY_CENTS } from '@/lib/pricing'
import { periodKey } from '@/lib/rooms'
import { previousMonthPeriod } from '@/lib/invoice'

/**
 * Monatslauf gegen die Testwelt — ohne Stripe.
 *
 * Das `InvoiceGateway` ist ein Fake, der zählt, was er „erzeugt". Geprüft
 * wird die Mechanik um Stripe herum: Snapshot vor der Rechnung, Betrag aus
 * `billingLine`, Spiegel-Zeile als Riegel gegen Doppelläufe, fehlende
 * Rechnungsdaten als `draft` mit Grund, Abgleich offener Rechnungen.
 *
 * Der Lauf wird über `accountIds` auf die Welt-Konten begrenzt — nichts
 * anderes darf angefasst werden (siehe helpers/world.ts).
 */

let world: World
const admin = () => serviceClient()

/** Registrierung, Häuser und Zimmer in die Vergangenheit legen, damit der Vormonat abrechenbar ist (Snapshots entstehen nur für abgeschlossene Monate seit Anlage des Hauses). */
async function zurueckdatieren(accountId: string, hotelIds: string[]) {
  const vorDreiMonaten = new Date(); vorDreiMonaten.setMonth(vorDreiMonaten.getMonth() - 3)
  await admin().from('accounts').update({ created_at: vorDreiMonaten.toISOString() }).eq('id', accountId)
  await admin().from('hotels').update({ created_at: vorDreiMonaten.toISOString() }).in('id', hotelIds)
  await admin().from('rooms').update({ created_at: vorDreiMonaten.toISOString() }).in('hotel_id', hotelIds)
}

function fakeGateway() {
  const created: Array<{ input: Parameters<InvoiceGateway['createInvoice']>[0]; inv: GatewayInvoice }> = []
  let paidAll = false
  const gw: InvoiceGateway & { created: typeof created; markPaid: () => void } = {
    created,
    markPaid: () => { paidAll = true },
    async createInvoice(input) {
      const inv: GatewayInvoice = {
        id: `in_fake_${created.length + 1}_${input.accountId.slice(0, 8)}`,
        status: 'open', number: `FAKE-${created.length + 1}`,
        totalCents: Math.round(input.amountCents * 1.19), taxCents: Math.round(input.amountCents * 0.19),
        hostedInvoiceUrl: 'https://example.invalid/hosted', invoicePdf: 'https://example.invalid/pdf',
        dueAt: '2099-01-01', paidAt: null,
      }
      created.push({ input, inv })
      return inv
    },
    async retrieveInvoice(id) {
      const hit = created.find(c => c.inv.id === id)
      if (!hit) throw new Error('unbekannte Rechnung')
      return paidAll ? { ...hit.inv, status: 'paid', paidAt: new Date().toISOString() } : hit.inv
    },
  }
  return gw
}

beforeAll(async () => {
  world = await buildWorld()
  await zurueckdatieren(world.alpha.accountId, [world.alpha.a1.id, world.alpha.a2.id])
  await zurueckdatieren(world.beta.accountId, [world.beta.b1.id])
  // Alpha hat Stripe-Kunde und Rechnungsdaten; Beta nur einen Kunden, keine Daten.
  await admin().from('accounts').update({
    stripe_customer_id: `cus_${world.token}_alpha`,
    billing_name: 'Alpha GmbH',
    billing_address: { line1: 'Weg 1', line2: null, postal_code: '10115', city: 'Berlin', country: 'DE' },
    payment_method_kind: 'card', stripe_payment_method: 'pm_fake', payment_method_label: 'Visa •••• 4242',
  }).eq('id', world.alpha.accountId)
  await admin().from('accounts').update({ stripe_customer_id: `cus_${world.token}_beta` }).eq('id', world.beta.accountId)
}, 60_000)

afterAll(async () => {
  if (!world) return
  // Spiegel-Zeilen tragen keinen Fremdschlüssel — von Hand weg, wie die Snapshots in destroyWorld.
  await admin().from('invoices').delete().in('account_id', [world.alpha.accountId, world.beta.accountId])
  await admin().from('billing_snapshots').delete().in('account_id', [world.alpha.accountId, world.beta.accountId])
  await destroyWorld(world)
})

describe('Monatslauf', () => {
  const ids = () => [world.alpha.accountId, world.beta.accountId]

  it('schreibt den Snapshot, rechnet den Betrag und erzeugt je Konto genau eine Rechnung', async () => {
    const gw = fakeGateway()
    const summary = await runMonthlyInvoicing({ accountIds: ids(), gateway: gw })
    const period = previousMonthPeriod(new Date())

    expect(summary.created).toBe(1)   // Alpha
    expect(summary.failed).toBe(1)    // Beta: Rechnungsdaten fehlen
    expect(gw.created).toHaveLength(1)

    const alpha = gw.created[0].input
    expect(alpha.customerId).toBe(`cus_${world.token}_alpha`)
    expect(alpha.amountCents).toBe(MIN_MONTHLY_CENTS)      // 3 Zimmer < 10 ⇒ Mindestbetrag
    expect(alpha.collection).toBe('charge')                 // Karte hinterlegt
    expect(alpha.idempotencyKey).toBe(`invoice-${world.alpha.accountId}-${periodKey(period)}`)
    expect(alpha.description).toContain('3 Zimmer')

    const { data: snaps } = await admin().from('billing_snapshots')
      .select('hotel_id, rooms').eq('account_id', world.alpha.accountId).eq('period_start', periodKey(period))
    expect((snaps ?? []).reduce((s, r) => s + r.rooms, 0)).toBe(3)

    const { data: rows } = await admin().from('invoices')
      .select('account_id, status, stripe_invoice_id, net_cents, rooms, number, last_error')
      .in('account_id', ids())
    const a = rows?.find(r => r.account_id === world.alpha.accountId)
    const b = rows?.find(r => r.account_id === world.beta.accountId)
    expect(a).toMatchObject({ status: 'open', stripe_invoice_id: gw.created[0].inv.id, net_cents: MIN_MONTHLY_CENTS, rooms: 3, number: 'FAKE-1', last_error: null })
    expect(b).toMatchObject({ status: 'draft', stripe_invoice_id: null, rooms: 1 })
    expect(b?.last_error).toMatch(/Rechnungsdaten fehlen/)
  })

  it('erzeugt beim zweiten Lauf nichts Neues und holt Beta nach, sobald die Daten da sind', async () => {
    const gw = fakeGateway()
    const erneut = await runMonthlyInvoicing({ accountIds: ids(), gateway: gw })
    expect(erneut.created).toBe(0)
    expect(erneut.skipped).toBe(1)   // Alpha hat schon eine Stripe-ID
    expect(erneut.failed).toBe(1)    // Beta weiterhin ohne Daten
    expect(gw.created).toHaveLength(0)

    await admin().from('accounts').update({
      billing_name: 'Beta KG',
      billing_address: { line1: 'Gasse 2', line2: null, postal_code: '80331', city: 'München', country: 'DE' },
    }).eq('id', world.beta.accountId)

    const dritter = await runMonthlyInvoicing({ accountIds: ids(), gateway: gw })
    expect(dritter.created).toBe(1)
    expect(gw.created[0].input.collection).toBe('bank_transfer')   // kein Zahlungsweg ⇒ Rechnung mit Bankverbindung
    const { data: b } = await admin().from('invoices')
      .select('status, stripe_invoice_id, last_error').eq('account_id', world.beta.accountId).maybeSingle()
    expect(b).toMatchObject({ status: 'open', stripe_invoice_id: gw.created[0].inv.id, last_error: null })
  })

  it('zieht offene Rechnungen im Abgleich nach', async () => {
    const gw = fakeGateway()
    // Die Spiegel-Zeilen zeigen auf IDs früherer Fakes — der Abgleich fragt das Gateway danach.
    const { data: rows } = await admin().from('invoices').select('stripe_invoice_id, account_id').in('account_id', ids())
    for (const r of rows ?? []) {
      gw.created.push({
        input: { accountId: r.account_id } as never,
        inv: { id: r.stripe_invoice_id, status: 'open', number: null, totalCents: null, taxCents: null, hostedInvoiceUrl: null, invoicePdf: null, dueAt: null, paidAt: null },
      })
    }
    gw.markPaid()
    const summary = await runMonthlyInvoicing({ accountIds: ids(), gateway: gw })
    expect(summary.reconciled).toBe(2)
    const { data: after } = await admin().from('invoices').select('status, paid_at').in('account_id', ids())
    expect(after?.every(r => r.status === 'paid' && r.paid_at)).toBe(true)
  })
})
