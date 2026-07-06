'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/service'
import { getManagementContext } from '@/utils/auth'
import { parseEuroToCents } from '@/lib/money'

type ActionResult = { error?: string }

/**
 * Service anlegen. Baukasten bewusst abgespeckt (siehe AGENTS.md):
 * nur urgent-Flag, Preise optional als Anzeige-Info.
 */
export async function createServiceAction(formData: FormData): Promise<ActionResult> {
  const ctx = await getManagementContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }

  const name = ((formData.get('name') as string) ?? '').trim()
  const description = ((formData.get('description') as string) ?? '').trim()
  const urgent = formData.get('urgent') === 'on'

  if (name.length < 2) return { error: 'Name muss mindestens 2 Zeichen haben.' }

  const admin = createAdminClient()
  const { error } = await admin.from('service_definitions').insert({
    hotel_id: ctx.hotelId,
    name,
    description: description || null,
    urgent,
  })
  if (error) return { error: error.message }

  revalidatePath('/admin', 'layout')
  return {}
}

/**
 * Service archivieren statt löschen: alte Orders referenzieren die
 * Definition (FK on delete restrict) — Archiv nimmt ihn nur aus Gast-
 * Portal und Konfigurator.
 */
export async function archiveServiceAction(serviceId: string): Promise<ActionResult> {
  const ctx = await getManagementContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('service_definitions')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', serviceId)
    .eq('hotel_id', ctx.hotelId)
  if (error) return { error: error.message }

  revalidatePath('/admin', 'layout')
  return {}
}

export async function setServiceUrgentAction(
  serviceId: string,
  urgent: boolean,
): Promise<ActionResult> {
  const ctx = await getManagementContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('service_definitions')
    .update({ urgent })
    .eq('id', serviceId)
    .eq('hotel_id', ctx.hotelId)
  if (error) return { error: error.message }

  revalidatePath('/admin', 'layout')
  return {}
}

export async function createServiceItemAction(
  serviceId: string,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await getManagementContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }

  const label = ((formData.get('label') as string) ?? '').trim()
  const priceRaw = ((formData.get('price') as string) ?? '').trim()

  if (label.length < 1) return { error: 'Bezeichnung fehlt.' }
  const priceCents = parseEuroToCents(priceRaw)
  if (priceRaw && priceCents === null) return { error: 'Preis nicht lesbar — z. B. „4,50" oder leer lassen.' }

  const admin = createAdminClient()
  const { data: service } = await admin
    .from('service_definitions')
    .select('id, hotel_id')
    .eq('id', serviceId)
    .maybeSingle()
  if (!service || service.hotel_id !== ctx.hotelId) return { error: 'Service nicht gefunden.' }

  const { error } = await admin.from('service_items').insert({
    service_id: serviceId,
    hotel_id: ctx.hotelId,
    label,
    price_cents: priceCents,
  })
  if (error) return { error: error.message }

  revalidatePath('/admin', 'layout')
  return {}
}

export async function archiveServiceItemAction(itemId: string): Promise<ActionResult> {
  const ctx = await getManagementContext()
  if (!ctx) return { error: 'Nicht angemeldet.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('service_items')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', itemId)
    .eq('hotel_id', ctx.hotelId)
  if (error) return { error: error.message }

  revalidatePath('/admin', 'layout')
  return {}
}
