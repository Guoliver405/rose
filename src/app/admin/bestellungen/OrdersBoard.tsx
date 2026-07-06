'use client'

import { useState, useTransition } from 'react'
import { Check, ChevronDown, ClipboardList, Siren } from 'lucide-react'
import { formatCents } from '@/lib/money'
import { markOrderDoneAction } from './actions'

export type OrderRow = {
  id: string
  roomNumber: string
  serviceName: string
  urgent: boolean
  items: { label: string; price_cents: number | null }[]
  note: string | null
  createdAt: string
  doneAt: string | null
  doneBy: string | null
}

function ageLabel(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return 'gerade eben'
  if (mins < 60) return `vor ${mins} Min.`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `vor ${hours} Std.`
  return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function OrdersBoard({ open, done }: { open: OrderRow[]; done: OrderRow[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showDone, setShowDone] = useState(false)

  function runDone(orderId: string) {
    setError(null)
    startTransition(async () => {
      const res = await markOrderDoneAction(orderId)
      if (res.error) setError(res.error)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-black text-ink">Bestellungen</h1>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
          open.length > 0 ? 'bg-attention-pill text-attention-deepest' : 'bg-positive-pill text-positive-deepest'
        }`}>
          {open.length} offen
        </span>
      </div>

      {error && (
        <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
          {error}
        </p>
      )}

      {open.length === 0 ? (
        <div className="rounded-xl border border-edge bg-surface p-8 text-center">
          <ClipboardList className="mx-auto mb-2 h-8 w-8 text-ink-muted" />
          <p className="font-semibold text-ink">Keine offenen Bestellungen.</p>
          <p className="mt-1 text-sm text-ink-muted">
            Neue Bestellungen aus dem Gast-Portal erscheinen hier sofort.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {open.map(o => (
            <div
              key={o.id}
              className={`rounded-xl border bg-surface px-4 py-3 ${
                o.urgent ? 'border-critical blink-ring-overdue' : 'border-edge'
              }`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-lg bg-surface-muted px-3 py-1.5 text-lg font-black text-ink">
                  {o.roomNumber}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-bold text-ink">
                    {o.serviceName}
                    {o.urgent && (
                      <span className="flex items-center gap-1 rounded-full bg-critical-pill px-2 py-0.5 text-xs font-bold text-critical-deepest">
                        <Siren className="h-3.5 w-3.5" /> dringend
                      </span>
                    )}
                  </p>
                  {o.items.length > 0 && (
                    <p className="text-sm text-ink-soft">
                      {o.items.map(i =>
                        i.price_cents !== null ? `${i.label} (${formatCents(i.price_cents)})` : i.label,
                      ).join(' · ')}
                    </p>
                  )}
                  {o.note && <p className="mt-0.5 text-sm italic text-ink-muted">&bdquo;{o.note}&ldquo;</p>}
                </div>
                <span className="text-sm text-ink-muted">{ageLabel(o.createdAt)}</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => runDone(o.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-positive px-4 py-2 font-bold text-positive-foreground hover:opacity-90 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> Erledigt
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setShowDone(v => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showDone ? 'rotate-180' : ''}`} />
            Zuletzt erledigt ({done.length})
          </button>
          {showDone && (
            <ul className="mt-2 flex flex-col gap-1.5">
              {done.map(o => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink-soft"
                >
                  <span className="font-bold text-ink">{o.roomNumber}</span>
                  <span>{o.serviceName}</span>
                  {o.items.length > 0 && (
                    <span className="text-ink-muted">({o.items.map(i => i.label).join(', ')})</span>
                  )}
                  <span className="ml-auto text-ink-muted">
                    {o.doneAt ? ageLabel(o.doneAt) : ''}{o.doneBy ? ` · ${o.doneBy}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
