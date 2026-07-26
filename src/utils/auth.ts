import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/service'
import { findHotelBySlug } from '@/utils/hotel'

/**
 * Rechte im Management-Portal (Phase 6d).
 *
 *   admin     — Kontoinhaber. Alle Häuser seines Kontos, plus Konto/Plan.
 *   manager   — verwaltet eine Teilmenge der Häuser; im Haus dieselben
 *               Rechte wie der Inhaber, aber kein Zugriff auf Konto/Plan.
 *   reception — Tagesgeschäft, hausintern.
 *
 * Woher der Zugriff kommt:
 *   account_members(account_id, user_id)  → 'admin' für ALLE Häuser des Kontos
 *   hotel_members(hotel_id, user_id)      → 'manager' | 'reception' für DIESES Haus
 *
 * `profiles` ist NICHT mehr maßgeblich für den Zugriff. Die Tabelle bleibt der
 * Identitäts- und Fremdschlüssel-Anker jeder Person (`stays.created_by`,
 * `service_orders.done_by` zeigen darauf); `profiles.hotel_id` bedeutet für
 * Management nur noch „Stammhaus".
 */
export type ManagementRole = 'admin' | 'manager' | 'reception'

export type ManagementContext = {
  userId: string
  hotelId: string
  hotelSlug: string
  hotelName: string
  accountId: string
  displayName: string
  role: ManagementRole
  /** Zugriff stammt aus der Kontoinhaberschaft (nicht aus hotel_members). */
  isOwner: boolean
}

/**
 * Kontext für EIN Haus, aufgelöst über den Slug aus der URL.
 *
 * Der Slug ist Pflicht-Parameter: seit ein Konto mehrere Häuser tragen kann,
 * ist der Mandant nicht mehr aus der Identität ableitbar, sondern eine
 * Auswahl. Der Pflicht-Parameter sorgt außerdem dafür, dass der Type-Check
 * jede Aufrufstelle zeigt, statt dass eine stillschweigend auf dem falschen
 * Haus arbeitet.
 *
 * Pages: `const ctx = await getManagementContext(slug); if (!ctx) redirect('/admin')`
 * Actions: bei `null` mit `{ error }` zurückkehren, dann Admin-Client nutzen.
 */
export async function getManagementContext(slug: string): Promise<ManagementContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const hotel = await findHotelBySlug(slug)
  if (!hotel) return null

  const admin = createAdminClient()

  // 1) Kontoinhaber — gilt für jedes Haus des Kontos.
  const { data: owner } = await admin
    .from('account_members')
    .select('display_name')
    .eq('account_id', hotel.accountId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (owner) {
    return {
      userId: user.id,
      hotelId: hotel.id,
      hotelSlug: hotel.slug,
      hotelName: hotel.name,
      accountId: hotel.accountId,
      displayName: owner.display_name,
      role: 'admin',
      isOwner: true,
    }
  }

  // 2) Hausbezogene Zuordnung — Manager oder Rezeption.
  const { data: member } = await admin
    .from('hotel_members')
    .select('role, display_name')
    .eq('hotel_id', hotel.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) return null

  return {
    userId: user.id,
    hotelId: hotel.id,
    hotelSlug: hotel.slug,
    hotelName: hotel.name,
    accountId: hotel.accountId,
    displayName: member.display_name,
    role: member.role === 'manager' ? 'manager' : 'reception',
    isOwner: false,
  }
}

/**
 * Wie `getManagementContext`, aber nur für **verwaltende** Rollen: Inhaber
 * und Manager. Rezeptions-Zugänge liefern `null`.
 *
 * Innerhalb eines Hauses haben Inhaber und Manager dieselben Rechte — der
 * Unterschied liegt nur im Konto-Bereich und darin, WELCHE Häuser sie sehen.
 * Deshalb gaten Zimmer-Setup, Personal, Services und Einstellungen hierauf.
 */
export async function getAdminContext(slug: string): Promise<ManagementContext | null> {
  const ctx = await getManagementContext(slug)
  return ctx && ctx.role !== 'reception' ? ctx : null
}

/** Ein Haus, auf das der angemeldete Nutzer Zugriff hat. */
export type HotelAccess = {
  id: string
  slug: string
  name: string
  accountId: string
  role: ManagementRole
}

/**
 * Alle Häuser des angemeldeten Nutzers — Grundlage der Haus-Auswahl auf
 * `/admin` und der Weiche auf der Login-Seite.
 *
 * Inhaberschaft schlägt eine hausbezogene Zuordnung: wer sein eigenes Haus
 * zusätzlich als Manager einträgt, bleibt dort Inhaber.
 */
export async function listAccessibleHotels(): Promise<HotelAccess[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const admin = createAdminClient()

  const [{ data: ownerships }, { data: memberships }] = await Promise.all([
    admin.from('account_members').select('account_id').eq('user_id', user.id),
    admin.from('hotel_members').select('hotel_id, role').eq('user_id', user.id),
  ])

  const accountIds = (ownerships ?? []).map(o => o.account_id)
  const memberRoleByHotel = new Map(
    (memberships ?? []).map(m => [m.hotel_id, m.role as ManagementRole]),
  )
  const hotelIds = [...memberRoleByHotel.keys()]

  const [{ data: ownedHotels }, { data: memberHotels }] = await Promise.all([
    accountIds.length > 0
      ? admin.from('hotels').select('id, slug, name, account_id').in('account_id', accountIds)
      : Promise.resolve({ data: [] as HotelRow[] }),
    hotelIds.length > 0
      ? admin.from('hotels').select('id, slug, name, account_id').in('id', hotelIds)
      : Promise.resolve({ data: [] as HotelRow[] }),
  ])

  const byId = new Map<string, HotelAccess>()
  for (const h of memberHotels ?? []) {
    byId.set(h.id, {
      id: h.id,
      slug: h.slug,
      name: h.name,
      accountId: h.account_id,
      role: memberRoleByHotel.get(h.id) ?? 'reception',
    })
  }
  // Nach den Mitgliedschaften eingetragen — Inhaberschaft überschreibt sie.
  for (const h of ownedHotels ?? []) {
    byId.set(h.id, {
      id: h.id,
      slug: h.slug,
      name: h.name,
      accountId: h.account_id,
      role: 'admin',
    })
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'de'))
}

type HotelRow = { id: string; slug: string; name: string; account_id: string }

/** Kontoinhaber-Kontext für den Bereich `/konto` (Plan, Häuser, Manager). */
export type AccountContext = {
  userId: string
  accountId: string
  accountName: string
  plan: string
  displayName: string
}

/**
 * Nur für Kontoinhaber. `/konto` liegt außerhalb von `/h/<slug>/` und ist
 * damit eine **zweite Auth-Fläche** — sie braucht diesen eigenen Guard, das
 * Hotel-Layout schützt dort nichts.
 */
export async function getAccountContext(): Promise<AccountContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: membership } = await admin
    .from('account_members')
    .select('account_id, display_name, accounts(name, plan)')
    .eq('user_id', user.id)
    .eq('role', 'owner')
    .limit(1)
    .maybeSingle()

  if (!membership) return null
  const account = membership.accounts as unknown as { name: string; plan: string } | null

  return {
    userId: user.id,
    accountId: membership.account_id,
    accountName: account?.name ?? 'Konto',
    plan: account?.plan ?? 'trial',
    displayName: membership.display_name,
  }
}
