'use client'

import { usePathname } from 'next/navigation'
import { CircleHelp } from 'lucide-react'
import { istHilfeSeite, relativerPfad, themaFuerPfad, themaText } from '@/lib/hilfe'
import { format } from '@/lib/i18n/format'
import { useHelpMessages } from './HelpMessages'
import { schalteLeiste, useLeiste } from './leiste'
import { useUnreadTickets } from '@/components/tickets/unread'

/**
 * Das „?" in der Kopfzeile — klappt die Hilfe-Leiste (`HilfeLeiste`) ein und
 * aus. Auf dem Hub und den Themenseiten verschwindet es: Dort ist die Seite
 * selbst die Hilfe.
 *
 * Eine Client-Komponente, weil nur der Browser den Pfad kennt und das Layout
 * für alle Seiten dasselbe ist — so muss keine Seite es selbst setzen, und
 * das „?" sitzt immer am selben Ort. Welches Thema die Leiste zeigt,
 * entscheidet sie selbst aus dem Pfad; der Knopf nennt es nur im Tooltip.
 */
export default function HilfeKnopf() {
  const pathname = usePathname()
  const { offen } = useLeiste()
  const { help } = useHelpMessages()
  // Neue Antwort auf eine Meldung: ein Punkt am „?“ (die Leiste nennt die Zahl).
  const unread = useUnreadTickets(pathname)
  const rel = relativerPfad(pathname)
  if (!rel || istHilfeSeite(rel.pfad, rel.bereich)) return null

  const thema = themaFuerPfad(rel.pfad, rel.bereich)
  const titel = offen
    ? help.ui.button.close
    : thema ? format(help.ui.button.openTopic, { title: themaText(help.topics, thema).title }) : help.ui.button.open

  return (
    <button
      type="button"
      onClick={schalteLeiste}
      title={titel}
      aria-label={titel}
      aria-pressed={offen}
      data-lotse="kopf.hilfe"
      className={`relative flex h-9 w-9 items-center justify-center rounded-full border ${
        offen
          ? 'border-action bg-action text-action-foreground'
          : 'border-edge text-ink-soft hover:border-edge-strong hover:text-ink'
      }`}
    >
      <CircleHelp className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-surface bg-critical" aria-hidden="true" />
      )}
    </button>
  )
}
