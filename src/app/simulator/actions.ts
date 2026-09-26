'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getSimContext } from '@/utils/auth'
import { currentIpHash } from '@/utils/login-throttle'
import { convertSimAccount, deleteSimAccount, registerSimAccount, resendSimConfirmation, setSimMarketing } from '@/utils/sim-account'
import { MAX_ROOMS_AT_SIGNUP, checkInviteCode } from '@/utils/hotel-account'
import { policiesFromForm, roomsFromForm } from '@/lib/sim-convert'
import { einrichtungStart } from '@/lib/lotsen'
import type { Policy } from '@/lib/cleaning-sim'
import { parseSignup } from '@/lib/sim-account'
import { formFromSaved, toSaved, type SimForm } from '@/lib/sim-form'
import { deleteScenario, listScenarios, renameScenario, saveScenario, type ScenarioItem } from '@/utils/sim-scenarios'

/*
 * Aktionen des Housekeeping-Simulators (Phase 2, 26.09.2026). Die Logik steht
 * in `@/utils/sim-account`; hier nur Eingaben, Sitzung und Weiterleitung.
 */

export async function simSignupAction(formData: FormData): Promise<{ sent?: true; error?: string }> {
  const { input, error } = parseSignup(formData)
  if (!input) return { error }
  return registerSimAccount(input, await currentIpHash())
}

export async function simResendAction(email: string): Promise<{ sent?: true; error?: string }> {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return { error: 'Bitte eine gültige E-Mail-Adresse angeben.' }
  return resendSimConfirmation(email, await currentIpHash())
}

export async function simMarketingAction(on: boolean): Promise<{ error?: string }> {
  const ctx = await getSimContext()
  if (!ctx) return { error: 'Bitte erneut anmelden.' }
  return setSimMarketing(ctx.userId, on)
}

/** Bestätigungswort beim Löschen — die Oberfläche zeigt es, der Server prüft es. */
const DELETE_PHRASE = 'LÖSCHEN'

export async function simDeleteAccountAction(phrase: string): Promise<{ error?: string }> {
  const ctx = await getSimContext()
  if (!ctx) return { error: 'Bitte erneut anmelden.' }
  if (phrase.trim().toUpperCase() !== DELETE_PHRASE) return { error: `Bitte zur Bestätigung „${DELETE_PHRASE}“ eintippen.` }
  const res = await deleteSimAccount(ctx.userId)
  if (res.error) return { error: res.error }
  if (res.keptLogin) redirect('/simulator?geloescht=1')
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/?konto=geloescht')
}

export async function simLogoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/simulator')
}

// ── Szenarien (Phase 3) ─────────────────────────────────────────────────────

export async function listScenariosAction(): Promise<{ items?: ScenarioItem[]; error?: string }> {
  const ctx = await getSimContext()
  if (!ctx) return { error: 'Bitte erneut anmelden.' }
  return { items: await listScenarios(ctx.userId) }
}

export async function saveScenarioAction(name: string, form: SimForm, id?: string): Promise<{ id?: string; error?: string }> {
  const ctx = await getSimContext()
  if (!ctx) return { error: 'Bitte erneut anmelden.' }
  return saveScenario(ctx.userId, name, formFromSaved(toSaved(form)), id)
}

export async function renameScenarioAction(id: string, name: string): Promise<{ error?: string }> {
  const ctx = await getSimContext()
  if (!ctx) return { error: 'Bitte erneut anmelden.' }
  return renameScenario(ctx.userId, id, name)
}

export async function deleteScenarioAction(id: string): Promise<{ error?: string }> {
  const ctx = await getSimContext()
  if (!ctx) return { error: 'Bitte erneut anmelden.' }
  return deleteScenario(ctx.userId, id)
}

// ── Umwandlung in ein Hotelkonto (Phase 4) ──────────────────────────────────

export async function convertToHotelAction(input: {
  code: string
  hotelName: string
  displayName: string
  form: SimForm
  policy: Policy
  takeRooms: boolean
  takeRules: boolean
}): Promise<{ error?: string }> {
  const ctx = await getSimContext()
  if (!ctx) return { error: 'Bitte erneut anmelden.' }
  if (ctx.kind !== 'sim') return { error: 'Zu diesem Zugang gibt es bereits ein Hotelkonto.' }
  const codeError = checkInviteCode(input.code)
  if (codeError) return { error: codeError }
  const hotelName = input.hotelName.trim()
  const displayName = input.displayName.trim()
  if (hotelName.length < 2) return { error: 'Bitte den Namen des Hauses angeben.' }
  if (displayName.length < 2) return { error: 'Bitte Ihren Namen angeben.' }

  // Das Formular kommt aus dem Browser — durch dieselbe Prüfung wie gespeicherte Szenarien.
  const form = formFromSaved(toSaved(input.form))
  const rooms = input.takeRooms ? roomsFromForm(form) : undefined
  if (rooms && rooms.length > MAX_ROOMS_AT_SIGNUP) {
    return { error: `Höchstens ${MAX_ROOMS_AT_SIGNUP} Zimmer lassen sich direkt übernehmen — bitte ohne Zimmer umwandeln und sie im Zimmer-Setup anlegen.` }
  }
  const policies = input.takeRules ? policiesFromForm(form, input.policy === 'onDemand' ? 'onDemand' : 'routine') : undefined

  const res = await convertSimAccount(ctx.userId, { hotelName, displayName, rooms, policies })
  if (res.error || !res.slug) return { error: res.error ?? 'Das Hotelkonto konnte nicht angelegt werden.' }
  // Wie nach der Registrierung: mit Stripe erst der Zahlungsweg, sonst der Einrichtungs-Lotse.
  redirect(res.stripe ? `/admin/abrechnung/zahlungsweg?neu=${res.slug}` : einrichtungStart(res.slug))
}
