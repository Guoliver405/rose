import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getManagementContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import RoomQrSheet, { type RoomQrData } from './RoomQrSheet'

/**
 * Zimmer-QR-Aushänge: eine Karte pro Zimmer (Print: eine pro Seite).
 * Der QR führt auf /guest/r/<token> — der Gast tippt dort nur noch die PIN.
 */
export default async function AushangPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const ctx = await getManagementContext(slug)
  if (!ctx) redirect('/login')

  const supabase = await createClient()
  const [{ data: rooms }, { data: tokens }] = await Promise.all([
    supabase.from('rooms').select('id, number, floor, building').eq('hotel_id', ctx.hotelId),
    supabase.from('room_guest_tokens').select('room_id, token').eq('hotel_id', ctx.hotelId),
  ])

  const tokenByRoom = new Map((tokens ?? []).map(t => [t.room_id, t.token]))
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

  const cards: RoomQrData[] = (rooms ?? [])
    .map(r => ({
      roomId: r.id,
      number: r.number,
      floor: r.floor,
      building: r.building,
      url: tokenByRoom.has(r.id) ? `${origin}/guest/r/${tokenByRoom.get(r.id)}` : null,
    }))
    .sort((a, b) => a.number.localeCompare(b.number, 'de', { numeric: true }))

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={ctx.role !== 'reception' ? `/h/${ctx.hotelSlug}/admin/zimmer` : `/h/${ctx.hotelSlug}/admin`}
        className="flex items-center gap-1.5 self-start text-sm font-semibold text-ink-soft hover:text-ink print:hidden"
      >
        <ArrowLeft className="h-4 w-4" /> {ctx.role !== 'reception' ? 'Zurück zu Zimmer' : 'Zurück zur Übersicht'}
      </Link>

      <RoomQrSheet hotelSlug={ctx.hotelSlug} cards={cards} hotelName={ctx.hotelName} canRenew={ctx.role !== 'reception'} />
    </div>
  )
}
