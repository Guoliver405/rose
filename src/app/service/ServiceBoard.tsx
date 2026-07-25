'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Ban, BedDouble, ChevronRight, Coffee, DoorOpen, Flag, Loader2,
  RefreshCw, Siren, Sparkles, Users, X,
} from 'lucide-react'
import SlideAction from '@/components/SlideAction'
import {
  abortCleaningAction, breakToggleAction, enterFloorAction, finishCleaningAction,
  leaveFloorAction, otherCleaningAction, shiftEndAction, shiftStartAction, startCleaningAction,
} from './actions'

export type BoardRoom = {
  id: string
  number: string
  floor: number
  building: string | null
  occupied: boolean
  guestSignal: 'none' | 'please_clean' | 'dnd'
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

type ShiftInfo = { onShift: boolean; onBreak: boolean; shiftStartedAt: string | null }

function floorKey(f: Pick<BoardFloor, 'building' | 'floor'>): string {
  return `${f.building ?? ''}#${f.floor}`
}

function floorLabel(f: Pick<BoardFloor, 'building' | 'floor'>): string {
  return `${f.building ? `${f.building} · ` : ''}Etage ${f.floor}`
}

function statusLabel(r: BoardRoom): string {
  if (r.cleaningByMe && r.cleaningFresh) return 'Du reinigst dieses Zimmer'
  if (r.cleaningByName && r.cleaningFresh) return `${r.cleaningByName} reinigt gerade`
  const parts: string[] = []
  if (r.priority) parts.push('Priorisiert')
  if (r.checkoutPending) parts.push('Ausgecheckt')
  if (r.guestSignal === 'please_clean') parts.push('Reinigung gewünscht')
  if (r.stayoverDue) parts.push('Routine fällig')
  if (r.guestSignal === 'dnd') parts.push('Nicht stören')
  if (parts.length === 0) parts.push(r.occupied ? 'Belegt' : 'Frei')
  return parts.join(' · ')
}

/** Farb-Vorrang wie im Admin: priorisiert > in Arbeit > ausgecheckt > Wunsch/Routine.
    Violett = priorisiert (Rot bleibt DND/dringend vorbehalten). */
function tileBar(r: BoardRoom): string {
  if (r.priority) return 'bg-accent'
  if (r.cleaningFresh) return 'bg-positive-soft'
  if (r.checkoutPending) return 'bg-caution'
  if (r.guestSignal === 'please_clean' || r.stayoverDue) return 'bg-attention'
  return 'bg-edge'
}

/** Offenes Prio-Zimmer (nicht gerade in frischer Reinigung) auf der Etage? */
function hasOpenPriority(f: BoardFloor): boolean {
  return f.rooms.some(r => r.priority && !r.cleaningFresh)
}

export default function ServiceBoard({
  floors,
  shift,
  myCleaningRoomId,
  myFloorKey,
}: {
  floors: BoardFloor[]
  shift: ShiftInfo
  myCleaningRoomId: string | null
  /** Etage, auf die ich eingebucht bin (maid_presence) — null = Etagen-Übersicht. */
  myFloorKey: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirmShiftEnd, setConfirmShiftEnd] = useState(false)

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
    ? new Date(shift.shiftStartedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="flex flex-col gap-4">
      {/* Status-Bereich */}
      <section className="rounded-xl border border-edge bg-surface p-4">
        {/* Ebene 2: Etagen-Kopf mit Zurück-Button + Prio-Warnlampe */}
        {myFloor && (
          <div className="mb-3 flex items-center gap-3 border-b border-edge pb-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(leaveFloorAction)}
              className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" /> Alle Etagen
            </button>
            <span className="text-base font-black text-ink">{floorLabel(myFloor)}</span>
            {priorityFloors.length > 0 && (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(leaveFloorAction)}
                title={`Priorisierte Reinigung offen: ${priorityFloors.map(floorLabel).join(', ')} — tippen für die Etagen-Übersicht`}
                className="ml-auto flex items-center gap-1.5 rounded-lg border border-accent-pill-edge bg-accent-tint px-3 py-1.5 text-sm font-bold text-accent-strong"
              >
                <Siren className="blink-icon h-4 w-4" /> Prio offen
              </button>
            )}
          </div>
        )}

        {!shift.onShift ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-ink-soft">
              Schicht beginnen, um Zimmer-Reinigungen zu starten.
            </p>
            <SlideAction
              label="Schicht beginnen"
              variant="success"
              disabled={pending}
              onConfirm={() => run(shiftStartAction)}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${shift.onBreak ? 'bg-caution-pill text-caution-deepest' : 'bg-positive-pill text-positive-deepest'}`}>
                {shift.onBreak ? 'Pause' : `Auf Schicht${shiftStartedLabel ? ` seit ${shiftStartedLabel}` : ''}`}
              </span>
              <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-ink-soft">
                {openCount} offen
              </span>
              {inProgressCount > 0 && (
                <span className="rounded-full bg-positive-pill px-3 py-1 text-sm font-semibold text-positive-deepest">
                  {inProgressCount} in Arbeit
                </span>
              )}
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(breakToggleAction)}
                  className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
                >
                  <Coffee className="h-4 w-4" />
                  {shift.onBreak ? 'Pause beenden' : 'Pause'}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(async () => {
                    const res = await otherCleaningAction()
                    if (!res.error) setNotice('Sonstige Reinigung geloggt.')
                    return res
                  })}
                  title="Flur, Lobby, … — wird nur geloggt"
                  className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  Sonstige Reinigung
                </button>
              </div>
            </div>

            {!confirmShiftEnd ? (
              <button
                type="button"
                onClick={() => setConfirmShiftEnd(true)}
                disabled={pending || Boolean(myCleaningRoomId)}
                title={myCleaningRoomId ? 'Erst die laufende Reinigung abschließen' : undefined}
                className="self-start text-sm font-semibold text-ink-muted underline-offset-2 hover:text-ink hover:underline disabled:opacity-40"
              >
                Schicht beenden …
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <SlideAction
                  label="Schicht beenden"
                  variant="danger"
                  disabled={pending || Boolean(myCleaningRoomId)}
                  onConfirm={() => run(async () => {
                    const res = await shiftEndAction()
                    if (!res.error) setConfirmShiftEnd(false)
                    return res
                  })}
                />
                <button
                  type="button"
                  onClick={() => setConfirmShiftEnd(false)}
                  className="self-start text-sm font-semibold text-ink-muted hover:text-ink"
                >
                  Abbrechen
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
            {error}
          </p>
        )}
        {notice && !error && (
          <p className="mt-3 rounded-lg border border-positive-pill-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
            {notice}
          </p>
        )}
      </section>

      {/* Ebene 1: Etagen-Übersicht (feste Reihenfolge wie in der Rezeption) */}
      {!myFloor && (
        <div className="flex flex-col gap-2">
          {floors.map(f => (
            <FloorRow
              key={floorKey(f)}
              floor={f}
              pending={pending}
              onEnter={() => run(() => enterFloorAction(f.building, f.floor))}
            />
          ))}
        </div>
      )}

      {/* Ebene 2: Zimmer der eingebuchten Etage */}
      {myFloor && (
        <section className="rounded-xl border border-edge bg-surface px-4 py-3">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink-soft">
            {floorLabel(myFloor)}
            <span className="font-normal text-ink-muted">
              {myFloor.rooms.filter(r => r.active).length > 0
                ? `${myFloor.rooms.filter(r => r.active).length} offen`
                : 'nichts offen'}
            </span>
            {myFloor.maids.length > 1 && (
              <span className="flex items-center gap-1 font-normal text-ink-muted">
                <Users className="h-3.5 w-3.5" /> {myFloor.maids.join(', ')}
              </span>
            )}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {myFloor.rooms.map(room => (
              <RoomTile key={room.id} room={room} onClick={() => { setError(null); setNotice(null); setSelectedId(room.id) }} />
            ))}
          </div>
        </section>
      )}

      {selected && (
        <RoomDialog
          key={selected.id}
          room={selected}
          shift={shift}
          myCleaningRoomId={myCleaningRoomId}
          pending={pending}
          onStart={() => run(() => startCleaningAction(selected.id))}
          onFinish={() => run(() => finishCleaningAction(selected.id), true)}
          onAbort={() => run(() => abortCleaningAction(selected.id), true)}
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
  onEnter,
}: {
  floor: BoardFloor
  pending: boolean
  onEnter: () => void
}) {
  const open = f.rooms.filter(r => r.active && !r.cleaningFresh).length
  const inProgress = f.rooms.filter(r => r.cleaningFresh).length
  const prio = hasOpenPriority(f)
  const idle = open === 0 && inProgress === 0 && f.maids.length === 0

  return (
    <button
      type="button"
      disabled={pending}
      onClick={onEnter}
      className={`flex items-center gap-3 rounded-xl border bg-surface px-4 py-3 text-left hover:border-edge-strong disabled:opacity-50 ${
        prio ? 'border-accent blink-ring-priority' : 'border-edge'
      } ${idle ? 'opacity-60' : ''}`}
    >
      <span className="text-base font-black text-ink">{floorLabel(f)}</span>

      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
        open > 0 ? 'bg-attention-pill text-attention-deepest' : 'bg-positive-pill text-positive-deepest'
      }`}>
        {open > 0 ? `${open} offen` : 'fertig'}
      </span>
      {prio && (
        <span className="flex items-center gap-1 rounded-full bg-accent-pill px-2.5 py-0.5 text-xs font-bold text-accent-deep">
          <Flag className="h-3 w-3" /> Prio
        </span>
      )}
      {inProgress > 0 && (
        <span className="flex items-center gap-1 rounded-full bg-positive-pill px-2.5 py-0.5 text-xs font-semibold text-positive-deepest">
          <Loader2 className="h-3 w-3 animate-spin" /> {inProgress} in Arbeit
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

function RoomTile({ room, onClick }: { room: BoardRoom; onClick: () => void }) {
  const grayed = !room.active && !room.cleaningFresh
  return (
    <button
      type="button"
      onClick={onClick}
      title={statusLabel(room)}
      className={`flex flex-col overflow-hidden rounded-lg border bg-surface-elevated text-left shadow-sm hover:border-edge-strong ${
        room.priority && !room.cleaningFresh ? 'border-accent blink-ring-priority' : 'border-edge'
      } ${grayed ? 'opacity-50' : ''}`}
    >
      <span className={`h-2 w-full ${tileBar(room)}`} />
      <span className="flex flex-col gap-0.5 px-3 py-2">
        <span className="flex items-center gap-1.5">
          <span className={`text-lg font-black ${grayed ? 'text-ink-muted' : 'text-ink'}`}>
            {room.number}
          </span>
          {room.occupied && <BedDouble className="h-4 w-4 text-active-strong" />}
          {room.guestSignal === 'dnd' && <Ban className="h-4 w-4 text-blocked-strong" />}
          {room.guestSignal === 'please_clean' && <Sparkles className="h-4 w-4 text-attention-strong" />}
          {room.stayoverDue && <RefreshCw className="h-4 w-4 text-attention-strong" />}
          {room.checkoutPending && <DoorOpen className="h-4 w-4 text-caution-strong" />}
          {room.priority && <Flag className="h-4 w-4 text-accent-strong" />}
          {room.cleaningFresh && <Loader2 className="h-4 w-4 animate-spin text-positive-strong" />}
        </span>
        <span className="h-4 truncate text-xs font-semibold text-ink-muted">
          {room.cleaningFresh
            ? (room.cleaningByMe ? 'Du bist hier' : room.cleaningByName)
            : room.cleaningStale
              ? 'verwaist'
              : room.active
                ? statusLabel(room)
                : ''}
        </span>
      </span>
    </button>
  )
}

function RoomDialog({
  room, shift, myCleaningRoomId, pending, error, onStart, onFinish, onAbort, onClose,
}: {
  room: BoardRoom
  shift: ShiftInfo
  myCleaningRoomId: string | null
  pending: boolean
  error: string | null
  onStart: () => void
  onFinish: () => void
  onAbort: () => void
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
            <h3 className="text-xl font-black text-ink">Zimmer {room.number}</h3>
            <p className="text-xs text-ink-muted">
              {room.building ? `${room.building} · ` : ''}Etage {room.floor}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-ink"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm font-semibold text-ink-soft">{statusLabel(room)}</p>

        {error && (
          <p className="mb-4 rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {mineActive && (
            <>
              <SlideAction
                label="Reinigung abschließen"
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
                Reinigung abbrechen (Zimmer bleibt offen)
              </button>
            </>
          )}

          {otherActive && (
            <p className="rounded-lg border border-positive-pill-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
              {room.cleaningByName} ist gerade in diesem Zimmer.
            </p>
          )}

          {room.cleaningStale && !room.cleaningFresh && (
            <p className="rounded-lg border border-caution-pill-edge bg-caution-tint px-3 py-2 text-sm font-semibold text-caution-deepest">
              Die Reinigung von {room.cleaningByName ?? 'einer Kollegin'} wirkt verwaist
              (Abschluss vergessen?) — das Zimmer gilt wieder als offen.
            </p>
          )}

          {canStart && (
            <SlideAction
              label="Reinigung starten"
              variant={startVariant}
              disabled={pending}
              onConfirm={onStart}
            />
          )}

          {room.active && !room.cleaningFresh && !shift.onShift && (
            <p className="text-sm font-semibold text-ink-muted">
              Erst die Schicht beginnen, dann kannst du hier starten.
            </p>
          )}

          {room.active && !room.cleaningFresh && shift.onShift && myCleaningRoomId && !mineActive && (
            <p className="text-sm font-semibold text-ink-muted">
              Du bist noch in einem anderen Zimmer — erst dort abschließen oder abbrechen.
            </p>
          )}

          {room.guestSignal === 'dnd' && (
            <p className="rounded-lg border border-blocked-pill-edge bg-blocked-tint px-3 py-2 text-sm font-semibold text-blocked-deepest">
              Der Gast möchte nicht gestört werden.
            </p>
          )}

          {!room.active && !room.cleaningFresh && room.guestSignal !== 'dnd' && (
            <p className="text-sm font-semibold text-ink-muted">
              Für dieses Zimmer ist keine Reinigung offen.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
