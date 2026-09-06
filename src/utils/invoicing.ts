import type Stripe from 'stripe'
import { createAdminClient } from '@/utils/supabase/service'
import { ensureBillingSnapshots } from '@/utils/billing'
import {
  billingDetailsComplete, getAccountBilling, stripeClient, stripeReady, type AccountBilling,
} from '@/utils/stripe'
import { billingLine } from '@/lib/pricing'
import { periodKey, type BillingPeriod } from '@/lib/rooms'
import {
  INVOICE_DUE_DAYS, SAAS_TAX_CODE, dateKeyFromUnix, invoiceFooter, invoiceIdempotencyKey,
  invoiceLineDescription, invoiceMemo, mapStripeInvoiceStatus, periodRangeLabel, previousMonthPeriod,
  type MirrorStatus,
} from '@/lib/invoice'

/*
 * Monatslauf — je Konto eine Stripe-Rechnung für den Vormonat.
 *
 * Reihenfolge je Konto:
 *   1. `ensureBillingSnapshots` schreibt den Vormonat fest — die Rechnungs-
 *      grundlage ändert sich danach nicht mehr (Zimmer dürfen gelöscht werden).
 *   2. Zimmerzahl aus dem Snapshot, Betrag aus `billingLine`. 0 € (kein Zimmer
 *      oder Freimonat) ⇒ keine Rechnung, keine Zeile.
 *   3. Spiegel-Zeile in `invoices` (Unique `account_id, period_start`): ein
 *      zweiter Lauf findet sie und erzeugt nichts Neues. Fehlen Rechnungsdaten
 *      oder der Stripe-Kunde, bleibt die Zeile als `draft` mit `last_error`
 *      stehen und wird beim nächsten Lauf erneut versucht; `/admin` zeigt den
 *      Grund.
 *   4. Stripe-Rechnung über das `InvoiceGateway` — eine Position, Stripe Tax,
 *      Einzug je Zahlungsweg. Der Idempotenzschlüssel `invoice-<konto>-<periode>`
 *      hält auch Stripe-seitig eine Rechnung je Periode.
 *   5. Abgleich: offene Spiegel-Zeilen werden gegen Stripe nachgezogen — das
 *      Sicherheitsnetz für verpasste Webhooks.
 *
 * Das Gateway ist austauschbar, damit der Integrationstest den Lauf gegen die
 * Testwelt fahren kann, ohne Stripe zu berühren (`tests/integration/invoicing`).
 * `accountIds` grenzt den Lauf ein — der Test darf nur seine eigenen Konten
 * anfassen, und `/admin` zieht damit den Lauf des eigenen Kontos nach, falls
 * der Cron nicht lief.
 */

export type GatewayInvoice = {
  id: string
  status: MirrorStatus
  number: string | null
  totalCents: number | null
  taxCents: number | null
  hostedInvoiceUrl: string | null
  invoicePdf: string | null
  /** `YYYY-MM-DD` */
  dueAt: string | null
  /** ISO-Zeitpunkt */
  paidAt: string | null
}

export type CreateInvoiceInput = {
  customerId: string
  accountId: string
  mirrorId: string
  period: BillingPeriod
  amountCents: number
  description: string
  memo: string
  footer: string
  /** Karte/Lastschrift ⇒ Einzug; Überweisung ⇒ Rechnung mit Bankverbindung. */
  collection: 'charge' | 'bank_transfer' | 'send'
  idempotencyKey: string
}

export type InvoiceGateway = {
  createInvoice(input: CreateInvoiceInput): Promise<GatewayInvoice>
  retrieveInvoice(id: string): Promise<GatewayInvoice>
}

function fromStripe(inv: Stripe.Invoice): GatewayInvoice {
  return {
    id: inv.id,
    status: mapStripeInvoiceStatus(inv.status),
    number: inv.number ?? null,
    totalCents: typeof inv.total === 'number' ? inv.total : null,
    taxCents: typeof inv.total_taxes === 'object' && Array.isArray(inv.total_taxes)
      ? inv.total_taxes.reduce((s, t) => s + (t.amount ?? 0), 0)
      : null,
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
    invoicePdf: inv.invoice_pdf ?? null,
    dueAt: dateKeyFromUnix(inv.due_date),
    paidAt: inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000).toISOString() : null,
  }
}

/** Echte Implementierung gegen Stripe. */
export function stripeGateway(): InvoiceGateway {
  const stripe = stripeClient()
  return {
    async createInvoice(input) {
      const bankTransfer = input.collection === 'bank_transfer'
      const chargeAutomatically = input.collection === 'charge'
      const created = await stripe.invoices.create({
        customer: input.customerId,
        collection_method: chargeAutomatically ? 'charge_automatically' : 'send_invoice',
        ...(chargeAutomatically ? {} : { days_until_due: INVOICE_DUE_DAYS }),
        auto_advance: true,
        automatic_tax: { enabled: true },
        pending_invoice_items_behavior: 'exclude',
        description: input.memo,
        footer: input.footer,
        custom_fields: [{ name: 'Leistungszeitraum', value: periodRangeLabel(input.period) }],
        rendering: { pdf: { page_size: 'a4' } },
        metadata: {
          account_id: input.accountId,
          period_start: periodKey(input.period),
          invoice_id: input.mirrorId,
        },
        ...(bankTransfer
          ? {
              payment_settings: {
                payment_method_types: ['customer_balance', 'sepa_debit', 'card'],
                payment_method_options: {
                  customer_balance: {
                    funding_type: 'bank_transfer',
                    bank_transfer: { type: 'eu_bank_transfer', eu_bank_transfer: { country: 'DE' } },
                  },
                },
              },
            }
          : {}),
      }, { idempotencyKey: input.idempotencyKey })

      await stripe.invoiceItems.create({
        customer: input.customerId,
        invoice: created.id,
        amount: input.amountCents,
        currency: 'eur',
        description: input.description,
        tax_behavior: 'exclusive',
        tax_code: SAAS_TAX_CODE,
      }, { idempotencyKey: `${input.idempotencyKey}-item` })

      let finalized = await stripe.invoices.finalizeInvoice(created.id, { auto_advance: true })

      // Einzug sofort anstoßen statt auf Stripes Stunden-Takt zu warten; ein
      // Fehlschlag (Karte abgelehnt) lässt die Rechnung offen — Stripe wieder-
      // holt nach eigenem Zeitplan, der Webhook meldet das Ergebnis.
      if (chargeAutomatically && finalized.status === 'open') {
        try {
          finalized = await stripe.invoices.pay(created.id)
        } catch (err) {
          console.warn('[invoicing] Einzug nicht sofort möglich:', created.id, err instanceof Error ? err.message : err)
        }
      }
      return fromStripe(finalized)
    },
    async retrieveInvoice(id) {
      return fromStripe(await stripe.invoices.retrieve(id))
    },
  }
}

type MirrorRow = {
  id: string
  account_id: string
  period_start: string
  status: MirrorStatus
  stripe_invoice_id: string | null
  due_at: string | null
}

export type RunSummary = {
  period: string
  accounts: number
  created: number
  skipped: number
  failed: number
  reconciled: number
  errors: { accountId: string; error: string }[]
}

export type RunOptions = {
  now?: Date
  /** Nur diese Konten — Pflicht für Tests, Komfort für den Einzelabgleich. */
  accountIds?: string[]
  gateway?: InvoiceGateway
}

function gatewayUpdate(inv: GatewayInvoice) {
  return {
    stripe_invoice_id: inv.id,
    number: inv.number,
    status: inv.status,
    total_cents: inv.totalCents,
    tax_cents: inv.taxCents,
    hosted_invoice_url: inv.hostedInvoiceUrl,
    invoice_pdf: inv.invoicePdf,
    due_at: inv.dueAt,
    paid_at: inv.paidAt,
    last_error: null,
    updated_at: new Date().toISOString(),
  }
}

/** Zimmerzahl eines Kontos in der Periode — aus den Snapshots aller Häuser. */
async function roomsFromSnapshots(accountId: string, period: BillingPeriod): Promise<number> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('billing_snapshots').select('rooms')
    .eq('account_id', accountId).eq('period_start', periodKey(period))
  return (data ?? []).reduce((s, r) => s + (r.rooms as number), 0)
}

/**
 * Rechnung eines Kontos für eine Periode sicherstellen. Idempotent: gibt es
 * die Spiegel-Zeile mit Stripe-ID schon, passiert nichts.
 */
export async function ensureInvoiceForPeriod(
  accountId: string,
  period: BillingPeriod,
  gateway: InvoiceGateway,
): Promise<'created' | 'skipped' | 'failed'> {
  const admin = createAdminClient()
  const pk = periodKey(period)

  const { data: existing } = await admin
    .from('invoices').select('id, account_id, period_start, status, stripe_invoice_id, due_at')
    .eq('account_id', accountId).eq('period_start', pk).maybeSingle()
  if (existing?.stripe_invoice_id) return 'skipped'

  const snap = await ensureBillingSnapshots(accountId)
  if (snap.error) throw new Error(`Snapshot: ${snap.error}`)

  const { data: acc } = await admin.from('accounts').select('created_at').eq('id', accountId).maybeSingle()
  if (!acc) throw new Error('Konto nicht gefunden.')
  const rooms = await roomsFromSnapshots(accountId, period)
  const line = billingLine(rooms, new Date(acc.created_at as string), period.start)
  if (line.cents <= 0) return 'skipped'

  // Spiegel-Zeile zuerst — sie ist der Riegel gegen Doppelläufe.
  let mirror = existing as MirrorRow | null
  if (!mirror) {
    const { data: inserted, error } = await admin
      .from('invoices')
      .insert({ account_id: accountId, period_start: pk, rooms, net_cents: line.cents, status: 'draft' })
      .select('id, account_id, period_start, status, stripe_invoice_id, due_at')
      .single()
    if (error) {
      // Unique-Verletzung: ein paralleler Lauf war schneller — dessen Zeile gilt.
      if (error.code === '23505') return 'skipped'
      throw new Error(`invoices: ${error.message}`)
    }
    mirror = inserted as MirrorRow
  }

  const billing = await getAccountBilling(accountId)
  const fehlt = !billing?.stripeCustomerId
    ? 'Kein Stripe-Kunde — bitte Zahlungsweg-Seite öffnen.'
    : !billingDetailsComplete(billing) ? 'Rechnungsdaten fehlen.' : null
  if (fehlt || !billing) {
    await admin.from('invoices').update({ last_error: fehlt, updated_at: new Date().toISOString() }).eq('id', mirror.id)
    return 'failed'
  }

  try {
    const inv = await gateway.createInvoice({
      customerId: billing.stripeCustomerId!,
      accountId,
      mirrorId: mirror.id,
      period,
      amountCents: line.cents,
      description: invoiceLineDescription(line, period.start),
      memo: invoiceMemo(period),
      footer: invoiceFooter(),
      collection: collectionFor(billing),
      idempotencyKey: invoiceIdempotencyKey(accountId, period),
    })
    const { error } = await admin.from('invoices').update(gatewayUpdate(inv)).eq('id', mirror.id)
    if (error) throw new Error(`invoices: ${error.message}`)
    return 'created'
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await admin.from('invoices').update({ last_error: msg, updated_at: new Date().toISOString() }).eq('id', mirror.id)
    throw err
  }
}

function collectionFor(b: AccountBilling): CreateInvoiceInput['collection'] {
  if (b.paymentMethodKind === 'bank_transfer') return 'bank_transfer'
  if (b.paymentMethodKind && b.stripePaymentMethod) return 'charge'
  // Kein Zahlungsweg: Rechnung mit Zahlungsseite, 14 Tage — der Kunde kann dort
  // per Karte, Lastschrift oder Überweisung zahlen.
  return 'bank_transfer'
}

/** Offene Spiegel-Zeilen gegen Stripe nachziehen (verpasste Webhooks). */
export async function reconcileOpenInvoices(opts: RunOptions = {}): Promise<number> {
  const gateway = opts.gateway ?? stripeGateway()
  const admin = createAdminClient()
  let q = admin.from('invoices').select('id, stripe_invoice_id').in('status', ['draft', 'open']).not('stripe_invoice_id', 'is', null)
  if (opts.accountIds) q = q.in('account_id', opts.accountIds)
  const { data } = await q
  let n = 0
  for (const row of data ?? []) {
    try {
      const inv = await gateway.retrieveInvoice(row.stripe_invoice_id as string)
      await admin.from('invoices').update(gatewayUpdate(inv)).eq('id', row.id)
      n++
    } catch (err) {
      console.error('[invoicing] Abgleich fehlgeschlagen:', row.stripe_invoice_id, err instanceof Error ? err.message : err)
    }
  }
  return n
}

/**
 * Der Monatslauf: alle (oder die angegebenen) Konten für den Vormonat.
 * Fehler eines Kontos halten die anderen nicht auf; sie stehen in der
 * Zusammenfassung und in `invoices.last_error`.
 */
export async function runMonthlyInvoicing(opts: RunOptions = {}): Promise<RunSummary> {
  const now = opts.now ?? new Date()
  const period = previousMonthPeriod(now)
  const gateway = opts.gateway ?? stripeGateway()
  const admin = createAdminClient()

  let q = admin.from('accounts').select('id')
  if (opts.accountIds) q = q.in('id', opts.accountIds)
  const { data: accounts } = await q
  const ids = (accounts ?? []).map(a => a.id as string)

  const summary: RunSummary = {
    period: periodKey(period), accounts: ids.length, created: 0, skipped: 0, failed: 0, reconciled: 0, errors: [],
  }
  for (const accountId of ids) {
    try {
      const r = await ensureInvoiceForPeriod(accountId, period, gateway)
      summary[r]++
    } catch (err) {
      summary.failed++
      summary.errors.push({ accountId, error: err instanceof Error ? err.message : String(err) })
    }
  }
  summary.reconciled = await reconcileOpenInvoices({ ...opts, gateway })
  return summary
}

/**
 * Für `/admin`: den Lauf des eigenen Kontos nachziehen, falls der Cron nicht
 * lief. Billig, wenn nichts zu tun ist (eine Abfrage), sonst genau ein Lauf.
 */
export async function ensureInvoicesForAccount(accountId: string): Promise<void> {
  if (!stripeReady()) return
  try {
    await runMonthlyInvoicing({ accountIds: [accountId] })
  } catch (err) {
    console.error('[invoicing] Nachlauf für Konto fehlgeschlagen:', accountId, err instanceof Error ? err.message : err)
  }
}

export type InvoiceRow = {
  id: string
  periodStart: string
  rooms: number
  netCents: number
  number: string | null
  status: MirrorStatus
  totalCents: number | null
  taxCents: number | null
  hostedInvoiceUrl: string | null
  invoicePdf: string | null
  dueAt: string | null
  paidAt: string | null
  lastError: string | null
}

/** Rechnungen eines Kontos, neueste zuerst. */
export async function listInvoices(accountId: string, limit = 24): Promise<InvoiceRow[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('invoices')
    .select('id, period_start, rooms, net_cents, number, status, total_cents, tax_cents, hosted_invoice_url, invoice_pdf, due_at, paid_at, last_error')
    .eq('account_id', accountId)
    .order('period_start', { ascending: false })
    .limit(limit)
  return (data ?? []).map(r => ({
    id: r.id as string,
    periodStart: r.period_start as string,
    rooms: r.rooms as number,
    netCents: r.net_cents as number,
    number: r.number as string | null,
    status: r.status as MirrorStatus,
    totalCents: r.total_cents as number | null,
    taxCents: r.tax_cents as number | null,
    hostedInvoiceUrl: r.hosted_invoice_url as string | null,
    invoicePdf: r.invoice_pdf as string | null,
    dueAt: r.due_at as string | null,
    paidAt: r.paid_at as string | null,
    lastError: r.last_error as string | null,
  }))
}
