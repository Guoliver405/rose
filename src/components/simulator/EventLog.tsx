'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, LocateFixed } from 'lucide-react'
import { maidLabel } from '@/lib/cleaning-sim'
import { filterLog, type LogEntry } from '@/lib/sim-log'

/**
 * Ereignis-Protokoll unter einem Bild des Tagesvergleichs (Simulator,
 * 26.09.2026). Zugeklappt die letzten Ereignisse bis zur Uhr, aufgeklappt
 * alles in einem scrollbaren Kasten mit Filter. Er läuft mit der Uhr mit,
 * bis jemand selbst scrollt; „Mitlaufen" holt ihn zurück. Ein Klick auf eine
 * Zeile stellt die Uhr dorthin.
 */
export default function EventLog({ entries, t, clock, onSeek }: {
  entries: LogEntry[]
  t: number
  clock: (min: number) => string
  onSeek: (at: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [follow, setFollow] = useState(true)
  const box = useRef<HTMLDivElement>(null)
  const shown = useMemo(() => filterLog(entries, query), [entries, query])
  // Letzter Eintrag bis zur Uhr — er ist „jetzt".
  let current = -1
  for (let i = 0; i < shown.length && shown[i].at <= t; i++) current = i

  useEffect(() => {
    if (!open || !follow || !box.current) return
    const el = box.current.querySelector<HTMLElement>(`[data-i="${Math.max(0, current)}"]`)
    if (el) box.current.scrollTop = el.offsetTop - box.current.clientHeight / 2
  }, [open, follow, current])

  const row = (e: LogEntry, i: number) => (
    <li key={i} data-i={i}>
      <button type="button" onClick={() => onSeek(e.at)}
        className={`flex w-full items-start gap-2 rounded px-1.5 py-0.5 text-left text-[13px] leading-snug hover:bg-surface-sunken ${
          i === current ? 'bg-surface-sunken ring-1 ring-edge-strong' : ''} ${e.at > t ? 'opacity-45' : ''}`}>
        <span className="w-10 shrink-0 pt-px text-xs font-semibold tabular-nums text-ink-muted">{clock(e.at)}</span>
        <span className={`mt-px shrink-0 rounded px-1 text-[10px] font-bold ${
          e.kind === 'maid' ? 'border border-edge text-ink' : e.kind === 'guest' ? 'text-ink-muted' : 'bg-surface-muted text-ink'}`}>
          {e.kind === 'maid' ? maidLabel(e.maid!) : e.kind === 'guest' ? 'Gast' : 'Haus'}
        </span>
        <span className="text-ink">{e.text}</span>
      </button>
    </li>
  )

  if (!open) {
    const recent = shown.slice(Math.max(0, current - 3), current + 1)
    return (
      <div className="rounded-xl border border-edge p-2">
        <ol className="space-y-0.5" aria-live="polite">
          {recent.length > 0 ? recent.map((e, k) => row(e, current - recent.length + 1 + k))
            : <li className="px-1.5 text-[13px] text-ink-muted">Noch nichts passiert – die Uhr steht vor Schichtbeginn.</li>}
        </ol>
        <button type="button" onClick={() => { setOpen(true); setFollow(true) }}
          className="mt-1 flex items-center gap-1 px-1.5 text-xs font-semibold text-action-strong hover:underline">
          <ChevronDown className="h-3.5 w-3.5" aria-hidden /> Ganzes Protokoll ({entries.length} Ereignisse)
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-edge p-2">
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter: Kraft (A), Etage (3) oder Zimmer (305)"
          aria-label="Protokoll filtern"
          className="min-w-0 flex-1 rounded-lg border border-edge bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-active" />
        {!follow && (
          <button type="button" onClick={() => setFollow(true)} className="flex items-center gap-1 text-xs font-semibold text-action-strong hover:underline">
            <LocateFixed className="h-3.5 w-3.5" aria-hidden /> Mitlaufen
          </button>
        )}
        <button type="button" onClick={() => setOpen(false)} className="flex items-center gap-1 text-xs font-semibold text-ink-soft hover:underline">
          <ChevronUp className="h-3.5 w-3.5" aria-hidden /> Zuklappen
        </button>
      </div>
      <div ref={box} className="relative max-h-80 overflow-y-auto" onWheel={() => setFollow(false)} onTouchMove={() => setFollow(false)}>
        <ol className="space-y-0.5">{shown.map(row)}</ol>
        {shown.length === 0 && <p className="px-1.5 py-2 text-[13px] text-ink-muted">Keine Ereignisse zu diesem Filter.</p>}
      </div>
    </div>
  )
}
