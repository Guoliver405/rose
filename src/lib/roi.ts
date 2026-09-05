/**
 * Nutzenrechner der Landing Page — „Was gewinnt euer Haus?"
 *
 * Zwei belegbare Hebel, sonst nichts:
 *  A  entfallende Stayover-Reinigungen (Gäste, die bequem verzichten können,
 *     tun das zu einem erheblichen Anteil),
 *  B  weniger Leerlauf je verbleibender Reinigung (Live-Status statt
 *     Klopfen, Warten, Nachfragen).
 *
 * Alles andere — weniger Wäsche, weniger Beschwerden, Arbeitsnachweis — wird
 * bewusst NICHT eingerechnet; ein Rechner, der alles zählt, glaubt niemand.
 * Jede Annahme ist eine Eingabe mit Vorgabe und steht auf der Seite mit
 * Sternchen und Quelle (siehe `ROI_SOURCES`). Konzept und Herleitung:
 * Sessions/Landing-Konzept-2026-09-05.md, Abschnitt 1.
 *
 * Reine Rechenlogik ohne I/O; die Kosten kommen aus `pricing.ts`.
 */

import { monthlyPriceCents } from './pricing'

export const DAYS_PER_MONTH = 30

export type RoiInput = {
  /** Zimmer in Betrieb. */
  rooms: number
  /** Auslastung 0…1. */
  occupancy: number
  /** Durchschnittliche Aufenthaltsdauer in Nächten (≥ 1). */
  nights: number
  /** Vollkosten einer Reinigungsstunde in Cent (Lohn + Nebenkosten). */
  hourlyCostCents: number
  /** A1 — Dauer einer Stayover-Reinigung in Minuten. */
  stayoverMinutes: number
  /** A2 — Anteil der Stayover-Gäste, die auf die tägliche Reinigung verzichten, 0…1. */
  optOutRate: number
  /** A3 — gesparte Minuten je verbleibender Reinigung durch Live-Status. */
  coordinationMinutes: number
}

/**
 * Vorgaben. Stundenkosten: Mindestlohn 13,90 € (2026) × 1,23 Lohnnebenkosten
 * ≈ 17,10 €. Verzicht 20 % ist der Planungswert aus der Praxis (Fallstudien
 * erreichen 34 %), Koordination 2 min entspricht nur ≈ 7–10 % einer
 * Reinigung — Hersteller behaupten das Drei- bis Sechsfache.
 */
export const ROI_DEFAULTS: RoiInput = {
  rooms: 40,
  occupancy: 0.65,
  nights: 2.5,
  hourlyCostCents: 1700,
  stayoverMinutes: 18,
  optOutRate: 0.2,
  coordinationMinutes: 2,
}

/** Zwei Stellungen der Annahmen, zwischen denen die Seite umschaltet. */
export const ROI_PRESETS = {
  vorsichtig: { optOutRate: 0.1, coordinationMinutes: 1 },
  typisch: { optOutRate: 0.2, coordinationMinutes: 2 },
} as const

export type RoiPreset = keyof typeof ROI_PRESETS

/** Anteil der belegten Zimmer, die Stayover sind: bei 2,5 Nächten 60 %. */
export function stayoverShare(nights: number): number {
  if (!Number.isFinite(nights) || nights <= 1) return 0
  return 1 - 1 / nights
}

export type RoiResult = {
  occupiedPerDay: number
  stayoverPerDay: number
  /** Entfallene Stayover-Reinigungen je Monat (Hebel A). */
  skippedPerMonth: number
  /** Verbleibende Reinigungen je Monat (Basis für Hebel B). */
  remainingPerMonth: number
  hoursSkipped: number
  hoursCoordination: number
  hoursTotal: number
  savingsCents: number
  costCents: number
  netCents: number
}

function clamp01(x: number): number {
  return Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0
}

function nonNegative(x: number): number {
  return Number.isFinite(x) && x > 0 ? x : 0
}

export function computeRoi(raw: RoiInput): RoiResult {
  const rooms = Math.floor(nonNegative(raw.rooms))
  const occupancy = clamp01(raw.occupancy)
  const optOut = clamp01(raw.optOutRate)
  const stayoverMin = nonNegative(raw.stayoverMinutes)
  const coordMin = nonNegative(raw.coordinationMinutes)
  const hourly = nonNegative(raw.hourlyCostCents)

  const occupiedPerDay = rooms * occupancy
  const stayoverPerDay = occupiedPerDay * stayoverShare(raw.nights)
  const skippedPerDay = stayoverPerDay * optOut
  const skippedPerMonth = skippedPerDay * DAYS_PER_MONTH
  const remainingPerMonth = (occupiedPerDay - skippedPerDay) * DAYS_PER_MONTH

  const hoursSkipped = (skippedPerMonth * stayoverMin) / 60
  const hoursCoordination = (remainingPerMonth * coordMin) / 60
  const hoursTotal = hoursSkipped + hoursCoordination

  const savingsCents = Math.round(hoursTotal * hourly)
  const costCents = monthlyPriceCents(rooms)

  return {
    occupiedPerDay,
    stayoverPerDay,
    skippedPerMonth,
    remainingPerMonth,
    hoursSkipped,
    hoursCoordination,
    hoursTotal,
    savingsCents,
    costCents,
    netCents: savingsCents - costCents,
  }
}

/** Quellen der Annahmen — auf der Seite als Fußnoten, hier als eine Liste. */
export const ROI_SOURCES: { id: string; text: string; url: string }[] = [
  {
    id: 'Q1',
    text: 'AHLA, „Hotel Room Cleaning Practices Reflect Guest Preferences", 2022 — 70 % der Gäste wünschen keine tägliche Reinigung; 38 % nur auf Wunsch, 19 % nur beim Check-out.',
    url: 'https://www.ahla.com/resource/survey-hotel-room-cleaning-practices-reflect-guest-preferences',
  },
  {
    id: 'Q2',
    text: 'Lodging Magazine, „The Value of Opting Out", 2024 — 20 % Verzicht als Planungswert eines Hilton-Hauses.',
    url: 'https://lodgingmagazine.com/the-value-of-opting-out/',
  },
  {
    id: 'Q3',
    text: 'CityShift Finance, Opt-out-Fallstudie — 34 % Verzicht nach 18 Monaten; 25 Minuten je Stayover; Ersparnis nur bei angepasster Einsatzplanung.',
    url: 'https://cityshiftfinance.com/hotel-labor-management-hotel-housekeeping-stayover-opt-out-labor-cos/',
  },
  {
    id: 'Q4',
    text: 'Branchen-Richtwerte Reinigungsdauer — Stayover 12–20 Minuten, Abreise 20–35 Minuten (Cellypso; Workprocedures SOP 2026).',
    url: 'https://cellypso.com/en/knowledge-base/hospitality/hotel-room-cleaning-time/',
  },
  {
    id: 'Q5',
    text: 'Gesetzlicher Mindestlohn 13,90 €/h ab 2026 (DGB); Destatis: rund 23 € Lohnnebenkosten je 100 € Bruttoverdienst.',
    url: 'https://www.destatis.de/DE/Themen/Arbeit/Arbeitskosten-Lohnnebenkosten/_inhalt.html',
  },
  {
    id: 'Q6',
    text: 'Herstellerangaben zu Housekeeping-Software: 25–67 % Produktivitätsgewinn (Stayntouch, Flexkeeping via Lodging Magazine) — wir rechnen bewusst mit einem Bruchteil davon.',
    url: 'https://www.stayntouch.com/articles/hotel-housekeeping-software-real-time',
  },
]
