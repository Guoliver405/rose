import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, TriangleAlert } from 'lucide-react'
import { getManagementContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { parseGuestAccessMode } from '@/lib/guest-access'
import RoomQrSheet, { type RoomQrData } from './RoomQrSheet'

/**
 * Zimmer-QR-Aushänge: eine Karte pro Zimmer (Print: eine pro Seite).
 * Der QR führt auf /guest/r/<token> — der Gast tippt dort nur noch die PIN.
 *
 * Erreichbar über Einstellungen → Gäste-Zugang (Inhaber/Manager) bzw. die
 * Hub-Kachel (Rezeption), jeweils nur im PIN-Verfahren. Die Route selbst
 * bleibt offen — ein Haus im Link-Verfahren bekommt hier statt einer Sperre
 * den Hinweis, warum die Aushänge gerade nichts nützen.
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
  const [{ data: rooms }, { data: tokens }, { data: hotel }] = await Promise.all([
    // Für Zimmer außer Betrieb wird kein Aushang gedruckt.
    supabase.from('rooms').select('id, number, floor, building').eq('hotel_id', ctx.hotelId).is('deactivated_at', null),
    supabase.from('room_guest_tokens').select('room_id, token').eq('hotel_id', ctx.hotelId),
    supabase.from('hotels').select('policies').eq('id', ctx.hotelId).single(),
  ])

  const accessMode = parseGuestAccessMode((hotel?.policies ?? {}) as Record<string, unknown>)
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

  const isAdmin = ctx.role !== 'reception'
  const backHref = isAdmin
    ? `/h/${ctx.hotelSlug}/admin/einstellungen/gastzugang`
    : `/h/${ctx.hotelSlug}/admin/einstellungen`

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={backHref}
        className="flex items-center gap-1.5 self-start text-sm font-semibold text-ink-soft hover:text-ink print:hidden"
      >
        <ArrowLeft className="h-4 w-4" /> {isAdmin ? 'Zurück zu Gäste-Zugang' : 'Zurück zu Einstellungen'}
      </Link>

      {accessMode === 'link' && (
        <p className="flex items-start gap-2 rounded-xl border border-attention-tint-edge bg-attention-tint px-4 py-3 text-sm font-semibold text-attention-deepest print:hidden">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Dieses Haus nutzt individuelle Zugänge je Aufenthalt. Die Aushänge führen auf eine
            PIN-Eingabe, die neue Gäste nicht bedienen können — sie gehören nicht ins Zimmer,
            solange dieses Verfahren gilt.
          </span>
        </p>
      )}

      <RoomQrSheet hotelSlug={ctx.hotelSlug} cards={cards} hotelName={ctx.hotelName} canRenew={isAdmin} />
    </div>
  )
}
