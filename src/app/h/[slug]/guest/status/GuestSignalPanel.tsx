'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Moon, Sparkles, CheckCircle2 } from 'lucide-react'
import { setGuestSignalAction } from '@/app/guest/actions'

type Signal = 'none' | 'please_clean' | 'dnd'

export default function GuestSignalPanel({
  signal,
  cleaningActive,
  cleaningWindow,
  windowOpen,
}: {
  signal: Signal
  cleaningActive: boolean
  /** Reinigungs-Zeitfenster der Hotel-Policy — null, wenn die Regel aus ist. */
  cleaningWindow: { start: string; end: string } | null
  windowOpen: boolean
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Leichtes Polling statt Realtime: Gäste sind anonym (kein Auth-Token für
  // RLS-gefilterte Realtime-Events). 15 s reichen für den Status-Abgleich.
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    pollRef.current = setInterval(() => router.refresh(), 15000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [router])

  // Außerhalb des Zeitfensters ist nur das ANFORDERN gesperrt — einen bereits
  // aktiven Wunsch darf der Gast jederzeit zurücknehmen.
  const cleanBlocked = Boolean(cleaningWindow) && !windowOpen && signal !== 'please_clean'

  function choose(next: Signal) {
    setError(null)
    startTransition(async () => {
      // Tap auf die aktive Option nimmt den Wunsch zurück (Toggle).
      const res = await setGuestSignalAction(signal === next ? 'none' : next)
      if (res.error) setError(res.error)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {cleaningActive && (
        <p className="flex items-center gap-2 rounded-xl border border-positive-pill-edge bg-positive-pill px-4 py-3 text-sm font-bold text-positive-deepest">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          Dein Zimmer wird gerade gereinigt.
        </p>
      )}

      <button
        type="button"
        disabled={pending || cleanBlocked}
        onClick={() => choose('please_clean')}
        className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left disabled:opacity-50 ${
          signal === 'please_clean'
            ? 'border-attention bg-attention text-attention-foreground'
            : 'border-edge bg-surface-elevated text-ink hover:border-edge-strong'
        } ${cleanBlocked ? 'cursor-not-allowed' : ''}`}
      >
        <Sparkles className="h-6 w-6 shrink-0" />
        <span>
          <span className="block text-lg font-bold">Zimmer reinigen</span>
          <span className={`block text-sm ${signal === 'please_clean' ? '' : 'text-ink-muted'}`}>
            {signal === 'please_clean'
              ? 'Wunsch ist aktiv — erneut tippen zum Zurücknehmen'
              : cleanBlocked
                ? 'Zurzeit nicht möglich'
                : 'Der Reinigungsdienst wird informiert'}
          </span>
        </span>
      </button>

      {cleanBlocked && cleaningWindow && (
        <p className="flex items-start gap-2 rounded-xl border border-edge bg-surface-sunken px-4 py-3 text-sm text-ink-soft">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-ink-muted" />
          <span>
            Reinigungswünsche nehmen wir täglich zwischen{' '}
            <strong className="font-bold text-ink">{cleaningWindow.start}</strong> und{' '}
            <strong className="font-bold text-ink">{cleaningWindow.end}</strong> Uhr entgegen.
            Bitte melde dich in diesem Zeitraum noch einmal — oder wende dich an die Rezeption.
          </span>
        </p>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={() => choose('dnd')}
        className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left disabled:opacity-50 ${
          signal === 'dnd'
            ? 'border-blocked bg-blocked text-blocked-foreground'
            : 'border-edge bg-surface-elevated text-ink hover:border-edge-strong'
        }`}
      >
        <Moon className="h-6 w-6 shrink-0" />
        <span>
          <span className="block text-lg font-bold">Bitte nicht stören</span>
          <span className={`block text-sm ${signal === 'dnd' ? '' : 'text-ink-muted'}`}>
            {signal === 'dnd'
              ? 'Aktiv — erneut tippen zum Zurücknehmen'
              : 'Niemand klopft, keine Reinigung'}
          </span>
        </span>
      </button>

      {error && (
        <p className="rounded-xl border border-critical-pill-edge bg-critical-pill px-4 py-3 text-sm font-semibold text-critical-deepest">
          {error}
        </p>
      )}
    </div>
  )
}
