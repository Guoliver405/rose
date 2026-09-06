import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { createAdminClient } from '@/utils/supabase/service'
import { savePaymentMethodFromSetupIntent, stripeClient, stripeReady } from '@/utils/stripe'
import { dateKeyFromUnix, mapStripeInvoiceStatus } from '@/lib/invoice'

/**
 * Stripe-Webhook — spiegelt Rechnungs- und Kundenereignisse nach RoSe.
 *
 * Signaturprüfung über `STRIPE_WEBHOOK_SECRET`; ohne Variable 503. Jedes
 * Ereignis wird in `stripe_events` eingetragen, bevor es verarbeitet wird —
 * Stripe liefert bei Zweifel doppelt, die Primärschlüssel-Verletzung macht
 * die zweite Zustellung zum No-op. Antwort immer 200, sobald das Ereignis
 * angenommen wurde; Verarbeitungsfehler landen im Log, nicht bei Stripe
 * (sonst käme das Ereignis drei Tage lang wieder).
 *
 * Liegt außerhalb des Proxy-Matchers — richtig so, hier gibt es keine Sitzung.
 */
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !stripeReady()) return NextResponse.json({ error: 'Webhook nicht eingerichtet' }, { status: 503 })

  const signature = request.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'signature fehlt' }, { status: 400 })

  const payload = await request.text()
  let event: Stripe.Event
  try {
    event = stripeClient().webhooks.constructEvent(payload, signature, secret)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'ungültige Signatur' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error: dup } = await admin.from('stripe_events').insert({ id: event.id, type: event.type })
  if (dup) {
    if (dup.code === '23505') return NextResponse.json({ received: true, duplicate: true })
    console.error('[stripe/webhook] stripe_events:', dup.message)
  }

  try {
    await handle(event)
  } catch (err) {
    console.error('[stripe/webhook] Verarbeitung fehlgeschlagen:', event.type, event.id, err instanceof Error ? err.message : err)
  }
  return NextResponse.json({ received: true })
}

async function handle(event: Stripe.Event): Promise<void> {
  const admin = createAdminClient()

  switch (event.type) {
    case 'invoice.finalized':
    case 'invoice.paid':
    case 'invoice.payment_failed':
    case 'invoice.marked_uncollectible':
    case 'invoice.voided':
    case 'invoice.updated': {
      const inv = event.data.object as Stripe.Invoice
      const accountId = inv.metadata?.account_id
      const periodStart = inv.metadata?.period_start
      const update = {
        number: inv.number ?? null,
        status: mapStripeInvoiceStatus(inv.status),
        total_cents: inv.total,
        tax_cents: Array.isArray(inv.total_taxes) ? inv.total_taxes.reduce((s, t) => s + (t.amount ?? 0), 0) : null,
        hosted_invoice_url: inv.hosted_invoice_url ?? null,
        invoice_pdf: inv.invoice_pdf ?? null,
        due_at: dateKeyFromUnix(inv.due_date),
        paid_at: inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000).toISOString() : null,
        last_error: event.type === 'invoice.payment_failed' ? 'Zahlung fehlgeschlagen — Stripe versucht es erneut.' : null,
        updated_at: new Date().toISOString(),
      }
      const { data: byId } = await admin.from('invoices').select('id').eq('stripe_invoice_id', inv.id).maybeSingle()
      if (byId) {
        await admin.from('invoices').update(update).eq('id', byId.id)
        return
      }
      if (!accountId || !periodStart) return
      // Das Ereignis kann den Monatslauf überholen: die Spiegel-Zeile existiert
      // dann schon (Konto + Periode), trägt aber noch keine Stripe-ID. Nur
      // ergänzen — Zimmerzahl und Nettobetrag des Laufs nicht überschreiben
      // (das tat der frühere Upsert und setzte `rooms` auf 0).
      const { data: byPeriod } = await admin.from('invoices').select('id')
        .eq('account_id', accountId).eq('period_start', periodStart).maybeSingle()
      if (byPeriod) {
        await admin.from('invoices').update({ stripe_invoice_id: inv.id, ...update }).eq('id', byPeriod.id)
      } else {
        // Rechnung aus dem Dashboard oder aus einem Lauf ohne Spiegel-Zeile.
        await admin.from('invoices').insert({
          account_id: accountId, period_start: periodStart,
          rooms: 0, net_cents: inv.subtotal ?? 0,
          stripe_invoice_id: inv.id, ...update,
        })
      }
      return
    }

    case 'setup_intent.succeeded': {
      const si = event.data.object as Stripe.SetupIntent
      const accountId = si.metadata?.account_id
      if (accountId) await savePaymentMethodFromSetupIntent(accountId, si.id)
      return
    }

    case 'payment_method.detached': {
      const pm = event.data.object as Stripe.PaymentMethod
      await admin.from('accounts')
        .update({ payment_method_kind: null, stripe_payment_method: null, payment_method_label: null })
        .eq('stripe_payment_method', pm.id)
      return
    }

    case 'customer.tax_id.created':
    case 'customer.tax_id.updated': {
      const taxId = event.data.object as Stripe.TaxId
      const customerId = typeof taxId.customer === 'string' ? taxId.customer : taxId.customer?.id
      if (!customerId) return
      await admin.from('accounts')
        .update({ vat_id_status: taxId.verification?.status ?? 'pending' })
        .eq('stripe_customer_id', customerId).eq('vat_id', taxId.value)
      return
    }

    default:
      return
  }
}
