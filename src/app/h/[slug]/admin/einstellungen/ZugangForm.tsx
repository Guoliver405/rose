'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AtSign, CheckCircle2, KeyRound, RotateCw, UserRound } from 'lucide-react'
import {
  cancelEmailChangeAction, changePasswordAction, requestEmailChangeAction, updateDisplayNameAction,
} from './actions'
import type { AdminMessages } from '@/lib/i18n'
import { format } from '@/lib/i18n/format'
import { auswegButton, beginFrom, MailStatusLine, sendLabel, useMailDispatch } from '@/components/mail/MailDispatch'

const inputClass =
  'rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none'

export default function ZugangForm({
  hotelSlug,
  displayName,
  email,
  rolle,
  isOwner,
  pending: offen,
  mailReady,
  ttlHours,
  m,
}: {
  hotelSlug: string
  displayName: string
  email: string
  /** Klartext-Bezeichnung der Rolle in DIESEM Haus. */
  rolle: string
  isOwner: boolean
  /** Offene Änderung der Anmelde-Adresse, falls eine auf Bestätigung wartet. */
  pending: { email: string; until: string } | null
  /** Ohne E-Mail-Versand gibt es keinen Bestätigungslink und damit keine Änderung. */
  mailReady: boolean
  ttlHours: number
  m: AdminMessages['settings']['myAccess']
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [nameError, setNameError] = useState<string | null>(null)
  const [nameSaved, setNameSaved] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSaved, setPwSaved] = useState(false)
  const [mailError, setMailError] = useState<string | null>(null)
  const [mailNote, setMailNote] = useState<string | null>(null)
  const mail = useMailDispatch()
  // Formularinhalt für „freigeben und erneut senden“ — das Passwort steht
  // danach nicht mehr im Feld, wohl aber hier, bis die Seite verlassen wird.
  const letzteAnfrage = useRef<FormData | null>(null)

  function sendeAdresse(formData: FormData, release: boolean, form?: HTMLFormElement) {
    setMailError(null)
    setMailNote(null)
    letzteAnfrage.current = formData
    startTransition(async () => {
      const res = await requestEmailChangeAction(hotelSlug, formData, release)
      if (res.error) { setMailError(res.error); return }
      if (res.mail) mail.begin(beginFrom(res.mail, res.email))
      if (res.expiresAt && res.email) {
        form?.reset()
        setMailNote(format(m.email.sentTo, { email: res.email, hours: ttlHours }))
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Wer bin ich ───────────────────────────────────────────────── */}
      <section className="rounded-xl border border-edge bg-surface p-4">
        <h2 className="text-sm font-bold text-ink-soft">{m.signIn.heading}</h2>
        <dl className="mt-2 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <dt className="text-xs font-semibold text-ink-muted">{m.signIn.email}</dt>
            <dd className="font-mono text-ink">{email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-ink-muted">{m.signIn.role}</dt>
            <dd className="font-semibold text-ink">{rolle}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-ink-muted">{m.signIn.hint}</p>
      </section>

      {/* ── Anmelde-Adresse ────────────────────────────────────────────── */}
      <form
        onSubmit={e => {
          e.preventDefault()
          sendeAdresse(new FormData(e.currentTarget), false, e.currentTarget)
        }}
        className="flex flex-col gap-4 rounded-xl border border-edge bg-surface p-4"
      >
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink-soft">
          <AtSign className="h-4 w-4" /> {m.email.heading}
        </h2>

        {!mailReady ? (
          <p className="text-xs text-ink-muted">{m.email.notConfigured}</p>
        ) : (
          <>
            {offen && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-attention-tint-edge bg-attention-tint px-3 py-2 text-sm text-attention-deepest">
                <span>
                  {format(m.email.pending, { email: offen.email, until: offen.until })}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(async () => {
                    const res = await cancelEmailChangeAction(hotelSlug)
                    if (res.error) { setMailError(res.error); return }
                    mail.reset()
                    setMailNote(m.email.cancelled)
                    router.refresh()
                  })}
                  className={auswegButton}
                >
                  {m.email.cancel}
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
                {m.email.next}
                <input name="newEmail" type="email" required autoComplete="email" className={`${inputClass} w-64`} />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
                {m.email.current}
                <input name="currentPassword" type="password" required autoComplete="current-password" className={`${inputClass} w-64`} />
              </label>
            </div>

            <p className="text-xs text-ink-muted">{m.email.hint}</p>
            {isOwner && <p className="text-xs text-ink-muted">{m.email.ownerHint}</p>}

            {mailError && (
              <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
                {mailError}
              </p>
            )}
            {mailNote && !mailError && (
              <p className="flex items-center gap-1.5 rounded-lg border border-positive-pill-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> {mailNote}
              </p>
            )}
            <MailStatusLine mail={mail}>
              {mail.failed && mail.run?.blocked?.canRelease !== false && (
                <button
                  type="button"
                  disabled={pending || mail.remaining > 0}
                  onClick={() => { if (letzteAnfrage.current) sendeAdresse(letzteAnfrage.current, true) }}
                  className={`${auswegButton} text-critical-strong`}
                >
                  <RotateCw className="h-3.5 w-3.5" /> {m.email.releaseAndResend}
                </button>
              )}
            </MailStatusLine>

            <button
              type="submit"
              disabled={pending || mail.remaining > 0}
              className="self-start rounded-lg border border-edge px-4 py-2 text-sm font-bold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
            >
              {sendLabel(m.email.send, mail)}
            </button>
          </>
        )}
      </form>

      {/* ── Anzeigename ───────────────────────────────────────────────── */}
      <form
        onSubmit={e => {
          e.preventDefault()
          setNameError(null)
          setNameSaved(false)
          const formData = new FormData(e.currentTarget)
          startTransition(async () => {
            const res = await updateDisplayNameAction(hotelSlug, formData)
            if (res.error) { setNameError(res.error); return }
            setNameSaved(true)
            router.refresh()
          })
        }}
        className="flex flex-col gap-4 rounded-xl border border-edge bg-surface p-4"
      >
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink-soft">
          <UserRound className="h-4 w-4" /> {m.displayName.heading}
        </h2>

        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          {m.displayName.label}
          <input
            name="displayName"
            required
            minLength={2}
            maxLength={60}
            defaultValue={displayName}
            className={`${inputClass} w-64`}
          />
        </label>

        <p className="text-xs text-ink-muted">{m.displayName.hint}</p>

        {nameError && (
          <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
            {nameError}
          </p>
        )}
        {nameSaved && !nameError && (
          <p className="flex items-center gap-1.5 rounded-lg border border-positive-pill-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
            <CheckCircle2 className="h-4 w-4" /> {m.displayName.saved}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-lg border border-edge px-4 py-2 text-sm font-bold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
        >
          {m.displayName.save}
        </button>
      </form>

      {/* ── Passwort ──────────────────────────────────────────────────── */}
      <form
        onSubmit={e => {
          e.preventDefault()
          setPwError(null)
          setPwSaved(false)
          const formData = new FormData(e.currentTarget)
          const form = e.currentTarget
          startTransition(async () => {
            const res = await changePasswordAction(hotelSlug, formData)
            if (res.error) { setPwError(res.error); return }
            form.reset()
            setPwSaved(true)
          })
        }}
        className="flex flex-col gap-4 rounded-xl border border-edge bg-surface p-4"
      >
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink-soft">
          <KeyRound className="h-4 w-4" /> {m.password.heading}
        </h2>

        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          {m.password.current}
          <input
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className={`${inputClass} w-64`}
          />
        </label>

        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
            {m.password.next}
            <input name="password" type="password" required minLength={8} autoComplete="new-password" className={`${inputClass} w-64`} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
            {m.password.repeat}
            <input name="passwordConfirm" type="password" required minLength={8} autoComplete="new-password" className={`${inputClass} w-64`} />
          </label>
        </div>

        <p className="text-xs text-ink-muted">{m.password.hint}</p>

        {pwError && (
          <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
            {pwError}
          </p>
        )}
        {pwSaved && !pwError && (
          <p className="flex items-center gap-1.5 rounded-lg border border-positive-pill-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
            <CheckCircle2 className="h-4 w-4" /> {m.password.saved}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-lg border border-edge px-4 py-2 text-sm font-bold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
        >
          {m.password.save}
        </button>
      </form>
    </div>
  )
}
