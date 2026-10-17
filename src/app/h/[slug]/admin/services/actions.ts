'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/service'
import { getAdminContext } from '@/utils/auth'
import { parseCurrency, parsePriceToMinor, pricePlaceholder } from '@/lib/money'
import { seedExampleServices } from '@/utils/example-services'
import { normalizeLinkUrl } from '@/lib/service-link-templates'
import { parseItemTranslations, parseServiceTranslations, serviceLang } from '@/lib/service-i18n'
import { format, getMessages, isLocale, parseHomeLanguage } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'

/** Meldungen: eigene plus die gemeinsamen (`noPermission`). */
async function messages() {
  const admin = getMessages(await getAdminLocale()).admin
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

  const { created, error } = await seedExampleServices(
    createAdminClient(), ctx.hotelId, parseHomeLanguage(ctx.policies), { skipExisting: true },
  )
  if (error) return { error }

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
    // Grundtexte in der Heimatsprache des Hauses (17.10.2026).
    lang: parseHomeLanguage(ctx.policies),
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
  // Preis in der kleinsten Einheit der Währung des Hauses (Yen ohne Nachkommastellen).
  const currency = parseCurrency(ctx.policies)
  const priceCents = parsePriceToMinor(priceRaw, currency)
  if (priceRaw && priceCents === null) return { error: format(e.priceInvalid, { example: pricePlaceholder(currency) }) }

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

/**
 * Übersetzung eines Service in EINE Sprache speichern (17.10.2026): Name,
 * Beschreibung und die Beschriftungen aller aktiven Optionen. Das Haus
 * übersetzt selbst — leere Felder heißen „noch nicht übersetzt“, das
 * Gästeportal zeigt dann den Grundtext. Die Grundtexte bleiben unberührt.
 *
 * Formularfelder: `name`, `description`, je Option `item:<id>`.
 */
export async function updateServiceTranslationAction(
  slug: string,
  serviceId: string,
  locale: string,
  formData: FormData,
): Promise<ActionResult> {
  const e = await messages()
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: e.noPermission }
  if (!isLocale(locale)) return { error: e.unknownLanguage }

  const admin = createAdminClient()
  const [{ data: service }, { data: items }] = await Promise.all([
    admin.from('service_definitions').select('id, hotel_id, lang, translations').eq('id', serviceId).maybeSingle(),
    admin.from('service_items').select('id, translations').eq('service_id', serviceId).eq('hotel_id', ctx.hotelId).is('archived_at', null),
  ])
  if (!service || service.hotel_id !== ctx.hotelId) return { error: e.serviceNotFound }
  if (locale === serviceLang(service.lang)) return { error: e.unknownLanguage }

  const translations = parseServiceTranslations(service.translations)
  const next = parseServiceTranslations({ [locale]: { name: formData.get('name'), description: formData.get('description') } })
  if (next[locale]) translations[locale] = next[locale]
  else delete translations[locale]

  const { error } = await admin
    .from('service_definitions')
    .update({ translations })
    .eq('id', serviceId)
    .eq('hotel_id', ctx.hotelId)
  if (error) return { error: error.message }

  for (const item of items ?? []) {
    const itemTr = parseItemTranslations(item.translations)
    const label = parseItemTranslations({ [locale]: { label: formData.get(`item:${item.id}`) } })[locale]
    if (label) itemTr[locale] = label
    else delete itemTr[locale]
    const { error: itemErr } = await admin
      .from('service_items')
      .update({ translations: itemTr })
      .eq('id', item.id)
      .eq('hotel_id', ctx.hotelId)
    if (itemErr) return { error: itemErr.message }
  }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return {}
}
