import { redirect } from 'next/navigation'
import { Heart } from 'lucide-react'
import { requireHotelBySlug } from '@/utils/hotel'
import { getEndedStay, getGuestContext } from '@/utils/guest'
import { guestSignInAgainAction } from '@/app/guest/actions'
import ReviewLink from '@/components/ReviewLink'
import { getMessages } from '@/lib/i18n'
import { getLocale } from '@/utils/locale'

/**
 * Danke-Seite nach dem Check-out (17.10.2026). Wer nach der Abreise ins
 * Portal schaut, landete vorher auf einer PIN-Eingabe, die er nicht mehr
 * bedienen kann. Jetzt: Dank, der Bewertungslink des Hauses (falls
 * eingetragen) und ein Weg zur neuen Anmeldung. Nichts vom Aufenthalt selbst.
 *
 * Wie jede Portalseite gleicht sie das Haus des Cookies gegen den Slug ab.
 */
export default async function GuestThanksPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [hotel, ctx, ended, locale] = await Promise.all([
    requireHotelBySlug(slug), getGuestContext(), getEndedStay(), getLocale(),
  ])
  if (ctx?.hotelId === hotel.id) redirect(`/h/${hotel.slug}/guest/status`)
  if (!ended || ended.hotelId !== hotel.id) redirect(`/h/${hotel.slug}/guest`)
  const m = getMessages(locale).guest

  return (
    <main className="flex flex-1 flex-col justify-center gap-8">
      <div className="text-center">
        <p className="text-sm text-ink-muted">{hotel.name}</p>
        <Heart className="mx-auto mt-4 h-10 w-10 text-blocked" />
        <h1 className="mt-3 text-2xl font-black text-ink">{m.thanks.title}</h1>
        <p className="mt-2 text-sm text-ink-muted">{m.thanks.text}</p>
      </div>

      {ended.reviewUrl && (
        <div className="space-y-3">
          <p className="text-center text-ink-soft">{m.thanks.review}</p>
          <ReviewLink url={ended.reviewUrl} m={m.review} variant="button" />
        </div>
      )}

      <form action={guestSignInAgainAction.bind(null, hotel.slug)} className="text-center">
        <button type="submit" className="text-sm font-semibold text-ink-muted underline hover:text-ink">
          {m.thanks.signInAgain}
        </button>
      </form>
    </main>
  )
}
