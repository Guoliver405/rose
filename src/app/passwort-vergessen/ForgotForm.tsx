'use client'

import { useState, useTransition } from 'react'
import { Clock, MailCheck } from 'lucide-react'
import { requestPasswordResetAction } from './actions'
import { useMailDispatch } from '@/components/mail/MailDispatch'
import { MAIL_COOLDOWN_SECONDS } from '@/lib/mail-status'
import { format } from '@/lib/i18n/format'
import type { AuthMessages } from '@/lib/i18n'
import Rich from '@/components/i18n/Rich'

/**
 * Passwort vergessen — das Formular und die Bestätigung danach.
 *
 * Nach dem Senden zählt eine Minute herunter, bevor „Erneut anfordern" frei
 * wird (12.09.2026). Bewusst **ohne** Zustellstatus: Die Seite ist öffentlich,
 * und ein Status gäbe es nur für Adressen mit Konto — er verriete also, ob
 * es eines gibt. Der Countdown dagegen läuft für jede Adresse gleich.
 */
export default function ForgotForm({ m }: { m: AuthMessages['forgot'] }) {
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const mail = useMailDispatch()

  if (sent) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-3 rounded-xl border border-positive-pill-edge bg-positive-tint p-4">
        <p className="flex items-center gap-2 font-bold text-positive-deep">
          <MailCheck className="h-5 w-5" /> {m.sentTitle}
        </p>
        <p className="text-sm text-positive-deep">
          <Rich text={m.sentText} vars={{ email: sent }} tags={{ code: c => <span className="font-mono">{c}</span> }} />
        </p>
        <p className="text-xs text-ink-muted">
          {m.sentSpam}
        </p>
        <button
          type="button"
          disabled={mail.remaining > 0}
          onClick={() => { setSent(null); mail.reset() }}
          className="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-positive-pill-edge px-3 py-2 text-sm font-semibold text-positive-deep hover:bg-surface disabled:opacity-60"
        >
          {mail.remaining > 0
            ? <><Clock className="h-4 w-4" /> {format(m.againIn, { seconds: mail.remaining })}</>
            : m.again}
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        setError(null)
        const formData = new FormData(e.currentTarget)
        const email = String(formData.get('email') ?? '').trim()
        startTransition(async () => {
          const res = await requestPasswordResetAction(formData)
          if (res.error) { setError(res.error); return }
          mail.begin({ recipient: email, wait: MAIL_COOLDOWN_SECONDS })
          setSent(email)
        })
      }}
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-ink-soft">{m.email}</span>
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
        {pending ? m.submitting : m.submit}
      </button>
    </form>
  )
}
