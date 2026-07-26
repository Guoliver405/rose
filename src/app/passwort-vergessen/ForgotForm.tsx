'use client'

import { useState, useTransition } from 'react'
import { MailCheck } from 'lucide-react'
import { requestPasswordResetAction } from './actions'

export default function ForgotForm() {
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [pending, startTransition] = useTransition()

  if (sent) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-3 rounded-xl border border-positive-pill-edge bg-positive-tint p-4">
        <p className="flex items-center gap-2 font-bold text-positive-deep">
          <MailCheck className="h-5 w-5" /> E-Mail ist unterwegs
        </p>
        <p className="text-sm text-positive-deep">
          Falls es zu dieser Adresse ein Konto gibt, liegt gleich ein Link im
          Postfach. Er ist begrenzt gültig und muss in <strong>diesem</strong>{' '}
          Browser geöffnet werden.
        </p>
        <p className="text-xs text-ink-muted">
          Nichts angekommen? Auch den Spam-Ordner prüfen.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        setError(null)
        const formData = new FormData(e.currentTarget)
        startTransition(async () => {
          const res = await requestPasswordResetAction(formData)
          if (res.error) { setError(res.error); return }
          setSent(true)
        })
      }}
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-ink-soft">E-Mail</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-lg border border-edge bg-surface px-3 py-2.5 text-ink outline-none focus:border-active"
        />
      </label>

      {error && (
        <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-action px-4 py-3 font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
      >
        {pending ? 'Wird verschickt …' : 'Link zum Zurücksetzen senden'}
      </button>
    </form>
  )
}
