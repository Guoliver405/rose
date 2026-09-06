import Stripe from 'stripe'
import { createAdminClient } from '@/utils/supabase/service'
import type { BillingDetails } from '@/lib/vat'

/*
 * Stripe-Anbindung — Kunde, Rechnungsdaten, Zahlungsweg (Bauplan Schritt 1).
 *
 * Muster wie `mailReady()` in mail.ts: Fehlen die Schlüssel, existiert der
 * Zahlungsweg in der Oberfläche nicht — kein toter Knopf, kein Absturz. CI
 * mit Platzhalter-Keys und die lokale Entwicklung ohne Stripe laufen weiter.
 *
 * Ein Kunde je Konto (`accounts.stripe_customer_id`). Die Kunden-Objekte
 * einer Sandbox existieren im Live-Konto nicht — `ensureStripeCustomer`
 * prüft deshalb, ob die gespeicherte ID im AKTUELLEN Stripe-Konto noch
 * existiert, und legt sonst einen neuen Kunden an (Wechsel Test → Live,
 * Übergabe an das Konto der UG). Dabei geht der gespeicherte Zahlungsweg
 * verloren; `/admin` erinnert dann an die Neuhinterlegung.
 *
 * Rechnungsdaten liegen doppelt: in `accounts` (für die Anzeige, ohne
 * Roundtrip zu Stripe) und am Stripe-Kunden (Adresse für Stripe Tax,
 * USt-IdNr. als Tax-ID — Stripe prüft sie gegen VIES und dreht bei EU-Kunden
 * die Steuerschuld um). Die Prüfung läuft asynchron; den Status meldet der
 * Webhook `customer.tax_id.updated` (Schritt 2), bis dahin steht „pending".
 */

export function stripeReady(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
}

export function stripePublishableKey(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
}

let client: Stripe | null = null

/** Server-SDK, einmal je Prozess. Nur aufrufen, wenn `stripeReady()`. */
export function stripeClient(): Stripe {
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
      appInfo: { name: 'RoSe RoomService', url: 'https://rose-roomservice.app' },
    })
  }
  return client
}

export type PaymentMethodKind = 'card' | 'sepa_debit' | 'bank_transfer'

export type BillingAddress = {
  line1: string
  line2: string | null
  postal_code: string
  city: string
  country: string
}

/** Abrechnungsbezogene Felder eines Kontos, wie sie in `accounts` liegen. */
export type AccountBilling = {
  accountId: string
  accountName: string
  stripeCustomerId: string | null
  paymentMethodKind: PaymentMethodKind | null
  stripePaymentMethod: string | null
  paymentMethodLabel: string | null
  billingName: string | null
  billingAddress: BillingAddress | null
  vatId: string | null
  vatIdStatus: string | null
}

const BILLING_COLUMNS =
  'id, name, stripe_customer_id, payment_method_kind, stripe_payment_method, payment_method_label, billing_name, billing_address, vat_id, vat_id_status'

type AccountRow = {
  id: string
  name: string
  stripe_customer_id: string | null
  payment_method_kind: PaymentMethodKind | null
  stripe_payment_method: string | null
  payment_method_label: string | null
  billing_name: string | null
  billing_address: BillingAddress | null
  vat_id: string | null
  vat_id_status: string | null
}

function toBilling(row: AccountRow): AccountBilling {
  return {
    accountId: row.id,
    accountName: row.name,
    stripeCustomerId: row.stripe_customer_id,
    paymentMethodKind: row.payment_method_kind,
    stripePaymentMethod: row.stripe_payment_method,
    paymentMethodLabel: row.payment_method_label,
    billingName: row.billing_name,
    billingAddress: row.billing_address,
    vatId: row.vat_id,
    vatIdStatus: row.vat_id_status,
  }
}

export async function getAccountBilling(accountId: string): Promise<AccountBilling | null> {
  const admin = createAdminClient()
  const { data } = await admin.from('accounts').select(BILLING_COLUMNS).eq('id', accountId).maybeSingle()
  return data ? toBilling(data as AccountRow) : null
}

/** Rechnungsdaten sind vollständig, sobald Empfänger und Adresse stehen. */
export function billingDetailsComplete(b: AccountBilling | null): boolean {
  return Boolean(b?.billingName && b.billingAddress?.line1 && b.billingAddress.city && b.billingAddress.country)
}

/** E-Mail des Kontoinhabers — liegt nur in `auth.users`, nicht im Kontext. */
async function ownerEmail(accountId: string): Promise<string | undefined> {
  const admin = createAdminClient()
  const { data: owner } = await admin
    .from('account_members').select('user_id').eq('account_id', accountId).eq('role', 'owner')
    .limit(1).maybeSingle()
  if (!owner) return undefined
  const { data } = await admin.auth.admin.getUserById(owner.user_id as string)
  return data.user?.email ?? undefined
}

function isMissing(err: unknown): boolean {
  return err instanceof Stripe.errors.StripeError && err.code === 'resource_missing'
}

/**
 * Liefert die Stripe-Kunden-ID des Kontos; legt den Kunden an, wenn keiner
 * existiert oder die gespeicherte ID im aktuellen Stripe-Konto unbekannt ist.
 */
export async function ensureStripeCustomer(accountId: string): Promise<{ customerId?: string; error?: string }> {
  if (!stripeReady()) return { error: 'Stripe ist nicht eingerichtet.' }
  const admin = createAdminClient()
  const billing = await getAccountBilling(accountId)
  if (!billing) return { error: 'Konto nicht gefunden.' }
  const stripe = stripeClient()

  if (billing.stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(billing.stripeCustomerId)
      if (!existing.deleted) return { customerId: existing.id }
    } catch (err) {
      if (!isMissing(err)) return { error: err instanceof Error ? err.message : 'Stripe nicht erreichbar.' }
    }
    // ID aus einem anderen Stripe-Konto (Sandbox → Live) oder gelöscht:
    // neu anlegen, gespeicherten Zahlungsweg verwerfen.
    await admin.from('accounts').update({
      stripe_customer_id: null, payment_method_kind: null, stripe_payment_method: null, payment_method_label: null,
    }).eq('id', accountId)
  }

  try {
    const customer = await stripe.customers.create({
      name: billing.billingName ?? billing.accountName,
      email: await ownerEmail(accountId),
      address: billing.billingAddress
        ? { ...billing.billingAddress, line2: billing.billingAddress.line2 ?? undefined }
        : undefined,
      preferred_locales: ['de'],
      metadata: { account_id: accountId },
    })
    const { error } = await admin.from('accounts').update({ stripe_customer_id: customer.id }).eq('id', accountId)
    if (error) return { error: `accounts: ${error.message}` }
    return { customerId: customer.id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Stripe-Kunde konnte nicht angelegt werden.' }
  }
}

/**
 * Rechnungsdaten speichern und an den Stripe-Kunden übertragen — Adresse für
 * Stripe Tax, USt-IdNr. als Tax-ID (Typ `eu_vat`).
 */
export async function syncCustomerBillingDetails(
  accountId: string,
  details: BillingDetails,
): Promise<{ error?: string }> {
  const admin = createAdminClient()
  const ensured = await ensureStripeCustomer(accountId)
  if (!ensured.customerId) return { error: ensured.error }
  const stripe = stripeClient()

  try {
    await stripe.customers.update(ensured.customerId, {
      name: details.name,
      address: { ...details.address, line2: details.address.line2 ?? undefined },
    })

    // Tax-IDs abgleichen: genau eine eu_vat mit dem gewünschten Wert, sonst keine.
    const existing = await stripe.customers.listTaxIds(ensured.customerId, { limit: 20 })
    let status: string | null = null
    let keep = false
    for (const t of existing.data) {
      if (details.vatId && t.type === 'eu_vat' && t.value === details.vatId) {
        keep = true
        status = t.verification?.status ?? 'pending'
      } else {
        await stripe.customers.deleteTaxId(ensured.customerId, t.id)
      }
    }
    if (details.vatId && !keep) {
      const created = await stripe.customers.createTaxId(ensured.customerId, { type: 'eu_vat', value: details.vatId })
      status = created.verification?.status ?? 'pending'
    }

    const { error } = await admin.from('accounts').update({
      billing_name: details.name,
      billing_address: details.address,
      vat_id: details.vatId,
      vat_id_status: details.vatId ? status : null,
    }).eq('id', accountId)
    if (error) return { error: `accounts: ${error.message}` }
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Rechnungsdaten konnten nicht übertragen werden.' }
  }
}

/** Kurzbezeichnung eines gespeicherten Zahlungsmittels für die Konto-Seite. */
export function describePaymentMethod(pm: Stripe.PaymentMethod): { kind: PaymentMethodKind; label: string } | null {
  if (pm.type === 'card' && pm.card) {
    const brand = pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1)
    return { kind: 'card', label: `${brand} •••• ${pm.card.last4}` }
  }
  if (pm.type === 'sepa_debit' && pm.sepa_debit) {
    return { kind: 'sepa_debit', label: `SEPA-Lastschrift •••• ${pm.sepa_debit.last4}` }
  }
  return null
}

/**
 * Nach erfolgreichem SetupIntent: Zahlungsmittel am Konto speichern und als
 * Standard für Rechnungen setzen. Prüft, dass der SetupIntent zum Kunden
 * DIESES Kontos gehört — die ID kommt aus dem Browser.
 */
export async function savePaymentMethodFromSetupIntent(
  accountId: string,
  setupIntentId: string,
): Promise<{ error?: string; label?: string }> {
  if (!stripeReady()) return { error: 'Stripe ist nicht eingerichtet.' }
  const billing = await getAccountBilling(accountId)
  if (!billing?.stripeCustomerId) return { error: 'Kein Stripe-Kunde für dieses Konto.' }
  const stripe = stripeClient()
  const admin = createAdminClient()

  try {
    const si = await stripe.setupIntents.retrieve(setupIntentId, { expand: ['payment_method'] })
    const customerId = typeof si.customer === 'string' ? si.customer : si.customer?.id
    if (customerId !== billing.stripeCustomerId) return { error: 'Zahlungsmittel gehört nicht zu diesem Konto.' }
    if (si.status !== 'succeeded') return { error: `Zahlungsmittel noch nicht bestätigt (${si.status}).` }
    const pm = si.payment_method
    if (!pm || typeof pm === 'string') return { error: 'Zahlungsmittel fehlt am SetupIntent.' }
    const described = describePaymentMethod(pm)
    if (!described) return { error: `Zahlungsart ${pm.type} wird nicht unterstützt.` }

    // Vorheriges Zahlungsmittel lösen, damit am Kunden nicht Altlasten hängen.
    if (billing.stripePaymentMethod && billing.stripePaymentMethod !== pm.id) {
      try { await stripe.paymentMethods.detach(billing.stripePaymentMethod) } catch { /* schon weg */ }
    }
    await stripe.customers.update(billing.stripeCustomerId, {
      invoice_settings: { default_payment_method: pm.id },
    })
    const { error } = await admin.from('accounts').update({
      payment_method_kind: described.kind,
      stripe_payment_method: pm.id,
      payment_method_label: described.label,
    }).eq('id', accountId)
    if (error) return { error: `accounts: ${error.message}` }
    return { label: described.label }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Zahlungsmittel konnte nicht gespeichert werden.' }
  }
}

/** Zahlungsweg „Überweisung auf Rechnung": nichts bei Stripe speichern, nur die Wahl merken. */
export async function chooseBankTransfer(accountId: string): Promise<{ error?: string }> {
  const ensured = await ensureStripeCustomer(accountId)
  if (!ensured.customerId) return { error: ensured.error }
  const cleared = await detachStoredPaymentMethod(accountId)
  if (cleared.error) return cleared
  const admin = createAdminClient()
  const { error } = await admin.from('accounts').update({
    payment_method_kind: 'bank_transfer',
    stripe_payment_method: null,
    payment_method_label: 'Überweisung auf Rechnung',
  }).eq('id', accountId)
  return error ? { error: `accounts: ${error.message}` } : {}
}

/** Gespeichertes Zahlungsmittel bei Stripe lösen und am Konto leeren. */
export async function detachStoredPaymentMethod(accountId: string): Promise<{ error?: string }> {
  const billing = await getAccountBilling(accountId)
  if (!billing) return { error: 'Konto nicht gefunden.' }
  if (billing.stripePaymentMethod && stripeReady()) {
    try {
      await stripeClient().paymentMethods.detach(billing.stripePaymentMethod)
    } catch (err) {
      if (!isMissing(err)) return { error: err instanceof Error ? err.message : 'Zahlungsmittel konnte nicht gelöst werden.' }
    }
  }
  const admin = createAdminClient()
  const { error } = await admin.from('accounts').update({
    payment_method_kind: null, stripe_payment_method: null, payment_method_label: null,
  }).eq('id', accountId)
  return error ? { error: `accounts: ${error.message}` } : {}
}

/** Beim Löschen des Kontos: Stripe-Kunden entfernen; Stripe behält dessen Rechnungen. */
export async function deleteStripeCustomer(customerId: string): Promise<void> {
  if (!stripeReady()) return
  try {
    await stripeClient().customers.del(customerId)
  } catch (err) {
    if (!isMissing(err)) console.error('[stripe] Kunde blieb stehen:', customerId, err instanceof Error ? err.message : err)
  }
}
