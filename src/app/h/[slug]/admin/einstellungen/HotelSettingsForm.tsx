'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2, Save } from 'lucide-react'
import { useUnsavedSection } from '@/components/unsaved/UnsavedChanges'
import Rich from '@/components/i18n/Rich'
import type { AdminMessages } from '@/lib/i18n'
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
  /** Check-in ab (HH:MM) — bis dahin sollen Abreisen bezugsfertig sein; Grundlage des Check-out-Drucks. */
  checkinFrom: string
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
  /** Link zur Bewertungsseite des Hauses, leer = aus (siehe lib/review.ts). */
  reviewUrl: string
  /** Währung der Service-Preise (ISO 4217) und die Auswahl mit Namen in der Sprache der Oberfläche. */
  currency: string
  currencies: { code: string; name: string }[]
  /** Personenbezug der Tätigkeiten: je Kraft oder nur als Team (siehe lib/staff-tracking.ts). */
  staffTracking: 'person' | 'team'
}

/** Stand des Formulars als Vergleichswert — auch für ein- und ausgeblendete Felder. */
function snapshot(form: HTMLFormElement): string {
  return JSON.stringify([...new FormData(form).entries()].map(([k, v]) => [k, String(v)]))
}

type Messages = AdminMessages['settings']['house']

export default function HotelSettingsForm(props: { hotelSlug: string; initial: HotelSettingsInitial; m: Messages }) {
  // „Verwerfen" baut das Formular neu aus dem gespeicherten Stand auf — nach
  // dem Speichern kommt `initial` über revalidatePath frisch vom Server.
  const [version, setVersion] = useState(0)
  return <SettingsForm key={version} {...props} onDiscard={() => setVersion(v => v + 1)} />
}

function SettingsForm({ hotelSlug, initial, m, onDiscard }: {
  hotelSlug: string; initial: HotelSettingsInitial; m: Messages; onDiscard: () => void
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [stayoverOn, setStayoverOn] = useState(initial.stayoverAutoClean)
  const [deferOn, setDeferOn] = useState(initial.cleanDeferEnabled)
  const [windowOn, setWindowOn] = useState(initial.cleaningWindowEnabled)
  const [slug, setSlug] = useState(initial.slug)
  const formRef = useRef<HTMLFormElement>(null)
  const baseline = useRef('')
  useEffect(() => { if (formRef.current) baseline.current = snapshot(formRef.current) }, [])

  // Nach dem Rendern vergleichen: ein Häkchen blendet Felder erst im nächsten Commit ein.
  function checkDirty() {
    setTimeout(() => {
      if (formRef.current) setDirty(snapshot(formRef.current) !== baseline.current)
    })
  }

  async function save(): Promise<boolean> {
    const form = formRef.current
    if (!form) return false
    if (!form.reportValidity()) return false
    setError(null)
    setSaved(false)
    setPending(true)
    try {
      const res = await updateSettingsAction(hotelSlug, new FormData(form))
      if (res?.error) { setError(res.error); return false }
      baseline.current = snapshot(form)
      setDirty(false)
      setSaved(true)
      return true
    } finally {
      setPending(false)
    }
  }

  useUnsavedSection('regeln', { label: m.unsavedLabel, dirty, save, discard: onDiscard })

  const inputClass =
    'rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none'

  return (
    <form
      ref={formRef}
      onSubmit={e => { e.preventDefault(); void save() }}
      onInput={() => { setSaved(false); checkDirty() }}
      onChange={checkDirty}
      className="flex flex-col gap-4 rounded-xl border border-edge bg-surface p-4"
    >
      <h2 className="text-sm font-bold text-ink-soft">{m.title}</h2>

      <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
        {m.name}
        <input name="hotelName" required minLength={2} defaultValue={initial.hotelName} className={`${inputClass} w-72`} />
      </label>

      <div data-lotse="regeln.adresse" className="rounded-lg border border-edge bg-surface-sunken p-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          {m.slug.label}
          <input
            name="slug"
            required
            value={slug}
            onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            className={`${inputClass} w-72 font-mono`}
          />
        </label>
        <p className="mt-2 text-xs text-ink-muted">
          {m.slug.guestPortal}{' '}
          <span className="break-all font-mono text-ink-soft">
            {initial.portalOrigin}/h/{slug || '…'}/guest
          </span>
          <br />
          {m.slug.cleaning}{' '}
          <span className="break-all font-mono text-ink-soft">
            {initial.portalOrigin}/h/{slug || '…'}/service/login
          </span>
        </p>
        <p className="mt-2 text-xs text-ink-muted">{m.slug.hint}</p>
      </div>

      <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
        {m.review.label}
        <input
          name="reviewUrl" type="url" inputMode="url" placeholder={m.review.placeholder}
          defaultValue={initial.reviewUrl} className={`${inputClass} w-full max-w-xl font-mono`}
        />
        <span className="font-normal">{m.review.hint}</span>
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
        {m.currency.label}
        <select name="currency" defaultValue={initial.currency} className={`${inputClass} w-72`}>
          {initial.currencies.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
        </select>
        <span className="font-normal">{m.currency.hint}</span>
      </label>

      <div data-lotse="regeln.pin" className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          {m.pinLength}
          <input
            name="pinLength" type="number" min={4} max={8} required
            defaultValue={initial.pinLength} className={`${inputClass} w-28`}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          {m.staleMinutes}
          <input
            name="cleaningStaleMinutes" type="number" min={5} max={1440} required
            defaultValue={initial.cleaningStaleMinutes} className={`${inputClass} w-28`}
          />
        </label>
        <p className="w-full text-xs text-ink-muted">{m.staleHint}</p>
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
          {m.daily.label}
        </label>
        <p className="mt-1 text-xs text-ink-muted">{m.daily.hint}</p>
        {stayoverOn && (
          <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-ink-muted">
            <Rich text={m.daily.from} tags={{ time: () => (
              <input
                name="stayoverAutoCleanTime" type="time" required
                defaultValue={initial.stayoverAutoCleanTime} className={inputClass}
              />
            ) }} />
          </label>
        )}
        <label data-lotse="regeln.checkout" className="mt-3 flex items-center gap-2 border-t border-edge pt-3 text-xs font-semibold text-ink-muted">
          <Rich text={m.checkoutUntil.label} tags={{ time: () => (
            <input
              name="checkoutUntil" type="time" required
              defaultValue={initial.checkoutUntil} className={inputClass}
            />
          ) }} />
        </label>
        <p className="mt-1 text-xs text-ink-muted">{m.checkoutUntil.hint}</p>
        <label data-lotse="regeln.checkin" className="mt-3 flex items-center gap-2 border-t border-edge pt-3 text-xs font-semibold text-ink-muted">
          <Rich text={m.checkinFrom.label} tags={{ time: () => (
            <input
              name="checkinFrom" type="time" required
              defaultValue={initial.checkinFrom} className={inputClass}
            />
          ) }} />
        </label>
        <p className="mt-1 text-xs text-ink-muted">{m.checkinFrom.hint}</p>
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
          {m.defer.label}
        </label>
        <p className="mt-1 text-xs text-ink-muted">{m.defer.hint}</p>
        {deferOn && (
          <>
            <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-ink-muted">
              <Rich text={m.defer.until} tags={{ time: () => (
                <input
                  name="cleanDeferUntil" type="time" required
                  defaultValue={initial.cleanDeferUntil} className={inputClass}
                />
              ) }} />
            </label>
            <p className="mt-1 text-xs text-ink-muted">{m.defer.untilHint}</p>
          </>
        )}
      </div>

      <div data-lotse="regeln.zeitzone" className="rounded-lg border border-edge bg-surface-sunken p-3">
        <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
          {m.timeZone.label}
          <select name="timeZone" defaultValue={initial.timeZone} className={inputClass}>
            {initial.timeZones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </label>
        <p className="mt-1 text-xs text-ink-muted">{m.timeZone.hint}</p>
      </div>

      {/* Team-Modus (16.09.2026): Tätigkeiten ohne Personenbezug. */}
      <div data-lotse="regeln.personenbezug" className="rounded-lg border border-edge bg-surface-sunken p-3">
        <p className="text-xs font-semibold text-ink-muted">{m.tracking.heading}</p>
        <div className="mt-2 flex flex-col gap-2">
          <label className="flex items-start gap-2 text-sm text-ink">
            <input type="radio" name="staffTracking" value="person" defaultChecked={initial.staffTracking === 'person'} className="mt-1 h-4 w-4 accent-current" />
            <span>
              <span className="font-semibold">{m.tracking.person.label}</span>
              <span className="block text-xs text-ink-muted">{m.tracking.person.hint}</span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-ink">
            <input type="radio" name="staffTracking" value="team" defaultChecked={initial.staffTracking === 'team'} className="mt-1 h-4 w-4 accent-current" />
            <span>
              <span className="font-semibold">{m.tracking.team.label}</span>
              <span className="block text-xs text-ink-muted">{m.tracking.team.hint}</span>
              <span className="mt-1 block text-xs text-ink-soft">
                <Rich text={m.tracking.team.warning} tags={{ b: c => <strong className="font-semibold text-ink">{c}</strong> }} />
              </span>
            </span>
          </label>
        </div>
        <p className="mt-2 text-xs text-ink-muted">{m.tracking.note}</p>
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
          {m.window.label}
        </label>
        <p className="mt-1 text-xs text-ink-muted">{m.window.hint}</p>
        {windowOn && (
          <label className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-muted">
            <Rich text={m.window.range} tags={{
              start: () => (
                <input
                  name="cleaningWindowStart" type="time" required
                  defaultValue={initial.cleaningWindowStart} className={inputClass}
                />
              ),
              end: () => (
                <input
                  name="cleaningWindowEnd" type="time" required
                  defaultValue={initial.cleaningWindowEnd} className={inputClass}
                />
              ),
            }} />
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
          <CheckCircle2 className="h-4 w-4" /> {m.saved}
        </p>
      )}

      <button
        data-lotse="regeln.speichern"
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 self-start rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {m.save}
      </button>
    </form>
  )
}
