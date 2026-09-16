import { Ban, CheckCircle2, Clock, Loader2, Luggage, Sparkles } from 'lucide-react'
import type { GuestCleaningStatus } from '@/lib/board'
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
}: {
  status: GuestCleaningStatus
  /** Fälligkeit der Routine des Hauses („11:00"), null ohne Routine — für den Hinweis am Anreisetag. */
  routineTime: string | null
  /** Zeitzone des Hauses — Uhrzeiten gelten vor Ort. */
  timeZone: string
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
            <span className={title}>Dein Zimmer wird gerade gereinigt.</span>
            <span className={sub}>Das Reinigungsteam ist im Zimmer.</span>
          </span>
        </div>
      )
    case 'scheduled':
      return (
        <div className={box('attention')} data-status="scheduled">
          <Sparkles className={icon} />
          <span>
            <span className={title}>Reinigung ist vorgesehen.</span>
            <span className={sub}>Das Reinigungsteam kommt heute vorbei.</span>
          </span>
        </div>
      )
    case 'scheduled_from':
      return (
        <div className={box('neutral')} data-status="scheduled_from">
          <Clock className={`${icon} text-ink-muted`} />
          <span>
            <span className={title}>Reinigung heute ab {formatHHMM(status.at, timeZone)} Uhr.</span>
            <span className={`${sub} text-ink-soft`}>
              {status.reason === 'guest'
                ? 'Wie von dir gewünscht — vorher kommt niemand.'
                : 'Das Haus reinigt täglich. Wenn du das heute nicht möchtest, tippe auf „Bitte nicht stören".'}
            </span>
          </span>
        </div>
      )
    case 'dnd':
      return (
        <div className={box('blocked')} data-status="dnd">
          <Ban className={icon} />
          <span>
            <span className={title}>Keine Reinigung — du möchtest nicht gestört werden.</span>
            <span className={sub}>Nimm „Bitte nicht stören&quot; zurück, wenn dein Zimmer doch gereinigt werden soll.</span>
          </span>
        </div>
      )
    case 'done':
      return (
        <div className={box('positive')} data-status="done">
          <CheckCircle2 className={icon} />
          <span>
            <span className={title}>Dein Zimmer wurde heute um {formatHHMM(status.at, timeZone)} Uhr gereinigt.</span>
            <span className={sub}>Brauchst du noch etwas? Dann tippe auf „Zimmer reinigen&quot;.</span>
          </span>
        </div>
      )
    case 'none':
      if (status.reason === 'departure') {
        return (
          <div className={box('neutral')} data-status="none">
            <Luggage className={`${icon} text-ink-muted`} />
            <span>
              <span className={title}>Heute ist dein Abreisetag.</span>
              <span className={`${sub} text-ink-soft`}>Das Zimmer wird nach dem Check-out gereinigt. Brauchst du vorher etwas, tippe auf „Zimmer reinigen&quot;.</span>
            </span>
          </div>
        )
      }
      return (
        <div className={box('neutral')} data-status="none">
          <Sparkles className={`${icon} text-ink-muted`} />
          <span>
            <span className={title}>Heute ist keine Reinigung vorgesehen.</span>
            <span className={`${sub} text-ink-soft`}>
              {status.reason === 'first_day' && routineTime
                ? `Ab morgen reinigt das Haus täglich ab ${routineTime} Uhr. Wenn du heute etwas brauchst, tippe auf „Zimmer reinigen".`
                : 'Dieses Haus reinigt auf Wunsch — tippe auf „Zimmer reinigen", wenn du es möchtest.'}
            </span>
          </span>
        </div>
      )
  }
}
