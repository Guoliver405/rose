'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { AlertTriangle, Ban, Check, Clock, DoorClosed, Flag, Hand, Leaf, Loader2, Pause, Play, RotateCcw } from 'lucide-react'
import {
  ALL_RUNS, MAID_LABELS, MAIDS, SCENARIO, clockLabel, highlights, maidsAt, simulate, tilesAt,
  type Coordination, type Highlight, type Policy, type SimResult, type Tile, type TileState,
} from '@/lib/cleaning-sim'

/**
 * Reinigungs-Vergleich (25./26.09.2026): derselbe Tag zweimal nebeneinander —
 * ohne Steuerung und mit RoSe, 100 Zimmer, fünf Kräfte. Darüber ein
 * Umschalter für die Reinigung der Bleibezimmer (täglich oder auf Wunsch), der
 * für BEIDE Bilder gilt: Das Bild zeigt die Koordination, nicht die Politik.
 * Die Rechnung liegt vollständig in `cleaning-sim.ts`; hier wird nur der
 * Zustand zum Zeitpunkt t gezeichnet, deshalb laufen beide Bilder an einer
 * Uhr. Unter jedem Bild steht ein Protokoll, dessen Einträge an festen Plätzen
 * eingeblendet werden, wenn sie passieren.
 * Auf der Landing Page im Abschnitt #vergleich.
 */

const LEAD: Record<Coordination, Record<Policy, string>> = {
  paper: {
    routine: 'Papierliste: Welche Zimmer abreisen, ist bekannt – wann, nicht.',
    onDemand: 'Papierliste und Türanhänger „Bitte reinigen“ – zu sehen erst, wer im Flur steht.',
  },
  rose: {
    routine: 'Tägliche Routine ab 9:00. Check-out live auf dem Board.',
    onDemand: 'Gäste tippen „Zimmer reinigen“ – sofort auf dem Board.',
  },
}
const TITLE: Record<Coordination, string> = { paper: 'Ohne Steuerung', rose: 'Mit RoSe' }

/** Simulationsminuten je Sekunde. */
const SPEED = 18
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
  const runs = useMemo(() => ALL_RUNS.map(([c, p]) => {
    const res = simulate(c, p)
    return { key: `${c}-${p}`, res, notes: highlights(res) }
  }), [])
  const [policy, setPolicy] = useState<Policy>('routine')
  const shown = (c: Coordination) => runs.find(r => r.key === `${c}-${policy}`)!
  // Eine Uhr für alle Abläufe — der Umschalter verschiebt nichts.
  const end = useMemo(() => Math.max(...runs.map(r => r.res.metrics.finishedAt)) + 5, [runs])
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-sm font-semibold text-ink-soft">Bleibezimmer reinigen:</span>
        <div role="group" aria-label="Reinigung der Bleibezimmer" className="inline-flex rounded-lg border border-edge bg-surface p-0.5">
          {([['routine', 'täglich'], ['onDemand', 'nur auf Wunsch']] as const).map(([p, label]) => (
            <button key={p} type="button" aria-pressed={policy === p} onClick={() => setPolicy(p)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-bold ${
                policy === p ? 'bg-action text-action-foreground' : 'text-ink-soft hover:bg-surface-sunken'
              }`}>
              {p === 'onDemand' && <Leaf className="h-4 w-4" aria-hidden />}
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-ink-muted">gilt für beide Bilder – verglichen wird nur die Koordination</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="min-w-20 text-3xl font-black tabular-nums text-ink">{clockLabel(t)}</div>
        <button type="button" onClick={togglePlay}
          className="flex items-center gap-1.5 rounded-lg bg-action px-3 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong">
          {running ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          {running ? 'Pause' : t >= end ? 'Noch einmal' : 'Abspielen'}
        </button>
        <button type="button" onClick={() => { stop(); setT(0) }}
          className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-2 text-sm font-medium text-ink-soft hover:bg-surface-sunken">
          <RotateCcw className="h-4 w-4" aria-hidden /> Zurück auf {clockLabel(0)}
        </button>
        <input type="range" min={0} max={end} step={1} value={Math.round(t)} aria-label="Uhrzeit"
          onChange={ev => { stop(); setT(Number(ev.target.value)) }}
          className="min-w-40 flex-1 accent-[var(--color-action)]" />
      </div>

      <div className="mt-6 grid gap-x-6 gap-y-6 md:grid-cols-2">
        {(['paper', 'rose'] as const).map(c => {
          const run = shown(c)
          return (
            <div key={c} className="flex min-w-0 flex-col gap-4">
              <Panel title={TITLE[c]} lead={LEAD[c][policy]} res={run.res} t={t} />
              {/* key: beim Umschalten neue Einträge, keine überblendeten alten */}
              <Log key={run.key} notes={run.notes} t={t} />
            </div>
          )
        })}
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
          Reinigungskraft A–{MAID_LABELS[MAIDS - 1]}
        </li>
      </ul>

      <p className="mt-4 text-xs text-ink-muted">
        Ein gewöhnlicher Tag: der mittlere aus 101 durchgerechneten, gemessen am Vorsprung bei den Abreisen in beiden
        Stellungen des Umschalters. {SCENARIO.rooms.length} Zimmer auf {SCENARIO.floors} Etagen, {MAIDS} Reinigungskräfte
        ab 8:00 (ohne Software je zwei feste Etagen), Check-out bis 11:00, Check-in ab 15:00. Täglich: ohne Software
        Bleibezimmer ab 8:00 laut Liste, mit RoSe Routine ab 9:00 über das beim Check-in eingetragene Abreisedatum. Auf
        Wunsch: ohne Software Türanhänger, den eine Kraft erst auf der Etage sieht; mit RoSe der Knopf im Gastportal.
        Etagenwechsel mit Wagen 5 min. Reinigungsdauer als Annahme, eher knapp: Abreise 30 min, Bleibe 18 min — gemessen
        wurden 35–43 bzw. 20–25 min (Quellen Q4 und Q7 im Nutzenrechner).
      </p>
    </div>
  )
}

function Panel({ title, lead, res, t }: { title: string; lead: string; res: SimResult; t: number }) {
  const tiles = tilesAt(res, t)
  const maids = maidsAt(res, t)
  const floors = [...new Set(tiles.map(x => x.floor))].sort((a, b) => b - a)
  const done = t >= res.metrics.finishedAt
  const deps = res.metrics.departuresReadyAt
  const depsDone = deps !== null && deps <= t
  const rose = res.coord === 'rose'

  return (
    <div className="flex flex-col">
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1 min-h-10 text-sm text-ink-soft">{lead}</p>
      <div className="mt-3 space-y-1 rounded-xl border border-edge bg-surface p-1.5 sm:p-2">
        {floors.map(f => (
          <div key={f} className="flex items-center gap-0.5 sm:gap-1">
            {/* Schmal nur die Etage und in der Kachel die Zimmernummer auf der Etage — „1001" passt dort nicht. */}
            <span className="w-4 shrink-0 text-[10px] font-semibold text-ink-muted lg:w-8">
              {f}<span className="hidden lg:inline">. OG</span>
            </span>
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
function Log({ notes, t }: { notes: Highlight[]; t: number }) {
  return (
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
  )
}

function RoomTile({ tile, maidsHere }: { tile: Tile; maidsHere: number[] }) {
  const ring = tile.knock ? 'ring-2 ring-critical' : tile.priority ? 'ring-2 ring-accent' : ''
  // Bei 10 Kacheln je Zeile ist für Symbole erst ab `lg` Platz; die Farbe trägt den Zustand.
  const icon = 'hidden h-2.5 w-2.5 shrink-0 lg:inline'
  return (
    <div className={`relative flex h-7 min-w-0 flex-1 items-center justify-center gap-px rounded border text-[9px] font-bold tabular-nums sm:text-[10px] ${TILE[tile.state]} ${ring}`}>
      {BAR[tile.state] && <span className={`absolute inset-x-0 bottom-0 h-1 rounded-b-[3px] ${BAR[tile.state]}`} aria-hidden />}
      <span className="lg:hidden">{tile.nr.slice(-2)}</span>
      <span className="hidden lg:inline">{tile.nr}</span>
      {(tile.state === 'dnd' || tile.state === 'declined') && <Ban className={icon} aria-hidden />}
      {tile.state === 'skipped' && <Leaf className={icon} aria-hidden />}
      {tile.state === 'cleaning' && <Loader2 className={`${icon} animate-spin`} aria-hidden />}
      {tile.priority && tile.state !== 'cleaning' && <Flag className={`${icon} text-accent`} aria-hidden />}
      {maidsHere.length > 0 && (
        <span className="absolute -right-1 -top-1.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full border border-edge bg-surface-elevated px-0.5 shadow">
          {tile.knock === 'present' && <DoorClosed className="h-2.5 w-2.5 text-critical-strong" aria-hidden />}
          {tile.knock === 'declined' && <Hand className="h-2.5 w-2.5 text-critical-strong" aria-hidden />}
          {!tile.knock && <span className="text-[8px] font-black text-ink">{maidsHere.map(i => MAID_LABELS[i]).join('')}</span>}
        </span>
      )}
    </div>
  )
}
