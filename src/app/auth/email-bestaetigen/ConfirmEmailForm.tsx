'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import Rich from '@/components/i18n/Rich'
import type { AdminMessages } from '@/lib/i18n'
import type { ConfirmResult } from '@/utils/email-change'
import { confirmEmailChangeAction } from './actions'

export default function ConfirmEmailForm({
  token,
  m,
}: {
  token: string
  m: AdminMessages['settings']['myAccess']['confirm']
}) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<ConfirmResult | null>(null)

  if (result?.kind === 'ok') {
    return (
      <div className="flex flex-col gap-3">
        <p className="flex items-start gap-1.5 rounded-lg border border-positive-pill-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <Rich text={m.done} vars={{ email: result.email }} tags={{ b: c => <span className="font-mono">{c}</span> }} />
          </span>
        </p>
        <Link href="/login" className="self-center rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong">
          {m.toLogin}
        </Link>
      </div>
    )
  }

  if (result) {
    const text = result.kind === 'taken' ? m.taken : result.kind === 'invalid' ? m.invalid : m.failed
    return (
      <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
        {text}
      </p>
    )
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => setResult(await confirmEmailChangeAction(token)))}
      className="self-center rounded-lg bg-action px-5 py-2.5 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
    >
      {m.button}
    </button>
  )
}
