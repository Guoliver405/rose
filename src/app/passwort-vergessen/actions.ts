'use server'

import { createClient } from '@/utils/supabase/server'

/*
 * Passwort vergessen — Schritt 1 von 2.
 *
 * Der Versand läuft NICHT über eigenen Code: `resetPasswordForEmail` weist
 * Supabase an, die Mail zu verschicken. Womit Supabase verschickt, ist eine
 * Projekt-Einstellung (Authentication → SMTP). Ohne hinterlegtes Custom-SMTP
 * greift Supabases eingebauter Sender — der ist streng rate-limitiert und für
 * den Betrieb nicht gedacht. Mit Resend als Custom SMTP funktioniert derselbe
 * Aufruf unverändert; darum steht hier keine Zeile Resend-Code.
 *
 * Der Link in der Mail führt über Supabase auf `/auth/callback`, das den Code
 * gegen eine Sitzung tauscht und auf `/passwort-neu` weiterleitet.
 */

/** Ziel des Links in der Mail. MUSS in Supabase unter Redirect URLs stehen. */
function callbackUrl(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  return `${base.replace(/\/+$/, '')}/auth/callback?next=/passwort-neu`
}

export async function requestPasswordResetAction(
  formData: FormData,
): Promise<{ error?: string; sent?: boolean }> {
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { error: 'Bitte eine gültige E-Mail-Adresse angeben.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl(),
  })

  if (error) {
    // Unbekannte Adressen melden KEINEN Fehler — Supabase antwortet dort
    // bewusst wie bei Erfolg, damit sich keine Konten ausprobieren lassen.
    // Was hier ankommt, sind echte Störungen: Rate-Limit oder SMTP.
    console.error('[resetPasswordForEmail]', error.message)
    const text = error.message.toLowerCase()

    if (text.includes('security purposes') || text.includes('rate limit')) {
      return { error: 'Zu viele Anfragen in kurzer Folge. Bitte eine Minute warten.' }
    }
    // Supabase lehnt manche Adressen schon vor dem Versand ab — u. a. nicht
    // routbare Endungen wie `.local`. Genau darauf laufen die Testzugänge
    // dieses Projekts hinaus; „später erneut versuchen" wäre irreführend.
    if (text.includes('invalid')) {
      return { error: 'Diese E-Mail-Adresse ist nicht zustellbar. Bitte die Schreibweise prüfen.' }
    }
    return { error: 'Die E-Mail konnte nicht verschickt werden. Bitte später erneut versuchen.' }
  }

  return { sent: true }
}
