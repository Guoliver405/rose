'use server'

import { createAdminClient } from '@/utils/supabase/service'
import { confirmUrl, mailReady, recoveryFlooded, sendRecoveryMail } from '@/utils/mail'

/*
 * Passwort vergessen — Schritt 1 von 2.
 *
 * Seit 12.09.2026 verschickt die Anwendung die Mail selbst: Supabase liefert
 * über `generateLink({ type: 'recovery' })` nur den `token_hash`, die Mail
 * geht über Resend (`sendRecoveryMail`) — derselbe Weg wie Einladung und
 * Gast-Zugang, mit Protokoll und Webhook-Rückmeldung. Vorher lief
 * `resetPasswordForEmail` über Supabase-SMTP, und ob die Mail ankam, wusste
 * niemand.
 *
 * Der Link führt auf `/auth/confirm` (Hash hängt am Konto, nicht am Browser)
 * und von dort auf `/passwort-neu`. Er lässt sich also auf jedem Gerät
 * öffnen — der PKCE-Umweg über `/auth/callback` ist Geschichte.
 *
 * **Unbekannte Adressen melden KEINEN Fehler** und keinen Status — die Seite
 * ist öffentlich, und jede Abweichung in der Antwort verriete, ob es zu einer
 * Adresse ein Konto gibt. Deshalb bekommt diese Seite als einzige nur den
 * Countdown, nicht die Zustellbestätigung (die gäbe es nur für existierende
 * Konten). Aus demselben Grund läuft die Minuten-Drossel je Konto still: wer
 * innerhalb der Minute erneut anfordert, sieht dieselbe Bestätigung, ohne dass
 * eine zweite Mail entsteht.
 */

export async function requestPasswordResetAction(
  formData: FormData,
): Promise<{ error?: string; sent?: boolean }> {
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { error: 'Bitte eine gültige E-Mail-Adresse angeben.' }
  }
  if (!mailReady()) {
    return { error: 'Der Mailversand ist nicht eingerichtet. Bitte an den Betreiber wenden.' }
  }

  // Notbremse gegen das Leeren des Kontingents über die öffentliche Seite.
  if (await recoveryFlooded()) {
    console.error('[passwort-vergessen] Flutschutz aktiv — nicht verschickt')
    return { sent: true }
  }

  const admin = createAdminClient()
  const { data: link, error } = await admin.auth.admin.generateLink({ type: 'recovery', email })
  const tokenHash = link?.properties?.hashed_token
  const userId = link?.user?.id

  if (error || !tokenHash || !userId) {
    // Kein Konto zu dieser Adresse: wie Erfolg antworten (siehe oben). Alles
    // andere ist eine echte Störung und gehört ins Log.
    const text = (error?.message ?? '').toLowerCase()
    if (!text.includes('not found') && !text.includes('user')) {
      console.error('[generateLink recovery]', { status: error?.status, code: error?.code, message: error?.message })
    }
    return { sent: true }
  }

  const mail = await sendRecoveryMail({
    to: email,
    userId,
    url: confirmUrl(tokenHash, 'recovery', '/passwort-neu'),
  })
  // Drossel (`wait`) wird still geschluckt — siehe Kopfkommentar. Ein echter
  // Versandfehler dagegen ist keine Kontoauskunft und darf gesagt werden.
  if (mail.error && !mail.wait) {
    return { error: mail.error }
  }
  return { sent: true }
}
