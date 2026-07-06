'use client'

import { useState, useTransition } from 'react'
import { Archive, Loader2, Plus, Siren, Wrench } from 'lucide-react'
import { formatCents } from '@/lib/money'
import {
  archiveServiceAction, archiveServiceItemAction, createServiceAction,
  createServiceItemAction, setServiceUrgentAction,
} from './actions'

export type ServiceRow = {
  id: string
  name: string
  description: string | null
  urgent: boolean
  items: { id: string; label: string; priceCents: number | null }[]
}

export default function ServicesManager({ services }: { services: ServiceRow[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null)

  function run(action: () => Promise<{ error?: string }>, onDone?: () => void) {
    setError(null)
    startTransition(async () => {
      const res = await action()
      if (res.error) { setError(res.error); return }
      onDone?.()
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-black text-ink">Service-Baukasten</h1>
        <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-ink-soft">
          {services.length} {services.length === 1 ? 'Service' : 'Services'}
        </span>
      </div>

      {/* Anlegen */}
      <form
        onSubmit={e => {
          e.preventDefault()
          const form = e.currentTarget
          const formData = new FormData(form)
          run(() => createServiceAction(formData), () => form.reset())
        }}
        className="rounded-xl border border-edge bg-surface p-4"
      >
        <h2 className="mb-3 text-sm font-bold text-ink-soft">Neuen Service anlegen</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
            Name
            <input
              name="name"
              required
              minLength={2}
              placeholder="z. B. Extra Handtücher"
              className="w-52 rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
            Beschreibung (optional)
            <input
              name="description"
              placeholder="Kurzer Hinweis für den Gast"
              className="w-64 rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm font-semibold text-ink-soft">
            <input type="checkbox" name="urgent" className="h-4 w-4 accent-current" />
            Dringend
          </label>
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-1.5 rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Anlegen
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Dringende Bestellungen werden der Rezeption hervorgehoben. Auswahl-Optionen (mit optionalem Preis) kommen pro Service dazu.
        </p>
      </form>

      {error && (
        <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
          {error}
        </p>
      )}

      {services.length === 0 ? (
        <div className="rounded-xl border border-edge bg-surface p-8 text-center">
          <Wrench className="mx-auto mb-2 h-8 w-8 text-ink-muted" />
          <p className="font-semibold text-ink">Noch keine Services angelegt.</p>
          <p className="mt-1 text-sm text-ink-muted">
            Gäste sehen den Baukasten in ihrem Portal und bestellen mit einem Tipp.
          </p>
        </div>
      ) : (
        services.map(s => (
          <section key={s.id} className="rounded-xl border border-edge bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-ink">{s.name}</h2>
              {s.urgent && (
                <span className="flex items-center gap-1 rounded-full bg-critical-pill px-2.5 py-0.5 text-xs font-bold text-critical-deepest">
                  <Siren className="h-3.5 w-3.5" /> dringend
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => setServiceUrgentAction(s.id, !s.urgent))}
                  className="rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
                >
                  {s.urgent ? 'Dringend aus' : 'Dringend an'}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setConfirmArchiveId(s.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
                >
                  <Archive className="h-4 w-4" /> Archivieren
                </button>
              </div>
            </div>
            {s.description && <p className="mt-1 text-sm text-ink-muted">{s.description}</p>}

            {confirmArchiveId === s.id && (
              <div className="mt-3 rounded-lg border border-edge bg-surface-sunken p-3">
                <p className="text-sm font-semibold text-ink">
                  &bdquo;{s.name}&ldquo; archivieren? Der Service verschwindet aus dem Gast-Portal;
                  bestehende Bestellungen bleiben erhalten.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => archiveServiceAction(s.id), () => setConfirmArchiveId(null))}
                    className="rounded-lg bg-action px-3 py-1.5 text-sm font-bold text-action-foreground disabled:opacity-50"
                  >
                    Ja, archivieren
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmArchiveId(null)}
                    className="rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}

            {/* Items */}
            <div className="mt-3 flex flex-wrap gap-2">
              {s.items.map(item => (
                <span
                  key={item.id}
                  className="group flex items-center gap-2 rounded-full border border-edge bg-surface-elevated px-3 py-1.5 text-sm font-semibold text-ink"
                >
                  {item.label}
                  {item.priceCents !== null && (
                    <span className="text-ink-muted">{formatCents(item.priceCents)}</span>
                  )}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => archiveServiceItemAction(item.id))}
                    title="Option archivieren"
                    aria-label={`${item.label} archivieren`}
                    className="text-ink-muted hover:text-critical-strong disabled:opacity-50"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
              {s.items.length === 0 && (
                <span className="text-sm text-ink-muted">
                  Keine Optionen — der Gast bestellt den Service als Ganzes.
                </span>
              )}
            </div>

            {/* Item hinzufügen */}
            <form
              onSubmit={e => {
                e.preventDefault()
                const form = e.currentTarget
                const formData = new FormData(form)
                run(() => createServiceItemAction(s.id, formData), () => form.reset())
              }}
              className="mt-3 flex flex-wrap items-end gap-2"
            >
              <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
                Option
                <input
                  name="label"
                  required
                  placeholder="z. B. Handtuch groß"
                  className="w-44 rounded-lg border border-edge bg-surface-elevated px-3 py-1.5 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
                Preis € (optional)
                <input
                  name="price"
                  inputMode="decimal"
                  placeholder="4,50"
                  className="w-24 rounded-lg border border-edge bg-surface-elevated px-3 py-1.5 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none"
                />
              </label>
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-1 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Hinzufügen
              </button>
            </form>
          </section>
        ))
      )}
    </div>
  )
}
