'use server'

// ─────────────────────────────────────────────────────────────────────────────
// Aufstellung der Zusatzleistungen für den laufenden Aufenthalt eines Zimmers.
// Wird beim Öffnen des Zimmer-Dialogs nachgeladen — wie der Verlauf und aus
// demselben Grund: Im Board-Loader würde für jedes Zimmer eine Bestellhistorie
// gezogen, die in aller Regel niemand ansieht.
// ─────────────────────────────────────────────────────────────────────────────

import { createAdminClient } from '@/utils/supabase/service'
import { getManagementContext } from '@/utils/auth'
import { loadStayBill } from '@/utils/stay-bill'
import type { StayBill } from '@/lib/stay-bill'

export type RoomBillResult = { stayId?: string; bill?: StayBill; error?: string }

/** Aufstellung des aktiven Aufenthalts. Ohne Aufenthalt: leeres Ergebnis, kein Fehler. */
export async function getRoomBillAction(slug: string, roomId: string): Promise<RoomBillResult> {
  // Tagesgeschäft am Tresen — jede Rolle mit Zugang zum Haus, auch die Rezeption.
  const ctx = await getManagementContext(slug)
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const { data: stay } = await admin
    .from('stays')
    .select('id, hotel_id')
    .eq('room_id', roomId)
    .is('checked_out_at', null)
    .maybeSingle()
  if (!stay || stay.hotel_id !== ctx.hotelId) return {}

  return { stayId: stay.id, bill: await loadStayBill(admin, ctx.hotelId, stay.id) }
}
