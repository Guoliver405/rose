import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BedDouble, Check, ChevronRight, Circle, Compass, ConciergeBell, DoorOpen,
  BarChart3, ClipboardList, CreditCard, LayoutGrid, SlidersHorizontal, Smartphone,
  Sparkles, Users, type LucideIcon,
} from 'lucide-react'
import { getAccountContext, getManagementContext } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/service'
import { einrichtungStart, lotseStart, lotsenFuer, setupProgress, type SetupFacts } from '@/lib/lotsen'

/**
 * Hilfe & Lotsen — der Tutorial-Bereich des Hauses.
 *
 * Zwei Teile: oben, was zur Einrichtung noch fehlt, unten der Katalog der
 * Lotsen. Der Fortschritt wird **abgeleitet**, nicht gespeichert — dieselbe
 * Haltung wie bei `isBillable` oder `isStayoverDue`. Ein gespeichertes Häkchen
 * bliebe stehen, wenn jemand das letzte Zimmer wieder löscht oder die letzte
 * Reinigungskraft ausscheidet; die abgeleitete Liste zeigt die Lücke.
 *
 * Die Zählungen laufen über den Admin-Client mit ausdrücklichem `hotel_id`-
 * Filter: Zählen ist hier billiger als Lesen (`head: true`), und RLS gibt einem
 * Kontoinhaber ohnehin mehr als ein Haus frei.
 */

const ICONS: Record<string, LucideIcon> = {
  uebersicht: LayoutGrid,
  zimmer: BedDouble,
  regeln: SlidersHorizontal,
  gastzugang: DoorOpen,
  personal: Users,
  services: ConciergeBell,
  reinigung: Sparkles,
  gast: Smartphone,
  anfragen: ClipboardList,
  auswertung: BarChart3,
  konto: CreditCard,
}

export default async function HilfePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const ctx = await getManagementContext(slug)
  if (!ctx) redirect('/admin')

  const base = `/h/${ctx.hotelSlug}/admin`
  const istVerwaltung = ctx.role !== 'reception'
  const admin = createAdminClient()

  // Nur die Verwaltung sieht die Einrichtungsliste: Die Rezeption kann keinen
  // einzigen Punkt davon erledigen, für sie wäre es eine Liste mit Vorwürfen.
  let fortschritt: ReturnType<typeof setupProgress> | null = null
  if (istVerwaltung) {
    const [rooms, maids, services, stays, konto] = await Promise.all([
      admin.from('rooms').select('id', { count: 'exact', head: true })
        .eq('hotel_id', ctx.hotelId).is('deactivated_at', null),
      admin.from('profiles').select('id', { count: 'exact', head: true })
        .eq('hotel_id', ctx.hotelId).not('username', 'is', null).is('deactivated_at', null),
      admin.from('service_definitions').select('id', { count: 'exact', head: true })
        .eq('hotel_id', ctx.hotelId).is('archived_at', null),
      admin.from('stays').select('id', { count: 'exact', head: true })
        .eq('hotel_id', ctx.hotelId),
      ctx.isOwner ? getAccountContext() : Promise.resolve(null),
    ])

    let zahlungsweg: boolean | null = null
    if (konto) {
      const { data: account } = await admin
        .from('accounts').select('payment_method_kind').eq('id', konto.accountId).single()
      zahlungsweg = Boolean(account?.payment_method_kind)
    }

    const facts: SetupFacts = {
      rooms: rooms.count ?? 0,
      maids: maids.count ?? 0,
      services: services.count ?? 0,
      stays: stays.count ?? 0,
      guestAccessChosen: ctx.policies.guestAccessMode !== undefined,
      timeZoneChosen: ctx.policies.timeZone !== undefined,
      paymentMethod: zahlungsweg,
    }
    fortschritt = setupProgress(facts)
  }

  const lotsen = lotsenFuer(istVerwaltung, ctx.isOwner)
  const start = einrichtungStart(ctx.hotelSlug)

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-black text-ink">Hilfe &amp; Lotsen</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Ein Lotse legt sich über die echte Seite und erklärt Schritt für Schritt, was dort
          womit passiert. Bedienen können Sie die Seite dabei ganz normal weiter — nichts ist
          gesperrt, und mit Esc sind Sie wieder heraus.
        </p>
      </div>

      {fortschritt && (
        <section className="flex flex-col gap-3 rounded-xl border border-edge bg-surface p-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-black text-ink">Einrichtung Ihres Hauses</h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                fortschritt.complete
                  ? 'bg-positive-pill text-positive-deepest'
                  : 'bg-attention-pill text-attention-deepest'
              }`}
            >
              {fortschritt.done} von {fortschritt.total}
            </span>
            <Link
              href={start}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-action px-3 py-1.5 text-sm font-bold text-action-foreground hover:bg-action-strong"
            >
              <Compass className="h-4 w-4" />
              {fortschritt.complete ? 'Einrichtung noch einmal ansehen' : 'Einrichtung fortsetzen'}
            </Link>
          </div>

          <ul className="flex flex-col divide-y divide-edge">
            {fortschritt.items.map(item => {
              const ziel = item.href
                ?? (item.lotse
                  ? `${base}${item.path ?? ''}?lotse=${item.lotse}&schritt=0`
                  : `${base}${item.path ?? ''}`)
              return (
                <li key={item.id}>
                  <Link href={ziel} className="flex items-center gap-3 py-2.5 hover:bg-surface-sunken">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        item.done ? 'bg-positive-pill text-positive-deepest' : 'bg-surface-muted text-ink-muted'
                      }`}
                    >
                      {item.done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm font-bold ${item.done ? 'text-ink-soft' : 'text-ink'}`}>
                        {item.label}
                        {item.optional && (
                          <span className="ml-2 text-xs font-semibold text-ink-muted">freiwillig</span>
                        )}
                      </span>
                      <span className="block text-xs text-ink-muted">{item.hint}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section data-lotse="hilfe.katalog" className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-black text-ink">Lotsen nach Thema</h2>
          <p className="text-sm text-ink-soft">
            Jeder Lotse führt auf die Seite, um die es geht, und lässt sich beliebig oft starten.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {lotsen.map(lotse => {
            const Icon = ICONS[lotse.id] ?? Compass
            return (
              <Link
                key={lotse.id}
                href={lotseStart(lotse, ctx.hotelSlug)}
                className="flex items-start gap-3 rounded-xl border border-edge bg-surface p-4 hover:border-edge-strong"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-soft">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-ink">{lotse.title}</span>
                  <span className="mt-0.5 block text-xs text-ink-muted">{lotse.subtitle}</span>
                  <span className="mt-1.5 block text-xs font-semibold text-action">
                    {lotse.steps.length} Schritte
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
