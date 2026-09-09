import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildStayBill, EMPTY_BILL,
  type BillOrderInput, type BillOrderStatus, type BillSnapshotItem, type StayBill,
} from '@/lib/stay-bill'

/**
 * Die Service-Anfragen EINES Aufenthalts laden und zur Aufstellung rechnen.
 *
 * Gebunden wird über `stay_id`, nicht über Zimmer plus Zeitfenster: Die Spalte
 * gibt es seit Schema v1, und sie ist die einzige Zuordnung, die auch bei zwei
 * Aufenthalten am selben Tag stimmt.
 *
 * Der Servicename kommt bevorzugt aus dem Snapshot der Bestellung; der Join ist
 * nur der Rückfall für Zeilen von vor dem 09.09.2026.
 */
export async function loadStayBill(
  admin: SupabaseClient,
  hotelId: string,
  stayId: string,
): Promise<StayBill> {
  const { data } = await admin
    .from('service_orders')
    .select('id, service_name, items_snapshot, note, status, created_at, done_at, service_definitions(name)')
    .eq('hotel_id', hotelId)
    .eq('stay_id', stayId)
    .order('created_at', { ascending: true })
    .limit(200)

  if (!data || data.length === 0) return EMPTY_BILL

  const orders: BillOrderInput[] = data.map(o => {
    // FK-Join kommt je nach Supabase-Version als Objekt oder Array zurück.
    const def = Array.isArray(o.service_definitions) ? o.service_definitions[0] : o.service_definitions
    return {
      id: o.id as string,
      serviceName: (o.service_name as string | null) ?? def?.name ?? 'Service',
      items: ((o.items_snapshot ?? []) as BillSnapshotItem[]),
      note: (o.note as string | null) ?? null,
      status: o.status as BillOrderStatus,
      createdAt: o.created_at as string,
      closedAt: (o.done_at as string | null) ?? null,
    }
  })

  return buildStayBill(orders)
}
