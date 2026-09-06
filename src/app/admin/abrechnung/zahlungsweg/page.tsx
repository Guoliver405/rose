import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import { getAccountContext } from '@/utils/auth'
import {
  billingDetailsComplete, getAccountBilling, savePaymentMethodFromSetupIntent, stripePublishableKey,
  stripeReady,
} from '@/utils/stripe'
import { COUNTRY_CODES } from '@/lib/vat'
import KontoShell from '../../KontoShell'
import BillingDetailsForm from './BillingDetailsForm'
import PaymentMethodPanel from './PaymentMethodPanel'

/**
 * Zahlungsweg und Rechnungsdaten — der Zahlungsschritt des Kontos.
 *
 * Zwei Kästen: **Rechnungsdaten** (Empfänger, Anschrift, Land, USt-IdNr.;
 * Pflicht, weil Stripe Tax ohne Kundenadresse nicht rechnet und Stripe die
 * USt-IdNr. für Reverse Charge braucht) und **Zahlungsweg** (Karte oder
 * SEPA-Lastschrift über das Stripe Payment Element, ohne Belastung
 * gespeichert; oder Überweisung auf Rechnung — auch die läuft über Stripe,
 * mit virtueller IBAN auf der Rechnung).
 *
 * Kommt der Kunde direkt aus der Registrierung (`?neu=<slug>`), zeigt die
 * Seite „Schritt 2 von 2" und führt danach ins Zimmer-Setup; „später" ist
 * erlaubt (E1), `/admin` erinnert dann per Banner.
 *
 * Nach einer 3-D-Secure-Umleitung kommt Stripe mit `?setup_intent=…&
 * redirect_status=succeeded` zurück — dann wird das Zahlungsmittel hier
 * serverseitig gespeichert, bevor die Seite rendert.
 */
export default async function ZahlungswegPage({
  searchParams,
}: {
  searchParams: Promise<{ neu?: string; setup_intent?: string; redirect_status?: string }>
}) {
  const account = await getAccountContext()
  if (!account) redirect('/admin')
  if (!stripeReady()) redirect('/admin/abrechnung')

  const { neu, setup_intent: setupIntent, redirect_status: redirectStatus } = await searchParams
  const neuSlug = neu && /^[a-z0-9-]+$/.test(neu) ? neu : null

  let hinweis: string | null = null
  if (setupIntent && /^seti_[A-Za-z0-9]+$/.test(setupIntent)) {
    if (redirectStatus === 'succeeded') {
      const res = await savePaymentMethodFromSetupIntent(account.accountId, setupIntent)
      hinweis = res.error ? `Zahlungsmittel konnte nicht gespeichert werden: ${res.error}` : null
    } else {
      hinweis = 'Die Bestätigung des Zahlungsmittels wurde abgebrochen. Bitte noch einmal versuchen.'
    }
    if (!hinweis) redirect(neuSlug ? `/admin/abrechnung/zahlungsweg?neu=${neuSlug}` : '/admin/abrechnung/zahlungsweg')
  }

  const billing = await getAccountBilling(account.accountId)
  const datenVollstaendig = billingDetailsComplete(billing)

  const namen = new Intl.DisplayNames(['de'], { type: 'region' })
  const laender = COUNTRY_CODES
    .map(code => ({ code, name: namen.of(code) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))

  return (
    <KontoShell who={account.displayName}>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/abrechnung"
          className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Plan &amp; Abrechnung
        </Link>
        <h1 className="text-xl font-black text-ink">Zahlungsweg &amp; Rechnungsdaten</h1>
      </div>

      {neuSlug && (
        <div className="flex gap-3 rounded-xl border border-action-tint-edge bg-action-tint p-4 text-sm">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-action-deep" />
          <div className="text-ink">
            <p className="font-bold">Schritt 2 von 2 — Zahlungsweg</p>
            <p className="mt-1">
              Ihr Konto und Ihr Haus sind angelegt. Hinterlegen Sie jetzt Rechnungsdaten und
              Zahlungsweg — belastet wird nichts, der Monat der Registrierung und der erste
              volle Monat danach sind frei. Sie können diesen Schritt auch später auf der Seite
              {'„Plan & Abrechnung“'} nachholen.
            </p>
            <Link
              href={`/h/${neuSlug}/admin/zimmer`}
              className="mt-2 inline-flex items-center gap-1 font-semibold underline hover:no-underline"
            >
              Später — weiter zum Zimmer-Setup <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {hinweis && (
        <div className="rounded-xl border border-critical-tint-edge bg-critical-tint p-3 text-sm font-semibold text-critical-deepest">
          {hinweis}
        </div>
      )}

      <BillingDetailsForm
        laender={laender}
        vorgabeName={billing?.billingName ?? account.accountName}
        adresse={billing?.billingAddress ?? null}
        vatId={billing?.vatId ?? null}
        vatIdStatus={billing?.vatIdStatus ?? null}
      />

      <PaymentMethodPanel
        publishableKey={stripePublishableKey()}
        aktiv={billing?.paymentMethodKind ? { kind: billing.paymentMethodKind, label: billing.paymentMethodLabel ?? '' } : null}
        datenVollstaendig={datenVollstaendig}
        weiterZu={neuSlug ? `/h/${neuSlug}/admin/zimmer` : null}
      />
    </KontoShell>
  )
}
