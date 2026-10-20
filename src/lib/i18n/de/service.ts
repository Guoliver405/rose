/**
 * Reinigungsboard — deutsche Texte (ausgelagert 10.10.2026).
 *
 * Begriffe nach `Sessions/Begriffe-Entscheidungen.md`: Die Reinigungskraft
 * wird geduzt. Wo der Name einer Kollegin fehlt, steht „jemand aus dem Team“
 * (nie „Kollegin“). „Tägliche Reinigung“ statt „Routine“, „Bitte nicht
 * stören“ als eine Schreibweise, „Eintrag“ statt „Stich“. Karten druckt die
 * Rezeption, deshalb verweisen die Texte dorthin und nicht ans „Management“.
 *
 * Pluralformen stehen als `{ one, other }` und laufen über `plural()`.
 */
export const service = {
  brand: {
    board: 'Reinigungsboard',
    boardOf: 'Reinigungsboard · {hotel}',
  },

  common: {
    signOut: 'Abmelden',
    floor: 'Etage {floor}',
    floorInBuilding: '{building} · Etage {floor}',
    room: 'Zimmer {number}',
    someone: 'Jemand aus dem Team',
    close: 'Schließen',
    slideHint: 'Zum Bestätigen wischen',
  },

  board: {
    // Statusleiste
    youClean: 'Du reinigst {number}',
    onBreak: 'Pause',
    onOther: 'Sonstige Reinigung',
    onShift: 'Auf Schicht',
    onShiftSince: 'Auf Schicht seit {time}',
    offShift: 'Nicht auf Schicht',
    openCount: '{count} offen',
    inProgressCount: '{count} in Arbeit',
    priorityOpenTitle: 'Priorisierte Reinigung offen: {floors}',
    priorityOpen: 'Prio offen',
    statusLink: 'Status',
    offShiftHint: 'Du bist nicht auf Schicht – Reinigungen lassen sich erst nach dem Schichtbeginn starten (Knopf „Status“).',

    // Etagen
    backToFloors: 'Zurück zu allen Etagen',
    nothingOpen: 'nichts offen',
    done: 'fertig',
    next: 'Als Nächstes',
    prio: 'Prio',
    switchPriority: 'Priorisiertes Zimmer auf {floor} – wechseln?',
    switchDepartures: {
      one: 'Eine Abreise wartet auf {floor} – der Check-in rückt näher. Wechseln?',
      other: '{count} Abreisen warten auf {floor} – der Check-in rückt näher. Wechseln?',
    },
    switchLoad: 'Auf {floor} ist deutlich mehr zu tun – wechseln?',
    switchTo: 'Auf {floor} wechseln',

    // Zimmer-Zustand (Kachel und Dialog)
    youAreCleaning: 'Du reinigst dieses Zimmer',
    youAreHere: 'Du bist hier',
    someoneCleaning: '{name} reinigt gerade',
    stale: 'Abschluss vergessen?',
    state: {
      priority: 'Priorisiert',
      checkout: 'Ausgecheckt',
      wanted: 'Reinigung gewünscht',
      from: 'Reinigung ab {time}',
      dndLifted: '„Bitte nicht stören“ aufgehoben {time}',
      // Auf dem Board ist jedes aktive Zimmer fällig — „fällig“ würde auf der Handy-Kachel abgeschnitten.
      daily: 'Tägliche Reinigung',
      declined: 'Heute keine Reinigung',
      dnd: 'Bitte nicht stören',
      departureToday: 'Abreise heute',
      occupied: 'Belegt',
      vacant: 'Frei',
    },

    // Zimmer-Dialog
    finish: 'Reinigung abschließen',
    abort: 'Reinigung abbrechen (Zimmer bleibt offen)',
    start: 'Reinigung starten',
    otherInRoom: '{name} ist gerade in diesem Zimmer.',
    staleNamed: 'Die Reinigung von {name} wurde offenbar nicht abgeschlossen – das Zimmer gilt wieder als offen.',
    staleUnnamed: 'Eine Reinigung wurde offenbar nicht abgeschlossen – das Zimmer gilt wieder als offen.',
    door: {
      question: 'Gast ist im Zimmer und möchte gerade nicht?',
      in30: 'In 30 Min',
      in60: 'In 1 Std',
      today: 'Heute nicht',
      hint: '„In 30 Min“ und „In 1 Std“ nehmen das Zimmer bis dahin für alle vom Board. „Heute nicht“ erledigt es für heute – wünscht der Gast doch noch Reinigung, tippt er im Portal.',
    },
    startShiftFirst: 'Erst die Schicht beginnen, dann kannst du hier starten.',
    busyElsewhere: 'Du bist noch in einem anderen Zimmer – erst dort abschließen oder abbrechen.',
    guestDnd: 'Der Gast möchte nicht gestört werden.',
    deferredUntil: 'Reinigung erst ab {time} Uhr – dann steht das Zimmer von selbst wieder offen.',
    guestDeclined: 'Der Gast möchte heute keine Reinigung.',
    nothingToDo: 'Für dieses Zimmer ist keine Reinigung offen.',
  },

  status: {
    back: 'Board',
    title: 'Mein Status',
    youCleanRoom: 'Du reinigst Zimmer {number}',
    onBreak: 'Pause',
    onOther: 'Sonstige Reinigung läuft',
    onShift: 'Auf Schicht',
    offShift: 'Nicht auf Schicht',
    since: 'seit {time} Uhr',
    shiftSince: 'Schicht seit {time} Uhr',
    workToday: 'Arbeitszeit heute',
    breakToday: 'Pause heute',
    roomsToday: 'Zimmer heute',
    otherCleaning: 'Sonstige Reinigung',
    change: 'Status wechseln',
    shiftStart: 'Schicht beginnen',
    shiftEnd: 'Schicht beenden',
    breakStart: 'Pause beginnen',
    breakEnd: 'Pause beenden',
    otherStart: 'Sonstige Reinigung starten',
    otherEnd: 'Sonstige Reinigung beenden',
    endBreakFirst: 'Erst die Pause beenden – Tätigkeiten dürfen sich nicht überschneiden.',
    roomStillOpen: 'Zimmer {number} ist noch offen – erst im Board abschließen oder abbrechen.',
    otherEndsWithShift: 'Die laufende sonstige Reinigung wird beim Schichtende automatisch beendet.',
    saving: 'wird gespeichert …',
    teamMode:
      'Dieses Haus wertet die Reinigung nur als Team aus. Deine Tagesbilanz siehst du während der Schicht; mit dem Schichtende werden deine Einträge ohne deinen Namen gespeichert.',
  },

  login: {
    username: 'Benutzername',
    usernamePlaceholder: 'anmeldename',
    usernameHint: 'Der kurze Anmeldename von deiner Zugangskarte (steht dort hinter dem @), nicht dein angezeigter Name.',
    pin: 'PIN',
    submit: 'Anmelden',
    lostCard: 'Zugangskarte mit QR-Code verloren? Die Rezeption kann jederzeit eine neue drucken.',
    invalid:
      'Benutzername oder PIN ist falsch. Der Benutzername ist der kurze Anmeldename von der Zugangskarte (hinter dem @), nicht der angezeigte Name.',
    missing: 'Bitte alle Felder ausfüllen.',
    cardInvalid: 'QR-Code ist nicht mehr gültig. Bitte mit Benutzername und PIN anmelden oder an der Rezeption eine neue Karte holen.',
    deactivated: 'Dieser Zugang ist nicht mehr aktiv. Bitte wende dich an die Rezeption.',
    // Mandantenfreie Seite `/service/login`
    cardInvalidNoHouse: 'QR-Code ist nicht mehr gültig. Bitte an der Rezeption eine neue Zugangskarte holen.',
    scanTitle: 'Bitte scanne deine Zugangskarte.',
    scanText:
      'Für die Anmeldung mit Benutzername und PIN wird die Adresse deines Hauses gebraucht – sie steht auf der Zugangskarte. Die Rezeption kann jederzeit eine neue Karte drucken.',
  },

  errors: {
    notSignedIn: 'Nicht angemeldet.',
    shiftRunning: 'Schicht läuft bereits.',
    noShift: 'Keine laufende Schicht.',
    finishCleaningFirst: 'Erst die laufende Reinigung abschließen (oder abbrechen).',
    invalidFloor: 'Ungültige Etage.',
    startShiftFirst: 'Erst die Schicht beginnen.',
    breakOnlyOnShift: 'Pause nur während der Schicht.',
    onlyOnShift: 'Nur während der Schicht.',
    endBreakFirst: 'Erst die Pause beenden.',
    alreadyCleaning: 'Es läuft bereits eine Reinigung – erst abschließen oder abbrechen.',
    roomNotFound: 'Zimmer nicht gefunden.',
    guestDnd: 'Der Gast möchte nicht gestört werden.',
    guestDeferred: 'Reinigung erst ab {time} Uhr – dann steht das Zimmer von selbst wieder offen.',
    nothingOpen: 'Für dieses Zimmer ist keine Reinigung offen.',
    nothingOpenNow: 'Für dieses Zimmer ist gerade keine Reinigung offen.',
    takenByOther: 'Zimmer wird schon von jemandem aus dem Team gereinigt.',
    justTaken: 'Zimmer wurde gerade von jemandem aus dem Team übernommen.',
    notYours: 'Diese Reinigung läuft nicht auf deinen Namen.',
    unknownChoice: 'Unbekannte Auswahl.',
    saveFailed: 'Speichern fehlgeschlagen: {message}',
    enterFloorFailed: 'Einbuchen fehlgeschlagen: {message}',
  },
}

export type ServiceMessages = typeof service
