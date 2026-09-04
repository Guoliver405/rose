import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getManagementContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { roomAccessUrl, stayAccessUrl, type GuestAccessMode } from '@/lib/guest-access'
import { mailReady } from '@/utils/mail'
import { buildGuestGuide } from '@/lib/guest-guide'
import GuestHandoutCard from './GuestHandoutCard'

/**
 * Druckbares Gast-Handout nach dem Check-in — der Zettel, den der Gast
 * bekommt. Was darauf steht, hängt am **Aufenthalt**, nicht an der aktuellen
 * Hotel-Einstellung:
 *
 * - `pin`  … Zimmer-QR (nur PIN tippen) + die PIN. Ohne Zimmer-Token fällt der
 *            QR auf die Hotel-Adresse zurück (Zimmernummer + PIN).
 * - `link` … Individueller QR ohne PIN, gültig bis zum Check-out.
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
      .select('pin, guest_token, access_mode')
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
  const accessMode: GuestAccessMode = stay?.access_mode === 'link' ? 'link' : 'pin'

  const url =
    accessMode === 'link' && stay?.guest_token
      ? stayAccessUrl(origin, stay.guest_token)
      : token
        ? roomAccessUrl(origin, token.token)
        : manualUrl
  const deepLink = accessMode === 'link' || Boolean(token)

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      <Link
        href={`/h/${ctx.hotelSlug}/admin`}
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
          hotelSlug={ctx.hotelSlug}
          roomId={room.id}
          hotelName={ctx.hotelName}
          roomNumber={room.number}
          building={room.building}
          accessMode={accessMode}
          pin={stay.pin ?? null}
          url={url}
          manualUrl={manualUrl}
          deepLink={deepLink}
          mailReady={mailReady()}
          guide={buildGuestGuide(ctx.policies, { accessMode, deepLink })}
        />
      )}
    </div>
  )
}
