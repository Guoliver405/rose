/**
 * Hilfe-Bereich – Nachbauten von Reinigungsboard und Gästeportal
 * (`SimReinigung`, `SimGast`) und ihre Seiten. Die Nachbauten sprechen wie die
 * echten Portale: Reinigung du, Gast Sie; der Rahmen drumherum siezt.
 *
 * Hier steht nur, was es im echten Portal nicht gibt: Seitenkopf, Erklärzeilen,
 * Beispielwerte. Knöpfe, Statuszeilen und Schieber-Beschriftungen kommen aus
 * `service.ts` bzw. `guest.ts` – die Seiten reichen sie mit herein, damit der
 * Nachbau nie anders spricht als das Original. Deshalb steht hier auch kein
 * „du“: Alles, was die Reinigungskraft anspricht, stammt aus `service.ts`.
 */
export const sim = {
  /** Beispielhaus beider Nachbauten – bewusst nicht das eigene, siehe `SimGast`. */
  house: 'Haus Alpenblick',

  /** Gehäuse um beide Nachbauten. */
  frame: {
    badge: 'Nachbau',
  },

  reinigung: {
    page: {
      title: 'Das Reinigungsboard',
      intro:
        'So sieht das Board aus, das Ihre Reinigungskräfte am Handy bedienen. Es ist ein Nachbau mit Beispiel-Zimmern – hier wird nichts gespeichert und niemand benachrichtigt. Probieren Sie ruhig alles aus; der Lotse stellt zu jedem Schritt die passende Ansicht wieder her.',
      why:
        'Warum ein Nachbau und keine Führung durch das echte Board? Das Reinigungsboard hat eine eigene Anmeldung und eine eigene Sitzung – aus der Rezeption heraus ist es nicht erreichbar. Wer es wirklich sehen will, meldet sich unter <code>{path}</code> mit dem Zugang einer Reinigungskraft an.',
    },
    frame: {
      login: 'Reinigung – Anmeldung',
      status: 'Reinigung – Mein Status',
    },
    scanCard: 'Zugangskarte scannen',
    or: 'oder',
    withinShift: 'Pause und sonstige Reinigung laufen innerhalb der Schicht.',
    /** Kachel-Titel und Dialogzeile, wenn kein Zustand anliegt. */
    nothingToDo: 'nichts zu tun',
    noTask: 'Für dieses Zimmer ist keine Reinigung offen – es ist nicht gesperrt, es gibt nur gerade nichts zu tun.',
  },

  gast: {
    page: {
      title: 'Was der Gast sieht',
      intro:
        'Das Gästeportal, wie es auf dem Telefon Ihres Gastes aussieht. Ein Nachbau mit Beispielwerten – Haus, Zimmer und Services stammen nicht aus Ihren Daten, damit die Ansicht auch dann etwas zeigt, wenn noch nichts angelegt ist. Nichts davon wird gespeichert.',
      differs:
        'Ihre eigenen Texte weichen an zwei Stellen ab: Welche Services erscheinen, legen Sie im Service-Baukasten fest, und ob „Frühestens ab“ überhaupt angeboten wird – samt Grenze – steht unter Haus & Regeln.',
    },
    frame: {
      portal: 'Gästeportal – Handy',
    },
    scanned: 'Aushang im Zimmer gescannt – jetzt nur noch die PIN vom Check-in-Blatt.',
    otherMode: 'Im anderen Verfahren entfällt dieser Schritt: Der persönliche Link öffnet das Gästeportal direkt.',
    onlyDaily: 'Diesen Knopf gibt es nur in Häusern mit täglicher Reinigung.',
    /** Beispiel-Services; der Technische Dienst ist eine Meldung ans Haus und zeigt „Melden“ statt „Bestellen“. */
    services: {
      towels: { name: 'Extra Handtücher', meta: 'kostenfrei' },
      breakfast: { name: 'Frühstück aufs Zimmer', meta: '14,50 €' },
      technician: { name: 'Technischer Dienst', meta: 'dringend' },
    },
    requested: 'angefragt',
    openRequests: {
      one: 'Eine Anfrage ist offen – die Rezeption hat sie im Blick.',
      other: '{count} Anfragen sind offen – die Rezeption hat sie im Blick.',
    },
    noRequests: 'Keine offenen Anfragen. Mit dem Check-out erlischt der Zugang von selbst.',
  },
}

export type SimMessages = typeof sim
