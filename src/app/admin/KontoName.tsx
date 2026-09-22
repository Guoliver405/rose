'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Pencil, X } from 'lucide-react'
import { renameAccountAction } from './actions'

const inputClass =
  'rounded-lg border border-edge bg-surface-elevated px-3 py-1.5 text-lg font-black text-ink focus:border-action focus:outline-none'

/**
 * Name des Kontos im Konto-Kasten — mit Stift zum Umbenennen.
 *
 * Der Kontoname entsteht bei der Registrierung als Kopie des ersten
 * Hausnamens und war danach nirgends änderbar: wer sein Haus unter
 * „Hotel & Regeln" umbenannte, sah hier weiter den alten Namen stehen
 * (Rückmeldung 22.09.2026). Deshalb an Ort und Stelle editierbar.
 */
export default function KontoName({ name }: { name: string }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (!editing) {
    return (
      <div className="mt-1 flex items-center gap-2">
        <p className="text-lg font-black text-ink">{name}</p>
        <button
          type="button"
          onClick={() => { setEditing(true); setError(null) }}
          aria-label="Konto umbenennen"
          title="Konto umbenennen"
          className="rounded-md p-1 text-ink-muted hover:bg-surface-muted hover:text-ink"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        setError(null)
        startTransition(async () => {
          const res = await renameAccountAction(fd)
          if (res.error) { setError(res.error); return }
          setEditing(false)
          router.refresh()
        })
      }}
      className="mt-1 flex flex-col gap-1"
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="name"
          defaultValue={name}
          required
          minLength={2}
          maxLength={80}
          autoFocus
          autoComplete="organization"
          className={`${inputClass} w-72`}
        />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1 rounded-lg bg-action px-3 py-1.5 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
        >
          <Check className="h-4 w-4" /> Speichern
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setEditing(false)}
          className="flex items-center gap-1 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong"
        >
          <X className="h-4 w-4" /> Abbrechen
        </button>
      </div>
      <p className="text-xs text-ink-muted">
        Der Kontoname ist unabhängig vom Namen der Häuser — beim Anlegen wurde der
        Name des ersten Hauses übernommen. Die Häuser selbst benennen Sie unter
        Einstellungen → Hotel &amp; Regeln um.
      </p>
      {error && (
        <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
          {error}
        </p>
      )}
    </form>
  )
}
