import type { SupabaseClient } from '@supabase/supabase-js'
import { anonymizeCutoff } from '@/lib/staff-tracking'

/**
 * Team-Modus — die I/O-Seite (Rechenlogik in lib/staff-tracking.ts).
 *
 * Zwei Schreibzugriffe, beide nur im Team-Modus des Hauses:
 *   * `anonymizeSession`  — beim Schichtende: alle Stiche dieser Schicht
 *                            verlieren die Person. Der Session-Schlüssel
 *                            bleibt, damit die Auswertung paaren kann.
 *   * `anonymizeStale`    — beim Schichtbeginn (und beim Umschalten der
 *                            Einstellung): alles, was älter als 24 h ist —
 *                            Stiche des Stale-Reapers, vergessene
 *                            Schichtenden, Rezeptions-Korrekturen und der
 *                            Bestand aus dem Person-Modus. Dazu die
 *                            Akteur-IDs der Reinigung im Zimmer-Verlauf
 *                            (`room_state_transitions.actor_id`, Quelle
 *                            `maid`) — die Kraft steht sonst dort weiter.
 *
 * Kein Cron: Die beiden Ereignisse reichen, weil Stiche nur um Schichten
 * herum entstehen. Wer nie eine Schicht sticht, hat nichts zu anonymisieren.
 */

export async function anonymizeSession(admin: SupabaseClient, hotelId: string, sessionId: string): Promise<void> {
  await admin
    .from('staff_log')
    .update({ profile_id: null })
    .eq('hotel_id', hotelId)
    .eq('session_id', sessionId)
    .not('profile_id', 'is', null)
}

export async function anonymizeStale(admin: SupabaseClient, hotelId: string, now: Date = new Date()): Promise<void> {
  const cutoff = anonymizeCutoff(now)
  await Promise.all([
    admin
      .from('staff_log')
      .update({ profile_id: null })
      .eq('hotel_id', hotelId)
      .lt('at', cutoff)
      .not('profile_id', 'is', null),
    admin
      .from('room_state_transitions')
      .update({ actor_id: null })
      .eq('hotel_id', hotelId)
      .eq('source', 'maid')
      .lt('occurred_at', cutoff)
      .not('actor_id', 'is', null),
  ])
}
