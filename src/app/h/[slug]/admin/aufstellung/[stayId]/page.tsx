import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getManagementContext } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/service'
import { loadStayBill } from '@/utils/stay-bill'
import { parseTimeZone } from '@/lib/tz'
import BillSheet from './BillSheet'

/**
 * Druckbare Aufstellung der Zusatzleistungen eines Aufenthalts.
 *
 * Bewusst **keine Rechnung**: kein Gastname (den kennt RoSe nicht), keine
 * Rechnungsnummer, kein Steuerausweis, kein „bezahlt". Das Blatt sagt der
 * Rezeption und dem Gast, was während des Aufenthalts bestellt und erbracht
 * wurde; abgerechnet wird im System des Hauses.
 *
 * Läuft über den Aufenthalt, nicht über das Zimmer: Nach dem Check-out ist das
 * Zimmer frei und weiß von dem Aufenthalt nichts mehr — der Link aus dem
 * Verlauf trägt die `stayId`.
 */
export default async function AufstellungPage({
  params,
}: {
  params: Promise<{ slug: string; stayId: string }>
}) {
  const { slug, stayId } = await params
  const ctx = await getManagementContext(slug)
  if (!ctx) redirect('/admin')

  const admin = createAdminClient()
  const { data: stay } = await admin
    .from('stays')
    .select('id, hotel_id, room_id, checked_in_at, checked_out_at, rooms(number, building)')
    .eq('id', stayId)
    .maybeSingle()
  // Mandantengrenze von Hand: Der Admin-Client umgeht RLS, die ID kommt aus
  // der URL.
  if (!stay || stay.hotel_id !== ctx.hotelId) notFound()

  const room = Array.isArray(stay.rooms) ? stay.rooms[0] : stay.rooms
  const bill = await loadStayBill(admin, ctx.hotelId, stay.id)

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      <Link
        href={`/h/${ctx.hotelSlug}/admin`}
        className="flex items-center gap-1.5 self-start text-sm font-semibold text-ink-soft hover:text-ink print:hidden"
      >
        <ArrowLeft className="h-4 w-4" /> Zurück zur Übersicht
      </Link>

      <BillSheet
        hotelName={ctx.hotelName}
        roomNumber={room?.number ?? '?'}
        building={room?.building ?? null}
        checkedInAt={stay.checked_in_at}
        checkedOutAt={stay.checked_out_at}
        timeZone={parseTimeZone(ctx.policies)}
        bill={bill}
      />
    </div>
  )
}
