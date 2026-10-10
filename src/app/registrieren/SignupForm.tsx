'use client'

import { useState, useTransition } from 'react'
import { signupAction } from './actions'
import { format } from '@/lib/i18n/format'
import type { AuthMessages } from '@/lib/i18n'
import Rich from '@/components/i18n/Rich'

const feldKlasse =
  'rounded-lg border border-edge bg-surface px-3 py-2.5 text-ink outline-none focus:border-active'

export default function SignupForm({ m }: { m: AuthMessages['signup'] }) {
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
        <span className="text-sm font-semibold text-ink-soft">{m.inviteCode}</span>
        <input
          name="code"
          required
          autoComplete="off"
          className={feldKlasse}
        />
        <span className="text-xs text-ink-muted">{m.inviteCodeHint}</span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-ink-soft">{m.houseName}</span>
        <input
          name="hotelName"
          required
          minLength={2}
          placeholder={m.houseNamePlaceholder}
          className={feldKlasse}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-ink-soft">{m.yourName}</span>
        <input
          name="displayName"
          required
          minLength={2}
          autoComplete="name"
          placeholder={m.yourNamePlaceholder}
          className={feldKlasse}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-ink-soft">{m.email}</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className={feldKlasse}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-ink-soft">{m.password}</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={feldKlasse}
        />
        <span className="text-xs text-ink-muted">{format(m.passwordHint, { min: 8 })}</span>
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
        {pending ? m.submitting : m.submit}
      </button>

      <p className="text-xs text-ink-muted">
        <Rich
          text={m.terms}
          tags={{
            terms: c => <a href="/agb" target="_blank" rel="noopener" className="underline hover:text-ink">{c}</a>,
            privacy: c => <a href="/datenschutz" target="_blank" rel="noopener" className="underline hover:text-ink">{c}</a>,
          }}
        />
      </p>

      <p className="text-xs text-ink-muted">
        {m.nextStep}
      </p>
    </form>
  )
}
