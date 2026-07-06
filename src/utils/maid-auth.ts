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
 * ohnehin Daten jenseits der Maid-RLS, z. B. fremde display_names).
 */
export async function getMaidContext(): Promise<MaidContext | null> {
  const supabase = await createServicePortalClient()
  const { session } = await getServicePortalSession(supabase)
  if (!session?.user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('hotel_id, display_name, username')
    .eq('id', session.user.id)
    .maybeSingle()

  if (!profile || profile.username === null) return null

  const { data: hotel } = await admin
    .from('hotels')
    .select('name, policies')
    .eq('id', profile.hotel_id)
    .single()

  return {
    profileId: session.user.id,
    hotelId: profile.hotel_id,
    displayName: profile.display_name,
    username: profile.username,
    hotelName: hotel?.name ?? 'Hotel',
    policies: (hotel?.policies ?? {}) as Record<string, unknown>,
    accessToken: session.access_token,
  }
}
