import { ExternalLink, Star } from 'lucide-react'
import { reviewPlatform } from '@/lib/review'
import type { GuestMessages } from '@/lib/i18n'

/**
 * Knopf zur Bewertungsseite des Hauses — im Portal als ruhige Zeile
 * (`variant="line"`), auf der Danke-Seite als Knopf. Öffnet in einem neuen
 * Tab und bettet nichts ein (wie die Verweise im Service-Baukasten).
 */
export default function ReviewLink({ url, m, variant }: {
  url: string
  m: GuestMessages['review']
  variant: 'line' | 'button'
}) {
  const label = m.button[reviewPlatform(url)]
  if (variant === 'button') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-2xl bg-action px-5 py-4 text-lg font-bold text-action-foreground hover:bg-action-strong"
      >
        <Star className="h-5 w-5" /> {label} <ExternalLink className="h-4 w-4" />
      </a>
    )
  }
  return (
    <p className="text-center text-sm text-ink-muted">
      {m.hint}{' '}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-semibold text-ink-soft underline hover:text-ink"
      >
        {label} <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </p>
  )
}
