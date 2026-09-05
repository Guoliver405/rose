/**
 * Anbieter-Daten — die EINE Stelle für Impressum, Datenschutzerklärung, AGB
 * und Fußzeilen.
 *
 * Anbieter von RoSe ist **I²D Internet-Informations-Dienste** (Inhaber Bernd
 * Köhl), entschieden am 05.09.2026. Die Website des Anbieters trägt in ihrem
 * eigenen Impressum noch Platzhalter (Anschrift, Telefon, USt-IdNr.) — die
 * fehlenden Werte stehen deshalb auch hier als `[…]`-Platzhalter und werden
 * vom Anbieter nachgetragen. `providerIncomplete()` erkennt sie, damit die
 * Rechtsseiten einen sichtbaren Hinweis zeigen, solange etwas fehlt — ein
 * Impressum mit „[Straße]" soll niemals still in Produktion stehen.
 */

export const PROVIDER = {
  /** Firmierung, wie sie im Impressum steht. */
  name: 'I²D Internet-Informations-Dienste',
  /** Inhaber, zugleich verantwortlich für den Inhalt (§ 18 Abs. 2 MStV). */
  owner: 'Bernd Köhl',
  street: '[Straße und Hausnummer]',
  zipCity: '[PLZ Ort]',
  country: 'Deutschland',
  phone: '[Telefonnummer]',
  email: '[E-Mail-Adresse]',
  website: 'https://www.internetinformationsdienste.de',
  /**
   * Umsatzsteuer-Identifikationsnummer nach § 27a UStG. `null`, falls keine
   * vergeben ist — dann steht im Impressum nichts dazu.
   */
  vatId: '[USt-IdNr.]' as string | null,
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

/** Anschrift als Zeilen, für Impressum und Verantwortlichen-Block. */
export function providerAddressLines(): string[] {
  return [PROVIDER.name, PROVIDER.owner, PROVIDER.street, PROVIDER.zipCity, PROVIDER.country]
}
