/**
 * Rezeption — Personal (Reinigung, Rezeption, Manager) und Auswertung. Deutsche Texte, Verwaltung wird gesiezt.
 * Begriffe nach `Sessions/Begriffe-Entscheidungen.md`: „Zugangskarte“, „Anmeldung“,
 * „Reinigungskraft“ im Fließtext („Kraft/Kräfte“ nur in Köpfen und Zählern),
 * „Eintrag“ statt „Stich“, „E-Mail“, „Haus“.
 *
 * Pluralformen stehen als `{ one, other }` und laufen über `plural()`.
 */
export const staff = {
  personal: {
    // Köpfe und Zähler
    headingMaids: 'Personal – Reinigungskräfte',
    headingReception: 'Personal – Rezeption',
    headingManagers: 'Personal – Manager',
    maidCount: { one: '{count} Kraft', other: '{count} Kräfte' },
    accessCount: { one: '{count} Zugang', other: '{count} Zugänge' },
    intro:
      'Für alle Zugänge gilt dasselbe: <b>Bearbeiten</b> korrigiert den Namen, <b>Zugang beenden</b> sperrt die Anmeldung und lässt sich zurücknehmen, <b>Löschen</b> entfernt die Person – mit Anzeige dessen, was dabei verloren geht.',

    // Formularfelder
    displayName: 'Anzeigename',
    username: 'Benutzername (Anmeldung)',
    usernamePatternTitle: 'Nur Buchstaben, Ziffern, Punkt, Unterstrich, Bindestrich',
    email: 'E-Mail (Anmeldung)',
    create: 'Anlegen',

    // Reinigung anlegen
    createMaid: 'Neue Reinigungskraft anlegen',
    maidNamePlaceholder: 'z. B. Maria K.',
    usernamePlaceholder: 'z. B. maria',
    maidHint:
      'Mit dem <b>Benutzernamen</b> und der PIN meldet sich die Reinigungskraft an – nicht mit dem Anzeigenamen, der steht nur auf Board und Zugangskarte. PIN (6 Ziffern) und Zugangskarte werden automatisch erzeugt – danach über „Karte drucken“ aushändigen.',
    emptyMaids: 'Noch keine Reinigungskräfte angelegt.',
    emptyMaidsHint: 'Jede Reinigungskraft bekommt einen eigenen Zugang mit PIN und Zugangskarte fürs Reinigungsboard.',

    // Rezeption anlegen
    createReception: 'Neuen Rezeptions-Zugang anlegen',
    receptionNamePlaceholder: 'z. B. Front Desk Früh',
    receptionEmailPlaceholder: 'z. B. rezeption@meinhotel.de',
    receptionHint:
      'Rezeptions-Zugänge bedienen das Tagesgeschäft (Check-in/-out, Anfragen, Drucken) – Einstellungen, Zimmer-Setup und Services bleiben der Verwaltung vorbehalten. Die Person bekommt eine Einladung per E-Mail und vergibt ihr Passwort selbst.',
    receptionInviteHint:
      'Sobald die Einladung angenommen ist, verschwindet der Hinweis „Einladung offen“ aus der Liste. Kommt die E-Mail nicht an, hilft „Erneut senden“ an der Zeile.',
    emptyReception: 'Noch keine Rezeptions-Zugänge angelegt.',

    // Manager anlegen und hinzufügen
    createManager: 'Neuen Manager anlegen',
    managerNamePlaceholder: 'z. B. Nina Berg',
    managerEmailPlaceholder: 'z. B. nina@meinhotel.de',
    managerHint:
      'Manager haben im Haus dieselben Rechte wie der Inhaber – ohne Zugriff auf das Konto. Die Person bekommt eine Einladung per E-Mail und vergibt ihr Passwort selbst.',
    attachTitle: 'Vorhandenen Manager hinzufügen',
    attachLabel: 'Manager des Kontos',
    attachChoose: 'Bitte wählen …',
    attachOption: '{name} ({email})',
    attach: 'Hinzufügen',
    attachHint: 'Kein neuer Zugang – dieselbe Person betreut dann ein Haus mehr.',
    managerInviteHint: 'Kommt die E-Mail nicht an, hilft „Erneut senden“ an der Zeile.',
    emptyManagers: 'Für dieses Haus ist noch kein Manager eingetragen.',

    // Einladung und Testbetrieb
    accessCreated: 'Zugang für {name} angelegt',
    testNoMail: 'Ohne E-Mail anlegen (Testbetrieb)',
    testNoMailHint:
      'Keine Einladung – der Zugang entsteht sofort, das Passwort wird genau einmal angezeigt. Damit sind auch nicht zustellbare Adressen wie <code>tester@rose.local</code> brauchbar.',
    testAccessCreated: 'Testzugang für {name} angelegt',
    emailLabel: 'E-Mail',
    passwordLabel: 'Passwort',
    testAccessNote:
      'Jetzt notieren – das Passwort steht <b>nur hier</b> und lässt sich später nicht mehr anzeigen. Es wurde keine E-Mail verschickt.',
    testAccessDismiss: 'Notiert – ausblenden',
    releaseAndResend: 'Adresse freigeben und erneut senden',
    showInviteLink: 'Einladungslink anzeigen',

    // Zeile
    usernameSub: 'Benutzername: {username}',
    endedSince: 'beendet seit {date}',
    cleaningRoom: 'reinigt Zimmer {room}',
    hotelCount: { one: 'betreut {count} Haus', other: 'betreut {count} Häuser' },
    invitePending: 'Einladung offen',
    resend: 'Erneut senden',
    currentPin: 'Aktuelle PIN',
    noCard: 'keine Zugangskarte',
    printCard: 'Karte drucken',
    newCard: 'Neue Karte',
    newCardTitle: 'Neue PIN und neuer QR-Code – die alte Zugangskarte wird ungültig',
    editTitleMaid: 'Anzeigename oder Benutzername korrigieren',
    editTitle: 'Anzeigename korrigieren',
    reactivate: 'Wieder aktivieren',
    endAccess: 'Zugang beenden',
    endAccessTitle: 'Anmeldung sperren, alle Daten behalten',
    deleteAria: '{name} endgültig löschen',
    deleteTitle: 'Endgültig löschen',
    endedHeading: 'Beendete Zugänge',
    endedHint: 'keine Anmeldung – Daten und Nachweise bleiben erhalten',

    // Zugang beenden
    endConfirmMaid:
      'Zugang von {name} beenden? Die Anmeldung per PIN und Zugangskarte wird sofort gesperrt. Alle Daten bleiben erhalten, und eine Wieder-Aktivierung stellt den Zugang her.',
    endConfirm:
      'Zugang von {name} beenden? Die Anmeldung für dieses Haus wird sofort ungültig. Alle Daten bleiben erhalten, und eine Wieder-Aktivierung stellt den Zugang her.',
    otherHotelsUntouched: {
      one: 'Das übrige Haus bleibt unberührt.',
      other: 'Die übrigen {count} Häuser bleiben unberührt.',
    },
    ending: 'Beenden …',
    confirmEnd: 'Ja, Zugang beenden',

    // Bearbeiten
    editHintManager: 'Gilt für alle {count} Häuser dieser Person – der Name gehört zur Person, nicht zum Haus.',
    usernameChangedHint:
      'Der QR-Code der Zugangskarte bleibt gültig, die PIN ebenfalls. Auf der <b>gedruckten</b> Karte steht aber noch der alte Benutzername – für die Anmeldung von Hand also neu drucken.',

    // Löschen mit Folgenanzeige
    deletePanel: {
      cleaningNow: '{name} reinigt gerade Zimmer {room} und lässt sich nicht löschen – erst die Reinigung abschließen.',
      nothingLost: '{name} hat noch keinen einzigen Eintrag im Tätigkeitsprotokoll – beim Löschen geht nichts verloren.',
      willBeDeleted: 'Das wird endgültig mitgelöscht:',
      periodOne: ' ({date})',
      periodRange: ' ({from} bis {to})',
      logEntriesLost: {
        one: '{count} Eintrag im Tätigkeitsprotokoll{period} – Schichten, Pausen und Reinigungen verschwinden damit aus der Auswertung',
        other: '{count} Einträge im Tätigkeitsprotokoll{period} – Schichten, Pausen und Reinigungen verschwinden damit aus der Auswertung',
      },
      cleaningsLost: {
        one: '{count} abgeschlossene Zimmerreinigung',
        other: '{count} abgeschlossene Zimmerreinigungen',
      },
      cardLost: 'die Zugangskarte (gedruckte Karte wird ungültig)',
      removeFromHouse: '{name} aus diesem Haus entfernen? Der Zugriff endet sofort.',
      accountKept: 'Das Anmeldekonto bleibt bestehen – daran hängen Vorgänge, die sonst ihre Zuordnung verlören.',
      accountDeleted: 'An diesem Zugang hängt nichts, das Anmeldekonto wird deshalb vollständig gelöscht.',
      checkIns: { one: '{count} Check-in', other: '{count} Check-ins' },
      ordersDone: { one: '{count} erledigte Anfrage', other: '{count} erledigte Anfragen' },
      logEntries: { one: '{count} Eintrag im Tätigkeitsprotokoll', other: '{count} Einträge im Tätigkeitsprotokoll' },
      keptMaid: '{list} <b>bleiben erhalten</b> – sie verlieren nur den Namen.',
      kept: '{list} <b>bleiben erhalten</b>.',
      confirmPrompt: 'Zum Bestätigen „{phrase}“ eingeben',
      deleting: 'Löschen …',
      confirmDelete: 'Ja, endgültig löschen',
      endInstead: 'Lieber Zugang beenden – Arbeitsnachweis bleibt',
    },

    // Rückmeldungen nach einem Vorgang
    notices: {
      reactivatedMaid: '{name} ist wieder aktiv – der alte Zugang (PIN und Zugangskarte) gilt erneut.',
      reactivated: '{name} ist wieder aktiv – der Zugriff auf dieses Haus gilt sofort.',
      endedHere: {
        one: 'Zugang von {name} für dieses Haus beendet – das übrige Haus bleibt unberührt.',
        other: 'Zugang von {name} für dieses Haus beendet – die übrigen {count} Häuser bleiben unberührt.',
      },
      ended: 'Zugang von {name} beendet – Anmeldung gesperrt, alle Daten bleiben erhalten.',
      deletedAccountKept: '{name} entfernt. Das Anmeldekonto bleibt bestehen, weil Vorgänge daran hängen.',
      deletedAccountKeptOther:
        '{name} entfernt. Das Anmeldekonto bleibt bestehen, weil Vorgänge daran hängen bzw. die Person noch andere Häuser betreut.',
      deletedMaid: '{name} endgültig gelöscht.',
      deletedAccount: '{name} entfernt – das Anmeldekonto wurde vollständig gelöscht.',
      renamedWithUsername: 'Geändert: {name} (@{username}). Gedruckte Zugangskarten tragen noch den alten Namen.',
      renamed: 'Geändert: {name}.',
      created: '{name} angelegt – die Zugangskarte kann jetzt gedruckt werden.',
      cardIssued: 'Neue Zugangskarte für {name} erzeugt – die alte Karte (PIN und QR-Code) ist ab sofort ungültig.',
      managerAttached: 'Manager diesem Haus zugeordnet – der Zugriff gilt sofort.',
      chooseManager: 'Bitte einen Manager auswählen.',
      loadFailed: 'Konnte nicht geladen werden.',
      linkFailed: 'Link konnte nicht erzeugt werden.',
    },
  },

  report: {
    title: 'Auswertung Reinigung',
    from: 'von',
    to: 'bis',
    show: 'Anzeigen',
    emptyTitle: 'Keine Tätigkeiten in diesem Zeitraum.',
    emptyHint: 'Sobald Reinigungskräfte Schichten und Reinigungen erfassen, erscheinen hier die Kennzahlen.',

    // Kennzahlen
    workTime: 'Arbeitszeit',
    shifts: { one: '{count} Schicht', other: '{count} Schichten' },
    breakShare: 'davon Pause',
    netWorkTime: 'Netto-Arbeitszeit',
    roomCleaning: 'Zimmerreinigung',
    rooms: { one: '{count} Zimmer', other: '{count} Zimmer' },
    avgPerRoom: 'Ø je Zimmer',
    otherCleaning: 'Sonstige Reinigung',
    otherCount: '{count}×',
    otherCountLegacy: '{count}× · {legacy} Alt-Einträge ohne Dauer',
    rest: 'Übrige Zeit',
    restHint: 'Wege, Rüstzeit',
    flagged: 'Auffällig',
    flaggedHint: '{shifts} Schichten ohne Ende · {aborted} abgebrochen · {open} offen · {implausible} unplausibel',

    // Team-Modus
    teamNote:
      'Dieses Haus wertet die Reinigung <b>nur als Team</b> aus (Einstellung unter Haus & Regeln): Die Kennzahlen oben sind die Summe über {shifts} im Zeitraum, eine Tabelle je Kraft und ein Tagesprotokoll gibt es nicht. Wer wann welches Zimmer gereinigt hat, steht im Zimmer-Verlauf als „Reinigungsteam“.',
    teamUnpaired: {
      one: 'Ein Eintrag aus der Zeit vor dem Team-Modus trägt keinen Schicht-Schlüssel mehr und ist in den Summen nicht enthalten.',
      other: '{count} Einträge aus der Zeit vor dem Team-Modus tragen keinen Schicht-Schlüssel mehr und sind in den Summen nicht enthalten.',
    },

    // Tabelle je Reinigungskraft
    table: {
      maid: 'Reinigungskraft',
      shifts: 'Schichten',
      workTime: 'Arbeitszeit',
      break: 'Pause',
      net: 'Netto',
      rooms: 'Zimmer',
      cleaningTime: 'Reinigungszeit',
      avgPerRoom: 'Ø je Zimmer',
      other: 'Sonstige',
      rest: 'Übrige Zeit',
    },
    deactivated: 'deaktiviert',
    openShifts: '+{count} offen',
    openShiftsTitle: '{count}× Schichtende vergessen – nicht in der Arbeitszeit enthalten',
    explainer:
      'Zeiten entstehen aus den Einträgen der Reinigungskräfte (Schicht, Pause, Reinigung Start/Ende). Vergessene Einträge werden nicht stillschweigend gekappt, sondern aus den Summen genommen und unter „Auffällig“ ausgewiesen: Schichten über {maxShift} h, Pausen und sonstige Reinigungen über {maxBreak} h sowie Zimmerreinigungen ohne Abschluss oder länger als {stale} Minuten. „Übrige Zeit“ ist der Rest der Netto-Arbeitszeit (Wege, Rüstzeit). Name anklicken für das Tagesprotokoll.',

    // Tagesprotokoll
    dayLog: 'Tagesprotokoll – {name}',
    closeDayLog: 'schließen',
    dayWork: '{duration} Arbeitszeit',
    dayBreak: '{duration} Pause',
    dayRooms: { one: '{count} Zimmer · {duration}', other: '{count} Zimmer · {duration}' },
    room: 'Zimmer {number}',
    kinds: {
      shift_start: 'Schichtbeginn',
      shift_end: 'Schichtende',
      break_start: 'Pause begonnen',
      break_end: 'Pause beendet',
      other_cleaning: 'Sonstige Reinigung (Einzeleintrag)',
      other_start: 'Sonstige Reinigung begonnen',
      other_end: 'Sonstige Reinigung beendet',
      clean_start: 'Reinigung gestartet',
      clean_done: 'Reinigung abgeschlossen',
      clean_aborted: 'Reinigung abgebrochen',
      clean_deferred: 'Gast an der Tür: später',
      clean_declined: 'Gast an der Tür: heute nicht',
    } as Record<string, string>,

    // Nachfrage
    demand: {
      title: 'Nachfrage – wann Gäste Reinigung wünschen',
      days: { one: '{count} Tag, Ortszeit', other: '{count} Tage, Ortszeit' },
      wishes: 'Reinigungswünsche',
      checkouts: 'Abreisen',
      peakHour: 'Spitzenstunde',
      hourRange: '{from}–{to} Uhr',
      uncovered: 'Wünsche ohne Kraft im Dienst',
      uncoveredValue: '{pct} %',
      uncoveredHint: 'Anteil, der in Stunden fiel, in denen niemand auf Schicht war',
      empty:
        'Noch keine Gast-Signale oder Abreisen in diesem Zeitraum. Sobald Gäste im Gästeportal tippen und die Rezeption auscheckt, entsteht hier das Tagesprofil.',
      hourTitle: '{from}–{to} Uhr: {wishes} Wünsche · {checkouts} Abreisen · {dnd}× Bitte nicht stören · Ø {staff} Kräfte',
      staffTitle: 'Ø {staff} Kräfte im Dienst',
      markerCheckout: 'Check-out',
      markerDaily: 'Tägl. Reinigung',
      legendWish: 'Reinigungswunsch (Gast tippt)',
      legendCheckout: 'Abreise (Check-out)',
      legendDnd: 'Bitte nicht stören',
      legendStaff: 'Ø Kräfte im Dienst',
      weekday: 'Wochentag',
      rowWishes: 'Wünsche',
      rowCheckouts: 'Abreisen',
      rowDnd: 'Bitte nicht stören',
      /** 0 = Montag … 6 = Sonntag, wie `WeekdayBucket.weekday`. */
      weekdays: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
      note:
        'Gezählt wird der Zeitpunkt, an dem ein Gast im Gästeportal tippt, und der Check-out-Klick der Rezeption – keine Wunschzeiten, sondern die tatsächliche Nachfrage. „Kräfte im Dienst“ kommt aus den Schicht-Einträgen, gemittelt über die Tage des Zeitraums. Liegen viele Wünsche in Stunden mit wenig oder keiner Kraft, ist das der Hinweis für die Schichtplanung.',
      noteRules: 'Check-out-Frist {checkout} Uhr, tägliche Reinigung ab {daily} Uhr.',
      noteRulesOff: 'Check-out-Frist {checkout} Uhr, tägliche Reinigung aus.',
    },
  },

  errors: {
    nameTooShort: 'Name muss mindestens 2 Zeichen haben.',
    nameTooLong: 'Name ist zu lang (maximal 80 Zeichen).',
    usernameTooShort: 'Benutzername muss mindestens 2 Zeichen haben (a–z, 0–9, . _ -).',
    usernameTaken: 'Benutzername bereits vergeben. Bitte einen anderen wählen.',
    usernameTakenHere: 'Benutzername bereits in diesem Haus vergeben.',
    usernameTakenNamed: 'Benutzername „{username}“ ist in diesem Haus bereits vergeben.',
    accountCreateFailed: 'Konto konnte nicht erstellt werden.',
    profileCreateFailed: 'Profil konnte nicht angelegt werden: {message}',
    membershipCreateFailed: 'Zuordnung konnte nicht angelegt werden: {message}',
    profileNotFound: 'Profil nicht gefunden.',
    notMaid: 'Profil ist kein Reinigungs-Zugang.',
    cardSaveFailed: 'Zugangskarte konnte nicht gespeichert werden: {message}',
    ownAccessEnd: 'Der eigene Zugang lässt sich hier nicht beenden.',
    ownAccessDelete: 'Der eigene Zugang lässt sich hier nicht löschen.',
    accessNotFound: 'Zugang nicht gefunden.',
    ownerOnlyManagers: 'Nur der Kontoinhaber kann Manager verwalten.',
    maidIsCleaning:
      'Diese Reinigungskraft reinigt gerade ein Zimmer. Erst die Reinigung abschließen (oder im Board als erledigt markieren).',
    maidIsCleaningRoom:
      'Diese Reinigungskraft reinigt gerade Zimmer {room}. Erst die Reinigung abschließen (oder im Board als erledigt markieren).',
    onlyMaidsHaveUsername: 'Nur Reinigungs-Zugänge haben einen Benutzernamen.',
    nothingToChange: 'Nichts zu ändern.',
    loginSwitchFailed: 'Anmeldung konnte nicht umgestellt werden: {message}',
    changeFailed: 'Ändern fehlgeschlagen: {message}',
    confirmPhrase: 'Bitte „{phrase}“ zur Bestätigung eingeben.',
    testAccountsDisabled: 'Testzugänge sind nicht freigeschaltet.',
    emailTaken: 'Für diese E-Mail-Adresse gibt es bereits einen Zugang.',
    emailTakenReactivate:
      'Für diese E-Mail-Adresse gibt es bereits einen Zugang. War die Person hier schon einmal tätig, steht sie unter „Beendete Zugänge“ und lässt sich dort wieder aktivieren.',
    emailTakenManager:
      'Für diese E-Mail-Adresse gibt es bereits einen Zugang. Ist die Person schon Manager im Konto, über „Vorhandenen Manager hinzufügen“ auswählen.',
    accessCreateFailed: 'Zugang konnte nicht erstellt werden.',
    inviteFailed: 'Die Einladung konnte nicht angelegt werden. Bitte die Adresse prüfen.',
    invalidEmail: 'Bitte eine gültige E-Mail-Adresse angeben.',
    noEmail: 'Zugang hat keine E-Mail-Adresse.',
    linkFailed: 'Der Link konnte nicht erzeugt werden.',
    managerNotFound: 'Manager nicht gefunden.',
    alreadyManager: 'Diese Person ist hier bereits Manager.',
    alreadyReception: 'Diese Person hat hier bereits einen Rezeptions-Zugang. Erst dort beenden.',
  },
}
