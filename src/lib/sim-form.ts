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
