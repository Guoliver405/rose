import { redirect } from 'next/navigation'
import { getManagementContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import OrdersBoard, { type OrderRow } from './OrdersBoard'

export default async function BestellungenPage() {
  const ctx = await getManagementContext()
  if (!ctx) redirect('/login')

  const supabase = await createClient()
  const [{ data: orders }, { data: services }, { data: rooms }, { data: profiles }] =
    await Promise.all([
      // Offene zuerst (älteste oben — FIFO), dazu die letzten Erledigten
      supabase
        .from('service_orders')
        .select('id, room_id, service_id, items_snapshot, note, status, created_at, done_at, done_by')
        .order('created_at', { ascending: true }),
      supabase.from('service_definitions').select('id, name, urgent'),
      supabase.from('rooms').select('id, number'),
      supabase.from('profiles').select('id, display_name'),
    ])

  const serviceById = new Map((services ?? []).map(s => [s.id, s]))
  const roomById = new Map((rooms ?? []).map(r => [r.id, r.number]))
  const nameById = new Map((profiles ?? []).map(p => [p.id, p.display_name]))

  const toRow = (o: NonNullable<typeof orders>[number]): OrderRow => {
    const service = serviceById.get(o.service_id)
    return {
      id: o.id,
      roomNumber: roomById.get(o.room_id) ?? '?',
      serviceName: service?.name ?? 'Service',
      urgent: service?.urgent ?? false,
      items: ((o.items_snapshot ?? []) as { label: string; price_cents: number | null }[]),
      note: o.note,
      createdAt: o.created_at,
      doneAt: o.done_at,
      doneBy: o.done_by ? (nameById.get(o.done_by) ?? '—') : null,
    }
  }

  const all = orders ?? []
  const open = all.filter(o => o.status === 'open').map(toRow)
  const done = all
    .filter(o => o.status === 'done')
    .sort((a, b) => (b.done_at ?? '').localeCompare(a.done_at ?? ''))
    .slice(0, 20)
    .map(toRow)

  return <OrdersBoard open={open} done={done} />
}
