'use client'

import { usePathname } from 'next/navigation'
import { CircleHelp } from 'lucide-react'
import { istHilfeSeite, relativerPfad, themaFuerPfad, themaText } from '@/lib/hilfe'
import { format } from '@/lib/i18n/format'
import { useHelpMessages } from './HelpMessages'
import { schalteLeiste, useLeiste } from './leiste'

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
      className={`flex h-9 w-9 items-center justify-center rounded-full border ${
        offen
          ? 'border-action bg-action text-action-foreground'
          : 'border-edge text-ink-soft hover:border-edge-strong hover:text-ink'
      }`}
    >
      <CircleHelp className="h-5 w-5" />
    </button>
  )
}
