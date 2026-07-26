'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/service'
import { slugify, uniqueSlug } from '@/lib/slug'
import { DEFAULT_PIN_LENGTH } from '@/lib/ids'
import serviceTemplates from '@/lib/service-templates.json'

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
  const erwartet = (process.env.SIGNUP_INVITE_CODE ?? '').trim()
  if (!erwartet) {
    return { error: 'Die Registrierung ist derzeit nicht freigeschaltet.' }
  }
  if (code !== erwartet) {
    return { error: 'Einladungscode stimmt nicht.' }
  }

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

  /** Alles wieder abräumen, was dieser Aufruf erzeugt hat. */
  const rollback = async (accountId?: string) => {
    // Konto zuerst: die Kaskade nimmt Haus, Zimmer und Services mit.
    if (accountId) await admin.from('accounts').delete().eq('id', accountId)
    // Auth-User kaskadiert auf profiles und account_members.
    await admin.auth.admin.deleteUser(userId)
  }

  // ── 2) Konto ─────────────────────────────────────────────────────────────
  const { data: account, error: accErr } = await admin
    .from('accounts')
    .insert({ name: hotelName })
    .select('id')
    .single()
  if (accErr || !account) {
    await rollback()
    return { error: `Konto konnte nicht angelegt werden: ${accErr?.message}` }
  }

  // ── 3) Erstes Haus. Slugs sind GLOBAL eindeutig (sie sind der URL-
  //       Schlüssel), deshalb ohne Konto-Filter gegen alle bestehenden prüfen.
  const { data: existing } = await admin.from('hotels').select('slug')
  const slug = uniqueSlug(slugify(hotelName), (existing ?? []).map(h => h.slug))

  const { data: hotel, error: hotelErr } = await admin
    .from('hotels')
    .insert({
      name: hotelName,
      slug,
      account_id: account.id,
      policies: { pinLength: DEFAULT_PIN_LENGTH },
    })
    .select('id')
    .single()
  if (hotelErr || !hotel) {
    await rollback(account.id)
    return { error: `Haus konnte nicht angelegt werden: ${hotelErr?.message}` }
  }

  // ── 4) Profil. PFLICHT auch für Management: stays.created_by und
  //       service_orders.done_by zeigen darauf. hotel_id = Stammhaus.
  const { error: profileErr } = await admin
    .from('profiles')
    .insert({ id: userId, hotel_id: hotel.id, display_name: displayName })
  if (profileErr) {
    await rollback(account.id)
    return { error: `Profil konnte nicht angelegt werden: ${profileErr.message}` }
  }

  // ── 5) Inhaberschaft. Hier hängt die Berechtigung, nicht am Profil.
  const { error: memberErr } = await admin
    .from('account_members')
    .insert({ account_id: account.id, user_id: userId, role: 'owner', display_name: displayName })
  if (memberErr) {
    await rollback(account.id)
    return { error: `Inhaber konnte nicht eingetragen werden: ${memberErr.message}` }
  }

  // ── 6) Beispiel-Services. Nicht fatal: ein Haus ohne Services ist nutzbar,
  //       der Konfigurator bietet „Beispiel-Services anlegen" erneut an.
  for (const t of serviceTemplates) {
    const { data: svc } = await admin
      .from('service_definitions')
      .insert({ hotel_id: hotel.id, name: t.name, description: t.description, urgent: t.urgent })
      .select('id')
      .single()
    if (svc && t.items.length > 0) {
      await admin.from('service_items').insert(
        t.items.map((i, idx) => ({
          service_id: svc.id,
          hotel_id: hotel.id,
          label: i.label,
          price_cents: i.price_cents,
          sort_order: idx,
        })),
      )
    }
  }

  // ── 7) Anmelden. Über den Cookie-gebundenen Client, damit die Sitzung
  //       genauso gesetzt wird wie bei der normalen Anmeldung.
  const supabase = await createClient()
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
  if (signInErr) {
    // Das Konto steht — nur die Sitzung fehlt. Kein Rollback, sonst wäre die
    // Registrierung wegen einer Nebensache verloren.
    return { error: 'Konto angelegt, aber die Anmeldung schlug fehl. Bitte über die Anmeldeseite einloggen.' }
  }

  // redirect() wirft intern — bewusst außerhalb jeder Fehlerbehandlung.
  redirect(`/h/${slug}/admin/zimmer`)
}
