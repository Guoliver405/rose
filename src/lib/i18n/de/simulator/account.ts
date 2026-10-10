/**
 * Housekeeping-Simulator — Konto: Registrierung, Mein Konto, Szenarien
 * speichern, Umwandlung in ein Hotelkonto. Deutsche Texte, gesiezt.
 * Begriffe nach `Sessions/Begriffe-Entscheidungen.md`.
 *
 * Der Name des Werkzeugs ist ein Produktname und steht als Konstante
 * `SIMULATOR_NAME` in `lib/sim-account.ts`; hier wird er als `{tool}`
 * eingesetzt. „Hotelkonto“ und „Als Hotel bei RoSe starten“ bleiben (Branche).
 */
export const account = {
  /**
   * Wortlaut der Werbe-Einwilligung. Ändert sich der Text, MUSS
   * `MARKETING_TEXT_VERSION` in `lib/sim-account.ts` hochgezählt werden —
   * gespeichert wird, welcher Fassung zugestimmt wurde. Am 11.10.2026
   * wortgleich aus `lib/sim-account.ts` hierher verschoben (Fassung
   * 2026-09-26, im Test festgehalten). Eine Übersetzung ist eine eigene
   * Fassung und braucht ihre eigene Version.
   */
  marketing: {
    text: 'Ja, RoSe darf mich gelegentlich per E-Mail über neue Funktionen und besondere Angebote informieren – ausschließlich zu RoSe. Meine Adresse wird nicht weitergegeben. Abbestellen jederzeit mit einem Klick oder im Konto.',
    optional: '(freiwillig)',
  },

  signup: {
    metaTitle: 'Registrieren – {tool}',
    intro: 'Kostenlos und ohne Zahlungsdaten. Nach der Registrierung bestätigen Sie Ihre E-Mail-Adresse über einen Link.',
    mailNotReady: 'Die Registrierung ist gerade nicht möglich, weil der E-Mail-Versand nicht eingerichtet ist.',
    email: 'E-Mail',
    password: 'Passwort',
    passwordHint: 'Mindestens {min} Zeichen.',
    submit: 'Kostenlos registrieren',
    submitting: 'Wird angelegt …',
    terms:
      'Mit der Registrierung gelten die <terms>Nutzungsbedingungen des Simulators</terms>. Wie wir mit Ihren Daten umgehen, steht in der <privacy>Datenschutzerklärung</privacy>.',
    haveAccount: 'Schon registriert? <link>Anmelden</link>',
    resendLink: 'Bestätigungslink erneut senden',
    sent: {
      title: 'Bitte bestätigen Sie Ihre Adresse',
      text: 'Wir haben eine E-Mail an <code>{email}</code> geschickt. Der Link darin schaltet Ihr Konto frei und meldet Sie an. Er lässt sich auf jedem Gerät öffnen.',
      hint: 'Nichts angekommen? Auch den Spam-Ordner prüfen. Gibt es zu dieser Adresse schon einen Zugang, steht in der E-Mail, wie es weitergeht.',
      again: 'E-Mail erneut senden',
      againIn: 'Erneut senden in {seconds} s',
    },
    resend: {
      linkExpired: 'Der Bestätigungslink ist abgelaufen oder wurde schon benutzt. Fordern Sie einen neuen an.',
      submit: 'Neuen Bestätigungslink senden',
      signupInstead: 'Stattdessen neu registrieren',
    },
  },

  konto: {
    metaTitle: 'Mein Konto – {tool}',
    title: 'Mein Konto',
    access: {
      title: 'Zugang',
      email: 'E-Mail: <code>{email}</code>',
      password: 'Passwort ändern: über <link>Passwort vergessen</link> – Sie bekommen einen Link an diese Adresse.',
      hotel: 'Dieser Zugang gehört zu einem Hotelkonto; den Simulator nutzen Sie damit ohne eigenes Konto.',
    },
    marketing: {
      title: 'Informationen zu RoSe per E-Mail',
      saved: 'Gespeichert – danke!',
      unsubscribed: 'Abbestellt. Sie erhalten keine Werbe-E-Mails mehr.',
      since: 'Eingewilligt am {date}.',
      none: 'Nicht eingewilligt.',
    },
    delete: {
      titleSim: 'Konto löschen',
      titleHotel: 'Simulator-Daten löschen',
      textSim: 'Löscht Ihren Zugang, gespeicherte Szenarien und die Einwilligung sofort und endgültig.',
      textHotel: 'Löscht Ihre gespeicherten Szenarien und die Einwilligung. Ihr Hotelzugang bleibt bestehen.',
      /** `{phrase}` = Bestätigungswort aus `phrase`. */
      confirmLabel: 'Zur Bestätigung „{phrase}“ eintippen',
      submit: 'Endgültig löschen',
    },
  },

  /** Bestätigungswort beim Löschen — die Oberfläche zeigt es, der Server prüft es (Großschreibung egal). */
  deletePhrase: 'LÖSCHEN',

  convert: {
    title: 'Als Hotel bei RoSe starten',
    intro:
      'Testen Sie RoSe mindestens einen Monat lang kostenlos – ohne Zahlungsdaten. Überzeugt es Sie nicht, löschen Sie das Konto einfach vorher; es entstehen keine Kosten. Ihr Zugang und Ihre Szenarien bleiben dabei, wie sie sind.',
    prices: 'Preise',
    next: 'Weiter',
    closed: 'Die Registrierung als Hotel ist derzeit nur mit Einladung möglich und gerade nicht freigeschaltet. Schreiben Sie uns – die Adresse steht im Impressum.',
    houseName: 'Name des Hauses',
    yourName: 'Ihr Name',
    inviteCode: 'Einladungscode',
    take: 'Aus dem Simulator übernehmen',
    /** Mehrzahl nach der Zahl der Etagen (`{count}`); `{rooms}` = Zimmerzahl. */
    rooms: {
      one: '{rooms} Zimmer auf einer Etage, nummeriert 101, 102 … – im Zimmer-Setup jederzeit änderbar',
      other: '{rooms} Zimmer auf {count} Etagen, nummeriert 101, 102 … – im Zimmer-Setup jederzeit änderbar',
    },
    rulesDaily: 'Regeln: Bleibezimmer täglich reinigen ab {from}, Check-out bis {checkout}, Check-in ab {checkin}',
    rulesOnDemand: 'Regeln: Bleibezimmer nur auf Wunsch reinigen, Check-out bis {checkout}, Check-in ab {checkin}',
    rulesHint: 'Folgt dem Umschalter „täglich / nur auf Wunsch“ oben; unter „Haus & Regeln“ änderbar.',
    submit: 'Hotelkonto anlegen',
    submitting: 'Wird angelegt …',
    cancel: 'Abbrechen',
    after: 'Danach: Zahlungsweg (überspringbar) und Einrichtung. Es gelten die AGB.',
  },

  errors: {
    emailInvalid: 'Bitte eine gültige E-Mail-Adresse angeben.',
    passwordShort: 'Das Passwort braucht mindestens {min} Zeichen.',
    passwordLong: 'Das Passwort darf höchstens {max} Zeichen haben.',
    signInAgain: 'Bitte erneut anmelden.',
    deletePhrase: 'Bitte zur Bestätigung „{phrase}“ eintippen.',
    // Registrierung und „erneut senden“
    mailNotReady: 'Die Registrierung ist gerade nicht möglich (E-Mail-Versand nicht eingerichtet).',
    signupThrottled: 'Von diesem Anschluss kamen gerade zu viele Registrierungen. Bitte in einer Stunde erneut versuchen.',
    resendThrottled: 'Von diesem Anschluss kamen gerade zu viele Anfragen. Bitte in einer Stunde erneut versuchen.',
    signupFailed: 'Das Konto konnte nicht angelegt werden. Bitte später erneut versuchen.',
    // Konto
    notSaved: 'Konnte nicht gespeichert werden.',
    confirmFirst: 'Bitte zuerst die E-Mail-Adresse bestätigen.',
    deleteFailed: 'Das Konto konnte nicht gelöscht werden. Bitte später erneut versuchen.',
    // Szenarien
    scenarioName: 'Bitte einen Namen angeben.',
    scenarioSaveFailed: 'Das Szenario konnte nicht gespeichert werden.',
    scenarioLimit: 'Höchstens {max} Szenarien – bitte zuerst eines löschen.',
    scenarioRenameFailed: 'Umbenennen fehlgeschlagen.',
    scenarioDeleteFailed: 'Löschen fehlgeschlagen.',
    // Umwandlung in ein Hotelkonto
    convertConfirmedOnly: 'Nur für bestätigte Simulator-Konten.',
    convertExists: 'Zu diesem Zugang gibt es bereits ein Hotelkonto.',
    convertHouseName: 'Bitte den Namen des Hauses angeben.',
    convertYourName: 'Bitte Ihren Namen angeben.',
    convertTooManyRooms:
      'Höchstens {max} Zimmer lassen sich direkt übernehmen – bitte ohne Zimmer umwandeln und sie im Zimmer-Setup anlegen.',
    convertFailed: 'Das Hotelkonto konnte nicht angelegt werden.',
  },
}
