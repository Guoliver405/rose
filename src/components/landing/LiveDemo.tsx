'use client'

import { useEffect, useReducer, useRef, useState } from 'react'
import {
  Ban, Bell, Check, Flag, Loader2, Moon, Play, RotateCcw, Sparkles, Target,
} from 'lucide-react'
import SlideAction from '@/components/SlideAction'

/**
 * Interaktive Produktvorschau — „Ein Tipp, alle sehen es".
 *
 * Eine verbundene Szene (Hotel Alpenblick, Etage 2): Rezeptions-Übersicht,
 * Gast-Handy, Reinigungsboard hängen an EINEM Modell aus sechs Zimmern.
 * Wer im Gast-Ausschnitt „Zimmer reinigen" tippt, sieht die Kachel der
 * Rezeption und die Zeile auf dem Board gleichzeitig wechseln.
 *
 * Beim ersten Sichtbarwerden läuft eine Bildergeschichte in fünf Schritten
 * ab (dieselben wie der Ablauf-Strip darunter); „Selbst ausprobieren" hält
 * an und gibt alles frei. Bei reduzierter Bewegung kein Autoplay.
 *
 * Bewusst KEINE Wiederverwendung der echten Board-Komponenten — die hängen
 * an Daten, Actions und Realtime. Die Miniaturen sind eigene Bausteine mit
 * derselben Farbsprache (Blau belegt, Grün bereit, Amber Wunsch, Orange
 * ausgecheckt, Violett priorisiert, Rosé DND, Rot dringend); nur der Slider
 * ist der echte `SlideAction`. Rein clientseitig, nichts wird gespeichert.
 * Konzept: Sessions/Landing-Konzept-2026-09-05.md, Abschnitt 2.
 */

type Signal = 'none' | 'clean' | 'dnd'
type Order = { id: number; name: string; urgent: boolean }
type Room = {
  nr: string
  occupied: boolean
  ready: boolean
  signal: Signal
  checkoutPending: boolean
  priority: boolean
  cleaning: boolean
  orders: Order[]
}
type State = {
  rooms: Room[]
  /** Zähler je Zimmer — ein Wechsel remountet die Kachel und startet das Aufleuchten neu. */
  flash: Record<string, number>
  nextOrderId: number
  lastEvent: string
}

const GUEST_ROOM = '202'
const PIN = '4827'
const MAID = 'Maria'

const SERVICES: { name: string; meta: string; urgent: boolean }[] = [
  { name: 'Extra Handtücher', meta: 'kostenfrei', urgent: false },
  { name: 'Frühstück aufs Zimmer', meta: '14,50 €', urgent: false },
  { name: 'Technischer Dienst', meta: 'dringend', urgent: true },
]

function room(nr: string, patch: Partial<Room> = {}): Room {
  return {
    nr, occupied: true, ready: false, signal: 'none', checkoutPending: false,
    priority: false, cleaning: false, orders: [], ...patch,
  }
}

function initialState(): State {
  return {
    rooms: [
      room('201'),
      room('202', { occupied: false, ready: true }),
      room('203'),
      room('204'),
      room('205'),
      room('206', { signal: 'dnd' }),
    ],
    flash: {},
    nextOrderId: 1,
    lastEvent: 'Ausgangslage: Zimmer 202 ist frei und bereit.',
  }
}

type Action =
  | { type: 'checkin'; nr: string }
  | { type: 'checkout'; nr: string }
  | { type: 'signal'; nr: string; signal: Signal }
  | { type: 'order'; nr: string; name: string; urgent: boolean }
  | { type: 'orderDone'; nr: string; id: number }
  | { type: 'priority'; nr: string }
  | { type: 'startCleaning'; nr: string }
  | { type: 'finishCleaning'; nr: string }
  | { type: 'reset' }

function update(state: State, nr: string, patch: (r: Room) => Partial<Room>, event: string): State {
  return {
    ...state,
    rooms: state.rooms.map(r => (r.nr === nr ? { ...r, ...patch(r) } : r)),
    flash: { ...state.flash, [nr]: (state.flash[nr] ?? 0) + 1 },
    lastEvent: event,
  }
}

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case 'reset':
      return initialState()
    case 'checkin':
      return update(state, a.nr, () => ({ occupied: true, ready: false, checkoutPending: false }),
        `Check-in Zimmer ${a.nr}: Aufenthalt angelegt, PIN ${PIN}.`)
    case 'checkout':
      return update(state, a.nr, () => ({ occupied: false, checkoutPending: true, signal: 'none' }),
        `Check-out Zimmer ${a.nr}: Zugang erloschen, Reinigung nach Check-out offen.`)
    case 'signal': {
      const label = a.signal === 'clean' ? 'Reinigung gewünscht' : a.signal === 'dnd' ? 'Bitte nicht stören' : 'Wunsch zurückgenommen'
      return update(state, a.nr, () => ({ signal: a.signal }), `Gast in ${a.nr}: ${label}.`)
    }
    case 'order': {
      const next = update(state, a.nr, r => ({
        orders: [...r.orders, { id: state.nextOrderId, name: a.name, urgent: a.urgent }],
      }), `Gast in ${a.nr} bestellt „${a.name}"${a.urgent ? ' — dringend' : ''}.`)
      return { ...next, nextOrderId: state.nextOrderId + 1 }
    }
    case 'orderDone':
      return update(state, a.nr, r => ({ orders: r.orders.filter(o => o.id !== a.id) }),
        `Rezeption: Anfrage aus ${a.nr} erledigt.`)
    case 'priority':
      return update(state, a.nr, r => ({ priority: !r.priority }),
        `Rezeption: Zimmer ${a.nr} ${state.rooms.find(r => r.nr === a.nr)?.priority ? 'nicht mehr' : ''} priorisiert.`)
    case 'startCleaning':
      if (state.rooms.some(r => r.cleaning)) return state
      return update(state, a.nr, () => ({ cleaning: true }), `${MAID} beginnt die Reinigung von ${a.nr}.`)
    case 'finishCleaning':
      return update(state, a.nr, r => ({
        cleaning: false, ready: true, checkoutPending: false, priority: false,
        signal: r.signal === 'clean' ? 'none' : r.signal,
      }), `${MAID} hat ${a.nr} abgeschlossen — Zimmer bereit.`)
  }
}

/* ── Ableitungen, gespiegelt aus board.ts ───────────────────────── */

function isActive(r: Room): boolean {
  return r.checkoutPending || r.priority || r.signal === 'clean'
}

function tone(r: Room): { bar: string; label: string } {
  if (r.priority) return { bar: 'bg-accent', label: 'priorisiert' }
  if (r.checkoutPending) return { bar: 'bg-caution', label: 'ausgecheckt' }
  if (r.signal === 'clean') return { bar: 'bg-attention', label: 'Reinigung gewünscht' }
  if (r.signal === 'dnd') return { bar: 'bg-blocked', label: 'nicht stören' }
  if (r.occupied) return { bar: 'bg-fresh', label: 'belegt' }
  return { bar: 'bg-positive', label: 'bereit' }
}

/* ── Bildergeschichte ───────────────────────────────────────────── */

type Step = {
  who: string
  title: string
  text: string
  focus: 'reception' | 'guest' | 'board'
  action?: Action
  /** Zweite Aktion nach der halben Schrittdauer. */
  then?: Action
}

const STORY: Step[] = [
  {
    who: 'Rezeption', title: 'Check-in per Klick', focus: 'reception',
    text: 'Ein Klick auf Zimmer 202 — RoSe legt den anonymen Aufenthalt an und zeigt die PIN.',
    action: { type: 'checkin', nr: GUEST_ROOM },
  },
  {
    who: 'Gast', title: 'Zugang in der Hand', focus: 'guest',
    text: 'PIN auf dem Handout, QR-Aushang im Zimmer oder Link per Mail — kein Konto, keine App.',
  },
  {
    who: 'Gast', title: 'Ein Tipp im Zimmer', focus: 'guest',
    text: '„Zimmer reinigen" — mehr braucht es nicht.',
    action: { type: 'signal', nr: GUEST_ROOM, signal: 'clean' },
  },
  {
    who: 'Rezeption', title: 'Sofort sichtbar', focus: 'reception',
    text: 'Die Kachel wechselt auf Amber; eine Bestellung bringt die Glocke und den Zähler.',
    action: { type: 'order', nr: GUEST_ROOM, name: 'Extra Handtücher', urgent: false },
  },
  {
    who: 'Housekeeping', title: 'Vom Board abgearbeitet', focus: 'board',
    text: 'Maria startet per Wisch und schließt ab — die Rezeption sieht Grün.',
    action: { type: 'startCleaning', nr: GUEST_ROOM },
    then: { type: 'finishCleaning', nr: GUEST_ROOM },
  },
]

const STEP_MS = 3200

type Mode = 'idle' | 'playing' | 'free' | 'ended'

function reducedMotion(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.dataset.motion === 'reduced'
}

export default function LiveDemo() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const [mode, setMode] = useState<Mode>('idle')
  const [step, setStep] = useState(0)
  const container = useRef<HTMLDivElement>(null)
  const applied = useRef<number>(-1)

  // Autoplay, sobald die Szene zu 40 % im Bild ist — einmal, und nie bei
  // reduzierter Bewegung.
  useEffect(() => {
    const el = container.current
    if (!el || mode !== 'idle') return
    if (reducedMotion()) return
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        io.disconnect()
        dispatch({ type: 'reset' })
        applied.current = -1
        setStep(0)
        setMode('playing')
      }
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [mode])

  // Ein Schritt: Aktion beim Betreten, optional eine zweite nach der
  // halben Dauer, dann weiter. `applied` schützt vor doppeltem Auslösen
  // (StrictMode ruft Effekte im Dev zweimal).
  useEffect(() => {
    if (mode !== 'playing') return
    const s = STORY[step]
    if (!s) return
    if (applied.current !== step) {
      applied.current = step
      if (s.action) dispatch(s.action)
    }
    const timers: number[] = []
    if (s.then) {
      const then = s.then
      timers.push(window.setTimeout(() => dispatch(then), STEP_MS / 2))
    }
    timers.push(window.setTimeout(() => {
      if (step + 1 < STORY.length) setStep(step + 1)
      else setMode('ended')
    }, STEP_MS))
    return () => timers.forEach(t => window.clearTimeout(t))
  }, [mode, step])

  function play() {
    dispatch({ type: 'reset' })
    applied.current = -1
    setStep(0)
    setMode('playing')
  }
  function free() { setMode('free') }
  function reset() { dispatch({ type: 'reset' }); setMode('free') }

  const playing = mode === 'playing'
  const current = playing ? STORY[step] : null
  const focus = current?.focus ?? null

  const guest = state.rooms.find(r => r.nr === GUEST_ROOM)!
  const openOrders = state.rooms.reduce((n, r) => n + r.orders.length, 0)
  const anyUrgent = state.rooms.some(r => r.orders.some(o => o.urgent))
  const active = state.rooms.filter(r => isActive(r) || r.cleaning)
  const inWork = state.rooms.filter(r => r.cleaning).length
  const open = active.length - inWork

  const frame = (which: 'reception' | 'guest' | 'board') =>
    `rounded-xl transition-shadow ${focus === which ? 'ring-2 ring-action ring-offset-2 ring-offset-surface' : ''}`

  return (
    <div ref={container} className="rounded-2xl border border-edge bg-surface-elevated p-4 sm:p-6">
      {/* Kopfzeile: Geschichte oder freie Bedienung */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-h-14 flex-1">
          {current ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Schritt {step + 1} von {STORY.length} · {current.who}
              </p>
              <p className="font-bold text-ink">{current.title}</p>
              <p className="text-sm text-ink-soft">{current.text}</p>
            </>
          ) : (
            <>
              <p className="font-bold text-ink">
                {mode === 'ended' ? 'Fertig — jetzt selbst ausprobieren.' : 'Probier es aus.'}
              </p>
              <p className="text-sm text-ink-soft">
                Tipp im Gast-Handy, klick an der Rezeption, wisch auf dem Board — alles wirkt sofort auf die anderen beiden.
              </p>
            </>
          )}
        </div>
        <div className="flex gap-2">
          {playing ? (
            <button type="button" onClick={free} className="rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:border-edge-strong">
              Selbst ausprobieren
            </button>
          ) : (
            <button type="button" onClick={play} className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:border-edge-strong">
              <Play className="h-4 w-4" aria-hidden /> Geschichte abspielen
            </button>
          )}
          <button type="button" onClick={reset} aria-label="Zurücksetzen" title="Zurücksetzen" className="rounded-lg border border-edge bg-surface px-2.5 py-1.5 text-ink-soft hover:border-edge-strong hover:text-ink">
            <RotateCcw className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* Schritt-Punkte */}
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {STORY.map((s, i) => (
          <span key={s.title} className={`h-1.5 flex-1 rounded-full ${playing && i <= step ? 'bg-action' : 'bg-surface-muted'}`} />
        ))}
      </div>

      {/* Die Szene */}
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {/* Rezeption */}
        <div className={frame('reception')}>
          <Frame title="Rezeption — Übersicht" badge={openOrders > 0 ? { text: `Services ${openOrders}`, urgent: anyUrgent } : null}>
            <div className="mb-2 flex items-center justify-between text-[11px] text-ink-muted">
              <span className="font-semibold text-ink">Etage 2</span>
              <span>{open} offen · {inWork} in Arbeit</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {state.rooms.map(r => <Tile key={`${r.nr}:${state.flash[r.nr] ?? 0}`} room={r} flash={(state.flash[r.nr] ?? 0) > 0} />)}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <MiniButton onClick={() => dispatch(guest.occupied ? { type: 'checkout', nr: GUEST_ROOM } : { type: 'checkin', nr: GUEST_ROOM })} disabled={playing}>
                {guest.occupied ? 'Check-out 202' : 'Check-in 202'}
              </MiniButton>
              {(() => {
                const r204 = state.rooms.find(r => r.nr === '204')!
                return (
                  <MiniButton onClick={() => dispatch(r204.occupied ? { type: 'checkout', nr: '204' } : { type: 'checkin', nr: '204' })} disabled={playing}>
                    {r204.occupied ? 'Check-out 204' : 'Check-in 204'}
                  </MiniButton>
                )
              })()}
              <MiniButton onClick={() => dispatch({ type: 'priority', nr: '205' })} disabled={playing}>
                <Flag className="h-3 w-3" aria-hidden /> Prio 205
              </MiniButton>
            </div>
            {guest.occupied && (
              <div className="mt-2 flex items-center justify-between rounded-md border border-action-tint-edge bg-action-tint px-2 py-1.5 text-[11px]">
                <span className="font-semibold text-action-deep">Aufenthalt 202</span>
                <span className="rounded bg-surface-elevated px-1.5 font-mono font-bold tracking-widest text-ink">PIN {PIN}</span>
              </div>
            )}
            {openOrders > 0 && (
              <ul className="mt-2 space-y-1">
                {state.rooms.flatMap(r => r.orders.map(o => (
                  <li key={o.id} className={`flex items-center justify-between rounded-md border px-2 py-1 text-[11px] ${o.urgent ? 'border-critical bg-critical-tint' : 'border-edge bg-surface-elevated'}`}>
                    <span className="truncate">
                      <span className="font-bold text-ink">{r.nr}</span>{' '}
                      <span className={o.urgent ? 'font-semibold text-critical-strong' : 'text-ink-soft'}>{o.name}</span>
                    </span>
                    <button type="button" onClick={() => dispatch({ type: 'orderDone', nr: r.nr, id: o.id })} disabled={playing}
                      className="ml-2 flex items-center gap-1 rounded bg-positive px-1.5 py-0.5 text-[10px] font-bold text-positive-foreground disabled:opacity-50">
                      <Check className="h-3 w-3" aria-hidden /> Erledigt
                    </button>
                  </li>
                )))}
              </ul>
            )}
          </Frame>
        </div>

        {/* Gast */}
        <div className={`order-first md:order-none ${frame('guest')}`}>
          <div data-theme="dark" className="overflow-hidden rounded-xl border border-edge bg-surface text-ink">
            <div className="mx-auto max-w-[240px] px-3 py-4">
              <p className="text-center text-[11px] text-ink-muted">Hotel Alpenblick</p>
              <p className="text-center text-sm font-black">Zimmer {GUEST_ROOM}</p>
              {!guest.occupied ? (
                <div className="mt-3 space-y-2 rounded-lg border border-edge bg-surface-elevated p-3 text-center text-[11px] text-ink-soft">
                  <p>Noch kein Aufenthalt — der Zugang entsteht beim Check-in an der Rezeption.</p>
                  <MiniButton onClick={() => dispatch({ type: 'checkin', nr: GUEST_ROOM })} disabled={playing}>An der Rezeption einchecken</MiniButton>
                </div>
              ) : (
                <>
                  <p className="mt-1 text-center text-[10px] text-ink-muted">Handout: QR + PIN {PIN}</p>
                  <div className="mt-3 grid grid-cols-2 gap-1.5">
                    <button type="button" disabled={playing}
                      onClick={() => dispatch({ type: 'signal', nr: GUEST_ROOM, signal: guest.signal === 'clean' ? 'none' : 'clean' })}
                      className={`rounded-lg px-2 py-2.5 text-center text-[11px] font-bold transition-colors ${
                        guest.signal === 'clean'
                          ? 'bg-attention text-attention-foreground'
                          : 'border border-edge bg-surface-elevated hover:border-edge-strong'
                      }`}>
                      <Sparkles className="mx-auto mb-1 h-4 w-4" aria-hidden />
                      Zimmer reinigen
                    </button>
                    <button type="button" disabled={playing}
                      onClick={() => dispatch({ type: 'signal', nr: GUEST_ROOM, signal: guest.signal === 'dnd' ? 'none' : 'dnd' })}
                      className={`rounded-lg px-2 py-2.5 text-center text-[11px] font-bold transition-colors ${
                        guest.signal === 'dnd'
                          ? 'bg-blocked text-blocked-foreground'
                          : 'border border-edge bg-surface-elevated hover:border-edge-strong'
                      }`}>
                      <Moon className="mx-auto mb-1 h-4 w-4" aria-hidden />
                      Nicht stören
                    </button>
                  </div>
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Services</p>
                  <div className="mt-1 space-y-1">
                    {SERVICES.map(s => (
                      <div key={s.name} className="flex items-center justify-between gap-2 rounded-md border border-edge bg-surface-elevated px-2 py-1.5 text-[11px]">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{s.name}</span>
                          <span className={s.urgent ? 'font-bold text-critical-strong' : 'text-ink-muted'}>{s.meta}</span>
                        </span>
                        <button type="button" disabled={playing}
                          onClick={() => dispatch({ type: 'order', nr: GUEST_ROOM, name: s.name, urgent: s.urgent })}
                          className="shrink-0 rounded bg-action px-2 py-1 text-[10px] font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50">
                          Bestellen
                        </button>
                      </div>
                    ))}
                  </div>
                  {guest.orders.length > 0 && (
                    <p className="mt-2 text-center text-[10px] text-ink-muted">
                      {guest.orders.length} {guest.orders.length === 1 ? 'Anfrage' : 'Anfragen'} offen
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Reinigungsboard */}
        <div className={frame('board')}>
          <Frame title="Reinigungsboard">
            <div className="flex items-center justify-between rounded-md border border-edge bg-surface-elevated px-2 py-1.5 text-[11px]">
              <span className="font-bold text-ink">Etage 2</span>
              {open > 0 ? (
                <span className="flex items-center gap-1 font-semibold text-action">
                  <Target className="h-3 w-3" aria-hidden /> Als Nächstes · {open} offen
                </span>
              ) : (
                <span className="text-ink-muted">{inWork > 0 ? `${inWork} in Arbeit` : 'alles erledigt'}</span>
              )}
            </div>
            <div className="mt-2 space-y-1.5">
              {active.length === 0 && (
                <p className="rounded-md border border-dashed border-edge px-2 py-3 text-center text-[11px] text-ink-muted">
                  Keine offene Reinigung auf dieser Etage.
                </p>
              )}
              {active
                .slice()
                .sort((a, b) => Number(b.cleaning) - Number(a.cleaning) || Number(b.priority) - Number(a.priority) || Number(b.checkoutPending) - Number(a.checkoutPending))
                .map(r => {
                  const t = tone(r)
                  return (
                    <div key={r.nr} className={`rounded-md border p-1.5 ${r.priority && !r.cleaning ? 'border-accent blink-ring-priority' : 'border-edge'} bg-surface-elevated`}>
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-ink">Zimmer {r.nr}</span>
                        <span className="text-ink-muted">
                          {r.cleaning ? `${MAID} in ${r.nr}` : t.label}
                        </span>
                      </div>
                      {r.cleaning ? (
                        <SlideAction size="compact" variant="success" label="Reinigung abschließen"
                          disabled={playing} onConfirm={() => dispatch({ type: 'finishCleaning', nr: r.nr })} />
                      ) : (
                        <SlideAction size="compact" variant={r.priority ? 'priority' : 'warning'} label="Reinigung starten"
                          disabled={playing || inWork > 0} onConfirm={() => dispatch({ type: 'startCleaning', nr: r.nr })} />
                      )}
                    </div>
                  )
                })}
            </div>
          </Frame>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-ink-muted" aria-live="polite">{state.lastEvent}</p>
    </div>
  )
}

/* ── Bausteine ──────────────────────────────────────────────────── */

function Frame({ title, badge, children }: { title: string; badge?: { text: string; urgent: boolean } | null; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-edge bg-surface">
      <div className="flex items-center gap-1.5 border-b border-edge bg-surface-sunken px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-edge-strong" />
        <span className="h-2 w-2 rounded-full bg-edge-strong" />
        <span className="h-2 w-2 rounded-full bg-edge-strong" />
        <span className="ml-2 text-[11px] font-semibold text-ink-muted">{title}</span>
        {badge && (
          <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.urgent ? 'bg-critical text-critical-foreground blink-icon' : 'bg-action text-action-foreground'}`}>
            {badge.text}
          </span>
        )}
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}

function Tile({ room: r, flash }: { room: Room; flash: boolean }) {
  const t = tone(r)
  const urgent = r.orders.some(o => o.urgent)
  return (
    <div
      className={`overflow-hidden rounded-md border bg-surface-elevated ${
        urgent ? 'border-critical ring-1 ring-critical blink-ring-overdue' : r.priority ? 'border-accent' : 'border-edge'
      } ${flash ? 'flash-state-change' : ''}`}
    >
      <div className={`h-1 ${t.bar}`} />
      <div className="px-1.5 py-1">
        <div className="flex items-center gap-1 text-xs font-bold text-ink">
          {r.nr}
          {r.cleaning && <Loader2 className="h-3 w-3 animate-spin text-ink-muted" aria-label="in Reinigung" />}
          {r.orders.length > 0 && <Bell className={`h-3 w-3 ${urgent ? 'text-critical-strong blink-icon' : 'text-ink-soft'}`} aria-label="Service-Anfrage" />}
          {r.priority && <Flag className="h-3 w-3 text-accent" aria-label="priorisiert" />}
          {r.signal === 'dnd' && <Ban className="h-3 w-3 text-blocked-strong" aria-label="nicht stören" />}
        </div>
        <div className="truncate text-[10px] text-ink-muted">{r.cleaning ? 'in Reinigung' : t.label}</div>
      </div>
    </div>
  )
}

function MiniButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="flex items-center gap-1 rounded-md border border-edge bg-surface-elevated px-2 py-1 text-[11px] font-semibold text-ink hover:border-edge-strong disabled:opacity-50">
      {children}
    </button>
  )
}
