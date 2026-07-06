import { redirect } from 'next/navigation'
import { getGuestContext } from '@/utils/guest'
import { createAdminClient } from '@/utils/supabase/service'
import { guestLogoutAction } from '../actions'
import GuestSignalPanel from './GuestSignalPanel'
import GuestServicesPanel, { type GuestOrder, type GuestService } from './GuestServicesPanel'

export default async function GuestStatusPage() {
  const ctx = await getGuestContext()
  if (!ctx) redirect('/guest')

  // Baukasten + eigene Bestellungen (Gast ist anonym → Admin-Client).
  const admin = createAdminClient()
  const [{ data: services }, { data: items }, { data: orders }] = await Promise.all([
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
  ])

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

      <GuestSignalPanel signal={ctx.guestSignal} cleaningActive={ctx.cleaningActive} />

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
