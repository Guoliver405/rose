'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { AlertTriangle, Clock, MailCheck } from 'lucide-react'
import { useMailDispatch } from '@/components/mail/MailDispatch'
import { MAIL_COOLDOWN_SECONDS } from '@/lib/mail-status'
import { MARKETING_TEXT, MIN_PASSWORD } from '@/lib/sim-account'
import { simResendAction, simSignupAction } from '../actions'

const field = 'rounded-lg border border-edge bg-surface px-3 py-2.5 text-ink outline-none focus:border-active'

/**
 * Registrierung des Housekeeping-Simulators. Nach dem Absenden steht für
 * jede Adresse dieselbe Bestätigung — die Seite verrät nicht, ob es schon ein
 * Konto gibt (siehe `@/utils/sim-account`). Deshalb wie bei „Passwort
 * vergessen" nur ein Countdown, kein Zustellstatus.
 */
export default function SimSignupForm({ linkExpired, mailReady }: { linkExpired: boolean; mailReady: boolean }) {
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
      Die Registrierung ist gerade nicht möglich, weil der Mailversand nicht eingerichtet ist.
    </p>
  }

  if (sent) {
    return (
      <div className="flex w-full max-w-md flex-col gap-3 rounded-xl border border-positive-pill-edge bg-positive-tint p-4">
        <p className="flex items-center gap-2 font-bold text-positive-deep">
          <MailCheck className="h-5 w-5" aria-hidden /> Bitte bestätigen Sie Ihre Adresse
        </p>
        <p className="text-sm text-positive-deep">
          Wir haben eine E-Mail an <span className="font-mono">{sent}</span> geschickt. Der Link darin schaltet Ihr Konto frei
          und meldet Sie an. Er lässt sich auf jedem Gerät öffnen.
        </p>
        <p className="text-xs text-ink-muted">
          Nichts angekommen? Auch den Spam-Ordner prüfen. Gibt es zu dieser Adresse schon einen Zugang, steht in der Mail, wie es weitergeht.
        </p>
        {error && <p className="text-sm font-semibold text-critical-strong">{error}</p>}
        <button type="button" disabled={mail.remaining > 0 || pending} onClick={() => resend(sent)}
          className="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-positive-pill-edge px-3 py-2 text-sm font-semibold text-positive-deep hover:bg-surface disabled:opacity-60">
          {mail.remaining > 0 ? <><Clock className="h-4 w-4" aria-hidden /> Erneut senden in {mail.remaining} s</> : 'Mail erneut senden'}
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
            Der Bestätigungslink ist abgelaufen oder wurde schon benutzt. Fordern Sie einen neuen an.
          </p>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink-soft">E-Mail</span>
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
        {error && <ErrorBox text={error} />}
        <button type="submit" disabled={pending}
          className="rounded-lg bg-action px-4 py-2.5 font-bold text-action-foreground hover:bg-action-strong disabled:opacity-60">
          Neuen Bestätigungslink senden
        </button>
        <button type="button" onClick={() => setResendMode(false)} className="text-sm font-semibold text-action-strong hover:underline">
          Stattdessen neu registrieren
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
        <span className="text-sm font-semibold text-ink-soft">E-Mail</span>
        <input name="email" type="email" required autoComplete="email" className={field} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-ink-soft">Passwort</span>
        <input name="password" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" className={field} />
        <span className="text-xs text-ink-muted">Mindestens {MIN_PASSWORD} Zeichen.</span>
      </label>
      <label className="flex items-start gap-2.5 rounded-lg border border-edge p-3">
        <input name="marketing" type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-action)]" />
        <span className="text-sm text-ink">{MARKETING_TEXT} <span className="text-ink-muted">(freiwillig)</span></span>
      </label>
      {error && <ErrorBox text={error} />}
      <button type="submit" disabled={pending}
        className="rounded-lg bg-action px-4 py-2.5 font-bold text-action-foreground hover:bg-action-strong disabled:opacity-60">
        {pending ? 'Wird angelegt …' : 'Kostenlos registrieren'}
      </button>
      <p className="text-xs text-ink-muted">
        Mit der Registrierung gelten die{' '}
        <Link href="/simulator-nutzung" className="font-semibold text-action-strong hover:underline">Nutzungsbedingungen des Simulators</Link>.
        Wie wir mit Ihren Daten umgehen, steht in der{' '}
        <Link href="/datenschutz#simulator" className="font-semibold text-action-strong hover:underline">Datenschutzerklärung</Link>.
      </p>
      <p className="text-center text-sm text-ink-muted">
        Schon registriert? <Link href="/login" className="font-semibold text-action-strong hover:underline">Anmelden</Link>
        {' · '}
        <button type="button" onClick={() => setResendMode(true)} className="font-semibold text-action-strong hover:underline">
          Bestätigungslink erneut senden
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
