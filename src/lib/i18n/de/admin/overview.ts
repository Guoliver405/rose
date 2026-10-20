/**
 * Rezeption — Übersicht, Zimmer-Dialog, Zimmer-Verlauf, Service-Anfragen, Navigation, Einrichtungs-Band, Leiste „Ungespeicherte Änderungen“. Deutsche Texte, Verwaltung wird gesiezt.
 * Begriffe nach `Sessions/Begriffe-Entscheidungen.md`.
 */
export const overview = {
  /** Kopfzeile und Navigation des Rezeptions-Portals. */
  nav: {
    overview: 'Übersicht',
    services: 'Anfragen',
    evaluation: 'Auswertung',
    settings: 'Einstellungen',
    help: 'Hilfe',
    houses: 'Häuser',
    logout: 'Abmelden',
  },

  /** Seite `…/admin` — Kopf, Kennzahlen, leerer Zustand. */
  page: {
    title: 'Zimmer-Übersicht',
    kpi: {
      rooms: '{count} Zimmer',
      occupied: '{count} belegt',
      ready: '{count} bereit',
      toClean: '{count} zu reinigen',
      dnd: 'Bitte nicht stören: {count}',
      inProgress: '{count} in Arbeit',
      deactivated: '{count} außer Betrieb',
    },
    noRooms: 'Noch keine Zimmer angelegt.',
    noRoomsHint: 'Legen Sie unter <link>Zimmer</link> die Zimmer Ihres Hauses an – Nummer, Etage, optional Gebäudeteil.',
    /** Name einer verorteten Reinigungskraft, wenn das Profil keinen trägt. */
    maidFallback: 'Reinigungskraft',
  },

  /** Einrichtungs-Band auf der Übersicht. */
  setup: {
    progress: 'Einrichtung: noch {count} von {total} Schritten',
    next: 'Als Nächstes: <b>{todo}</b>',
    hint: ' – {hint}',
    allSteps: 'Alle Schritte',
    continue: 'Weiter einrichten',
  },

  /** Kacheln und Etagen-Gruppen. */
  grid: {
    floor: 'Etage {floor}',
    roomCount: { one: '{count} Zimmer', other: '{count} Zimmer' },
    maidsOnFloor: 'Reinigungskräfte auf dieser Etage',
    building: 'Gebäudeteil',
    unnamedBuilding: 'ohne Namen',
  },

  /** Zustand eines Zimmers als Zeile (Tooltip der Kachel, Kopf des Dialogs). Teile werden mit „ · “ verbunden. */
  status: {
    deactivated: 'Außer Betrieb',
    occupied: 'Belegt',
    freeReady: 'Frei & bereit',
    free: 'Frei',
    departureToday: 'Abreise heute',
    departureOn: 'Abreise am {date}',
    priority: 'priorisierte Reinigung',
    cleaning: 'Reinigung läuft',
    checkoutPending: 'Reinigung nach Check-out offen',
    wantsClean: 'Gast wünscht Reinigung',
    wantsCleanFrom: 'Gast wünscht Reinigung, frühestens ab {time}',
    deferredAtDoor: 'Reinigung ab {time} (an der Tür vereinbart)',
    dailyDue: 'Tägliche Reinigung fällig',
    declined: 'Heute keine Reinigung',
    dnd: 'Bitte nicht stören',
    urgentOrder: 'DRINGENDE Service-Anfrage',
    openOrders: { one: 'offene Service-Anfrage', other: '{count} offene Service-Anfragen' },
  },

  /** Auswahl des Abreisedatums (Check-in und laufender Aufenthalt). */
  departure: {
    open: 'offen',
    nights: { one: '{count} Nacht', other: '{count} Nächte' },
    date: 'Datum',
    on: 'Abreise am {date}',
  },

  /** Zimmer-Dialog der Übersicht. */
  dialog: {
    title: 'Zimmer {number}',
    location: 'Etage {floor}',
    locationInBuilding: '{building} · Etage {floor}',
    checkedInAt: 'Eingecheckt am {date}.',
    link: {
      headingFresh: 'Check-in erfolgreich – Zugang aushändigen',
      heading: 'Individueller Zugang',
      lead: 'Dieser Aufenthalt hat einen eigenen QR-Code – ohne PIN.',
      hint: 'Bitte ausdrucken oder per E-Mail schicken. Der Zugang endet mit dem Check-out.',
      print: 'Zugang drucken oder per E-Mail schicken',
    },
    pin: {
      headingFresh: 'Check-in erfolgreich – Gast-PIN',
      heading: 'Gast-PIN',
      hint: 'Dem Gast mitteilen – er scannt den QR-Code im Zimmer und gibt die PIN ein.',
      print: 'Check-in-Blatt drucken',
    },
    warningTitle: 'Zimmer nicht bereit',
    forceCheckIn: 'Trotzdem einchecken',
    deactivated: 'Dieses Zimmer ist außer Betrieb – kein Check-in, keine Reinigung. Unter <b>Einstellungen → Zimmer</b> lässt es sich wieder in Betrieb nehmen.',
    departureOptional: 'Abreise (optional)',
    checkIn: 'Check-in',
    checkingIn: 'Check-in …',
    departureToday: 'Abreise heute – Reinigung nach dem Check-out',
    departureOpen: 'Abreise offen',
    saveDeparture: 'Abreise speichern',
    bill: {
      toCollect: 'Zu kassieren',
      openHint: 'Noch offen und deshalb nicht in der Summe. Bereits erledigt? Dann jetzt abhaken – der Check-out schließt offene Anfragen als „nicht erbracht“.',
      markDone: 'erledigt',
      details: 'Details',
      noPaidExtras: 'Keine kostenpflichtigen Zusatzleistungen – beim Check-out ist nichts zu kassieren.',
      freeStillOpen: {
        one: 'Eine kostenfreie Anfrage ist noch offen.',
        other: '{count} kostenfreie Anfragen sind noch offen.',
      },
      maintenanceStaysOpen: {
        one: 'Eine Meldung ans Haus ist offen und bleibt es über den Check-out hinaus.',
        other: '{count} Meldungen ans Haus sind offen und bleiben es über den Check-out hinaus.',
      },
    },
    checkOut: 'Check-out',
    confirmCheckOut: 'Check-out bestätigen? Der Zugang des Gastes wird sofort beendet.',
    toCollectAmount: 'Zu kassieren: {amount}',
    openWillClose: {
      one: 'Eine offene Anfrage ({amount}) wird als „nicht erbracht“ geschlossen.',
      other: '{count} offene Anfragen ({amount}) werden als „nicht erbracht“ geschlossen.',
    },
    freeWillClose: {
      one: 'Eine kostenfreie Anfrage wird ebenfalls geschlossen.',
      other: '{count} kostenfreie Anfragen werden ebenfalls geschlossen.',
    },
    maintenanceRemains: {
      one: 'Eine Meldung ans Haus bleibt offen – sie gehört zum Zimmer und steht weiter bei den Anfragen.',
      other: '{count} Meldungen ans Haus bleiben offen – sie gehören zum Zimmer und stehen weiter bei den Anfragen.',
    },
    yesCheckOut: 'Ja, auschecken',
    checkingOut: 'Check-out …',
    pleaseWait: 'Bitte warten …',
    removePriority: 'Priorisierung aufheben',
    setPriority: 'Reinigung priorisieren',
    markCleaned: 'Reinigung als erledigt markieren',
    history: {
      title: 'Verlauf',
      range: 'letzte 30 Tage',
      loading: 'wird geladen …',
      empty: 'Keine Ereignisse in den letzten 30 Tagen.',
      bill: 'Aufstellung',
    },
  },

  /** Bildschirm nach dem Check-out (Betrag bleibt stehen). */
  checkedOut: {
    title: 'Check-out – Zimmer {number}',
    accessEnded: 'Der Zugang des Gastes ist beendet.',
    toCollect: 'Zu kassieren',
    nothingToCollect: 'Keine kostenpflichtigen Zusatzleistungen – es ist nichts zu kassieren.',
    maintenanceStillOpen: {
      one: 'Eine Meldung ans Haus ist weiterhin offen – das Zimmer trägt sie bis zur Erledigung, und der nächste Check-in warnt.',
      other: '{count} Meldungen ans Haus sind weiterhin offen – das Zimmer trägt sie bis zur Erledigung, und der nächste Check-in warnt.',
    },
    freeClosed: {
      one: 'Eine kostenfreie Anfrage wurde mitgeschlossen.',
      other: '{count} kostenfreie Anfragen wurden mitgeschlossen.',
    },
    openClosed: {
      one: 'Eine offene Anfrage wurde als „nicht erbracht“ geschlossen und steht nicht in der Summe.',
      other: '{count} offene Anfragen wurden als „nicht erbracht“ geschlossen und stehen nicht in der Summe.',
    },
    printBill: 'Details – Aufstellung drucken',
  },

  /** Einträge des Zimmer-Verlaufs (serverseitig erzeugt). */
  history: {
    pleaseClean: 'Reinigung angefordert',
    dndSet: '„Bitte nicht stören“ gesetzt',
    dndLifted: '„Bitte nicht stören“ aufgehoben',
    cleanWishLifted: 'Reinigungswunsch aufgehoben',
    prioritySet: 'Reinigung priorisiert',
    priorityLifted: 'Priorisierung aufgehoben',
    declined: 'Heute keine Reinigung gewünscht',
    cleanStart: 'Reinigung gestartet',
    cleanDone: 'Reinigung abgeschlossen',
    cleanAborted: 'Reinigung nicht abgeschlossen',
    cleanAbortedTimeout: 'Reinigung nicht abgeschlossen (Zeitlimit)',
    cleanAbortedTimeoutBy: 'Reinigung nicht abgeschlossen (Zeitlimit, {name})',
    doorDeferred: 'An der Tür: Gast möchte später',
    doorDeclined: 'An der Tür: Heute keine Reinigung',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    requested: 'Anfrage gestellt: {name}',
    requestDone: 'Anfrage erledigt: {name}',
    requestNotProvided: 'Anfrage nicht erbracht: {name}',
    /** Name eines Services, wenn weder Snapshot noch Baukasten ihn kennen. */
    fallbackService: 'Service',
    actors: {
      guest: 'Gast',
      system: 'System',
      team: 'Reinigungsteam',
      cleaning: 'Reinigung',
      reception: 'Rezeption',
    },
  },

  /** Seite „Anfragen“ (`…/admin/bestellungen`). */
  orders: {
    title: 'Anfragen',
    openCount: '{count} offen',
    empty: 'Keine offenen Anfragen.',
    emptyHint: 'Neue Anfragen aus dem Gästeportal erscheinen hier sofort.',
    urgent: 'dringend',
    done: 'Erledigt',
    recentlyClosed: 'Zuletzt abgeschlossen ({count})',
    notProvided: 'nicht erbracht',
    justNow: 'gerade eben',
    minutesAgo: 'vor {count} Min.',
    hoursAgo: 'vor {count} Std.',
    fallbackService: 'Service',
  },

  /** Gründe, warum ein Check-in eine Warnung mit „Trotzdem einchecken“ bekommt. */
  checkInWarnings: {
    notCleaned: 'Das Zimmer ist seit dem letzten Check-out noch nicht gereinigt.',
    priorityOpen: 'Für das Zimmer ist eine priorisierte Reinigung offen.',
    beingCleaned: 'Das Zimmer wird gerade gereinigt.',
    openMaintenance: 'Offene Meldung ans Haus: {name}.',
    fallbackService: 'Service',
  },

  /** Leiste „Ungespeicherte Änderungen“ der langen Einstellungsseiten (über den MessagesProvider). */
  unsaved: {
    leaveQuestion: 'Es gibt ungespeicherte Änderungen. Seite trotzdem verlassen?',
    /** `{time}` = Uhrzeit des Speicherns (24 Stunden). */
    saved: 'Gespeichert um {time} Uhr.',
    title: 'Ungespeicherte Änderungen',
    failed: 'Nicht gespeichert – der Hinweis steht beim Abschnitt.',
    discard: 'Verwerfen',
    save: 'Speichern',
  },

  errors: {
    departureInvalid: 'Abreisedatum ist ungültig.',
    departurePast: 'Abreisedatum liegt in der Vergangenheit.',
    departureTooFar: 'Abreisedatum liegt mehr als ein Jahr voraus.',
    roomDeactivated: 'Zimmer ist außer Betrieb – erst unter Einstellungen → Zimmer zurückholen.',
    roomOccupied: 'Zimmer ist bereits belegt.',
    checkInFailed: 'Check-in fehlgeschlagen: {message}',
    checkOutFailed: 'Check-out fehlgeschlagen: {message}',
    saveFailed: 'Speichern fehlgeschlagen: {message}',
    noActiveStay: 'Kein aktiver Aufenthalt auf diesem Zimmer.',
    noStay: 'Für dieses Zimmer läuft kein Aufenthalt.',
    stayWithoutAccess: 'Diesem Aufenthalt fehlt der Zugang.',
    accessNotFound: 'Zugang nicht gefunden.',
    requestAlreadyDone: 'Anfrage ist bereits erledigt.',
  },
}
