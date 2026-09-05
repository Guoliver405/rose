'use client'

import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatCents } from '@/lib/money'
import {
  ROI_DEFAULTS, ROI_PRESETS, ROI_SOURCES, computeRoi,
  type RoiInput, type RoiPreset,
} from '@/lib/roi'

/**
 * Nutzenrechner „Was gewinnt euer Haus?" — Eingaben oben, Ergebnis als zwei
 * Karten (kostet / spart), Annahmen eingeklappt und verstellbar, Quellen
 * darunter. Rechnung in `roi.ts`, hier nur Zustand und Darstellung.
 */
export default function RoiCalculator() {
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

  const hours = (h: number) => `${Math.round(h)} h`
  const pct = (x: number) => `${Math.round(x * 100)} %`

  return (
    <div className="rounded-2xl border border-edge bg-surface-elevated p-6">
      <h3 className="text-lg font-bold text-ink">Was gewinnt euer Haus?</h3>
      <p className="mt-1 text-sm text-ink-soft">
        Zwei Hebel, die sich beziffern lassen: entfallende Reinigungen und
        weniger Leerlauf je Reinigung. Alles andere — weniger Wäsche, weniger
        Beschwerden, der Arbeitsnachweis — rechnen wir nicht ein.
      </p>

      {/* Eingaben */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Slider label="Zimmer" value={input.rooms} min={1} max={300} step={1}
          display={`${input.rooms}`} onChange={v => set('rooms', v)} />
        <Slider label="Auslastung" value={input.occupancy * 100} min={30} max={95} step={5}
          display={pct(input.occupancy)} onChange={v => set('occupancy', v / 100)} />
        <Slider label="Ø Aufenthaltsdauer" value={input.nights} min={1} max={10} step={0.5}
          display={`${input.nights.toLocaleString('de-DE')} Nächte`} onChange={v => set('nights', v)} />
        <Slider label="Kosten einer Reinigungsstunde" value={input.hourlyCostCents / 100} min={12} max={30} step={0.5}
          display={formatCents(input.hourlyCostCents)} onChange={v => set('hourlyCostCents', Math.round(v * 100))}
          hint="Lohn plus Nebenkosten*" />
      </div>

      {/* Ergebnis */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2" aria-live="polite">
        <div className="rounded-xl border border-edge bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">RoSe kostet</p>
          <p className="mt-1 text-3xl font-black text-ink">{formatCents(r.costCents)}</p>
          <p className="text-sm text-ink-soft">im Monat, zzgl. USt. · erster Monat frei</p>
        </div>
        <div className="rounded-xl border border-positive-tint-edge bg-positive-tint p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-positive-deepest">RoSe spart etwa</p>
          <p className="mt-1 text-3xl font-black text-positive-deepest">
            {hours(r.hoursTotal)} <span className="text-lg font-bold">≈ {formatCents(r.savingsCents)}</span>
          </p>
          <p className="text-sm text-positive-deepest">Reinigungszeit im Monat, mit den Annahmen unten*</p>
        </div>
      </div>

      {/* Aufteilung */}
      <div className="mt-4 space-y-2 text-sm">
        <Bar label={`Entfallende Stayover-Reinigungen (${Math.round(r.skippedPerMonth)} im Monat)`}
          hours={r.hoursSkipped} total={r.hoursTotal} tone="bg-attention" />
        <Bar label={`Weniger Leerlauf bei ${Math.round(r.remainingPerMonth)} verbleibenden Reinigungen`}
          hours={r.hoursCoordination} total={r.hoursTotal} tone="bg-action" />
      </div>
      <p className="mt-3 text-xs text-ink-muted">
        Gesparte Stunden werden nur zu gesparten Kosten, wenn die Einsatzplanung
        mitzieht. RoSe zeigt dafür in der Auswertung, wie viel Reinigungszeit
        tatsächlich anfällt.
      </p>

      {/* Annahmen */}
      <button
        type="button"
        onClick={() => setShowAssumptions(s => !s)}
        aria-expanded={showAssumptions}
        className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-action-strong hover:underline"
      >
        <ChevronDown className={`h-4 w-4 transition-transform ${showAssumptions ? 'rotate-180' : ''}`} aria-hidden />
        Annahmen anpassen*
      </button>
      {showAssumptions && (
        <div className="mt-3 rounded-xl border border-edge bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-ink-soft">Voreinstellung:</span>
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
                {p}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Slider label="A1 · Dauer einer Stayover-Reinigung" value={input.stayoverMinutes} min={10} max={30} step={1}
              display={`${input.stayoverMinutes} min`} onChange={v => set('stayoverMinutes', v)}
              hint="Richtwerte 12–25 min [Q3, Q4]" />
            <Slider label="A2 · Gäste, die auf die tägliche Reinigung verzichten" value={input.optOutRate * 100} min={0} max={50} step={5}
              display={pct(input.optOutRate)} onChange={v => set('optOutRate', v / 100)}
              hint="20 % Planungswert, 34 % in einer Fallstudie, 70 % wünschen es [Q1–Q3]" />
            <Slider label="A3 · Weniger Leerlauf je Reinigung" value={input.coordinationMinutes} min={0} max={5} step={0.5}
              display={`${input.coordinationMinutes.toLocaleString('de-DE')} min`} onChange={v => set('coordinationMinutes', v)}
              hint="Hersteller nennen 25–67 % — wir nehmen ≈ 7–10 % [Q6]" />
          </div>
          <p className="mt-4 text-xs text-ink-muted">
            Stayover-Anteil = 1 − 1 / Aufenthaltsdauer (bei {input.nights.toLocaleString('de-DE')} Nächten{' '}
            {pct(r.occupiedPerDay > 0 ? r.stayoverPerDay / r.occupiedPerDay : 0)} der belegten Zimmer).
            Monat = 30 Tage. Stundenkosten-Vorgabe: Mindestlohn 13,90 € × 1,23 Lohnnebenkosten [Q5].
          </p>
        </div>
      )}

      {/* Quellen */}
      <details className="mt-4 text-xs text-ink-muted">
        <summary className="cursor-pointer font-semibold hover:text-ink">* Quellen der Annahmen</summary>
        <ol className="mt-2 space-y-1.5 pl-4">
          {ROI_SOURCES.map(s => (
            <li key={s.id}>
              <span className="font-semibold">[{s.id}]</span> {s.text}{' '}
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">Quelle</a>
            </li>
          ))}
        </ol>
        <p className="mt-2">
          Herstellerangaben sind als solche gekennzeichnet; eine deutsche Erhebung
          zum Verzichtsverhalten kennen wir nicht. Alle Werte sind Schätzungen,
          keine Zusicherung.
        </p>
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

function Bar({ label, hours, total, tone }: { label: string; hours: number; total: number; tone: string }) {
  const width = total > 0 ? Math.max(2, (hours / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between gap-2 text-xs text-ink-soft">
        <span>{label}</span>
        <span className="font-semibold text-ink">{Math.round(hours)} h</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-muted">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}
