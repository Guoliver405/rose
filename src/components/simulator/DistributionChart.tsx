'use client'

import { useState } from 'react'
import { clockLabel } from '@/lib/cleaning-sim'
import { dist } from '@/lib/sim-batch'
import { histograms } from '@/lib/sim-chart'

/**
 * Verteilung einer Uhrzeit über alle gerechneten Tage (Simulator Phase 3,
 * 26.09.2026): je Zeitklasse eine Säule, oben ohne Steuerung, unten mit RoSe,
 * gemeinsame Achse und gemeinsame Höhe. Form „Hervorhebung": RoSe in der
 * Aktionsfarbe, die Vergleichsreihe grau (`--color-chart-context`, im
 * Validator ≥ 3:1 auf der Fläche, Abstand zu Blau ΔE ≥ 16 normal/protan;
 * tritan im Hellen 6,9 — erlaubt, weil beide Reihen zusätzlich über
 * getrennte, beschriftete Zeilen unterschieden werden).
 *
 * Säulen ≤ 24 px, oben 4 px gerundet, 2 px Luft; Trefferfläche ist die ganze
 * Spalte der Zeile, nicht nur die Säule. Tooltip bei Zeiger und Tastatur,
 * die Zahlen stehen zusätzlich in der Tabelle darunter.
 */

type Row = { key: string; label: string; values: number[]; color: string }

const W = 960
const LEFT = 118
const RIGHT = 56
const ROW_H = 72
const GAP_ROWS = 22
const TOP = 22
const AXIS_H = 44

export default function DistributionChart({ rows, horizon, shiftStart, checkinAt, title }: {
  rows: Row[]
  horizon: number
  shiftStart: number
  /** Senkrechte Linie (Schichtminute), z. B. der Check-in. */
  checkinAt?: number
  title: string
}) {
  const [hover, setHover] = useState<{ row: number; bin: number } | null>(null)
  const hs = histograms(rows.map(r => r.values), { horizon, shiftStart })
  const [lo, hi] = hs[0].domain
  const plotW = W - LEFT - RIGHT
  const x = (m: number) => LEFT + ((m - lo) / (hi - lo)) * plotW
  const slot = plotW / hs[0].bins.length
  const barW = Math.max(2, Math.min(24, slot - 2))
  const rowTop = (i: number) => TOP + i * (ROW_H + GAP_ROWS)
  const H = rowTop(rows.length) - GAP_ROWS + AXIS_H
  const clock = (m: number) => clockLabel(m, shiftStart)
  const hours: number[] = []
  for (let m = lo; m <= hi; m += 60) hours.push(m)
  const showNotDone = hs.some(h => h.notDone > 0)
  const notDoneX = W - RIGHT + 10

  const tip = hover && (() => {
    const h = hs[hover.row]
    const isNotDone = hover.bin === -1
    const b = isNotDone ? null : h.bins[hover.bin]
    const count = isNotDone ? h.notDone : b!.count
    const left = isNotDone ? notDoneX : x(b!.from) + slot / 2
    return {
      left: `${(left / W) * 100}%`,
      top: `${(rowTop(hover.row) / H) * 100}%`,
      value: `${count} ${count === 1 ? 'Tag' : 'Tage'}`,
      label: `${rows[hover.row].label} · ${isNotDone ? 'nicht fertig' : `${clock(b!.from)}–${clock(b!.to)}`}`,
    }
  })()

  return (
    <figure className="relative">
      <figcaption className="mb-2 text-sm font-semibold text-ink">{title}</figcaption>
      {/* Mindestbreite: am Handy seitlich scrollen statt Schrift unter 8 px */}
      <div className="overflow-x-auto">
      <div className="relative min-w-[600px]">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img"
        aria-label={`${title}: ${rows.map(r => `${r.label} Median ${clock(dist(r.values).median)}`).join(', ')}`}>
        {/* Stundenraster: Haarlinien, eine Stufe neben der Fläche */}
        {hours.map(m => (
          <g key={m}>
            <line x1={x(m)} x2={x(m)} y1={TOP - 6} y2={H - AXIS_H + 20} className="stroke-edge" strokeWidth={1} />
            <text x={x(m)} y={H - 6} textAnchor="middle" className="fill-ink-muted text-[11px] tabular-nums">{clock(m)}</text>
          </g>
        ))}
        {rows.map((r, i) => {
          const h = hs[i]
          const base = rowTop(i) + ROW_H
          const med = dist(r.values).median
          return (
            <g key={r.key}>
              <line x1={LEFT} x2={W - RIGHT} y1={base} y2={base} className="stroke-edge-strong" strokeWidth={1} />
              <rect x={8} y={rowTop(i) + ROW_H / 2 - 6} width={12} height={12} rx={3} fill={r.color} />
              <text x={26} y={rowTop(i) + ROW_H / 2 + 4} className="fill-ink text-[13px] font-semibold">{r.label}</text>
              {h.bins.map((b, k) => {
                const hgt = (b.count / h.maxCount) * (ROW_H - 4)
                const bx = x(b.from) + (slot - barW) / 2
                const active = hover?.row === i && hover.bin === k
                return (
                  <g key={k}>
                    {b.count > 0 && <path d={barPath(bx, base, barW, hgt)} fill={r.color} opacity={hover && !active ? 0.55 : 1} />}
                    {b.count > 0 && (
                      <rect x={x(b.from)} y={rowTop(i)} width={slot} height={ROW_H} fill="transparent" tabIndex={0}
                        aria-label={`${r.label}, ${clock(b.from)} bis ${clock(b.to)}: ${b.count} Tage`}
                        onPointerEnter={() => setHover({ row: i, bin: k })} onPointerLeave={() => setHover(null)}
                        onFocus={() => setHover({ row: i, bin: k })} onBlur={() => setHover(null)} className="outline-none" />
                    )}
                  </g>
                )
              })}
              {showNotDone && h.notDone > 0 && (
                <g>
                  <path d={barPath(notDoneX, base, 14, (h.notDone / h.maxCount) * (ROW_H - 4))} fill={r.color} />
                  <rect x={notDoneX - 6} y={rowTop(i)} width={26} height={ROW_H} fill="transparent" tabIndex={0}
                    aria-label={`${r.label}, nicht fertig: ${h.notDone} Tage`}
                    onPointerEnter={() => setHover({ row: i, bin: -1 })} onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover({ row: i, bin: -1 })} onBlur={() => setHover(null)} className="outline-none" />
                </g>
              )}
              {/* Median: kleiner Dorn unter der Grundlinie mit Uhrzeit */}
              {med < horizon && (
                <g>
                  <path d={`M ${x(med)} ${base + 2} l -4 6 h 8 z`} className="fill-ink" />
                  <text x={x(med) + 7} y={base + 14} className="fill-ink-soft text-[11px] tabular-nums">Median {clock(Math.round(med))}</text>
                </g>
              )}
            </g>
          )
        })}
        {showNotDone && <text x={notDoneX + 7} y={H - 6} textAnchor="middle" className="fill-ink-muted text-[10px]">nicht fertig</text>}
        {checkinAt !== undefined && checkinAt > lo && checkinAt < hi && (
          <g>
            <line x1={x(checkinAt)} x2={x(checkinAt)} y1={TOP - 10} y2={H - AXIS_H + 20} className="stroke-ink-soft" strokeWidth={1.5} />
            <text x={x(checkinAt) + 4} y={TOP - 12} className="fill-ink-soft text-[11px] font-semibold">Check-in {clock(checkinAt)}</text>
          </g>
        )}
      </svg>
      {tip && (
        <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-edge bg-surface-elevated px-2.5 py-1.5 text-xs shadow"
          style={{ left: tip.left, top: tip.top }}>
          <div className="font-bold tabular-nums text-ink">{tip.value}</div>
          <div className="text-ink-muted">{tip.label}</div>
        </div>
      )}
      </div>
      </div>
    </figure>
  )
}

/** Säule mit 4 px Rundung oben, eckig an der Grundlinie. */
function barPath(x: number, base: number, w: number, h: number): string {
  if (h <= 0) return ''
  const r = Math.min(4, w / 2, h)
  const top = base - h
  return `M ${x} ${base} V ${top + r} Q ${x} ${top} ${x + r} ${top} H ${x + w - r} Q ${x + w} ${top} ${x + w} ${top + r} V ${base} Z`
}
