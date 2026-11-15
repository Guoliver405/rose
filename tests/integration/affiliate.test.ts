import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { buildWorld, clientAs, destroyWorld, serviceClient, type World } from './helpers/world'

/**
 * Partnerprogramm, erster Bauabschnitt (15.11.2026, Bauplan
 * Sessions/Affiliate-Plan-2026-11-15.md).
 *
 * Geprüft wird, was im Betrieb still falsch sein könnte:
 *   – Zugang: Einladungscode ODER Code eines FREIGESCHALTETEN Partners; ein
 *     nicht freigeschalteter Code ordnet zu, öffnet aber nichts.
 *   – Zuordnung: nur beim Anlegen des Kontos, nie auf den eigenen Code.
 *   – Provisionsbuch: bezahlte Rechnung ⇒ genau EINE Buchung, auch beim
 *     zweiten Lauf; Erstattung ⇒ negative Buchung, nie mehr als die Provision.
 *   – Der Partner steht an der Rechnung: auch ohne Konto (Schlussrechnung
 *     nach dem Löschen) entsteht die Provision.
 *   – Grenzen: Ein Partner sieht nur seine eigenen Buchungen (RLS).
 *
 * Ohne Stripe: Fake hinter `InvoiceGateway`, `stripeReady` abgeschaltet (sonst
 * legte `createHotelAccount` einen echten Kunden in der Sandbox an).
 */
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, getAll: () => [], set: () => {}, delete: () => {} }),
  headers: async () => new Headers(),
}))
vi.mock('@/utils/stripe', async importOriginal => ({
  ...(await importOriginal<typeof import('@/utils/stripe')>()),
  stripeReady: () => false,
}))

import {
  becomePartner, checkSignupAccess, getPartnerOverview, recordCommissionForInvoice, recordReversal,
} from '@/utils/affiliate'
import { createHotelAccount } from '@/utils/hotel-account'
import { convertSimAccount } from '@/utils/sim-account'
import { runMonthlyInvoicing, type GatewayInvoice, type InvoiceGateway } from '@/utils/invoicing'
import { HOLD_DAYS, isPartnerCode } from '@/lib/affiliate'
import { MIN_MONTHLY_CENTS } from '@/lib/pricing'

let world: World
const admin = () => serviceClient()
const INVITE = 'itest-einladung'
const envBefore = { invite: process.env.SIGNUP_INVITE_CODE, flag: process.env.AFFILIATE_ENABLED }

/** Partner 1 = Inhaber von Beta (wirbt Alpha), Partner 2 = Rezeption von Alpha (gehört zu Alpha). */
let p1: { id: string; code: string }
let p2: { id: string; code: string }
/** Konto-IDs, deren Rechnungen und Buchungen dieser Test von Hand abräumt (kein Fremdschlüssel). */
const ledgerAccounts: string[] = []

async function partnerOf(userId: string) {
  const { data } = await admin().from('affiliates').select('id, code').eq('user_id', userId).single()
  return data as { id: string; code: string }
}

async function newUser(label: string) {
  const email = `${world.token}-${label}@rose.local`
  const { data, error } = await admin().auth.admin.createUser({ email, password: `Partner!${world.runId}`, email_confirm: true })
  if (error || !data.user) throw new Error(`createUser(${email}): ${error?.message}`)
  world.createdUserIds.push(data.user.id)
  return data.user.id
}

function fakeGateway() {
  const created: GatewayInvoice[] = []
  let paid = false
  const gw: InvoiceGateway & { created: GatewayInvoice[]; markPaid: () => void } = {
    created,
    markPaid: () => { paid = true },
    async createInvoice(input) {
      const inv: GatewayInvoice = {
        id: `in_${world.token}_${created.length + 1}`, status: 'open', number: `PARTNER-${created.length + 1}`,
        totalCents: Math.round(input.amountCents * 1.19), taxCents: Math.round(input.amountCents * 0.19),
        hostedInvoiceUrl: null, invoicePdf: null, dueAt: '2099-01-01', paidAt: null,
      }
      created.push(inv)
      return inv
    },
    async retrieveInvoice(id) {
      const hit = created.find(c => c.id === id)
      if (!hit) throw new Error('unbekannte Rechnung')
      return paid ? { ...hit, status: 'paid', paidAt: new Date().toISOString() } : hit
    },
  }
  return gw
}

const commissions = async (affiliateId: string) =>
  (await admin().from('affiliate_commissions').select('*').eq('affiliate_id', affiliateId).order('created_at')).data ?? []

beforeAll(async () => {
  process.env.SIGNUP_INVITE_CODE = INVITE
  process.env.AFFILIATE_ENABLED = '1'
  world = await buildWorld()
  ledgerAccounts.push(world.alpha.accountId)

  expect(await becomePartner(world.beta.owner.id)).toEqual({})
  expect(await becomePartner(world.alpha.reception.id)).toEqual({})
  p1 = await partnerOf(world.beta.owner.id)
  p2 = await partnerOf(world.alpha.reception.id)

  // Alpha abrechenbar machen (wie invoicing.test.ts) und Partner 1 zuordnen.
  const vorDreiMonaten = new Date(); vorDreiMonaten.setMonth(vorDreiMonaten.getMonth() - 3)
  const hotelIds = [world.alpha.a1.id, world.alpha.a2.id]
  await admin().from('accounts').update({
    created_at: vorDreiMonaten.toISOString(),
    referred_by: p1.id, referred_at: new Date().toISOString(),
    stripe_customer_id: `cus_${world.token}_alpha`,
    billing_name: 'Alpha GmbH',
    billing_address: { line1: 'Weg 1', line2: null, postal_code: '10115', city: 'Berlin', country: 'DE' },
  }).eq('id', world.alpha.accountId)
  await admin().from('hotels').update({ created_at: vorDreiMonaten.toISOString() }).in('id', hotelIds)
  await admin().from('rooms').update({ created_at: vorDreiMonaten.toISOString() }).in('hotel_id', hotelIds)
}, 120_000)

afterAll(async () => {
  process.env.SIGNUP_INVITE_CODE = envBefore.invite
  process.env.AFFILIATE_ENABLED = envBefore.flag
  if (!world) return
  // Buch, Rechnungen und Snapshots tragen keinen Fremdschlüssel — von Hand weg, nur über eigene IDs.
  await admin().from('affiliate_commissions').delete().in('account_id', ledgerAccounts)
  await admin().from('invoices').delete().in('account_id', ledgerAccounts)
  await admin().from('billing_snapshots').delete().in('account_id', ledgerAccounts)
  await destroyWorld(world)
}, 120_000)

describe('Partner werden', () => {
  it('legt einen Eintrag mit Code und Fassung der Bedingungen an, nicht freigeschaltet', async () => {
    const { data } = await admin().from('affiliates')
      .select('code, rate_bps, terms_version, approved_at').eq('id', p1.id).single()
    expect(isPartnerCode(data!.code)).toBe(true)
    expect(data).toMatchObject({ rate_bps: 2000, terms_version: '2026-11', approved_at: null })
  })

  it('ist beim zweiten Mal kein Fehler und legt nichts doppelt an', async () => {
    expect(await becomePartner(world.beta.owner.id)).toEqual({})
    const { data } = await admin().from('affiliates').select('id').eq('user_id', world.beta.owner.id)
    expect(data).toHaveLength(1)
  })
})

describe('Zugang zur Registrierung', () => {
  it('weist einen unbekannten Code ab', async () => {
    const res = await checkSignupAccess({ inviteCode: INVITE, partnerCode: 'ZZZZZZZZ' })
    expect(res.error).toMatch(/Empfehlungscode kennen wir nicht/)
  })

  it('verlangt ohne jeden Code einen von beiden', async () => {
    const res = await checkSignupAccess({ inviteCode: '', partnerCode: '' })
    expect(res.error).toMatch(/Einladungscode oder einen Empfehlungscode/)
  })

  it('öffnet mit dem Code eines NICHT freigeschalteten Partners nicht, ordnet mit Einladungscode aber zu', async () => {
    const ohne = await checkSignupAccess({ inviteCode: '', partnerCode: p1.code })
    expect(ohne.error).toMatch(/öffnet die Registrierung aber noch nicht/)
    const mit = await checkSignupAccess({ inviteCode: INVITE, partnerCode: p1.code.toLowerCase() })
    expect(mit).toEqual({ affiliateId: p1.id })
  })

  it('öffnet mit dem Code eines freigeschalteten Partners ohne Einladungscode', async () => {
    await admin().from('affiliates').update({ approved_at: new Date().toISOString() }).eq('id', p1.id)
    expect(await checkSignupAccess({ inviteCode: '', partnerCode: p1.code })).toEqual({ affiliateId: p1.id })
  })

  it('ordnet den eigenen Code nicht zu', async () => {
    const res = await checkSignupAccess({ inviteCode: '', partnerCode: p1.code, actingUserId: world.beta.owner.id })
    expect(res).toEqual({ affiliateId: null })
  })

  it('bleibt für alle zu, wenn die Registrierung geschlossen ist', async () => {
    process.env.SIGNUP_INVITE_CODE = ''
    try {
      const res = await checkSignupAccess({ inviteCode: '', partnerCode: p1.code })
      expect(res.error).toMatch(/nicht freigeschaltet/)
    } finally { process.env.SIGNUP_INVITE_CODE = INVITE }
  })

  it('kennt ohne den Schalter nur den Einladungscode', async () => {
    process.env.AFFILIATE_ENABLED = ''
    try {
      expect((await checkSignupAccess({ inviteCode: '', partnerCode: p1.code })).error).toBeTruthy()
      expect(await checkSignupAccess({ inviteCode: INVITE, partnerCode: p1.code })).toEqual({ affiliateId: null })
    } finally { process.env.AFFILIATE_ENABLED = '1' }
  })
})

describe('Zuordnung', () => {
  it('schreibt den Partner beim Anlegen ans Konto', async () => {
    const userId = await newUser('geworben')
    const res = await createHotelAccount({
      userId, hotelName: `${world.token} Geworben`, displayName: 'Geworben', referredBy: p1.id,
    })
    expect(res.error).toBeUndefined()
    world.createdAccountIds.push(res.accountId!)
    const { data } = await admin().from('accounts').select('referred_by, referred_at').eq('id', res.accountId!).single()
    expect(data?.referred_by).toBe(p1.id)
    expect(data?.referred_at).toBeTruthy()
  })

  it('lässt ein Konto ohne Empfehlung unzugeordnet', async () => {
    const userId = await newUser('frei')
    const res = await createHotelAccount({ userId, hotelName: `${world.token} Frei`, displayName: 'Frei' })
    world.createdAccountIds.push(res.accountId!)
    const { data } = await admin().from('accounts').select('referred_by, referred_at').eq('id', res.accountId!).single()
    expect(data).toEqual({ referred_by: null, referred_at: null })
  })

  it('trägt den Partner bei der Umwandlung aus dem Simulator mit', async () => {
    const userId = await newUser('simulator')
    await admin().from('sim_accounts').insert({ user_id: userId, confirmed_at: new Date().toISOString(), referred_by: p1.id })
    const res = await convertSimAccount(userId, { hotelName: `${world.token} Umgewandelt`, displayName: 'Sim', referredBy: p1.id })
    expect(res.error).toBeUndefined()
    const { data: sim } = await admin().from('sim_accounts').select('converted_account_id').eq('user_id', userId).single()
    world.createdAccountIds.push(sim!.converted_account_id as string)
    const { data } = await admin().from('accounts').select('referred_by').eq('id', sim!.converted_account_id as string).single()
    expect(data?.referred_by).toBe(p1.id)
  })
})

describe('Provisionsbuch', () => {
  const gw = fakeGateway()
  const run = () => runMonthlyInvoicing({ accountIds: [world.alpha.accountId], gateway: gw })

  it('friert den Partner an der Rechnung ein und bucht erst nach der Zahlung', async () => {
    const summary = await run()
    expect(summary.created).toBe(1)
    const { data: inv } = await admin().from('invoices')
      .select('affiliate_id, status, net_cents').eq('account_id', world.alpha.accountId).single()
    expect(inv).toMatchObject({ affiliate_id: p1.id, status: 'open', net_cents: MIN_MONTHLY_CENTS })
    expect(await commissions(p1.id)).toHaveLength(0)
  })

  it('bucht für die bezahlte Rechnung genau eine Provision — auch beim zweiten Lauf', async () => {
    gw.markPaid()
    await run()
    await run()
    const rows = await commissions(p1.id)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      kind: 'commission', account_id: world.alpha.accountId,
      base_cents: MIN_MONTHLY_CENTS, rate_bps: 2000, amount_cents: 100,   // 5 € Mindestbetrag ⇒ 1 €
      source: `${gw.created[0].id}:paid`,
    })
    const tage = (new Date(rows[0].available_at).getTime() - Date.now()) / 86_400_000
    expect(tage).toBeGreaterThan(HOLD_DAYS - 1)
    expect(tage).toBeLessThan(HOLD_DAYS + 1)
  })

  it('zeigt dem Partner Zahlen ohne Namen', async () => {
    const o = await getPartnerOverview(p1.id)
    expect(o.accounts).toBe(3)            // Alpha, „Geworben“, „Umgewandelt“
    expect(o.accountsPaying).toBe(1)
    expect(o.rooms?.count).toBe(3)        // Alpha: 3 Zimmer im abgerechneten Monat
    expect(o.summary).toMatchObject({ pendingCents: 100, availableCents: 0, reversedCents: 0 })
    expect(JSON.stringify(o)).not.toContain(world.token)
  })

  it('nimmt bei einer Teilerstattung den Anteil zurück, einmal je Meldung', async () => {
    const refund = { kind: 'refund' as const, stripeInvoiceId: gw.created[0].id, chargeId: `ch_${world.token}`, paidCents: 595 }
    expect(await recordReversal({ ...refund, refundedCents: 200 })).toBe('recorded')
    expect(await recordReversal({ ...refund, refundedCents: 200 })).toBe('skipped')
    const rows = await commissions(p1.id)
    expect(rows.filter(r => r.kind === 'reversal').map(r => r.amount_cents)).toEqual([-34])   // 100 × 200/595
  })

  it('nimmt bei voller Erstattung den Rest zurück und nie mehr als die Provision', async () => {
    const refund = { kind: 'refund' as const, stripeInvoiceId: gw.created[0].id, chargeId: `ch_${world.token}`, paidCents: 595 }
    expect(await recordReversal({ ...refund, refundedCents: 595 })).toBe('recorded')
    expect(await recordReversal({
      kind: 'dispute_withdrawn', stripeInvoiceId: gw.created[0].id, disputeId: `dp_${world.token}`, paidCents: 595, disputedCents: 595,
    })).toBe('skipped')
    const rows = await commissions(p1.id)
    expect(rows.reduce((s, r) => s + r.amount_cents, 0)).toBe(0)
    const o = await getPartnerOverview(p1.id)
    expect(o.summary).toMatchObject({ pendingCents: 0, availableCents: 0, reversedCents: 100 })
  })

  it('kennt keine Rücknahme für eine Rechnung ohne Provision', async () => {
    expect(await recordReversal({
      kind: 'refund', stripeInvoiceId: 'in_gibt_es_nicht', chargeId: 'ch_x', paidCents: 595, refundedCents: 595,
    })).toBe('skipped')
  })
})

describe('Sonderfälle beim Buchen', () => {
  const paidInvoice = async (accountId: string, affiliateId: string, period: string, tag: string) => {
    const { data, error } = await admin().from('invoices').insert({
      account_id: accountId, period_start: period, rooms: 20, net_cents: 1000, status: 'paid',
      paid_at: new Date().toISOString(), stripe_invoice_id: `in_${world.token}_${tag}`, affiliate_id: affiliateId,
    }).select('id').single()
    if (error) throw new Error(error.message)
    return data!.id as string
  }

  it('bucht nichts, wenn der Partner selbst zum geworbenen Konto gehört', async () => {
    // Partner 2 ist Rezeption in Alpha.
    const id = await paidInvoice(world.alpha.accountId, p2.id, '2020-01-01', 'selbst')
    expect(await recordCommissionForInvoice(id)).toBe('skipped')
    expect(await commissions(p2.id)).toHaveLength(0)
  })

  it('bucht die Schlussrechnung eines schon gelöschten Kontos', async () => {
    const weg = randomUUID()
    ledgerAccounts.push(weg)
    const id = await paidInvoice(weg, p2.id, '2020-02-01', 'schluss')
    expect(await recordCommissionForInvoice(id)).toBe('recorded')
    expect(await recordCommissionForInvoice(id)).toBe('skipped')
    const rows = await commissions(p2.id)
    expect(rows.map(r => r.amount_cents)).toEqual([200])
  })

  it('bucht nichts für eine offene Rechnung und nichts ohne Partner', async () => {
    const weg = randomUUID()
    ledgerAccounts.push(weg)
    const { data: offen } = await admin().from('invoices').insert({
      account_id: weg, period_start: '2020-03-01', rooms: 20, net_cents: 1000, status: 'open',
      stripe_invoice_id: `in_${world.token}_offen`, affiliate_id: p2.id,
    }).select('id').single()
    const { data: ohne } = await admin().from('invoices').insert({
      account_id: weg, period_start: '2020-04-01', rooms: 20, net_cents: 1000, status: 'paid',
      paid_at: new Date().toISOString(), stripe_invoice_id: `in_${world.token}_ohne`,
    }).select('id').single()
    expect(await recordCommissionForInvoice(offen!.id)).toBe('skipped')
    expect(await recordCommissionForInvoice(ohne!.id)).toBe('skipped')
  })
})

describe('Grenzen', () => {
  it('zeigt jedem Partner nur den eigenen Eintrag und die eigenen Buchungen', async () => {
    const [alsP1, alsP2, alsManager] = await Promise.all([
      clientAs(world.beta.owner), clientAs(world.alpha.reception), clientAs(world.alpha.manager),
    ])
    const sicht = async (c: Awaited<ReturnType<typeof clientAs>>) => ({
      partner: ((await c.from('affiliates').select('id')).data ?? []).map(r => r.id),
      buchungen: new Set(((await c.from('affiliate_commissions').select('affiliate_id')).data ?? []).map(r => r.affiliate_id)),
    })
    const [s1, s2, sm] = await Promise.all([sicht(alsP1), sicht(alsP2), sicht(alsManager)])
    expect(s1.partner).toEqual([p1.id])
    expect([...s1.buchungen]).toEqual([p1.id])
    expect(s2.partner).toEqual([p2.id])
    expect([...s2.buchungen]).toEqual([p2.id])
    expect(sm.partner).toEqual([])
    expect(sm.buchungen.size).toBe(0)
  })

  it('lässt niemanden über die Sitzung ins Buch schreiben oder sich selbst freischalten', async () => {
    const alsP2 = await clientAs(world.alpha.reception)
    await alsP2.from('affiliates').update({ approved_at: new Date().toISOString(), rate_bps: 9000 }).eq('id', p2.id)
    await alsP2.from('affiliate_commissions').insert({
      affiliate_id: p2.id, account_id: world.alpha.accountId, kind: 'commission', source: `${world.token}:erfunden`,
      period_start: '2020-05-01', base_cents: 100000, rate_bps: 2000, amount_cents: 20000,
    })
    const { data: row } = await admin().from('affiliates').select('approved_at, rate_bps').eq('id', p2.id).single()
    expect(row).toEqual({ approved_at: null, rate_bps: 2000 })
    const { data: erfunden } = await admin().from('affiliate_commissions').select('id').eq('source', `${world.token}:erfunden`)
    expect(erfunden).toEqual([])
  })
})

describe('Partner löscht seinen Zugang', () => {
  it('nimmt den Eintrag mit, leert die Zuordnung und lässt das Buch stehen', async () => {
    const userId = await newUser('partner-weg')
    await becomePartner(userId)
    const p = await partnerOf(userId)
    const weg = randomUUID()
    ledgerAccounts.push(weg)
    await admin().from('affiliate_commissions').insert({
      affiliate_id: p.id, account_id: weg, kind: 'commission', source: `${world.token}:bleibt`,
      period_start: '2020-06-01', base_cents: 500, rate_bps: 2000, amount_cents: 100,
    })
    const kundeUser = await newUser('kunde-von-weg')
    const kunde = await createHotelAccount({
      userId: kundeUser, hotelName: `${world.token} Kunde`, displayName: 'Kunde', referredBy: p.id,
    })
    world.createdAccountIds.push(kunde.accountId!)

    await admin().auth.admin.deleteUser(userId)

    const { data: eintrag } = await admin().from('affiliates').select('id').eq('id', p.id)
    expect(eintrag).toEqual([])
    const { data: konto } = await admin().from('accounts').select('referred_by').eq('id', kunde.accountId!).single()
    expect(konto?.referred_by).toBeNull()
    const { data: buch } = await admin().from('affiliate_commissions').select('amount_cents').eq('source', `${world.token}:bleibt`)
    expect(buch).toEqual([{ amount_cents: 100 }])
  })
})
