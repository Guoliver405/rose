'use client'

// VORÜBERGEHEND — UI zum Test-Szenario-Seeding, siehe test-actions.ts.

import { useState, useTransition } from 'react'
import { Dices, Eraser, FlaskConical, Loader2, Trash2 } from 'lucide-react'
import {
  purgeTestDataAction, resetTestScenarioAction, seedTestScenarioAction,
  type PurgeSummary, type SeedSummary,
} from './test-actions'
import { format, plural } from '@/lib/i18n/format'
import type { AdminMessages } from '@/lib/i18n'

function randomSeed() {
  return Math.floor(Math.random() * 9000) + 1000
}

export default function TestScenarioPanel({ hotelSlug, roomCount, m, intlLocale }: {
  hotelSlug: string
  roomCount: number
  m: AdminMessages['settings']['testScenario']
  intlLocale: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<SeedSummary | null>(null)
  const [resetDone, setResetDone] = useState(false)
  const [purged, setPurged] = useState<PurgeSummary | null>(null)

  const [seed, setSeed] = useState(randomSeed)
  const [occupiedPct, setOccupiedPct] = useState(60)
  const [pleaseCleanPct, setPleaseCleanPct] = useState(50)
  const [dndPct, setDndPct] = useState(25)
  const [checkedOutPct, setCheckedOutPct] = useState(50)
  const [priority, setPriority] = useState(2)
  const [orders, setOrders] = useState(3)

  // Live-Vorschau der absoluten Zahlen — gleiche Rundung wie serverseitig.
  const occupied = Math.round(roomCount * occupiedPct / 100)
  const free = roomCount - occupied
  const checkedOut = Math.round(free * checkedOutPct / 100)
  const pleaseClean = Math.round(occupied * pleaseCleanPct / 100)
  const dnd = Math.min(Math.round(occupied * dndPct / 100), occupied - pleaseClean)

  function submitSeed() {
    if (!window.confirm(m.confirmSeed)) return
    setError(null); setSummary(null); setResetDone(false); setPurged(null)
    startTransition(async () => {
      const res = await seedTestScenarioAction(hotelSlug, {
        seed, occupiedPct, pleaseCleanPct, dndPct, checkedOutPct, priority, orders,
      })
      if (res.error) { setError(res.error); return }
      setSummary(res.summary ?? null)
    })
  }

  function submitReset() {
    if (!window.confirm(m.confirmReset)) return
    setError(null); setSummary(null); setResetDone(false); setPurged(null)
    startTransition(async () => {
      const res = await resetTestScenarioAction(hotelSlug)
      if (res.error) { setError(res.error); return }
      setResetDone(true)
    })
  }

  function submitPurge() {
    if (!window.confirm(m.confirmPurge)) return
    setError(null); setSummary(null); setResetDone(false); setPurged(null)
    startTransition(async () => {
      const res = await purgeTestDataAction(hotelSlug)
      if (res.error) { setError(res.error); return }
      setPurged(res.summary ?? null)
    })
  }

  const inputClass =
    'rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink focus:border-action focus:outline-none'

  const sliders: { label: string; value: number; set: (v: number) => void; preview: string }[] = [
    { label: m.sliders.occupied, value: occupiedPct, set: setOccupiedPct, preview: format(m.sliders.preview, { count: occupied, total: roomCount }) },
    { label: m.sliders.pleaseClean, value: pleaseCleanPct, set: setPleaseCleanPct, preview: format(m.sliders.preview, { count: pleaseClean, total: occupied }) },
    { label: m.sliders.dnd, value: dndPct, set: setDndPct, preview: format(m.sliders.preview, { count: dnd, total: occupied }) },
    { label: m.sliders.checkedOut, value: checkedOutPct, set: setCheckedOutPct, preview: format(m.sliders.preview, { count: checkedOut, total: free }) },
  ]

  return (
    <form
      onSubmit={e => { e.preventDefault(); submitSeed() }}
      className="flex flex-col gap-4 rounded-xl border border-attention-tint-edge bg-attention-tint p-4"
    >
      <h2 className="flex items-center gap-1.5 text-sm font-bold text-attention-deepest">
        <FlaskConical className="h-4 w-4" /> {m.heading}
      </h2>
      <p className="text-xs text-ink-muted">{m.intro}</p>

      <div className="flex flex-col gap-3">
        {sliders.map(s => (
          <label key={s.label} className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
            <span>
              {s.label}: <span className="text-ink">{s.value}%</span>
              <span className="ml-2 font-normal">≈ {s.preview}</span>
            </span>
            <input
              type="range" min={0} max={100} step={5}
              value={s.value}
              onChange={e => s.set(Number(e.target.value))}
              className="w-full max-w-md accent-current"
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          {m.priority}
          <input
            type="number" min={0} max={roomCount} value={priority}
            onChange={e => setPriority(Number(e.target.value))}
            className={`${inputClass} w-20`}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          {m.orders}
          <input
            type="number" min={0} max={roomCount} value={orders}
            onChange={e => setOrders(Number(e.target.value))}
            className={`${inputClass} w-20`}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          {m.seed}
          <span className="flex items-center gap-1">
            <input
              type="number" min={1} value={seed}
              onChange={e => setSeed(Number(e.target.value))}
              className={`${inputClass} w-28`}
            />
            <button
              type="button"
              title={m.rollSeed}
              onClick={() => setSeed(randomSeed())}
              className="rounded-lg border border-edge p-2 text-ink-soft hover:border-edge-strong hover:text-ink"
            >
              <Dices className="h-4 w-4" />
            </button>
          </span>
        </label>
      </div>

      {error && (
        <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
          {error}
        </p>
      )}
      {resetDone && !error && (
        <p className="rounded-lg border border-positive-pill-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
          {m.resetDone}
        </p>
      )}

      {purged && !error && (
        <p className="rounded-lg border border-positive-pill-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
          {format(m.purged, {
            stays: plural(intlLocale, purged.stays, m.purgedCounts.stays),
            orders: plural(intlLocale, purged.orders, m.purgedCounts.orders),
            transitions: plural(intlLocale, purged.transitions, m.purgedCounts.transitions),
            staffLog: plural(intlLocale, purged.staffLog, m.purgedCounts.staffLog),
          })}
        </p>
      )}

      {summary && !error && (
        <div className="flex flex-col gap-2 rounded-lg border border-edge bg-surface p-3 text-sm text-ink">
          <p className="font-bold">{format(m.summaryTitle, { seed })}</p>
          {summary.stays.length > 0 && (
            <table className="w-fit text-left text-xs">
              <thead>
                <tr className="text-ink-muted">
                  <th className="pr-4 font-semibold">{m.table.room}</th>
                  <th className="pr-4 font-semibold">{m.table.pin}</th>
                  <th className="pr-4 font-semibold">{m.table.signal}</th>
                  <th className="font-semibold">{m.table.since}</th>
                </tr>
              </thead>
              <tbody>
                {summary.stays.map(s => (
                  <tr key={s.room}>
                    <td className="pr-4 font-bold">{s.room}</td>
                    <td className="pr-4 font-mono">{s.pin}</td>
                    <td className="pr-4">{m.signals[s.signal]}</td>
                    <td>{s.sinceYesterday ? m.table.yesterday : m.table.today}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-xs text-ink-muted">
            {format(m.summaryLine, {
              checkedOut: summary.checkedOut.length > 0 ? summary.checkedOut.join(', ') : m.noneListed,
              priority: summary.priority.length > 0 ? summary.priority.join(', ') : m.noneListed,
              orders: summary.orders,
            })}
          </p>
          {summary.notes.map(n => (
            <p key={n} className="text-xs font-semibold text-attention-strong">{n}</p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1.5 rounded-lg bg-attention px-4 py-2 text-sm font-bold text-attention-foreground hover:bg-attention-strong disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
          {m.create}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={submitReset}
          className="flex items-center gap-1.5 rounded-lg border border-edge px-4 py-2 text-sm font-bold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" /> {m.reset}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={submitPurge}
          className="flex items-center gap-1.5 rounded-lg border border-critical-tint-edge px-4 py-2 text-sm font-bold text-critical-strong hover:bg-critical-tint disabled:opacity-50"
          title={m.purgeTitle}
        >
          <Eraser className="h-4 w-4" /> {m.purge}
        </button>
      </div>
      <p className="text-xs text-ink-muted">{m.footnote}</p>
    </form>
  )
}
