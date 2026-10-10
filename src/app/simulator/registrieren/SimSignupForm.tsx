'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { AlertTriangle, Clock, MailCheck } from 'lucide-react'
import { useMailDispatch } from '@/components/mail/MailDispatch'
import { MAIL_COOLDOWN_SECONDS } from '@/lib/mail-status'
import { MIN_PASSWORD } from '@/lib/sim-account'
import type { SimulatorMessages } from '@/lib/i18n'
import { format } from '@/lib/i18n/format'
import Rich from '@/components/i18n/Rich'
import { simResendAction, simSignupAction } from '../actions'

const field = 'rounded-lg border border-edge bg-surface px-3 py-2.5 text-ink outline-none focus:border-active'

/**
 * Registrierung des Housekeeping-Simulators. Nach dem Absenden steht für
 * jede Adresse dieselbe Bestätigung — die Seite verrät nicht, ob es schon ein
 * Konto gibt (siehe `@/utils/sim-account`). Deshalb wie bei „Passwort
 * vergessen" nur ein Countdown, kein Zustellstatus.
 */
export default function SimSignupForm({ linkExpired, mailReady, m, marketingText }: {
  linkExpired: boolean
  mailReady: boolean
  m: SimulatorMessages['account']['signup']
  marketingText: SimulatorMessages['account']['marketing']
}) {
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)
  const [resendMode, setResendMode] = useState(linkExpired)
  const [pending, startTransition] = useTransition()
  const mail = useMailDispatch()

  const resend = (email: string) => {
    setError(null)
    startTransition(async () => {
      const res = await simResendAction(email)
      if (res.error) { setError(res.error); return }
      mail.begin({ recipient: email, wait: MAIL_COOLDOWN_SECONDS })
      setSent(email)
    })
  }

  if (!mailReady) {
    return <p className="max-w-md rounded-lg border border-edge bg-surface-sunken p-4 text-sm text-ink">
      {m.mailNotReady}
    </p>
  }

  if (sent) {
    return (
      <div className="flex w-full max-w-md flex-col gap-3 rounded-xl border border-positive-pill-edge bg-positive-tint p-4">
        <p className="flex items-center gap-2 font-bold text-positive-deep">
          <MailCheck className="h-5 w-5" aria-hidden /> {m.sent.title}
        </p>
        <p className="text-sm text-positive-deep">
          <Rich text={m.sent.text} vars={{ email: sent }} tags={{ code: c => <span className="font-mono">{c}</span> }} />
        </p>
        <p className="text-xs text-ink-muted">{m.sent.hint}</p>
        {error && <p className="text-sm font-semibold text-critical-strong">{error}</p>}
        <button type="button" disabled={mail.remaining > 0 || pending} onClick={() => resend(sent)}
          className="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-positive-pill-edge px-3 py-2 text-sm font-semibold text-positive-deep hover:bg-surface disabled:opacity-60">
          {mail.remaining > 0 ? <><Clock className="h-4 w-4" aria-hidden /> {format(m.sent.againIn, { seconds: mail.remaining })}</> : m.sent.again}
        </button>
      </div>
    )
  }

  if (resendMode) {
    return (
      <form className="flex w-full max-w-md flex-col gap-4" onSubmit={e => {
        e.preventDefault()
        resend(String(new FormData(e.currentTarget).get('email') ?? '').trim())
      }}>
        {linkExpired && (
          <p className="flex items-start gap-2 rounded-lg border border-caution-tint-edge bg-caution-tint px-3 py-2 text-sm text-ink">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-caution-strong" aria-hidden />
            {m.resend.linkExpired}
          </p>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink-soft">{m.email}</span>
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
        {error && <ErrorBox text={error} />}
        <button type="submit" disabled={pending}
          className="rounded-lg bg-action px-4 py-2.5 font-bold text-action-foreground hover:bg-action-strong disabled:opacity-60">
          {m.resend.submit}
        </button>
        <button type="button" onClick={() => setResendMode(false)} className="text-sm font-semibold text-action-strong hover:underline">
          {m.resend.signupInstead}
        </button>
      </form>
    )
  }

  return (
    <form className="flex w-full max-w-md flex-col gap-4" onSubmit={e => {
      e.preventDefault()
      setError(null)
      const formData = new FormData(e.currentTarget)
      const email = String(formData.get('email') ?? '').trim()
      startTransition(async () => {
        const res = await simSignupAction(formData)
        if (res.error) { setError(res.error); return }
        mail.begin({ recipient: email, wait: MAIL_COOLDOWN_SECONDS })
        setSent(email)
      })
    }}>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-ink-soft">{m.email}</span>
        <input name="email" type="email" required autoComplete="email" className={field} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-ink-soft">{m.password}</span>
        <input name="password" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" className={field} />
        <span className="text-xs text-ink-muted">{format(m.passwordHint, { min: MIN_PASSWORD })}</span>
      </label>
      <label className="flex items-start gap-2.5 rounded-lg border border-edge p-3">
        <input name="marketing" type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-action)]" />
        <span className="text-sm text-ink">{marketingText.text} <span className="text-ink-muted">{marketingText.optional}</span></span>
      </label>
      {error && <ErrorBox text={error} />}
      <button type="submit" disabled={pending}
        className="rounded-lg bg-action px-4 py-2.5 font-bold text-action-foreground hover:bg-action-strong disabled:opacity-60">
        {pending ? m.submitting : m.submit}
      </button>
      <p className="text-xs text-ink-muted">
        <Rich text={m.terms} tags={{
          terms: c => <Link href="/simulator-nutzung" className="font-semibold text-action-strong hover:underline">{c}</Link>,
          privacy: c => <Link href="/datenschutz#simulator" className="font-semibold text-action-strong hover:underline">{c}</Link>,
        }} />
      </p>
      <p className="text-center text-sm text-ink-muted">
        <Rich text={m.haveAccount} tags={{
          link: c => <Link href="/login" className="font-semibold text-action-strong hover:underline">{c}</Link>,
        }} />
        {' · '}
        <button type="button" onClick={() => setResendMode(true)} className="font-semibold text-action-strong hover:underline">
          {m.resendLink}
        </button>
      </p>
    </form>
  )
}

function ErrorBox({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">{text}</p>
  )
}
