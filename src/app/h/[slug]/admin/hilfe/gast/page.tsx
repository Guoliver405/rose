import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Compass } from 'lucide-react'
import { getManagementContext } from '@/utils/auth'
import SimGast from '@/components/lotse/SimGast'

/**
 * Nachbau des Gäste-Portals — siehe
 * [reinigung/page.tsx](../reinigung/page.tsx) für die Begründung.
 * Zusätzlich hier: Das echte Portal verlangt einen laufenden Aufenthalt samt
 * PIN, es lässt sich also nicht einmal „mal eben ansehen".
 */
export default async function SimGastPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const ctx = await getManagementContext(slug)
  if (!ctx) redirect('/admin')

  const base = `/h/${ctx.hotelSlug}/admin`

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`${base}/hilfe`} className="flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Hilfe
        </Link>
        <h1 className="text-xl font-black text-ink">Was der Gast sieht</h1>
        <Link
          href={`${base}/hilfe/gast?lotse=gast&schritt=0`}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-action px-3 py-1.5 text-sm font-bold text-action-foreground hover:bg-action-strong"
        >
          <Compass className="h-4 w-4" /> Lotse starten
        </Link>
      </div>

      <p className="max-w-2xl text-sm text-ink-soft">
        Das Gäste-Portal, wie es auf dem Telefon Ihres Gastes aussieht. Ein Nachbau mit
        Beispielwerten — Haus, Zimmer und Services stammen nicht aus Ihren Daten, damit die
        Ansicht auch dann etwas zeigt, wenn noch nichts angelegt ist. Nichts davon wird
        gespeichert.
      </p>

      <SimGast />

      <p className="max-w-2xl text-xs text-ink-muted">
        Ihre eigenen Texte weichen an zwei Stellen ab: Welche Services erscheinen, legen Sie im
        Service-Baukasten fest, und ob &bdquo;Frühestens ab&ldquo; überhaupt angeboten wird — samt Grenze —
        steht unter Hotel &amp; Regeln.
      </p>
    </div>
  )
}
