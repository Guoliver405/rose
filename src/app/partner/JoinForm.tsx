'use client'

import { useState, useTransition } from 'react'
import type { PartnerMessages } from '@/lib/i18n'
import Rich from '@/components/i18n/Rich'
import { becomePartnerAction } from './actions'

/** „Partner werden“ — erst der Knopf legt den Eintrag an, mit Zustimmung zu den Partnerbedingungen. */
export default function JoinForm({ m }: { m: PartnerMessages['join'] }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <form className="flex flex-col gap-3" onSubmit={e => {
      e.preventDefault()
      setError(null)
      const formData = new FormData(e.currentTarget)
      startTransition(async () => {
        const res = await becomePartnerAction(formData)
        if (res.error) setError(res.error)
      })
    }}>
      <label className="flex items-start gap-2.5 rounded-lg border border-edge p-3">
        <input name="terms" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-action)]" />
        <span className="text-sm text-ink">
          <Rich text={m.terms} tags={{
            terms: c => <a href="/partnerbedingungen" target="_blank" rel="noopener" className="font-semibold text-action-strong hover:underline">{c}</a>,
          }} />
        </span>
      </label>
      {error && (
        <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">{error}</p>
      )}
      <button type="submit" disabled={pending}
        className="self-start rounded-lg bg-action px-5 py-2.5 font-bold text-action-foreground hover:bg-action-strong disabled:opacity-60">
        {pending ? m.submitting : m.submit}
      </button>
    </form>
  )
}
