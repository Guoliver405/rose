'use server'

import { revalidatePath } from 'next/cache'
import { getAccountContext } from '@/utils/auth'
import {
  chooseBankTransfer, detachStoredPaymentMethod, ensureStripeCustomer,
  savePaymentMethodFromSetupIntent, stripeClient, stripeReady, syncCustomerBillingDetails,
} from '@/utils/stripe'
import { validateBillingDetails } from '@/lib/vat'

/*
 * Konto-Seite: Rechnungsdaten und Zahlungsweg.
 *
 * Nur der Kontoinhaber (`getAccountContext`). Alles Schreibende läuft über
 * den Admin-Client in stripe.ts — nach dieser Prüfung, wie überall.
 */

type Result = { error?: string }

const PFAD = '/admin/abrechnung'

export async function saveBillingDetailsAction(formData: FormData): Promise<Result> {
  const ctx = await getAccountContext()
  if (!ctx) return { error: 'Keine Berechtigung.' }
  if (!stripeReady()) return { error: 'Zahlungsverfahren sind noch nicht eingerichtet.' }

  const get = (k: string) => ((formData.get(k) as string) ?? '')
  const checked = validateBillingDetails({
    name: get('name'), line1: get('line1'), line2: get('line2'),
    postalCode: get('postalCode'), city: get('city'), country: get('country'), vatId: get('vatId'),
  })
  if ('error' in checked) return { error: checked.error }

  const res = await syncCustomerBillingDetails(ctx.accountId, checked.details)
  if (res.error) return res
  revalidatePath(PFAD, 'layout')
  return {}
}

/** SetupIntent für Karte oder SEPA-Lastschrift — ohne Belastung, `off_session` für spätere Rechnungen. */
export async function createSetupIntentAction(): Promise<Result & { clientSecret?: string }> {
  const ctx = await getAccountContext()
  if (!ctx) return { error: 'Keine Berechtigung.' }
  if (!stripeReady()) return { error: 'Zahlungsverfahren sind noch nicht eingerichtet.' }

  const ensured = await ensureStripeCustomer(ctx.accountId)
  if (!ensured.customerId) return { error: ensured.error }
  try {
    const si = await stripeClient().setupIntents.create({
      customer: ensured.customerId,
      payment_method_types: ['card', 'sepa_debit'],
      usage: 'off_session',
      metadata: { account_id: ctx.accountId },
    })
    return { clientSecret: si.client_secret ?? undefined }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Stripe nicht erreichbar.' }
  }
}

export async function confirmPaymentMethodAction(setupIntentId: string): Promise<Result & { label?: string }> {
  const ctx = await getAccountContext()
  if (!ctx) return { error: 'Keine Berechtigung.' }
  if (!/^seti_[A-Za-z0-9]+$/.test(setupIntentId)) return { error: 'Ungültige Kennung.' }
  const res = await savePaymentMethodFromSetupIntent(ctx.accountId, setupIntentId)
  if (!res.error) revalidatePath(PFAD, 'layout')
  return res
}

export async function chooseBankTransferAction(): Promise<Result> {
  const ctx = await getAccountContext()
  if (!ctx) return { error: 'Keine Berechtigung.' }
  if (!stripeReady()) return { error: 'Zahlungsverfahren sind noch nicht eingerichtet.' }
  const res = await chooseBankTransfer(ctx.accountId)
  if (!res.error) revalidatePath(PFAD, 'layout')
  return res
}

export async function removePaymentMethodAction(): Promise<Result> {
  const ctx = await getAccountContext()
  if (!ctx) return { error: 'Keine Berechtigung.' }
  const res = await detachStoredPaymentMethod(ctx.accountId)
  if (!res.error) revalidatePath(PFAD, 'layout')
  return res
}
