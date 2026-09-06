/**
 * Preismodell — entschieden am 05.09.2026, Freimonat-Regel geschärft am 06.09.
 *
 * **Zimmergenau, ein Preis für alle Hausgrößen:** 0,50 € je Zimmer und Monat,
 * Mindestbetrag 5 € je Konto und Monat. Keine Pakete, keine Zimmergrenzen —
 * die Messgröße ist dieselbe, die `countBillableRooms` in [rooms.ts](./rooms.ts)
 * seit Juli liefert und die `billing_snapshots` festschreibt: **wer im Monat
 * auch nur vorübergehend in Betrieb war, zählt.**
 *
 * Der Mindestbetrag gilt je **Konto**, nicht je Haus: eine Kette mit drei
 * kleinen Häusern zahlt für die Summe ihrer Zimmer, nicht dreimal das Minimum.
 * Ein Konto ganz ohne abrechenbare Zimmer zahlt nichts — sonst zahlte ein
 * frisch registriertes Haus, bevor es ein einziges Zimmer angelegt hat.
 *
 * **Freimonat (06.09.2026):** Frei ist der Kalendermonat der Registrierung
 * und, wenn das Konto nicht am Monatsersten angelegt wurde, auch der darauf
 * folgende Kalendermonat — also immer **mindestens ein voller Monat**. Die
 * frühere Regel „nur der Registrierungsmonat" gab dem, der am 27.
 * registrierte, vier freie Tage, während die Landing Page „erster Monat frei"
 * versprach. Der Registrierungstag wird in der Zeitzone des Hauses bestimmt
 * (Vorgabe Europe/Berlin), nicht in Server-UTC — sonst wäre eine
 * Registrierung am 1. um 00:30 Ortszeit noch „am 31." und bekäme den
 * zweiten Monat nicht.
 *
 * Reine Rechenlogik ohne I/O, damit Landing Page, Konto-Seite und die
 * Rechnungsstellung dieselben Zahlen zeigen.
 */

import { DEFAULT_TIME_ZONE, zonedParts } from './tz'

/** Preis je abrechenbarem Zimmer und Kalendermonat, in Cent. */
export const PRICE_PER_ROOM_CENTS = 50

/** Mindestbetrag je Konto und Kalendermonat, in Cent — sobald mindestens ein Zimmer zählt. */
export const MIN_MONTHLY_CENTS = 500

/**
 * Monatsentgelt eines Kontos für `rooms` abrechenbare Zimmer, in Cent.
 * 0 Zimmer ⇒ 0 €; sonst mindestens der Mindestbetrag.
 */
export function monthlyPriceCents(rooms: number): number {
  if (!Number.isFinite(rooms) || rooms <= 0) return 0
  return Math.max(MIN_MONTHLY_CENTS, Math.floor(rooms) * PRICE_PER_ROOM_CENTS)
}

/** Ab wie vielen Zimmern der Zimmerpreis den Mindestbetrag übersteigt. */
export const MIN_COVERS_ROOMS = Math.floor(MIN_MONTHLY_CENTS / PRICE_PER_ROOM_CENTS)

/** Kalendermonat als fortlaufender Index (Jahr × 12 + Monat), für Vergleiche. */
const monthIndex = (year: number, month1to12: number) => year * 12 + (month1to12 - 1)

/**
 * Erster und letzter freier Kalendermonat eines Kontos, als Monatsindex.
 * Registrierung am Monatsersten ⇒ nur dieser Monat (er ist bereits voll);
 * sonst zusätzlich der Folgemonat.
 */
function freeRange(accountCreatedAt: Date, tz: string): { first: number; last: number } {
  const p = zonedParts(accountCreatedAt, tz)
  const first = monthIndex(p.year, p.month)
  return { first, last: p.day === 1 ? first : first + 1 }
}

/**
 * Ist der Kalendermonat, der mit `periodStart` beginnt, für ein Konto mit
 * Registrierung `accountCreatedAt` frei? `periodStart` ist ein lokaler
 * Monatsanfang, wie ihn `periodKey`/`closedMonthPeriods` in rooms.ts bilden.
 */
export function isFreePeriod(
  accountCreatedAt: Date,
  periodStart: Date,
  tz: string = DEFAULT_TIME_ZONE,
): boolean {
  const { first, last } = freeRange(accountCreatedAt, tz)
  const period = monthIndex(periodStart.getFullYear(), periodStart.getMonth() + 1)
  return period >= first && period <= last
}

/**
 * Monatsanfang des LETZTEN freien Kalendermonats, als lokales Datum — für
 * Texte wie „frei bis Ende Oktober 2026". Erster kostenpflichtiger Monat ist
 * der darauf folgende.
 */
export function lastFreePeriodStart(accountCreatedAt: Date, tz: string = DEFAULT_TIME_ZONE): Date {
  const { last } = freeRange(accountCreatedAt, tz)
  return new Date(Math.floor(last / 12), last % 12, 1)
}

/** Eine Abrechnungszeile: was ein Kalendermonat mit `rooms` Zimmern kostet. */
export type BillingLine = {
  rooms: number
  /** Geschuldeter Betrag in Cent — 0 im freien Monat und ohne Zimmer. */
  cents: number
  /** Regulärer Betrag in Cent, unabhängig vom freien Monat — „statt …". */
  regularCents: number
  /** true = freier Kalendermonat (Registrierungsmonat bzw. erster voller Monat), nichts geschuldet. */
  free: boolean
}

/**
 * Betrag eines Kalendermonats für ein Konto — die eine Stelle, an der
 * Zimmerzahl, Mindestbetrag und freier Monat zusammenkommen. Die Konto-Seite
 * zeigt genau diese Zeilen, und der Monatslauf stellt daraus die Rechnung,
 * damit Anzeige und Rechnung nie auseinanderlaufen.
 */
export function billingLine(
  rooms: number,
  accountCreatedAt: Date,
  periodStart: Date,
  tz: string = DEFAULT_TIME_ZONE,
): BillingLine {
  const regularCents = monthlyPriceCents(rooms)
  const free = isFreePeriod(accountCreatedAt, periodStart, tz)
  return { rooms, cents: free ? 0 : regularCents, regularCents, free }
}
