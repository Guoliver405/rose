import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Building2, ChevronRight, ConciergeBell, LogOut, Settings2, Sparkles } from 'lucide-react'
import { listAccessibleHotels, getAccountContext } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/service'
import { logoutAction } from '@/app/login/actions'
import { isRoomActive } from '@/lib/board'

/**
 * Haus-Auswahl — der Einstieg ins Management-Portal.
 *
 * Für eine Kette ist das kein Menü, sondern das Lagebild: offene Reinigungen
 * und dringende Service-Anfragen je Haus auf einen Blick, mit Absprung ins
 * Haus. Bei genau einem Haus wird ohne Zwischenseite durchgeleitet — der
 * Einzelhaus-Kunde merkt von der Auswahl nichts.
 */
export default async function HotelPickerPage() {
  const hotels = await listAccessibleHotels()
  if (hotels.length === 0) redirect('/login')
  if (hotels.length === 1) redirect(`/h/${hotels[0].slug}/admin`)

  const account = await getAccountContext()

  // Lagebild je Haus. Admin-Client mit explizitem Filter auf die Häuser, auf
  // die der Nutzer Zugriff hat — RLS würde hier zwar auch greifen, der
  // explizite Filter ist aber die Projekt-Faustregel.
  const admin = createAdminClient()
  const hotelIds = hotels.map(h => h.id)
  const [{ data: states }, { data: orders }] = await Promise.all([
    admin
      .from('room_states')
      .select('hotel_id, guest_signal, checkout_pending, priority, cleaning_by')
      .in('hotel_id', hotelIds),
    admin
      .from('service_orders')
      .select('hotel_id, service_definitions(urgent)')
      .in('hotel_id', hotelIds)
      .eq('status', 'open'),
  ])

  const openByHotel = new Map<string, number>()
  const cleaningByHotel = new Map<string, number>()
  for (const s of states ?? []) {
    if (isRoomActive(s)) openByHotel.set(s.hotel_id, (openByHotel.get(s.hotel_id) ?? 0) + 1)
    if (s.cleaning_by) cleaningByHotel.set(s.hotel_id, (cleaningByHotel.get(s.hotel_id) ?? 0) + 1)
  }

  const ordersByHotel = new Map<string, { count: number; urgent: boolean }>()
  for (const o of orders ?? []) {
    const def = Array.isArray(o.service_definitions) ? o.service_definitions[0] : o.service_definitions
    const entry = ordersByHotel.get(o.hotel_id) ?? { count: 0, urgent: false }
    entry.count++
    if (def?.urgent) entry.urgent = true
    ordersByHotel.set(o.hotel_id, entry)
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-surface-sunken">
      <header className="border-b border-edge bg-surface">
        <div className="mx-auto flex max-w-[900px] items-center gap-4 px-4 py-3">
          <span className="text-lg font-black text-ink">
            Ro<span className="text-blocked">Se</span>
          </span>
          <div className="ml-auto flex items-center gap-3">
            {account && (
              <Link
                href="/konto"
                className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink"
              >
                <Settings2 className="h-4 w-4" />
                Konto
              </Link>
            )}
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink"
              >
                <LogOut className="h-4 w-4" />
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[900px] flex-1 p-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-black text-ink">Häuser</h1>
          <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-ink-soft">
            {hotels.length}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {hotels.map(h => {
            const open = openByHotel.get(h.id) ?? 0
            const cleaning = cleaningByHotel.get(h.id) ?? 0
            const ord = ordersByHotel.get(h.id)
            return (
              <Link
                key={h.id}
                href={`/h/${h.slug}/admin`}
                className={`flex items-center gap-4 rounded-xl border bg-surface p-4 hover:border-edge-strong ${
                  ord?.urgent ? 'border-critical blink-ring-overdue' : 'border-edge'
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-soft">
                  <Building2 className="h-5 w-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-ink">{h.name}</span>
                  <span className="block truncate font-mono text-xs text-ink-muted">/{h.slug}</span>
                </span>

                <span className="flex shrink-0 flex-wrap items-center gap-1.5 text-xs font-semibold">
                  {open > 0 && (
                    <span className="rounded-full bg-attention-pill px-2.5 py-0.5 text-attention-deepest">
                      {open} zu reinigen
                    </span>
                  )}
                  {cleaning > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-positive-pill px-2.5 py-0.5 text-positive-deepest">
                      <Sparkles className="h-3 w-3" /> {cleaning}
                    </span>
                  )}
                  {ord && ord.count > 0 && (
                    <span
                      className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 ${
                        ord.urgent
                          ? 'blink-icon bg-critical-pill text-critical-deepest'
                          : 'bg-action-tint text-action-strong'
                      }`}
                    >
                      <ConciergeBell className="h-3 w-3" /> {ord.count}
                    </span>
                  )}
                  {open === 0 && cleaning === 0 && !ord && (
                    <span className="rounded-full bg-positive-pill px-2.5 py-0.5 text-positive-deepest">
                      alles bereit
                    </span>
                  )}
                  {h.role === 'manager' && (
                    <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-ink-muted">
                      Manager
                    </span>
                  )}
                </span>

                <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
