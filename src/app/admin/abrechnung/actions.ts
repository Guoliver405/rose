'use server'

import { revalidatePath } from 'next/cache'
import { getAccountContext } from '@/utils/auth'
import {
  chooseBankTransfer, detachStoredPaymentMethod, ensureStripeCustomer,
  savePaymentMethodFromSetupIntent, stripeClient, stripeReady, syncCustomerBillingDetails,
} from '@/utils/stripe'
import { validateBillingDetails } from '@/lib/vat'
import { getMessages } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'

/*
 * Konto-Seite: Rechnungsdaten und Zahlungsweg.
 *
 * Nur der Kontoinhaber (`getAccountContext`). Alles Schreibende läuft über
 * den Admin-Client in stripe.ts — nach dieser Prüfung, wie überall.
 */

type Result = { error?: string }

const PFAD = '/admin/abrechnung'

async function messages() {
  return getMessages(await getAdminLocale()).account.billing.errors
}

export async function saveBillingDetailsAction(formData: FormData): Promise<Result> {
  const e = await messages()
  const ctx = await getAccountContext()
  if (!ctx) return { error: e.noPermission }
  if (!stripeReady()) return { error: e.notReady }

  const get = (k: string) => ((formData.get(k) as string) ?? '')
  const checked = validateBillingDetails({
    name: get('name'), line1: get('line1'), line2: get('line2'),
    postalCode: get('postalCode'), city: get('city'), country: get('country'), vatId: get('vatId'),
  }, e.vat)
  if ('error' in checked) return { error: checked.error }

  const res = await syncCustomerBillingDetails(ctx.accountId, checked.details)
  if (res.error) return res
  revalidatePath(PFAD, 'layout')
  return {}
}

/** SetupIntent für Karte oder SEPA-Lastschrift — ohne Belastung, `off_session` für spätere Rechnungen. */
export async function createSetupIntentAction(): Promise<Result & { clientSecret?: string }> {
  const e = await messages()
  const ctx = await getAccountContext()
  if (!ctx) return { error: e.noPermission }
  if (!stripeReady()) return { error: e.notReady }

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
    return { error: err instanceof Error ? err.message : e.stripeUnreachable }
  }
}

export async function confirmPaymentMethodAction(setupIntentId: string): Promise<Result & { label?: string }> {
  const e = await messages()
  const ctx = await getAccountContext()
  if (!ctx) return { error: e.noPermission }
  if (!/^seti_[A-Za-z0-9]+$/.test(setupIntentId)) return { error: e.invalidId }
  const res = await savePaymentMethodFromSetupIntent(ctx.accountId, setupIntentId)
  if (!res.error) revalidatePath(PFAD, 'layout')
  return res
}

export async function chooseBankTransferAction(): Promise<Result> {
  const e = await messages()
  const ctx = await getAccountContext()
  if (!ctx) return { error: e.noPermission }
  if (!stripeReady()) return { error: e.notReady }
  const res = await chooseBankTransfer(ctx.accountId)
  if (!res.error) revalidatePath(PFAD, 'layout')
  return res
}

export async function removePaymentMethodAction(): Promise<Result> {
  const e = await messages()
  const ctx = await getAccountContext()
  if (!ctx) return { error: e.noPermission }
  const res = await detachStoredPaymentMethod(ctx.accountId)
  if (!res.error) revalidatePath(PFAD, 'layout')
  return res
}
