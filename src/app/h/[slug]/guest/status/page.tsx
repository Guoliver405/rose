import { redirect } from 'next/navigation'
import { getGuestContext } from '@/utils/guest'
import { requireHotelBySlug } from '@/utils/hotel'
import { createAdminClient } from '@/utils/supabase/service'
import {
  clampStaleMinutes, cleanDeferOptions, guestCleaningStatus, isWithinCleaningWindow, parseCleanDefer,
  parseCleaningWindow, parseStayoverPolicy, stayoverDueTime, todayStartIso,
} from '@/lib/board'
import { formatHHMM, parseTimeZone } from '@/lib/tz'
import { guestLogoutAction } from '@/app/guest/actions'
import GuestSignalPanel from './GuestSignalPanel'
import GuestCleaningStatusCard from './GuestCleaningStatusCard'
import GuestServicesPanel, { type GuestOrder, type GuestService } from './GuestServicesPanel'

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
  if (!ctx || ctx.hotelId !== hotel.id) redirect(`/h/${hotel.slug}/guest`)

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
      .select('id, name, description, archived_at')
      .eq('hotel_id', ctx.hotelId)
      .order('name'),
    admin
      .from('service_items')
      .select('id, service_id, label, price_cents')
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
  const due = stayoverDueTime(stayover)

  const itemsByService = new Map<string, GuestService['items']>()
  for (const item of items ?? []) {
    if (!itemsByService.has(item.service_id)) itemsByService.set(item.service_id, [])
    itemsByService.get(item.service_id)!.push({
      id: item.id,
      label: item.label,
      priceCents: item.price_cents,
    })
  }

  // Bestellbar sind nur aktive Services; die Namens-Map bleibt ungefiltert,
  // damit alte Bestellungen auf archivierte Services lesbar bleiben.
  const guestServices: GuestService[] = (services ?? [])
    .filter(s => !s.archived_at)
    .map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      items: itemsByService.get(s.id) ?? [],
    }))

  const serviceNameById = new Map((services ?? []).map(s => [s.id, s.name]))
  const guestOrders: GuestOrder[] = (orders ?? []).map(o => ({
    id: o.id,
    serviceName: serviceNameById.get(o.service_id) ?? 'Service',
    itemLabels: ((o.items_snapshot ?? []) as { label: string }[]).map(i => i.label),
    status: o.status as GuestOrder['status'],
    createdAt: o.created_at,
  }))

  return (
    <main className="flex flex-1 flex-col gap-6 py-4">
      <header className="text-center">
        <p className="text-sm text-ink-muted">{ctx.hotelName}</p>
        <h1 className="text-2xl font-black text-ink">Zimmer {ctx.roomNumber}</h1>
      </header>

      <GuestCleaningStatusCard
        status={status}
        routineTime={stayover.enabled ? hhmm(due.hour, due.minute) : null}
        timeZone={tz}
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
      />

      <GuestServicesPanel services={guestServices} orders={guestOrders} />

      <div className="mt-auto pt-6 text-center">
        <form action={guestLogoutAction}>
          <button
            type="submit"
            className="text-sm font-semibold text-ink-muted underline hover:text-ink"
          >
            Abmelden
          </button>
        </form>
      </div>
    </main>
  )
}
