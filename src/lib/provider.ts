/**
 * Anbieter-Daten — die EINE Stelle für Impressum, Datenschutzerklärung, AGB
 * und Fußzeilen.
 *
 * Anbieter von RoSe ist die **I²D UG (haftungsbeschränkt)**, Geschäftsführer
 * Bernd Köhl, entschieden am 05.09.2026. Die Werte stammen aus dem Impressum
 * auf internetinformationsdienste.de (dort am 05.09.2026 nachgetragen) und
 * wurden am selben Tag übernommen. Eine Telefonnummer nennt der Anbieter
 * nicht — nach § 5 DDG genügt ein Weg zur schnellen elektronischen
 * Kontaktaufnahme (EuGH, C-298/07), deshalb ist `phone` optional und die
 * Rechtsseiten lassen die Zeile weg.
 *
 * `providerIncomplete()` erkennt `[…]`-Platzhalter, damit die Rechtsseiten
 * einen sichtbaren Hinweis zeigen, solange etwas fehlt — ein Impressum mit
 * „[Straße]" soll niemals still in Produktion stehen. Aktuell steht keiner.
 */

export const PROVIDER = {
  /** Firmierung mit Rechtsformzusatz, wie sie im Handelsregister steht. */
  name: 'I²D UG (haftungsbeschränkt)',
  /** Vertretungsberechtigter Geschäftsführer, zugleich verantwortlich für den Inhalt (§ 18 Abs. 2 MStV). */
  representative: 'Bernd Köhl',
  street: 'Saarbrücker Straße 92',
  zipCity: '66130 Saarbrücken',
  country: 'Deutschland',
  /** Registergericht und Registernummer — Pflicht für eine UG (§ 5 Abs. 1 Nr. 4 DDG). */
  registerCourt: 'Amtsgericht Saarbrücken',
  register: 'HRB 102734',
  /** Keine Telefonnummer im Anbieter-Impressum; `null` = Zeile entfällt. */
  phone: null as string | null,
  email: 'info@internetinformationsdienste.de',
  website: 'https://www.internetinformationsdienste.de',
  /**
   * Umsatzsteuer-Identifikationsnummer nach § 27a UStG. `null`, falls keine
   * vergeben ist — dann steht im Impressum nichts dazu.
   */
  vatId: 'DE434570609' as string | null,
  /** Produktname und Domain, unter der der Dienst läuft. */
  product: 'RoSe — RoomService',
  domain: 'rose-roomservice.app',
} as const

/** Stand der Rechtstexte — in allen drei Seiten identisch angezeigt. */
export const LEGAL_VERSION = 'September 2026'

/** Liefert die Felder, die noch einen `[…]`-Platzhalter tragen. */
export function providerPlaceholders(): string[] {
  return Object.entries(PROVIDER)
    .filter(([, value]) => typeof value === 'string' && /^\[.*\]$/.test(value))
    .map(([key]) => key)
}

export function providerIncomplete(): boolean {
  return providerPlaceholders().length > 0
}

/** Anschrift der Gesellschaft als Zeilen, für Impressum und Verantwortlichen-Block. */
export function providerAddressLines(): string[] {
  return [PROVIDER.name, PROVIDER.street, PROVIDER.zipCity, PROVIDER.country]
}
