/**
 * Zimmer-Lebenszyklus und Abrechnungs-Messgröße.
 *
 * Zimmer werden **deaktiviert statt gelöscht** — hartes Löschen kaskadiert auf
 * `room_guest_tokens`, `stays`, `room_states` und `service_orders` und macht
 * eine bereits abgerechnete Periode unrekonstruierbar. Dasselbe Muster wie
 * beim Personal (`profiles.deactivated_at`).
 */

/** Zeitraum einer Abrechnungsperiode (Ende exklusiv). */
export type BillingPeriod = { start: Date; end: Date }

/** Kalendermonat, in dem `ref` liegt. */
export function monthPeriod(ref: Date): BillingPeriod {
  return {
    start: new Date(ref.getFullYear(), ref.getMonth(), 1),
    end: new Date(ref.getFullYear(), ref.getMonth() + 1, 1),
  }
}

export type BillableRoom = {
  created_at: string
  deactivated_at: string | null
}

/**
 * Zählt die abrechenbaren Zimmer einer Periode.
 *
 * Regel: **wer in der Periode auch nur vorübergehend aktiv war, zählt.**
 * Ein Zimmer fällt also nur heraus, wenn es die ganze Periode über nicht
 * existierte oder durchgehend deaktiviert war. Ein mitten im Monat
 * deaktiviertes Zimmer zählt für diesen Monat noch.
 *
 * Reine Ableitung aus `created_at`/`deactivated_at` — kein Snapshot, kein Cron.
 */
export function countBillableRooms(rooms: BillableRoom[], period: BillingPeriod): number {
  return rooms.filter(r => isBillable(r, period)).length
}

export function isBillable(room: BillableRoom, period: BillingPeriod): boolean {
  // Erst nach dem Periodenende angelegt → zählt hier nicht.
  if (new Date(room.created_at) >= period.end) return false
  // Schon vor dem Periodenbeginn deaktiviert → war nie aktiv in der Periode.
  if (room.deactivated_at && new Date(room.deactivated_at) <= period.start) return false
  return true
}
