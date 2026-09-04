import type { SupabaseClient } from '@supabase/supabase-js'
import { staleCleaningCutoff } from '@/lib/board'

type CleaningStateRow = {
  room_id: string
  cleaning_by: string | null
  cleaning_started_at: string | null
}

/**
 * Vergessene Abschlüsse festschreiben.
 *
 * Bis 04.09.2026 war der Stale-Timeout eine reine Ableitung beim Laden: das
 * Zimmer galt als offen, aber in der Datenbank stand die Reinigung weiter als
 * laufend, und im Verlauf blieb „Reinigung gestartet" ohne Ende — niemand sah,
 * dass das System sie stillschweigend zurückgesetzt hatte. Jetzt schreibt der
 * erste Zugriff nach dem Zeitlimit den Zustand fest: `room_states` zurück auf
 * „niemand reinigt" mit Quelle `system`, dazu ein `clean_aborted`-Stich für die
 * Kraft, datiert auf den Moment, in dem das Limit riss.
 *
 * Aufgerufen aus den Board-Loadern (Rezeptions-Übersicht, Reinigungsboard) mit
 * den bereits geladenen Zeilen — kein Cron, kein zweiter Round-Trip im
 * Normalfall, denn ohne stale Reinigung passiert hier nichts. Getroffene Zeilen
 * werden **in place** neutralisiert, damit die Anzeige dem neuen DB-Stand folgt.
 *
 * Race-sicher: Der Update greift nur, wenn `cleaning_by`/`cleaning_started_at`
 * noch dem gelesenen Stand entsprechen. Laden zwei Personen gleichzeitig,
 * schreibt genau eine den Stich — die andere bekommt 0 Zeilen zurück.
 */
export async function reapStaleCleanings(
  admin: SupabaseClient,
  hotelId: string,
  states: CleaningStateRow[],
  staleMinutes: number,
  now: Date = new Date(),
): Promise<string[]> {
  const reaped: string[] = []

  for (const s of states) {
    const cutoff = staleCleaningCutoff(s, staleMinutes, now)
    if (!cutoff || !s.cleaning_by || !s.cleaning_started_at) continue

    const { data } = await admin
      .from('room_states')
      .update({
        cleaning_by: null,
        cleaning_started_at: null,
        last_updated_at: now.toISOString(),
        last_update_source: 'system',
        last_updated_by: null,
      })
      .eq('room_id', s.room_id)
      .eq('hotel_id', hotelId)
      .eq('cleaning_by', s.cleaning_by)
      .eq('cleaning_started_at', s.cleaning_started_at)
      .select('room_id')
    if (!data || data.length === 0) continue

    await admin.from('staff_log').insert({
      hotel_id: hotelId,
      profile_id: s.cleaning_by,
      room_id: s.room_id,
      kind: 'clean_aborted',
      at: cutoff,
    })

    s.cleaning_by = null
    s.cleaning_started_at = null
    reaped.push(s.room_id)
  }

  return reaped
}
