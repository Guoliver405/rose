/**
 * „Problem melden“ (19.10.2026): Formular, „Meine Meldungen“, Gesprächsverlauf,
 * die Support-Seite des RoSe-Teams und die Hinweis-Mails. Liegt beim
 * Hilfe-Bereich, weil der Knopf in der Hilfe-Leiste sitzt und deren Texte
 * ohnehin im Browser bereitstehen (`HelpMessages`). Verwaltung gesiezt.
 */
export const tickets = {
  kinds: {
    bug: 'Fehler',
    translation: 'Übersetzung oder Text',
    question: 'Frage',
    idea: 'Vorschlag',
  },

  status: {
    new: 'Eingegangen',
    open: 'In Bearbeitung',
    waiting: 'Wartet auf Ihre Antwort',
    done: 'Erledigt',
  },

  /** Knopf in der Hilfe-Leiste und Formular. */
  report: {
    button: 'Problem melden',
    myReports: 'Meine Meldungen',
    unread: { one: '{count} neue Antwort', other: '{count} neue Antworten' },
    title: 'Problem melden',
    intro: 'Fehler, missverständlicher Text, Frage oder Idee – wir lesen jede Meldung und antworten hier in RoSe unter „Meine Meldungen“.',
    kind: 'Worum geht es?',
    subject: 'Kurz zusammengefasst',
    subjectPlaceholder: 'Zum Beispiel: Speichern unter Haus & Regeln reagiert nicht',
    body: 'Beschreibung',
    bodyPlaceholder: 'Was haben Sie gemacht, was ist passiert, und was hätten Sie erwartet?',
    screenshot: 'Bildschirmfoto (freiwillig)',
    screenshotPick: 'Datei wählen',
    screenshotPaste: 'oder mit Strg+V einfügen',
    screenshotRemove: 'Entfernen',
    screenshotPrivacy: 'Bitte nur zeigen, was zum Problem gehört – Gästedaten brauchen wir nicht.',
    context: 'Automatisch mitgeschickt: diese Seite, Sprache, Bildschirmgröße, Browser und die letzten Fehlermeldungen im Browser.',
    send: 'Meldung senden',
    sending: 'Wird gesendet …',
    cancel: 'Abbrechen',
    close: 'Schließen',
    done: 'Danke! Ihre Meldung {number} ist angekommen.',
    doneHint: 'Unsere Antwort finden Sie unter „Meine Meldungen“. Ein Punkt am „?“ zeigt an, wenn sie da ist.',
    toList: 'Zu meinen Meldungen',
  },

  /** „Meine Meldungen“ und ein einzelnes Ticket. */
  list: {
    title: 'Meldungen',
    intro: 'Hier stehen Ihre Meldungen mit unseren Antworten. Inhaber und Manager sehen auch die Meldungen ihres Teams zu ihrem Haus.',
    empty: 'Noch keine Meldungen. Den Knopf „Problem melden“ finden Sie in der Hilfe – dem „?“ oben rechts.',
    newReport: 'Problem melden',
    unread: 'Neue Antwort',
    by: 'von {name}',
    account: 'Konto',
    back: 'Alle Meldungen',
  },

  thread: {
    reportedBy: 'Gemeldet von {name} am {date}',
    house: 'Haus: {name}',
    accountWide: 'Konto (kein bestimmtes Haus)',
    you: 'Sie',
    support: 'RoSe-Team',
    screenshot: 'Bildschirmfoto',
    screenshotGone: 'Das Bildschirmfoto wurde mit dem Abschluss gelöscht.',
    reply: 'Antworten',
    replyPlaceholder: 'Ihre Antwort …',
    send: 'Antwort senden',
    sending: 'Wird gesendet …',
    reopens: 'Ihre Antwort öffnet die erledigte Meldung wieder.',
  },

  /** `/support` – nur das RoSe-Team. */
  support: {
    title: 'Support',
    intro: 'Alle Meldungen aller Kunden. Bearbeitet wird gemeinsam – eine Antwort geht in RoSe an die meldende Person, per E-Mail nur ein Hinweis.',
    /** Dieselben Zustände aus Sicht des Teams. */
    status: { new: 'Neu', open: 'In Bearbeitung', waiting: 'Wartet auf den Kunden', done: 'Erledigt' },
    filterAll: 'Alle offenen',
    filterDone: 'Erledigte',
    empty: 'Keine Meldungen in dieser Ansicht.',
    account: 'Konto',
    house: 'Haus',
    reporter: 'Gemeldet von',
    role: { admin: 'Inhaber', manager: 'Manager', reception: 'Rezeption' },
    context: 'Kontext',
    contextPath: 'Seite',
    contextLocale: 'Sprache',
    contextViewport: 'Bildschirm',
    contextBrowser: 'Browser',
    contextErrors: 'Fehler im Browser',
    noErrors: 'keine',
    setStatus: 'Status',
    reply: 'Antwort an den Kunden',
    replyPlaceholder: 'Antwort …',
    replyStatus: 'Danach',
    send: 'Antwort senden',
    saved: 'Gespeichert.',
    doneDeletesScreenshot: 'Beim Abschluss wird das Bildschirmfoto gelöscht.',
    back: 'Alle Meldungen',
  },

  errors: {
    kind: 'Bitte wählen Sie, worum es geht.',
    subject: 'Bitte fassen Sie das Problem in höchstens 120 Zeichen zusammen.',
    body: 'Bitte beschreiben Sie das Problem (höchstens 5000 Zeichen).',
    screenshotTooLarge: 'Das Bildschirmfoto ist zu groß. Bitte einen kleineren Ausschnitt wählen.',
    screenshotWrongType: 'Als Bildschirmfoto gehen PNG, JPG oder WebP.',
    tooMany: 'Sie haben in der letzten Stunde schon viele Meldungen geschickt. Bitte versuchen Sie es etwas später noch einmal.',
    failed: 'Die Meldung konnte nicht gespeichert werden. Bitte versuchen Sie es noch einmal.',
    notFound: 'Diese Meldung gibt es nicht oder Sie dürfen sie nicht sehen.',
  },

  /** Hinweis-Mails – nie mit dem Inhalt der Meldung, nur mit Link. */
  mails: {
    newSubject: 'Neue Meldung {number}: {kind}',
    newIntro: 'Es gibt eine neue Meldung von {name} ({role}) zu {where}.',
    replySubject: 'Rückmeldung zu Meldung {number}',
    replyIntro: '{name} hat auf Meldung {number} geantwortet.',
    open: 'Meldung öffnen',
    answerSubject: 'Antwort auf Ihre Meldung {number}',
    answerIntro: 'Das RoSe-Team hat auf Ihre Meldung {number} („{subject}“) geantwortet.',
    answerNote: 'Die Antwort steht in RoSe unter „Meine Meldungen“ – aus Datenschutzgründen nicht in dieser E-Mail.',
    accountWide: 'dem Konto {account}',
    house: 'dem Haus {house}',
  },
}
