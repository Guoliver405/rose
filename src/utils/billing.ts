/**
 * Abrechnungs-Snapshots — Zimmerzahl abgeschlossener Perioden festschreiben.
 *
 * Die Abrechnung läuft je Zimmer nach der Regel „in der Periode auch nur
 * vorübergehend in Betrieb = zählt". Berechnet wurde das bisher live aus
 * `rooms.created_at` / `rooms.deactivated_at` — billig, ohne Cron, und
 * ausdrücklich unter einer Bedingung: *Zimmer dürfen nicht hart gelöscht
 * werden.* Seit dem 03.09.2026 ist Löschen ein regulärer Vorgang, und ein
 * gelöschtes Zimmer fehlte damit rückwirkend auch in abgeschlossenen Perioden.
 *
 * **Der Snapshot wird deshalb nicht periodisch geschrieben, sondern genau dann,
 * wenn eine Grundlage verschwinden würde** — unmittelbar vor dem Löschen von
 * Zimmern. Solange nichts gelöscht wird, ist die Live-Ableitung weiterhin
 * richtig, und es entsteht keine einzige Zeile. Kein Cron, kein Hintergrundlauf,
 * nichts, das vergessen werden kann: Wer die Grundlage anfasst, schreibt sie
 * vorher fest.
 *
 * Der **laufende** Monat wird nie festgeschrieben — er ist noch veränderlich.
 */

import { createAdminClient } from '@/utils/supabase/service'
import {
  closedMonthPeriods, countBillableRooms, isBillable, monthPeriod, periodKey,
  type BillableRoom,
} from '@/lib/rooms'

type HotelRow = { id: string; created_at: string }
type RoomRow = { hotel_id: string; created_at: string; deactivated_at: string | null }

function gruppiere(rooms: RoomRow[]): Map<string, BillableRoom[]> {
  const byHotel = new Map<string, BillableRoom[]>()
  for (const r of rooms) {
    const list = byHotel.get(r.hotel_id) ?? []
    list.push({ created_at: r.created_at, deactivated_at: r.deactivated_at })
    byHotel.set(r.hotel_id, list)
  }
  return byHotel
}

/**
 * Schreibt fehlende Snapshots aller abgeschlossenen Perioden eines Kontos.
 *
 * Idempotent: vorhandene Perioden werden nie überschrieben (`ignoreDuplicates`),
 * ein zweiter Aufruf schreibt also nichts und zwei gleichzeitige Aufrufe
 * kollidieren nicht.
 *
 * **Muss laufen, BEVOR Zimmer gelöscht werden** — danach ist die Zahl bereits
 * verfälscht.
 */
export async function ensureBillingSnapshots(accountId: string): Promise<{ written: number; error?: string }> {
  const admin = createAdminClient()

  const { data: hotels } = await admin
    .from('hotels').select('id, created_at').eq('account_id', accountId)
  if (!hotels || hotels.length === 0) return { written: 0 }

  const hotelIds = (hotels as HotelRow[]).map(h => h.id)
  const [{ data: rooms }, { data: existing }] = await Promise.all([
    admin.from('rooms').select('hotel_id, created_at, deactivated_at').in('hotel_id', hotelIds),
    admin.from('billing_snapshots').select('hotel_id, period_start').in('hotel_id', hotelIds),
  ])

  const vorhanden = new Set(
    (existing ?? []).map(s => `${s.hotel_id}#${String(s.period_start).slice(0, 10)}`),
  )
  const byHotel = gruppiere((rooms ?? []) as RoomRow[])

  const now = new Date()
  const neu: { hotel_id: string; account_id: string; period_start: string; rooms: number }[] = []
  for (const h of hotels as HotelRow[]) {
    for (const p of closedMonthPeriods(new Date(h.created_at), now)) {
      const key = periodKey(p)
      if (vorhanden.has(`${h.id}#${key}`)) continue
      neu.push({
        hotel_id: h.id,
        account_id: accountId,
        period_start: key,
        rooms: countBillableRooms(byHotel.get(h.id) ?? [], p),
      })
    }
  }

  if (neu.length === 0) return { written: 0 }

  const { error } = await admin
    .from('billing_snapshots')
    .upsert(neu, { onConflict: 'hotel_id,period_start', ignoreDuplicates: true })
  if (error) return { written: 0, error: error.message }

  return { written: neu.length }
}

export type BillingRow = {
  /** `YYYY-MM-01`. */
  periodStart: string
  rooms: number
  /** true = festgeschrieben, false = noch aus den Zimmern abgeleitet. */
  fixed: boolean
}

/**
 * Abrechnungsübersicht eines Kontos: der laufende Monat plus die letzten
 * abgeschlossenen.
 *
 * Für eine abgeschlossene Periode gilt der **Snapshot, wenn es einen gibt** —
 * sonst die Live-Ableitung. Beides ist richtig: Ohne Löschung stimmt die
 * Ableitung weiterhin, und sobald gelöscht wurde, existiert der Snapshot.
 */
export async function getBillingOverview(
  accountId: string,
  monate = 6,
): Promise<{ current: BillingRow; closed: BillingRow[] }> {
  const admin = createAdminClient()

  const { data: hotels } = await admin
    .from('hotels').select('id, created_at').eq('account_id', accountId)
  const hotelIds = (hotels ?? []).map(h => h.id)

  const now = new Date()
  const current = monthPeriod(now)

  if (hotelIds.length === 0) {
    return { current: { periodStart: periodKey(current), rooms: 0, fixed: false }, closed: [] }
  }

  const [{ data: rooms }, { data: snapshots }] = await Promise.all([
    admin.from('rooms').select('hotel_id, created_at, deactivated_at').in('hotel_id', hotelIds),
    admin.from('billing_snapshots').select('period_start, rooms').eq('account_id', accountId),
  ])

  const alle = ((rooms ?? []) as RoomRow[]).map(r => ({
    created_at: r.created_at, deactivated_at: r.deactivated_at,
  }))

  // Snapshots je Periode über alle Häuser des Kontos summieren.
  const fixByPeriod = new Map<string, number>()
  for (const s of snapshots ?? []) {
    const key = String(s.period_start).slice(0, 10)
    fixByPeriod.set(key, (fixByPeriod.get(key) ?? 0) + (s.rooms as number))
  }

  // Ältestes Haus bestimmt, wie weit zurück überhaupt etwas zu zeigen ist.
  const aeltestes = (hotels ?? []).reduce<string | null>(
    (min, h) => (min === null || h.created_at < min ? h.created_at : min),
    null,
  )
  const perioden = aeltestes ? closedMonthPeriods(new Date(aeltestes), now) : []

  const closed: BillingRow[] = perioden
    .slice(-monate)
    .reverse()
    .map(p => {
      const key = periodKey(p)
      const fix = fixByPeriod.get(key)
      return {
        periodStart: key,
        rooms: fix ?? countBillableRooms(alle, p),
        fixed: fix !== undefined,
      }
    })

  return {
    current: {
      periodStart: periodKey(current),
      rooms: alle.filter(r => isBillable(r, current)).length,
      fixed: false,
    },
    closed,
  }
}
