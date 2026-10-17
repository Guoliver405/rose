import type { SupabaseClient } from '@supabase/supabase-js'
import serviceTemplates from '@/lib/service-templates.json'
import { templateForHome, type ServiceTemplate } from '@/lib/service-i18n'
import type { Locale } from '@/lib/i18n/locales'

/**
 * Beispiel-Services anlegen — die **eine** Stelle dafür (17.10.2026). Vorher
 * legten Registrierung, „Haus anlegen“ und der Baukasten sie je für sich an
 * und liefen auseinander: zwei von drei vergaßen das Kennzeichen „Meldung ans
 * Haus“ am Technischen Dienst.
 *
 * Grundtexte in der Heimatsprache des Hauses, die übrigen Produktsprachen als
 * Übersetzungen (`templateForHome`). Mit `skipExisting` werden vorhandene
 * Namen (auch archivierte) übersprungen.
 */
export async function seedExampleServices(
  admin: SupabaseClient,
  hotelId: string,
  home: Locale,
  opts: { skipExisting?: boolean } = {},
): Promise<{ created: number; error?: string }> {
  let existing = new Set<string>()
  if (opts.skipExisting) {
    const { data } = await admin.from('service_definitions').select('name').eq('hotel_id', hotelId)
    existing = new Set((data ?? []).map(s => (s.name as string).toLowerCase()))
  }

  let created = 0
  for (const raw of serviceTemplates as ServiceTemplate[]) {
    const t = templateForHome(raw, home)
    if (existing.has(t.name.toLowerCase())) continue
    const { data: svc, error } = await admin
      .from('service_definitions')
      .insert({
        hotel_id: hotelId, name: t.name, description: t.description, urgent: t.urgent,
        maintenance: t.maintenance, lang: t.lang, translations: t.translations,
      })
      .select('id')
      .single()
    if (error || !svc) return { created, error: error?.message ?? 'service_definitions' }
    if (t.items.length > 0) {
      const { error: itemErr } = await admin.from('service_items').insert(
        t.items.map((i, idx) => ({
          service_id: svc.id, hotel_id: hotelId, label: i.label, price_cents: i.price_cents,
          sort_order: idx, translations: i.translations,
        })),
      )
      if (itemErr) return { created, error: itemErr.message }
    }
    created++
  }
  return { created }
}
