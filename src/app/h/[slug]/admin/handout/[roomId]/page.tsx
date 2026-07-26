import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getManagementContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import GuestHandoutCard from './GuestHandoutCard'

/**
 * Druckbares Gast-Handout nach dem Check-in: Zimmernummer + PIN + QR.
 * QR bevorzugt den Zimmer-Deep-Link (nur PIN tippen); ohne Zimmer-Token
 * fällt er auf die Hotel-Adresse /h/<slug>/guest (Zimmernummer + PIN) zurück.
 */
export default async function HandoutPage({
  params,
}: {
  params: Promise<{ slug: string; roomId: string }>
}) {
  const { slug, roomId } = await params
  const ctx = await getManagementContext(slug)
  if (!ctx) redirect('/admin')
  const supabase = await createClient()

  const [{ data: room }, { data: stay }, { data: token }] = await Promise.all([
    supabase.from('rooms').select('id, number, building').eq('hotel_id', ctx.hotelId).eq('id', roomId).maybeSingle(),
    supabase
      .from('stays')
      .select('pin')
      .eq('hotel_id', ctx.hotelId)
      .eq('room_id', roomId)
      .is('checked_out_at', null)
      .maybeSingle(),
    supabase.from('room_guest_tokens').select('token').eq('hotel_id', ctx.hotelId).eq('room_id', roomId).maybeSingle(),
  ])

  if (!room) notFound()

  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  // Baseline-Adresse trägt den Mandanten: Zimmernummern sind nur je Hotel
  // eindeutig, `/guest` allein ist seit dem Mandanten-Umbau nur ein Hinweis.
  const manualUrl = `${origin}/h/${ctx.hotelSlug}/guest`
  const url = token ? `${origin}/guest/r/${token.token}` : manualUrl

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      <Link
        href="/admin"
        className="flex items-center gap-1.5 self-start text-sm font-semibold text-ink-soft hover:text-ink print:hidden"
      >
        <ArrowLeft className="h-4 w-4" /> Zurück zur Übersicht
      </Link>

      {!stay ? (
        <p className="rounded-xl border border-attention-tint-edge bg-attention-tint px-4 py-3 font-semibold text-attention-deepest">
          Zimmer {room.number} ist aktuell nicht belegt — erst einchecken, dann Handout drucken.
        </p>
      ) : (
        <GuestHandoutCard
          hotelName={ctx.hotelName}
          roomNumber={room.number}
          building={room.building}
          pin={stay.pin}
          url={url}
          manualUrl={manualUrl}
          deepLink={Boolean(token)}
        />
      )}
    </div>
  )
}
