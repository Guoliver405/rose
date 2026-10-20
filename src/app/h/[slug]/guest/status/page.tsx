import { redirect } from 'next/navigation'
import { getEndedStay, getGuestContext } from '@/utils/guest'
import { requireHotelBySlug } from '@/utils/hotel'
import { createAdminClient } from '@/utils/supabase/service'
import {
  clampStaleMinutes, cleanDeferOptions, guestCleaningStatus, isWithinCleaningWindow, parseCleanDefer,
  parseCleaningWindow, parseStayoverPolicy, routineTomorrow, todayStartIso, isDeclinedToday,
} from '@/lib/board'
import { formatHHMM, parseTimeZone } from '@/lib/tz'
import { guestLogoutAction } from '@/app/guest/actions'
import { format, getMessages, GUEST_LOCALES, intlLocale } from '@/lib/i18n'
import LanguageSwitch from '@/components/LanguageSwitch'
import { getGuestLocale } from '@/utils/locale'
import GuestSignalPanel from './GuestSignalPanel'
import GuestCleaningStatusCard from './GuestCleaningStatusCard'
import ReviewLink from '@/components/ReviewLink'
import { parseReviewUrl, showReviewHint } from '@/lib/review'
import { parseCurrency } from '@/lib/money'
import { localizeItem, localizeService, parseItemTranslations, parseServiceTranslations, serviceLang } from '@/lib/service-i18n'
import GuestServicesPanel, { type GuestLink, type GuestOrder, type GuestService } from './GuestServicesPanel'

export default async function GuestStatusPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Die Sitzung muss zu DIESEM Haus gehören: alle Mandanten teilen sich den
  // Origin, das Gast-Cookie gilt also auch unter fremden Slugs. Ohne diesen
  // Abgleich sähe ein Gast unter /h/fremdes-hotel/guest/status sein eigenes
  // Zimmer unter falschem Hotelnamen. Haus und Sitzung sind unabhängig → parallel.
  const [hotel, ctx] = await Promise.all([requireHotelBySlug(slug), getGuestContext()])
  if (!ctx || ctx.hotelId !== hotel.id) {
    // Nach dem Check-out zeigt das Cookie auf den beendeten Aufenthalt —
    // dann Danke-Seite statt einer Anmeldung, die nicht mehr greift.
    const ended = ctx ? null : await getEndedStay()
    redirect(ended?.hotelId === hotel.id ? `/h/${hotel.slug}/guest/danke` : `/h/${hotel.slug}/guest`)
  }
  const locale = await getGuestLocale(hotel.policies)
  const m = getMessages(locale).guest

  const cleaningWindow = parseCleaningWindow(ctx.policies)
  const tz = parseTimeZone(ctx.policies)
  const now = new Date()
  const defer = parseCleanDefer(ctx.policies)
  const hhmm = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

  // Baukasten + eigene Bestellungen (Gast ist anonym → Admin-Client).
  const admin = createAdminClient()
  // Letzter Reinigungsabschluss dieses Zimmers seit Check-in und Ortstag —
  // die Statuskarte fragt „heute erledigt?", und ein clean_done von gestern
  // Abend gehört zum Vorgänger-Check-out. Die Untergrenze ist das Spätere
  // aus beidem, damit die Abfrage höchstens einen Tag zurückschaut.
  const todayStart = todayStartIso(now, tz)
  const checkedIn = new Date(ctx.checkedInAt)
  const doneSince = checkedIn > new Date(todayStart) ? checkedIn.toISOString() : todayStart
  const [{ data: services }, { data: items }, { data: orders }, { data: lastDone }] = await Promise.all([
    admin
      .from('service_definitions')
      .select('id, name, description, archived_at, link_url, maintenance, lang, translations')
      .eq('hotel_id', ctx.hotelId)
      .order('name'),
    admin
      .from('service_items')
      .select('id, service_id, label, price_cents, translations')
      .eq('hotel_id', ctx.hotelId)
      .is('archived_at', null)
      .order('label'),
    admin
      .from('service_orders')
      .select('id, service_id, items_snapshot, status, created_at')
      .eq('stay_id', ctx.stayId)
      .order('created_at', { ascending: false })
      .limit(20),
    admin
      .from('staff_log')
      .select('at')
      .eq('room_id', ctx.roomId)
      .eq('kind', 'clean_done')
      .gte('at', doneSince)
      .order('at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const stayover = parseStayoverPolicy(ctx.policies)
  const status = guestCleaningStatus({
    state: {
      guest_signal: ctx.guestSignal, priority: ctx.priority, clean_not_before: ctx.cleanNotBefore,
      clean_declined_on: ctx.cleanDeclinedOn,
      cleaning_by: ctx.cleaningActive ? 'x' : null, cleaning_started_at: ctx.cleaningStartedAt,
    },
    staleMinutes: clampStaleMinutes(ctx.policies.cleaningStaleMinutes),
    policy: stayover,
    checkedInAt: ctx.checkedInAt,
    expectedCheckout: ctx.expectedCheckout,
    lastCleanDoneAt: lastDone?.at ?? null,
    now,
    timeZone: tz,
  })
  // Für den Hinweis am Anreisetag: was gilt MORGEN für diesen Aufenthalt?
  const tomorrow = routineTomorrow(stayover, ctx.expectedCheckout, now, tz)

  // Services in der Sprache des Gastes (17.10.2026): je Feld die Übersetzung
  // des Hauses, sonst der Grundtext — nie ein leeres Feld.
  const langOf = new Map((services ?? []).map(s => [s.id, serviceLang(s.lang)]))
  const text = new Map((services ?? []).map(s => [s.id, localizeService({
    name: s.name, description: s.description, lang: serviceLang(s.lang),
    translations: parseServiceTranslations(s.translations),
  }, locale)]))
  const itemLabel = new Map((items ?? []).map(i => [i.id, localizeItem(
    { label: i.label, translations: parseItemTranslations(i.translations) },
    langOf.get(i.service_id) ?? 'de', locale,
  )]))

  const itemsByService = new Map<string, GuestService['items']>()
  for (const item of items ?? []) {
    if (!itemsByService.has(item.service_id)) itemsByService.set(item.service_id, [])
    itemsByService.get(item.service_id)!.push({
      id: item.id,
      label: itemLabel.get(item.id) ?? item.label,
      priceCents: item.price_cents,
    })
  }

  // Bestellbar sind nur aktive Services; die Namens-Map bleibt ungefiltert,
  // damit alte Bestellungen auf archivierte Services lesbar bleiben.
  const active = (services ?? []).filter(s => !s.archived_at)
  const guestServices: GuestService[] = active
    .filter(s => !s.link_url)
    .map(s => ({
      id: s.id,
      name: text.get(s.id)?.name ?? s.name,
      description: text.get(s.id)?.description ?? s.description,
      maintenance: Boolean(s.maintenance),
      items: itemsByService.get(s.id) ?? [],
    }))
  // Verweise: Kacheln, die nach außen öffnen (Trinkgeld-App, Lieferdienst) —
  // keine Bestellung, deshalb eigener Abschnitt unter den Services.
  const guestLinks: GuestLink[] = active
    .filter(s => Boolean(s.link_url))
    .map(s => ({
      id: s.id, name: text.get(s.id)?.name ?? s.name,
      description: text.get(s.id)?.description ?? s.description, url: s.link_url as string,
    }))

  // Eigene Anfragen: Name und Optionen in der Sprache des Gastes, soweit die
  // Option noch existiert (`item_id` im Snapshot seit 17.10.2026); sonst der
  // eingefrorene Grundtext.
  const guestOrders: GuestOrder[] = (orders ?? []).map(o => ({
    id: o.id,
    serviceName: text.get(o.service_id)?.name ?? m.services.fallbackName,
    itemLabels: ((o.items_snapshot ?? []) as { label: string; item_id?: string }[])
      .map(i => (i.item_id && itemLabel.get(i.item_id)) || i.label),
    status: o.status as GuestOrder['status'],
    createdAt: o.created_at,
  }))

  // Bitte um eine Bewertung ab dem zweiten Tag, ruhig ganz unten.
  const reviewUrl = parseReviewUrl(ctx.policies)
  const showReview = reviewUrl !== null && showReviewHint(ctx.checkedInAt, now, tz)

  return (
    <main lang={locale} className="flex flex-1 flex-col gap-6 py-4">
      <LanguageSwitch current={locale} offered={GUEST_LOCALES} />
      <header className="text-center">
        <p className="text-sm text-ink-muted">{ctx.hotelName ?? m.brand.portal}</p>
        <h1 className="text-2xl font-black text-ink">{format(m.status.room, { number: ctx.roomNumber })}</h1>
      </header>

      <GuestCleaningStatusCard
        status={status}
        routineTime={tomorrow.kind === 'time' ? hhmm(tomorrow.hour, tomorrow.minute) : null}
        departureTomorrow={tomorrow.kind === 'departure'}
        timeZone={tz}
        m={m.status}
      />

      <GuestSignalPanel
        signal={ctx.guestSignal}
        cleaningWindow={cleaningWindow.enabled ? cleaningWindow : null}
        windowOpen={isWithinCleaningWindow(cleaningWindow, now, tz)}
        deferOptions={cleanDeferOptions(defer, now, tz)}
        deferLimit={defer.enabled ? hhmm(defer.hour, defer.minute) : null}
        cleanNotBefore={
          ctx.guestSignal === 'please_clean' && ctx.cleanNotBefore && new Date(ctx.cleanNotBefore) > now
            ? formatHHMM(new Date(ctx.cleanNotBefore), tz)
            : null
        }
        // „Heute keine Reinigung" nur, wo es etwas abzuwählen gibt: bei
        // täglicher Routine. Reinigt das Haus auf Wunsch, ist Nicht-Anfordern
        // bereits der Verzicht.
        offerSkip={stayover.enabled}
        skipToday={isDeclinedToday(ctx.cleanDeclinedOn, now, tz)}
        m={m.signal}
      />

      <GuestServicesPanel
        services={guestServices}
        links={guestLinks}
        orders={guestOrders}
        m={m.services}
        intlLocale={intlLocale(locale)}
        currency={parseCurrency(ctx.policies)}
      />

      <div className="mt-auto flex flex-col gap-4 pt-6 text-center">
        {showReview && <ReviewLink url={reviewUrl} m={m.review} variant="line" />}
        <form action={guestLogoutAction}>
          <button
            type="submit"
            className="text-sm font-semibold text-ink-muted underline hover:text-ink"
          >
            {m.status.signOut}
          </button>
        </form>
      </div>
    </main>
  )
}
