'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/service'
import { einrichtungStart } from '@/lib/lotsen'
import { checkInviteCode, createHotelAccount } from '@/utils/hotel-account'

/*
 * Phase 6b — Self-Service-Registrierung.
 *
 * Ein Formular erzeugt in einem Zug: Auth-Zugang, Konto, erstes Haus, Profil,
 * Inhaber-Mitgliedschaft und die Beispiel-Services. Danach landet der Kunde
 * direkt im Zimmer-Setup — das kann Etagenbereiche, Nummernlisten und Präfixe
 * bereits und wird hier bewusst NICHT nachgebaut.
 *
 * ── Zwei bewusste Entscheidungen ───────────────────────────────────────────
 *
 * 1. **Einladungscode statt offener Registrierung.** Die Stage-URL ist
 *    öffentlich; ohne Riegel könnte jeder Mandanten in der Datenbank anlegen.
 *    Der Code steht in `SIGNUP_INVITE_CODE`. Fehlt die Variable, ist die
 *    Registrierung ZU — ein vergessenes Env-Var darf das Tor nicht öffnen.
 *
 * 2. **Kein E-Mail-Bestätigungslauf.** Der Zugang wird über die Admin-API mit
 *    `email_confirm: true` angelegt und sofort angemeldet. Damit hängt der
 *    Ablauf NICHT an der Projekt-Einstellung „Confirm email", und es wird
 *    keine Mail gebraucht — Supabases eingebauter Sender ist streng
 *    rate-limitiert und für den Betrieb ungeeignet. Sobald Resend angebunden
 *    ist, wird hier auf echtes `signUp()` mit Bestätigung umgestellt; der
 *    Einladungscode ist bis dahin der Ersatz für die Adressprüfung.
 *
 * Solange keine Mail rausgeht, gibt es auch **kein Passwort-Zurücksetzen** —
 * wer sein Passwort vergisst, braucht einen Eingriff. Das ist der Preis und
 * der Grund, Resend als nächsten Schritt zu nehmen.
 */

type Result = { error?: string }

const MIN_PASSWORT = 8

export async function signupAction(formData: FormData): Promise<Result> {
  const code = ((formData.get('code') as string) ?? '').trim()
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  const password = ((formData.get('password') as string) ?? '').trim()
  const hotelName = ((formData.get('hotelName') as string) ?? '').trim()
  const displayName = ((formData.get('displayName') as string) ?? '').trim()

  // ── Riegel ───────────────────────────────────────────────────────────────
  const codeError = checkInviteCode(code)
  if (codeError) return { error: codeError }

  // ── Eingaben ─────────────────────────────────────────────────────────────
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Bitte eine gültige E-Mail-Adresse angeben.' }
  if (password.length < MIN_PASSWORT) return { error: `Passwort braucht mindestens ${MIN_PASSWORT} Zeichen.` }
  if (hotelName.length < 2) return { error: 'Bitte den Namen des Hauses angeben.' }
  if (displayName.length < 2) return { error: 'Bitte Ihren Namen angeben.' }

  const admin = createAdminClient()

  // ── 1) Auth-Zugang. Zuerst, weil „E-Mail schon vergeben" der häufigste
  //       Abbruch ist — so gibt es davor nichts zurückzurollen.
  const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authErr || !authUser.user) {
    if (authErr?.message?.toLowerCase().includes('already')) {
      return { error: 'Für diese E-Mail-Adresse gibt es bereits ein Konto. Bitte anmelden.' }
    }
    return { error: authErr?.message ?? 'Zugang konnte nicht angelegt werden.' }
  }
  const userId = authUser.user.id

  // ── 2–7) Konto, Haus, Profil, Inhaberschaft, Beispiel-Services, Stripe-Kunde —
  //         gemeinsam mit der Umwandlung eines Simulator-Kontos (`createHotelAccount`).
  const created = await createHotelAccount({ userId, hotelName, displayName })
  if (created.error || !created.slug) {
    // Den Auth-Nutzer hat dieser Aufruf angelegt — also räumt er ihn auch ab.
    await admin.auth.admin.deleteUser(userId)
    return { error: created.error ?? 'Konto konnte nicht angelegt werden.' }
  }
  const slug = created.slug
  const mitStripe = created.stripe === true

  // ── 8) Anmelden. Über den Cookie-gebundenen Client, damit die Sitzung
  //       genauso gesetzt wird wie bei der normalen Anmeldung.
  const supabase = await createClient()
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
  if (signInErr) {
    // Das Konto steht — nur die Sitzung fehlt. Kein Rollback, sonst wäre die
    // Registrierung wegen einer Nebensache verloren.
    return { error: 'Konto angelegt, aber die Anmeldung schlug fehl. Bitte über die Anmeldeseite einloggen.' }
  }

  // redirect() wirft intern — bewusst außerhalb jeder Fehlerbehandlung.
  // Mit Stripe: Schritt 2 (Rechnungsdaten + Zahlungsweg), von dort ins
  // Zimmer-Setup; ohne Stripe direkt dorthin.
  redirect(mitStripe ? `/admin/abrechnung/zahlungsweg?neu=${slug}` : einrichtungStart(slug))
}
