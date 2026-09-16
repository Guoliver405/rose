'use client'

import { useRef, useState, useTransition } from 'react'
import { Archive, ExternalLink, Hammer, Link2, Loader2, Plus, Siren, Sparkles, Wrench } from 'lucide-react'
import { formatCents } from '@/lib/money'
import { SERVICE_LINK_TEMPLATES, type ServiceLinkTemplate } from '@/lib/service-link-templates'
import {
  archiveServiceAction, archiveServiceItemAction, createExampleServicesAction,
  createServiceAction, createServiceItemAction, setServiceMaintenanceAction, setServiceUrgentAction,
  updateServiceLinkAction,
} from './actions'

export type ServiceRow = {
  id: string
  name: string
  description: string | null
  urgent: boolean
  /** Meldung ans Haus (Defekt): gehört zum Zimmer, nicht zum Aufenthalt. */
  maintenance: boolean
  /** Verweis: Kachel mit Link nach außen, keine Bestellung. Nicht null = Verweis. */
  linkUrl: string | null
  items: { id: string; label: string; priceCents: number | null }[]
}

type Kind = 'order' | 'link'

export default function ServicesManager({ hotelSlug, services }: { hotelSlug: string; services: ServiceRow[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null)
  const [kind, setKind] = useState<Kind>('order')
  const [templateHint, setTemplateHint] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  /** Vorlage füllt nur das Formular vor — angelegt wird erst mit „Anlegen". */
  function applyTemplate(t: ServiceLinkTemplate) {
    setKind('link')
    setTemplateHint(t.hinweis)
    const form = formRef.current
    if (!form) return
    const set = (name: string, value: string) => {
      const el = form.elements.namedItem(name)
      if (el instanceof HTMLInputElement) el.value = value
    }
    set('name', t.name)
    set('description', t.description)
    set('link_url', t.url)
    const urlField = form.elements.namedItem('link_url')
    if (urlField instanceof HTMLInputElement) urlField.focus()
  }

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
        ref={formRef}
        data-lotse="services.anlegen"
        onSubmit={e => {
          e.preventDefault()
          const form = e.currentTarget
          const formData = new FormData(form)
          run(() => createServiceAction(hotelSlug, formData), () => { form.reset(); setTemplateHint(null) })
        }}
        className="rounded-xl border border-edge bg-surface p-4"
      >
        <h2 className="mb-3 text-sm font-bold text-ink-soft">Neuen Service anlegen</h2>
        {/* Art: bestellbar (Anfrage an die Rezeption) oder Verweis (Link nach außen). */}
        <input type="hidden" name="kind" value={kind} />
        <div className="mb-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Art des Services">
          {([['order', 'Bestellbar'], ['link', 'Verweis (Link)']] as [Kind, string][]).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => { setKind(k); if (k === 'order') setTemplateHint(null) }}
              className={`rounded-lg border px-3 py-1.5 text-sm font-bold transition-colors ${
                kind === k
                  ? 'border-action bg-action text-action-foreground'
                  : 'border-edge bg-surface-elevated text-ink-soft hover:border-edge-strong'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {kind === 'link' && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
            <span className="font-semibold text-ink-soft">Vorlagen:</span>
            {SERVICE_LINK_TEMPLATES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t)}
                title={t.region}
                className="rounded-full border border-edge bg-surface-elevated px-2.5 py-1 font-semibold text-ink-soft hover:border-edge-strong hover:text-ink"
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
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
          {kind === 'link' ? (
            <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
              Adresse (Link)
              <input
                name="link_url"
                type="url"
                required
                inputMode="url"
                placeholder="https://…"
                className="w-80 rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none"
              />
            </label>
          ) : (
            <>
              <label className="flex items-center gap-2 pb-2 text-sm font-semibold text-ink-soft">
                <input type="checkbox" name="urgent" className="h-4 w-4 accent-current" />
                Dringend
              </label>
              <label className="flex items-center gap-2 pb-2 text-sm font-semibold text-ink-soft">
                <input type="checkbox" name="maintenance" className="h-4 w-4 accent-current" />
                Meldung ans Haus
              </label>
            </>
          )}
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-1.5 rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Anlegen
          </button>
        </div>
        <div className="mt-2 flex flex-col gap-1 text-xs text-ink-muted">
          {kind === 'link' ? (
            <>
              {templateHint && (
                <p className="rounded-lg border border-attention-tint-edge bg-attention-tint px-3 py-2 font-semibold text-attention-deepest">
                  {templateHint}
                </p>
              )}
              <p>
                Ein <span className="font-semibold text-ink-soft">Verweis</span> ist eine Kachel im
                Gastportal, die einen Link nach außen öffnet — Trinkgeld-App für das Housekeeping-Team,
                Lieferdienst, Taxi. Er erzeugt keine Anfrage und erscheint weder auf dem Board der
                Rezeption noch auf der Check-out-Aufstellung. Für Inhalt und Datenschutz des Ziels ist
                der Anbieter verantwortlich; das Portal bettet nichts ein, es verlinkt nur.
              </p>
            </>
          ) : (
            <>
              <p>
                Dringende Bestellungen werden der Rezeption hervorgehoben. Auswahl-Optionen
                (mit optionalem Preis) kommen pro Service dazu.
              </p>
              <p>
                <span className="font-semibold text-ink-soft">Meldung ans Haus</span> ist für
                Defekte und Instandhaltung gedacht — etwas am Zimmer, nicht am Aufenthalt.
                Solche Anfragen bleiben beim Check-out offen (ein Defekt verschwindet nicht
                mit dem Gast), erscheinen auf keiner Check-out-Aufstellung und warnen beim
                nächsten Check-in.
              </p>
            </>
          )}
        </div>
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
          <button
            data-lotse="services.beispiele"
            type="button"
            disabled={pending}
            onClick={() => run(() => createExampleServicesAction(hotelSlug))}
            className="mx-auto mt-4 flex items-center gap-1.5 rounded-lg border border-edge px-4 py-2 text-sm font-bold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" /> Beispiel-Services anlegen
          </button>
        </div>
      ) : (
        services.map((s, i) => (
          <section
            key={s.id}
            data-lotse={i === 0 ? 'services.liste' : undefined}
            className="rounded-xl border border-edge bg-surface p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-ink">{s.name}</h2>
              {s.urgent && (
                <span className="flex items-center gap-1 rounded-full bg-critical-pill px-2.5 py-0.5 text-xs font-bold text-critical-deepest">
                  <Siren className="h-3.5 w-3.5" /> dringend
                </span>
              )}
              {s.maintenance && (
                <span className="flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-bold text-ink-soft">
                  <Hammer className="h-3.5 w-3.5" /> Meldung ans Haus
                </span>
              )}
              {s.linkUrl && (
                <span className="flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-bold text-ink-soft">
                  <Link2 className="h-3.5 w-3.5" /> Verweis
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                {!s.linkUrl && (
                  <>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => setServiceUrgentAction(hotelSlug, s.id, !s.urgent))}
                      className="rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
                    >
                      {s.urgent ? 'Dringend aus' : 'Dringend an'}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => setServiceMaintenanceAction(hotelSlug, s.id, !s.maintenance))}
                      className="rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
                    >
                      {s.maintenance ? 'Keine Meldung' : 'Als Meldung'}
                    </button>
                  </>
                )}
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
                    onClick={() => run(() => archiveServiceAction(hotelSlug, s.id), () => setConfirmArchiveId(null))}
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

            {s.linkUrl ? (
              /* Verweis: keine Optionen — nur die Adresse, änderbar. */
              <form
                onSubmit={e => {
                  e.preventDefault()
                  const url = (new FormData(e.currentTarget).get('link_url') as string) ?? ''
                  run(() => updateServiceLinkAction(hotelSlug, s.id, url))
                }}
                className="mt-3 flex flex-wrap items-end gap-2"
              >
                <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold text-ink-muted">
                  Adresse
                  <input
                    name="link_url"
                    type="url"
                    required
                    defaultValue={s.linkUrl}
                    className="w-full rounded-lg border border-edge bg-surface-elevated px-3 py-1.5 text-sm font-semibold text-ink focus:border-action focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
                >
                  Adresse speichern
                </button>
                <a
                  href={s.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink"
                >
                  <ExternalLink className="h-4 w-4" /> Testen
                </a>
              </form>
            ) : (
            <>
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
                    onClick={() => run(() => archiveServiceItemAction(hotelSlug, item.id))}
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
                run(() => createServiceItemAction(hotelSlug, s.id, formData), () => form.reset())
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
            </>
            )}
          </section>
        ))
      )}
    </div>
  )
}
