import { Ban, CheckCircle2, Clock, Leaf, Loader2, Luggage, Sparkles } from 'lucide-react'
import type { GuestCleaningStatus } from '@/lib/board'
import { format, type GuestMessages } from '@/lib/i18n'
import { formatHHMM } from '@/lib/tz'

/**
 * Statuskarte über den Knöpfen: Woran ist der Gast mit der Reinigung?
 *
 * Die Karte zeigt nur, was `guestCleaningStatus` ableitet — sie rechnet
 * nichts selbst und trägt keinen Namen einer Reinigungskraft (das Gastportal
 * nennt nie Personen). Farben wie auf den Boards: Grün = läuft/erledigt,
 * Amber = vorgesehen, Rosé = Nicht stören, neutral = Uhrzeit oder nichts.
 */
export default function GuestCleaningStatusCard({
  status,
  routineTime,
  timeZone,
  m,
}: {
  status: GuestCleaningStatus
  /** Fälligkeit der Routine des Hauses („11:00"), null ohne Routine — für den Hinweis am Anreisetag. */
  routineTime: string | null
  /** Zeitzone des Hauses — Uhrzeiten gelten vor Ort. */
  timeZone: string
  m: GuestMessages['status']
}) {
  const box = (tone: 'positive' | 'attention' | 'blocked' | 'neutral') =>
    `flex items-start gap-3 rounded-2xl border px-4 py-3 ${
      tone === 'positive'
        ? 'border-positive-tint-edge bg-positive-tint text-positive-deepest'
        : tone === 'attention'
          ? 'border-attention-tint-edge bg-attention-tint text-attention-deepest'
          : tone === 'blocked'
            ? 'border-blocked-tint-edge bg-blocked-tint text-blocked-deepest'
            : 'border-edge bg-surface-sunken text-ink'
    }`
  const icon = 'mt-0.5 h-6 w-6 shrink-0'
  const title = 'block text-base font-bold'
  const sub = 'block text-sm opacity-90'

  switch (status.kind) {
    case 'in_progress':
      return (
        <div className={box('positive')} data-status="in_progress">
          <Loader2 className={`${icon} animate-spin`} />
          <span>
            <span className={title}>{m.inProgress.title}</span>
            <span className={sub}>{m.inProgress.text}</span>
          </span>
        </div>
      )
    case 'scheduled':
      return (
        <div className={box('attention')} data-status="scheduled">
          <Sparkles className={icon} />
          <span>
            <span className={title}>{m.scheduled.title}</span>
            <span className={sub}>{m.scheduled.text}</span>
          </span>
        </div>
      )
    case 'scheduled_from':
      return (
        <div className={box('neutral')} data-status="scheduled_from">
          <Clock className={`${icon} text-ink-muted`} />
          <span>
            <span className={title}>{format(m.scheduledFrom.title, { time: formatHHMM(status.at, timeZone) })}</span>
            <span className={`${sub} text-ink-soft`}>
              {/* Beim offenen Wunsch kann die Uhrzeit vom Gast oder von der Tür stammen — neutral bleiben. */}
              {status.reason === 'guest'
                ? m.scheduledFrom.guest
                : status.reason === 'door'
                  ? m.scheduledFrom.door
                  : m.scheduledFrom.daily}
            </span>
          </span>
        </div>
      )
    case 'dnd':
      return (
        <div className={box('blocked')} data-status="dnd">
          <Ban className={icon} />
          <span>
            <span className={title}>{m.dnd.title}</span>
            <span className={sub}>{m.dnd.text}</span>
          </span>
        </div>
      )
    case 'done':
      return (
        <div className={box('positive')} data-status="done">
          <CheckCircle2 className={icon} />
          <span>
            <span className={title}>{format(m.done.title, { time: formatHHMM(status.at, timeZone) })}</span>
            <span className={sub}>{m.done.text}</span>
          </span>
        </div>
      )
    case 'declined':
      return (
        <div className={box('neutral')} data-status="declined">
          <Leaf className={`${icon} text-ink-muted`} />
          <span>
            <span className={title}>{m.declined.title}</span>
            <span className={`${sub} text-ink-soft`}>{m.declined.text}</span>
          </span>
        </div>
      )
    case 'none':
      if (status.reason === 'departure') {
        return (
          <div className={box('neutral')} data-status="none">
            <Luggage className={`${icon} text-ink-muted`} />
            <span>
              <span className={title}>{m.departure.title}</span>
              <span className={`${sub} text-ink-soft`}>{m.departure.text}</span>
            </span>
          </div>
        )
      }
      return (
        <div className={box('neutral')} data-status="none">
          <Sparkles className={`${icon} text-ink-muted`} />
          <span>
            <span className={title}>{m.none.title}</span>
            <span className={`${sub} text-ink-soft`}>
              {status.reason === 'first_day' && routineTime
                ? format(m.none.firstDay, { time: routineTime })
                : m.none.onRequest}
            </span>
          </span>
        </div>
      )
  }
}
