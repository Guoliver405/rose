'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2, Save } from 'lucide-react'
import { updateSettingsAction } from './actions'

export type HotelSettingsInitial = {
  hotelName: string
  /** Mandanten-Kennung in der URL (`/h/<slug>/guest`). */
  slug: string
  /** Basis-Adresse für die Vorschau (NEXT_PUBLIC_SITE_URL). */
  portalOrigin: string
  pinLength: number
  cleaningStaleMinutes: number
  stayoverAutoClean: boolean
  stayoverAutoCleanTime: string
  /** Check-out-Frist des Hauses (HH:MM) — Untergrenze der Routine-Reinigung. */
  checkoutUntil: string
  /** „Frühestens ab" im Gastportal: erlaubt, und bis wann (HH:MM). */
  cleanDeferEnabled: boolean
  cleanDeferUntil: string
  /** IANA-Zeitzone des Hauses, z. B. Europe/Berlin. */
  timeZone: string
  /** Auswahlliste aller Zeitzonen der Laufzeit. */
  timeZones: string[]
  cleaningWindowEnabled: boolean
  cleaningWindowStart: string
  cleaningWindowEnd: string
}

export default function HotelSettingsForm({ hotelSlug, initial }: { hotelSlug: string; initial: HotelSettingsInitial }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [stayoverOn, setStayoverOn] = useState(initial.stayoverAutoClean)
  const [deferOn, setDeferOn] = useState(initial.cleanDeferEnabled)
  const [windowOn, setWindowOn] = useState(initial.cleaningWindowEnabled)
  const [slug, setSlug] = useState(initial.slug)

  function submitSettings(form: HTMLFormElement) {
    setError(null)
    setSaved(false)
    const formData = new FormData(form)
    startTransition(async () => {
      const res = await updateSettingsAction(hotelSlug, formData)
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

      <div data-lotse="regeln.adresse" className="rounded-lg border border-edge bg-surface-sunken p-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Adresse des Hauses (nur Kleinbuchstaben, Ziffern, Bindestriche)
          <input
            name="slug"
            required
            value={slug}
            onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            className={`${inputClass} w-72 font-mono`}
          />
        </label>
        <p className="mt-2 text-xs text-ink-muted">
          Gastportal:{' '}
          <span className="break-all font-mono text-ink-soft">
            {initial.portalOrigin}/h/{slug || '…'}/guest
          </span>
          <br />
          Reinigung:{' '}
          <span className="break-all font-mono text-ink-soft">
            {initial.portalOrigin}/h/{slug || '…'}/service/login
          </span>
        </p>
        <p className="mt-2 text-xs text-ink-muted">
          Zimmernummern und Benutzernamen sind nur innerhalb des Hauses eindeutig —
          deshalb steht die Adresse in beiden Anmeldungen. Gedruckte QR-Codes
          (Zimmer-Aushang, Zugangskarte) bleiben bei einer Änderung gültig; nur die
          abgetippte Adresse auf älteren Handouts stimmt dann nicht mehr.
        </p>
      </div>

      <div data-lotse="regeln.pin" className="flex flex-wrap gap-4">
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

      <div data-lotse="regeln.routine" className="rounded-lg border border-edge bg-surface-sunken p-3">
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
        <label data-lotse="regeln.checkout" className="mt-3 flex items-center gap-2 border-t border-edge pt-3 text-xs font-semibold text-ink-muted">
          Check-out bis
          <input
            name="checkoutUntil" type="time" required
            defaultValue={initial.checkoutUntil} className={inputClass}
          />
          Uhr
        </label>
        <p className="mt-1 text-xs text-ink-muted">
          Die Routine-Reinigung wird nie vor dieser Zeit fällig — wer danach noch im Zimmer
          ist, bleibt. So wird ein Abreisezimmer nicht vor dem Check-out gereinigt und
          danach noch einmal. Trägt die Rezeption beim Check-in ein Abreisedatum ein, setzt
          die Routine an diesem Tag ganz aus.
        </p>
      </div>

      <div data-lotse="regeln.aufschub" className="rounded-lg border border-edge bg-surface-sunken p-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            name="cleanDeferEnabled"
            checked={deferOn}
            onChange={e => setDeferOn(e.target.checked)}
            className="h-4 w-4 accent-current"
          />
          Gäste dürfen die Reinigung aufschieben (&bdquo;frühestens ab&ldquo;)
        </label>
        <p className="mt-1 text-xs text-ink-muted">
          Der Gast wünscht Reinigung, aber nicht vor einer Uhrzeit — etwa, weil er ausschlafen
          will. Bis dahin gilt das Zimmer auf dem Board als nicht offen. Eine Einschränkung,
          kein Termin: Das Housekeeping kommt danach, wann es passt.
        </p>
        {deferOn && (
          <>
            <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-ink-muted">
              aufschieben bis spätestens
              <input
                name="cleanDeferUntil" type="time" required
                defaultValue={initial.cleanDeferUntil} className={inputClass}
              />
              Uhr
            </label>
            <p className="mt-1 text-xs text-ink-muted">
              So wählen, dass die Reinigung danach noch in der Schicht liegt: Arbeitet das
              Housekeeping bis 15:00, ist 13:00 ein guter Wert. Der Gast sieht diese Grenze im
              Portal.
            </p>
          </>
        )}
      </div>

      <div data-lotse="regeln.zeitzone" className="rounded-lg border border-edge bg-surface-sunken p-3">
        <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
          Zeitzone des Hauses
          <select name="timeZone" defaultValue={initial.timeZone} className={inputClass}>
            {initial.timeZones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </label>
        <p className="mt-1 text-xs text-ink-muted">
          Alle Uhrzeiten dieser Seite — Routine, Check-out-Frist, Zeitfenster, Aufschieb-Grenze —
          und die Tagesgrenzen der Auswertung gelten in dieser Zeitzone. Die Server laufen in
          UTC; ohne diese Angabe lägen die Regeln um ein bis zwei Stunden daneben.
        </p>
      </div>

      <div data-lotse="regeln.fenster" className="rounded-lg border border-edge bg-surface-sunken p-3">
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
        data-lotse="regeln.speichern"
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
