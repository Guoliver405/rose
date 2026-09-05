/**
 * Preismodell — entschieden am 05.09.2026.
 *
 * **Zimmergenau, ein Preis für alle Hausgrößen:** 0,50 € je Zimmer und Monat,
 * Mindestbetrag 5 € je Konto und Monat, der erste Kalendermonat ist frei.
 * Keine Pakete, keine Zimmergrenzen — die Messgröße ist dieselbe, die
 * `countBillableRooms` in [rooms.ts](./rooms.ts) seit Juli liefert und die
 * `billing_snapshots` festschreibt: **wer im Monat auch nur vorübergehend in
 * Betrieb war, zählt.**
 *
 * Der Mindestbetrag gilt je **Konto**, nicht je Haus: eine Kette mit drei
 * kleinen Häusern zahlt für die Summe ihrer Zimmer, nicht dreimal das Minimum.
 * Ein Konto ganz ohne abrechenbare Zimmer zahlt nichts — sonst zahlte ein
 * frisch registriertes Haus, bevor es ein einziges Zimmer angelegt hat.
 *
 * Reine Rechenlogik ohne I/O, damit Landing Page, Konto-Seite und die
 * spätere Rechnungsstellung dieselben Zahlen zeigen.
 */

/** Preis je abrechenbarem Zimmer und Kalendermonat, in Cent. */
export const PRICE_PER_ROOM_CENTS = 50

/** Mindestbetrag je Konto und Kalendermonat, in Cent — sobald mindestens ein Zimmer zählt. */
export const MIN_MONTHLY_CENTS = 500

/** Anzahl der freien Kalendermonate ab Registrierung (der Monat der Registrierung selbst). */
export const FREE_MONTHS = 1

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

/**
 * Ist der Kalendermonat, der mit `periodStart` beginnt, für ein Konto mit
 * Registrierung `accountCreatedAt` noch frei?
 *
 * Frei ist der Kalendermonat der Registrierung (bei `FREE_MONTHS = 1`) —
 * kalendermonatsgenau, weil auch die Zimmerzählung je Kalendermonat läuft.
 * Wer am 28. registriert, hat also nur drei freie Tage; dafür ist die Regel
 * ohne Sonderfälle und deckt sich mit der Rechnungsperiode.
 */
export function isFreePeriod(accountCreatedAt: Date, periodStart: Date): boolean {
  const first = accountCreatedAt.getFullYear() * 12 + accountCreatedAt.getMonth()
  const period = periodStart.getFullYear() * 12 + periodStart.getMonth()
  return period >= first && period < first + FREE_MONTHS
}
