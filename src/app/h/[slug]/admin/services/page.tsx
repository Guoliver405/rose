import { redirect } from 'next/navigation'
import { getAdminContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { getMessages, GUEST_LOCALES, intlLocale } from '@/lib/i18n'
import { parseItemTranslations, parseServiceTranslations, serviceLang } from '@/lib/service-i18n'
import { parseCurrency } from '@/lib/money'
import { getAdminLocale } from '@/utils/locale'
import { parseHomeLanguage } from '@/lib/i18n/locales'
import ServicesManager, { type ServiceRow } from './ServicesManager'

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // Service-Konfiguration ist Admin-Sache — Rezeption zur Übersicht.
  const ctx = await getAdminContext(slug)
  if (!ctx) redirect('/admin')

  const locale = await getAdminLocale()
  const admin = getMessages(locale).admin
  const supabase = await createClient()
  const [{ data: services }, { data: items }] = await Promise.all([
    supabase
      .from('service_definitions')
      .select('id, name, description, urgent, maintenance, link_url, price_cents, lang, translations')
      .eq('hotel_id', ctx.hotelId)
      .is('archived_at', null)
      .order('name'),
    supabase
      .from('service_items')
      .select('id, service_id, label, price_cents, translations')
      .eq('hotel_id', ctx.hotelId)
      .is('archived_at', null)
      .order('label'),
  ])

  const itemsByService = new Map<string, ServiceRow['items']>()
  for (const item of items ?? []) {
    if (!itemsByService.has(item.service_id)) itemsByService.set(item.service_id, [])
    itemsByService.get(item.service_id)!.push({
      id: item.id,
      label: item.label,
      priceCents: item.price_cents,
      translations: parseItemTranslations(item.translations),
    })
  }

  const rows: ServiceRow[] = (services ?? []).map(s => ({
    id: s.id,
    name: s.name,
    maintenance: s.maintenance ?? false,
    linkUrl: s.link_url ?? null,
    priceCents: (s.price_cents as number | null) ?? null,
    description: s.description,
    urgent: s.urgent,
    lang: serviceLang(s.lang),
    translations: parseServiceTranslations(s.translations),
    items: itemsByService.get(s.id) ?? [],
  }))

  // Vorlagen für Verweise: Name und Beschreibung werden zum Grundtext des
  // Service und stehen deshalb in der Heimatsprache des Hauses (wie die
  // Beispiel-Services); Regionen und Hinweise lesen nur Rezeption und
  // Management — in der Sprache der Oberfläche.
  const homeTemplates = getMessages(parseHomeLanguage(ctx.policies)).admin.services.linkTemplates
  const servicesMessages = {
    ...admin.services,
    linkTemplates: { ...admin.services.linkTemplates, names: homeTemplates.names, descriptions: homeTemplates.descriptions },
  }

  return (
    <ServicesManager
      hotelSlug={ctx.hotelSlug}
      services={rows}
      m={servicesMessages}
      common={admin.common}
      intlLocale={intlLocale(locale)}
      offered={GUEST_LOCALES}
      currency={parseCurrency(ctx.policies)}
    />
  )
}
