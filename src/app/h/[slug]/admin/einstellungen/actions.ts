'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/service'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext, getManagementContext } from '@/utils/auth'
import { clampPinLength } from '@/lib/ids'
import { clampStaleMinutes } from '@/lib/board'
import { isValidSlug, SLUG_MAX_LENGTH } from '@/lib/slug'

type ActionResult = { error?: string }

/**
 * Hotelname + Adresse (Slug) + Policies speichern. Policies werden gemergt
 * (nicht ersetzt), damit künftige Policy-Schlüssel nicht verloren gehen.
 */
export async function updateSettingsAction(slug: string, formData: FormData): Promise<ActionResult> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }

  const name = ((formData.get('hotelName') as string) ?? '').trim()
  if (name.length < 2) return { error: 'Hotelname muss mindestens 2 Zeichen haben.' }

  const newSlug = ((formData.get('slug') as string) ?? '').trim().toLowerCase()
  if (!isValidSlug(newSlug)) {
    return {
      error: `Die Adresse darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten (max. ${SLUG_MAX_LENGTH} Zeichen, nicht mit einem Bindestrich beginnen oder enden).`,
    }
  }

  const pinLength = clampPinLength(Number(formData.get('pinLength')))
  const cleaningStaleMinutes = clampStaleMinutes(Number(formData.get('cleaningStaleMinutes')))
  const stayoverAutoClean = formData.get('stayoverAutoClean') === 'on'
  const timeRaw = ((formData.get('stayoverAutoCleanTime') as string) ?? '').trim()
  if (stayoverAutoClean && !/^\d{1,2}:\d{2}$/.test(timeRaw)) {
    return { error: 'Uhrzeit für die Routine-Reinigung fehlt (z. B. 10:00).' }
  }

  const cleaningWindowEnabled = formData.get('cleaningWindowEnabled') === 'on'
  const windowStartRaw = ((formData.get('cleaningWindowStart') as string) ?? '').trim()
  const windowEndRaw = ((formData.get('cleaningWindowEnd') as string) ?? '').trim()
  if (cleaningWindowEnabled) {
    if (!/^\d{1,2}:\d{2}$/.test(windowStartRaw) || !/^\d{1,2}:\d{2}$/.test(windowEndRaw)) {
      return { error: 'Für das Reinigungs-Zeitfenster fehlen Start- und Endzeit.' }
    }
    if (windowStartRaw === windowEndRaw) {
      return { error: 'Start- und Endzeit des Zeitfensters dürfen nicht gleich sein.' }
    }
  }

  const admin = createAdminClient()

  // Der Slug ist global eindeutig (er IST die Mandanten-Kennung in der URL) —
  // hier bewusst OHNE hotel_id-Filter, dafür mit Ausschluss des eigenen Hauses.
  const { data: taken } = await admin
    .from('hotels').select('id').eq('slug', newSlug).neq('id', ctx.hotelId).maybeSingle()
  if (taken) return { error: 'Diese Adresse ist bereits vergeben.' }

  const { data: hotel } = await admin
    .from('hotels').select('policies').eq('id', ctx.hotelId).single()

  const merged = {
    ...((hotel?.policies ?? {}) as Record<string, unknown>),
    pinLength,
    cleaningStaleMinutes,
    stayoverAutoClean,
    ...(timeRaw ? { stayoverAutoCleanTime: timeRaw } : {}),
    cleaningWindowEnabled,
    ...(windowStartRaw ? { cleaningWindowStart: windowStartRaw } : {}),
    ...(windowEndRaw ? { cleaningWindowEnd: windowEndRaw } : {}),
  }

  const { error } = await admin
    .from('hotels')
    .update({ name, slug: newSlug, policies: merged })
    .eq('id', ctx.hotelId)
  if (error) return { error: error.message }

  // Die Portalseiten unter /h/<slug> sind durchweg dynamisch (Cookie-Zugriff),
  // haben also keinen Full-Route-Cache, der nach einer Umbenennung veralten
  // könnte — hier reicht das Admin-Layout.
  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')

  // Adresse geändert → die aktuelle URL zeigt ins Leere. Weiterleiten, statt
  // den Nutzer auf einer toten Route stehen zu lassen.
  if (newSlug !== ctx.hotelSlug) redirect(`/h/${newSlug}/admin/einstellungen/hotel`)
  return {}
}

/** Passwort des eingeloggten Management-Users ändern (Supabase Auth). */
export async function changePasswordAction(slug: string, formData: FormData): Promise<ActionResult> {
  const ctx = await getManagementContext(slug)
  if (!ctx) return { error: 'Nicht angemeldet.' }

  const password = (formData.get('password') as string) ?? ''
  const confirm = (formData.get('passwordConfirm') as string) ?? ''
  if (password.length < 8) return { error: 'Passwort braucht mindestens 8 Zeichen.' }
  if (password !== confirm) return { error: 'Passwörter stimmen nicht überein.' }

  // Über den Session-Client (nicht Admin) — ändert den eigenen Account.
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    if (error.code === 'same_password') return { error: 'Das ist bereits dein aktuelles Passwort.' }
    return { error: error.message }
  }
  return {}
}
