/**
 * Team-Modus (16.09.2026): Tätigkeiten ohne Personenbezug — reine Rechenlogik.
 *
 * `policies.staffTracking`:
 *   'person' (Vorgabe) — Auswertung je Kraft, Namen im Zimmer-Verlauf,
 *                        Stiche bleiben der Person zugeordnet.
 *   'team'            — Auswertung nur als Haus, „Reinigungsteam" im Verlauf;
 *                        `staff_log.profile_id` wird beim Schichtende und
 *                        nach ANONYMIZE_AFTER_HOURS gelöscht. Paarung der
 *                        Zeiträume läuft dann über `session_id` (ein
 *                        Zufallsschlüssel je Schicht, verkettet keine Tage).
 *
 * Was der Modus NICHT ändert: Live-Anzeigen (wer gerade auf welcher Etage
 * ist, wer gerade ein Zimmer reinigt) bleiben — sie dienen der Koordination
 * und sind mit der Schicht weg. Und bei einer einzigen Kraft im Dienst ist
 * „Zimmer 204 um 10:30 gereinigt" ihr zuzuordnen wie ein Dienstplan auf
 * Papier; das lässt sich technisch nicht verstecken, ohne den Betriebswert
 * zu zerstören. Die Einstellung sagt das.
 */

export type StaffTracking = 'person' | 'team'

/** Nach dieser Frist verliert im Team-Modus jeder Stich seine Person — auch die des Stale-Reapers und der Rezeption. */
export const ANONYMIZE_AFTER_HOURS = 24

export function parseStaffTracking(policies: Record<string, unknown>): StaffTracking {
  return policies.staffTracking === 'team' ? 'team' : 'person'
}

export type TrackedRow = { profile_id: string | null; session_id: string | null }

/**
 * Schlüssel, unter dem Stiche zu Zeiträumen gepaart werden.
 *
 * Person-Modus: die Kraft (alle ihre Schichten in Folge — die Paarung in
 * worklog.ts ist sequenziell und verträgt das). Team-Modus: die Schicht;
 * Zeilen ohne Session (Bestand vor der Migration) fallen zurück auf die
 * Person, solange sie noch eine haben. Anonymisierte Zeilen ohne Session
 * liefern null — sie lassen sich nicht paaren und werden gezählt, nicht
 * gerechnet (stilles Mischen mehrerer Kräfte ergäbe falsche Zeiträume).
 */
export function pairingKey(row: TrackedRow, mode: StaffTracking): string | null {
  if (mode === 'team') return row.session_id ?? row.profile_id ?? null
  return row.profile_id ?? row.session_id ?? null
}

/** Stiche nach Paarungsschlüssel gruppieren; `unpaired` zählt die Zeilen ohne Schlüssel. */
export function groupForPairing<T extends TrackedRow>(
  rows: T[], mode: StaffTracking,
): { groups: Map<string, T[]>; unpaired: number } {
  const groups = new Map<string, T[]>()
  let unpaired = 0
  for (const r of rows) {
    const key = pairingKey(r, mode)
    if (!key) { unpaired++; continue }
    const list = groups.get(key) ?? []
    list.push(r)
    groups.set(key, list)
  }
  return { groups, unpaired }
}

/** Zeitpunkt, vor dem im Team-Modus alle Stiche ihre Person verlieren. */
export function anonymizeCutoff(now: Date = new Date()): string {
  return new Date(now.getTime() - ANONYMIZE_AFTER_HOURS * 3_600_000).toISOString()
}
