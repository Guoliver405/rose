'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { IdCard, Loader2, Plus, Printer, Sparkles, Trash2, UserRound } from 'lucide-react'
import { createMaidAction, deleteMaidAction, issueMaidLoginCardAction } from './actions'

export type MaidRow = {
  id: string
  displayName: string
  username: string
  pin: string | null
  cleaningRoom: string | null
}

export default function PersonalManager({ maids }: { maids: MaidRow[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function runCreate(form: HTMLFormElement) {
    setError(null)
    setNotice(null)
    const formData = new FormData(form)
    startTransition(async () => {
      const res = await createMaidAction(formData)
      if (res.error) { setError(res.error); return }
      form.reset()
      setNotice(`${res.card!.displayName} angelegt — Karte kann jetzt gedruckt werden.`)
    })
  }

  function runIssueCard(profileId: string, name: string) {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const res = await issueMaidLoginCardAction(profileId)
      if (res.error) { setError(res.error); return }
      setNotice(`Neue Karte für ${name} erzeugt — die alte Karte (PIN + QR) ist ab sofort ungültig.`)
    })
  }

  function runDelete(profileId: string) {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const res = await deleteMaidAction(profileId)
      if (res.error) { setError(res.error); return }
      setConfirmDeleteId(null)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-black text-ink">Personal — Reinigungskräfte</h1>
        <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-ink-soft">
          {maids.length} {maids.length === 1 ? 'Kraft' : 'Kräfte'}
        </span>
      </div>

      {/* Anlegen */}
      <form
        onSubmit={e => { e.preventDefault(); runCreate(e.currentTarget) }}
        className="rounded-xl border border-edge bg-surface p-4"
      >
        <h2 className="mb-3 text-sm font-bold text-ink-soft">Neue Reinigungskraft anlegen</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
            Anzeigename
            <input
              name="displayName"
              required
              minLength={2}
              placeholder="z. B. Maria K."
              className="w-48 rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
            Benutzername (Login)
            <input
              name="username"
              required
              minLength={2}
              autoCapitalize="none"
              placeholder="z. B. maria"
              pattern="[a-zA-Z0-9._\-]+"
              title="Nur Buchstaben, Ziffern, Punkt, Unterstrich, Bindestrich"
              className="w-40 rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none"
            />
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
          PIN (6 Ziffern) und QR-Login-Karte werden automatisch erzeugt — danach über &bdquo;Karte drucken&ldquo; aushändigen.
        </p>
      </form>

      {error && (
        <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-lg border border-positive-pill-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
          {notice}
        </p>
      )}

      {/* Liste */}
      {maids.length === 0 ? (
        <div className="rounded-xl border border-edge bg-surface p-8 text-center">
          <UserRound className="mx-auto mb-2 h-8 w-8 text-ink-muted" />
          <p className="font-semibold text-ink">Noch keine Reinigungskräfte angelegt.</p>
          <p className="mt-1 text-sm text-ink-muted">
            Jede Kraft bekommt einen eigenen Zugang mit PIN und QR-Login-Karte fürs Reinigungsboard.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {maids.map(m => (
            <div key={m.id} className="rounded-xl border border-edge bg-surface px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-40">
                  <p className="font-bold text-ink">{m.displayName}</p>
                  <p className="font-mono text-xs text-ink-muted">@{m.username}</p>
                </div>

                {m.cleaningRoom && (
                  <span className="flex items-center gap-1 rounded-full bg-positive-pill px-3 py-1 text-xs font-semibold text-positive-deepest">
                    <Sparkles className="h-3.5 w-3.5" /> reinigt Zimmer {m.cleaningRoom}
                  </span>
                )}

                <div className="ml-auto flex items-center gap-2">
                  {m.pin ? (
                    <span className="rounded-lg bg-surface-muted px-3 py-1.5 font-mono text-sm font-bold tracking-[0.2em] text-ink-soft" title="Aktuelle PIN">
                      {m.pin}
                    </span>
                  ) : (
                    <span className="text-xs text-ink-muted">keine Karte</span>
                  )}

                  {m.pin && (
                    <Link
                      href={`/admin/personal/karte/${m.id}`}
                      className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink"
                    >
                      <Printer className="h-4 w-4" /> Karte drucken
                    </Link>
                  )}

                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => runIssueCard(m.id, m.displayName)}
                    title="Neue PIN + neuer QR-Code — alte Karte wird ungültig"
                    className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
                  >
                    <IdCard className="h-4 w-4" /> Neue Karte
                  </button>

                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setConfirmDeleteId(m.id)}
                    className="rounded-lg border border-critical-pill-edge p-1.5 text-critical-strong hover:bg-critical-tint disabled:opacity-50"
                    aria-label={`${m.displayName} löschen`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {confirmDeleteId === m.id && (
                <div className="mt-3 rounded-lg border border-edge bg-surface-sunken p-3">
                  <p className="text-sm font-semibold text-ink">
                    {m.displayName} wirklich löschen? Login und Karte werden sofort ungültig,
                    auch die Tätigkeits-Historie wird entfernt.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => runDelete(m.id)}
                      className="rounded-lg bg-critical px-3 py-1.5 text-sm font-bold text-critical-foreground disabled:opacity-50"
                    >
                      {pending ? 'Löschen …' : 'Ja, löschen'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
