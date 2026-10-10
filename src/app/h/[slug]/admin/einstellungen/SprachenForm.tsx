'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Languages, Loader2 } from 'lucide-react'
import { GUIDE_LANGS, type GuideLang } from '@/lib/i18n/langs'
import { updateSheetLanguagesAction } from './actions'
import { useUnsavedSection } from '@/components/unsaved/UnsavedChanges'
import type { AdminMessages } from '@/lib/i18n'

/**
 * Sprachen der gedruckten Blätter — und der Zugangs-Mail.
 *
 * **Warum nur zwei** (09.09.2026, Bauplan `Sessions/Druckblaetter-Plan-2026-09-09.md`):
 * Bis zum 09.09. standen vier Sprachen auf jedem Blatt. Das ist willkürlich —
 * einem italienischen, polnischen oder chinesischen Gast hilft keine davon —
 * und es war der Grund, warum das Blatt ein dichtes Formular bei 10 px war.
 * Die Erklärung tragen jetzt Piktogramme der Portal-Knöpfe; der Text steht in
 * einer Hauptsprache und höchstens einer zweiten.
 *
 * Die **erste** Sprache ist zugleich die der Zugangs-Mail: eine Mail in zwei
 * Sprachen wäre doppelt so lang, ohne mehr zu sagen.
 */
export default function SprachenForm({
  hotelSlug, erste: ersteInitial, zweite: zweiteInitial, m, langLabels,
}: {
  hotelSlug: string
  erste: GuideLang
  zweite: GuideLang | null
  /** Name jeder Blatt-Sprache in ihr selbst („Français“) — kommt vom Server, damit die Sprachdateien nicht ins Browser-Bundle wandern. */
  langLabels: Record<GuideLang, string>
  m: AdminMessages['settings']['languages']
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [erste, setErste] = useState<GuideLang>(ersteInitial)
  const [zweite, setZweite] = useState<string>(zweiteInitial ?? '')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const geaendert = erste !== ersteInitial || zweite !== (zweiteInitial ?? '')

  async function speichern(): Promise<boolean> {
    setError(null)
    setNotice(null)
    setPending(true)
    try {
      const res = await updateSheetLanguagesAction(hotelSlug, erste, zweite)
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
    discard: () => { setErste(ersteInitial); setZweite(zweiteInitial ?? '') },
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-edge bg-surface p-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-ink-soft">{m.first}</span>
          <select
            value={erste}
            onChange={e => setErste(e.target.value as GuideLang)}
            className="rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink focus:border-action focus:outline-none"
          >
            {GUIDE_LANGS.map(l => (
              <option key={l} value={l}>{langLabels[l]}</option>
            ))}
          </select>
          <span className="text-[11px] text-ink-muted">{m.firstHint}</span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-ink-soft">{m.second}</span>
          <select
            value={zweite}
            onChange={e => setZweite(e.target.value)}
            className="rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink focus:border-action focus:outline-none"
          >
            <option value="">{m.none}</option>
            {GUIDE_LANGS.filter(l => l !== erste).map(l => (
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

      <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
        <Languages className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{m.recommendation}</span>
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
