/**
 * Rezeption — Zimmer-Setup: Zimmer, Etagen, Gebäudeteile anlegen, bearbeiten, löschen. Deutsche Texte, Verwaltung wird gesiezt.
 * Begriffe nach `Sessions/Begriffe-Entscheidungen.md`.
 */
export const rooms = {
  page: {
    title: 'Zimmer verwalten',
  },

  /** Formular „Zimmer anlegen“. */
  create: {
    heading: 'Zimmer anlegen',
    modeAria: 'Anlege-Modus',
    modeIndividual: 'Etagen individuell',
    modeIdentical: 'Etagen identisch',
    modeIndividualHint: 'Zimmernummern gelten für die eine angegebene Etage.',
    modeIdenticalHint: 'Derselbe Nummernkreis wird auf jeder angegebenen Etage angelegt.',
    buildingLabel: 'Gebäudeteil (optional)',
    buildingPlaceholder: 'z. B. Haupthaus',
    floorLabel: 'Etage',
    floorsLabel: 'Etagen – Komma-Liste oder Bereich',
    floorsPlaceholder: 'z. B. 1-3',
    numbersLabelIndividual: 'Zimmernummern – einzeln, Komma-Liste oder Bereich',
    numbersLabelIdentical: 'Zimmernummern je Etage – einzeln, Komma-Liste oder Bereich',
    numbersPlaceholderIndividual: 'z. B. 101-110 oder 201, 202, 205',
    numbersPlaceholderIdentical: 'z. B. 01-10',
    prefixFloor: 'Etagennummer voranstellen (Etage 2 + „05“ → „205“)',
    collisionWarning:
      'Ohne vorangestellte Etagennummer ist dieselbe Nummer auf mehreren Etagen nicht möglich – Zimmernummern sind je Gebäudeteil eindeutig. Nur die erste Etage würde angelegt.',
    planned: {
      one: '{count} Zimmer wird angelegt: {list}',
      other: '{count} Zimmer werden angelegt: {list}',
    },
    plannedMore: '{list} … (+{more})',
    submit: 'Anlegen',
    submitting: 'Anlegen …',
    created: {
      one: '{count} Zimmer angelegt.',
      other: '{count} Zimmer angelegt.',
    },
    createdSkipped: {
      one: '{count} Zimmer angelegt, {skipped} übersprungen (Nummer existierte bereits).',
      other: '{count} Zimmer angelegt, {skipped} übersprungen (Nummer existierte bereits).',
    },
    errors: {
      invalidFloors: 'Bitte gültige Etage(n) angeben.',
    },
  },

  /** Bestandsliste unter dem Formular. */
  list: {
    empty: 'Noch keine Zimmer vorhanden.',
    intro:
      'Zimmer, Etage oder Gebäudeteil anklicken, um sie zu <b>bearbeiten</b>, <b>außer Betrieb zu nehmen</b> oder <b>zu löschen</b>. Verschrieben? Bearbeiten ändert Nummer, Etage und Gebäudeteil, ohne dass etwas verloren geht.',
    noBuilding: 'Ohne Gebäudeteil',
    floor: 'Etage {floor}',
    room: 'Zimmer {number}',
    roomCount: {
      one: '{count} Zimmer',
      other: '{count} Zimmer',
    },
    buildingSubtitle: {
      one: '{rooms} Zimmer auf {count} Etage',
      other: '{rooms} Zimmer auf {count} Etagen',
    },
    /** Trenner zwischen Gebäudeteil und Etage bzw. Zimmerzahl. */
    separator: ' · ',
    deactivatedCount: '{count} außer Betrieb',
    occupiedCount: '{count} belegt',
    deactivatedTitle: 'Außer Betrieb',
    occupiedAria: 'belegt',
    deactivatedAria: 'außer Betrieb',
  },

  /** Dialog für Zimmer, Etage oder Gebäudeteil. */
  dialog: {
    editHintRoom: 'Nummer, Etage oder Gebäudeteil korrigieren – nichts geht verloren',
    editHintFloor: 'Etage verschieben oder Gebäudeteil wechseln – nichts geht verloren',
    editHintBuilding: 'Gebäudeteil umbenennen – nichts geht verloren',
    deactivate: 'Außer Betrieb nehmen',
    deactivateHint: 'Verschwindet von Boards und Aushängen, Historie bleibt vollständig',
    reactivate: 'Wieder in Betrieb nehmen',
    reactivateHint: {
      one: '{count} Zimmer zurückholen',
      other: '{count} Zimmer zurückholen',
    },
    deleteForever: 'Endgültig löschen',
    deleteHint: 'Mit allen Aufenthalten und Vorgängen – nicht rückgängig zu machen',
    deleting: 'Löschen …',

    roomNumber: 'Zimmernummer',
    floor: 'Etage',
    buildingOrNone: 'Gebäudeteil (leer = ohne)',
    buildingPlaceholder: 'z. B. Haupthaus',
    appliesToAll: {
      one: 'Gilt für alle {count} Zimmer dieses Bereichs.',
      other: 'Gilt für alle {count} Zimmer dieses Bereichs.',
    },
    reprintWarning:
      'Die QR-Codes bleiben gültig – sie hängen am Zimmer, nicht an der Nummer. Bereits <b>gedruckte</b> Aushänge und Check-in-Blätter tragen aber die alte Beschriftung und sollten neu gedruckt werden.',

    checkingImpact: 'Auswirkungen werden geprüft …',
    occupiedBlocks: {
      one: 'Das Zimmer ist belegt und lässt sich nicht löschen – bitte zuerst auschecken.',
      other: '{count} Zimmer sind belegt und lassen sich nicht löschen – bitte zuerst auschecken.',
    },
    confirmLabel: 'Zum Bestätigen „{phrase}“ eingeben',
    deactivateInstead: 'Lieber außer Betrieb nehmen – Belege bleiben erhalten',

    reactivated: {
      one: '{count} Zimmer wieder in Betrieb.',
      other: '{count} Zimmer wieder in Betrieb.',
    },
    deactivated: {
      one: '{count} Zimmer außer Betrieb – Historie bleibt erhalten.',
      other: '{count} Zimmer außer Betrieb – Historie bleibt erhalten.',
    },
    deactivatedSkipped: {
      one: '{count} Zimmer außer Betrieb, {skipped} belegte übersprungen – Historie bleibt erhalten.',
      other: '{count} Zimmer außer Betrieb, {skipped} belegte übersprungen – Historie bleibt erhalten.',
    },
    noChange: 'Keine Änderung – alles war bereits so eingetragen.',
    edited: {
      one: '{count} Zimmer geändert.',
      other: '{count} Zimmer geändert.',
    },
    deleted: {
      one: '{label} gelöscht ({count} Zimmer).',
      other: '{label} gelöscht ({count} Zimmer).',
    },
    errors: {
      invalidFloor: 'Bitte eine gültige Etage angeben.',
    },
  },

  /** Was das Löschen kostet — Liste im Löschdialog. */
  impact: {
    rooms: {
      one: '{count} Zimmer',
      other: '{count} Zimmer',
    },
    stays: {
      one: '{count} Aufenthalt',
      other: '{count} Aufenthalte',
    },
    ordersOpen: {
      one: '{count} offene Service-Anfrage',
      other: '{count} offene Service-Anfragen',
    },
    ordersDone: {
      one: '{count} abgeschlossene Service-Anfrage',
      other: '{count} abgeschlossene Service-Anfragen',
    },
    ordersDoneAmount: {
      one: '{count} abgeschlossene Service-Anfrage ({amount})',
      other: '{count} abgeschlossene Service-Anfragen ({amount})',
    },
    transitions: {
      one: '{count} Eintrag im Zimmer-Verlauf',
      other: '{count} Einträge im Zimmer-Verlauf',
    },
    qrPosters: {
      one: '{count} QR-Code – gedruckte Aushänge werden ungültig',
      other: '{count} QR-Codes – gedruckte Aushänge werden ungültig',
    },
    neverUsed: 'Noch nie benutzt – beim Löschen gehen keine Daten verloren.',
    willBeDeleted: 'Das wird endgültig mitgelöscht:',
    cleaningLogsKept: {
      one: '{count} Eintrag der Reinigung bleibt <b>erhalten</b> – die Arbeitszeiten in der Auswertung verlieren nur den Zimmerbezug.',
      other: '{count} Einträge der Reinigung bleiben <b>erhalten</b> – die Arbeitszeiten in der Auswertung verlieren nur den Zimmerbezug.',
    },
  },

  /**
   * Bezeichnungen, die der Server für einen Bereich bildet. `confirm*` ist die
   * Bestätigungsphrase beim Löschen mit Historie — der Server gibt sie vor und
   * prüft gegen genau diesen Wortlaut. Ein Zimmer bestätigt man mit seiner
   * Nummer (Daten, keine Übersetzung).
   */
  scope: {
    room: 'Zimmer {number}',
    floor: 'Etage {floor}',
    floorInBuilding: '{building} · Etage {floor}',
    unnamedBuilding: 'Zimmer ohne Gebäudeteil',
    confirmFloor: 'Etage {floor}',
    confirmUnnamedBuilding: 'LÖSCHEN',
  },

  /** Meldungen der Server-Actions. */
  errors: {
    noRoomNumbers: 'Keine Zimmernummern angegeben.',
    invalidFloor: 'Ungültige Etage.',
    tooMany: 'Maximal {max} Zimmer pro Vorgang.',
    createFailed: 'Anlegen fehlgeschlagen: {message}',
    roomStatesFailed: 'Anlage des Zimmerstatus fehlgeschlagen: {message}',
    loadFailed: 'Laden fehlgeschlagen: {message}',
    roomOccupied: 'Zimmer ist belegt – bitte zuerst auschecken.',
    roomsOccupied: {
      one: '{count} Zimmer ist belegt – bitte zuerst auschecken.',
      other: '{count} Zimmer sind belegt – bitte zuerst auschecken.',
    },
    noRoomsFound: '{label}: keine Zimmer gefunden.',
    numberEmpty: 'Zimmernummer darf nicht leer sein.',
    numberTooLong: 'Zimmernummer ist zu lang (maximal {max} Zeichen).',
    numberSingleOnly: 'Eine Zimmernummer lässt sich nur einzeln vergeben.',
    buildingTooLong: 'Bezeichnung des Gebäudeteils ist zu lang (maximal {max} Zeichen).',
    nothingToChange: 'Nichts zu ändern.',
    numberTakenInBuilding: 'Zimmernummer {number} ist im Gebäudeteil „{building}“ bereits vergeben (Etage {floor}).',
    numberTakenNoBuilding: 'Zimmernummer {number} ist ohne Gebäudeteil bereits vergeben (Etage {floor}).',
    numberDuplicate: 'Zimmernummer {number} käme dabei doppelt vor – Nummern sind je Gebäudeteil eindeutig.',
    editFailed: 'Ändern fehlgeschlagen: {message}',
    noRoomsInScope: 'Keine Zimmer in diesem Bereich.',
    confirmMismatch: 'Bitte „{phrase}“ zur Bestätigung eingeben.',
    snapshotFailed: 'Abrechnungsstand konnte nicht gesichert werden: {message}',
    historyDeleteFailed: 'Löschen des Verlaufs fehlgeschlagen: {message}',
    deleteFailed: 'Löschen fehlgeschlagen: {message}',
  },
}
