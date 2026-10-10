'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, CheckCircle2 } from 'lucide-react'
import { saveBillingDetailsAction } from '../actions'
import { isEuCountry } from '@/lib/vat'
import type { BillingAddress } from '@/utils/stripe'
import { format } from '@/lib/i18n/format'
import type { AccountMessages } from '@/lib/i18n'

const inputClass =
  'rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none'

/**
 * Rechnungsdaten des Kontos. Die USt-IdNr. ist Pflicht für EU-Länder außer
 * Deutschland — das Formular blendet den Hinweis ein, sobald ein solches
 * Land gewählt ist; die verbindliche Prüfung sitzt in `validateBillingDetails`.
 */
export default function BillingDetailsForm({
  m, laender, vorgabeName, adresse, vatId, vatIdStatus,
}: {
  m: AccountMessages['billing']['details']
  laender: { code: string; name: string }[]
  vorgabeName: string
  adresse: BillingAddress | null
  vatId: string | null
  vatIdStatus: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [country, setCountry] = useState(adresse?.country ?? 'DE')

  const vatPflicht = isEuCountry(country) && country !== 'DE'
  const vatMoeglich = isEuCountry(country)

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        setError(null)
        setSaved(false)
        const formData = new FormData(e.currentTarget)
        startTransition(async () => {
          const res = await saveBillingDetailsAction(formData)
          if (res.error) { setError(res.error); return }
          setSaved(true)
          router.refresh()
        })
      }}
      className="flex flex-col gap-4 rounded-xl border border-edge bg-surface p-4"
    >
      <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink-soft">
        <Building2 className="h-4 w-4" /> {m.title}
      </h2>
      <p className="text-xs text-ink-muted">
        {m.intro}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted sm:col-span-2">
          {m.name}
          <input name="name" required minLength={2} maxLength={120} defaultValue={vorgabeName} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted sm:col-span-2">
          {m.line1}
          <input name="line1" required minLength={3} maxLength={120} defaultValue={adresse?.line1 ?? ''} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted sm:col-span-2">
          {m.line2}
          <input name="line2" maxLength={120} defaultValue={adresse?.line2 ?? ''} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          {m.postalCode}
          <input name="postalCode" required minLength={3} maxLength={12} defaultValue={adresse?.postal_code ?? ''} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          {m.city}
          <input name="city" required minLength={2} maxLength={80} defaultValue={adresse?.city ?? ''} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          {m.country}
          <select
            name="country"
            required
            value={country}
            onChange={e => setCountry(e.target.value)}
            className={inputClass}
          >
            {laender.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          {format(m.vatId, { suffix: vatPflicht ? m.vatRequired : vatMoeglich ? m.vatOptional : m.vatNotApplicable })}
          <input
            name="vatId"
            maxLength={20}
            defaultValue={vatId ?? ''}
            placeholder={vatMoeglich ? (country === 'DE' ? 'DE123456789' : `${country === 'GR' ? 'EL' : country}…`) : '—'}
            disabled={!vatMoeglich}
            className={`${inputClass} disabled:opacity-50`}
          />
          {vatId && vatIdStatus && (
            <span className="text-[11px] font-normal text-ink-muted">{format(m.vatStatus, {
              status: (m.vatStatusText as Record<string, string>)[vatIdStatus] ?? vatIdStatus,
            })}</span>
          )}
        </label>
      </div>

      {vatPflicht && (
        <p className="text-xs text-ink-soft">
          {m.vatHint}
        </p>
      )}

      {error && <p className="text-sm font-semibold text-critical-strong">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
        >
          {pending ? m.submitting : m.submit}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm font-semibold text-positive-strong">
            <CheckCircle2 className="h-4 w-4" /> {m.saved}
          </span>
        )}
      </div>
    </form>
  )
}
