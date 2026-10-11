/**
 * Zeichensprache der Zimmer-Kacheln — deutsche Beschriftungen und Legenden-
 * texte (ausgelagert 11.10.2026). Struktur, Farbklassen und Icons stehen in
 * `room-symbols.ts`; hier nur die Worte – gelesen von der Legende der Hilfe
 * über `getMessages(…).symbols`, Schlüssel sind die IDs aus `room-symbols.ts`.
 *
 * Begriffe nach `Sessions/Begriffe-Entscheidungen.md`: „tägliche Reinigung“
 * statt „Routine“, „Bitte nicht stören“, „Haus & Regeln“, „jemand aus dem
 * Team“, „Schieber“, „…“ und „ – “.
 */
export const symbols = {
  symbols: {
    deactivated: {
      label: 'Außer Betrieb',
      text: 'Das Zimmer nimmt keinen Check-in an und steht auf keinem Reinigungsboard. Es behält seine Historie und kommt unter Zimmer & Etagen wieder in Betrieb.',
    },
    occupied: {
      label: 'Belegt',
      text: 'Ein Aufenthalt läuft. Der Gast hat eine PIN oder einen Link und kann im Portal Reinigung wünschen, „Bitte nicht stören“ setzen und Services anfragen.',
    },
    departure: {
      label: 'Abreise heute',
      text: 'Das beim Check-in oder später eingetragene Abreisedatum ist heute. Die tägliche Reinigung setzt an diesem Tag aus – gereinigt wird nach dem Check-out.',
    },
    dnd: {
      label: 'Bitte nicht stören',
      text: 'Der Gast hat es im Portal gesetzt. Niemand klopft, die tägliche Reinigung setzt aus, das Zimmer ist auf dem Reinigungsboard ausgegraut. Nur der Gast nimmt es zurück.',
    },
    clean: {
      label: 'Gast wünscht Reinigung',
      text: 'Ein Tipp im Portal. Das Zimmer steht sofort als offen auf dem Reinigungsboard – ohne Termin, das Reinigungsteam kommt, wenn es in die Runde passt.',
    },
    deferred: {
      label: 'Reinigung ab HH:MM',
      text: 'Nicht vor einer Uhrzeit: Der Gast hat es beim Reinigungswunsch so gewählt, oder er hat der Reinigungskraft an der Tür „bitte später“ gesagt. Bis dahin gilt das Zimmer für alle Reinigungskräfte als nicht offen; zur Uhrzeit ist es von selbst wieder offen.',
    },
    declined: {
      label: 'Heute keine Reinigung',
      text: 'Der Gast verzichtet heute – per Knopf im Portal oder an der Tür zur Reinigungskraft gesagt. Die tägliche Reinigung setzt heute aus, als Reinigung gezählt wird es nicht; morgen gilt sie wieder. Tippt der Gast doch „Zimmer reinigen“, ist das Zimmer sofort wieder offen.',
    },
    routine: {
      label: 'Tägliche Reinigung fällig',
      text: 'Nur, wenn das Haus belegte Zimmer täglich reinigt (Haus & Regeln): ab der zweiten Nacht und ab der eingestellten Uhrzeit – ohne eingetragenes Abreisedatum frühestens zur Check-out-Frist –, solange heute noch nicht gereinigt wurde und kein „Bitte nicht stören“ anliegt.',
    },
    checkout: {
      label: 'Ausgecheckt – Reinigung offen',
      text: 'Der Check-out ist erfolgt, das Zimmer ist noch nicht gereinigt. Es bleibt so lange offen, bis eine Reinigungskraft abschließt oder die Rezeption die Reinigung als erledigt markiert.',
    },
    priority: {
      label: 'Priorisiert',
      text: 'Von der Rezeption von Hand gesetzt – für Beschwerden und Sonderfälle. Das Zimmer rückt auf dem Reinigungsboard nach vorn und die Etage trägt eine violette Warnlampe. Kein Automatismus.',
    },
    cleaning: {
      label: 'Reinigung läuft',
      text: 'Eine Reinigungskraft hat den Start-Schieber gezogen; ihr Name steht im Zimmer. Wird der Abschluss vergessen, geht das Zimmer nach dem Zeitlimit von selbst wieder auf offen.',
    },
    orders: {
      label: 'Offene Service-Anfrage',
      text: 'Der Gast hat etwas angefragt, das noch niemand abgehakt hat. Die Anfragen liegen unter „Anfragen“ in der Navigation; abgehakt wird dort oder im Zimmer-Dialog.',
    },
    urgent: {
      label: 'Dringende Service-Anfrage',
      text: 'Mindestens eine offene Anfrage betrifft einen Service, der im Baukasten als „dringend“ markiert ist. Glocke, Ring und die Zahl in der Navigation blinken rot, bis sie abgehakt ist.',
    },
  },
  bars: {
    priority: {
      label: 'Priorisiert',
      text: 'Gewinnt gegen alles andere. Solange die Priorität steht, ist der Balken violett – auch bei ausgechecktem Zimmer.',
    },
    working: {
      label: 'In Arbeit',
      text: 'Nur auf dem Reinigungsboard: Jemand aus dem Team ist gerade im Zimmer. In der Rezeption zeigt das nur der Spinner, der Balken behält seine Farbe.',
    },
    checkout: {
      label: 'Ausgecheckt',
      text: 'Reinigung nach Check-out offen.',
    },
    wanted: {
      label: 'Reinigung gewünscht oder tägliche Reinigung fällig',
      text: 'Der Gast hat getippt, oder die tägliche Reinigung des Hauses ist fällig. Ein aufgeschobener Wunsch („ab HH:MM“) färbt den Balken erst zur Uhrzeit.',
    },
    dnd: {
      label: '„Bitte nicht stören“',
      text: 'Belegt, und der Gast will nicht gestört werden.',
    },
    occupied: {
      label: 'Belegt',
      text: 'Aufenthalt läuft, nichts zu tun.',
    },
    ready: {
      label: 'Frei & bereit',
      text: 'Unbelegt und gereinigt – der Check-in ist ein Klick.',
    },
    neutral: {
      label: 'Ohne Auftrag',
      text: 'Nur auf dem Reinigungsboard: unbelegt, belegt ohne Wunsch, „Bitte nicht stören“ oder ein Wunsch, der erst später gilt. Sichtbar, aber ausgegraut – nicht gesperrt.',
    },
    deactivated: {
      label: 'Außer Betrieb',
      text: 'Gestrichelter Rahmen, blasse Kachel. Kein Check-in möglich.',
    },
  },
  rings: {
    urgent: {
      label: 'Rot blinkender Rahmen',
      text: 'Dringende Service-Anfrage. Gewinnt gegen den violetten Ring; die Priorität bleibt über Balken und Flagge erkennbar.',
    },
    priority: {
      label: 'Violett blinkender Rahmen',
      text: 'Priorisierte Reinigung, solange keine dringende Anfrage anliegt.',
    },
  },
}

export type SymbolsMessages = typeof symbols
