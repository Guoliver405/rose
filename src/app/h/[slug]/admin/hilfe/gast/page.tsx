import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Compass } from 'lucide-react'
import { getManagementContext } from '@/utils/auth'
import { getLocale } from '@/utils/locale'
import { getMessages, intlLocale } from '@/lib/i18n'
import SimGast from '@/components/lotse/SimGast'

/**
 * Nachbau des Gäste-Portals — siehe
 * [reinigung/page.tsx](../reinigung/page.tsx) für die Begründung.
 * Zusätzlich hier: Das echte Portal verlangt einen laufenden Aufenthalt samt
 * PIN, es lässt sich also nicht einmal „mal eben ansehen".
 * Texte wie dort: Rahmen aus `help.sim`, Knöpfe und Statuszeilen aus `guest`.
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
  const locale = await getLocale()
  const msg = getMessages(locale)
  const m = msg.help.sim
  const { brand, login, status, signal, services } = msg.guest

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`${base}/hilfe`} className="flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> {msg.help.ui.topic.backHub}
        </Link>
        <h1 className="text-xl font-black text-ink">{m.gast.page.title}</h1>
        <Link
          href={`${base}/hilfe/gast?lotse=gast&schritt=0`}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-action px-3 py-1.5 text-sm font-bold text-action-foreground hover:bg-action-strong"
        >
          <Compass className="h-4 w-4" /> {msg.help.ui.topic.startLotse}
        </Link>
      </div>

      <p className="max-w-2xl text-sm text-ink-soft">{m.gast.page.intro}</p>

      <SimGast m={m} guest={{ brand, login, status, signal, services }} intlLocale={intlLocale(locale)} />

      <p className="max-w-2xl text-xs text-ink-muted">{m.gast.page.differs}</p>

      {/* Erklärung in der Hilfe-Leiste — siehe reinigung/page.tsx. */}
    </div>
  )
}
