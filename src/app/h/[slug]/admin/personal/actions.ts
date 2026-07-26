'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/service'
import { getAdminContext } from '@/utils/auth'
import { generatePin, generateToken } from '@/lib/ids'
import { buildMaidEmail, normalizeUsername } from '@/lib/maid'

export type MaidLoginCard = {
  profileId: string
  username: string
  displayName: string
  pin: string
  token: string
}

export type CreateMaidResult = { card?: MaidLoginCard; error?: string }

/**
 * Reinigungskraft anlegen: Auth-User (synthetische E-Mail, PIN als Passwort)
 * + Profil mit username-Discriminator + Login-Karte (Token + PIN als Einheit).
 */
export async function createMaidAction(slug: string, formData: FormData): Promise<CreateMaidResult> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }

  const displayName = ((formData.get('displayName') as string) ?? '').trim()
  const username = normalizeUsername((formData.get('username') as string) ?? '')

  if (displayName.length < 2) return { error: 'Name muss mindestens 2 Zeichen haben.' }
  if (username.length < 2) return { error: 'Benutzername muss mindestens 2 Zeichen haben (a–z, 0–9, . _ -).' }

  const pin = generatePin(6)
  const email = buildMaidEmail(username, ctx.hotelId)
  const admin = createAdminClient()

  const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
    email,
    password: pin,
    email_confirm: true, // keine Bestätigungs-E-Mail — Adresse ist synthetisch
  })
  if (authErr || !authUser.user) {
    if (authErr?.message?.includes('already')) {
      return { error: 'Benutzername bereits vergeben. Bitte anderen wählen.' }
    }
    return { error: authErr?.message ?? 'Konto konnte nicht erstellt werden.' }
  }

  const { error: profileErr } = await admin.from('profiles').insert({
    id: authUser.user.id,
    hotel_id: ctx.hotelId,
    display_name: displayName,
    username,
  })
  if (profileErr) {
    // Rollback: Auth-User ohne Profil wäre eine Leiche
    await admin.auth.admin.deleteUser(authUser.user.id)
    if (profileErr.code === '23505') {
      return { error: 'Benutzername bereits in diesem Hotel vergeben.' }
    }
    return { error: `Profil konnte nicht angelegt werden: ${profileErr.message}` }
  }

  // Login-Karte: Token + PIN als Einheit (UPSERT auf PK invalidiert bei
  // späteren Neudrucken die alte Karte).
  const token = generateToken(24)
  const { error: tokenErr } = await admin.from('maid_login_tokens').upsert(
    { profile_id: authUser.user.id, hotel_id: ctx.hotelId, token, pin },
    { onConflict: 'profile_id' },
  )
  if (tokenErr) {
    // Nicht-fatal: Login per Username + PIN funktioniert trotzdem;
    // Karte kann über "Neue Karte" nachgeholt werden.
    console.error('[maid_login_tokens] upsert fehlgeschlagen:', tokenErr.message)
  }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return { card: { profileId: authUser.user.id, username, displayName, pin, token } }
}

/**
 * Neue Zugangskarte erzeugen: neue PIN + neuer Token in einem Schritt.
 * Die alte gedruckte Karte wird als Einheit ungültig (PIN = Auth-Passwort
 * wird ersetzt, Token wird per UPSERT überschrieben).
 */
export async function issueMaidLoginCardAction(
  slug: string,
  profileId: string,
): Promise<{ card?: MaidLoginCard; error?: string }> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('id, hotel_id, username, display_name')
    .eq('id', profileId)
    .maybeSingle()
  if (!profile || profile.hotel_id !== ctx.hotelId) return { error: 'Profil nicht gefunden.' }
  if (!profile.username) return { error: 'Profil ist kein Reinigungs-Zugang.' }

  const pin = generatePin(6)
  const token = generateToken(24)

  const { error: pinErr } = await admin.auth.admin.updateUserById(profileId, { password: pin })
  if (pinErr) return { error: pinErr.message }

  const { error: tokenErr } = await admin.from('maid_login_tokens').upsert(
    { profile_id: profileId, hotel_id: ctx.hotelId, token, pin },
    { onConflict: 'profile_id' },
  )
  if (tokenErr) return { error: `Karte konnte nicht gespeichert werden: ${tokenErr.message}` }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return {
    card: { profileId, username: profile.username, displayName: profile.display_name, pin, token },
  }
}

/**
 * Reinigungskraft deaktivieren/reaktivieren — der Regelweg beim Ausscheiden.
 * Das Profil bleibt samt `staff_log` erhalten (Arbeitsnachweis!), Login per
 * Username+PIN und per QR-Karte wird abgewiesen. Die Login-Karte bleibt
 * absichtlich gespeichert: sie ist bei deaktiviertem Profil wirkungslos, und
 * eine Reaktivierung stellt den alten Zugang ohne Neudruck wieder her.
 */
export async function setMaidActiveAction(
  slug: string,
  profileId: string,
  active: boolean,
): Promise<{ error?: string }> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('id, hotel_id, username')
    .eq('id', profileId)
    .maybeSingle()
  if (!profile || profile.hotel_id !== ctx.hotelId) return { error: 'Profil nicht gefunden.' }
  if (!profile.username) return { error: 'Nur Reinigungskräfte können deaktiviert werden.' }

  if (!active) {
    const { data: cleaning } = await admin
      .from('room_states')
      .select('room_id')
      .eq('cleaning_by', profileId)
      .limit(1)
    if (cleaning && cleaning.length > 0) {
      return { error: 'Diese Kraft reinigt gerade ein Zimmer. Erst die Reinigung abschließen (oder im Board als erledigt markieren).' }
    }
  }

  const { error } = await admin
    .from('profiles')
    .update({ deactivated_at: active ? null : new Date().toISOString() })
    .eq('id', profileId)
  if (error) return { error: error.message }

  // Verortung endet mit der Deaktivierung.
  if (!active) await admin.from('maid_presence').delete().eq('profile_id', profileId)

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  revalidatePath(`/h/${ctx.hotelSlug}/service`)
  return {}
}

/**
 * Reinigungskraft endgültig löschen (Auth-User → CASCADE räumt Profil, Karte
 * UND staff_log ab). Notausgang für Fehlanlagen — beim Ausscheiden gehört
 * `setMaidActiveAction(id, false)` benutzt, sonst ist die Historie weg.
 */
export async function deleteMaidAction(slug: string, profileId: string): Promise<{ error?: string }> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('id, hotel_id, username')
    .eq('id', profileId)
    .maybeSingle()
  if (!profile || profile.hotel_id !== ctx.hotelId) return { error: 'Profil nicht gefunden.' }
  if (!profile.username) return { error: 'Management-Zugänge können hier nicht gelöscht werden.' }

  const { data: cleaning } = await admin
    .from('room_states')
    .select('room_id')
    .eq('cleaning_by', profileId)
    .limit(1)
  if (cleaning && cleaning.length > 0) {
    return { error: 'Diese Kraft ist gerade als reinigend eingetragen. Erst die Reinigung abschließen (oder im Board als erledigt markieren).' }
  }

  const { error } = await admin.auth.admin.deleteUser(profileId)
  if (error) return { error: error.message }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return {}
}

export type ReceptionCredentials = {
  profileId: string
  displayName: string
  email: string
  password: string
}

/**
 * Rezeptions-Zugang anlegen: E-Mail-Login, hausintern.
 *
 * Die Berechtigung steht seit Phase 6d in `hotel_members`; die `profiles`-
 * Zeile bleibt als Identitäts- und Fremdschlüssel-Anker nötig
 * (`stays.created_by`, `service_orders.done_by` zeigen darauf).
 *
 * Das generierte Passwort wird genau einmal angezeigt. Mittelfristig soll das
 * auf Einladungs-Mails per Resend umgestellt werden.
 */
export async function createReceptionAction(
  slug: string,
  formData: FormData,
): Promise<{ credentials?: ReceptionCredentials; error?: string }> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }

  const displayName = ((formData.get('displayName') as string) ?? '').trim()
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()

  if (displayName.length < 2) return { error: 'Name muss mindestens 2 Zeichen haben.' }
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Bitte eine gültige E-Mail-Adresse angeben.' }

  const password = generateToken(12)
  const admin = createAdminClient()

  const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // kein Bestätigungs-Flow — Zugang wird persönlich übergeben
  })
  if (authErr || !authUser.user) {
    if (authErr?.message?.includes('already')) {
      return { error: 'Diese E-Mail-Adresse ist bereits vergeben.' }
    }
    return { error: authErr?.message ?? 'Konto konnte nicht erstellt werden.' }
  }

  const { error: profileErr } = await admin.from('profiles').insert({
    id: authUser.user.id,
    hotel_id: ctx.hotelId,
    display_name: displayName,
  })
  if (profileErr) {
    // Rollback: Auth-User ohne Profil wäre eine Leiche
    await admin.auth.admin.deleteUser(authUser.user.id)
    return { error: `Profil konnte nicht angelegt werden: ${profileErr.message}` }
  }

  const { error: memberErr } = await admin.from('hotel_members').insert({
    hotel_id: ctx.hotelId,
    user_id: authUser.user.id,
    role: 'reception',
    display_name: displayName,
  })
  if (memberErr) {
    await admin.auth.admin.deleteUser(authUser.user.id)
    return { error: `Zuordnung konnte nicht angelegt werden: ${memberErr.message}` }
  }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return { credentials: { profileId: authUser.user.id, displayName, email, password } }
}

/**
 * Rezeptions-Zugang entziehen.
 *
 * Der Auth-User wird nur gelöscht, wenn die Person nichts hinterlassen hat —
 * `profiles` ist Ziel von `stays.created_by` und `service_orders.done_by`
 * (`on delete set null`), ein hartes Löschen risse sonst die Attribution aus
 * Zimmer-Verlauf und Bestell-Historie. Der Entzug der Berechtigung wirkt in
 * jedem Fall sofort: die RLS kennt für Management keinen profiles-Zweig mehr.
 */
export async function deleteReceptionAction(
  slug: string,
  profileId: string,
): Promise<{ error?: string; kept?: boolean }> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }
  const admin = createAdminClient()

  const { data: member } = await admin
    .from('hotel_members')
    .select('user_id, role')
    .eq('hotel_id', ctx.hotelId)
    .eq('user_id', profileId)
    .maybeSingle()
  if (!member || member.role !== 'reception') {
    return { error: 'Nur Rezeptions-Zugänge können hier entfernt werden.' }
  }

  await admin.from('hotel_members')
    .delete().eq('hotel_id', ctx.hotelId).eq('user_id', profileId)

  const [{ data: rest }, { data: owner }, { data: stays }, { data: orders }] = await Promise.all([
    admin.from('hotel_members').select('hotel_id').eq('user_id', profileId).limit(1),
    admin.from('account_members').select('account_id').eq('user_id', profileId).limit(1),
    admin.from('stays').select('id').eq('created_by', profileId).limit(1),
    admin.from('service_orders').select('id').eq('done_by', profileId).limit(1),
  ])

  const stillUsed = (rest ?? []).length > 0 || (owner ?? []).length > 0
  const hasHistory = (stays ?? []).length > 0 || (orders ?? []).length > 0

  if (!stillUsed && !hasHistory) {
    const { error } = await admin.auth.admin.deleteUser(profileId)
    if (error) return { error: error.message }
    revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
    return {}
  }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return { kept: true }
}
