'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getPartnerContext } from '@/utils/auth'
import { becomePartner } from '@/utils/affiliate'
import { getMessages } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'

/*
 * Aktionen des Partnerbereichs (Partnerprogramm, 15.11.2026). Die Logik steht
 * in `@/utils/affiliate`; hier nur Sitzung, Eingaben und Weiterleitung.
 */

export async function becomePartnerAction(formData: FormData): Promise<{ error?: string }> {
  const e = getMessages(await getAdminLocale()).partner.errors
  const ctx = await getPartnerContext()
  if (!ctx) return { error: e.signInAgain }
  if (ctx.partner) { revalidatePath('/partner'); return {} }
  // Wer nur noch als Partner hier wäre, ist schon einer — alle anderen brauchen einen Zugang im Produkt oder Simulator.
  if (!ctx.home) return { error: e.notEligible }
  // Die Zustimmung prüft der Server; ein Häkchen im Browser ist keine.
  if (formData.get('terms') !== 'on') return { error: e.termsMissing }
  const res = await becomePartner(ctx.userId)
  if (res.error) return { error: e.failed }
  revalidatePath('/partner')
  return {}
}

export async function partnerLogoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
