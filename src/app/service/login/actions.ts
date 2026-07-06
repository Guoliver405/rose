'use server'

import { redirect } from 'next/navigation'
import { createServicePortalClient } from '@/utils/supabase/service-portal'
import { createAdminClient } from '@/utils/supabase/service'
import { buildMaidEmail, normalizeUsername } from '@/lib/maid'

/**
 * Maid-Login mit Benutzername + PIN (svc_-Cookies).
 *
 * Single-Property-UI: der Benutzername wird über den Admin-Client zum Hotel
 * aufgelöst (das Schema erlaubt denselben Username in mehreren Hotels —
 * die UI hat aber genau eines). Fehlermeldung bleibt generisch.
 */
export async function maidLoginAction(formData: FormData): Promise<void> {
  const username = normalizeUsername((formData.get('username') as string) ?? '')
  const pin = ((formData.get('pin') as string) ?? '').trim()

  if (!username || !pin) redirect('/service/login?error=missing')

  const admin = createAdminClient()
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, hotel_id')
    .eq('username', username)
    .limit(1)

  const profile = profiles?.[0]
  if (!profile) redirect('/service/login?error=invalid')

  const supabase = await createServicePortalClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: buildMaidEmail(username, profile.hotel_id),
    password: pin,
  })
  if (error) redirect('/service/login?error=invalid')

  redirect('/service')
}

export async function maidLogoutAction(): Promise<void> {
  const supabase = await createServicePortalClient()
  await supabase.auth.signOut()
  redirect('/service/login')
}
