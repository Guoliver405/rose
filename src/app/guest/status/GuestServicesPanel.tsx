'use client'

import { useState, useTransition } from 'react'
import { Check, CheckCircle2, ChevronDown, Clock } from 'lucide-react'
import { formatCents } from '@/lib/money'
import { placeOrderAction } from '../actions'

export type GuestService = {
  id: string
  name: string
  description: string | null
  items: { id: string; label: string; priceCents: number | null }[]
}

export type GuestOrder = {
  id: string
  serviceName: string
  itemLabels: string[]
  status: 'open' | 'done'
  createdAt: string
}

export default function GuestServicesPanel({
  services,
  orders,
}: {
  services: GuestService[]
  orders: GuestOrder[]
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (services.length === 0 && orders.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {services.length > 0 && (
        <h2 className="mt-2 text-sm font-bold uppercase tracking-wider text-ink-muted">
          Service bestellen
        </h2>
      )}
      {services.map(s => (
        <ServiceCard
          key={s.id}
          service={s}
          open={openId === s.id}
          onToggle={() => setOpenId(openId === s.id ? null : s.id)}
        />
      ))}

      {orders.length > 0 && (
        <>
          <h2 className="mt-2 text-sm font-bold uppercase tracking-wider text-ink-muted">
            Deine Bestellungen
          </h2>
          <ul className="flex flex-col gap-2">
            {orders.map(o => (
              <li
                key={o.id}
                className="flex items-center gap-3 rounded-xl border border-edge bg-surface-elevated px-4 py-3"
              >
                {o.status === 'done'
                  ? <CheckCircle2 className="h-5 w-5 shrink-0 text-positive-strong" />
                  : <Clock className="h-5 w-5 shrink-0 text-attention-strong" />}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-ink">
                    {o.serviceName}
                    {o.itemLabels.length > 0 && (
                      <span className="font-normal text-ink-muted"> — {o.itemLabels.join(', ')}</span>
                    )}
                  </span>
                  <span className="block text-xs text-ink-muted">
                    {new Date(o.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {o.status === 'done' ? 'erledigt' : 'in Bearbeitung'}
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

function ServiceCard({
  service,
  open,
  onToggle,
}: {
  service: GuestService
  open: boolean
  onToggle: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
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
      setSelected(new Set())
      setNote('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-edge bg-surface-elevated">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold text-ink">{service.name}</span>
          {service.description && (
            <span className="block text-sm text-ink-muted">{service.description}</span>
          )}
        </span>
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
                    {formatCents(item.priceCents)}
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
            placeholder="Anmerkung (optional)"
            className="w-full rounded-xl border border-edge bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-action focus:outline-none"
          />

          {error && (
            <p className="rounded-xl border border-critical-pill-edge bg-critical-pill px-4 py-3 text-sm font-semibold text-critical-deepest">
              {error}
            </p>
          )}
          {success && (
            <p className="flex items-center gap-2 rounded-xl border border-positive-pill-edge bg-positive-pill px-4 py-3 text-sm font-bold text-positive-deepest">
              <CheckCircle2 className="h-5 w-5 shrink-0" /> Bestellung ist bei der Rezeption.
            </p>
          )}

          <button
            type="button"
            disabled={pending || (service.items.length > 0 && selected.size === 0)}
            onClick={submit}
            className="rounded-xl bg-action px-4 py-3 font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
          >
            {pending ? 'Wird gesendet …' : 'Bestellen'}
          </button>
        </div>
      )}
    </div>
  )
}
