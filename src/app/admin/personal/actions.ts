'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/service'
import { getManagementContext } from '@/utils/auth'
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
export async function createMaidAction(formData: FormData): Promise<CreateMaidResult> {
  const ctx = await getManagementContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }

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

  revalidatePath('/admin', 'layout')
  return { card: { profileId: authUser.user.id, username, displayName, pin, token } }
}

/**
 * Neue Zugangskarte erzeugen: neue PIN + neuer Token in einem Schritt.
 * Die alte gedruckte Karte wird als Einheit ungültig (PIN = Auth-Passwort
 * wird ersetzt, Token wird per UPSERT überschrieben).
 */
export async function issueMaidLoginCardAction(
  profileId: string,
): Promise<{ card?: MaidLoginCard; error?: string }> {
  const ctx = await getManagementContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
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

  revalidatePath('/admin', 'layout')
  return {
    card: { profileId, username: profile.username, displayName: profile.display_name, pin, token },
  }
}

/** Reinigungskraft löschen (Auth-User → CASCADE räumt Profil + Karte ab). */
export async function deleteMaidAction(profileId: string): Promise<{ error?: string }> {
  const ctx = await getManagementContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }
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

  revalidatePath('/admin', 'layout')
  return {}
}
