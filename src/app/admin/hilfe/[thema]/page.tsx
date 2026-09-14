import { notFound, redirect } from 'next/navigation'
import { getAccountContext, listAccessibleHotels } from '@/utils/auth'
import HilfeThema from '@/components/hilfe/HilfeThema'
import { themaBereich, themaById } from '@/lib/hilfe'
import KontoShell from '../../KontoShell'

/**
 * Ein Hilfe-Thema des Konto-Bereichs (`haeuser`, `konto`) — außerhalb des
 * Haus-Layouts, deshalb im `KontoShell` wie die Häuser-Seite selbst.
 *
 * Es gibt hier keinen Hub; der Rückweg führt auf die Häuser-Seite. Ein
 * Inhaber-Thema (`konto`) bleibt Managern verschlossen — nicht weil der Text
 * geheim wäre, sondern damit die Hilfe nicht mehr zeigt, als die Person
 * bedienen kann.
 */
export default async function KontoHilfePage({
  params,
}: {
  params: Promise<{ thema: string }>
}) {
  const { thema: themaId } = await params
  const hotels = await listAccessibleHotels()
  if (hotels.length === 0) redirect('/login')

  const thema = themaById(themaId)
  if (!thema || themaBereich(thema) !== 'konto') notFound()

  const account = await getAccountContext()
  if (thema.zugang === 'inhaber' && !account) redirect('/admin')

  return (
    <KontoShell who={account?.displayName ?? hotels[0]?.name}>
      <HilfeThema
        thema={thema}
        // Konto-Themen brauchen keinen Slug; Verweise ins Haus gibt es dort nicht.
        slug={hotels[0]?.slug ?? ''}
        zurueck={{ href: '/admin', label: 'Häuser' }}
      />
    </KontoShell>
  )
}
