/**
 * Simulator → Hotelkonto (Phase 4, 26.09.2026): was aus dem eingestellten
 * Szenario ins neue Haus übernommen wird. Reine Übersetzung ohne I/O.
 *
 * - Zimmer: Etagen × Zimmer je Etage, nummeriert wie im Simulator (101, 102 …,
 *   ab der 10. Etage vierstellig) — im Zimmer-Setup jederzeit änderbar.
 * - Regeln: tägliche Reinigung an/aus (Stellung des Umschalters) samt Uhrzeit,
 *   Check-out bis, Check-in ab. Die Zeitzone übernimmt der Simulator bewusst
 *   NICHT — „Regeln geprüft" in der Einrichtungs-Checkliste hängt an ihr, und
 *   die soll das Haus selbst bestätigen.
 */

import type { Policy } from './cleaning-sim'
import type { SimForm } from './sim-form'

export function roomsFromForm(f: Pick<SimForm, 'floors' | 'roomsPerFloor'>): { floor: number; number: string }[] {
  const out: { floor: number; number: string }[] = []
  for (let floor = 1; floor <= f.floors; floor++) {
    for (let n = 1; n <= f.roomsPerFloor; n++) out.push({ floor, number: `${floor}${String(n).padStart(2, '0')}` })
  }
  return out
}

export function policiesFromForm(f: Pick<SimForm, 'times'>, policy: Policy): Record<string, unknown> {
  return {
    stayoverAutoClean: policy === 'routine',
    stayoverAutoCleanTime: f.times.stayRoutineFrom,
    checkoutUntil: f.times.checkoutUntil,
    checkinFrom: f.times.checkinFrom,
  }
}
