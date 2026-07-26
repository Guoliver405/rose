'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, Check, Copy, Loader2, Plus, Trash2, UserPlus } from 'lucide-react'
import {
  createHotelAction, createManagerAction, removeManagerAction,
  setManagerHotelsAction, type ManagerCredentials,
} from './actions'

export type AccountHotel = { id: string; name: string; slug: string }
export type AccountManager = { userId: string; displayName: string; hotelIds: string[] }

export default function KontoManager({
  accountName,
  plan,
  hotels,
  managers,
  roomsByHotel,
  billableByHotel,
}: {
  accountName: string
  plan: string
  hotels: AccountHotel[]
  managers: AccountManager[]
  /** Zimmer in Betrieb je Haus. */
  roomsByHotel: Record<string, number>
  /** Abrechenbare Zimmer im laufenden Monat je Haus. */
  billableByHotel: Record<string, number>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [showHotelForm, setShowHotelForm] = useState(false)
  const [showManagerForm, setShowManagerForm] = useState(false)
  const [credentials, setCredentials] = useState<ManagerCredentials | null>(null)
  const [copied, setCopied] = useState(false)

  const totalRooms = hotels.reduce((n, h) => n + (roomsByHotel[h.id] ?? 0), 0)
  const totalBillable = hotels.reduce((n, h) => n + (billableByHotel[h.id] ?? 0), 0)

  function run(fn: () => Promise<{ error?: string }>, after?: () => void) {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      after?.()
      router.refresh()
    })
  }

  const inputClass =
    'rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none'

  return (
    <div className="flex flex-col gap-6">
      {/* ── Plan ─────────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-edge bg-surface p-4">
        <h2 className="text-sm font-bold text-ink-soft">Konto</h2>
        <p className="mt-1 text-lg font-black text-ink">{accountName}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-surface-muted px-3 py-1 font-semibold text-ink-soft">
            Plan: {plan}
          </span>
          <span className="rounded-full bg-surface-muted px-3 py-1 font-semibold text-ink-soft">
            {hotels.length} {hotels.length === 1 ? 'Haus' : 'Häuser'}
          </span>
          <span className="rounded-full bg-surface-muted px-3 py-1 font-semibold text-ink-soft">
            {totalRooms} Zimmer in Betrieb
          </span>
          <span className="rounded-full bg-action-tint px-3 py-1 font-semibold text-action-strong">
            {totalBillable} abrechenbar (laufender Monat)
          </span>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Die Abrechnung erfolgt je Zimmer: gezählt wird jedes Zimmer, das im
          Monat <em>auch nur vorübergehend</em> in Betrieb war — ein mitten im
          Monat außer Betrieb genommenes Zimmer zählt also noch mit.
          Rechnungsstellung und Zahlungsdaten folgen; aktuell läuft das Konto
          ohne Berechnung.
        </p>
      </section>

      {error && (
        <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
          {error}
        </p>
      )}
      {notice && !error && (
        <p className="rounded-lg border border-positive-pill-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
          {notice}
        </p>
      )}

      {/* ── Häuser ───────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3 rounded-xl border border-edge bg-surface p-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-bold text-ink-soft">Häuser</h2>
          <button
            type="button"
            onClick={() => setShowHotelForm(v => !v)}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-action px-3 py-1.5 text-sm font-bold text-action-foreground hover:bg-action-strong"
          >
            <Plus className="h-4 w-4" /> Haus anlegen
          </button>
        </div>

        {showHotelForm && (
          <form
            onSubmit={e => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const form = e.currentTarget
              run(() => createHotelAction(fd), () => { form.reset(); setShowHotelForm(false) })
            }}
            className="flex flex-wrap items-end gap-2 rounded-lg border border-edge bg-surface-sunken p-3"
          >
            <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
              Name des Hauses
              <input name="name" required minLength={2} placeholder="z. B. Stadthotel Krone" className={`${inputClass} w-64`} />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
            >
              Anlegen
            </button>
            <p className="w-full text-xs text-ink-muted">
              Die Adresse wird aus dem Namen erzeugt und ist danach in den
              Einstellungen des Hauses änderbar.
            </p>
          </form>
        )}

        {hotels.length === 0 ? (
          <p className="text-sm text-ink-muted">Noch kein Haus angelegt.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {hotels.map(h => (
              <li key={h.id} className="flex items-center gap-3 rounded-lg border border-edge bg-surface-elevated px-3 py-2">
                <Building2 className="h-4 w-4 shrink-0 text-ink-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-ink">{h.name}</span>
                  <span className="block truncate font-mono text-xs text-ink-muted">/h/{h.slug}</span>
                </span>
                <span className="shrink-0 text-right text-xs font-semibold text-ink-muted">
                  {roomsByHotel[h.id] ?? 0} in Betrieb
                  {(billableByHotel[h.id] ?? 0) !== (roomsByHotel[h.id] ?? 0) && (
                    <span className="block text-action-strong">
                      {billableByHotel[h.id] ?? 0} abrechenbar
                    </span>
                  )}
                </span>
                <Link
                  href={`/h/${h.slug}/admin`}
                  className="shrink-0 rounded-lg border border-edge px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-edge-strong hover:text-ink"
                >
                  Öffnen
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Manager ──────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3 rounded-xl border border-edge bg-surface p-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-bold text-ink-soft">Manager</h2>
          <button
            type="button"
            onClick={() => { setShowManagerForm(v => !v); setCredentials(null) }}
            disabled={hotels.length === 0}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-action px-3 py-1.5 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" /> Manager anlegen
          </button>
        </div>

        <p className="text-xs text-ink-muted">
          Ein Manager verwaltet die ausgewählten Häuser vollständig — Zimmer,
          Personal, Services, Einstellungen. Auf dieses Konto (Plan, weitere
          Häuser, Manager) hat er keinen Zugriff.
        </p>

        {credentials && (
          <div className="rounded-lg border border-positive-pill-edge bg-positive-tint p-3">
            <p className="text-sm font-bold text-positive-deep">
              Zugang für {credentials.displayName} angelegt
            </p>
            <p className="mt-1 font-mono text-sm text-ink">{credentials.email}</p>
            <p className="font-mono text-sm text-ink">{credentials.password}</p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${credentials.email} / ${credentials.password}`)
                setCopied(true)
              }}
              className="mt-2 flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft hover:text-ink"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Kopiert' : 'Zugangsdaten kopieren'}
            </button>
            <p className="mt-2 text-xs text-positive-deep">
              Das Passwort wird nur jetzt angezeigt. Künftig sollen Zugänge per
              Einladungs-Mail vergeben werden.
            </p>
          </div>
        )}

        {showManagerForm && (
          <form
            onSubmit={e => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const form = e.currentTarget
              setError(null)
              startTransition(async () => {
                const res = await createManagerAction(fd)
                if (res.error) { setError(res.error); return }
                setCredentials(res.credentials ?? null)
                setCopied(false)
                form.reset()
                setShowManagerForm(false)
                router.refresh()
              })
            }}
            className="flex flex-col gap-3 rounded-lg border border-edge bg-surface-sunken p-3"
          >
            <div className="flex flex-wrap gap-2">
              <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
                Name
                <input name="displayName" required minLength={2} className={`${inputClass} w-48`} />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
                E-Mail
                <input name="email" type="email" required className={`${inputClass} w-64`} />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
                Passwort (mind. 8 Zeichen)
                <input name="password" required minLength={8} className={`${inputClass} w-48`} />
              </label>
            </div>
            <fieldset className="flex flex-wrap gap-3">
              <legend className="mb-1 text-xs font-semibold text-ink-muted">Häuser</legend>
              {hotels.map(h => (
                <label key={h.id} className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <input type="checkbox" name="hotelIds" value={h.id} className="h-4 w-4 accent-current" />
                  {h.name}
                </label>
              ))}
            </fieldset>
            <button
              type="submit"
              disabled={pending}
              className="self-start rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Anlegen'}
            </button>
          </form>
        )}

        {managers.length === 0 ? (
          <p className="text-sm text-ink-muted">Noch kein Manager angelegt.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {managers.map(m => (
              <li key={m.userId} className="flex flex-col gap-2 rounded-lg border border-edge bg-surface-elevated px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="flex-1 text-sm font-bold text-ink">{m.displayName}</span>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        setError(null)
                        const res = await removeManagerAction(m.userId)
                        if (res.error) { setError(res.error); return }
                        setNotice(
                          res.kept
                            ? `Zugang von ${m.displayName} entzogen. Der Datensatz bleibt für den Nachweis früherer Vorgänge bestehen.`
                            : `Zugang von ${m.displayName} entfernt.`,
                        )
                        router.refresh()
                      })
                    }
                    className="flex items-center gap-1.5 rounded-lg border border-critical-pill-edge px-3 py-1.5 text-xs font-semibold text-critical-strong hover:bg-critical-tint"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Zugang entziehen
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {hotels.map(h => {
                    const checked = m.hotelIds.includes(h.id)
                    return (
                      <label key={h.id} className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={pending}
                          onChange={() => {
                            const next = checked
                              ? m.hotelIds.filter(id => id !== h.id)
                              : [...m.hotelIds, h.id]
                            if (next.length === 0) {
                              setError('Ein Manager braucht mindestens ein Haus — sonst den Zugang entziehen.')
                              return
                            }
                            run(() => setManagerHotelsAction(m.userId, next))
                          }}
                          className="h-4 w-4 accent-current"
                        />
                        {h.name}
                      </label>
                    )
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
