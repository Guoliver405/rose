/**
 * Druckseiten der Verwaltung — deutsche Texte (ausgelagert 10.10.2026):
 * Bedienung rund um Check-in-Blatt, Aushänge und Zugangskarte sowie die
 * Check-out-Aufstellung. Das gedruckte Gastblatt selbst steht in `sheet.ts`
 * (eigene Sprachen je Haus).
 *
 * Begriffe nach `Sessions/Begriffe-Entscheidungen.md`: „Check-in-Blatt“
 * statt „Handout“, „Aushang“ ohne „QR-“ davor, „Zugangskarte“, „angemeldet“
 * statt „eingeloggt“, „erledigt“ statt „erbracht“ für den Abschluss,
 * „Gästeportal“, „…“ und „ – “.
 */
export const print = {
  backToOverview: 'Zurück zur Übersicht',

  checkinSheet: {
    notOccupied: 'Zimmer {number} ist aktuell nicht belegt – erst einchecken, dann das Check-in-Blatt drucken.',
    formatA4: 'DIN A4 – Mappe, Aufsteller, Rahmen',
    formatCompact: 'Kompakt – für die Hand',
    printA4: 'Check-in-Blatt drucken (DIN A4)',
    printCompact: 'Check-in-Blatt drucken (kompakt)',
    mailTitle: 'Stattdessen per E-Mail schicken',
    mailPlaceholder: 'adresse@beispiel.de',
    send: 'Senden',
    mailHint:
      'Die Adresse wird <b>nicht gespeichert</b> – sie dient nur diesem Versand. Die E-Mail geht in der ersten Sprache des Hauses heraus; Piktogramme und die zweite Sprache stehen nur auf dem Ausdruck.',
    release: 'Adresse freigeben und erneut senden',
    orPrint: 'Oder: das Check-in-Blatt drucken – es trägt denselben Zugang.',
    mailNotConfigured:
      'Versand per E-Mail ist nicht eingerichtet – dafür braucht es <code>RESEND_API_KEY</code> und <code>GUEST_MAIL_FROM</code> in den Umgebungsvariablen.',
  },

  roomSigns: {
    backToGuestAccess: 'Zurück zu Gästezugang',
    backToSettings: 'Zurück zu Einstellungen',
    linkModeWarning:
      'Dieses Haus nutzt individuelle Zugänge je Aufenthalt. Die Aushänge führen auf eine PIN-Eingabe, die neue Gäste nicht bedienen können – sie gehören nicht ins Zimmer, solange dieses Verfahren gilt.',
    title: 'Aushänge',
    createMissing: {
      one: 'Einen fehlenden QR-Code erzeugen',
      other: '{count} fehlende QR-Codes erzeugen',
    },
    formatA4: 'DIN A4 – eine Seite je Zimmer',
    formatCompact: 'Kompakt – vier je Seite',
    printAll: {
      one: 'Alle drucken (1 Seite)',
      other: 'Alle drucken ({count} Seiten)',
    },
    hint:
      'Einmal drucken, im Zimmer aufhängen oder in die Mappe legen – der Gast scannt und tippt nur noch seine PIN, die er beim Check-in bekommt. Das kompakte Format lässt sich auseinanderschneiden. Ein neuer Code macht den alten Aushang des Zimmers ungültig.',
    noRooms: 'Noch keine Zimmer angelegt.',
    allHaveCodes: 'Alle Zimmer haben bereits einen QR-Code.',
    created: {
      one: 'Ein QR-Code erzeugt.',
      other: '{count} QR-Codes erzeugt.',
    },
    renewed: 'Neuer QR-Code für Zimmer {number} – der alte Aushang ist ungültig.',
    noCode: 'Zimmer {number}: noch kein QR-Code – oben erzeugen.',
    renew: 'Code erneuern',
    errors: {
      notSignedIn: 'Nicht angemeldet.',
      noPermission: 'Keine Berechtigung.',
      roomNotFound: 'Zimmer nicht gefunden.',
    },
  },

  accessCard: {
    back: 'Zurück zum Personal',
    title: 'Zugangskarte Reinigung',
    scan: 'QR scannen → automatisch angemeldet',
    qrAlt: 'QR-Code zum Reinigungsboard',
    manual: 'Anmeldung von Hand → Zugangsdaten',
    username: 'Benutzername',
    pin: 'PIN',
    address: 'Adresse: {url}',
    help:
      'QR mit dem Tablet scannen oder auf der Adresse oben Benutzername und PIN eintippen – als Benutzername gilt <code>{username}</code>, nicht der Name im Kopf der Karte. Diese Karte vertraulich behandeln – sie öffnet das Reinigungsboard ohne weitere Bestätigung.',
    target: 'QR-Ziel: {url}',
    print: 'Karte drucken',
  },

  statement: {
    title: 'Aufstellung der Zusatzleistungen',
    room: 'Zimmer',
    arrival: 'Anreise',
    departure: 'Abreise',
    stayRunning: 'Aufenthalt läuft',
    created: 'Erstellt',
    none: 'Während dieses Aufenthalts wurden keine kostenpflichtigen Zusatzleistungen in Anspruch genommen.',
    service: 'Leistung',
    ordered: 'Bestellt',
    done: 'Erledigt',
    amount: 'Betrag',
    openNotCharged: 'offen – nicht berechnet',
    notProvidedNotCharged: 'nicht erbracht – nicht berechnet',
    total: 'Gesamtsumme',
    excludedNote: 'Nicht erbrachte oder noch offene Leistungen sind gekennzeichnet und in der Gesamtsumme nicht enthalten.',
    footer:
      'Diese Aufstellung ist <b>keine Rechnung</b> und kein Steuerbeleg. Sie listet ausschließlich die über das Gästeportal bestellten Zusatzleistungen dieses Zimmers; Übernachtung und weitere Posten sowie die Rechnungsstellung liegen im System des Hauses.',
    print: 'Aufstellung drucken',
  },
}

export type PrintMessages = typeof print
