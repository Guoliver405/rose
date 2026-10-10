'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Leaf, Moon, Sparkles } from 'lucide-react'
import { setGuestSignalAction, setSkipTodayAction } from '@/app/guest/actions'
import { format, type GuestMessages } from '@/lib/i18n'
import Rich from '@/components/i18n/Rich'

type Signal = 'none' | 'please_clean' | 'dnd'

export type DeferOption = { label: string; iso: string }

export default function GuestSignalPanel({
  signal,
  cleaningWindow,
  windowOpen,
  deferOptions,
  deferLimit,
  cleanNotBefore,
  offerSkip,
  skipToday,
  m,
}: {
  signal: Signal
  /** Reinigungs-Zeitfenster der Hotel-Policy — null, wenn die Regel aus ist. */
  cleaningWindow: { start: string; end: string } | null
  windowOpen: boolean
  /** Wählbare „frühestens ab"-Zeiten (volle Stunden bis zur Grenze des Hauses); leer, wenn keine mehr übrig oder aus. */
  deferOptions: DeferOption[]
  /** „11:00" — bis wann der Gast aufschieben darf; null, wenn das Haus es nicht anbietet. */
  deferLimit: string | null
  /** „11:00" — aktiver Wunsch gilt erst ab dieser Uhrzeit; null, wenn sofort. */
  cleanNotBefore: string | null
  /** „Heute keine Reinigung" anbieten — nur bei täglicher Routine des Hauses. */
  offerSkip: boolean
  /** Verzicht für heute ist gesetzt. */
  skipToday: boolean
  m: GuestMessages['signal']
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  // „jetzt" ist die Vorgabe — aufschieben ist die Ausnahme, nicht der Normalfall.
  const [defer, setDefer] = useState<string | null>(null)

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
      const target = signal === next ? 'none' : next
      const res = await setGuestSignalAction(target, target === 'please_clean' ? defer : null)
      if (res.error) setError(res.error)
      else setDefer(null)
      router.refresh()
    })
  }

  function toggleSkip() {
    setError(null)
    startTransition(async () => {
      const res = await setSkipTodayAction(!skipToday)
      if (res.error) setError(res.error)
      router.refresh()
    })
  }

  const chip = (active: boolean) =>
    `rounded-lg border px-3 py-1.5 text-sm font-bold transition-colors ${
      active
        ? 'border-attention bg-attention text-attention-foreground'
        : 'border-edge bg-surface-elevated text-ink-soft hover:border-edge-strong'
    }`

  return (
    <div className="flex flex-col gap-3">
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
          <span className="block text-lg font-bold">{m.clean.label}</span>
          <span className={`block text-sm ${signal === 'please_clean' ? '' : 'text-ink-muted'}`}>
            {signal === 'please_clean'
              ? cleanNotBefore
                ? format(m.clean.activeFrom, { time: cleanNotBefore })
                : m.clean.active
              : cleanBlocked
                ? m.clean.blocked
                : defer
                  ? format(m.clean.idleFrom, { time: deferOptions.find(o => o.iso === defer)?.label ?? '' })
                  : m.clean.idle}
          </span>
        </span>
      </button>

      {/* „Frühestens ab": eine Einschränkung, kein Termin. Nur sichtbar, solange
          kein Wunsch aktiv ist und das Haus es anbietet. */}
      {signal !== 'please_clean' && !cleanBlocked && deferLimit && (
        <div className="rounded-xl border border-edge bg-surface-sunken px-4 py-3">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
            <Clock className="h-4 w-4 text-ink-muted" /> {m.defer.title}
          </p>
          {deferOptions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              <button type="button" disabled={pending} className={chip(defer === null)} onClick={() => setDefer(null)}>
                {m.defer.now}
              </button>
              {deferOptions.map(o => (
                <button key={o.iso} type="button" disabled={pending} className={chip(defer === o.iso)} onClick={() => setDefer(o.iso)}>
                  {o.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-soft">{m.defer.onlyNow}</p>
          )}
          <p className="mt-2 text-xs text-ink-muted">
            <Rich text={m.defer.limit} vars={{ limit: deferLimit }} tags={{ b: c => <strong className="font-bold text-ink-soft">{c}</strong> }} />
          </p>
        </div>
      )}

      {cleanBlocked && cleaningWindow && (
        <p className="flex items-start gap-2 rounded-xl border border-edge bg-surface-sunken px-4 py-3 text-sm text-ink-soft">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-ink-muted" />
          <span>
            <Rich
              text={m.window}
              vars={{ start: cleaningWindow.start, end: cleaningWindow.end }}
              tags={{ b: c => <strong className="font-bold text-ink">{c}</strong> }}
            />
          </span>
        </p>
      )}

      {offerSkip && (
        <button
          type="button"
          disabled={pending}
          onClick={toggleSkip}
          className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left disabled:opacity-50 ${
            skipToday
              ? 'border-positive bg-positive text-positive-foreground'
              : 'border-edge bg-surface-elevated text-ink hover:border-edge-strong'
          }`}
        >
          <Leaf className="h-6 w-6 shrink-0" />
          <span>
            <span className="block text-lg font-bold">{m.skip.label}</span>
            <span className={`block text-sm ${skipToday ? '' : 'text-ink-muted'}`}>
              {skipToday ? m.skip.active : m.skip.idle}
            </span>
          </span>
        </button>
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
          <span className="block text-lg font-bold">{m.dnd.label}</span>
          <span className={`block text-sm ${signal === 'dnd' ? '' : 'text-ink-muted'}`}>
            {signal === 'dnd' ? m.dnd.active : m.dnd.idle}
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
