/**
 * Hilfe-Bereich – Bedienelemente: „?“-Knopf, Leiste, Themenseite, Lotsen-Karte
 * und Hilfe-Hub. Verwaltung wird gesiezt, Begriffe nach
 * `Sessions/Begriffe-Entscheidungen.md`. Die Nachbauten von Reinigungsboard und
 * Gästeportal stehen in `sim.ts`.
 */
export const ui = {
  /** Das „?“ in der Kopfzeile. */
  button: {
    open: 'Hilfe',
    openTopic: 'Hilfe: {title}',
    close: 'Hilfe schließen',
  },

  /** Die Leiste neben dem Inhalt. */
  sidebar: {
    label: 'Hilfe',
    allTopics: 'Alle Themen',
    close: 'Hilfe schließen',
    closeHint: 'Hilfe schließen (Esc)',
    startLotse: 'Lotse starten',
    asPage: 'Als Seite öffnen',
    asPageHint: 'Zum Drucken oder Teilen',
    noTopic: 'Zu dieser Seite gibt es kein eigenes Thema. Wählen Sie eines aus der Liste – die Leiste bleibt offen, bis Sie sie schließen.',
  },

  /** Ein Thema als Seite oder in der Leiste. */
  topic: {
    questions: 'Fragen',
    seeAlso: 'Siehe auch',
    startLotse: 'Lotse starten',
    backHub: 'Hilfe',
    backHouses: 'Häuser',
  },

  /** Die Karte des Lotsen über der Seite. */
  pilot: {
    region: 'Lotse: {title}',
    progress: '{step} / {total}',
    close: 'Lotse beenden',
    missing: 'Der beschriebene Bereich ist gerade nicht auf der Seite – er hängt an einer Einstellung, die in Ihrem Haus anders steht, oder an Daten, die es hier noch nicht gibt.',
    back: 'Zurück',
    end: 'Beenden',
    next: 'Weiter',
    done: 'Fertig',
  },

  /** Der Hilfe-Hub `…/admin/hilfe`. */
  hub: {
    title: 'Hilfe & Lotsen',
    intro: 'Zu jedem Bereich gibt es eine Erklärung zum Nachschlagen – Zeichen, Fragen, Antworten – und einen Lotsen: einen geführten Rundgang über die echte Seite, der Schritt für Schritt zeigt, was dort womit passiert. Bedienen können Sie die Seite dabei ganz normal weiter, nichts ist gesperrt; beenden lässt sich der Lotse jederzeit über „Beenden“. Das „?“ oben rechts klappt auf jeder Seite die Erklärung daneben auf.',
    setupTitle: 'Einrichtung Ihres Hauses',
    setupCount: '{done} von {total}',
    setupContinue: 'Einrichtung fortsetzen',
    setupAgain: 'Einrichtung noch einmal ansehen',
    optional: 'freiwillig',
    catalogTitle: 'Hilfe nach Thema',
    catalogIntro: 'Beides führt auf die Seite, um die es geht: die Erklärung zum Nachschlagen in der Leiste daneben, der Lotse Schritt für Schritt darüber – beliebig oft.',
    explanation: 'Erklärung',
    lotse: { one: 'Lotse ({count} Schritt)', other: 'Lotse ({count} Schritte)' },
  },
}
