'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loadStripe, type Appearance, type Stripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { ArrowRight, Banknote, CheckCircle2, CreditCard, Trash2 } from 'lucide-react'
import {
  chooseBankTransferAction, confirmPaymentMethodAction, createSetupIntentAction, removePaymentMethodAction,
} from '../actions'
import type { PaymentMethodKind } from '@/utils/stripe'

/*
 * Zahlungsweg des Kontos — drei Wege, alle über Stripe:
 *
 * - **Karte** und **SEPA-Lastschrift**: Stripe Payment Element in einem
 *   SetupIntent (`usage: off_session`), also ohne Belastung gespeichert; die
 *   Monatsrechnung zieht später dagegen ein. Kartendaten und IBAN sehen nur
 *   Stripe-Frames, RoSe bekommt eine `pm_…`-ID.
 * - **Überweisung auf Rechnung**: nichts wird gespeichert; Stripe druckt eine
 *   virtuelle IBAN auf die Rechnung und ordnet den Eingang selbst zu.
 *
 * Nach `confirmSetup` mit `redirect: 'if_required'` bleibt die Seite in der
 * Regel stehen (SEPA immer, Karte ohne 3-D-Secure); verlangt die Bank eine
 * Umleitung, kommt Stripe über `return_url` zurück und die Seite speichert
 * das Zahlungsmittel serverseitig (siehe page.tsx).
 */

const KIND_TEXT: Record<PaymentMethodKind, string> = {
  card: 'Karte',
  sepa_debit: 'SEPA-Lastschrift',
  bank_transfer: 'Überweisung auf Rechnung',
}

function darkMode(): boolean {
  if (typeof document === 'undefined') return false
  const t = document.documentElement.getAttribute('data-theme')
  if (t === 'dark') return true
  if (t === 'light') return false
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

function ElementsForm({ onDone, onCancel }: { onDone: (label: string) => void; onCancel: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      onSubmit={async e => {
        e.preventDefault()
        if (!stripe || !elements) return
        setError(null)
        setPending(true)
        const { error: confirmErr, setupIntent } = await stripe.confirmSetup({
          elements,
          confirmParams: { return_url: window.location.href },
          redirect: 'if_required',
        })
        if (confirmErr) {
          setError(confirmErr.message ?? 'Bestätigung fehlgeschlagen.')
          setPending(false)
          return
        }
        if (!setupIntent || setupIntent.status !== 'succeeded') {
          setError(`Zahlungsmittel noch nicht bestätigt (${setupIntent?.status ?? 'unbekannt'}).`)
          setPending(false)
          return
        }
        const res = await confirmPaymentMethodAction(setupIntent.id)
        setPending(false)
        if (res.error) { setError(res.error); return }
        onDone(res.label ?? '')
        router.refresh()
      }}
      className="flex flex-col gap-3"
    >
      <PaymentElement options={{ layout: 'tabs', paymentMethodOrder: ['card', 'sepa_debit'] }} />
      {error && <p className="text-sm font-semibold text-critical-strong">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!stripe || pending}
          className="rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
        >
          {pending ? 'Wird gespeichert …' : 'Zahlungsmittel speichern'}
        </button>
        <button type="button" onClick={onCancel} className="text-sm font-semibold text-ink-muted hover:text-ink">
          Abbrechen
        </button>
      </div>
      <p className="text-xs text-ink-muted">
        Es wird nichts belastet. Das Zahlungsmittel wird bei Stripe gespeichert und für die
        Monatsrechnungen verwendet; RoSe selbst sieht keine Karten- oder Kontodaten.
      </p>
    </form>
  )
}

export default function PaymentMethodPanel({
  publishableKey, aktiv, datenVollstaendig, weiterZu,
}: {
  publishableKey: string
  aktiv: { kind: PaymentMethodKind; label: string } | null
  datenVollstaendig: boolean
  /** Ziel nach der Registrierung (Zimmer-Setup), sonst null. */
  weiterZu: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [erfolg, setErfolg] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  const stripePromise = useMemo<Promise<Stripe | null> | null>(
    () => (publishableKey ? loadStripe(publishableKey, { locale: 'de' }) : null),
    [publishableKey],
  )
  const appearance = useMemo<Appearance>(
    () => ({ theme: darkMode() ? 'night' : 'stripe', variables: { borderRadius: '8px' } }),
    [],
  )

  function startElements() {
    setError(null)
    setErfolg(null)
    startTransition(async () => {
      const res = await createSetupIntentAction()
      if (res.error || !res.clientSecret) { setError(res.error ?? 'Stripe nicht erreichbar.'); return }
      setClientSecret(res.clientSecret)
    })
  }

  function bankTransfer() {
    setError(null)
    setErfolg(null)
    startTransition(async () => {
      const res = await chooseBankTransferAction()
      if (res.error) { setError(res.error); return }
      setClientSecret(null)
      setErfolg('Überweisung auf Rechnung gewählt.')
      router.refresh()
    })
  }

  function remove() {
    setError(null)
    setErfolg(null)
    startTransition(async () => {
      const res = await removePaymentMethodAction()
      if (res.error) { setError(res.error); return }
      router.refresh()
    })
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-edge bg-surface p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink-soft">
        <CreditCard className="h-4 w-4" /> Zahlungsweg
      </h2>

      {aktiv ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-muted px-3 py-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-positive-strong" />
          <span className="font-semibold text-ink">{KIND_TEXT[aktiv.kind]}</span>
          {aktiv.kind !== 'bank_transfer' && <span className="text-ink-soft">{aktiv.label}</span>}
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="ml-auto flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-critical-strong disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Entfernen
          </button>
        </div>
      ) : (
        <p className="text-sm text-ink-soft">
          Noch kein Zahlungsweg hinterlegt. Die Monatsrechnung wird per Karte oder
          SEPA-Lastschrift eingezogen oder per Überweisung beglichen — alle drei Wege laufen
          über unseren Zahlungsdienstleister Stripe.
        </p>
      )}

      {!datenVollstaendig && (
        <p className="rounded-lg border border-attention-tint-edge bg-attention-tint px-3 py-2 text-xs font-semibold text-attention-deepest">
          Bitte zuerst die Rechnungsdaten oben speichern — sie stehen auf der Rechnung und
          bestimmen die Umsatzsteuer.
        </p>
      )}

      {clientSecret && stripePromise ? (
        <Elements stripe={stripePromise} options={{ clientSecret, locale: 'de', appearance }}>
          <ElementsForm
            onDone={label => { setClientSecret(null); setErfolg(`${label} gespeichert.`) }}
            onCancel={() => setClientSecret(null)}
          />
        </Elements>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={startElements}
            disabled={pending || !datenVollstaendig}
            className="flex items-center gap-1.5 rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
          >
            <CreditCard className="h-4 w-4" /> {aktiv && aktiv.kind !== 'bank_transfer' ? 'Karte oder Lastschrift ändern' : 'Karte oder SEPA-Lastschrift hinterlegen'}
          </button>
          {aktiv?.kind !== 'bank_transfer' && (
            <button
              type="button"
              onClick={bankTransfer}
              disabled={pending || !datenVollstaendig}
              className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface-elevated px-4 py-2 text-sm font-bold text-ink hover:border-edge-strong disabled:opacity-50"
            >
              <Banknote className="h-4 w-4" /> Überweisung auf Rechnung
            </button>
          )}
        </div>
      )}

      {error && <p className="text-sm font-semibold text-critical-strong">{error}</p>}
      {erfolg && (
        <p className="flex items-center gap-1 text-sm font-semibold text-positive-strong">
          <CheckCircle2 className="h-4 w-4" /> {erfolg}
        </p>
      )}

      <p className="text-xs text-ink-muted">
        Überweisung: Die Rechnung nennt eine Bankverbindung unseres Zahlungsdienstleisters mit
        Verwendungszweck; der Eingang wird automatisch zugeordnet, Zahlungsziel 14 Tage.
        Lastschrift: Einzug mit Rechnungsstellung nach Vorabankündigung. Karte: Belastung mit
        Rechnungsstellung.
      </p>

      {weiterZu && aktiv && (
        <Link
          href={weiterZu}
          className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong"
        >
          Weiter zum Zimmer-Setup <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </section>
  )
}
