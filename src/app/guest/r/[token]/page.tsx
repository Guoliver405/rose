import { redirect } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/service'
import { getGuestContext } from '@/utils/guest'
import GuestLoginForm from '@/components/GuestLoginForm'
import { getMessages, GUEST_LOCALES } from '@/lib/i18n'
import LanguageSwitch from '@/components/LanguageSwitch'
import { getGuestLocale } from '@/utils/locale'
import { RoseLogo } from '@/components/brand/RoseLogo'

/**
 * QR-Deep-Link: der statische Zimmer-Token (klebt im Zimmer) bestimmt das
 * Zimmer, der Gast tippt nur noch die PIN. Der Token ist unguessbar —
 * ohne physischen Zutritt zum Zimmer ist diese Seite nicht auffindbar.
 *
 * Diese Route bleibt bewusst OHNE Mandanten-Präfix: der Token ist global
 * eindeutig und trägt den Mandanten selbst. Dadurch bleiben gedruckte
 * Zimmer-Aushänge über jeden Routing-Umbau hinweg gültig.
 */
export default async function GuestRoomEntryPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const admin = createAdminClient()
  const { data: tokenRow } = await admin
    .from('room_guest_tokens')
    .select('room_id')
    .eq('token', token)
    .maybeSingle()

  const { data: room } = tokenRow
    ? await admin
        .from('rooms')
        .select('number, hotels(slug, policies)')
        .eq('id', tokenRow.room_id)
        .single()
    : { data: null }

  // Schon angemeldet und es ist GENAU dieses Zimmer → direkt ins Portal.
  // Bei einem fremden Zimmer bleibt das Formular stehen; die dortige PIN
  // ersetzt dann die Sitzung.
  const ctx = await getGuestContext()
  if (ctx && tokenRow?.room_id === ctx.roomId) redirect(`/h/${ctx.hotelSlug}/guest/status`)

  const roomHotel = room?.hotels as unknown as { slug: string; policies: Record<string, unknown> | null } | null
  const locale = await getGuestLocale(roomHotel?.policies ?? null)
  const m = getMessages(locale).guest
  const hotelSlug = roomHotel?.slug ?? null

  return (
    <main lang={locale} className="flex flex-1 flex-col justify-center gap-8">
      <LanguageSwitch current={locale} offered={GUEST_LOCALES} />
      <div className="text-center">
        <h1 className="text-3xl font-black text-ink">
          <RoseLogo />
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{m.brand.signIn}</p>
      </div>

      {room ? (
        <GuestLoginForm
          roomToken={token}
          roomNumber={room.number}
          hotelSlug={hotelSlug ?? undefined}
          m={m.login}
        />
      ) : (
        <div className="rounded-xl border border-critical-pill-edge bg-critical-pill px-4 py-3 text-center">
          <p className="font-bold text-critical-deepest">{m.login.invalidLink}</p>
          <p className="mt-1 text-sm text-critical-deepest">
            {m.login.invalidLinkHint}
          </p>
        </div>
      )}
    </main>
  )
}
