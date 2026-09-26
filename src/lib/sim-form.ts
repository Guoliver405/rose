/**
 * Eingabeformular des Simulators ↔ `ScenarioConfig`. Das Formular spricht
 * die Sprache des Hauses (Prozent, Uhrzeiten), die Rechnung die der
 * Simulation (Zimmerzahlen, Minuten des Tages). Reine Umrechnung ohne I/O.
 */

import {
  DEFAULT_CONFIG, MIX_KEYS, mixFromShares,
  type MixKey, type ScenarioConfig, type SimDurations, type SimTimes,
} from './cleaning-sim'

export type GuestKey = keyof ScenarioConfig['guest']

export type SimForm = {
  floors: number
  roomsPerFloor: number
  maids: number
  /** Belegung in Prozent, Summe 100. */
  shares: Record<MixKey, number>
  /** Gästeverhalten in Prozent. */
  guest: Record<GuestKey, number>
  /** Uhrzeiten „HH:MM". */
  times: Record<keyof SimTimes, string>
  duration: SimDurations
  days: number
}

export const toClock = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

/** „HH:MM" → Minuten des Tages; ungültig → NaN (fällt in der Prüfung auf). */
export function fromClock(v: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim())
  if (!m) return NaN
  const [h, min] = [Number(m[1]), Number(m[2])]
  return h < 24 && min < 60 ? h * 60 + min : NaN
}

const pct = (v: number) => Math.round(v * 1000) / 10

export function formFromConfig(cfg: ScenarioConfig, days: number): SimForm {
  const rooms = cfg.floors * cfg.roomsPerFloor
  return {
    floors: cfg.floors,
    roomsPerFloor: cfg.roomsPerFloor,
    maids: cfg.maids,
    shares: Object.fromEntries(MIX_KEYS.map(k => [k, pct(cfg.mix[k] / rooms)])) as Record<MixKey, number>,
    guest: Object.fromEntries(Object.entries(cfg.guest).map(([k, v]) => [k, pct(v)])) as Record<GuestKey, number>,
    times: Object.fromEntries(Object.entries(cfg.times).map(([k, v]) => [k, toClock(v)])) as Record<keyof SimTimes, string>,
    duration: { ...cfg.duration },
    days,
  }
}

/** Summe der Belegungsanteile — muss 100 sein. */
export const sharesTotal = (f: SimForm) => Math.round(MIX_KEYS.reduce((s, k) => s + f.shares[k], 0) * 10) / 10

/**
 * Formular → Konfiguration. Stimmen die Anteile nicht auf 100 %, kommt eine
 * Meldung zurück statt einer stillen Normierung — sonst rechnete der
 * Simulator ein anderes Haus, als dasteht.
 */
export function configFromForm(f: SimForm): { config: ScenarioConfig; errors: string[] } {
  const errors: string[] = []
  const total = sharesTotal(f)
  if (Math.abs(total - 100) > 0.05) errors.push(`Belegung: Die Anteile ergeben ${String(total).replace('.', ',')} % statt 100 %.`)
  const rooms = f.floors * f.roomsPerFloor
  const config: ScenarioConfig = {
    floors: f.floors,
    roomsPerFloor: f.roomsPerFloor,
    maids: f.maids,
    mix: Number.isInteger(rooms) && rooms > 0 ? mixFromShares(rooms, f.shares) : { ...DEFAULT_CONFIG.mix },
    // Unveränderte Vorgabe bleibt exakt (ein Drittel ist nicht 33,3 %) — sonst wiche der Tag von der Landing Page ab.
    guest: Object.fromEntries(Object.entries(f.guest).map(([k, v]) => {
      const def = DEFAULT_CONFIG.guest[k as GuestKey]
      return [k, v === pct(def) ? def : v / 100]
    })) as ScenarioConfig['guest'],
    times: Object.fromEntries(Object.entries(f.times).map(([k, v]) => [k, fromClock(v)])) as SimTimes,
    duration: { ...f.duration },
  }
  return { config, errors }
}

export const DEFAULT_DAYS = 101
export const DEFAULT_FORM: SimForm = formFromConfig(DEFAULT_CONFIG, DEFAULT_DAYS)

// ── Wesentliches und Details (26.09.2026) ─────────────────────────────────
//
// Die Oberfläche zeigt zuerst nur, woran ein Haus sich wiedererkennt; der
// Rest liegt eingeklappt unter „Weitere Annahmen". Die Belegung erscheint
// vorn als zwei Zahlen — belegt und Abreisen, beides in % aller Zimmer —,
// die Aufteilung der Bleibegäste steht in den Details und behält beim
// Ändern der beiden Zahlen ihr Verhältnis.

const STAY_KEYS = ['declines', 'outWants', 'outNoRequest'] as const
const round1 = (v: number) => Math.round(v * 10) / 10

/** Belegt in % aller Zimmer. */
export const occupancyOf = (f: SimForm) => round1(100 - f.shares.empty)

/** Neue Belegung und Abreisen (je % aller Zimmer); Bleibegäste im bisherigen Verhältnis. */
export function withOccupancy(f: SimForm, occupied: number, departures: number): SimForm {
  const occ = Math.min(100, Math.max(0, occupied))
  const dep = Math.min(occ, Math.max(0, departures))
  const stays = occ - dep
  const cur = STAY_KEYS.map(k => Math.max(0, f.shares[k]))
  const base = cur.some(v => v > 0) ? cur : STAY_KEYS.map(k => DEFAULT_FORM.shares[k])
  const sum = base.reduce((a, b) => a + b, 0)
  const split = base.map(v => round1((v / sum) * stays))
  // Rundungsrest auf „geht, will Reinigung" — die Summe bleibt genau 100.
  split[1] = round1(stays - split[0] - split[2])
  return {
    ...f,
    shares: { departure: round1(dep), empty: round1(100 - occ), declines: split[0], outWants: split[1], outNoRequest: split[2] },
  }
}

/** Zahl der Detail-Annahmen, die von der Vorgabe abweichen — steht am eingeklappten Kopf. */
export function changedDetails(f: SimForm): number {
  const d = DEFAULT_FORM
  let n = 0
  for (const k of Object.keys(d.guest) as GuestKey[]) if (f.guest[k] !== d.guest[k]) n++
  for (const k of DETAIL_TIMES) if (f.times[k] !== d.times[k]) n++
  for (const k of DETAIL_DURATIONS) if (f.duration[k] !== d.duration[k]) n++
  if (f.days !== d.days) n++
  // Aufteilung der Bleibegäste: nur das Verhältnis zählt, nicht die Menge.
  const ratio = (s: SimForm['shares']) => {
    const sum = STAY_KEYS.reduce((a, k) => a + s[k], 0)
    return STAY_KEYS.map(k => (sum > 0 ? s[k] / sum : 0))
  }
  const [a, b] = [ratio(f.shares), ratio(d.shares)]
  if (a.some((v, i) => Math.abs(v - b[i]) > 0.01)) n++
  return n
}

export const ESSENTIAL_TIMES = ['shiftStart', 'checkoutUntil', 'checkinFrom'] as const
export const DETAIL_TIMES = ['shiftEnd', 'stayRoutineFrom', 'dndGiveUp', 'complaintAt', 'departFrom', 'leaveFrom', 'leaveUntil'] as const
export const ESSENTIAL_DURATIONS = ['departure', 'stay'] as const
export const DETAIL_DURATIONS = ['walkFloor', 'walkRoom', 'overview', 'knock', 'skip', 'retry', 'complaint', 'complaintReach'] as const
