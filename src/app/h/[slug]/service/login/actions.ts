'use server'

import { redirect } from 'next/navigation'
import { createServicePortalClient } from '@/utils/supabase/service-portal'
import { createAdminClient } from '@/utils/supabase/service'
import { findHotelBySlug } from '@/utils/hotel'
import { buildMaidEmail, normalizeUsername } from '@/lib/maid'

/**
 * Maid-Login mit Benutzername + PIN (svc_-Cookies).
 *
 * Der Benutzername ist nur JE HOTEL eindeutig (`unique (hotel_id, username)`),
 * „maria" gibt es also mehrfach. Den Mandanten liefert der Slug aus der URL
 * (`/h/<slug>/service/login`) — damit bleibt genau ein Kandidat übrig und es
 * braucht genau einen Auth-Aufruf.
 *
 * Die frühere Zwischenlösung (Kandidaten über die Karten-PIN vorsortieren und
 * der Reihe nach anmelden) ist damit erledigt: sie war ein PIN-Orakel über
 * Mandantengrenzen hinweg und konnte im fremden Haus anmelden.
 *
 * Fehlermeldung bleibt in jedem Fall generisch.
 */
export async function maidLoginAction(formData: FormData): Promise<void> {
  const slug = ((formData.get('slug') as string) ?? '').trim().toLowerCase()
  const username = normalizeUsername((formData.get('username') as string) ?? '')
  const pin = ((formData.get('pin') as string) ?? '').trim()

  const hotel = await findHotelBySlug(slug)
  if (!hotel) redirect('/service/login')

  const loginUrl = `/h/${hotel.slug}/service/login`
  if (!username || !pin) redirect(`${loginUrl}?error=missing`)

  const admin = createAdminClient()
  // Deaktivierte Kräfte fallen schon hier raus — generisch, ohne Hinweis.
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('hotel_id', hotel.id)
    .eq('username', username)
    .is('deactivated_at', null)
    .maybeSingle()

  if (!profile) redirect(`${loginUrl}?error=invalid`)

  const supabase = await createServicePortalClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: buildMaidEmail(username, hotel.id),
    password: pin,
  })
  if (error) redirect(`${loginUrl}?error=invalid`)

  redirect(`/h/${hotel.slug}/service`)
}

export async function maidLogoutAction(formData: FormData): Promise<void> {
  const slug = ((formData.get('slug') as string) ?? '').trim().toLowerCase()
  const supabase = await createServicePortalClient()
  await supabase.auth.signOut()
  redirect(slug ? `/h/${slug}/service/login` : '/service/login')
}
