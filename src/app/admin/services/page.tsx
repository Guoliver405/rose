import { redirect } from 'next/navigation'
import { getManagementContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import ServicesManager, { type ServiceRow } from './ServicesManager'

export default async function ServicesPage() {
  const ctx = await getManagementContext()
  if (!ctx) redirect('/login')

  const supabase = await createClient()
  const [{ data: services }, { data: items }] = await Promise.all([
    supabase
      .from('service_definitions')
      .select('id, name, description, urgent')
      .is('archived_at', null)
      .order('name'),
    supabase
      .from('service_items')
      .select('id, service_id, label, price_cents')
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
    })
  }

  const rows: ServiceRow[] = (services ?? []).map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
    urgent: s.urgent,
    items: itemsByService.get(s.id) ?? [],
  }))

  return <ServicesManager services={rows} />
}
