import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, LogOut } from 'lucide-react'
import { getAccountContext } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/service'
import { logoutAction } from '@/app/login/actions'
import { isBillable, monthPeriod } from '@/lib/rooms'
import KontoManager, { type AccountHotel, type AccountManager } from './KontoManager'

/**
 * Konto-Bereich — Häuser, Manager, Plan.
 *
 * Liegt bewusst AUSSERHALB von `/h/<slug>/`: hier geht es um das Konto, nicht
 * um ein Haus. Damit ist das eine zweite Auth-Fläche mit eigenem Guard —
 * `getAccountContext()` lässt ausschließlich den Kontoinhaber durch, ein
 * Manager kommt hier nicht herein.
 */
export default async function KontoPage() {
  const ctx = await getAccountContext()
  if (!ctx) redirect('/admin')

  const admin = createAdminClient()
  const { data: hotels } = await admin
    .from('hotels')
    .select('id, name, slug')
    .eq('account_id', ctx.accountId)
    .order('name')

  const hotelIds = (hotels ?? []).map(h => h.id)
  const { data: members } = hotelIds.length
    ? await admin
        .from('hotel_members')
        .select('user_id, hotel_id, role, display_name')
        .in('hotel_id', hotelIds)
        .eq('role', 'manager')
    : { data: [] as { user_id: string; hotel_id: string; role: string; display_name: string }[] }

  const byUser = new Map<string, AccountManager>()
  for (const m of members ?? []) {
    const entry: AccountManager = byUser.get(m.user_id) ?? {
      userId: m.user_id,
      displayName: m.display_name,
      hotelIds: [],
    }
    entry.hotelIds.push(m.hotel_id)
    byUser.set(m.user_id, entry)
  }

  const accountHotels: AccountHotel[] = (hotels ?? []).map(h => ({
    id: h.id,
    name: h.name,
    slug: h.slug,
  }))

  // Zimmerzahlen je Haus. „In Betrieb" ist die Betriebssicht; „abrechenbar"
  // folgt der Abrechnungsregel: wer im laufenden Monat auch nur vorübergehend
  // aktiv war, zählt — ein mitten im Monat außer Betrieb genommenes Zimmer
  // also noch. Reine Ableitung aus created_at/deactivated_at, kein Snapshot.
  const { data: roomRows } = hotelIds.length
    ? await admin
        .from('rooms')
        .select('hotel_id, created_at, deactivated_at')
        .in('hotel_id', hotelIds)
    : { data: [] as { hotel_id: string; created_at: string; deactivated_at: string | null }[] }

  const period = monthPeriod(new Date())
  const roomsByHotel = new Map<string, number>()
  const billableByHotel = new Map<string, number>()
  for (const r of roomRows ?? []) {
    if (!r.deactivated_at) roomsByHotel.set(r.hotel_id, (roomsByHotel.get(r.hotel_id) ?? 0) + 1)
    if (isBillable(r, period)) {
      billableByHotel.set(r.hotel_id, (billableByHotel.get(r.hotel_id) ?? 0) + 1)
    }
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-surface-sunken">
      <header className="border-b border-edge bg-surface">
        <div className="mx-auto flex max-w-[900px] items-center gap-4 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Häuser
          </Link>
          <span className="text-lg font-black text-ink">
            Ro<span className="text-blocked">Se</span>
            <span className="ml-2 text-sm font-semibold text-ink-muted">Konto</span>
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-ink-muted sm:inline">{ctx.displayName}</span>
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
        <KontoManager
          accountName={ctx.accountName}
          plan={ctx.plan}
          hotels={accountHotels}
          managers={[...byUser.values()].sort((a, b) => a.displayName.localeCompare(b.displayName, 'de'))}
          roomsByHotel={Object.fromEntries(roomsByHotel)}
          billableByHotel={Object.fromEntries(billableByHotel)}
        />
      </main>
    </div>
  )
}
