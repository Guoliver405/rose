'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, KeyRound, UserRound } from 'lucide-react'
import { changePasswordAction, updateDisplayNameAction } from './actions'
import type { AdminMessages } from '@/lib/i18n'

const inputClass =
  'rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none'

export default function ZugangForm({
  hotelSlug,
  displayName,
  email,
  rolle,
  m,
}: {
  hotelSlug: string
  displayName: string
  email: string
  /** Klartext-Bezeichnung der Rolle in DIESEM Haus. */
  rolle: string
  m: AdminMessages['settings']['myAccess']
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [nameError, setNameError] = useState<string | null>(null)
  const [nameSaved, setNameSaved] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSaved, setPwSaved] = useState(false)

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
