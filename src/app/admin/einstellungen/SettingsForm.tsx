'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, KeyRound, Loader2, Save } from 'lucide-react'
import { changePasswordAction, updateSettingsAction } from './actions'

export type SettingsInitial = {
  hotelName: string
  pinLength: number
  cleaningStaleMinutes: number
  stayoverAutoClean: boolean
  stayoverAutoCleanTime: string
}

export default function SettingsForm({ initial }: { initial: SettingsInitial }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSaved, setPwSaved] = useState(false)
  const [stayoverOn, setStayoverOn] = useState(initial.stayoverAutoClean)

  function submitSettings(form: HTMLFormElement) {
    setError(null)
    setSaved(false)
    const formData = new FormData(form)
    startTransition(async () => {
      const res = await updateSettingsAction(formData)
      if (res.error) { setError(res.error); return }
      setSaved(true)
    })
  }

  function submitPassword(form: HTMLFormElement) {
    setPwError(null)
    setPwSaved(false)
    const formData = new FormData(form)
    startTransition(async () => {
      const res = await changePasswordAction(formData)
      if (res.error) { setPwError(res.error); return }
      form.reset()
      setPwSaved(true)
    })
  }

  const inputClass =
    'rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none'

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <h1 className="text-xl font-black text-ink">Einstellungen</h1>

      {/* Hotel + Policies */}
      <form
        onSubmit={e => { e.preventDefault(); submitSettings(e.currentTarget) }}
        className="flex flex-col gap-4 rounded-xl border border-edge bg-surface p-4"
      >
        <h2 className="text-sm font-bold text-ink-soft">Hotel &amp; Regeln</h2>

        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Hotelname
          <input name="hotelName" required minLength={2} defaultValue={initial.hotelName} className={`${inputClass} w-72`} />
        </label>

        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
            Gast-PIN-Länge (4–8)
            <input
              name="pinLength" type="number" min={4} max={8} required
              defaultValue={initial.pinLength} className={`${inputClass} w-28`}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
            Reinigung gilt als verwaist nach (Minuten)
            <input
              name="cleaningStaleMinutes" type="number" min={5} max={1440} required
              defaultValue={initial.cleaningStaleMinutes} className={`${inputClass} w-28`}
            />
          </label>
        </div>

        <div className="rounded-lg border border-edge bg-surface-sunken p-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              name="stayoverAutoClean"
              checked={stayoverOn}
              onChange={e => setStayoverOn(e.target.checked)}
              className="h-4 w-4 accent-current"
            />
            Tägliche Routine-Reinigung für belegte Zimmer
          </label>
          <p className="mt-1 text-xs text-ink-muted">
            Ab der zweiten Nacht erscheinen belegte Zimmer (ohne &bdquo;Nicht stören&ldquo;) ab der
            gewählten Uhrzeit automatisch auf dem Reinigungsboard — bis sie an dem Tag
            gereinigt wurden.
          </p>
          {stayoverOn && (
            <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-ink-muted">
              täglich ab
              <input
                name="stayoverAutoCleanTime" type="time" required
                defaultValue={initial.stayoverAutoCleanTime} className={inputClass}
              />
              Uhr
            </label>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
            {error}
          </p>
        )}
        {saved && !error && (
          <p className="flex items-center gap-1.5 rounded-lg border border-positive-pill-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
            <CheckCircle2 className="h-4 w-4" /> Gespeichert.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1.5 self-start rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Speichern
        </button>
      </form>

      {/* Passwort */}
      <form
        onSubmit={e => { e.preventDefault(); submitPassword(e.currentTarget) }}
        className="flex flex-col gap-4 rounded-xl border border-edge bg-surface p-4"
      >
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink-soft">
          <KeyRound className="h-4 w-4" /> Passwort ändern
        </h2>
        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
            Neues Passwort (min. 8 Zeichen)
            <input name="password" type="password" required minLength={8} autoComplete="new-password" className={`${inputClass} w-64`} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
            Wiederholen
            <input name="passwordConfirm" type="password" required minLength={8} autoComplete="new-password" className={`${inputClass} w-64`} />
          </label>
        </div>

        {pwError && (
          <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
            {pwError}
          </p>
        )}
        {pwSaved && !pwError && (
          <p className="flex items-center gap-1.5 rounded-lg border border-positive-pill-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
            <CheckCircle2 className="h-4 w-4" /> Passwort geändert — gilt ab der nächsten Anmeldung.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1.5 self-start rounded-lg border border-edge px-4 py-2 text-sm font-bold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
        >
          Passwort ändern
        </button>
      </form>
    </div>
  )
}
