'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/service'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext, getManagementContext } from '@/utils/auth'
import { clampPinLength } from '@/lib/ids'
import { clampStaleMinutes } from '@/lib/board'

type ActionResult = { error?: string }

/**
 * Hotelname + Policies speichern. Policies werden gemergt (nicht ersetzt),
 * damit künftige Policy-Schlüssel nicht verloren gehen.
 */
export async function updateSettingsAction(formData: FormData): Promise<ActionResult> {
  const ctx = await getAdminContext()
  if (!ctx) return { error: 'Keine Berechtigung.' }

  const name = ((formData.get('hotelName') as string) ?? '').trim()
  if (name.length < 2) return { error: 'Hotelname muss mindestens 2 Zeichen haben.' }

  const pinLength = clampPinLength(Number(formData.get('pinLength')))
  const cleaningStaleMinutes = clampStaleMinutes(Number(formData.get('cleaningStaleMinutes')))
  const stayoverAutoClean = formData.get('stayoverAutoClean') === 'on'
  const timeRaw = ((formData.get('stayoverAutoCleanTime') as string) ?? '').trim()
  if (stayoverAutoClean && !/^\d{1,2}:\d{2}$/.test(timeRaw)) {
    return { error: 'Uhrzeit für die Routine-Reinigung fehlt (z. B. 10:00).' }
  }

  const admin = createAdminClient()
  const { data: hotel } = await admin
    .from('hotels').select('policies').eq('id', ctx.hotelId).single()

  const merged = {
    ...((hotel?.policies ?? {}) as Record<string, unknown>),
    pinLength,
    cleaningStaleMinutes,
    stayoverAutoClean,
    ...(timeRaw ? { stayoverAutoCleanTime: timeRaw } : {}),
  }

  const { error } = await admin
    .from('hotels')
    .update({ name, policies: merged })
    .eq('id', ctx.hotelId)
  if (error) return { error: error.message }

  revalidatePath('/admin', 'layout')
  return {}
}

/** Passwort des eingeloggten Management-Users ändern (Supabase Auth). */
export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  const ctx = await getManagementContext()
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
