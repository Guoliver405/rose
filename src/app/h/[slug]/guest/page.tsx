import { redirect } from 'next/navigation'
import { requireHotelBySlug } from '@/utils/hotel'
import { getGuestContext } from '@/utils/guest'
import GuestLoginForm from '@/components/GuestLoginForm'

/**
 * Baseline-Einstieg des Gastes: Hotel-URL + Zimmernummer + PIN.
 *
 * Der Slug im Pfad ist der Mandant — ohne ihn wäre „Zimmer 101" über hunderte
 * Häuser hinweg mehrdeutig. Unbekannter Slug ⇒ 404 (kein Hotel-Verzeichnis).
 */
export default async function GuestEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const hotel = await requireHotelBySlug(slug)

  // Nur weiterleiten, wenn die bestehende Sitzung zu DIESEM Haus gehört.
  // Wer mit der Sitzung von Hotel A die Anmeldung von Hotel B öffnet, soll
  // sich dort anmelden können (der Login ersetzt dann das Cookie).
  const ctx = await getGuestContext()
  if (ctx?.hotelId === hotel.id) redirect(`/h/${hotel.slug}/guest/status`)

  return (
    <main className="flex flex-1 flex-col justify-center gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-black text-ink">
          Ro<span className="text-blocked">Se</span>
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Zimmerservice — Anmeldung</p>
        <p className="mt-3 font-semibold text-ink-soft">{hotel.name}</p>
      </div>
      <GuestLoginForm hotelSlug={hotel.slug} />
    </main>
  )
}
