'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, DoorOpen, KeyRound, Loader2, QrCode, TriangleAlert } from 'lucide-react'
import { updateGuestAccessModeAction } from './actions'
import type { GuestAccessMode } from '@/lib/guest-access'
import { useUnsavedSection } from '@/components/unsaved/UnsavedChanges'
import Rich from '@/components/i18n/Rich'
import type { AdminMessages } from '@/lib/i18n'

type Messages = AdminMessages['settings']['guestAccess']

/**
 * Die Erläuterung ist hier kein Beiwerk, sondern der Zweck der Seite: Die Wahl
 * ist eine grundsätzliche Betriebsentscheidung, die ein Haus einmal trifft und
 * dann selten ändert. Wer sie trifft, muss die Abwägung kennen — vor allem den
 * fehlenden zweiten Faktor beim individuellen Verfahren.
 */
const KARTEN: GuestAccessMode[] = ['pin', 'link']

export default function GastzugangForm({
  hotelSlug, initial, bestaetigt, m,
}: {
  hotelSlug: string
  initial: GuestAccessMode
  /**
   * `policies.guestAccessMode` ist ausdrücklich gesetzt. Solange nicht, gilt
   * die Vorgabe (PIN) — und der Knopf muss auch ohne Änderung bedienbar sein:
   * Vorher stand er auf „Bereits eingestellt", wer mit der Vorgabe zufrieden
   * war, konnte sie nie festhalten, und die Einrichtungs-Checkliste (die den
   * gesetzten Schlüssel liest) forderte den Punkt endlos ein (22.09.2026).
   */
  bestaetigt: boolean
  m: Messages
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [gewaehlt, setGewaehlt] = useState<GuestAccessMode>(initial)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const geaendert = gewaehlt !== initial
  const speicherbar = geaendert || !bestaetigt

  async function speichern(): Promise<boolean> {
    setError(null)
    setNotice(null)
    setPending(true)
    try {
      const res = await updateGuestAccessModeAction(hotelSlug, gewaehlt)
      if (res.error) { setError(res.error); return false }
      setNotice(
        !geaendert
          ? m.notices.confirmed
          : gewaehlt === 'link'
          ? m.notices.switchedToLink
          : m.notices.switchedToPin,
      )
      router.refresh()
      return true
    } finally {
      setPending(false)
    }
  }

  // Die Leiste zählt nur echte Änderungen; das bloße Bestätigen der Vorgabe bleibt am Knopf unten.
  useUnsavedSection('gastzugang', {
    label: m.unsavedLabel, dirty: geaendert, save: speichern, discard: () => setGewaehlt(initial),
  })

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-soft">
        <Rich text={m.intro} />
      </p>

      <div data-lotse="gastzugang.wahl" className="grid gap-3 lg:grid-cols-2">
        {KARTEN.map(mode => {
          const k = m.modes[mode]
          const aktiv = gewaehlt === mode
          const istAktuell = initial === mode
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setGewaehlt(mode)}
              className={`flex flex-col gap-3 rounded-xl border-2 bg-surface p-4 text-left ${
                aktiv
                  // Kein Tint-Hintergrund: die Tints sind nur für Light
                  // definiert, im Dark Mode stünde Ink-Text auf Blau-50.
                  // Die Auswahl trägt Rahmen, Ring und Icon in Aktionsfarbe.
                  ? 'border-action ring-2 ring-action/25'
                  : 'border-edge hover:border-edge-strong'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    aktiv ? 'bg-action text-action-foreground' : 'bg-surface-muted text-ink-soft'
                  }`}
                >
                  {mode === 'pin' ? <QrCode className="h-5 w-5" /> : <DoorOpen className="h-5 w-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-ink">{k.title}</span>
                    {istAktuell && (
                      <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-ink-muted">
                        {bestaetigt ? m.badgeActive : m.badgeDefault}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">{k.subtitle}</span>
                </span>
                {aktiv && <Check className="h-5 w-5 shrink-0 text-action" />}
              </div>

              <div>
                <p className="text-xs font-bold text-ink-soft">{m.howItWorks}</p>
                <ol className="mt-1 list-decimal pl-5 text-xs leading-relaxed text-ink-soft">
                  {k.steps.map(z => <li key={z}>{z}</li>)}
                </ol>
              </div>

              <div>
                <p className="text-xs font-bold text-positive-deep">{m.pros}</p>
                <ul className="mt-1 list-disc pl-5 text-xs leading-relaxed text-ink-soft">
                  {k.pros.map(z => <li key={z}>{z}</li>)}
                </ul>
              </div>

              <div>
                <p className="text-xs font-bold text-caution-deepest">{m.cons}</p>
                <ul className="mt-1 list-disc pl-5 text-xs leading-relaxed text-ink-soft">
                  {k.cons.map(z => <li key={z}>{z}</li>)}
                </ul>
              </div>

              <div className="rounded-lg bg-surface-muted p-3">
                <p className="text-xs font-bold text-ink-soft">{m.fits}</p>
                <ul className="mt-1 list-disc pl-5 text-xs leading-relaxed text-ink-soft">
                  {k.fits.map(z => <li key={z}>{z}</li>)}
                </ul>
              </div>
            </button>
          )
        })}
      </div>

      <div className="rounded-xl border border-edge bg-surface p-4">
        <p className="flex items-center gap-1.5 text-sm font-bold text-ink-soft">
          <KeyRound className="h-4 w-4" /> {m.switching.heading}
        </p>
        <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed text-ink-soft">
          <li><Rich text={m.switching.running} /></li>
          <li><Rich text={m.switching.toLink} /></li>
          <li><Rich text={m.switching.toPin} /></li>
        </ul>
      </div>

      {gewaehlt === 'link' && (
        <p className="flex items-start gap-2 rounded-xl border border-attention-tint-edge bg-attention-tint px-4 py-3 text-sm font-semibold text-attention-deepest">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{m.linkWarning}</span>
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-lg border border-positive-pill-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
          {notice}
        </p>
      )}

      {!bestaetigt && !notice && (
        <p className="text-sm text-ink-soft">{m.confirmHint}</p>
      )}

      <button
        data-lotse="gastzugang.speichern"
        type="button"
        onClick={() => void speichern()}
        disabled={pending || !speicherbar}
        className="flex w-fit items-center gap-1.5 rounded-lg bg-action px-4 py-2.5 font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {geaendert ? m.buttons.switch : bestaetigt ? m.buttons.alreadySet : m.buttons.confirm}
      </button>
    </div>
  )
}
