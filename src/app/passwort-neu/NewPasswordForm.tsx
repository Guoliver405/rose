'use client'

import { useState, useTransition } from 'react'
import { setNewPasswordAction } from './actions'

const feldKlasse =
  'rounded-lg border border-edge bg-surface px-3 py-2.5 text-ink outline-none focus:border-active'

export default function NewPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        setError(null)
        const formData = new FormData(e.currentTarget)
        startTransition(async () => {
          // Erfolg = redirect() serverseitig, hier kommt dann nichts mehr an.
          const res = await setNewPasswordAction(formData)
          if (res?.error) setError(res.error)
        })
      }}
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-ink-soft">Neues Passwort</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={feldKlasse}
        />
        <span className="text-xs text-ink-muted">Mindestens 8 Zeichen.</span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-ink-soft">Wiederholen</span>
        <input
          name="passwordConfirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={feldKlasse}
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
        {pending ? 'Wird gespeichert …' : 'Passwort speichern'}
      </button>
    </form>
  )
}
