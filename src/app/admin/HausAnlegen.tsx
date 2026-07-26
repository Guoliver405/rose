'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { createHotelAction } from './actions'

/**
 * „Haus anlegen" auf der Häuser-Seite — der einzige interaktive Teil dort.
 *
 * Bewusst als eigene Client-Komponente: die Haus-Kacheln bleiben damit
 * server-gerendert und behalten ihr Lagebild ohne Umweg über Props.
 */
export default function HausAnlegen() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setError(null) }}
        className="flex items-center gap-1.5 self-start rounded-lg bg-action px-3 py-1.5 text-sm font-bold text-action-foreground hover:bg-action-strong"
      >
        <Plus className="h-4 w-4" /> Haus anlegen
      </button>

      {error && (
        <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
          {error}
        </p>
      )}

      {open && (
        <form
          onSubmit={e => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const form = e.currentTarget
            setError(null)
            startTransition(async () => {
              const res = await createHotelAction(fd)
              if (res.error) { setError(res.error); return }
              form.reset()
              setOpen(false)
              router.refresh()
            })
          }}
          className="flex flex-wrap items-end gap-2 rounded-xl border border-edge bg-surface p-3"
        >
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
            Name des Hauses
            <input
              name="name"
              required
              minLength={2}
              placeholder="z. B. Stadthotel Krone"
              className="w-64 rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-1.5 rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Anlegen
          </button>
          <p className="w-full text-xs text-ink-muted">
            Die Adresse wird aus dem Namen erzeugt und ist danach unter
            Einstellungen → Hotel &amp; Regeln änderbar. Beispiel-Services werden
            mit angelegt.
          </p>
        </form>
      )}
    </div>
  )
}
