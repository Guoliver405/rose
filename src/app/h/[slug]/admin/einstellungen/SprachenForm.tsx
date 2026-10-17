'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Languages, Loader2 } from 'lucide-react'
import { GUIDE_LANGS, type GuideLang } from '@/lib/i18n/langs'
import { LOCALES, LOCALE_NAMES, type Locale } from '@/lib/i18n/locales'
import { updateLanguagesAction } from './actions'
import { useUnsavedSection } from '@/components/unsaved/UnsavedChanges'
import Rich from '@/components/i18n/Rich'
import type { AdminMessages } from '@/lib/i18n'

/**
 * Sprachen des Hauses (seit 17.10.2026, Bauplan
 * `Sessions/Sprachen-des-Hauses-Plan-2026-10-17.md`):
 *
 * - **Heimatsprache** — darin legt das Haus seine Inhalte an (Service-Baukasten).
 * - **Rückfallsprache** — die sehen die Portale, wenn das Gerät eine Sprache
 *   hat, die nicht angeboten wird. Sie ist zugleich die **erste Sprache der
 *   Ausdrucke und der Zugangs-E-Mail** — keine eigene Einstellung mehr, sonst
 *   liefen drei Spracheinstellungen leise auseinander.
 * - **Zweite Sprache der Ausdrucke** — wahlweise, nur auf Papier.
 *
 * **Warum höchstens zwei Sprachen auf Papier** (09.09.2026, Bauplan
 * `Sessions/Druckblaetter-Plan-2026-09-09.md`): vier Sprachen waren
 * willkürlich und machten das Blatt zu einem dichten Formular. Die Erklärung
 * tragen Piktogramme der Portal-Knöpfe; den Rest übersetzt das Portal.
 */
export default function SprachenForm({
  hotelSlug, initial, m, langLabels,
}: {
  hotelSlug: string
  initial: { home: Locale; fallback: Locale; second: GuideLang | null }
  /** Name jeder Blatt-Sprache in ihr selbst („Français“) — kommt vom Server, damit die Sprachdateien nicht ins Browser-Bundle wandern. */
  langLabels: Record<GuideLang, string>
  m: AdminMessages['settings']['languages']
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [home, setHome] = useState<Locale>(initial.home)
  const [fallback, setFallback] = useState<Locale>(initial.fallback)
  const [second, setSecond] = useState<string>(initial.second ?? '')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Erste Sprache der Ausdrucke = Rückfallsprache; kennen die Blätter sie nicht, englisch.
  const firstSheet: GuideLang = (GUIDE_LANGS as readonly string[]).includes(fallback) ? (fallback as GuideLang) : 'en'
  const secondValue = second === firstSheet ? '' : second

  const geaendert = home !== initial.home || fallback !== initial.fallback || secondValue !== (initial.second ?? '')

  async function speichern(): Promise<boolean> {
    setError(null)
    setNotice(null)
    setPending(true)
    try {
      const res = await updateLanguagesAction(hotelSlug, home, fallback, secondValue)
      if (res.error) { setError(res.error); return false }
      setNotice(m.saved)
      router.refresh()
      return true
    } finally {
      setPending(false)
    }
  }

  useUnsavedSection('sprachen', {
    label: m.unsavedLabel,
    dirty: geaendert,
    save: speichern,
    discard: () => { setHome(initial.home); setFallback(initial.fallback); setSecond(initial.second ?? '') },
  })

  const select =
    'rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink focus:border-action focus:outline-none'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-4 rounded-xl border border-edge bg-surface p-4">
        <div className="flex flex-wrap gap-4">
          <label className="flex max-w-xs flex-col gap-1">
            <span className="text-xs font-bold text-ink-soft">{m.home}</span>
            <select
              value={home}
              onChange={e => {
                const next = e.target.value as Locale
                // Folgte die Rückfallsprache bisher der Heimatsprache, zieht sie mit.
                if (fallback === home) setFallback(next)
                setHome(next)
              }}
              className={select}
            >
              {LOCALES.map(l => <option key={l} value={l}>{LOCALE_NAMES[l]}</option>)}
            </select>
            <span className="text-[11px] text-ink-muted">{m.homeHint}</span>
          </label>

          <label className="flex max-w-xs flex-col gap-1">
            <span className="text-xs font-bold text-ink-soft">{m.fallback}</span>
            <select value={fallback} onChange={e => setFallback(e.target.value as Locale)} className={select}>
              {LOCALES.map(l => <option key={l} value={l}>{LOCALE_NAMES[l]}</option>)}
            </select>
            <span className="text-[11px] text-ink-muted">{m.fallbackHint}</span>
          </label>
        </div>

        <div className="flex flex-wrap items-end gap-4 border-t border-edge pt-4">
          <div className="flex max-w-xs flex-col gap-1">
            <span className="text-xs font-bold text-ink-soft">{m.first}</span>
            <span className="rounded-lg border border-dashed border-edge px-3 py-2 text-sm font-semibold text-ink-soft">
              {langLabels[firstSheet]}
            </span>
            <span className="text-[11px] text-ink-muted">{m.firstHint}</span>
          </div>

          <label className="flex max-w-xs flex-col gap-1">
            <span className="text-xs font-bold text-ink-soft">{m.second}</span>
            <select value={secondValue} onChange={e => setSecond(e.target.value)} className={select}>
              <option value="">{m.none}</option>
              {GUIDE_LANGS.filter(l => l !== firstSheet).map(l => (
                <option key={l} value={l}>{langLabels[l]}</option>
              ))}
            </select>
            <span className="text-[11px] text-ink-muted">{m.secondHint}</span>
          </label>

          <button
            type="button"
            onClick={() => void speichern()}
            disabled={pending || !geaendert}
            className="flex items-center gap-1.5 rounded-lg bg-action px-4 py-2.5 font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {geaendert ? m.save : m.alreadySet}
          </button>
        </div>
      </div>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
        <Languages className="mt-0.5 h-4 w-4 shrink-0" />
        <span><Rich text={m.recommendation} /></span>
      </p>

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
    </div>
  )
}
