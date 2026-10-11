/**
 * Gedruckte Blätter und Zugangs-Mail an den Gast — deutsche Texte.
 *
 * Diese Texte gibt es in allen Blatt-Sprachen (`GUIDE_LANGS`: de, en, es, fr);
 * das Haus wählt eine bis zwei fürs Blatt, die erste davon trägt die Mail.
 * Die Verzweigung nach den Regeln des Hauses (tägliche Reinigung oder auf
 * Wunsch, Zeitfenster, Aufschub) steht in `guest-guide.ts`, hier nur die Sätze.
 *
 * Die **Beschriftungen der Portal-Knöpfe** stehen nicht hier: Sie kommen aus
 * der Sprachdatei des Gästeportals (`guest.ts`), damit Legende und
 * Bildschirm nie auseinanderlaufen.
 *
 * Begriffe nach `Sessions/Begriffe-Entscheidungen.md` (Gast gesiezt,
 * „Gästeportal“, „Blatt“ statt „Zettel“, „…“ und „ – “). Die anderen Sprachen
 * folgen ihren eigenen typografischen Regeln.
 */
export const sheet = {
  langLabel: 'Deutsch',
  heading: 'So funktioniert’s',
  sheet: {
    welcome: 'Willkommen',
    room: 'Zimmer',
    scan: 'QR-Code scannen',
    pin: 'Ihre PIN',
    pinFromReception: 'PIN erhalten Sie beim Check-in.',
    qrAlt: 'QR-Code zum Gästeportal',
    withoutQr: 'Ohne QR-Code',
    keep: 'Bitte aufbewahren – dieses Blatt ist Ihr Zugang.',
  },
  buttonHints: {
    clean: 'Tippen, wenn Ihr Zimmer gereinigt werden soll.',
    dnd: 'Niemand klopft – auch kein Service.',
    services: 'Handtücher, Reparaturen und mehr – die Rezeption sieht es sofort.',
  },
  sustainabilityNeutral:
    'Jede Reinigung, die nicht nötig ist, spart Wasser, Waschmittel und Energie – Sie entscheiden im Portal.',
  footer: 'Alle Angaben und die aktuellen Zeiten stehen im Portal.',
  labels: {
    cleaning: 'Reinigung',
    sustainability: 'Nachhaltigkeit',
    dnd: 'Ruhe',
    services: 'Services',
    access: 'Zugang',
  },
  purpose:
    'Über das Gästeportal erreichen Sie die Rezeption direkt vom Zimmer aus – rund um die Uhr, ohne Anruf.',
  dnd: '„Bitte nicht stören“ im Portal hält das Personal von Ihrem Zimmer fern, bis Sie es zurücknehmen.',
  services:
    'Wünsche wie frische Handtücher bestellen und Defekte melden Sie direkt im Portal – die Rezeption sieht Ihre Anfrage sofort.',
  cleaningRoutine:
    'Ihr Zimmer wird täglich ab {due} Uhr gereinigt, am Abreisetag nach dem Check-out – Sie müssen nichts anfordern. Möchten Sie zwischendurch eine weitere Reinigung, tippen Sie im Portal auf „Zimmer reinigen“.',
  cleaningOnRequest:
    'Ihr Zimmer wird auf Wunsch gereinigt: Bitte fordern Sie die Reinigung im Portal an, sobald es Ihnen passt – ohne Ihren Wunsch kommt niemand ins Zimmer.',
  window: ' Reinigungswünsche nimmt das Portal täglich von {start} bis {end} Uhr entgegen.',
  defer: ' Im Portal können Sie die Reinigung auch bis spätestens {limit} Uhr aufschieben – vorher kommt dann niemand.',
  sustainabilityRoutine:
    'Sie brauchen heute keine Reinigung? Ein Tipp auf „Heute keine Reinigung“ im Portal spart Wasser, Waschmittel und Energie – morgen wird wieder gereinigt.',
  sustainabilityOnRequest:
    'Weniger Reinigung, weniger Verbrauch: Jede Reinigung, die nicht nötig ist, spart Wasser, Waschmittel und Energie. Deshalb kommen wir nur, wenn Sie es möchten.',
  access: {
    link: 'Dieser Zugang ist persönlich und braucht keine PIN – bitte geben Sie ihn nicht weiter. Er gilt nur für diesen Aufenthalt und erlischt mit dem Check-out.',
    pinDeep: 'QR-Code scannen und PIN eingeben – danach bleiben Sie angemeldet. Die PIN gilt bis zum Check-out.',
    pinManual: 'Adresse öffnen, Zimmernummer und PIN eingeben – danach bleiben Sie angemeldet. Die PIN gilt bis zum Check-out.',
  },
  mail: {
    subject: 'Ihr Zugang zum Gästeportal – {hotel}, Zimmer {room}',
    greeting: 'Guten Tag,',
    intro: 'hier ist Ihr Zugang zum Gästeportal von <b>{hotel}</b>, Zimmer <b>{room}</b>.',
    open: 'Gästeportal öffnen',
    pin: 'Ihre PIN:',
    fallback: 'Falls der Knopf nicht funktioniert, öffnen Sie diese Adresse:',
    howTo: 'So funktioniert das Portal',
  },
}

export type SheetMessages = typeof sheet
