'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { landingRoute } from '@/utils/auth'

/*
 * Passwort vergessen — Schritt 2 von 2.
 *
 * Der Nutzer ist an dieser Stelle bereits angemeldet: `/auth/callback` hat den
 * Code aus der Mail gegen eine Sitzung getauscht. Es braucht deshalb kein altes
 * Passwort, nur das neue — genau das ist der Sinn des Wegs.
 */
export async function setNewPasswordAction(
  formData: FormData,
): Promise<{ error?: string }> {
  const password = ((formData.get('password') as string) ?? '').trim()
  const confirm = ((formData.get('passwordConfirm') as string) ?? '').trim()

  if (password.length < 8) return { error: 'Passwort braucht mindestens 8 Zeichen.' }
  if (password !== confirm) return { error: 'Die beiden Passwörter stimmen nicht überein.' }

  const supabase = await createClient()

  // Ohne Sitzung ist der Link abgelaufen oder wurde in einem anderen Browser
  // geöffnet — dann hilft nur ein neuer.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Die Sitzung ist abgelaufen. Bitte einen neuen Link anfordern.' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    if (error.code === 'same_password') {
      return { error: 'Das ist bereits dein aktuelles Passwort. Bitte ein anderes wählen.' }
    }
    return { error: error.message }
  }

  // redirect() wirft intern — bewusst außerhalb jeder Fehlerbehandlung.
  redirect((await landingRoute()) ?? '/login')
}
