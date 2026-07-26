'use client'

import { useState, useTransition } from 'react'
import { signupAction } from './actions'

const feldKlasse =
  'rounded-lg border border-edge bg-surface px-3 py-2.5 text-ink outline-none focus:border-active'

export default function SignupForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await signupAction(formData)
      // Erfolg = redirect() serverseitig, hier kommt dann nichts mehr an.
      if (res?.error) setError(res.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-ink-soft">Einladungscode</span>
        <input
          name="code"
          required
          autoComplete="off"
          className={feldKlasse}
        />
        <span className="text-xs text-ink-muted">
          RoSe ist in der frühen Testphase — die Registrierung ist noch auf
          eingeladene Häuser beschränkt.
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-ink-soft">Name des Hauses</span>
        <input
          name="hotelName"
          required
          minLength={2}
          placeholder="z. B. Pension Alpenblick"
          className={feldKlasse}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-ink-soft">Ihr Name</span>
        <input
          name="displayName"
          required
          minLength={2}
          autoComplete="name"
          placeholder="z. B. Anna Berg"
          className={feldKlasse}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-ink-soft">E-Mail (Login)</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className={feldKlasse}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-ink-soft">Passwort</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={feldKlasse}
        />
        <span className="text-xs text-ink-muted">
          Mindestens 8 Zeichen. Zurücksetzen per E-Mail ist noch nicht
          eingerichtet — bitte sicher notieren.
        </span>
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
        {pending ? 'Wird angelegt …' : 'Konto anlegen'}
      </button>

      <p className="text-xs text-ink-muted">
        Im nächsten Schritt legen Sie die Zimmer an. Beispiel-Services sind
        bereits eingerichtet und jederzeit änderbar.
      </p>
    </form>
  )
}
