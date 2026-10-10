'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/service'
import { getAdminContext } from '@/utils/auth'
import { parseEuroToCents } from '@/lib/money'
import serviceTemplates from '@/lib/service-templates.json'
import { normalizeLinkUrl } from '@/lib/service-link-templates'
import { format, getMessages } from '@/lib/i18n'
import { getLocale } from '@/utils/locale'

/** Meldungen: eigene plus die gemeinsamen (`noPermission`). */
async function messages() {
  const admin = getMessages(await getLocale()).admin
  return { ...admin.common.errors, ...admin.services.errors }
}

type ActionResult = { error?: string }

/**
 * Adresse eines Verweises ändern — z. B. wenn die Trinkgeld-App ein neues
 * Konto bekommt. Nur für Verweise; ein bestellbarer Service wird nicht
 * nachträglich zum Link (dazu neu anlegen und den alten archivieren).
 */
export async function updateServiceLinkAction(slug: string, serviceId: string, rawUrl: string): Promise<ActionResult> {
  const e = await messages()
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: e.noPermission }

  const linkUrl = normalizeLinkUrl(rawUrl)
  if (!linkUrl) return { error: e.invalidUrl }

  const admin = createAdminClient()
  const { data: service } = await admin
    .from('service_definitions')
    .select('id, hotel_id, link_url')
    .eq('id', serviceId)
    .maybeSingle()
  if (!service || service.hotel_id !== ctx.hotelId) return { error: e.serviceNotFound }
  if (!service.link_url) return { error: e.notALink }

  const { error } = await admin
    .from('service_definitions')
    .update({ link_url: linkUrl })
    .eq('id', serviceId)
    .eq('hotel_id', ctx.hotelId)
  if (error) return { error: error.message }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return {}
}

/**
 * Beispiel-Services aus den Vorlagen anlegen (gleiche Quelle wie das
 * Neukunden-Seeding in scripts/create-tenant.mjs). Bereits vorhandene
 * Namen (auch archivierte) werden übersprungen — kein Doppel-Anlegen.
 */
export async function createExampleServicesAction(slug: string): Promise<ActionResult & { created?: number }> {
  const e = await messages()
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: e.noPermission }

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
      .insert({
        hotel_id: ctx.hotelId, name: t.name, description: t.description,
        urgent: t.urgent, maintenance: t.maintenance ?? false,
      })
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
  if (created === 0) return { error: e.examplesExist }
  return { created }
}

/**
 * Service anlegen. Baukasten bewusst abgespeckt (siehe AGENTS.md): zwei
 * Kennzeichen (`urgent`, `maintenance`), Preise optional.
 *
 * Die beiden Kennzeichen beantworten verschiedene Fragen und sind deshalb
 * unabhängig: `urgent` sagt, wie laut die Anfrage ist (blinkende Glocke),
 * `maintenance` sagt, wem sie gehört — dem Zimmer statt dem Aufenthalt.
 */
export async function createServiceAction(slug: string, formData: FormData): Promise<ActionResult> {
  const e = await messages()
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: e.noPermission }

  const name = ((formData.get('name') as string) ?? '').trim()
  const description = ((formData.get('description') as string) ?? '').trim()
  const isLink = formData.get('kind') === 'link'
  const urgent = !isLink && formData.get('urgent') === 'on'
  const maintenance = !isLink && formData.get('maintenance') === 'on'

  if (name.length < 2) return { error: format(e.nameTooShort, { min: 2 }) }

  // Verweis (16.09.2026): Kachel, die einen Link nach außen öffnet — keine
  // Anfrage, keine Optionen, keine Kennzeichen. Nur http(s), sonst könnte im
  // Gastportal ein `javascript:`-Ziel landen (die DB prüft das Schema mit).
  let linkUrl: string | null = null
  if (isLink) {
    linkUrl = normalizeLinkUrl((formData.get('link_url') as string) ?? '')
    if (!linkUrl) return { error: e.invalidUrl }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('service_definitions').insert({
    hotel_id: ctx.hotelId,
    name,
    description: description || null,
    urgent,
    maintenance,
    link_url: linkUrl,
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
  const e = await messages()
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: e.noPermission }

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
  const e = await messages()
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: e.noPermission }

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

/**
 * Instandhaltung an/aus. Wirkt nur nach vorn: Bereits geschlossene Anfragen
 * bleiben geschlossen, laufende folgen ab sofort der neuen Einordnung. Das
 * Kennzeichen entscheidet über das Verhalten beim Check-out, nicht über den
 * Inhalt eines alten Belegs — deshalb wird es (anders als der Name) nicht in
 * die Bestellung eingefroren.
 */
export async function setServiceMaintenanceAction(
  slug: string,
  serviceId: string,
  maintenance: boolean,
): Promise<ActionResult> {
  const e = await messages()
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: e.noPermission }

  const admin = createAdminClient()
  const { error } = await admin
    .from('service_definitions')
    .update({ maintenance })
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
  const e = await messages()
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: e.noPermission }

  const label = ((formData.get('label') as string) ?? '').trim()
  const priceRaw = ((formData.get('price') as string) ?? '').trim()

  if (label.length < 1) return { error: e.labelMissing }
  const priceCents = parseEuroToCents(priceRaw)
  if (priceRaw && priceCents === null) return { error: e.priceInvalid }

  const admin = createAdminClient()
  const { data: service } = await admin
    .from('service_definitions')
    .select('id, hotel_id')
    .eq('id', serviceId)
    .maybeSingle()
  if (!service || service.hotel_id !== ctx.hotelId) return { error: e.serviceNotFound }

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
  const e = await messages()
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: e.noPermission }

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
