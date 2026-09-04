import { cache } from 'react'
import {
  createServicePortalClient,
  getServicePortalSession,
} from '@/utils/supabase/service-portal'
import { createAdminClient } from '@/utils/supabase/service'

export type MaidContext = {
  profileId: string
  hotelId: string
  displayName: string
  username: string
  hotelName: string
  /** Mandant in der URL — für Redirects nach `/h/<slug>/service/…`. */
  hotelSlug: string
  policies: Record<string, unknown>
  /** Access-Token der svc_-Session — fürs Realtime-Auth im Browser (RLS). */
  accessToken: string
}

/**
 * Liefert den eingeloggten Reinigungs-Kontext (svc_-Cookies) — oder `null`,
 * wenn niemand angemeldet ist oder der User keine Reinigungskraft ist
 * (username NULL = Management gehört nicht ins Service-Portal).
 *
 * Profil + Hotel werden über den Admin-Client geladen (das Board braucht
 * ohnehin Daten jenseits der Maid-RLS, z. B. fremde display_names) — in
 * EINER Abfrage über die Fremdschlüssel-Einbettung `hotels(...)`, statt
 * Profil und Haus nacheinander zu holen. `cache` dedupliziert je Request.
 */
export const getMaidContext = cache(async (): Promise<MaidContext | null> => {
  const supabase = await createServicePortalClient()
  const { session } = await getServicePortalSession(supabase)
  if (!session?.user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('hotel_id, display_name, username, deactivated_at, hotels(name, slug, policies)')
    .eq('id', session.user.id)
    .maybeSingle()

  // Deaktivierte Kräfte fliegen auch aus einer bestehenden Session — der
  // Check hier ist die eigentliche Sperre, nicht der Login-Pfad.
  if (!profile || profile.username === null || profile.deactivated_at) return null

  // Der FK-Join kommt je nach Supabase-Version als Objekt oder Array zurück.
  const hotel = (Array.isArray(profile.hotels) ? profile.hotels[0] : profile.hotels) as
    | { name: string | null; slug: string; policies: unknown }
    | null
    | undefined
  if (!hotel) return null

  return {
    profileId: session.user.id,
    hotelId: profile.hotel_id,
    displayName: profile.display_name,
    username: profile.username,
    hotelName: hotel.name ?? 'Hotel',
    hotelSlug: hotel.slug,
    policies: (hotel.policies ?? {}) as Record<string, unknown>,
    accessToken: session.access_token,
  }
})
