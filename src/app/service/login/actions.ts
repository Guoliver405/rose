'use server'

import { redirect } from 'next/navigation'
import { createServicePortalClient } from '@/utils/supabase/service-portal'
import { createAdminClient } from '@/utils/supabase/service'
import { buildMaidEmail, normalizeUsername } from '@/lib/maid'

/**
 * Maid-Login mit Benutzername + PIN (svc_-Cookies).
 *
 * Der Benutzername ist nur JE HOTEL eindeutig (`unique (hotel_id, username)`),
 * und alle Mandanten teilen sich dieselbe Login-Seite — „maria" kann es also
 * mehrfach geben. Früher nahm der Login das erstbeste Profil und baute daraus
 * die synthetische E-Mail; lag es im falschen Hotel, wurde die Anmeldung trotz
 * korrekter PIN abgewiesen. Deshalb entscheidet jetzt die PIN, welcher Zugang
 * gemeint ist: erst über die gespeicherte Karten-PIN vorsortieren, dann der
 * Reihe nach anmelden. (Kollidieren Username UND PIN in zwei Hotels, gewinnt
 * der erste Treffer — bei 6-stelliger PIN vernachlässigbar.)
 *
 * Fehlermeldung bleibt in jedem Fall generisch.
 */
export async function maidLoginAction(formData: FormData): Promise<void> {
  const username = normalizeUsername((formData.get('username') as string) ?? '')
  const pin = ((formData.get('pin') as string) ?? '').trim()

  if (!username || !pin) redirect('/service/login?error=missing')

  const admin = createAdminClient()
  // Deaktivierte Kräfte fallen schon hier raus — generisch, ohne Hinweis.
  const { data: candidates } = await admin
    .from('profiles')
    .select('id, hotel_id')
    .eq('username', username)
    .is('deactivated_at', null)
    .limit(10)

  if (!candidates || candidates.length === 0) redirect('/service/login?error=invalid')

  let ordered = candidates
  if (candidates.length > 1) {
    // Ein Query statt mehrerer Auth-Roundtrips: die Karten-PIN ist identisch
    // mit dem Auth-Passwort, taugt also zur Vorauswahl. Kräfte ohne Karte
    // bleiben als Fallback hinten in der Liste.
    const { data: byPin } = await admin
      .from('maid_login_tokens')
      .select('profile_id')
      .eq('pin', pin)
      .in('profile_id', candidates.map(c => c.id))
    const treffer = new Set((byPin ?? []).map(r => r.profile_id))
    ordered = [
      ...candidates.filter(c => treffer.has(c.id)),
      ...candidates.filter(c => !treffer.has(c.id)),
    ]
  }

  const supabase = await createServicePortalClient()
  let angemeldet = false
  for (const kandidat of ordered) {
    const { error } = await supabase.auth.signInWithPassword({
      email: buildMaidEmail(username, kandidat.hotel_id),
      password: pin,
    })
    if (!error) { angemeldet = true; break }
  }
  if (!angemeldet) redirect('/service/login?error=invalid')

  redirect('/service')
}

export async function maidLogoutAction(): Promise<void> {
  const supabase = await createServicePortalClient()
  await supabase.auth.signOut()
  redirect('/service/login')
}
