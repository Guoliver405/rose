'use client'

import { useState, useTransition } from 'react'
import { loginAction } from './actions'
import type { AuthMessages } from '@/lib/i18n'

export default function LoginForm({ m }: { m: AuthMessages['login'] }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await loginAction(email.trim(), password)
      if (res?.error) setError(res.error)
      // Erfolg = redirect('/admin') serverseitig
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-ink-soft">{m.email}</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="rounded-lg border border-edge bg-surface px-3 py-2.5 text-ink outline-none focus:border-active"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-ink-soft">{m.password}</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
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
        {pending ? m.submitting : m.submit}
      </button>
    </form>
  )
}
