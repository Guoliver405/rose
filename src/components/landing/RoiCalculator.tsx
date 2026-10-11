'use client'

import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatCents } from '@/lib/money'
import {
  DAYS_PER_MONTH, ROI_DEFAULTS, ROI_PRESETS, ROI_SOURCES, computeRoi,
  type RoiInput, type RoiPreset,
} from '@/lib/roi'
import type { LandingMessages } from '@/lib/i18n'
import { format, plural } from '@/lib/i18n/format'

/**
 * Nutzenrechner „Was gewinnt euer Haus?" — Eingaben oben, Ergebnis als zwei
 * Karten (kostet / spart), Annahmen eingeklappt und verstellbar, Quellen
 * darunter. Rechnung in `roi.ts`, hier nur Zustand und Darstellung.
 */
export default function RoiCalculator({ m, intlLocale }: { m: LandingMessages['roi']; intlLocale: string }) {
  const [input, setInput] = useState<RoiInput>(ROI_DEFAULTS)
  const [preset, setPreset] = useState<RoiPreset | null>('typisch')
  const [showAssumptions, setShowAssumptions] = useState(false)
  const r = computeRoi(input)

  function set<K extends keyof RoiInput>(key: K, value: number) {
    setInput(prev => ({ ...prev, [key]: value }))
    if (key === 'optOutRate' || key === 'coordinationMinutes') setPreset(null)
  }

  function applyPreset(p: RoiPreset) {
    setInput(prev => ({ ...prev, ...ROI_PRESETS[p] }))
    setPreset(p)
  }

  const hours = (h: number) => format(m.hours, { count: Math.round(h) })
  const pct = (x: number) => format(m.percent, { value: Math.round(x * 100) })
  const num = (x: number) => x.toLocaleString(intlLocale)
  const a = m.assumptions

  return (
    <div className="rounded-2xl border border-edge bg-surface-elevated p-6">
      <h3 className="text-lg font-bold text-ink">{m.heading}</h3>
      <p className="mt-1 text-sm text-ink-soft">{m.intro}</p>

      {/* Eingaben */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Slider label={m.inputs.rooms} value={input.rooms} min={1} max={300} step={1}
          display={`${input.rooms}`} onChange={v => set('rooms', v)} />
        <Slider label={m.inputs.occupancy} value={input.occupancy * 100} min={30} max={95} step={5}
          display={pct(input.occupancy)} onChange={v => set('occupancy', v / 100)} />
        <Slider label={m.inputs.nights} value={input.nights} min={1} max={10} step={0.5}
          display={plural(intlLocale, input.nights, m.inputs.nightsValue, { nights: num(input.nights) })} onChange={v => set('nights', v)} />
        <Slider label={m.inputs.hourly} value={input.hourlyCostCents / 100} min={12} max={30} step={0.5}
          display={formatCents(input.hourlyCostCents)} onChange={v => set('hourlyCostCents', Math.round(v * 100))}
          hint={m.inputs.hourlyHint} />
      </div>

      {/* Ergebnis */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2" aria-live="polite">
        <div className="rounded-xl border border-edge bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{m.cost.label}</p>
          <p className="mt-1 text-3xl font-black text-ink">{formatCents(r.costCents)}</p>
          <p className="text-sm text-ink-soft">{m.cost.sub}</p>
        </div>
        <div className="rounded-xl border border-positive-tint-edge bg-positive-tint p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-positive-deepest">{m.savings.label}</p>
          <p className="mt-1 text-3xl font-black text-positive-deepest">
            {hours(r.hoursTotal)} <span className="text-lg font-bold">≈ {formatCents(r.savingsCents)}</span>
          </p>
          <p className="text-sm text-positive-deepest">{m.savings.sub}</p>
        </div>
      </div>

      {/* Aufteilung */}
      <div className="mt-4 space-y-2 text-sm">
        <Bar label={format(m.bars.skipped, { count: Math.round(r.skippedPerMonth) })}
          hours={r.hoursSkipped} total={r.hoursTotal} tone="bg-attention" hoursLabel={hours} />
        <Bar label={format(m.bars.coordination, { count: Math.round(r.remainingPerMonth) })}
          hours={r.hoursCoordination} total={r.hoursTotal} tone="bg-action" hoursLabel={hours} />
      </div>
      <p className="mt-3 text-xs text-ink-muted">{m.planning}</p>

      {/* Annahmen */}
      <button
        type="button"
        onClick={() => setShowAssumptions(s => !s)}
        aria-expanded={showAssumptions}
        className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-action-strong hover:underline"
      >
        <ChevronDown className={`h-4 w-4 transition-transform ${showAssumptions ? 'rotate-180' : ''}`} aria-hidden />
        {a.toggle}
      </button>
      {showAssumptions && (
        <div className="mt-3 rounded-xl border border-edge bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-ink-soft">{a.preset}</span>
            {(Object.keys(ROI_PRESETS) as RoiPreset[]).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => applyPreset(p)}
                className={`rounded-full border px-3 py-1 font-semibold ${
                  preset === p
                    ? 'border-action bg-action-tint text-action-deep'
                    : 'border-edge text-ink-soft hover:border-edge-strong'
                }`}
              >
                {a.presets[p]}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Slider label={a.a1.label} value={input.stayoverMinutes} min={10} max={30} step={1}
              display={format(m.minutes, { value: input.stayoverMinutes })} onChange={v => set('stayoverMinutes', v)}
              hint={a.a1.hint} />
            <Slider label={a.a2.label} value={input.optOutRate * 100} min={0} max={50} step={5}
              display={pct(input.optOutRate)} onChange={v => set('optOutRate', v / 100)}
              hint={a.a2.hint} />
            <Slider label={a.a3.label} value={input.coordinationMinutes} min={0} max={5} step={0.5}
              display={format(m.minutes, { value: num(input.coordinationMinutes) })} onChange={v => set('coordinationMinutes', v)}
              hint={a.a3.hint} />
          </div>
          <p className="mt-4 text-xs text-ink-muted">
            {plural(intlLocale, input.nights, a.formula, {
              nights: num(input.nights),
              share: pct(r.occupiedPerDay > 0 ? r.stayoverPerDay / r.occupiedPerDay : 0),
              days: DAYS_PER_MONTH,
            })}
          </p>
        </div>
      )}

      {/* Quellen */}
      <details className="mt-4 text-xs text-ink-muted">
        <summary className="cursor-pointer font-semibold hover:text-ink">{m.sources.summary}</summary>
        <ol className="mt-2 space-y-1.5 pl-4">
          {ROI_SOURCES.map(s => (
            <li key={s.id}>
              <span className="font-semibold">[{s.id}]</span> {m.sources.items[s.id]}{' '}
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">{m.sources.link}</a>
            </li>
          ))}
        </ol>
        <p className="mt-2">{m.sources.note}</p>
      </details>
    </div>
  )
}

function Slider({
  label, value, min, max, step, display, onChange, hint,
}: {
  label: string; value: number; min: number; max: number; step: number
  display: string; onChange: (v: number) => void; hint?: string
}) {
  const id = useId()
  return (
    <label htmlFor={id} className="block">
      <span className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold text-ink">{label}</span>
        <span className="font-mono text-ink-soft">{display}</span>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-action"
      />
      {hint && <span className="block text-xs text-ink-muted">{hint}</span>}
    </label>
  )
}

function Bar({ label, hours, total, tone, hoursLabel }: { label: string; hours: number; total: number; tone: string; hoursLabel: (h: number) => string }) {
  const width = total > 0 ? Math.max(2, (hours / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between gap-2 text-xs text-ink-soft">
        <span>{label}</span>
        <span className="font-semibold text-ink">{hoursLabel(hours)}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-muted">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}
