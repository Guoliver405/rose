import type { LooseContext } from '../../format'
import type { HelpMessages } from './index'
import type { SymbolsMessages } from '../symbols'

/**
 * Erläuterungen zur Hilfe für Übersetzer (17.10.2026). Abschnitte vererben
 * ihre Erläuterung (`LooseContext`). Leser: Rezeption, Inhaber, Manager —
 * gesiezt, erklärend, ohne Entwickler-Sprache. Begriffe wie in der Oberfläche;
 * Namen von Knöpfen und Seiten in Anführungszeichen müssen wortgleich mit der
 * Oberfläche sein. Datenfelder (`art`, `id`, `ton`, `icon`, `href`) werden
 * nicht übersetzt.
 */
export const helpContext = {
  topics: {
    _: { where: 'Hilfe-Leiste neben der Seite bzw. Hilfe-Themenseite', note: 'Titel und Untertitel eines Themas, Absätze, Legenden (Beschriftung eines Zeichens + Erklärung), Fragen mit Antworten, Verweise auf andere Themen. Uhrzeiten im 24-Stunden-Format; Namen von Knöpfen wortgleich mit der Oberfläche.' },
  },
  lotsen: {
    tours: { where: 'Hilfe-Hub und Lotsen-Karte: Name und Untertitel eines Lotsen (geführter Rundgang)', note: 'Kurz. „Lotse“ = geführter Rundgang über die echte Seite.' },
    steps: { where: 'Lotsen-Karte über der Seite: Titel, Text und „tun“ (was man jetzt ausprobieren kann) eines Schritts', note: 'Die Karte ist klein: knapp formulieren. Namen von Knöpfen und Feldern wortgleich mit der Oberfläche.' },
    setup: { where: 'Einrichtungs-Checkliste im Hilfe-Hub und Band auf der Übersicht', note: '„label“ = erledigter Zustand, „todo“ = Handlungsform, „done“/„open“ = Hinweis. {count} = Anzahl.' },
  },
  ui: { where: 'Bedienelemente der Hilfe: „?“-Knopf, Leiste, Lotsen-Karte, Hilfe-Hub', note: 'Kurz. {title} = Thema, {step}/{total} = Schritt, {done}/{total} = erledigte Punkte, {count} = Schritte.' },
  sim: {
    _: { where: 'Nachbauten von Reinigungsboard und Gästeportal im Hilfe-Bereich', note: 'Beispielwerte (Hausname, Services) frei übersetzen; Preise im Format der Sprache. {path} = Adresse, {count} = Anzahl.' },
  },
} satisfies LooseContext<HelpMessages>

export const symbolsContext = {
  _: { where: 'Hilfe → Legende der Zimmer-Kacheln (Symbol, Farbbalken, Rahmen)', note: '„label“ = Name des Zeichens (kurz), „text“ = Erklärung. Wortgleich mit den Zuständen auf den Kacheln.' },
} satisfies LooseContext<SymbolsMessages>
