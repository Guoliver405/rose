'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { AlertTriangle, Ban, Check, ChevronLeft, ChevronRight, Clock, Coffee, DoorClosed, Flag, Footprints, Hand, Leaf, Loader2, Pause, Play, RotateCcw, Timer } from 'lucide-react'
import {
  ALL_RUNS, GUEST, SCENARIO, clockLabel, highlights, maidActivityAt, maidLabel, maidsAt, minutesUntil, simulate, tilesAt, turnedAwayAt,
  type Baseline, type MaidActivity, type Coordination, type Highlight, type Policy, type Scenario, type SimResult, type Tile, type TileState,
} from '@/lib/cleaning-sim'
import { eventLog } from '@/lib/sim-log'
import EventLog from '@/components/simulator/EventLog'
import type { LandingMessages, SimulatorMessages } from '@/lib/i18n'
import { format } from '@/lib/i18n/format'
import Rich from '@/components/i18n/Rich'

/**
 * Reinigungs-Vergleich (25./26.09.2026): derselbe Tag zweimal nebeneinander —
 * ohne Steuerung und mit RoSe, 100 Zimmer, fünf Kräfte. Darüber ein
 * Umschalter für die Reinigung der Bleibezimmer (täglich oder auf Wunsch), der
 * für BEIDE Bilder gilt: Das Bild zeigt die Koordination, nicht die Politik.
 * Die Rechnung liegt vollständig in `cleaning-sim.ts`; hier wird nur der
 * Zustand zum Zeitpunkt t gezeichnet, deshalb laufen beide Bilder an einer
 * Uhr. Unter jedem Bild steht ein Protokoll, dessen Einträge an festen Plätzen
 * eingeblendet werden, wenn sie passieren.
 * Auf der Landing Page im Abschnitt #vergleich; im Simulator mit dem eigenen
 * Szenario (`scenario`) und eigenem Kleingedruckten (`caption`).
 */

/** Oberfläche des Tagesbilds — `landing.day` der Sprachdatei (Beschreibung je Bild in `lead`, Titel in `titles`). */
type DayM = LandingMessages['day']

/** Sachliche Beschreibung für den Simulator — die Arbeitsweise ohne Software ist dort einstellbar. */
function leadDetail(c: Coordination, b: Baseline, tx: SimulatorMessages['app']['day']['lead']): string {
  if (c === 'rose') return tx.rose
  const departures = b.departures === 'radio' ? tx.departuresRadio : tx.departuresList
  const floorRule = b.floors === 'free' ? tx.floorsFree : tx.floorsFixed
  return format(tx.paper, { departures, floorRule })
}

/** Simulationsminuten je Sekunde. */
const SPEED = 18
/** So lange bleibt der Endstand stehen, bevor die Schleife neu beginnt (ms). */
const HOLD_MS = 8000
/** So lange (Simulationsminuten) gilt ein Hinweis als neu und leuchtet. */
const FRESH = 25
/** Die Uhr beginnt um 7:59 — die Ausgangslage beider Bilder, bevor sich die Kräfte verteilen (User, 26.09.2026). */
const START = -1

const TILE: Record<TileState, string> = {
  empty: 'border-edge bg-surface-sunken text-ink-muted',
  occupied: 'border-fresh-tint-edge bg-fresh-tint text-ink',
  dnd: 'border-blocked-tint-edge bg-blocked-tint text-ink',
  // Derselbe Gast wie links mit „Nicht stören“ bis zur Uhrzeit — gleiche Farbe, nur weiß RoSe die Uhrzeit (User, 26.09.2026).
  deferred: 'border-blocked-tint-edge bg-blocked-tint text-ink',
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
  deferred: 'bg-blocked',
  declined: 'bg-blocked',
  departed: 'bg-caution',
  wants: 'bg-attention',
  cleaning: 'bg-positive',
}

/**
 * „Später“ an der Tür: neutral grau wie der Tür-Aufschub auf dem echten Board —
 * überlagert „Gast im Zimmer“ bzw. „Gast weg“, solange es gilt.
 */
const LATER_TILE = 'border-edge-strong bg-surface-muted text-ink'

/** Reihenfolge der Legende; Beschriftung aus `legend.states`. */
const LEGEND: TileState[] = ['occupied', 'departed', 'wants', 'dnd', 'declined', 'deferred', 'skipped', 'empty', 'cleaning', 'done']

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.dataset.motion === 'reduced'
}
const noSubscribe = () => () => {}

export default function CleaningSimulation({ scenario = SCENARIO, caption, policy: controlled, detailLog = false, texts, m, intlLocale }: {
  /** Texte aus der Rechnung (Hinweise, Protokoll, Beschreibung) — `simulator.app.day` der Sprachdatei. */
  texts: SimulatorMessages['app']['day']
  /** Oberfläche, Legende und Spaltentitel — `landing.day` der Sprachdatei. */
  m: DayM
  intlLocale: string
  scenario?: Scenario
  /** Kleingedrucktes unter dem Vergleich; Vorgabe ist das der Landing Page. */
  caption?: ReactNode
  /** Von außen gesteuert (Simulator: ein Umschalter für Grafik und Zahlen) — dann ohne eigenen. */
  policy?: Policy
  /** Simulator: vollständiges Ereignis-Protokoll statt der ausgewählten Hinweise der Landing Page. */
  detailLog?: boolean
}) {
  const scn = scenario
  const clock = (min: number) => clockLabel(min, scn.params.shiftStart)
  const maids = scn.maidFloors.length
  const runs = useMemo(() => ALL_RUNS.map(([c, p]) => {
    const res = simulate(c, p, scn)
    return { key: `${c}-${p}`, res, notes: detailLog ? [] : highlights(res, texts.highlights, intlLocale, scn), log: detailLog ? eventLog(res, scn, texts.log, intlLocale) : [] }
  }), [scn, detailLog, texts, intlLocale])
  const [ownPolicy, setPolicy] = useState<Policy>('routine')
  const policy = controlled ?? ownPolicy
  const shown = (c: Coordination) => runs.find(r => r.key === `${c}-${policy}`)!
  // Eine Uhr für alle Abläufe — der Umschalter verschiebt nichts.
  const end = useMemo(() => Math.max(...runs.map(r => r.res.metrics.finishedAt)) + 5, [runs])
  const [time, setT] = useState(START)
  // Neues Szenario: Uhr zurück auf Schichtbeginn (State neben den Props, ohne Effekt).
  const [shownScn, setShownScn] = useState(scn)
  if (shownScn !== scn) {
    setShownScn(scn)
    setT(START)
  }
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
    const id = setTimeout(() => { setT(START); setPlaying(true) }, HOLD_MS)
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
    if (t >= end) setT(START)
    setStarted(true)
    setLoop(true)
    setPlaying(true)
  }
  const stop = () => { setTouched(true); setPlaying(false); setLoop(false) }
  const step = (d: number) => { stop(); setT(Math.min(end, Math.max(START, Math.round(t) + d))) }

  return (
    <div ref={container} className="rounded-2xl border border-edge bg-surface-elevated p-4 sm:p-6">
      {!controlled && <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-sm font-semibold text-ink-soft">{m.policy.label}</span>
        <div role="group" aria-label={m.policy.aria} className="inline-flex rounded-lg border border-edge bg-surface p-0.5">
          {([['routine', m.policy.routine], ['onDemand', m.policy.onDemand]] as const).map(([p, label]) => (
            <button key={p} type="button" aria-pressed={policy === p} onClick={() => setPolicy(p)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-bold ${
                policy === p ? 'bg-action text-action-foreground' : 'text-ink-soft hover:bg-surface-sunken'
              }`}>
              {p === 'onDemand' && <Leaf className="h-4 w-4" aria-hidden />}
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-ink-muted">{m.policy.note}</span>
      </div>}

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-20 text-3xl font-black tabular-nums text-ink">{clock(t)}</div>
        <button type="button" onClick={togglePlay}
          className="flex items-center gap-1.5 rounded-lg bg-action px-3 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong">
          {running ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          {running ? m.controls.pause : t >= end ? m.controls.again : m.controls.play}
        </button>
        <button type="button" onClick={() => { stop(); setT(START) }}
          className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-2 text-sm font-medium text-ink-soft hover:bg-surface-sunken">
          <RotateCcw className="h-4 w-4" aria-hidden /> {format(m.controls.reset, { time: clock(START) })}
        </button>
        {/* Minutenweise durchklicken (Wunsch des Users, 26.09.2026) — hält die Wiedergabe an. */}
        <div className="flex min-w-60 flex-1 items-center gap-1.5">
          <button type="button" onClick={() => step(-1)} disabled={t <= START} aria-label={m.controls.minuteBack}
            className="flex shrink-0 items-center rounded-lg border border-edge px-1.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-surface-sunken disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" aria-hidden /><span className="pr-0.5">{m.controls.minute}</span>
          </button>
          <input type="range" min={START} max={end} step={1} value={Math.round(t)} aria-label={m.controls.clock}
            onChange={ev => { stop(); setT(Number(ev.target.value)) }}
            className="min-w-24 flex-1 accent-[var(--color-action)]" />
          <button type="button" onClick={() => step(1)} disabled={t >= end} aria-label={m.controls.minuteForward}
            className="flex shrink-0 items-center rounded-lg border border-edge px-1.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-surface-sunken disabled:opacity-40">
            <span className="pl-0.5">{m.controls.minute}</span><ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-x-6 gap-y-6 md:grid-cols-2">
        {(['paper', 'rose'] as const).map(c => {
          const run = shown(c)
          return (
            <div key={c} className="flex min-w-0 flex-col gap-4">
              <Panel title={m.titles[c]} lead={detailLog ? leadDetail(c, scn.params.baseline, texts.lead) : m.lead[c][policy]} res={run.res} t={t} scn={scn} m={m} />
              {/* key: beim Umschalten neue Einträge, keine überblendeten alten */}
              {detailLog
                ? <EventLog key={run.key} entries={run.log} t={t} clock={clock} onSeek={at => { stop(); setT(at) }}
                    m={texts.eventLog} filterPrefix={texts.log.filterPrefix} intlLocale={intlLocale} />
                : <Log key={run.key} notes={run.notes} t={t} clock={clock} />}
            </div>
          )
        })}
      </div>

      <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-soft">
        {LEGEND.map(state => (
          <li key={state} className="flex items-center gap-1.5">
            <span className={`relative inline-block h-3 w-3 overflow-hidden rounded border ${TILE[state]}`} aria-hidden>
              {BAR[state] && <span className={`absolute inset-x-0 bottom-0 h-1 ${BAR[state]}`} />}
            </span>
            <LegendIcon state={state} />
            {m.legend.states[state]}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className={`inline-block h-3 w-3 rounded border ${LATER_TILE}`} aria-hidden />
          <DoorClosed className="-ml-1 h-3 w-3" aria-hidden />
          {m.legend.later}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border-2 border-critical" aria-hidden /> {m.legend.repeat}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border-2 border-accent" aria-hidden /> {m.legend.priority}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-edge bg-surface-elevated text-[8px] font-black text-ink" aria-hidden>A</span>
          {format(m.legend.maids, { range: maids === 1 ? 'A' : `A–${maidLabel(maids - 1)}` })}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="flex h-3.5 items-center gap-px rounded-full border border-edge bg-surface-sunken px-0.5 text-[8px] font-black text-ink-muted" aria-hidden>
            <Coffee className="h-2 w-2" />A
          </span>
          {m.legend.idle}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="flex h-3.5 items-center gap-px rounded-full border border-edge bg-surface-elevated px-0.5 text-[8px] font-black text-ink" aria-hidden>
            <Footprints className="h-2 w-2" />A
          </span>
          {m.legend.search}
        </li>
      </ul>

      {caption !== undefined ? <div className="mt-4 text-xs text-ink-muted">{caption}</div> : <p className="mt-4 text-xs text-ink-muted">
        <Rich text={m.caption} vars={{
          rooms: SCENARIO.rooms.length,
          floors: SCENARIO.floors,
          maids: SCENARIO.maidFloors.length,
          signals: Math.round(GUEST.signals * 100),
          notBefore: Math.round(GUEST.notBefore * 100),
          dnd: Math.round(GUEST.dndMorning * 100),
        }} tags={{
          link: c => <a href="/simulator" className="font-semibold text-action-strong hover:underline">{c}</a>,
        }} />
      </p>}
    </div>
  )
}

function Panel({ title, lead, res, t, scn, m }: { title: string; lead: string; res: SimResult; t: number; scn: Scenario; m: DayM }) {
  const clock = (min: number) => clockLabel(min, scn.params.shiftStart)
  const tiles = tilesAt(res, t, scn)
  const maids = maidsAt(res, t)
  const acts = maidActivityAt(res, t)
  /** Große Häuser: Kacheln ohne Nummer, damit eine Etage in eine Zeile passt. */
  const compact = scn.roomsPerFloor > 12
  const floors = [...new Set(tiles.map(x => x.floor))].sort((a, b) => b - a)
  const done = t >= res.metrics.finishedAt
  const deps = res.metrics.departuresReadyAt
  const depsDone = deps !== null && deps <= t
  const rose = res.coord === 'rose'
  const away = turnedAwayAt(res, t)

  return (
    <div className="flex flex-col">
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1 min-h-10 text-sm text-ink-soft">{lead}</p>
      <div className="mt-3 space-y-1 rounded-xl border border-edge bg-surface p-1.5 sm:p-2">
        {floors.map(f => (
          <div key={f} className="flex items-center gap-0.5 sm:gap-1">
            {/* Schmal nur die Etage und in der Kachel die Zimmernummer auf der Etage — „1001" passt dort nicht. */}
            <span className="w-4 shrink-0 text-[10px] font-semibold text-ink-muted lg:w-8">
              {f}<span className="hidden lg:inline">{m.panel.floorSuffix}</span>
            </span>
            {tiles.filter(x => x.floor === f).map(x => (
              <RoomTile key={x.nr} tile={x} compact={compact} acts={acts} m={m} maidsHere={maids.flatMap((nr, i) => (nr === x.nr ? [i] : []))} />
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
          <div>{m.panel.departuresReady}</div>
          <div className="text-xs">
            <Rich text={m.panel.status} vars={{ time: done ? clock(res.metrics.finishedAt) : '…', count: away }}
              tags={{ b: c => <span className="font-semibold tabular-nums text-ink">{c}</span> }} />
          </div>
        </div>
        {depsDone && <span className="text-2xl font-black tabular-nums text-ink">{clock(deps!)}</span>}
      </div>
      <Activity acts={acts} res={res} t={t} m={m} />
    </div>
  )
}

/**
 * Protokoll: jeder Eintrag hat von Anfang an seinen festen Platz und wird
 * nur eingeblendet — nichts rutscht nach, nichts springt.
 */
function Log({ notes, t, clock }: { notes: Highlight[]; t: number; clock: (min: number) => string }) {
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
            <span className="w-9 shrink-0 pt-px text-xs font-semibold tabular-nums text-ink-muted">{clock(n.at)}</span>
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

const ACTIVITY_ORDER: Exclude<MaidActivity, 'off'>[] = ['clean', 'door', 'walk', 'search', 'radio', 'idle', 'done']

/**
 * Was die Kräfte gerade tun, dazu die bis jetzt aufgelaufenen Minuten an der
 * Tür und im Warten — erklärt das morgendliche Treiben, bei dem kaum gereinigt
 * wird, weil die Gäste noch da sind (User, 27.09.2026).
 */
function Activity({ acts, res, t, m }: { acts: MaidActivity[]; res: SimResult; t: number; m: DayM }) {
  const counts = ACTIVITY_ORDER.map(a => [a, acts.filter(x => x === a).length] as const).filter(([, n]) => n > 0)
  const door = Math.round(minutesUntil(res, t, 'knock', 'declined', 'skip'))
  const idle = Math.round(minutesUntil(res, t, 'idle'))
  const search = Math.round(minutesUntil(res, t, 'patrol'))
  const b = (c: string) => <span className="font-semibold tabular-nums text-ink">{c}</span>
  return (
    <div className="mt-2 px-1 text-xs text-ink-soft">
      <div>
        <span className="font-semibold text-ink">{m.activity.now}</span>
        {counts.length === 0 ? m.activity.nobody
          : counts.map(([a, n], i) => <span key={a}>{i > 0 && ' · '}<Rich text={m.activity.item} vars={{ count: n, label: m.activity.labels[a] }} tags={{ b }} /></span>)}
      </div>
      <div className="mt-0.5">
        <Rich text={search > 0 ? m.activity.totalsSearch : m.activity.totals} vars={{ door, idle, search }} tags={{ b }} />
      </div>
    </div>
  )
}

/** Symbol je Zustand in der Kachel — „abgelehnt“ bewusst anders als „Nicht stören“. */
const STATE_ICON: Partial<Record<TileState, typeof Ban>> = {
  dnd: Ban,
  declined: Hand,
  deferred: Timer,
  skipped: Leaf,
}

function LegendIcon({ state }: { state: TileState }) {
  const I = STATE_ICON[state]
  return I ? <I className="-ml-1 h-3 w-3" aria-hidden /> : null
}

function RoomTile({ tile, maidsHere, acts, compact, m }: { tile: Tile; maidsHere: number[]; acts: MaidActivity[]; compact: boolean; m: DayM }) {
  const ring = tile.repeat ? 'ring-2 ring-critical blink-ring-overdue'
    : tile.knock ? 'ring-2 ring-critical' : tile.priority ? 'ring-2 ring-accent' : ''
  const look = tile.later ? LATER_TILE : TILE[tile.state]
  const bar = tile.later ? 'bg-edge-strong' : BAR[tile.state]
  const StateIcon = STATE_ICON[tile.state]
  const idle = maidsHere.length > 0 && maidsHere.every(i => acts[i] === 'idle')
  const search = maidsHere.some(i => acts[i] === 'search')
  // Bei 10 Kacheln je Zeile ist für Symbole erst ab `lg` Platz; die Farbe trägt den Zustand.
  const icon = 'hidden h-2.5 w-2.5 shrink-0 lg:inline'
  return (
    <div title={laterTitle(tile, compact, m)}
      className={`relative flex min-w-0 flex-1 items-center justify-center gap-px rounded border text-[9px] font-bold tabular-nums sm:text-[10px] ${compact ? 'h-4' : 'h-7'} ${look} ${ring}`}>
      {bar && <span className={`absolute inset-x-0 bottom-0 ${compact ? 'h-0.5' : 'h-1'} rounded-b-[3px] ${bar}`} aria-hidden />}
      {!compact && <>
      <span className="lg:hidden">{tile.nr.slice(-2)}</span>
      <span className="hidden lg:inline">{tile.nr}</span>
      {tile.later
        ? <><DoorClosed className={icon} aria-hidden />{tile.later.by !== null && <span className="hidden text-[7px] text-ink-muted lg:inline">{maidLabel(tile.later.by)}</span>}</>
        : StateIcon && <StateIcon className={icon} aria-hidden />}
      {tile.state === 'cleaning' && <Loader2 className={`${icon} animate-spin`} aria-hidden />}
      {tile.priority && tile.state !== 'cleaning' && <Flag className={`${icon} text-accent`} aria-hidden />}
      </>}
      {maidsHere.length > 0 && (
        <span className={`absolute -right-1 -top-1.5 z-10 flex h-4 min-w-4 items-center justify-center gap-px rounded-full border border-edge px-0.5 shadow ${idle ? 'bg-surface-sunken' : 'bg-surface-elevated'}`}>
          {tile.knock === 'present' && <DoorClosed className="h-2.5 w-2.5 text-critical-strong" aria-hidden />}
          {tile.knock === 'declined' && <Hand className="h-2.5 w-2.5 text-critical-strong" aria-hidden />}
          {tile.knock === 'dnd' && <Ban className="h-2.5 w-2.5 text-critical-strong" aria-hidden />}
          {!tile.knock && idle && <Coffee className="h-2 w-2 text-ink-muted" aria-hidden />}
          {!tile.knock && !idle && search && <Footprints className="h-2 w-2 text-ink-soft" aria-hidden />}
          {!tile.knock && <span className={`text-[8px] font-black ${idle ? 'text-ink-muted' : 'text-ink'}`}>{maidsHere.map(maidLabel).join('')}</span>}
        </span>
      )}
    </div>
  )
}

function laterTitle(tile: Tile, compact: boolean, m: DayM): string | undefined {
  const base = compact ? tile.nr : undefined
  if (!tile.later) return base
  const who = tile.later.by === null ? m.later.all : format(m.later.one, { name: maidLabel(tile.later.by) })
  return format(m.later.title, { nr: tile.nr, who })
}
