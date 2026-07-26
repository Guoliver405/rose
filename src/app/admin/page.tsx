import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Building2, ChevronRight, ConciergeBell, LogOut, Sparkles } from 'lucide-react'
import { listAccessibleHotels, getAccountContext } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/service'
import { logoutAction } from '@/app/login/actions'
import { isRoomActive } from '@/lib/board'
import { isBillable, monthPeriod } from '@/lib/rooms'
import HausAnlegen from './HausAnlegen'

/**
 * Häuser — der Einstieg ins Management-Portal und zugleich der Konto-Bereich.
 *
 * Beides gehört auf einen Bildschirm: die Frage „welche Häuser habe ich" und
 * die Frage „was kostet mich das / wie kommt ein weiteres dazu" sind dieselbe
 * Frage. Vorher lagen sie auf zwei Seiten, und der Weg zur zweiten (`/konto`)
 * hing ausgerechnet an dieser hier — die bei genau einem Haus übersprungen
 * wurde. Einzelhaus-Inhaber kamen dadurch nie an ihr Konto und konnten kein
 * zweites Haus anlegen.
 *
 * Deshalb wird hier **nicht mehr weitergeleitet**. Wer nach dem Anmelden
 * direkt ins Tagesgeschäft soll, entscheidet die Login-Seite — das ist eine
 * Frage des Einstiegs, nicht dieser Seite.
 *
 * Der Konto-Kasten und „Haus anlegen" erscheinen nur für den Kontoinhaber; ein
 * Manager sieht hier ausschließlich die Häuser seines Bereichs.
 */
export default async function HotelPickerPage() {
  const hotels = await listAccessibleHotels()
  if (hotels.length === 0) redirect('/login')

  const account = await getAccountContext()

  // Lagebild je Haus. Admin-Client mit explizitem Filter auf die Häuser, auf
  // die der Nutzer Zugriff hat — RLS würde hier zwar auch greifen, der
  // explizite Filter ist aber die Projekt-Faustregel.
  const admin = createAdminClient()
  const hotelIds = hotels.map(h => h.id)
  const [{ data: states }, { data: orders }, { data: roomRows }] = await Promise.all([
    admin
      .from('room_states')
      .select('hotel_id, guest_signal, checkout_pending, priority, cleaning_by')
      .in('hotel_id', hotelIds),
    admin
      .from('service_orders')
      .select('hotel_id, service_definitions(urgent)')
      .in('hotel_id', hotelIds)
      .eq('status', 'open'),
    admin
      .from('rooms')
      .select('hotel_id, created_at, deactivated_at')
      .in('hotel_id', hotelIds),
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

  // Zimmerzahlen. „In Betrieb" ist die Betriebssicht; „abrechenbar" folgt der
  // Abrechnungsregel: wer im laufenden Monat auch nur vorübergehend aktiv war,
  // zählt — ein mitten im Monat außer Betrieb genommenes Zimmer also noch.
  // Reine Ableitung aus created_at/deactivated_at, kein Snapshot.
  const period = monthPeriod(new Date())
  const roomsByHotel = new Map<string, number>()
  let totalRooms = 0
  let totalBillable = 0
  for (const r of roomRows ?? []) {
    if (!r.deactivated_at) {
      roomsByHotel.set(r.hotel_id, (roomsByHotel.get(r.hotel_id) ?? 0) + 1)
      totalRooms++
    }
    if (isBillable(r, period)) totalBillable++
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-surface-sunken">
      <header className="border-b border-edge bg-surface">
        <div className="mx-auto flex max-w-[900px] items-center gap-4 px-4 py-3">
          <span className="text-lg font-black text-ink">
            Ro<span className="text-blocked">Se</span>
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-ink-muted sm:inline">
              {account?.displayName ?? hotels[0]?.name}
            </span>
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

      <main className="mx-auto flex w-full max-w-[900px] flex-1 flex-col gap-6 p-4">
        {/* ── Konto ─────────────────────────────────────────────────────
            Nur für den Inhaber. Ein Manager hat kein Konto, für ihn beginnt
            die Seite direkt bei den Häusern. */}
        {account && (
          <section className="rounded-xl border border-edge bg-surface p-4">
            <h2 className="text-sm font-bold text-ink-soft">Konto</h2>
            <p className="mt-1 text-lg font-black text-ink">{account.accountName}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-surface-muted px-3 py-1 font-semibold text-ink-soft">
                Plan: {account.plan}
              </span>
              <span className="rounded-full bg-surface-muted px-3 py-1 font-semibold text-ink-soft">
                {hotels.length} {hotels.length === 1 ? 'Haus' : 'Häuser'}
              </span>
              <span className="rounded-full bg-surface-muted px-3 py-1 font-semibold text-ink-soft">
                {totalRooms} Zimmer in Betrieb
              </span>
              <span className="rounded-full bg-action-tint px-3 py-1 font-semibold text-action-strong">
                {totalBillable} abrechenbar (laufender Monat)
              </span>
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              Die Abrechnung erfolgt je Zimmer: gezählt wird jedes Zimmer, das im
              Monat <em>auch nur vorübergehend</em> in Betrieb war — ein mitten im
              Monat außer Betrieb genommenes Zimmer zählt also noch mit.
              Rechnungsstellung und Zahlungsdaten folgen; aktuell läuft das Konto
              ohne Berechnung.
            </p>
          </section>
        )}

        {/* ── Häuser ────────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-black text-ink">Häuser</h1>
            <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-ink-soft">
              {hotels.length}
            </span>
            {account && <div className="ml-auto"><HausAnlegen /></div>}
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
                    <span className="block truncate font-mono text-xs text-ink-muted">
                      /{h.slug} · {roomsByHotel.get(h.id) ?? 0} Zimmer
                    </span>
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
        </section>
      </main>
    </div>
  )
}
