'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/service'
import { getAdminContext } from '@/utils/auth'
import { parseEuroToCents } from '@/lib/money'
import serviceTemplates from '@/lib/service-templates.json'

type ActionResult = { error?: string }

/**
 * Beispiel-Services aus den Vorlagen anlegen (gleiche Quelle wie das
 * Neukunden-Seeding in scripts/create-tenant.mjs). Bereits vorhandene
 * Namen (auch archivierte) werden übersprungen — kein Doppel-Anlegen.
 */
export async function createExampleServicesAction(slug: string): Promise<ActionResult & { created?: number }> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('service_definitions')
    .select('name')
    .eq('hotel_id', ctx.hotelId)
  const existingNames = new Set((existing ?? []).map(s => s.name.toLowerCase()))

  let created = 0
  for (const t of serviceTemplates) {
    if (existingNames.has(t.name.toLowerCase())) continue
    const { data: svc, error } = await admin
      .from('service_definitions')
      .insert({ hotel_id: ctx.hotelId, name: t.name, description: t.description, urgent: t.urgent })
      .select('id')
      .single()
    if (error) return { error: error.message }
    if (t.items.length > 0) {
      const { error: itemErr } = await admin.from('service_items').insert(
        t.items.map((i, idx) => ({
          service_id: svc.id,
          hotel_id: ctx.hotelId,
          label: i.label,
          price_cents: i.price_cents,
          sort_order: idx,
        })),
      )
      if (itemErr) return { error: itemErr.message }
    }
    created++
  }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  if (created === 0) return { error: 'Die Beispiel-Services existieren bereits (ggf. archiviert).' }
  return { created }
}

/**
 * Service anlegen. Baukasten bewusst abgespeckt (siehe AGENTS.md):
 * nur urgent-Flag, Preise optional als Anzeige-Info.
 */
export async function createServiceAction(slug: string, formData: FormData): Promise<ActionResult> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }

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

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return {}
}

/**
 * Service archivieren statt löschen: alte Orders referenzieren die
 * Definition (FK on delete restrict) — Archiv nimmt ihn nur aus Gast-
 * Portal und Konfigurator.
 */
export async function archiveServiceAction(slug: string, serviceId: string): Promise<ActionResult> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('service_definitions')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', serviceId)
    .eq('hotel_id', ctx.hotelId)
  if (error) return { error: error.message }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return {}
}

export async function setServiceUrgentAction(
  slug: string,
  serviceId: string,
  urgent: boolean,
): Promise<ActionResult> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('service_definitions')
    .update({ urgent })
    .eq('id', serviceId)
    .eq('hotel_id', ctx.hotelId)
  if (error) return { error: error.message }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return {}
}

export async function createServiceItemAction(
  slug: string,
  serviceId: string,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }

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

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return {}
}

export async function archiveServiceItemAction(slug: string, itemId: string): Promise<ActionResult> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('service_items')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', itemId)
    .eq('hotel_id', ctx.hotelId)
  if (error) return { error: error.message }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return {}
}
