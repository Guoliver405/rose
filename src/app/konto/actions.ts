'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/service'
import { getAccountContext } from '@/utils/auth'
import { slugify, uniqueSlug, isValidSlug } from '@/lib/slug'
import { DEFAULT_PIN_LENGTH } from '@/lib/ids'
import serviceTemplates from '@/lib/service-templates.json'

/*
 * Konto-Verwaltung: Häuser anlegen, Manager anlegen und Häusern zuordnen.
 *
 * ALLE Actions hier gaten auf `getAccountContext()` — den Kontoinhaber.
 * `/konto` liegt außerhalb von `/h/<slug>/` und wird deshalb von KEINEM
 * Hotel-Layout geschützt; jede Action braucht ihren eigenen Riegel.
 */

type Result = { error?: string }

/** Neues Haus im eigenen Konto. Slug wird aus dem Namen erzeugt. */
export async function createHotelAction(formData: FormData): Promise<Result & { slug?: string }> {
  const ctx = await getAccountContext()
  if (!ctx) return { error: 'Keine Berechtigung.' }

  const name = ((formData.get('name') as string) ?? '').trim()
  if (name.length < 2) return { error: 'Hotelname muss mindestens 2 Zeichen haben.' }

  const admin = createAdminClient()

  // Slugs sind GLOBAL eindeutig (sie sind der URL-Schlüssel) — deshalb hier
  // bewusst ohne Konto-Filter gegen alle bestehenden prüfen.
  const { data: existing } = await admin.from('hotels').select('slug')
  const slug = uniqueSlug(slugify(name), (existing ?? []).map(h => h.slug))

  const { data: hotel, error } = await admin
    .from('hotels')
    .insert({
      name,
      slug,
      account_id: ctx.accountId,
      policies: { pinLength: DEFAULT_PIN_LENGTH },
    })
    .select('id')
    .single()
  if (error) return { error: `Anlegen fehlgeschlagen: ${error.message}` }

  // Beispiel-Services seeden — gleiche Vorlagen wie beim Anlegen eines
  // Mandanten per Skript. Ganz normale Services, jederzeit archivierbar.
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

  revalidatePath('/konto')
  revalidatePath('/admin')
  return { slug }
}

/** Adresse (Slug) eines eigenen Hauses ändern. */
export async function renameHotelSlugAction(hotelId: string, rawSlug: string): Promise<Result> {
  const ctx = await getAccountContext()
  if (!ctx) return { error: 'Keine Berechtigung.' }

  const slug = rawSlug.trim().toLowerCase()
  if (!isValidSlug(slug)) return { error: 'Ungültige Adresse.' }

  const admin = createAdminClient()
  const { data: hotel } = await admin
    .from('hotels').select('id, account_id').eq('id', hotelId).maybeSingle()
  if (!hotel || hotel.account_id !== ctx.accountId) return { error: 'Haus nicht gefunden.' }

  const { data: taken } = await admin
    .from('hotels').select('id').eq('slug', slug).neq('id', hotelId).maybeSingle()
  if (taken) return { error: 'Diese Adresse ist bereits vergeben.' }

  const { error } = await admin.from('hotels').update({ slug }).eq('id', hotelId)
  if (error) return { error: error.message }

  revalidatePath('/konto')
  revalidatePath('/admin')
  return {}
}

export type ManagerCredentials = { email: string; password: string; displayName: string }

/**
 * Manager anlegen: E-Mail-Login + Zuordnung zu ausgewählten Häusern.
 *
 * Der Zugang wird heute mit vergebenem Passwort erzeugt (wie die
 * Rezeptions-Zugänge). Mittelfristig soll das auf Einladungs-Mails per Resend
 * umgestellt werden — siehe Sessions/Mehrere-Hotels-je-Konto-Plan.md.
 */
export async function createManagerAction(
  formData: FormData,
): Promise<Result & { credentials?: ManagerCredentials }> {
  const ctx = await getAccountContext()
  if (!ctx) return { error: 'Keine Berechtigung.' }

  const displayName = ((formData.get('displayName') as string) ?? '').trim()
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  const password = ((formData.get('password') as string) ?? '').trim()
  const hotelIds = formData.getAll('hotelIds').map(String).filter(Boolean)

  if (displayName.length < 2) return { error: 'Bitte einen Namen angeben.' }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'Bitte eine gültige E-Mail angeben.' }
  if (password.length < 8) return { error: 'Passwort braucht mindestens 8 Zeichen.' }
  if (hotelIds.length === 0) return { error: 'Bitte mindestens ein Haus auswählen.' }

  const admin = createAdminClient()

  // Nur eigene Häuser — die IDs kommen aus dem Formular, also ungeprüft.
  const { data: ownHotels } = await admin
    .from('hotels').select('id').eq('account_id', ctx.accountId).in('id', hotelIds)
  const allowed = (ownHotels ?? []).map(h => h.id)
  if (allowed.length !== hotelIds.length) return { error: 'Unbekanntes Haus in der Auswahl.' }

  const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authErr) return { error: `Zugang anlegen fehlgeschlagen: ${authErr.message}` }

  // profiles-Zeile ist PFLICHT, auch für Management: stays.created_by und
  // service_orders.done_by zeigen darauf. hotel_id = Stammhaus (erstes
  // zugeordnetes Haus) und ist NICHT maßgeblich für den Zugriff.
  const { error: profileErr } = await admin.from('profiles').insert({
    id: authUser.user.id,
    hotel_id: allowed[0],
    display_name: displayName,
  })
  if (profileErr) {
    await admin.auth.admin.deleteUser(authUser.user.id)
    return { error: `Profil anlegen fehlgeschlagen: ${profileErr.message}` }
  }

  const { error: memberErr } = await admin.from('hotel_members').insert(
    allowed.map(hotelId => ({
      hotel_id: hotelId,
      user_id: authUser.user.id,
      role: 'manager',
      display_name: displayName,
    })),
  )
  if (memberErr) {
    await admin.auth.admin.deleteUser(authUser.user.id)
    return { error: `Zuordnung fehlgeschlagen: ${memberErr.message}` }
  }

  revalidatePath('/konto')
  return { credentials: { email, password, displayName } }
}

/** Häuser eines Managers neu setzen (Teilmenge der eigenen Häuser). */
export async function setManagerHotelsAction(userId: string, hotelIds: string[]): Promise<Result> {
  const ctx = await getAccountContext()
  if (!ctx) return { error: 'Keine Berechtigung.' }

  const admin = createAdminClient()
  const { data: ownHotels } = await admin
    .from('hotels').select('id').eq('account_id', ctx.accountId)
  const own = new Set((ownHotels ?? []).map(h => h.id))
  const wanted = hotelIds.filter(id => own.has(id))
  if (wanted.length !== hotelIds.length) return { error: 'Unbekanntes Haus in der Auswahl.' }

  const { data: current } = await admin
    .from('hotel_members')
    .select('hotel_id, display_name')
    .eq('user_id', userId)
    .in('hotel_id', [...own])
  if (!current || current.length === 0) return { error: 'Manager nicht gefunden.' }

  const displayName = current[0].display_name
  const currentIds = new Set(current.map(c => c.hotel_id))
  const toAdd = wanted.filter(id => !currentIds.has(id))
  const toRemove = [...currentIds].filter(id => !wanted.includes(id))

  if (toAdd.length > 0) {
    const { error } = await admin.from('hotel_members').insert(
      toAdd.map(hotelId => ({ hotel_id: hotelId, user_id: userId, role: 'manager', display_name: displayName })),
    )
    if (error) return { error: error.message }
  }
  if (toRemove.length > 0) {
    // Entzug wirkt sofort: der profiles-Zweig der RLS gilt nur noch für
    // Reinigungskräfte, hier bleibt also keine Hintertür offen.
    const { error } = await admin
      .from('hotel_members').delete().eq('user_id', userId).in('hotel_id', toRemove)
    if (error) return { error: error.message }
  }

  revalidatePath('/konto')
  return {}
}

/**
 * Manager-Zugang entziehen: alle Zuordnungen im eigenen Konto entfernen.
 *
 * Das Auth-Konto wird nur dann wirklich gelöscht, wenn die Person **nichts
 * hinterlassen hat**. `profiles` ist das Ziel von `stays.created_by` und
 * `service_orders.done_by` (beide `on delete set null`) — ein hartes Löschen
 * risse sonst die Attribution aus Zimmer-Verlauf und Bestell-Historie.
 * Gleiche Abwägung wie beim Personal: Löschen ist der Notausgang für
 * Fehlanlagen, nicht der Normalweg.
 */
export async function removeManagerAction(
  userId: string,
): Promise<Result & { kept?: boolean }> {
  const ctx = await getAccountContext()
  if (!ctx) return { error: 'Keine Berechtigung.' }
  if (userId === ctx.userId) return { error: 'Der eigene Zugang lässt sich hier nicht entfernen.' }

  const admin = createAdminClient()
  const { data: ownHotels } = await admin
    .from('hotels').select('id').eq('account_id', ctx.accountId)
  const own = (ownHotels ?? []).map(h => h.id)

  const { data: rows } = await admin
    .from('hotel_members').select('hotel_id').eq('user_id', userId).in('hotel_id', own)
  if (!rows || rows.length === 0) return { error: 'Manager nicht gefunden.' }

  // Entzug wirkt sofort — die RLS kennt für Management keinen profiles-Zweig mehr.
  await admin.from('hotel_members').delete().eq('user_id', userId).in('hotel_id', own)

  const [{ data: rest }, { data: ownerElsewhere }, { data: stays }, { data: orders }, { data: log }] =
    await Promise.all([
      admin.from('hotel_members').select('hotel_id').eq('user_id', userId).limit(1),
      admin.from('account_members').select('account_id').eq('user_id', userId).limit(1),
      admin.from('stays').select('id').eq('created_by', userId).limit(1),
      admin.from('service_orders').select('id').eq('done_by', userId).limit(1),
      admin.from('staff_log').select('id').eq('profile_id', userId).limit(1),
    ])

  const hasHistory =
    (stays ?? []).length > 0 || (orders ?? []).length > 0 || (log ?? []).length > 0
  const stillUsed = (rest ?? []).length > 0 || (ownerElsewhere ?? []).length > 0

  if (!hasHistory && !stillUsed) {
    await admin.auth.admin.deleteUser(userId)
    revalidatePath('/konto')
    return {}
  }

  revalidatePath('/konto')
  // Zugang ist entzogen, der Datensatz bleibt als Nachweis stehen.
  return { kept: true }
}
