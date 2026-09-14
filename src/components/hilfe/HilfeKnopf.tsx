'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CircleHelp } from 'lucide-react'
import { hilfeHub, hilfeUrl, istHilfeSeite, relativerPfad, themaFuerPfad } from '@/lib/hilfe'

/**
 * Das „?" in der Kopfzeile — führt zur Hilfe der Seite, auf der man steht.
 *
 * Eine Client-Komponente, weil nur der Browser den aktuellen Pfad kennt, und
 * das Layout für alle Seiten dasselbe ist: So muss keine einzelne Seite
 * angefasst werden, und das „?" sitzt immer am selben Ort. Der Katalog
 * (`lib/hilfe.ts`) entscheidet, welches Thema zum Pfad gehört; passt keines,
 * geht es zum Hilfe-Hub des Hauses.
 *
 * Auf dem Hilfe-Bereich selbst verschwindet der Knopf — er zeigte auf sich
 * selbst. Im Konto-Bereich gibt es keinen Hub; ohne Thema bleibt der Knopf
 * dort weg.
 */
export default function HilfeKnopf({ slug }: { slug: string | null }) {
  const pathname = usePathname()
  const rel = relativerPfad(pathname)
  if (!rel || istHilfeSeite(rel.pfad)) return null

  const thema = themaFuerPfad(rel.pfad, rel.bereich)
  const slugFuerUrl = slug ?? rel.slug
  let href: string
  if (thema) href = hilfeUrl(thema, slugFuerUrl ?? '')
  else if (rel.bereich === 'haus' && slugFuerUrl) href = hilfeHub(slugFuerUrl)
  else return null

  return (
    <Link
      href={href}
      title={thema ? `Hilfe: ${thema.title}` : 'Hilfe'}
      aria-label={thema ? `Hilfe zu ${thema.title}` : 'Hilfe'}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-edge text-ink-soft hover:border-edge-strong hover:text-ink"
    >
      <CircleHelp className="h-5 w-5" />
    </Link>
  )
}
