import type { LooseContext } from '../format'
import type { PrintMessages } from './print'

/**
 * Erläuterungen zu den Druckseiten der Verwaltung für Übersetzer (17.10.2026).
 * Die Bedienung liest die Rezeption; die Aufstellung und die Zugangskarte
 * werden gedruckt und liegen beim Gast bzw. der Reinigungskraft.
 */
export const printContext = {
  _: { where: 'Druckseiten der Rezeption', note: 'Platzhalter {…} und <b>/<code> bleiben stehen.' },
  checkinSheet: { where: 'Seite „Check-in-Blatt“ eines Zimmers (Bedienung um den Ausdruck)', note: '{number} = Zimmer. „DIN A4“ ist ein Papierformat.' },
  roomSigns: { where: 'Seite „Aushänge“ (QR-Codes für die Zimmer drucken)', note: '{count}, {number}. Aushang = Blatt mit QR-Code im Zimmer.' },
  accessCard: { where: 'Zugangskarte einer Reinigungskraft (gedruckt)', note: '{url} = Adresse, {username} = Anmeldename.' },
  statement: { where: 'Aufstellung der Zusatzleistungen beim Check-out (gedruckt, für den Gast)', note: 'Ausdrücklich keine Rechnung. Tabellenköpfe kurz.' },
} satisfies LooseContext<PrintMessages>
