import type { LooseContext } from '../../format'
import type { LandingMessages } from './index'
import { dayContext } from '../simulator/context'

/**
 * Erläuterungen zur Landing Page für Übersetzer (18.10.2026). Leser: Hoteliers,
 * die RoSe noch nicht kennen — werbend, aber ehrlich, gesiezt. „Hotel“ steht
 * für die Branche, „property“ für das einzelne Haus, „housekeeping“ für die
 * Abteilung. Preise kommen als {price}/{min} fertig formatiert.
 */
export const landingContext = {
  page: {
    _: { where: 'Landing Page (/): Abschnitte der Seite', note: '{price}, {min}, {rooms} = Preise und Zimmerzahl aus der Preisliste. <hl> = farbig hervorgehoben, <b> = fett, <link> = Link auf die AGB.' },
    meta: { where: 'Seitentitel und Beschreibung für Suchmaschinen und Link-Vorschau', note: 'Suchmaschinen kürzen nach etwa 155 Zeichen. ogLocale = Sprachkennung der Link-Vorschau (en_US).' },
    og: { where: 'Bild der Link-Vorschau (1200 × 630), gezeichnet im Code', note: 'Sehr kurze Beschriftungen auf Miniatur-Kacheln. {price}.' },
    faq: { where: 'Häufige Fragen auf der Landing Page', note: '{price}, {min}. Antworten sachlich.' },
  },
  demo: {
    _: { where: 'Interaktive Produktvorschau: drei Miniaturen (Rezeption, Gästeportal, Reinigungsboard)', note: 'Beschriftungen wortgleich mit den echten Portalen („Clean my room“, „Do not disturb“, „Up next“). {nr} = Zimmer, {pin}, {maid} = Name der Reinigungskraft, {count}, {step}, {total}, {who}.' },
  },
  roi: {
    _: { where: 'Nutzenrechner der Landing Page: Eingaben, Ergebnis, Annahmen, Quellen', note: '{count}, {value}, {nights}, {share}, {days}. Quellenangaben: Titel der Quellen in Originalsprache, Inhalt sinngemäß.' },
  },
  day: dayContext,
} satisfies LooseContext<LandingMessages>
