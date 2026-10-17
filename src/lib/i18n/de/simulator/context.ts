import type { LooseContext } from '../../format'
import type { SimulatorMessages } from './index'
import type { LandingMessages } from '../landing'

/**
 * Erläuterungen zum Housekeeping-Simulator für Übersetzer (18.10.2026). Leser:
 * Inhaber und Manager, sachlich, gesiezt. „Ohne Steuerung“ = ohne Software,
 * herkömmlich organisiert; „Kraft {name}“ = simulierte Reinigungskraft (A, B …).
 * Eine Kraft heißt im Englischen „housekeeper“; neutral („they“), nicht „she“.
 */
export const simulatorContext = {
  app: {
    _: { where: 'Simulator (/simulator): Einstellungen, Rechnen, Ergebnis, Vergleich, Diagramm', note: 'Platzhalter {…} bleiben stehen; Uhrzeiten im 24-Stunden-Format. „Modellrechnung“ = model calculation, keine Zusage.' },
    day: {
      _: { where: 'Tagesbild des Simulators: Beschreibung, Hinweise, Ereignis-Protokoll', note: 'Protokoll sachlich ohne Wertung; gleiches Geschehen, gleicher Wortlaut in beiden Bildern. {who}/{maid} = „Kraft A“, {floor} = Etage, {nr} = Zimmernummer.' },
    },
    validation: { _: { where: 'Prüfmeldungen der Eingaben im Simulator', note: '{key} = interner Name der Angabe, unübersetzt. {label}, {min}, {max}, {rooms}, {total}, {time}.' } },
  },
  account: {
    _: { where: 'Simulator-Konto: Registrierung, Mein Konto, Umwandlung in ein Hotelkonto', note: '{tool} = Name des Werkzeugs, {email}, {min}, {max}, {seconds}, {phrase}, {date}, {rooms}, {count}. <link>/<terms>/<privacy> werden zu Links, <code> = Festschrift.' },
    marketing: { where: 'Werbe-Einwilligung bei der Registrierung', note: 'Rechtlich bindender Wortlaut: Jede Fassung hat eine eigene Version im Code. Änderungen nur mit Absprache.' },
  },
} satisfies LooseContext<SimulatorMessages>

export const dayContext = {
  _: { where: 'Tagesbild (zwei Gebäudeschnitte mit Uhr): Titel, Legende, Steuerung, Tätigkeitszeile', note: '{time}, {count}, {range}, {nr}, {who}, {name}, {door}, {idle}, {search}. <b> = hervorgehobene Zahl. „Ohne Steuerung“ = ohne Software.' },
  caption: { where: 'Kleingedrucktes unter dem Tagesvergleich der Landing Page (die Landing Page ist noch deutsch)', note: '{rooms}, {floors}, {maids}, {signals}, {notBefore}, {dnd}; <link> führt zum Simulator.' },
} satisfies LooseContext<LandingMessages['day']>
