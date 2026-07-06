'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle, BedDouble, Coffee, DoorOpen, Loader2, Moon, Sparkles, X,
} from 'lucide-react'
import SlideAction from '@/components/SlideAction'
import {
  abortCleaningAction, breakToggleAction, finishCleaningAction,
  otherCleaningAction, shiftEndAction, shiftStartAction, startCleaningAction,
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
}

type ShiftInfo = { onShift: boolean; onBreak: boolean; shiftStartedAt: string | null }

function statusLabel(r: BoardRoom): string {
  if (r.cleaningByMe && r.cleaningFresh) return 'Du reinigst dieses Zimmer'
  if (r.cleaningByName && r.cleaningFresh) return `${r.cleaningByName} reinigt gerade`
  const parts: string[] = []
  if (r.priority) parts.push('Priorisiert')
  if (r.checkoutPending) parts.push('Ausgecheckt')
  if (r.guestSignal === 'please_clean') parts.push('Reinigung gewünscht')
  if (r.guestSignal === 'dnd') parts.push('Nicht stören')
  if (parts.length === 0) parts.push(r.occupied ? 'Belegt' : 'Frei')
  return parts.join(' · ')
}

/** Farb-Vorrang wie im Admin: priorisiert > in Arbeit > ausgecheckt > Wunsch. */
function tileBar(r: BoardRoom): string {
  if (r.priority) return 'bg-critical'
  if (r.cleaningFresh) return 'bg-positive-soft'
  if (r.checkoutPending) return 'bg-caution'
  if (r.guestSignal === 'please_clean') return 'bg-attention'
  return 'bg-edge'
}

export default function ServiceBoard({
  floors,
  shift,
  myCleaningRoomId,
}: {
  floors: BoardFloor[]
  shift: ShiftInfo
  myCleaningRoomId: string | null
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

  const allRooms = floors.flatMap(f => f.rooms)
  const selected = selectedId ? allRooms.find(r => r.id === selectedId) ?? null : null
  const openCount = allRooms.filter(r => r.active && !r.cleaningFresh).length
  const inProgressCount = allRooms.filter(r => r.cleaningFresh).length

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
      {/* Schicht-Panel */}
      <section className="rounded-xl border border-edge bg-surface p-4">
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

      {/* Etagen */}
      {floors.map(f => (
        <section
          key={`${f.building ?? ''}#${f.floor}`}
          className="rounded-xl border border-edge bg-surface px-4 py-3"
        >
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink-soft">
            {f.building ? `${f.building} · ` : ''}Etage {f.floor}
            {f.score > 0 && (
              <span className="rounded-full bg-attention-pill px-2.5 py-0.5 text-xs font-bold text-attention-deepest" title="Etagenscore — gewichtete Dringlichkeit">
                Score {f.score}
              </span>
            )}
            <span className="font-normal text-ink-muted">
              {f.rooms.filter(r => r.active).length > 0
                ? `${f.rooms.filter(r => r.active).length} offen`
                : 'nichts offen'}
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {f.rooms.map(room => (
              <RoomTile key={room.id} room={room} onClick={() => { setError(null); setNotice(null); setSelectedId(room.id) }} />
            ))}
          </div>
        </section>
      ))}

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

function RoomTile({ room, onClick }: { room: BoardRoom; onClick: () => void }) {
  const grayed = !room.active && !room.cleaningFresh
  return (
    <button
      type="button"
      onClick={onClick}
      title={statusLabel(room)}
      className={`flex flex-col overflow-hidden rounded-lg border bg-surface-elevated text-left shadow-sm hover:border-edge-strong ${
        room.priority && !room.cleaningFresh ? 'border-critical blink-ring-overdue' : 'border-edge'
      } ${grayed ? 'opacity-50' : ''}`}
    >
      <span className={`h-2 w-full ${tileBar(room)}`} />
      <span className="flex flex-col gap-0.5 px-3 py-2">
        <span className="flex items-center gap-1.5">
          <span className={`text-lg font-black ${grayed ? 'text-ink-muted' : 'text-ink'}`}>
            {room.number}
          </span>
          {room.occupied && <BedDouble className="h-4 w-4 text-active-strong" />}
          {room.guestSignal === 'dnd' && <Moon className="h-4 w-4 text-blocked-strong" />}
          {room.guestSignal === 'please_clean' && <Sparkles className="h-4 w-4 text-attention-strong" />}
          {room.checkoutPending && <DoorOpen className="h-4 w-4 text-caution-strong" />}
          {room.priority && <AlertTriangle className="h-4 w-4 text-critical-strong" />}
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

  const startVariant = room.priority ? 'danger' : 'warning'

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
