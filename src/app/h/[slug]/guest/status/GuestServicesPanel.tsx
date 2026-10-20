'use client'

import { useState, useTransition } from 'react'
import { Check, CheckCircle2, ChevronDown, Clock, ExternalLink, XCircle } from 'lucide-react'
import { formatMinor } from '@/lib/money'
import { placeOrderAction } from '@/app/guest/actions'
import { format } from '@/lib/i18n/format'
import type { GuestMessages } from '@/lib/i18n'

export type GuestService = {
  id: string
  name: string
  description: string | null
  /** Meldung ans Haus (Defekt) statt bestellbarer Leistung — der Knopf heißt dann „Melden“. */
  maintenance: boolean
  items: { id: string; label: string; priceCents: number | null }[]
  /** Preis des Service als Ganzes — gilt nur ohne Optionen (20.10.2026). */
  priceCents: number | null
}

/** Verweis: Kachel, die einen Link nach außen öffnet — Trinkgeld-App, Lieferdienst. Keine Bestellung. */
export type GuestLink = {
  id: string
  name: string
  description: string | null
  url: string
}

export type GuestOrder = {
  id: string
  serviceName: string
  itemLabels: string[]
  status: 'open' | 'done' | 'cancelled'
  createdAt: string
}

export default function GuestServicesPanel({
  services,
  links,
  orders,
  m,
  intlLocale,
  currency,
}: {
  services: GuestService[]
  links: GuestLink[]
  orders: GuestOrder[]
  m: GuestMessages['services']
  /** Sprach-Tag für Uhrzeiten und Preise („de-DE“). */
  intlLocale: string
  /** Währung der Service-Preise des Hauses (ISO 4217). */
  currency: string
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (services.length === 0 && links.length === 0 && orders.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {services.length > 0 && (
        <h2 className="mt-2 text-sm font-bold uppercase tracking-wider text-ink-muted">
          {m.heading}
        </h2>
      )}
      {services.map(s => (
        <ServiceCard
          key={s.id}
          service={s}
          open={openId === s.id}
          m={m}
          intlLocale={intlLocale}
          currency={currency}
          onToggle={() => setOpenId(openId === s.id ? null : s.id)}
        />
      ))}

      {/* Verweise: öffnen nach außen, in einem neuen Tab. Bewusst verlinkt statt
          eingebettet — ein fremdes Widget brächte fremde Skripte und Cookies
          ins Portal. */}
      {links.length > 0 && (
        <>
          <h2 className="mt-2 text-sm font-bold uppercase tracking-wider text-ink-muted">
            {m.links}
          </h2>
          {links.map(l => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border-2 border-edge bg-surface-elevated px-5 py-4 text-left hover:border-edge-strong"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-bold text-ink">{l.name}</span>
                {l.description && <span className="block text-sm text-ink-muted">{l.description}</span>}
                <span className="mt-0.5 block truncate text-xs text-ink-muted">{format(m.opensExternally, { host: hostOf(l.url) })}</span>
              </span>
              <ExternalLink className="h-5 w-5 shrink-0 text-ink-muted" />
            </a>
          ))}
        </>
      )}

      {orders.length > 0 && (
        <>
          <h2 className="mt-2 text-sm font-bold uppercase tracking-wider text-ink-muted">
            {m.orders}
          </h2>
          <ul className="flex flex-col gap-2">
            {orders.map(o => (
              <li
                key={o.id}
                className="flex items-center gap-3 rounded-xl border border-edge bg-surface-elevated px-4 py-3"
              >
                {o.status === 'done'
                  ? <CheckCircle2 className="h-5 w-5 shrink-0 text-positive-strong" />
                  : o.status === 'cancelled'
                    ? <XCircle className="h-5 w-5 shrink-0 text-ink-muted" />
                    : <Clock className="h-5 w-5 shrink-0 text-attention-strong" />}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-ink">
                    {o.serviceName}
                    {o.itemLabels.length > 0 && (
                      <span className="font-normal text-ink-muted"> — {o.itemLabels.join(', ')}</span>
                    )}
                  </span>
                  <span className="block text-xs text-ink-muted">
                    {new Date(o.createdAt).toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {m.orderStatus[o.status]}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

/** Nur der Host des Ziels — der Gast soll sehen, wohin es geht, nicht eine Zeile Parameter. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function ServiceCard({
  service,
  open,
  onToggle,
  m,
  intlLocale,
  currency,
}: {
  service: GuestService
  open: boolean
  onToggle: () => void
  m: GuestMessages['services']
  /** Preise im Format der Sprache des Gastes („$“-Stellung, Dezimalzeichen). */
  intlLocale: string
  currency: string
}) {
  const [pending, startTransition] = useTransition()
  // Genau eine Option: vorausgewählt — sonst bliebe „Bestellen“ ohne
  // erkennbaren Grund grau, bis der Gast die einzige Möglichkeit ankreuzt.
  const initial = () => new Set(service.items.length === 1 ? [service.items[0].id] : [])
  const [selected, setSelected] = useState<Set<string>>(initial)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function toggleItem(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function submit() {
    setError(null)
    startTransition(async () => {
      const res = await placeOrderAction(service.id, [...selected], note)
      if (res.error) { setError(res.error); return }
      setSelected(initial())
      setNote('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-edge bg-surface-elevated">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold text-ink">{service.name}</span>
          {service.description && (
            <span className="block text-sm text-ink-muted">{service.description}</span>
          )}
        </span>
        {service.items.length === 0 && service.priceCents !== null && (
          <span className="shrink-0 text-sm font-semibold text-ink-muted">
            {formatMinor(service.priceCents, currency, intlLocale)}
          </span>
        )}
        <ChevronDown className={`h-5 w-5 shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="flex flex-col gap-3 border-t border-edge px-5 py-4">
          {service.items.map(item => {
            const active = selected.has(item.id)
            return (
              <button
                key={item.id}
                type="button"
                disabled={pending}
                aria-pressed={active}
                onClick={() => toggleItem(item.id)}
                className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left disabled:opacity-50 ${
                  active
                    ? 'border-action bg-action text-action-foreground'
                    : 'border-edge bg-surface text-ink hover:border-edge-strong'
                }`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${active ? 'border-current' : 'border-edge-strong'}`}>
                  {active && <Check className="h-4 w-4" />}
                </span>
                <span className="flex-1 text-sm font-bold">{item.label}</span>
                {item.priceCents !== null && (
                  <span className={`text-sm font-semibold ${active ? '' : 'text-ink-muted'}`}>
                    {formatMinor(item.priceCents, currency, intlLocale)}
                  </span>
                )}
              </button>
            )
          })}

          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder={m.notePlaceholder}
            className="w-full rounded-xl border border-edge bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-action focus:outline-none"
          />

          {error && (
            <p className="rounded-xl border border-critical-pill-edge bg-critical-pill px-4 py-3 text-sm font-semibold text-critical-deepest">
              {error}
            </p>
          )}
          {success && (
            <p className="flex items-center gap-2 rounded-xl border border-positive-pill-edge bg-positive-pill px-4 py-3 text-sm font-bold text-positive-deepest">
              <CheckCircle2 className="h-5 w-5 shrink-0" /> {m.sent}
            </p>
          )}

          <button
            type="button"
            disabled={pending || (service.items.length > 0 && selected.size === 0)}
            onClick={submit}
            className="rounded-xl bg-action px-4 py-3 font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
          >
            {pending ? m.sending : service.maintenance ? m.report : m.order}
          </button>
        </div>
      )}
    </div>
  )
}
