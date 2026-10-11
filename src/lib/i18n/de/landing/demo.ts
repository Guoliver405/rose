/**
 * Interaktive Produktvorschau der Landing Page (`LiveDemo`): drei Miniaturen
 * (Rezeption, Gästeportal, Reinigungsboard) an einem Modell. Die Beschriftungen
 * folgen den echten Portalen („Bitte nicht stören“, „Bestellen“ bzw. „Melden“,
 * „Als Nächstes“), damit die Vorschau nicht anders spricht als das Produkt.
 */
export const demo = {
  hotel: 'Hotel Alpenblick',
  maid: 'Maria',

  /** Services im Gästeportal der Vorschau; „Technischer Dienst“ ist eine Meldung ans Haus. */
  services: {
    towels: { name: 'Extra Handtücher', meta: 'kostenfrei' },
    breakfast: { name: 'Frühstück aufs Zimmer', meta: '14,50 €' },
    repair: { name: 'Technischer Dienst', meta: 'dringend' },
  },

  /**
   * Ereignisse des Modells (`lastEvent`). Werden derzeit nicht angezeigt
   * (die Ereigniszeile ist entfallen), stehen aber im Modell.
   */
  events: {
    initial: 'Ausgangslage: Zimmer 202 ist frei und bereit.',
    checkin: 'Check-in Zimmer {nr}: Aufenthalt angelegt, PIN {pin}.',
    checkout: 'Check-out Zimmer {nr}: Zugang erloschen, Reinigung nach Check-out offen.',
    signal: 'Gast in {nr}: {label}.',
    signalClean: 'Reinigung gewünscht',
    signalDnd: 'Bitte nicht stören',
    signalNone: 'Wunsch zurückgenommen',
    order: 'Gast in {nr} bestellt „{name}“.',
    report: 'Gast in {nr} meldet „{name}“ – dringend.',
    orderDone: 'Rezeption: Anfrage aus {nr} erledigt.',
    priorityOn: 'Rezeption: Zimmer {nr} priorisiert.',
    priorityOff: 'Rezeption: Zimmer {nr} nicht mehr priorisiert.',
    start: '{maid} beginnt die Reinigung von {nr}.',
    finish: '{maid} hat {nr} abgeschlossen – Zimmer bereit.',
  },

  /** Zustand einer Kachel bzw. Board-Zeile — wie die Farbsprache der Boards. */
  tone: {
    priority: 'priorisiert',
    checkedOut: 'ausgecheckt',
    wants: 'Reinigung gewünscht',
    dnd: 'Bitte nicht stören',
    occupied: 'belegt',
    ready: 'bereit',
  },

  /** Bildergeschichte in fünf Schritten (dieselben wie der Ablauf darunter). */
  story: {
    checkin: {
      who: 'Rezeption',
      title: 'Check-in per Klick',
      text: 'Ein Klick auf Zimmer {nr} – RoSe legt den anonymen Aufenthalt an und zeigt die PIN.',
    },
    access: {
      who: 'Gast',
      title: 'Zugang in der Hand',
      text: 'PIN auf dem Check-in-Blatt, Aushang im Zimmer oder Link per E-Mail – kein Konto, keine App.',
    },
    tap: {
      who: 'Gast',
      title: 'Ein Tipp im Zimmer',
      text: '„Zimmer reinigen“ – mehr braucht es nicht.',
    },
    visible: {
      who: 'Rezeption',
      title: 'Sofort sichtbar',
      text: 'Die Kachel wechselt auf Amber; eine Anfrage bringt die Glocke und den Zähler.',
    },
    board: {
      who: 'Housekeeping',
      title: 'Gezielt und gesteuert',
      text: '{maid} startet per Wisch und schließt ab – die Rezeption sieht Grün.',
    },
  },

  head: {
    step: 'Schritt {step} von {total} · {who}',
    ended: 'Fertig – jetzt selbst ausprobieren.',
    tryIt: 'Probieren Sie es aus.',
    hint: 'Tipp im Gästeportal, Klick an der Rezeption, Wisch auf dem Board.',
    free: 'Selbst ausprobieren',
    play: 'Geschichte abspielen',
    reset: 'Zurücksetzen',
  },

  reception: {
    title: 'Rezeption – Übersicht',
    badge: 'Anfragen {count}',
    floor: 'Etage 2',
    counts: '{open} offen · {inWork} in Arbeit',
    checkin: 'Check-in {nr}',
    checkout: 'Check-out {nr}',
    priority: 'Prio {nr}',
    stay: 'Aufenthalt {nr}',
    pin: 'PIN {pin}',
    done: 'Erledigt',
  },

  guest: {
    frame: 'Gästeportal – Handy',
    room: 'Zimmer {nr}',
    noStay: 'Noch kein Aufenthalt – der Zugang entsteht beim Check-in an der Rezeption.',
    checkin: 'An der Rezeption einchecken',
    sheet: 'Check-in-Blatt: QR + PIN {pin}',
    clean: 'Zimmer reinigen',
    dnd: 'Bitte nicht stören',
    services: 'Services',
    order: 'Bestellen',
    report: 'Melden',
    openRequests: { one: '{count} Anfrage offen', other: '{count} Anfragen offen' },
  },

  board: {
    title: 'Reinigungsboard',
    floor: 'Etage 2',
    next: 'Als Nächstes · {count} offen',
    inWork: '{count} in Arbeit',
    allDone: 'alles erledigt',
    empty: 'Keine offene Reinigung auf dieser Etage.',
    room: 'Zimmer {nr}',
    maidIn: '{maid} in {nr}',
    finish: 'Reinigung abschließen',
    start: 'Reinigung starten',
  },

  tile: {
    cleaning: 'in Reinigung',
    request: 'Service-Anfrage',
  },
}
