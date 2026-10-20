import type { ContextShape } from '../format'
import type { ServiceMessages } from './service'

/**
 * Erläuterungen zum Reinigungsboard für Übersetzer (17.10.2026) — dieselben
 * Schlüssel wie `service.ts`. Daraus entsteht die Tabelle zum Gegenlesen.
 *
 * Für alle Texte gilt: Leserin ist eine Reinigungskraft, am Handy, zwischen
 * zwei Zimmern. Sie wird geduzt (Deutsch), kurz und freundlich. Wo der Name
 * einer Kollegin fehlt, steht „jemand aus dem Team“. Begriffe wie im
 * Gästeportal („Bitte nicht stören“, „Heute keine Reinigung“). Die Kacheln
 * sind schmal: Zustände höchstens zwei bis drei Wörter. Uhrzeiten im
 * 24-Stunden-Format. Platzhalter `{…}` bleiben stehen.
 */

const BAR = 'Reinigungsboard → Statusleiste oben (kompakt, eine Zeile)'
const FLOORS = 'Reinigungsboard → Liste der Etagen'
const TILE = 'Reinigungsboard → Zimmer-Kachel (schmal, am Handy)'
const DIALOG = 'Reinigungsboard → Zimmer-Dialog nach Tipp auf eine Kachel'
const STATUS = 'Seite „Mein Status“ (Schicht, Pause, Tagesbilanz)'
const LOGIN = 'Anmeldung der Reinigung (Benutzername + PIN oder Zugangskarte mit QR-Code)'
const ERROR = 'Fehlermeldung nach einem Tipp (roter Kasten)'

export const serviceContext = {
  brand: {
    board: { where: 'Kopf der Anmeldung und des Boards', note: 'Name der Seite: die gemeinsame Liste aller Zimmer für das Reinigungsteam.' },
    boardOf: { where: 'Kopf des Boards', note: '{hotel} = Name des Hauses.' },
  },

  common: {
    signOut: { where: 'Board → Abmelden', note: 'Kurz.' },
    floor: { where: FLOORS + ' und Überschriften', note: '{floor} = Etagennummer, z. B. 3.' },
    floorInBuilding: { where: FLOORS + ', wenn das Haus Gebäudeteile hat', note: '{building} = Name des Gebäudeteils, {floor} = Etage.' },
    room: { where: DIALOG + ' → Überschrift', note: '{number} = Zimmernummer.' },
    someone: { where: 'Überall, wo der Name einer Kollegin nicht genannt wird (Team-Modus)', note: 'Neutral, ohne Geschlecht.' },
    close: { where: DIALOG + ' → Knopf', note: 'Dialog schließen.' },
    slideHint: { where: 'Wisch-Schieber, kurz statt der Beschriftung, wenn jemand nur tippt', note: 'Sehr kurz; die Bahn ist schmal.' },
  },

  board: {
    youClean: { where: BAR, note: '{number} = Zimmernummer, in der die Kraft gerade reinigt.' },
    onBreak: { where: BAR, note: 'Zustand: in der Pause. Ein Wort.' },
    onOther: { where: BAR, note: 'Zustand: „sonstige Reinigung“ = Flure, Lobby, Wäsche — nicht ein Zimmer.' },
    onShift: { where: BAR, note: 'Zustand: Schicht läuft.' },
    onShiftSince: { where: BAR, note: '{time} = Uhrzeit des Schichtbeginns.' },
    offShift: { where: BAR, note: 'Zustand: keine Schicht.' },
    openCount: { where: BAR, note: '{count} = Zahl offener Zimmer. Sehr kurz.' },
    inProgressCount: { where: BAR, note: '{count} = Zimmer, die gerade jemand reinigt. Sehr kurz.' },
    priorityOpenTitle: { where: BAR + ' → Tooltip der violetten Warnlampe', note: '{floors} = Liste der Etagen mit priorisierter Reinigung (von der Rezeption).' },
    priorityOpen: { where: BAR + ' → violette Warnlampe', note: 'Sehr kurz: Es gibt priorisierte Zimmer.' },
    statusLink: { where: BAR + ' → Knopf zur Seite „Mein Status“', note: 'Ein Wort.' },
    offShiftHint: { where: 'Board → Hinweis, wenn keine Schicht läuft', note: 'Nennt den Knopf „Status“ wortgleich mit board.statusLink.' },

    backToFloors: { where: FLOORS + ' → Zurück aus einer Etage', note: 'Kurz.' },
    nothingOpen: { where: FLOORS + ' → Zeile einer Etage ohne Arbeit', note: 'Kleingeschrieben, sehr kurz.' },
    done: { where: FLOORS + ' → Etage fertig', note: 'Ein Wort, kleingeschrieben.' },
    next: { where: FLOORS + ' → Abzeichen an der empfohlenen Etage', note: 'Sehr kurz: diese Etage als nächste angehen.' },
    prio: { where: FLOORS + ' → Abzeichen „priorisiert“', note: 'Abkürzung für Priorität, sehr kurz.' },
    switchPriority: { where: 'Board → Wechselhinweis über der Zimmerliste', note: '{floor} = Name der Etage. Frage, ob die Kraft die Etage wechselt.' },
    switchDepartures: {
      one: { where: 'Board → Wechselhinweis', note: '{floor} = Etage. Eine Abreise muss bis zum Check-in fertig sein.' },
      other: { where: 'Board → Wechselhinweis', note: '{count} = Zahl der Abreisen, {floor} = Etage.' },
    },
    switchLoad: { where: 'Board → Wechselhinweis', note: '{floor} = Etage mit deutlich mehr Arbeit.' },
    switchTo: { where: 'Board → Slider unter dem Wechselhinweis', note: '{floor} = Ziel-Etage. Steht auf einem Schiebe-Knopf, kurz halten.' },

    youAreCleaning: { where: TILE, note: 'Diese Kraft reinigt dieses Zimmer.' },
    youAreHere: { where: FLOORS + ' → eigene Etage', note: 'Sehr kurz.' },
    someoneCleaning: { where: TILE, note: '{name} = Name der Kollegin oder „Jemand aus dem Team“.' },
    stale: { where: TILE, note: 'Eine Reinigung läuft ungewöhnlich lange — vermutlich vergessen abzuschließen.' },
    state: {
      priority: { where: TILE + ' → Zustand', note: 'Von der Rezeption priorisiert. Ein bis zwei Wörter.' },
      checkout: { where: TILE + ' → Zustand', note: 'Gast ist ausgecheckt, Zimmer muss gereinigt werden.' },
      wanted: { where: TILE + ' → Zustand', note: 'Gast hat im Portal Reinigung gewünscht.' },
      from: { where: TILE + ' → Zustand', note: '{time} = Uhrzeit, ab der gereinigt werden darf.' },
      dndLifted: { where: TILE + ' → Zustand', note: '{time} = Uhrzeit, zu der der Gast „Bitte nicht stören“ zurückgenommen hat.' },
      daily: { where: TILE + ' → Zustand', note: 'Tägliche Reinigung ist fällig. Kurz — wird sonst abgeschnitten.' },
      declined: { where: TILE + ' → Zustand', note: 'Wortgleich mit dem Knopf im Gästeportal.' },
      dnd: { where: TILE + ' → Zustand', note: 'Wortgleich mit dem Knopf im Gästeportal und dem Türschild.' },
      departureToday: { where: TILE + ' → Zustand', note: 'Gast reist heute ab.' },
      occupied: { where: TILE + ' → Zustand', note: 'Ein Wort.' },
      vacant: { where: TILE + ' → Zustand', note: 'Zimmer ist frei. Ein Wort.' },
    },

    finish: { where: DIALOG + ' → Schiebe-Knopf', note: 'Steht auf einem Slider, kurz.' },
    abort: { where: DIALOG + ' → Knopf', note: 'Reinigung abbrechen; das Zimmer bleibt auf dem Board offen.' },
    start: { where: DIALOG + ' → Schiebe-Knopf', note: 'Steht auf einem Slider, kurz.' },
    otherInRoom: { where: DIALOG, note: '{name} = Kollegin, die gerade im Zimmer reinigt.' },
    staleNamed: { where: DIALOG, note: '{name} = Kollegin. Ihre Reinigung wurde nicht abgeschlossen.' },
    staleUnnamed: { where: DIALOG, note: 'Wie staleNamed, ohne Namen (Team-Modus).' },
    door: {
      question: { where: DIALOG + ' → Bereich „Gast an der Tür“', note: 'Der Gast ist im Zimmer und möchte gerade keine Reinigung.' },
      in30: { where: DIALOG + ' → Knopf', note: 'Später: in 30 Minuten. Sehr kurz.' },
      in60: { where: DIALOG + ' → Knopf', note: 'Später: in 1 Stunde. Sehr kurz.' },
      today: { where: DIALOG + ' → Knopf', note: 'Heute nicht mehr reinigen. Sehr kurz.' },
      hint: { where: DIALOG + ' → Hinweis unter den Knöpfen', note: 'Nennt die drei Knöpfe wortgleich (door.in30, door.in60, door.today).' },
    },
    startShiftFirst: { where: DIALOG, note: 'Ohne Schicht kann keine Reinigung starten.' },
    busyElsewhere: { where: DIALOG, note: 'Die Kraft reinigt noch ein anderes Zimmer.' },
    guestDnd: { where: DIALOG, note: 'Gast hat „Bitte nicht stören“ gesetzt.' },
    deferredUntil: { where: DIALOG, note: '{time} = Uhrzeit, ab der gereinigt werden darf.' },
    guestDeclined: { where: DIALOG, note: 'Gast hat für heute verzichtet.' },
    nothingToDo: { where: DIALOG, note: 'Für dieses Zimmer ist nichts zu tun.' },
  },

  status: {
    back: { where: STATUS + ' → Zurück zum Board', note: 'Ein Wort, Name des Boards.' },
    title: { where: STATUS + ' → Überschrift', note: 'Name der Seite.' },
    youCleanRoom: { where: STATUS, note: '{number} = Zimmernummer.' },
    onBreak: { where: STATUS + ' → aktueller Zustand', note: 'Ein Wort.' },
    onOther: { where: STATUS + ' → aktueller Zustand', note: '„Sonstige Reinigung“ (Flure, Lobby) läuft.' },
    onShift: { where: STATUS + ' → aktueller Zustand', note: 'Schicht läuft.' },
    offShift: { where: STATUS + ' → aktueller Zustand', note: 'Keine Schicht.' },
    since: { where: STATUS + ' → unter dem Zustand', note: '{time} = Uhrzeit.' },
    shiftSince: { where: STATUS + ' → unter dem Zustand', note: '{time} = Uhrzeit des Schichtbeginns.' },
    workToday: { where: STATUS + ' → Tagesbilanz', note: 'Beschriftung einer Zahl (Stunden).' },
    breakToday: { where: STATUS + ' → Tagesbilanz', note: 'Beschriftung einer Zahl.' },
    roomsToday: { where: STATUS + ' → Tagesbilanz', note: 'Beschriftung einer Zahl (gereinigte Zimmer).' },
    otherCleaning: { where: STATUS + ' → Tagesbilanz', note: 'Beschriftung einer Zahl (Zeit für sonstige Reinigung).' },
    change: { where: STATUS + ' → Überschrift der Schiebe-Knöpfe', note: 'Kurz.' },
    shiftStart: { where: STATUS + ' → Schiebe-Knopf', note: 'Kurz, steht auf einem Slider.' },
    shiftEnd: { where: STATUS + ' → Schiebe-Knopf', note: 'Kurz, steht auf einem Slider.' },
    breakStart: { where: STATUS + ' → Schiebe-Knopf', note: 'Kurz, steht auf einem Slider.' },
    breakEnd: { where: STATUS + ' → Schiebe-Knopf', note: 'Kurz, steht auf einem Slider.' },
    otherStart: { where: STATUS + ' → Schiebe-Knopf', note: 'Kurz, steht auf einem Slider.' },
    otherEnd: { where: STATUS + ' → Schiebe-Knopf', note: 'Kurz, steht auf einem Slider.' },
    endBreakFirst: { where: STATUS + ' → Hinweis', note: 'Pause und andere Tätigkeiten dürfen sich nicht überschneiden.' },
    roomStillOpen: { where: STATUS + ' → Hinweis', note: '{number} = Zimmernummer einer laufenden Reinigung.' },
    otherEndsWithShift: { where: STATUS + ' → Hinweis', note: 'Das Schichtende beendet auch die sonstige Reinigung.' },
    saving: { where: STATUS + ' → während des Speicherns', note: 'Kleingeschrieben, mit Auslassungszeichen „…“.' },
    teamMode: { where: STATUS + ' → Hinweis unten', note: 'Nur in Häusern, die Tätigkeiten ohne Personenbezug auswerten (Datenschutz).' },
  },

  login: {
    username: { where: LOGIN + ' → Feldbeschriftung', note: 'Kurzer Anmeldename, nicht der angezeigte Name.' },
    usernamePlaceholder: { where: LOGIN + ' → grauer Text im leeren Feld', note: 'Beispiel, kleingeschrieben.' },
    usernameHint: { where: LOGIN + ' → Hinweis unter dem Feld', note: 'Auf der Zugangskarte steht der Anmeldename hinter dem @-Zeichen.' },
    pin: { where: LOGIN + ' → Feldbeschriftung', note: 'Persönliche Geheimzahl.' },
    submit: { where: LOGIN + ' → Knopf', note: 'Kurz.' },
    lostCard: { where: LOGIN + ' → Hinweis unten', note: 'Die Rezeption kann Zugangskarten drucken.' },
    invalid: { where: LOGIN + ' → Fehlermeldung', note: 'Unterscheidet bewusst nicht, ob Name oder PIN falsch ist.' },
    missing: { where: LOGIN + ' → Fehlermeldung', note: 'Ein Feld ist leer.' },
    cardInvalid: { where: LOGIN + ' → Fehlermeldung nach Scan einer alten Karte', note: 'Die Karte wurde ersetzt.' },
    deactivated: { where: LOGIN + ' → Hinweis', note: 'Der Zugang dieser Person wurde beendet.' },
    cardInvalidNoHouse: { where: 'Hinweisseite ohne Haus nach Scan einer alten Karte', note: 'Wie cardInvalid, ohne Formular.' },
    scanTitle: { where: 'Hinweisseite ohne Haus → Überschrift', note: 'Aufforderung, die Zugangskarte zu scannen.' },
    scanText: { where: 'Hinweisseite ohne Haus → Text', note: '„Adresse des Hauses“ = Web-Adresse auf der Zugangskarte.' },
  },

  errors: {
    notSignedIn: { where: ERROR, note: 'Sitzung abgelaufen.' },
    shiftRunning: { where: ERROR, note: 'Schicht wurde schon begonnen.' },
    noShift: { where: ERROR, note: 'Keine Schicht läuft.' },
    finishCleaningFirst: { where: ERROR, note: 'Erst die laufende Reinigung beenden.' },
    invalidFloor: { where: ERROR, note: 'Technischer Ausnahmefall.' },
    startShiftFirst: { where: ERROR, note: 'Erst die Schicht beginnen.' },
    breakOnlyOnShift: { where: ERROR, note: 'Pause geht nur während der Schicht.' },
    onlyOnShift: { where: ERROR, note: 'Allgemein: nur während der Schicht.' },
    endBreakFirst: { where: ERROR, note: 'Erst die Pause beenden.' },
    alreadyCleaning: { where: ERROR, note: 'Es läuft schon eine Reinigung.' },
    roomNotFound: { where: ERROR, note: 'Technischer Ausnahmefall.' },
    guestDnd: { where: ERROR, note: 'Wortgleich mit board.guestDnd.' },
    guestDeferred: { where: ERROR, note: '{time} = Uhrzeit. Wortgleich mit board.deferredUntil.' },
    nothingOpen: { where: ERROR, note: 'Für das Zimmer ist nichts zu tun.' },
    nothingOpenNow: { where: ERROR, note: 'Gerade nichts zu tun (Zustand hat sich geändert).' },
    takenByOther: { where: ERROR, note: 'Eine Kollegin reinigt schon.' },
    justTaken: { where: ERROR, note: 'Eine Kollegin war schneller.' },
    notYours: { where: ERROR, note: 'Die laufende Reinigung gehört einer anderen Kraft.' },
    unknownChoice: { where: ERROR, note: 'Technischer Ausnahmefall.' },
    saveFailed: { where: ERROR, note: '{message} = technische Fehlermeldung, unübersetzt.' },
    enterFloorFailed: { where: ERROR, note: '{message} = technische Fehlermeldung. „Einbuchen“ = sich auf einer Etage als anwesend melden.' },
  },
} satisfies ContextShape<ServiceMessages>
