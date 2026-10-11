import { agb } from './agb'
import { datenschutz } from './datenschutz'
import { impressum } from './impressum'
import { simulatorUse } from './simulatorUse'

/**
 * Rechtstexte (Route-Gruppe `(legal)`), je Seite eine Datei, dazu Kopfzeile,
 * Fußzeile und Hinweise, die alle Seiten teilen. Ausgelagert am 11.10.2026
 * vor der anwaltlichen Prüfung — der Wortlaut ist unverändert übernommen,
 * nur Typografie und Namen von Oberflächenelementen folgen den
 * Begriffs-Entscheidungen.
 */
export const legal = {
  common: {
    /** Kopfzeile des Rahmens, Fußzeile `LegalFooter`. */
    homeLabel: 'RoSe – Startseite',
    nav: {
      impressum: 'Impressum',
      datenschutz: 'Datenschutz',
      agb: 'AGB',
    },
    copyright: '© {year} {name}',
    /** Unter dem Seitentitel, Wert aus `LEGAL_VERSION`. */
    version: 'Stand: {version}',
    /** Solange in `provider.ts` ein `[…]`-Platzhalter steht. */
    providerIncomplete:
      'Diese Angaben sind noch unvollständig – die mit […] markierten Felder werden vom Anbieter nachgetragen ({fields}).',
  },
  impressum,
  datenschutz,
  agb,
  simulatorUse,
}

export type LegalMessages = typeof legal
export type { LegalBlock, LegalPage, LegalSection, LegalText } from './blocks'
