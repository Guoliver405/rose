/**
 * Eingabeformular des Simulators ↔ `ScenarioConfig`. Das Formular spricht
 * die Sprache des Hauses (Prozent, Uhrzeiten), die Rechnung die der
 * Simulation (Zimmerzahlen, Minuten des Tages). Reine Umrechnung ohne I/O.
 */

import {
  DEFAULT_BASELINE, DEFAULT_CONFIG, MIX_KEYS, mixFromShares,
  type Baseline, type MixKey, type ScenarioConfig, type SimDurations, type SimTimes,
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
  /** So arbeitet das Haus ohne Software (Phase 5). */
  baseline: Baseline
  days: number
  /**
   * Nummer des ersten gerechneten Tages (intern der Seed): Tag N hat immer
   * dieselben Gäste, deshalb bleiben Läufe und gespeicherte Szenarien
   * vergleichbar. „Andere Tage würfeln“ setzt eine neue Nummer.
   */
  firstDay: number
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

export function formFromConfig(cfg: ScenarioConfig, days: number, firstDay = 1): SimForm {
  const rooms = cfg.floors * cfg.roomsPerFloor
  return {
    floors: cfg.floors,
    roomsPerFloor: cfg.roomsPerFloor,
    maids: cfg.maids,
    shares: Object.fromEntries(MIX_KEYS.map(k => [k, pct(cfg.mix[k] / rooms)])) as Record<MixKey, number>,
    guest: Object.fromEntries(Object.entries(cfg.guest).map(([k, v]) => [k, pct(v)])) as Record<GuestKey, number>,
    times: Object.fromEntries(Object.entries(cfg.times).map(([k, v]) => [k, toClock(v)])) as Record<keyof SimTimes, string>,
    duration: { ...cfg.duration },
    baseline: { ...cfg.baseline },
    days,
    firstDay,
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
    baseline: { ...f.baseline },
  }
  return { config, errors }
}

export const DEFAULT_DAYS = 101
/**
 * Vorgabe des Simulators: das Haus der Landing Page — aber mit Funk (User,
 * 27.09.2026: „Standardmäßig ist Funk an"). Die Landing Page selbst rechnet
 * weiter mit `DEFAULT_CONFIG` (Papierliste).
 */
export const SIM_DEFAULT_BASELINE: Baseline = { departures: 'radio', floors: 'fixed' }
export const DEFAULT_FORM: SimForm = { ...formFromConfig(DEFAULT_CONFIG, DEFAULT_DAYS), baseline: SIM_DEFAULT_BASELINE }

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
  if (f.baseline.departures !== d.baseline.departures) n++
  if (f.baseline.floors !== d.baseline.floors) n++
  for (const k of RADIO_DURATIONS) if (f.duration[k] !== d.duration[k]) n++
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
export const RADIO_DURATIONS = ['radioDelay', 'radioInterrupt', 'radioComplaintReach', 'radioAnnounce'] as const

// ── Gespeicherte Szenarien (Phase 3) ──────────────────────────────────────

/** Version der gespeicherten Form — bei einem Umbau des Formulars hochzählen und in `formFromSaved` übersetzen. */
export const SAVED_VERSION = 1
export const MAX_SCENARIOS = 30

export type SavedConfig = { v: number; form: SimForm }

export const toSaved = (f: SimForm): SavedConfig => ({ v: SAVED_VERSION, form: f })

/**
 * Gespeichertes Szenario → Formular. Was fehlt oder nicht passt, kommt aus
 * der Vorgabe — ein Szenario von heute soll auch nach einer Erweiterung des
 * Modells (neue Annahme) noch öffnen, dann eben mit deren Vorgabe.
 */
export function formFromSaved(raw: unknown): SimForm {
  const d = DEFAULT_FORM
  const src = (raw && typeof raw === 'object' && 'form' in raw ? (raw as SavedConfig).form : null) as Partial<SimForm> | null
  if (!src || typeof src !== 'object') return d
  const num = (v: unknown, fb: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fb)
  const str = (v: unknown, fb: string) => (typeof v === 'string' ? v : fb)
  const pickNums = <T extends Record<string, number>>(base: T, v: unknown): T =>
    Object.fromEntries(Object.entries(base).map(([k, fb]) => [k, num((v as Record<string, unknown> | undefined)?.[k], fb)])) as T
  return {
    floors: num(src.floors, d.floors),
    roomsPerFloor: num(src.roomsPerFloor, d.roomsPerFloor),
    maids: num(src.maids, d.maids),
    shares: pickNums(d.shares, src.shares),
    guest: pickNums(d.guest, src.guest),
    times: Object.fromEntries(Object.entries(d.times).map(([k, fb]) => [k, str((src.times as Record<string, unknown> | undefined)?.[k], fb)])) as SimForm['times'],
    duration: pickNums(d.duration, src.duration),
    baseline: {
      departures: src.baseline?.departures === 'radio' ? 'radio' : DEFAULT_BASELINE.departures,
      floors: src.baseline?.floors === 'free' ? 'free' : DEFAULT_BASELINE.floors,
    },
    days: num(src.days, d.days),
    firstDay: Math.max(1, Math.round(num(src.firstDay, 1))),
  }
}

/** Erste Tagesnummer für „Andere Tage würfeln“ — nie die Standardtage ab 1. */
export function randomFirstDay(rand: () => number = Math.random): number {
  return 1000 + Math.floor(rand() * 999_000)
}

/** „Tage 1–101“ bzw. „Tage 12 345–12 445“. */
export function dayRangeLabel(firstDay: number, days: number): string {
  const n = new Intl.NumberFormat('de-DE')
  return days === 1 ? `Tag ${n.format(firstDay)}` : `Tage ${n.format(firstDay)}–${n.format(firstDay + days - 1)}`
}
