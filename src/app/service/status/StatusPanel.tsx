'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Coffee, Loader2, Sparkles, Timer } from 'lucide-react'
import SlideAction from '@/components/SlideAction'
import { formatDuration } from '@/lib/worklog'
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

function clockLabel(iso: string | null): string {
  return iso ? new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : ''
}

export default function StatusPanel({
  displayName,
  shift,
  cleaning,
  today,
}: {
  displayName: string
  shift: StatusShift
  cleaning: { roomNumber: string; startedAt: string | null } | null
  today: TodayTotals
}) {
  const router = useRouter()
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
    ? { label: `Du reinigst Zimmer ${cleaning.roomNumber}`, since: cleaning.startedAt, tone: 'bg-positive-pill text-positive-deepest' }
    : shift.onBreak
      ? { label: 'Pause', since: shift.breakStartedAt, tone: 'bg-caution-pill text-caution-deepest' }
      : shift.onOther
        ? { label: 'Sonstige Reinigung läuft', since: shift.otherStartedAt, tone: 'bg-attention-pill text-attention-deepest' }
        : shift.onShift
          ? { label: 'Auf Schicht', since: shift.shiftStartedAt, tone: 'bg-positive-pill text-positive-deepest' }
          : { label: 'Nicht auf Schicht', since: null, tone: 'bg-surface-muted text-ink-soft' }

  return (
    <div className="mx-auto flex w-full max-w-[600px] flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Link
          href="/service"
          className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Board
        </Link>
        <h1 className="text-xl font-black text-ink">Mein Status</h1>
        <span className="ml-auto text-sm font-semibold text-ink-muted">{displayName}</span>
      </div>

      {/* Aktueller Zustand */}
      <section className="rounded-xl border border-edge bg-surface p-5 text-center">
        <span className={`inline-block rounded-full px-4 py-1.5 text-base font-black ${current.tone}`}>
          {current.label}
        </span>
        {current.since && (
          <p className="mt-2 text-sm text-ink-muted">seit {clockLabel(current.since)} Uhr</p>
        )}
        {shift.onShift && !cleaning && shift.shiftStartedAt && current.label !== 'Auf Schicht' && (
          <p className="text-xs text-ink-muted">Schicht seit {clockLabel(shift.shiftStartedAt)} Uhr</p>
        )}
      </section>

      {/* Tagesbilanz */}
      <section className="grid grid-cols-2 gap-2">
        <Tile icon={<Timer className="h-4 w-4" />} label="Arbeitszeit heute" value={formatDuration(today.workMs)} />
        <Tile icon={<Coffee className="h-4 w-4" />} label="Pause heute" value={formatDuration(today.breakMs)} />
        <Tile
          icon={<Sparkles className="h-4 w-4" />}
          label="Zimmer heute"
          value={`${today.cleaningCount}`}
          hint={today.cleaningMs > 0 ? formatDuration(today.cleaningMs) : undefined}
        />
        <Tile
          icon={<Sparkles className="h-4 w-4" />}
          label="Sonstige Reinigung"
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
        <h2 className="text-sm font-bold text-ink-soft">Status wechseln</h2>

        {!shift.onShift ? (
          <SlideAction
            label="Schicht beginnen"
            variant="success"
            disabled={pending}
            onConfirm={() => run(shiftStartAction)}
          />
        ) : (
          <>
            <SlideAction
              label={shift.onBreak ? 'Pause beenden' : 'Pause beginnen'}
              variant={shift.onBreak ? 'success' : 'warning'}
              disabled={pending}
              onConfirm={() => run(breakToggleAction)}
            />

            <SlideAction
              label={shift.onOther ? 'Sonstige Reinigung beenden' : 'Sonstige Reinigung starten'}
              variant={shift.onOther ? 'success' : 'neutral'}
              disabled={pending || (shift.onBreak && !shift.onOther)}
              onConfirm={() => run(otherCleaningToggleAction)}
            />
            {shift.onBreak && !shift.onOther && (
              <p className="-mt-1 text-xs font-semibold text-ink-muted">
                Erst die Pause beenden — Tätigkeiten dürfen sich nicht überschneiden.
              </p>
            )}

            <SlideAction
              label="Schicht beenden"
              variant="danger"
              disabled={pending || Boolean(cleaning)}
              onConfirm={() => run(shiftEndAction)}
            />
            {cleaning && (
              <p className="-mt-1 text-xs font-semibold text-ink-muted">
                Zimmer {cleaning.roomNumber} ist noch offen — erst im Board abschließen
                oder abbrechen.
              </p>
            )}
            {shift.onOther && !cleaning && (
              <p className="-mt-1 text-xs font-semibold text-ink-muted">
                Die laufende sonstige Reinigung wird beim Schichtende automatisch beendet.
              </p>
            )}
          </>
        )}

        {pending && (
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> wird gespeichert …
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
