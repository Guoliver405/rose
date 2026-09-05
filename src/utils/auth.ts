import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/service'
import { findHotelBySlug } from '@/utils/hotel'

/**
 * Wer ist angemeldet? Liefert die Auth-User-ID oder `null`.
 *
 * Läuft über `getClaims()` statt `getUser()`: `getUser()` fragt bei JEDEM
 * Aufruf den Auth-Server (ein Netz-Roundtrip je Seite, je Layout, je Action).
 * `getClaims()` prüft die Signatur des Access-Tokens lokal gegen den
 * JWKS-Schlüssel des Projekts (einmal geholt, dann gecacht) — das Projekt
 * signiert mit ES256, also bleibt es lokal; bei symmetrischen Schlüsseln
 * fiele die Bibliothek von selbst auf `getUser()` zurück. Ein abgelaufenes
 * Token wird vorher regulär erneuert. Preis: ein am Auth-Server gelöschtes
 * Konto bleibt bis zum Token-Ablauf (~1 h) erkennbar — die Rechte hängen aber
 * ohnehin an `account_members`/`hotel_members`, nicht am Auth-Konto.
 *
 * `cache` dedupliziert innerhalb eines Requests: Layout, Seite und Guards
 * fragen alle danach, gerechnet wird einmal.
 */
export const getAuthUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  return data?.claims.sub ?? null
})

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
  /**
   * `hotels.policies` des Hauses, Stand dieses Requests. Liegt mit der
   * Slug-Auflösung ohnehin vor — Actions sparen sich damit die eigene
   * `hotels`-Abfrage. Wer Policies ÄNDERT, liest danach nicht hieraus.
   */
  policies: Record<string, unknown>
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
 *
 * Laufzeit (04.09.2026): Bis dahin vier Roundtrips hintereinander (Auth-Server,
 * Haus, Inhaber, Mitglied), und Layout wie Seite rechneten beide für sich —
 * je Seitenaufruf acht Roundtrips allein für die Frage „wer bist du". Jetzt
 * zwei Stufen à einem Roundtrip (Identität ‖ Haus, dann Inhaber ‖ Mitglied),
 * über `cache` einmal je Request.
 */
export const getManagementContext = cache(
  async (slug: string): Promise<ManagementContext | null> => {
    const [userId, hotel] = await Promise.all([getAuthUserId(), findHotelBySlug(slug)])
    if (!userId || !hotel) return null

    const admin = createAdminClient()

    // 1) Kontoinhaber — gilt für jedes Haus des Kontos.
    // 2) Hausbezogene Zuordnung — Manager oder Rezeption. Ein beendeter
    //    Zugang (`deactivated_at`) zählt nicht mehr: die Zeile bleibt nur als
    //    Nachweis und für die Wieder-Aktivierung stehen.
    // Beide Fragen sind unabhängig, also parallel; Inhaberschaft gewinnt.
    const [{ data: owner }, { data: member }] = await Promise.all([
      admin
        .from('account_members')
        .select('display_name')
        .eq('account_id', hotel.accountId)
        .eq('user_id', userId)
        .maybeSingle(),
      admin
        .from('hotel_members')
        .select('role, display_name')
        .eq('hotel_id', hotel.id)
        .eq('user_id', userId)
        .is('deactivated_at', null)
        .maybeSingle(),
    ])

    const base = {
      userId,
      hotelId: hotel.id,
      hotelSlug: hotel.slug,
      hotelName: hotel.name,
      accountId: hotel.accountId,
      policies: hotel.policies,
    }

    if (owner) {
      return { ...base, displayName: owner.display_name, role: 'admin', isOwner: true }
    }
    if (member) {
      return {
        ...base,
        displayName: member.display_name,
        role: member.role === 'manager' ? 'manager' : 'reception',
        isOwner: false,
      }
    }
    return null
  },
)

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
export const listAccessibleHotels = cache(async (): Promise<HotelAccess[]> => {
  const userId = await getAuthUserId()
  if (!userId) return []

  const admin = createAdminClient()

  const [{ data: ownerships }, { data: memberships }] = await Promise.all([
    admin.from('account_members').select('account_id').eq('user_id', userId),
    admin.from('hotel_members').select('hotel_id, role').eq('user_id', userId).is('deactivated_at', null),
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
})

type HotelRow = { id: string; slug: string; name: string; account_id: string }

/**
 * Wohin nach einer erfolgreichen Anmeldung?
 *
 * Wer die Häuser-Seite bedienen kann — Inhaber und Manager — landet dort: sie
 * trägt Konto, Häuser und den Weg, ein weiteres anzulegen. Die Rezeption kennt
 * nur ihr eigenes Haus und hat dort nichts zu holen, sie geht direkt ins
 * Tagesgeschäft.
 *
 * `null` = kein Zugriff auf irgendein Haus, also nicht (mehr) berechtigt.
 *
 * Bewusst an einer Stelle: dieselbe Frage stellt sich nach der Anmeldung, nach
 * der Registrierung und nach dem Zurücksetzen des Passworts. Dreimal
 * abgeschrieben liefe das über kurz oder lang auseinander.
 */
export async function landingRoute(): Promise<string | null> {
  const hotels = await listAccessibleHotels()
  if (hotels.length === 0) return null
  const nurRezeption = hotels.every(h => h.role === 'reception')
  return nurRezeption ? `/h/${hotels[0].slug}/admin` : '/admin'
}

/** Kontoinhaber-Kontext für den Bereich `/konto` (Plan, Häuser, Manager). */
export type AccountContext = {
  userId: string
  accountId: string
  accountName: string
  plan: string
  displayName: string
  /** Anlegedatum des Kontos — bestimmt den freien Kalendermonat (`isFreePeriod`). */
  createdAt: Date
}

/**
 * Nur für Kontoinhaber. `/konto` liegt außerhalb von `/h/<slug>/` und ist
 * damit eine **zweite Auth-Fläche** — sie braucht diesen eigenen Guard, das
 * Hotel-Layout schützt dort nichts.
 */
export const getAccountContext = cache(async (): Promise<AccountContext | null> => {
  const userId = await getAuthUserId()
  if (!userId) return null

  const admin = createAdminClient()
  const { data: membership } = await admin
    .from('account_members')
    .select('account_id, display_name, accounts(name, plan, created_at)')
    .eq('user_id', userId)
    .eq('role', 'owner')
    .limit(1)
    .maybeSingle()

  if (!membership) return null
  const account = membership.accounts as unknown as
    { name: string; plan: string; created_at: string } | null

  return {
    userId,
    accountId: membership.account_id,
    accountName: account?.name ?? 'Konto',
    plan: account?.plan ?? 'trial',
    displayName: membership.display_name,
    createdAt: new Date(account?.created_at ?? 0),
  }
})
