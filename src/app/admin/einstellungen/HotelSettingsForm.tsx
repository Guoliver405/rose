'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2, Save } from 'lucide-react'
import { updateSettingsAction } from './actions'

export type HotelSettingsInitial = {
  hotelName: string
  pinLength: number
  cleaningStaleMinutes: number
  stayoverAutoClean: boolean
  stayoverAutoCleanTime: string
  cleaningWindowEnabled: boolean
  cleaningWindowStart: string
  cleaningWindowEnd: string
}

export default function HotelSettingsForm({ initial }: { initial: HotelSettingsInitial }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [stayoverOn, setStayoverOn] = useState(initial.stayoverAutoClean)
  const [windowOn, setWindowOn] = useState(initial.cleaningWindowEnabled)

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

  const inputClass =
    'rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none'

  return (
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

      <div className="rounded-lg border border-edge bg-surface-sunken p-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            name="cleaningWindowEnabled"
            checked={windowOn}
            onChange={e => setWindowOn(e.target.checked)}
            className="h-4 w-4 accent-current"
          />
          Reinigungswunsch nur innerhalb fester Zeiten
        </label>
        <p className="mt-1 text-xs text-ink-muted">
          Außerhalb des Zeitfensters können Gäste im Portal keinen Reinigungswunsch mehr
          absetzen — sie sehen stattdessen einen Hinweis mit den Reinigungszeiten.
          &bdquo;Nicht stören&ldquo; und das Zurücknehmen eines Wunsches bleiben jederzeit möglich.
        </p>
        {windowOn && (
          <label className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-muted">
            von
            <input
              name="cleaningWindowStart" type="time" required
              defaultValue={initial.cleaningWindowStart} className={inputClass}
            />
            bis
            <input
              name="cleaningWindowEnd" type="time" required
              defaultValue={initial.cleaningWindowEnd} className={inputClass}
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
  )
}
