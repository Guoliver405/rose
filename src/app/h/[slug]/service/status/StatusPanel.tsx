'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Coffee, Loader2, Sparkles, Timer } from 'lucide-react'
import SlideAction from '@/components/SlideAction'
import { formatDuration } from '@/lib/worklog'
import { format } from '@/lib/i18n/format'
import type { ServiceMessages } from '@/lib/i18n'
import {
  breakToggleAction, otherCleaningToggleAction, shiftEndAction, shiftStartAction,
} from '../actions'

export type StatusShift = {
  onShift: boolean
  onBreak: boolean
  onOther: boolean
  shiftStartedAt: string | null
  breakStartedAt: string | null
  otherStartedAt: string | null
}

export type TodayTotals = {
  workMs: number
  breakMs: number
  cleaningMs: number
  cleaningCount: number
  otherCleaningMs: number
}


export default function StatusPanel({
  hotelSlug,
  displayName,
  shift,
  cleaning,
  today,
  m,
  intlLocale,
}: {
  /** Mandant aus der URL — der Weg zurück aufs Board trägt ihn mit. */
  hotelSlug: string
  displayName: string
  shift: StatusShift
  cleaning: { roomNumber: string; startedAt: string | null } | null
  today: TodayTotals
  m: ServiceMessages['status']
  /** Sprach-Tag für Uhrzeiten („de-DE“). */
  intlLocale: string
}) {
  const router = useRouter()
  const clockLabel = (iso: string | null): string =>
    iso ? new Date(iso).toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' }) : ''
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function run(action: () => Promise<{ error?: string }>) {
    setError(null)
    startTransition(async () => {
      const res = await action()
      if (res.error) { setError(res.error); return }
      router.refresh()
    })
  }

  // Der markanteste Zustand gewinnt: Zimmerreinigung > Pause > sonstige
  // Reinigung > Schicht > frei.
  const current = cleaning
    ? { kind: 'cleaning', label: format(m.youCleanRoom, { number: cleaning.roomNumber }), since: cleaning.startedAt, tone: 'bg-positive-pill text-positive-deepest' }
    : shift.onBreak
      ? { kind: 'break', label: m.onBreak, since: shift.breakStartedAt, tone: 'bg-caution-pill text-caution-deepest' }
      : shift.onOther
        ? { kind: 'other', label: m.onOther, since: shift.otherStartedAt, tone: 'bg-attention-pill text-attention-deepest' }
        : shift.onShift
          ? { kind: 'shift', label: m.onShift, since: shift.shiftStartedAt, tone: 'bg-positive-pill text-positive-deepest' }
          : { kind: 'off', label: m.offShift, since: null, tone: 'bg-surface-muted text-ink-soft' }

  return (
    <div className="mx-auto flex w-full max-w-[600px] flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/h/${hotelSlug}/service`}
          className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> {m.back}
        </Link>
        <h1 className="text-xl font-black text-ink">{m.title}</h1>
        <span className="ml-auto text-sm font-semibold text-ink-muted">{displayName}</span>
      </div>

      {/* Aktueller Zustand */}
      <section className="rounded-xl border border-edge bg-surface p-5 text-center">
        <span className={`inline-block rounded-full px-4 py-1.5 text-base font-black ${current.tone}`}>
          {current.label}
        </span>
        {current.since && (
          <p className="mt-2 text-sm text-ink-muted">{format(m.since, { time: clockLabel(current.since) })}</p>
        )}
        {shift.onShift && !cleaning && shift.shiftStartedAt && current.kind !== 'shift' && (
          <p className="text-xs text-ink-muted">{format(m.shiftSince, { time: clockLabel(shift.shiftStartedAt) })}</p>
        )}
      </section>

      {/* Tagesbilanz */}
      <section className="grid grid-cols-2 gap-2">
        <Tile icon={<Timer className="h-4 w-4" />} label={m.workToday} value={formatDuration(today.workMs)} />
        <Tile icon={<Coffee className="h-4 w-4" />} label={m.breakToday} value={formatDuration(today.breakMs)} />
        <Tile
          icon={<Sparkles className="h-4 w-4" />}
          label={m.roomsToday}
          value={`${today.cleaningCount}`}
          hint={today.cleaningMs > 0 ? formatDuration(today.cleaningMs) : undefined}
        />
        <Tile
          icon={<Sparkles className="h-4 w-4" />}
          label={m.otherCleaning}
          value={formatDuration(today.otherCleaningMs)}
        />
      </section>

      {error && (
        <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
          {error}
        </p>
      )}

      {/* Zustandswechsel */}
      <section className="flex flex-col gap-3 rounded-xl border border-edge bg-surface p-4">
        <h2 className="text-sm font-bold text-ink-soft">{m.change}</h2>

        {!shift.onShift ? (
          <SlideAction
            label={m.shiftStart}
            variant="success"
            disabled={pending}
            onConfirm={() => run(shiftStartAction)}
          />
        ) : (
          <>
            <SlideAction
              label={shift.onBreak ? m.breakEnd : m.breakStart}
              variant={shift.onBreak ? 'success' : 'warning'}
              disabled={pending}
              onConfirm={() => run(breakToggleAction)}
            />

            <SlideAction
              label={shift.onOther ? m.otherEnd : m.otherStart}
              variant={shift.onOther ? 'success' : 'neutral'}
              disabled={pending || (shift.onBreak && !shift.onOther)}
              onConfirm={() => run(otherCleaningToggleAction)}
            />
            {shift.onBreak && !shift.onOther && (
              <p className="-mt-1 text-xs font-semibold text-ink-muted">
                {m.endBreakFirst}
              </p>
            )}

            <SlideAction
              label={m.shiftEnd}
              variant="danger"
              disabled={pending || Boolean(cleaning)}
              onConfirm={() => run(shiftEndAction)}
            />
            {cleaning && (
              <p className="-mt-1 text-xs font-semibold text-ink-muted">
                {format(m.roomStillOpen, { number: cleaning.roomNumber })}
              </p>
            )}
            {shift.onOther && !cleaning && (
              <p className="-mt-1 text-xs font-semibold text-ink-muted">
                {m.otherEndsWithShift}
              </p>
            )}
          </>
        )}

        {pending && (
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> {m.saving}
          </p>
        )}
      </section>
    </div>
  )
}

function Tile({
  icon, label, value, hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-edge bg-surface px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">{icon} {label}</p>
      <p className="text-lg font-black text-ink">{value}</p>
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  )
}
