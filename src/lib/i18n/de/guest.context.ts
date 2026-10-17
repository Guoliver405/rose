import type { ContextShape } from '../format'
import type { GuestMessages } from './guest'

/**
 * Erläuterungen zum Gästeportal für Übersetzer (17.10.2026) — dieselben
 * Schlüssel wie `guest.ts`. Daraus entsteht die Tabelle zum Gegenlesen
 * (`scripts/translation-sheet.mjs`), für jede weitere Sprache neu.
 *
 * Für alle Texte gilt: Leser ist der Gast, auf dem Handy, oft müde oder in
 * Eile. Er wird höflich angesprochen (Deutsch: „Sie“), das Haus spricht als
 * „wir“ bzw. „unser Haus“ — nie „Hotel“, weil auch Pensionen und Apartments
 * RoSe nutzen. Uhrzeiten kommen im 24-Stunden-Format (z. B. 10:00).
 * Platzhalter in geschweiften Klammern und Tags wie `<b>…</b>` müssen in der
 * Übersetzung stehen bleiben, die Reihenfolge im Satz darf sich ändern.
 */

const LOGIN = 'Anmeldung (Zimmernummer + PIN oder nur PIN nach Scan des Zimmer-QR-Codes)'
const ENTRY = 'Hinweisseite ohne Haus (wer die allgemeine Adresse aufruft oder einen abgelaufenen Link öffnet)'
const STATUS = 'Gästeportal → Karte „Reinigung“ ganz oben (Stand der Reinigung heute)'
const SIGNAL = 'Gästeportal → Knöpfe zur Reinigung'
const SERVICES = 'Gästeportal → Abschnitt Services'
const ERROR = 'Fehlermeldung (roter Kasten unter dem Knopf bzw. Formular)'
const BUTTON = 'Knopf-Beschriftung, höchstens etwa 20 Zeichen; steht auch als Legende auf dem gedruckten Check-in-Blatt und muss dort wortgleich sein.'

export const guestContext = {
  brand: {
    portal: { where: 'Kopf der Hinweisseiten; Rückfall, wenn das Haus keinen Namen hat', note: 'Produktname der Gastseite. Kurz, wie ein Titel.' },
    signIn: { where: 'Unter dem Logo „RoSe“ auf der Anmeldeseite', note: 'Titelzeile: Name der Seite + was man hier tut.' },
  },

  login: {
    room: { where: LOGIN + ' → Überschrift, wenn das Zimmer schon bekannt ist (Zimmer-QR)', note: '{number} = Zimmernummer, z. B. „101“ oder „A12“.' },
    roomNumber: { where: LOGIN + ' → Feldbeschriftung', note: 'Beschriftung des Eingabefelds.' },
    roomNumberPlaceholder: { where: LOGIN + ' → grauer Text im leeren Feld', note: 'Beispiel einer Zimmernummer; Abkürzung für „zum Beispiel“ der Sprache.' },
    pin: { where: LOGIN + ' → Feldbeschriftung', note: 'Persönliche Geheimzahl, 4–8 Ziffern. „PIN“ ist international verständlich.' },
    submit: { where: LOGIN + ' → Knopf', note: 'Knopf zum Anmelden, kurz.' },
    submitting: { where: LOGIN + ' → Knopf während des Ladens', note: 'Kurz, mit Auslassungszeichen „…“ am Ende.' },
    pinHint: { where: LOGIN + ' → Hinweis unter dem PIN-Feld', note: 'Wer keine PIN hat, erfährt, woher sie kommt.' },
    linkModeHint: { where: LOGIN + ' → gelber Hinweis oben', note: 'Nur in Häusern, die statt PIN einen persönlichen QR-Code/Link je Aufenthalt ausgeben. Erklärt, dass das Formular darunter meist nicht gebraucht wird.' },
    invalidLink: { where: 'Seite nach Scan eines unbekannten Zimmer-QR-Codes → Überschrift', note: 'Der QR-Code ist ungültig (z. B. Zimmer gelöscht).' },
    invalidLinkHint: { where: 'Seite nach Scan eines unbekannten Zimmer-QR-Codes → Text darunter', note: 'Ausweg: an die Rezeption wenden.' },
  },

  entry: {
    scanTitle: { where: ENTRY + ' → Überschrift', note: 'Hier spricht das Produkt, nicht ein bestimmtes Haus.' },
    scanText: { where: ENTRY + ' → Text', note: '„Adresse des Hauses“ = Web-Adresse auf dem Check-in-Blatt. „Blatt“ = gedrucktes Blatt beim Check-in.' },
    expiredTitle: { where: ENTRY + ' → Überschrift, wenn ein persönlicher Link abgelaufen ist', note: 'Der Link galt nur für einen Aufenthalt.' },
    expiredText: { where: ENTRY + ' → Text dazu', note: 'Freundlich, nicht vorwurfsvoll: der Zugang endet mit dem Check-out.' },
  },

  status: {
    room: { where: 'Gästeportal → große Überschrift oben', note: '{number} = Zimmernummer.' },
    signOut: { where: 'Gästeportal → kleiner Link ganz unten', note: 'Abmelden auf diesem Gerät.' },
    inProgress: {
      title: { where: STATUS + ' → Titel', note: 'Gerade jetzt wird gereinigt.' },
      text: { where: STATUS + ' → Text', note: '„Reinigungsteam“ = Housekeeping, ohne Namen einzelner Personen.' },
    },
    scheduled: {
      title: { where: STATUS + ' → Titel', note: 'Reinigung ist heute vorgesehen (Wunsch, tägliche Reinigung oder Rezeption), ohne Uhrzeit.' },
      text: { where: STATUS + ' → Text', note: 'Kein Termin, keine Uhrzeit versprechen.' },
    },
    scheduledFrom: {
      title: { where: STATUS + ' → Titel', note: '{time} = Uhrzeit, z. B. 11:00. Vorher wird nicht gereinigt.' },
      guest: { where: STATUS + ' → Text, wenn der Gast selbst „frühestens ab“ gewählt hat', note: 'Bestätigt den Wunsch des Gastes.' },
      door: { where: STATUS + ' → Text, wenn der Gast an der Zimmertür „später“ gesagt hat', note: 'Bezieht sich auf ein Gespräch mit dem Reinigungsteam an der Tür.' },
      daily: { where: STATUS + ' → Text, wenn die tägliche Reinigung erst später fällig wird', note: 'Nennt den Knopf „Heute keine Reinigung“ in Anführungszeichen — wortgleich mit signal.skip.label.' },
    },
    dnd: {
      title: { where: STATUS + ' → Titel bei „Bitte nicht stören“', note: 'Bestätigt: niemand kommt.' },
      text: { where: STATUS + ' → Text', note: 'Nennt den Knopf „Bitte nicht stören“ wortgleich mit signal.dnd.label.' },
    },
    done: {
      title: { where: STATUS + ' → Titel nach der Reinigung', note: '{time} = Uhrzeit des Abschlusses.' },
      text: { where: STATUS + ' → Text', note: 'Nennt den Knopf „Zimmer reinigen“ wortgleich mit signal.clean.label.' },
    },
    declined: {
      title: { where: STATUS + ' → Titel, wenn der Gast heute verzichtet', note: 'Nur in Häusern mit täglicher Reinigung.' },
      text: { where: STATUS + ' → Text', note: 'Dank + Umweltnutzen, dann der Weg zurück („Zimmer reinigen“ wortgleich mit signal.clean.label).' },
    },
    departure: {
      title: { where: STATUS + ' → Titel am Abreisetag', note: 'Nur, wenn die Rezeption ein Abreisedatum eingetragen hat.' },
      text: { where: STATUS + ' → Text', note: 'Am Abreisetag wird nach dem Check-out gereinigt.' },
    },
    none: {
      title: { where: STATUS + ' → Titel, wenn heute nichts vorgesehen ist', note: 'Sachlich, kein Bedauern.' },
      firstDay: { where: STATUS + ' → Text am Anreisetag (Haus reinigt täglich)', note: '{time} = Uhrzeit der täglichen Reinigung. Tägliche Reinigung beginnt am Tag nach der Anreise.' },
      onRequest: { where: STATUS + ' → Text (Haus reinigt nur auf Wunsch)', note: 'Der Gast muss selbst anfordern, sonst kommt niemand.' },
    },
  },

  signal: {
    clean: {
      label: { where: SIGNAL + ' → großer Knopf', note: BUTTON },
      active: { where: SIGNAL + ' → Zeile unter dem Knopf, Wunsch aktiv', note: 'Erneutes Tippen nimmt den Wunsch zurück.' },
      activeFrom: { where: SIGNAL + ' → Zeile unter dem Knopf, Wunsch mit „frühestens ab“', note: '{time} = Uhrzeit.' },
      blocked: { where: SIGNAL + ' → Zeile unter dem Knopf außerhalb der Reinigungszeiten', note: 'Kurz; die Zeiten stehen in signal.window darunter.' },
      idle: { where: SIGNAL + ' → Zeile unter dem Knopf, noch nicht getippt', note: 'Was passiert, wenn man tippt.' },
      idleFrom: { where: SIGNAL + ' → Zeile unter dem Knopf, „frühestens ab“ gewählt, noch nicht getippt', note: '{time} = Uhrzeit.' },
    },
    defer: {
      title: { where: SIGNAL + ' → Überschrift der Uhrzeit-Auswahl unter „Zimmer reinigen“', note: 'Sehr kurz: darunter stehen Knöpfe „jetzt“, „10:00“, „11:00“ …' },
      now: { where: SIGNAL + ' → erster Knopf der Uhrzeit-Auswahl', note: 'Einzelnes Wort, kleingeschrieben wie die Uhrzeiten daneben.' },
      onlyNow: { where: SIGNAL + ' → statt der Auswahl, wenn keine spätere Stunde mehr möglich ist', note: 'Bezieht sich auf den Knopf „jetzt“.' },
      limit: { where: SIGNAL + ' → Hinweis unter der Uhrzeit-Auswahl', note: '{limit} = späteste Uhrzeit, <b>…</b> = fett. Die Grenze legt das Haus fest.' },
    },
    window: { where: SIGNAL + ' → Hinweis außerhalb der Reinigungszeiten', note: '{start}/{end} = Uhrzeiten, <b>…</b> = fett. Nennt den Knopf „Zimmer reinigen“ wortgleich mit signal.clean.label.' },
    skip: {
      label: { where: SIGNAL + ' → Knopf (nur bei täglicher Reinigung)', note: BUTTON + ' Gilt nur für heute — nicht dasselbe wie „Bitte nicht stören“.' },
      active: { where: SIGNAL + ' → Zeile unter dem Knopf, aktiv', note: 'Dank, gilt nur heute, erneut tippen nimmt zurück.' },
      idle: { where: SIGNAL + ' → Zeile unter dem Knopf, nicht aktiv', note: 'Unterschied zu „Bitte nicht stören“: Services kommen trotzdem.' },
    },
    dnd: {
      label: { where: SIGNAL + ' → Knopf', note: BUTTON + ' Entspricht dem Türschild „Do not disturb“.' },
      active: { where: SIGNAL + ' → Zeile unter dem Knopf, aktiv', note: 'Erneut tippen schaltet aus.' },
      idle: { where: SIGNAL + ' → Zeile unter dem Knopf, nicht aktiv', note: 'Auch Services klopfen nicht — wichtig zur Abgrenzung von „Heute keine Reinigung“.' },
    },
  },

  services: {
    heading: { where: SERVICES + ' → Überschrift', note: 'Steht auch als Legende auf dem gedruckten Blatt. Danach folgen die Services, die das Haus selbst anlegt (z. B. Handtücher, Reparatur).' },
    links: { where: SERVICES + ' → Überschrift der Links nach außen', note: 'Z. B. Trinkgeld-App, Lieferdienst.' },
    opensExternally: { where: SERVICES + ' → kleine Zeile unter einem Link', note: '{host} = Web-Adresse, z. B. „lieferando.de“. Warnt, dass der Link das Portal verlässt.' },
    orders: { where: SERVICES + ' → Überschrift der eigenen Anfragen', note: '„Anfrage“ = alles, was der Gast im Portal anfordert oder meldet.' },
    notePlaceholder: { where: SERVICES + ' → grauer Text im Anmerkungsfeld', note: 'Freitext an die Rezeption.' },
    order: { where: SERVICES + ' → Knopf bei einer Leistung', note: 'Kurz. Leistung anfordern (kann etwas kosten).' },
    report: { where: SERVICES + ' → Knopf bei einer Meldung ans Haus', note: 'Kurz. Einen Defekt melden (z. B. Lampe kaputt).' },
    sending: { where: SERVICES + ' → Knopf während des Sendens', note: 'Mit Auslassungszeichen „…“.' },
    sent: { where: SERVICES + ' → Bestätigung nach dem Senden', note: 'Die Rezeption hat die Anfrage erhalten.' },
    fallbackName: { where: SERVICES + ' → Name einer Anfrage, deren Service gelöscht wurde', note: 'Allgemeines Wort, selten sichtbar.' },
    orderStatus: {
      open: { where: SERVICES + ' → Status einer Anfrage', note: 'Ein Wort, kleingeschrieben: noch nicht erledigt.' },
      done: { where: SERVICES + ' → Status einer Anfrage', note: 'Ein Wort, kleingeschrieben: erledigt.' },
      cancelled: { where: SERVICES + ' → Status einer Anfrage', note: 'Kleingeschrieben: wurde nicht erbracht (z. B. nach dem Check-out geschlossen).' },
    },
  },

  review: {
    hint: { where: 'Gästeportal → Zeile ganz unten (ab dem zweiten Tag), vor dem Link zur Bewertung', note: 'Kurze Frage; danach folgt der Link.' },
    button: {
      google: { where: 'Link zur Bewertung (Zeile im Portal und Knopf auf der Danke-Seite)', note: 'Plattform „Google“ als Marke, nicht übersetzen.' },
      tripadvisor: { where: 'Link zur Bewertung', note: 'Marke „Tripadvisor“, nicht übersetzen.' },
      booking: { where: 'Link zur Bewertung', note: 'Marke „Booking.com“, nicht übersetzen.' },
      holidaycheck: { where: 'Link zur Bewertung', note: 'Marke „HolidayCheck“, nicht übersetzen.' },
      other: { where: 'Link zur Bewertung', note: 'Eigene Bewertungsseite des Hauses, Plattform unbekannt.' },
    },
  },

  thanks: {
    title: { where: 'Danke-Seite nach dem Check-out → Überschrift', note: 'Erscheint eine Woche lang, wenn der Gast das Portal nach der Abreise öffnet.' },
    text: { where: 'Danke-Seite → Text unter der Überschrift', note: 'Sachlich: der Zugang ist erloschen.' },
    review: { where: 'Danke-Seite → Satz über dem Bewertungs-Knopf', note: 'Nur, wenn das Haus einen Bewertungslink eingetragen hat. Bitte, kein Druck.' },
    signInAgain: { where: 'Danke-Seite → kleiner Link unten', note: 'Für einen neuen Aufenthalt neu anmelden.' },
  },

  errors: {
    loginFailed: { where: ERROR + ' auf der Anmeldung', note: 'Bewusst unbestimmt (verrät nicht, ob das Zimmer existiert).' },
    pinFormat: { where: ERROR + ' auf der Anmeldung', note: 'PIN besteht nur aus Ziffern.' },
    tooManyAttempts: { where: ERROR + ' auf der Anmeldung', note: '{minutes} = Wartezeit in Minuten; „Min.“ = Abkürzung.' },
    tooManyFromNetwork: { where: ERROR + ' auf der Anmeldung', note: '{minutes} = Wartezeit. Gilt für das ganze Netz (z. B. WLAN des Hauses).' },
    sessionExpired: { where: ERROR + ' im Portal', note: 'Die Anmeldung ist ungültig geworden (z. B. nach dem Check-out).' },
    invalidSignal: { where: ERROR + ' im Portal', note: 'Technischer Ausnahmefall, kurz.' },
    outsideWindow: { where: ERROR + ' im Portal', note: '{start}/{end} = Uhrzeiten der Reinigungszeiten.' },
    deferNotAllowed: { where: ERROR + ' im Portal', note: 'Das Haus erlaubt „frühestens ab“ nicht.' },
    deferPast: { where: ERROR + ' im Portal', note: 'Gewählte Uhrzeit liegt in der Vergangenheit.' },
    deferTooLate: { where: ERROR + ' im Portal', note: '{time} = späteste erlaubte Uhrzeit.' },
    saveFailed: { where: ERROR + ' im Portal', note: 'Allgemeiner Fehler beim Speichern, erneut versuchen.' },
    serviceUnavailable: { where: ERROR + ' bei einer Anfrage', note: 'Das Haus hat den Service inzwischen entfernt.' },
    serviceIsLink: { where: ERROR + ' bei einer Anfrage', note: 'Technischer Ausnahmefall: Links nehmen keine Anfragen an.' },
    pickOption: { where: ERROR + ' bei einer Anfrage', note: 'Mindestens eine Option (z. B. „2 Handtücher“) wählen.' },
    sendFailed: { where: ERROR + ' bei einer Anfrage', note: 'Senden fehlgeschlagen, erneut versuchen.' },
    onRequestOnly: { where: ERROR + ' im Portal', note: '„Heute keine Reinigung“ gibt es nur bei täglicher Reinigung.' },
  },
} satisfies ContextShape<GuestMessages>
