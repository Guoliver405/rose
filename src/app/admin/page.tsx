import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BarChart3, Building2, ChevronRight, ConciergeBell, CreditCard, Sparkles } from 'lucide-react'
import { listAccessibleHotels, getAccountContext } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/service'
import { isRoomActive } from '@/lib/board'
import { getBillingOverview } from '@/utils/billing'
import { getAccountBilling, stripeReady, stripeTestMode } from '@/utils/stripe'
import { ensureInvoicesForAccount, listInvoices } from '@/utils/invoicing'
import { isOverdue } from '@/lib/invoice'
import { formatCents } from '@/lib/money'
import { billingLine } from '@/lib/pricing'
import HausAnlegen from './HausAnlegen'
import DatenLoeschen from './DatenLoeschen'
import KontoShell from './KontoShell'
import KontoName from './KontoName'
import Rich from '@/components/i18n/Rich'
import { format, getMessages, intlLocale, plural } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'
import { simulatorName } from '@/lib/sim-account'

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
 * Manager sieht hier ausschließlich die Häuser seines Bereichs. Der Kasten
 * ist die Kurzfassung — Beträge, abgeschlossene Monate, Zahlungsverfahren und
 * Rechnungen liegen auf `/admin/abrechnung`.
 */
export default async function HotelPickerPage() {
  const hotels = await listAccessibleHotels()
  if (hotels.length === 0) redirect('/login')

  const locale = await getAdminLocale()
  const il = intlLocale(locale)
  const m = getMessages(locale).account.houses

  const account = await getAccountContext()

  // Lagebild je Haus. Admin-Client mit explizitem Filter auf die Häuser, auf
  // die der Nutzer Zugriff hat — RLS würde hier zwar auch greifen, der
  // explizite Filter ist aber die Projekt-Faustregel.
  const admin = createAdminClient()
  const hotelIds = hotels.map(h => h.id)
  const [{ data: states }, { data: orders }, { data: roomRows }] = await Promise.all([
    admin
      .from('room_states')
      .select('hotel_id, guest_signal, clean_not_before, checkout_pending, priority, cleaning_by')
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

  // „In Betrieb" ist die Betriebssicht — die Abrechnungssicht kommt aus
  // `getBillingOverview`: laufender Monat abgeleitet, abgeschlossene Monate
  // aus dem Snapshot, sofern einer geschrieben wurde.
  const roomsByHotel = new Map<string, number>()
  let totalRooms = 0
  for (const r of roomRows ?? []) {
    if (!r.deactivated_at) {
      roomsByHotel.set(r.hotel_id, (roomsByHotel.get(r.hotel_id) ?? 0) + 1)
      totalRooms++
    }
  }

  // Nur die Kurzfassung: Zimmerzahl und voraussichtlicher Betrag des
  // laufenden Monats. Alles Weitere liegt auf /admin/abrechnung.
  const mitStripe = stripeReady()
  if (account && mitStripe) await ensureInvoicesForAccount(account.accountId)
  const [billing, konto, rechnungen] = await Promise.all([
    account ? getBillingOverview(account.accountId, 0) : Promise.resolve(null),
    account && mitStripe ? getAccountBilling(account.accountId) : Promise.resolve(null),
    account && mitStripe ? listInvoices(account.accountId, 6) : Promise.resolve([]),
  ])
  const zahlungswegFehlt = Boolean(account && mitStripe && !konto?.paymentMethodKind)
  const heute = new Date()
  const problemRechnung = rechnungen.find(r =>
    r.status === 'uncollectible' || isOverdue(r.status, r.dueAt, heute) || (r.status === 'draft' && r.lastError),
  )
  const laufend = account && billing
    ? billingLine(
        billing.current.rooms, account.createdAt, new Date(`${billing.current.periodStart}T00:00:00`),
      )
    : null

  return (
    <KontoShell who={account?.displayName ?? hotels[0]?.displayName} istInhaber={account !== null}>
      {/* ── Konto ─────────────────────────────────────────────────────
          Nur für den Inhaber. Ein Manager hat kein Konto, für ihn beginnt
          die Seite direkt bei den Häusern. */}
      {account && laufend && (
        <section className="rounded-xl border border-edge bg-surface p-4">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-ink-soft">{m.account.heading}</h2>
              <KontoName name={account.accountName} m={m.accountName} />
            </div>
            <Link
              href="/admin/abrechnung"
              className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink"
            >
              <CreditCard className="h-4 w-4" /> {m.account.billingLink}
              <ChevronRight className="h-4 w-4 text-ink-muted" />
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-surface-muted px-3 py-1 font-semibold text-ink-soft">
              {plural(il, hotels.length, m.account.houseCount)}
            </span>
            <span className="rounded-full bg-surface-muted px-3 py-1 font-semibold text-ink-soft">
              {format(m.account.roomsActive, { count: totalRooms })}
            </span>
            <span className="rounded-full bg-action-tint px-3 py-1 font-semibold text-action-strong">
              {format(m.account.roomsBillable, { count: laufend.rooms })}
            </span>
            <span className="rounded-full bg-surface-muted px-3 py-1 font-semibold text-ink-soft">
              {format(laufend.free ? m.account.expectedFree : m.account.expected, { amount: formatCents(laufend.cents, il) })}
            </span>
          </div>
          {problemRechnung && (
            <p className="mt-3 rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm text-critical-deepest">
              <Rich
                text={problemRechnung.status === 'draft' ? m.account.invoiceFailed : m.account.invoiceOverdue}
                vars={{ reason: problemRechnung.lastError ?? '', number: problemRechnung.number ?? '' }}
                tags={{
                  b: c => <span className="font-bold">{c}</span>,
                  link: c => (
                    <Link href={problemRechnung.hostedInvoiceUrl ?? '/admin/abrechnung'} className="font-semibold underline hover:no-underline">
                      {c}
                    </Link>
                  ),
                }}
              />
            </p>
          )}
          {zahlungswegFehlt && (
            <p className="mt-3 rounded-lg border border-attention-tint-edge bg-attention-tint px-3 py-2 text-sm text-attention-deepest">
              <Rich
                text={m.account.noPaymentMethod}
                tags={{
                  b: c => <span className="font-bold">{c}</span>,
                  link: c => (
                    <Link href="/admin/abrechnung/zahlungsweg" className="font-semibold underline hover:no-underline">
                      {c}
                    </Link>
                  ),
                }}
              />
            </p>
          )}
          <p className="mt-2 text-xs text-ink-muted">
            <Rich text={m.account.billingRule} tags={{ em: c => <em>{c}</em> }} />{' '}
            {!mitStripe
              ? m.account.billingNotSetUp
              : stripeTestMode()
                ? m.account.billingTestMode
                : m.account.billingLive}
          </p>
        </section>
      )}

      {/* ── Häuser ────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-black text-ink">{m.list.heading}</h1>
          <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-ink-soft">
            {hotels.length}
          </span>
          {account && <div className="ml-auto"><HausAnlegen m={m.create} /></div>}
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
                    /{h.slug} · {format(m.list.rooms, { count: roomsByHotel.get(h.id) ?? 0 })}
                  </span>
                </span>

                <span className="flex shrink-0 flex-wrap items-center gap-1.5 text-xs font-semibold">
                  {open > 0 && (
                    <span className="rounded-full bg-attention-pill px-2.5 py-0.5 text-attention-deepest">
                      {format(m.list.toClean, { count: open })}
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
                      {m.list.allReady}
                    </span>
                  )}
                  {h.role === 'manager' && (
                    <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-ink-muted">
                      {m.list.manager}
                    </span>
                  )}
                </span>

                <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
              </Link>
            )
          })}
        </div>
      </section>

      {/* Housekeeping-Simulator (26.09.2026) — nur Inhaber und Manager, wie `getSimContext`. */}
      {hotels.some(h => h.role !== 'reception') && (
        <Link href="/simulator"
          className="flex items-center gap-3 rounded-xl border border-edge bg-surface p-4 hover:border-edge-strong">
          <BarChart3 className="h-5 w-5 shrink-0 text-action" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="font-bold text-ink">{simulatorName(locale)}</div>
            <div className="text-sm text-ink-soft">
              {m.simulator.text}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
        </Link>
      )}

      {/* Löschbegehren — nur der Kontoinhaber, bewusst ganz unten. */}
      {account && (
        <DatenLoeschen
          accountName={account.accountName}
          m={m.deletion}
          intlLocale={il}
          hotels={hotels
            .filter(h => h.accountId === account.accountId)
            .map(h => ({ id: h.id, name: h.name }))}
        />
      )}
    </KontoShell>
  )
}
