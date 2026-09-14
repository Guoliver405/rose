import { notFound, redirect } from 'next/navigation'
import { getManagementContext } from '@/utils/auth'
import HilfeThema from '@/components/hilfe/HilfeThema'
import { themaBereich, themaById } from '@/lib/hilfe'

/**
 * Ein Hilfe-Thema des Hauses — die Seite hinter dem „?" in der Kopfzeile.
 *
 * `reinigung` und `gast` erreichen diese Route nie: Ihre statischen Seiten
 * (die Simulationen) gewinnen gegen das dynamische Segment und tragen die
 * Blöcke selbst. Konto-Themen gehören unter `/admin/hilfe/…`; hier sind sie
 * ein 404, damit kein Verweis mit falscher Basis entsteht.
 *
 * Jede Rolle darf jedes Haus-Thema lesen — es ist Text. Was die Rezeption
 * nicht bedienen kann, sagt der Text; die Seiten selbst halten über ihre
 * Guards dicht.
 */
export default async function HilfeThemaPage({
  params,
}: {
  params: Promise<{ slug: string; thema: string }>
}) {
  const { slug, thema: themaId } = await params
  const ctx = await getManagementContext(slug)
  if (!ctx) redirect('/admin')

  const thema = themaById(themaId)
  if (!thema || themaBereich(thema) !== 'haus') notFound()

  return (
    <HilfeThema
      thema={thema}
      slug={ctx.hotelSlug}
      zurueck={{ href: `/h/${ctx.hotelSlug}/admin/hilfe`, label: 'Hilfe' }}
    />
  )
}
