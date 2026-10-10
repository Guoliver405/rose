'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRightLeft, ChevronRight, Flag, Loader2, Siren, SlidersHorizontal, Target, Users, X,
} from 'lucide-react'
import RoomSymbol from '@/components/RoomSymbol'
import SlideAction from '@/components/SlideAction'
import { ROOM_BARS, ROOM_RINGS } from '@/lib/room-symbols'
import {
  abortCleaningAction, enterFloorAction, finishCleaningAction, guestAtDoorAction,
  leaveFloorAction, startCleaningAction,
} from './actions'
import { floorSwitchHint, recommendFloor, type DoorChoice, type RecommendFloor } from '@/lib/board'
import { format, plural, type ServiceMessages } from '@/lib/i18n'

type M = ServiceMessages

export type BoardRoom = {
  id: string
  number: string
  floor: number
  building: string | null
  occupied: boolean
  /** Geplanter Abreisetag ist heute — keine Routine, Reinigung erst nach dem Check-out. */
  departureToday: boolean
  guestSignal: 'none' | 'please_clean' | 'dnd'
  /** „HH:MM" — Reinigung erst ab dieser Uhrzeit: Wunsch des Gastes oder „bitte später" an der Tür. */
  cleanDeferredUntil: string | null
  /** An der Tür „heute nicht" — Routine für heute erledigt. */
  declinedToday: boolean
  /** „HH:MM" — heute „Nicht stören" aufgehoben, seitdem nicht gereinigt. Nur Hinweis, kein Gewicht. */
  dndLiftedAt: string | null
  /** Die Kraft darf hier „Gast an der Tür" wählen (siehe `canAnswerAtDoor`). */
  canAnswerAtDoor: boolean
  checkoutPending: boolean
  priority: boolean
  stayoverDue: boolean
  active: boolean
  score: number
  cleaningByName: string | null
  cleaningByMe: boolean
  cleaningFresh: boolean
  cleaningStale: boolean
}

export type BoardFloor = {
  building: string | null
  floor: number
  score: number
  rooms: BoardRoom[]
  /** Namen der aktuell auf dieser Etage eingebuchten Kolleginnen. */
  maids: string[]
}

type ShiftInfo = {
  onShift: boolean
  onBreak: boolean
  onOther: boolean
  shiftStartedAt: string | null
}

function floorKey(f: Pick<BoardFloor, 'building' | 'floor'>): string {
  return `${f.building ?? ''}#${f.floor}`
}

function floorLabel(f: Pick<BoardFloor, 'building' | 'floor'>, m: M): string {
  return f.building
    ? format(m.common.floorInBuilding, { building: f.building, floor: f.floor })
    : format(m.common.floor, { floor: f.floor })
}

function statusLabel(r: BoardRoom, m: M): string {
  const b = m.board
  if (r.cleaningByMe && r.cleaningFresh) return b.youAreCleaning
  if (r.cleaningByName && r.cleaningFresh) return format(b.someoneCleaning, { name: r.cleaningByName })
  const parts: string[] = []
  if (r.priority) parts.push(b.state.priority)
  if (r.checkoutPending) parts.push(b.state.checkout)
  if (r.guestSignal === 'please_clean') parts.push(r.cleanDeferredUntil ? format(b.state.from, { time: r.cleanDeferredUntil }) : b.state.wanted)
  else if (r.cleanDeferredUntil) parts.push(format(b.state.from, { time: r.cleanDeferredUntil }))
  if (r.dndLiftedAt) parts.push(format(b.state.dndLifted, { time: r.dndLiftedAt }))
  if (r.stayoverDue) parts.push(b.state.daily)
  if (r.declinedToday) parts.push(b.state.declined)
  if (r.guestSignal === 'dnd') parts.push(b.state.dnd)
  if (r.departureToday && !r.checkoutPending) parts.push(b.state.departureToday)
  if (parts.length === 0) parts.push(r.occupied ? b.state.occupied : b.state.vacant)
  return parts.join(' · ')
}

/** Farb-Vorrang wie im Admin: priorisiert > in Arbeit > ausgecheckt > Wunsch/Routine.
    Violett = priorisiert (Rot bleibt DND/dringend vorbehalten). */
function tileBar(r: BoardRoom): string {
  if (r.priority) return ROOM_BARS.priority.className
  if (r.cleaningFresh) return ROOM_BARS.working.className
  if (r.checkoutPending) return ROOM_BARS.checkout.className
  if ((r.guestSignal === 'please_clean' && !r.cleanDeferredUntil) || r.stayoverDue) return ROOM_BARS.wanted.className
  return ROOM_BARS.neutral.className
}

/** Offenes Prio-Zimmer (nicht gerade in frischer Reinigung) auf der Etage? */
function hasOpenPriority(f: BoardFloor): boolean {
  return f.rooms.some(r => r.priority && !r.cleaningFresh)
}

/** Zimmer, die hier noch zu tun sind — laufende Reinigungen zählen nicht. */
function openRooms(f: BoardFloor): BoardRoom[] {
  return f.rooms.filter(r => r.active && !r.cleaningFresh)
}

/**
 * Etage, wie die Empfehlung sie sieht (Regeln in `board.ts`: Priorität zuerst,
 * sonst höchste offene Dringlichkeit ÷ Kräfte vor Ort + 1; Abreisen wiegen je
 * nach Check-out-Druck — das steckt schon im Zimmer-Score vom Server).
 */
function toRecommend(f: BoardFloor): RecommendFloor {
  const open = openRooms(f)
  return {
    key: floorKey(f),
    floor: f.floor,
    building: f.building ?? '',
    score: open.reduce((sum, r) => sum + r.score, 0),
    maids: f.maids.length,
    openPriority: hasOpenPriority(f),
    openDepartures: open.filter(r => r.checkoutPending).length,
  }
}

export default function ServiceBoard({
  hotelSlug,
  floors,
  shift,
  myCleaningRoomId,
  myFloorKey,
  myCleaningRoomNumber,
  m,
  intlLocale,
}: {
  /** Mandant aus der URL — alle Portal-Links tragen ihn mit. */
  hotelSlug: string
  floors: BoardFloor[]
  shift: ShiftInfo
  myCleaningRoomId: string | null
  /** Etage, auf die ich eingebucht bin (maid_presence) — null = Etagen-Übersicht. */
  myFloorKey: string | null
  myCleaningRoomNumber: string | null
  m: M
  /** Sprach-Tag für Uhrzeiten und Pluralformen („de-DE“). */
  intlLocale: string
}) {
  const router = useRouter()
  const b = m.board
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Fallback-Poll: nach Ablauf des Realtime-Tokens (~1 h idle) hält der
  // 60-s-Refresh das Board am Leben — jeder Refresh liefert frischen Token.
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 60_000)
    return () => clearInterval(t)
  }, [router])

  const myFloor = myFloorKey ? floors.find(f => floorKey(f) === myFloorKey) ?? null : null
  const visibleRooms = myFloor ? myFloor.rooms : []
  const selected = selectedId ? visibleRooms.find(r => r.id === selectedId) ?? null : null

  const allRooms = floors.flatMap(f => f.rooms)
  const openCount = allRooms.filter(r => r.active && !r.cleaningFresh).length
  const inProgressCount = allRooms.filter(r => r.cleaningFresh).length
  // Warn-Lampe: irgendwo im Haus ist ein Prio-Zimmer offen.
  const priorityFloors = floors.filter(hasOpenPriority)
  const recommendInput = floors.map(toRecommend)
  const recommendedKey = recommendFloor(recommendInput)
  // Nach jedem Zimmer: Lohnt ein Wechsel? Nicht während einer eigenen Reinigung.
  const switchHint = myFloorKey && shift.onShift && !myCleaningRoomId ? floorSwitchHint(myFloorKey, recommendInput) : null
  const switchFloor = switchHint ? floors.find(f => floorKey(f) === switchHint.key) ?? null : null

  function run(action: () => Promise<{ error?: string }>, closeDialog = false) {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const res = await action()
      if (res.error) { setError(res.error); return }
      if (closeDialog) setSelectedId(null)
    })
  }

  const shiftStartedLabel = shift.shiftStartedAt
    ? new Date(shift.shiftStartedAt).toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' })
    : null

  // Statusleiste: der markanteste Zustand gewinnt (Zimmerreinigung > Pause >
  // sonstige Reinigung > Schicht > frei). Alle Wechsel liegen auf /service/status.
  const status = myCleaningRoomNumber
    ? { label: format(b.youClean, { number: myCleaningRoomNumber }), tone: 'bg-positive-pill text-positive-deepest' }
    : shift.onBreak
      ? { label: b.onBreak, tone: 'bg-caution-pill text-caution-deepest' }
      : shift.onOther
        ? { label: b.onOther, tone: 'bg-attention-pill text-attention-deepest' }
        : shift.onShift
          ? { label: shiftStartedLabel ? format(b.onShiftSince, { time: shiftStartedLabel }) : b.onShift, tone: 'bg-positive-pill text-positive-deepest' }
          : { label: b.offShift, tone: 'bg-surface-muted text-ink-soft' }

  return (
    <div className="flex flex-col gap-4">
      {/* Kompakte Statusleiste — Zustand + die zwei wichtigsten Zahlen */}
      <section className="flex flex-wrap items-center gap-2 rounded-xl border border-edge bg-surface px-3 py-2">
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${status.tone}`}>
          {status.label}
        </span>

        <span className="rounded-full bg-surface-muted px-2.5 py-1 text-sm font-semibold text-ink-soft">
          {format(b.openCount, { count: openCount })}
        </span>
        {inProgressCount > 0 && (
          <span className="rounded-full bg-positive-pill px-2.5 py-1 text-sm font-semibold text-positive-deepest">
            {format(b.inProgressCount, { count: inProgressCount })}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {myFloor && priorityFloors.length > 0 && (
            /* Reine Warnlampe — das Verlassen der Etage läuft über den
               Slider darunter, nie über einen versehentlichen Tipper. */
            <span
              title={format(b.priorityOpenTitle, { floors: priorityFloors.map(f => floorLabel(f, m)).join(', ') })}
              className="flex items-center gap-1.5 rounded-lg border border-accent-pill-edge bg-accent-tint px-2.5 py-1.5 text-sm font-bold text-accent-strong"
            >
              <Siren className="blink-icon h-4 w-4" />
              <span className="hidden sm:inline">{b.priorityOpen}</span>
            </span>
          )}
          <Link
            href={`/h/${hotelSlug}/service/status`}
            className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-bold text-ink-soft hover:border-edge-strong hover:text-ink"
          >
            <SlidersHorizontal className="h-4 w-4" /> {b.statusLink}
          </Link>
        </div>
      </section>

      {!shift.onShift && (
        <p className="rounded-xl border border-attention-tint-edge bg-attention-tint px-4 py-3 text-sm font-semibold text-attention-deepest">
          {b.offShiftHint}
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
          {error}
        </p>
      )}
      {notice && !error && (
        <p className="rounded-lg border border-positive-pill-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
          {notice}
        </p>
      )}

      {/* Ebene 1: Etagen-Übersicht (feste Reihenfolge wie in der Rezeption) */}
      {!myFloor && (
        <div className="flex flex-col gap-2">
          {floors.map(f => (
            <FloorRow
              key={floorKey(f)}
              floor={f}
              pending={pending}
              recommended={floorKey(f) === recommendedKey}
              m={m}
              onEnter={() => run(() => enterFloorAction(f.building, f.floor))}
            />
          ))}
        </div>
      )}

      {/* Etage verlassen — eigene schmale Zeile, bewusst als Slider:
          ein Fehltipper soll nicht aus der Etage werfen. */}
      {myFloor && (
        <SlideAction
          label={b.backToFloors}
          variant="neutral"
          size="compact"
          direction="rtl"
          disabled={pending}
          onConfirm={() => run(leaveFloorAction)}
        />
      )}

      {/* Ebene 2: Zimmer der eingebuchten Etage */}
      {myFloor && (
        <section className="rounded-xl border border-edge bg-surface px-4 py-3">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink-soft">
            {floorLabel(myFloor, m)}
            <span className="font-normal text-ink-muted">
              {myFloor.rooms.filter(r => r.active).length > 0
                ? format(b.openCount, { count: myFloor.rooms.filter(r => r.active).length })
                : b.nothingOpen}
            </span>
            {myFloor.maids.length > 1 && (
              <span className="flex items-center gap-1 font-normal text-ink-muted">
                <Users className="h-3.5 w-3.5" /> {myFloor.maids.join(', ')}
              </span>
            )}
          </h2>
          {switchHint && switchFloor && (
            <div
              data-switch-hint={switchHint.reason}
              className={`mb-3 flex flex-col gap-2 rounded-lg border px-3 py-2 ${
                switchHint.reason === 'priority' ? 'border-accent-pill-edge bg-accent-tint'
                  : switchHint.reason === 'departures' ? 'border-caution-tint-edge bg-caution-tint'
                    : 'border-edge bg-surface-sunken'
              }`}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <ArrowRightLeft className="h-4 w-4 shrink-0" />
                {switchHint.reason === 'priority'
                  ? format(b.switchPriority, { floor: floorLabel(switchFloor, m) })
                  : switchHint.reason === 'departures'
                    ? plural(intlLocale, toRecommend(switchFloor).openDepartures, b.switchDepartures, { floor: floorLabel(switchFloor, m) })
                    : format(b.switchLoad, { floor: floorLabel(switchFloor, m) })}
              </p>
              <SlideAction
                label={format(b.switchTo, { floor: floorLabel(switchFloor, m) })}
                variant={switchHint.reason === 'priority' ? 'priority' : 'neutral'}
                size="compact"
                disabled={pending}
                onConfirm={() => run(() => enterFloorAction(switchFloor.building, switchFloor.floor))}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {myFloor.rooms.map(room => (
              <RoomTile key={room.id} room={room} m={m} onClick={() => { setError(null); setNotice(null); setSelectedId(room.id) }} />
            ))}
          </div>
        </section>
      )}

      {selected && (
        <RoomDialog
          key={selected.id}
          room={selected}
          shift={shift}
          m={m}
          myCleaningRoomId={myCleaningRoomId}
          pending={pending}
          onStart={() => run(() => startCleaningAction(selected.id))}
          onFinish={() => run(() => finishCleaningAction(selected.id), true)}
          onAbort={() => run(() => abortCleaningAction(selected.id), true)}
          onDoor={choice => run(() => guestAtDoorAction(selected.id, choice), true)}
          onClose={() => setSelectedId(null)}
          error={error}
        />
      )}
    </div>
  )
}

/** Verdichtete Etagen-Zeile: wie viel ist zu tun, wer ist schon dort. */
function FloorRow({
  floor: f,
  pending,
  recommended,
  onEnter,
  m,
}: {
  floor: BoardFloor
  m: M
  pending: boolean
  /** Wegweiser: hier lohnt sich der Weg am meisten (genau eine Etage). */
  recommended: boolean
  onEnter: () => void
}) {
  const open = openRooms(f).length
  const inProgress = f.rooms.filter(r => r.cleaningFresh).length
  const prio = hasOpenPriority(f)
  const idle = open === 0 && inProgress === 0 && f.maids.length === 0

  return (
    <button
      type="button"
      disabled={pending}
      onClick={onEnter}
      className={`flex items-center gap-3 rounded-xl border bg-surface px-4 py-3 text-left hover:border-edge-strong disabled:opacity-50 ${
        prio
          ? 'border-accent blink-ring-priority'
          : recommended
            ? 'border-action'
            : 'border-edge'
      } ${idle ? 'opacity-60' : ''}`}
    >
      <span className="text-base font-black text-ink">{floorLabel(f, m)}</span>

      {recommended && (
        <span className="flex items-center gap-1 rounded-full bg-action px-2.5 py-0.5 text-xs font-bold text-action-foreground">
          {/* Blinkt nur, wenn die Zeile nicht ohnehin schon wegen Prio blinkt. */}
          <Target className={`h-3.5 w-3.5 ${prio ? '' : 'blink-icon'}`} /> {m.board.next}
        </span>
      )}

      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
        open > 0 ? 'bg-attention-pill text-attention-deepest' : 'bg-positive-pill text-positive-deepest'
      }`}>
        {open > 0 ? format(m.board.openCount, { count: open }) : m.board.done}
      </span>
      {prio && (
        <span className="flex items-center gap-1 rounded-full bg-accent-pill px-2.5 py-0.5 text-xs font-bold text-accent-deep">
          <Flag className="h-3 w-3" /> {m.board.prio}
        </span>
      )}
      {inProgress > 0 && (
        <span className="flex items-center gap-1 rounded-full bg-positive-pill px-2.5 py-0.5 text-xs font-semibold text-positive-deepest">
          <Loader2 className="h-3 w-3 animate-spin" /> {format(m.board.inProgressCount, { count: inProgress })}
        </span>
      )}

      <span className="ml-auto flex items-center gap-3">
        {f.maids.length > 0 && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
            <Users className="h-4 w-4" /> {f.maids.join(', ')}
          </span>
        )}
        <ChevronRight className="h-4 w-4 text-ink-muted" />
      </span>
    </button>
  )
}

function RoomTile({ room, onClick, m }: { room: BoardRoom; onClick: () => void; m: M }) {
  const grayed = !room.active && !room.cleaningFresh
  return (
    <button
      type="button"
      onClick={onClick}
      title={statusLabel(room, m)}
      className={`flex flex-col overflow-hidden rounded-lg border bg-surface-elevated text-left shadow-sm hover:border-edge-strong ${
        room.priority && !room.cleaningFresh ? ROOM_RINGS.priority.className : 'border-edge'
      } ${grayed ? 'opacity-50' : ''}`}
    >
      <span className={`h-2 w-full ${tileBar(room)}`} />
      <span className="flex flex-col gap-0.5 px-3 py-2">
        <span className="flex items-center gap-1.5">
          <span className={`text-lg font-black ${grayed ? 'text-ink-muted' : 'text-ink'}`}>
            {room.number}
          </span>
          {room.occupied && <RoomSymbol id="occupied" size="md" />}
          {room.departureToday && <RoomSymbol id="departure" size="md" aria-label={m.board.state.departureToday} />}
          {room.guestSignal === 'dnd' && <RoomSymbol id="dnd" size="md" />}
          {room.guestSignal === 'please_clean' && !room.cleanDeferredUntil && <RoomSymbol id="clean" size="md" />}
          {room.cleanDeferredUntil && <RoomSymbol id="deferred" size="md" />}
          {room.declinedToday && <RoomSymbol id="declined" size="md" />}
          {room.stayoverDue && <RoomSymbol id="routine" size="md" />}
          {room.checkoutPending && <RoomSymbol id="checkout" size="md" />}
          {room.priority && <RoomSymbol id="priority" size="md" />}
          {room.cleaningFresh && <RoomSymbol id="cleaning" size="md" />}
        </span>
        <span className="h-4 truncate text-xs font-semibold text-ink-muted">
          {room.cleaningFresh
            ? (room.cleaningByMe ? m.board.youAreHere : room.cleaningByName)
            : room.cleaningStale
              ? m.board.stale
              : room.active
                ? statusLabel(room, m)
                : ''}
        </span>
      </span>
    </button>
  )
}

function RoomDialog({
  room, shift, myCleaningRoomId, pending, error, onStart, onFinish, onAbort, onDoor, onClose, m,
}: {
  room: BoardRoom
  m: M
  shift: ShiftInfo
  myCleaningRoomId: string | null
  pending: boolean
  error: string | null
  onStart: () => void
  onFinish: () => void
  onAbort: () => void
  onDoor: (choice: DoorChoice) => void
  onClose: () => void
}) {
  const mineActive = room.cleaningByMe && room.cleaningFresh
  const otherActive = !room.cleaningByMe && room.cleaningFresh
  const canStart =
    room.active &&
    !room.cleaningFresh &&
    room.guestSignal !== 'dnd' &&
    shift.onShift &&
    !myCleaningRoomId

  const startVariant = room.priority ? 'priority' : 'warning'
  const b = m.board

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-edge bg-surface-elevated p-5 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-black text-ink">{format(m.common.room, { number: room.number })}</h3>
            <p className="text-xs text-ink-muted">
              {floorLabel(room, m)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-ink"
            aria-label={m.common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm font-semibold text-ink-soft">{statusLabel(room, m)}</p>

        {error && (
          <p className="mb-4 rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {mineActive && (
            <>
              <SlideAction
                label={b.finish}
                variant="success"
                disabled={pending}
                onConfirm={onFinish}
              />
              <button
                type="button"
                disabled={pending}
                onClick={onAbort}
                className="self-start text-sm font-semibold text-ink-muted underline-offset-2 hover:text-ink hover:underline disabled:opacity-50"
              >
                {b.abort}
              </button>
            </>
          )}

          {otherActive && (
            <p className="rounded-lg border border-positive-pill-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
              {format(b.otherInRoom, { name: room.cleaningByName ?? m.common.someone })}
            </p>
          )}

          {room.cleaningStale && !room.cleaningFresh && (
            <p className="rounded-lg border border-caution-pill-edge bg-caution-tint px-3 py-2 text-sm font-semibold text-caution-deepest">
              {room.cleaningByName ? format(b.staleNamed, { name: room.cleaningByName }) : b.staleUnnamed}
            </p>
          )}

          {canStart && (
            <SlideAction
              label={b.start}
              variant={startVariant}
              disabled={pending}
              onConfirm={onStart}
            />
          )}

          {/* Gast an der Tür: kein Start nötig — die Kraft steht davor. */}
          {room.canAnswerAtDoor && shift.onShift && (
            <div className="rounded-lg border border-edge bg-surface px-3 py-2.5">
              <p className="mb-2 text-sm font-semibold text-ink-soft">{b.door.question}</p>
              <div className="grid grid-cols-3 gap-2">
                {([['30', b.door.in30], ['60', b.door.in60], ['today', b.door.today]] as [DoorChoice, string][]).map(([choice, label]) => (
                  <button
                    key={choice}
                    type="button"
                    disabled={pending}
                    onClick={() => onDoor(choice)}
                    className="rounded-lg border border-edge bg-surface-elevated px-2 py-2.5 text-sm font-bold text-ink hover:border-edge-strong disabled:opacity-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                {b.door.hint}
              </p>
            </div>
          )}

          {room.active && !room.cleaningFresh && !shift.onShift && (
            <p className="text-sm font-semibold text-ink-muted">
              {b.startShiftFirst}
            </p>
          )}

          {room.active && !room.cleaningFresh && shift.onShift && myCleaningRoomId && !mineActive && (
            <p className="text-sm font-semibold text-ink-muted">
              {b.busyElsewhere}
            </p>
          )}

          {room.guestSignal === 'dnd' && (
            <p className="rounded-lg border border-blocked-pill-edge bg-blocked-tint px-3 py-2 text-sm font-semibold text-blocked-deepest">
              {b.guestDnd}
            </p>
          )}

          {room.cleanDeferredUntil && !room.cleaningFresh && (
            <p className="rounded-lg border border-edge bg-surface-sunken px-3 py-2 text-sm font-semibold text-ink-soft">
              {format(b.deferredUntil, { time: room.cleanDeferredUntil })}
            </p>
          )}

          {room.declinedToday && !room.cleaningFresh && (
            <p className="rounded-lg border border-edge bg-surface-sunken px-3 py-2 text-sm font-semibold text-ink-soft">
              {b.guestDeclined}
            </p>
          )}

          {!room.active && !room.cleaningFresh && room.guestSignal !== 'dnd' && !room.cleanDeferredUntil && !room.declinedToday && (
            <p className="text-sm font-semibold text-ink-muted">
              {b.nothingToDo}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
