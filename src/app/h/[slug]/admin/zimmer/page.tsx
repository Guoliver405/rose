import { redirect } from 'next/navigation'
import { getAdminContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import RoomSetup, { type SetupRoom } from './RoomSetup'

export default async function RoomSetupPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // Struktur (Zimmer anlegen/löschen) ist Sache der Verwaltung (Inhaber oder
  // Manager) — die Rezeption landet auf der Übersicht.
  const ctx = await getAdminContext(slug)
  if (!ctx) redirect(`/h/${slug}/admin`)

  const supabase = await createClient()

  const [{ data: rooms }, { data: stays }] = await Promise.all([
    // Deaktivierte Zimmer gehören hierher — nur hier lassen sie sich
    // zurückholen. Auf den Boards und im Aushang sind sie ausgeblendet.
    supabase
      .from('rooms')
      .select('id, number, floor, building, deactivated_at')
      .eq('hotel_id', ctx.hotelId)
      .order('number'),
    supabase.from('stays').select('room_id').eq('hotel_id', ctx.hotelId).is('checked_out_at', null),
  ])

  const occupiedRooms = new Set((stays ?? []).map(s => s.room_id))

  const setupRooms: SetupRoom[] = (rooms ?? []).map(r => ({
    id: r.id,
    number: r.number,
    floor: r.floor,
    building: r.building,
    occupied: occupiedRooms.has(r.id),
    deactivated: Boolean(r.deactivated_at),
  }))

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      {/* Die QR-Aushänge liegen unter Einstellungen → Gäste-Zugang: sie
          gehören zum Zugangsverfahren, nicht zur Zimmerstruktur. */}
      <h1 className="text-xl font-black text-ink">Zimmer verwalten</h1>
      <RoomSetup hotelSlug={ctx.hotelSlug} rooms={setupRooms} />
    </div>
  )
}
