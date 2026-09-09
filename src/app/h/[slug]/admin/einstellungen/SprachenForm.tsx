'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Languages, Loader2 } from 'lucide-react'
import { GUIDE_LANGS, sheetLanguageLabel, type GuideLang } from '@/lib/guest-guide'
import { updateSheetLanguagesAction } from './actions'

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
  hotelSlug, erste: ersteInitial, zweite: zweiteInitial,
}: {
  hotelSlug: string
  erste: GuideLang
  zweite: GuideLang | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [erste, setErste] = useState<GuideLang>(ersteInitial)
  const [zweite, setZweite] = useState<string>(zweiteInitial ?? '')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const geaendert = erste !== ersteInitial || zweite !== (zweiteInitial ?? '')

  function speichern() {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const res = await updateSheetLanguagesAction(hotelSlug, erste, zweite)
      if (res.error) { setError(res.error); return }
      setNotice('Gespeichert. Die nächsten Ausdrucke und Mails folgen der neuen Wahl.')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-edge bg-surface p-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-ink-soft">Erste Sprache</span>
          <select
            value={erste}
            onChange={e => setErste(e.target.value as GuideLang)}
            className="rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink focus:border-action focus:outline-none"
          >
            {GUIDE_LANGS.map(l => (
              <option key={l} value={l}>{sheetLanguageLabel(l)}</option>
            ))}
          </select>
          <span className="text-[11px] text-ink-muted">Größer gesetzt · Sprache der Mail</span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold text-ink-soft">Zweite Sprache</span>
          <select
            value={zweite}
            onChange={e => setZweite(e.target.value)}
            className="rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink focus:border-action focus:outline-none"
          >
            <option value="">— keine —</option>
            {GUIDE_LANGS.filter(l => l !== erste).map(l => (
              <option key={l} value={l}>{sheetLanguageLabel(l)}</option>
            ))}
          </select>
          <span className="text-[11px] text-ink-muted">Kleiner darunter · nur auf dem Ausdruck</span>
        </label>

        <button
          type="button"
          onClick={speichern}
          disabled={pending || !geaendert}
          className="flex items-center gap-1.5 rounded-lg bg-action px-4 py-2.5 font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {geaendert ? 'Sprachen speichern' : 'Bereits eingestellt'}
        </button>
      </div>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
        <Languages className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Englisch als zweite Sprache ist die Empfehlung: Wer weder Ihre Landessprache noch
          Englisch liest, kommt über die Piktogramme und den QR-Code weiter — im Portal kann er
          den Text mit dem Handy übersetzen. Eine dritte und vierte Sprache auf Papier hilft
          weniger, als sie an Platz kostet.
        </span>
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
