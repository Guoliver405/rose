'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/service'
import { getManagementContext } from '@/utils/auth'
import { getMessages } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'

async function messages() {
  const admin = getMessages(await getAdminLocale()).admin
  return { ...admin.common.errors, ...admin.overview.errors }
}

/** Bestellung abschließen — Lifecycle ist bewusst nur open → done. */
export async function markOrderDoneAction(slug: string, orderId: string): Promise<{ error?: string }> {
  const e = await messages()
  const ctx = await getManagementContext(slug)
  if (!ctx) return { error: e.notSignedIn }

  const admin = createAdminClient()
  const { data: updated, error } = await admin
    .from('service_orders')
    .update({
      status: 'done',
      done_at: new Date().toISOString(),
      done_by: ctx.userId,
    })
    .eq('id', orderId)
    .eq('hotel_id', ctx.hotelId)
    .eq('status', 'open') // Doppel-Klick/Race: zweiter Abschluss greift ins Leere
    .select('id')
  if (error) return { error: error.message }
  if (!updated || updated.length === 0) return { error: e.requestAlreadyDone }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  revalidatePath(`/h/${ctx.hotelSlug}/guest/status`)
  return {}
}
