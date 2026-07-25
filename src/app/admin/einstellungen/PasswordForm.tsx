'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, KeyRound } from 'lucide-react'
import { changePasswordAction } from './actions'

export default function PasswordForm() {
  const [pending, startTransition] = useTransition()
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSaved, setPwSaved] = useState(false)

  function submitPassword(form: HTMLFormElement) {
    setPwError(null)
    setPwSaved(false)
    const formData = new FormData(form)
    startTransition(async () => {
      const res = await changePasswordAction(formData)
      if (res.error) { setPwError(res.error); return }
      form.reset()
      setPwSaved(true)
    })
  }

  const inputClass =
    'rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none'

  return (
    <form
      onSubmit={e => { e.preventDefault(); submitPassword(e.currentTarget) }}
      className="flex flex-col gap-4 rounded-xl border border-edge bg-surface p-4"
    >
      <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink-soft">
        <KeyRound className="h-4 w-4" /> Passwort ändern
      </h2>
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Neues Passwort (min. 8 Zeichen)
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className={`${inputClass} w-64`} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Wiederholen
          <input name="passwordConfirm" type="password" required minLength={8} autoComplete="new-password" className={`${inputClass} w-64`} />
        </label>
      </div>

      {pwError && (
        <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
          {pwError}
        </p>
      )}
      {pwSaved && !pwError && (
        <p className="flex items-center gap-1.5 rounded-lg border border-positive-pill-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
          <CheckCircle2 className="h-4 w-4" /> Passwort geändert — gilt ab der nächsten Anmeldung.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 self-start rounded-lg border border-edge px-4 py-2 text-sm font-bold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
      >
        Passwort ändern
      </button>
    </form>
  )
}
