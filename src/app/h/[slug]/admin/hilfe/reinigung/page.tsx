import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Compass } from 'lucide-react'
import { getManagementContext } from '@/utils/auth'
import SimReinigung from '@/components/lotse/SimReinigung'

/**
 * Nachbau des Reinigungsboards.
 *
 * Eigene Seite unterhalb von „Hilfe", weil der Lotse dazu Anker braucht — und
 * die kann es nur dort geben, wo der Nachbau tatsächlich gerendert wird. Jede
 * Rolle darf her: Auch die Rezeption erklärt Kolleginnen das Board, und
 * gesehen hat sie es sonst nie.
 */
export default async function SimReinigungPage({
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
        <h1 className="text-xl font-black text-ink">Das Reinigungsboard</h1>
        <Link
          href={`${base}/hilfe/reinigung?lotse=reinigung&schritt=0`}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-action px-3 py-1.5 text-sm font-bold text-action-foreground hover:bg-action-strong"
        >
          <Compass className="h-4 w-4" /> Lotse starten
        </Link>
      </div>

      <p className="max-w-2xl text-sm text-ink-soft">
        So sieht das Board aus, das Ihre Reinigungskräfte am Handy bedienen. Es ist ein Nachbau
        mit Beispiel-Zimmern — hier wird nichts gespeichert und niemand benachrichtigt. Probieren
        Sie ruhig alles aus; der Lotse stellt zu jedem Schritt die passende Ansicht wieder her.
      </p>

      <SimReinigung />

      <p className="max-w-2xl text-xs text-ink-muted">
        Warum ein Nachbau und keine Führung durch das echte Board? Das Reinigungs-Portal hat
        eigene Anmeldung und eigene Sitzung — aus der Rezeption heraus ist es nicht erreichbar.
        Wer es wirklich sehen will, meldet sich unter{' '}
        <span className="font-mono text-ink-soft">/h/{ctx.hotelSlug}/service/login</span> mit einem
        Reinigungs-Zugang an.
      </p>
    </div>
  )
}
