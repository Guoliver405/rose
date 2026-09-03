import { redirect } from 'next/navigation'
import { requireHotelBySlug } from '@/utils/hotel'
import { getGuestContext } from '@/utils/guest'
import GuestLoginForm from '@/components/GuestLoginForm'
import { parseGuestAccessMode } from '@/lib/guest-access'

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
      {/* Arbeitet das Haus mit persönlichen Zugängen, führt dieses Formular
          für die meisten Gäste ins Leere — sie haben nie eine PIN bekommen.
          Es bleibt trotzdem stehen: Aufenthalte, die vor der Umstellung
          begonnen haben, brauchen es weiterhin. */}
      {parseGuestAccessMode((hotel.policies ?? {}) as Record<string, unknown>) === 'link' && (
        <p className="rounded-xl border border-attention-tint-edge bg-attention-tint px-4 py-3 text-sm font-semibold text-attention-deepest">
          Dieses Haus arbeitet mit persönlichen Zugängen: Bitte scannen Sie den QR-Code
          von Ihrem Check-in-Beleg oder öffnen Sie den Link aus Ihrer E-Mail. Das Formular
          unten gilt nur, wenn Sie beim Check-in eine PIN erhalten haben.
        </p>
      )}

      <GuestLoginForm hotelSlug={hotel.slug} />
    </main>
  )
}
