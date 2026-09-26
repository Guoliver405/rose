'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { AlertTriangle, Ban, Check, Clock, DoorClosed, Flag, Hand, Leaf, Loader2, Pause, Play, RotateCcw } from 'lucide-react'
import {
  MAID_LABELS, SCENARIO, clockLabel, highlights, maidsAt, roseHighlights, simulate, tilesAt,
  type Highlight, type SimResult, type Strategy, type Tile, type TileState,
} from '@/lib/cleaning-sim'

/**
 * Reinigungs-Vergleich (25./26.09.2026): derselbe Tag dreimal nebeneinander —
 * ohne Steuerung, mit Etagenscore, mit Etagenscore + Reinigung auf Wunsch.
 * Die Rechnung liegt vollständig in `cleaning-sim.ts`; hier wird nur der
 * Zustand zum Zeitpunkt t gezeichnet, deshalb laufen alle drei Bilder an
 * einer Uhr. Statt Zählern zum Vergleichen steht unter jedem Bild ein
 * Protokoll, dessen Einträge an festen Plätzen eingeblendet werden, wenn sie
 * passieren; darüber „Fertig um" und „Abreisen bezugsfertig".
 * Auf der Landing Page im Abschnitt „Derselbe Tag, dreimal" (#vergleich).
 */

const PANELS: { strategy: Strategy; title: string; lead: string }[] = [
  { strategy: 'linear', title: 'Ohne Steuerung', lead: 'Papierliste: Welche Zimmer abreisen, ist bekannt – wann, nicht.' },
  { strategy: 'score', title: 'Mit RoSe', lead: 'Tägliche Routine-Reinigung. Check-out live auf dem Board.' },
  { strategy: 'onDemand', title: 'Mit RoSe + Reinigung auf Wunsch', lead: 'Bleibegäste bekommen Reinigung, wenn sie sie wünschen.' },
]

/**
 * Platz im Raster ab `md`. In der DOM-Reihenfolge stehen die Protokolle
 * direkt unter ihrem Bild — so stimmt die Reihenfolge auch einspaltig am Handy.
 */
const PLACE = {
  linear: 'md:col-start-1 md:row-start-1',
  score: 'md:col-start-2 md:row-start-1',
  onDemand: 'md:col-start-3 md:row-start-1',
  logLinear: 'md:col-start-1 md:row-start-2 md:row-span-2',
  logRose: 'md:col-start-2 md:col-span-2 md:row-start-2',
  logOnDemand: 'md:col-start-3 md:row-start-3',
} as const

/** Simulationsminuten je Sekunde. */
const SPEED = 15
/** So lange bleibt der Endstand stehen, bevor die Schleife neu beginnt (ms). */
const HOLD_MS = 8000
/** So lange (Simulationsminuten) gilt ein Hinweis als neu und leuchtet. */
const FRESH = 25

const TILE: Record<TileState, string> = {
  empty: 'border-edge bg-surface-sunken text-ink-muted',
  occupied: 'border-fresh-tint-edge bg-fresh-tint text-ink',
  dnd: 'border-blocked-tint-edge bg-blocked-tint text-ink',
  skipped: 'border-edge bg-surface-muted text-ink-muted',
  declined: 'border-blocked-tint-edge bg-blocked-tint text-ink',
  departed: 'border-caution-tint-edge bg-caution-tint text-ink',
  wants: 'border-attention-tint-edge bg-attention-tint text-ink',
  cleaning: 'border-positive-tint-edge bg-positive-tint text-ink',
  done: 'border-positive bg-positive text-positive-foreground',
}

/** Farbbalken unten an der Kachel, wie auf den Boards. */
const BAR: Partial<Record<TileState, string>> = {
  occupied: 'bg-fresh',
  dnd: 'bg-blocked',
  declined: 'bg-blocked',
  departed: 'bg-caution',
  wants: 'bg-attention',
  cleaning: 'bg-positive',
}

const LEGEND: { state: TileState; label: string }[] = [
  { state: 'occupied', label: 'Gast im Zimmer' },
  { state: 'departed', label: 'ausgecheckt' },
  { state: 'wants', label: 'Gast weg, Reinigung offen' },
  { state: 'dnd', label: 'Bitte nicht stören / abgelehnt' },
  { state: 'skipped', label: 'keine Reinigung gewünscht' },
  { state: 'empty', label: 'leer' },
  { state: 'cleaning', label: 'wird gereinigt' },
  { state: 'done', label: 'fertig' },
]

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.dataset.motion === 'reduced'
}
const noSubscribe = () => () => {}

export default function CleaningSimulation() {
  const results = useMemo(() => PANELS.map(p => simulate(p.strategy)), [])
  const notes = useMemo(() => ({
    linear: highlights(results[0]),
    rose: roseHighlights(results[1], results[2]),
    onDemand: highlights(results[2]),
  }), [results])
  const end = useMemo(() => Math.max(...results.map(r => r.metrics.finishedAt)) + 5, [results])
  const [time, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [touched, setTouched] = useState(false)
  /** Endlosschleife — an, bis jemand Pause, Regler oder „Zurück" bedient. */
  const [loop, setLoop] = useState(true)
  // Bei reduzierter Bewegung kein Autoplay, sondern der Endstand — bis jemand bedient.
  const reduced = useSyncExternalStore(noSubscribe, reducedMotion, () => false)
  const t = reduced && !touched ? end : time
  const container = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)
  const inView = useRef(false)

  // Autoplay beim ersten Sichtbarwerden (40 %); danach läuft die Uhr nur,
  // solange die Simulation im Bild ist.
  useEffect(() => {
    const el = container.current
    if (!el || reduced) return
    const io = new IntersectionObserver(entries => {
      const e = entries[entries.length - 1]
      inView.current = e.isIntersecting
      if (e.intersectionRatio >= 0.4) {
        setStarted(prev => {
          if (!prev) setPlaying(true)
          return true
        })
      }
    }, { threshold: [0, 0.4] })
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  // Schleife: Endstand stehen lassen, dann von vorn.
  useEffect(() => {
    if (playing || !loop || reduced || !started || time < end) return
    const id = setTimeout(() => { setT(0); setPlaying(true) }, HOLD_MS)
    return () => clearTimeout(id)
  }, [playing, loop, reduced, started, time, end])

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      if (!inView.current) {
        frame = requestAnimationFrame(tick)
        return
      }
      setT(prev => {
        const next = Math.min(end, prev + dt * SPEED)
        if (next >= end) setPlaying(false)
        return next
      })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, end])

  // Läuft oder wartet am Ende auf den nächsten Durchlauf.
  const running = playing || (loop && started && t >= end && !reduced)
  const togglePlay = () => {
    setTouched(true)
    if (running) {
      setPlaying(false)
      setLoop(false)
      return
    }
    if (t >= end) setT(0)
    setStarted(true)
    setLoop(true)
    setPlaying(true)
  }
  const stop = () => { setTouched(true); setPlaying(false); setLoop(false) }

  return (
    <div ref={container} className="rounded-2xl border border-edge bg-surface-elevated p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-20 text-3xl font-black tabular-nums text-ink">{clockLabel(t)}</div>
        <button type="button" onClick={togglePlay}
          className="flex items-center gap-1.5 rounded-lg bg-action px-3 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong">
          {running ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          {running ? 'Pause' : t >= end ? 'Noch einmal' : 'Abspielen'}
        </button>
        <button type="button" onClick={() => { stop(); setT(0) }}
          className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-2 text-sm font-medium text-ink-soft hover:bg-surface-sunken">
          <RotateCcw className="h-4 w-4" aria-hidden /> Zurück auf 9:00
        </button>
        <input type="range" min={0} max={end} step={1} value={Math.round(t)} aria-label="Uhrzeit"
          onChange={ev => { stop(); setT(Number(ev.target.value)) }}
          className="min-w-40 flex-1 accent-[var(--color-action)]" />
      </div>

      <div className="mt-6 grid gap-x-6 gap-y-4 md:grid-cols-3 md:grid-rows-[auto_auto_1fr]">
        <Panel className={PLACE.linear} {...PANELS[0]} res={results[0]} t={t} />
        <Log className={PLACE.logLinear} label="Ohne Steuerung" notes={notes.linear} t={t} />
        <Panel className={PLACE.score} {...PANELS[1]} res={results[1]} t={t} />
        <Panel className={PLACE.onDemand} {...PANELS[2]} res={results[2]} t={t} />
        <Log className={PLACE.logRose} label="Mit RoSe – in beiden Fällen" notes={notes.rose} t={t} />
        <Log className={PLACE.logOnDemand} label="Zusätzlich bei Reinigung auf Wunsch" notes={notes.onDemand} t={t} />
      </div>

      <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-soft">
        {LEGEND.map(l => (
          <li key={l.state} className="flex items-center gap-1.5">
            <span className={`relative inline-block h-3 w-3 overflow-hidden rounded border ${TILE[l.state]}`} aria-hidden>
              {BAR[l.state] && <span className={`absolute inset-x-0 bottom-0 h-1 ${BAR[l.state]}`} />}
            </span>
            {l.label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border-2 border-accent" aria-hidden /> Sonderfall (priorisiert)
        </li>
        <li className="flex items-center gap-1.5">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-edge bg-surface-elevated text-[8px] font-black text-ink" aria-hidden>A</span>
          Reinigungskraft A / B
        </li>
      </ul>

      <p className="mt-4 text-xs text-ink-muted">
        Derselbe Tag in allen drei Bildern: {SCENARIO.rooms.length} Zimmer auf {SCENARIO.floors} Etagen,
        zwei Reinigungskräfte ab 8:00, Check-out bis 11:00. Bleibezimmer ohne Software ab 8:00 laut Abreiseliste; mit RoSe
        Routine ab 9:00, der Verbleib über das beim Check-in eingetragene Abreisedatum. Abreise 30 min, Bleibe 18 min,
        Etagenwechsel mit Wagen 5 min.
      </p>
    </div>
  )
}

function Panel({ className, title, lead, res, t }: {
  className: string; title: string; lead: string; res: SimResult; t: number
}) {
  const tiles = tilesAt(res, t)
  const maids = maidsAt(res, t)
  const floors = [...new Set(tiles.map(x => x.floor))].sort((a, b) => b - a)
  const done = t >= res.metrics.finishedAt
  const deps = res.metrics.departuresReadyAt
  const depsDone = deps !== null && deps <= t
  const rose = res.strategy !== 'linear'

  return (
    <div className={`flex flex-col ${className}`}>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1 min-h-10 text-sm text-ink-soft">{lead}</p>
      <div className="mt-3 space-y-1.5 rounded-xl border border-edge bg-surface p-2">
        {floors.map(f => (
          <div key={f} className="flex items-center gap-1.5">
            <span className="w-8 shrink-0 text-[11px] font-semibold text-ink-muted">{f}. OG</span>
            {tiles.filter(x => x.floor === f).map(x => (
              <RoomTile key={x.nr} tile={x} maidsHere={maids.flatMap((nr, i) => (nr === x.nr ? [i] : []))} />
            ))}
          </div>
        ))}
      </div>

      <div className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 ${
        depsDone ? (rose ? 'border-positive bg-positive-tint' : 'border-edge bg-surface-sunken') : 'border-edge'
      }`}>
        {depsDone
          ? (rose ? <Check className="h-5 w-5 text-positive-strong" aria-hidden /> : <Clock className="h-5 w-5 text-ink-muted" aria-hidden />)
          : <Loader2 className="h-5 w-5 animate-spin text-ink-muted" aria-hidden />}
        <div className="flex-1 text-sm text-ink-soft">
          <div>Abreisen bezugsfertig</div>
          <div className="text-xs">
            Alles fertig{' '}
            <span className="font-semibold tabular-nums text-ink">
              {done ? clockLabel(res.metrics.finishedAt) : '…'}
            </span>
          </div>
        </div>
        {depsDone && <span className="text-2xl font-black tabular-nums text-ink">{clockLabel(deps!)}</span>}
      </div>
    </div>
  )
}

/**
 * Protokoll: jeder Eintrag hat von Anfang an seinen festen Platz und wird
 * nur eingeblendet — nichts rutscht nach, nichts springt.
 */
function Log({ className, label, notes, t }: { className: string; label?: string; notes: Highlight[]; t: number }) {
  return (
    <div className={className}>
      {label && <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>}
      <ol className="space-y-1" aria-live="polite">
        {notes.map(n => {
          const visible = n.at <= t
          const fresh = visible && t - n.at < FRESH
          return (
            <li key={`${n.at}-${n.text}`} aria-hidden={!visible}
              className={`flex gap-2 rounded-md border px-2 py-1.5 text-[13px] leading-snug transition-[opacity,background-color,border-color] duration-700 ${
                visible ? 'opacity-100' : 'opacity-0'
              } ${
                fresh
                  ? n.tone === 'good' ? 'border-positive bg-positive-tint'
                    : n.tone === 'bad' ? 'border-caution bg-caution-tint'
                      : 'border-edge-strong bg-surface-sunken'
                  : 'border-transparent'
              }`}>
              <span className="w-9 shrink-0 pt-px text-xs font-semibold tabular-nums text-ink-muted">{clockLabel(n.at)}</span>
              {n.tone === 'good' && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-positive-strong" aria-hidden />}
              {n.tone === 'bad' && <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-caution-strong" aria-hidden />}
              {n.tone === 'neutral' && <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden />}
              <span className="text-ink">{n.text}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function RoomTile({ tile, maidsHere }: { tile: Tile; maidsHere: number[] }) {
  const ring = tile.knock ? 'ring-2 ring-critical' : tile.priority ? 'ring-2 ring-accent' : ''
  return (
    <div className={`relative flex h-10 min-w-0 flex-1 items-center justify-center gap-0.5 rounded-md border text-[11px] font-bold tabular-nums ${TILE[tile.state]} ${ring}`}>
      {BAR[tile.state] && <span className={`absolute inset-x-0 bottom-0 h-1.5 rounded-b-[5px] ${BAR[tile.state]}`} aria-hidden />}
      {tile.nr}
      {tile.state === 'dnd' && <Ban className="h-3 w-3" aria-hidden />}
      {tile.state === 'declined' && <Ban className="h-3 w-3" aria-hidden />}
      {tile.state === 'skipped' && <Leaf className="h-3 w-3" aria-hidden />}
      {tile.state === 'cleaning' && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
      {tile.state === 'done' && !tile.priority && <Check className="h-3 w-3" aria-hidden />}
      {tile.priority && tile.state !== 'cleaning' && <Flag className="h-3 w-3 text-accent" aria-hidden />}
      {maidsHere.length > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-edge bg-surface-elevated shadow">
          {tile.knock === 'present' && <DoorClosed className="h-3 w-3 text-critical-strong" aria-hidden />}
          {tile.knock === 'declined' && <Hand className="h-3 w-3 text-critical-strong" aria-hidden />}
          {!tile.knock && <span className="text-[9px] font-black text-ink">{maidsHere.map(i => MAID_LABELS[i]).join('')}</span>}
        </span>
      )}
    </div>
  )
}
