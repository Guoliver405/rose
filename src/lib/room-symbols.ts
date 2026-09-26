/**
 * Die Zeichensprache der Zimmer-Kacheln — eine Quelle für beide Boards und
 * die Hilfe.
 *
 * Bis zum 14.09.2026 waren Symbole und Farbbalken in `RoomGrid` (Rezeption)
 * und `ServiceBoard` (Reinigung) je einmal verdrahtet. Seit die Kontexthilfe
 * eine Legende zeichnet, gibt es einen dritten Ort, der dasselbe sagen muss —
 * und eine Legende, die vom Board abweicht, ist schlimmer als keine. Deshalb
 * hier: IDs, Beschriftung, Bedeutung und Farbklasse als reine Strings. Welches
 * Lucide-Icon dazugehört, entscheidet `components/RoomSymbol.tsx` über ein
 * `Record` über alle IDs — ein neues Symbol, das dort fehlt, fällt beim
 * Type-Check auf, nicht erst im Browser.
 *
 * Bewusst ohne React: `lib/` bleibt I/O- und Rendering-frei, damit die Hilfe
 * (`hilfe.ts`) diese Tabellen im Unit-Test lesen kann.
 *
 * Farbsprache (AGENTS.md „Farbsprache der Boards"): Violett = priorisiert,
 * Rot + Blinken = dringende Service-Anfrage, Rosé = DND, Amber = Wunsch oder
 * Routine, Orange = ausgecheckt, Grün = bereit bzw. in Arbeit, Blau = belegt.
 */

export type RoomSymbolId =
  | 'deactivated' | 'occupied' | 'departure' | 'dnd' | 'clean' | 'deferred' | 'declined'
  | 'routine' | 'checkout' | 'priority' | 'cleaning' | 'orders' | 'urgent'

export type RoomSymbol = {
  /** Kurzform, wie sie auch der Tooltip der Kachel benutzt. */
  label: string
  /** Was das Zeichen bedeutet und was daraus folgt — der Text der Legende. */
  text: string
  /** Farbklasse des Icons; `blink-icon` gehört bei „dringend" dazu. */
  className: string
  /** Dreht sich — nur der Spinner der laufenden Reinigung. */
  spin?: boolean
}

/**
 * Die Symbole in der Reihenfolge, in der sie auf der Kachel stehen. Die
 * Rezeption zeigt alle; das Reinigungsboard lässt „außer Betrieb" weg (solche
 * Zimmer erscheinen dort gar nicht) und trägt die Glocke nicht (Service-
 * Anfragen gehören der Rezeption).
 */
export const ROOM_SYMBOLS: Record<RoomSymbolId, RoomSymbol> = {
  deactivated: {
    label: 'Außer Betrieb',
    text: 'Das Zimmer nimmt keinen Check-in an und steht auf keinem Reinigungsboard. Es behält seine Historie und kommt unter Zimmer & Etagen wieder in Betrieb.',
    className: 'text-ink-muted',
  },
  occupied: {
    label: 'Belegt',
    text: 'Ein Aufenthalt läuft. Der Gast hat eine PIN oder einen Link und kann im Portal Reinigung wünschen, „Nicht stören" setzen und bestellen.',
    className: 'text-active-strong',
  },
  departure: {
    label: 'Abreise heute',
    text: 'Das beim Check-in oder später eingetragene Abreisedatum ist heute. Die Routine-Reinigung setzt an diesem Tag aus — gereinigt wird nach dem Check-out.',
    className: 'text-ink-soft',
  },
  dnd: {
    label: 'Bitte nicht stören',
    text: 'Der Gast hat es im Portal gesetzt. Niemand klopft, die Routine setzt aus, das Zimmer ist auf dem Reinigungsboard ausgegraut. Nur der Gast nimmt es zurück.',
    className: 'text-blocked-strong',
  },
  clean: {
    label: 'Gast wünscht Reinigung',
    text: 'Ein Tipp im Portal. Das Zimmer steht sofort als offen auf dem Reinigungsboard — ohne Termin, das Housekeeping kommt, wenn es in die Runde passt.',
    className: 'text-attention-strong',
  },
  deferred: {
    label: 'Reinigung ab HH:MM',
    text: 'Nicht vor einer Uhrzeit: Der Gast hat es beim Reinigungswunsch so gewählt, oder er hat der Reinigungskraft an der Tür „bitte später" gesagt. Bis dahin gilt das Zimmer als nicht offen, für alle Kräfte; zur Uhrzeit ist es von selbst wieder offen.',
    className: 'text-ink-soft',
  },
  declined: {
    label: 'Heute keine Reinigung',
    text: 'Der Gast verzichtet heute — per Knopf im Portal oder an der Tür zur Reinigungskraft gesagt. Die Routine setzt heute aus, als Reinigung gezählt wird es nicht; morgen gilt sie wieder. Tippt der Gast doch „Zimmer reinigen", ist das Zimmer sofort wieder offen.',
    className: 'text-ink-soft',
  },
  routine: {
    label: 'Routine-Reinigung fällig',
    text: 'Nur mit eingeschalteter Routine (Hotel & Regeln): ab der zweiten Nacht und ab der eingestellten Uhrzeit — ohne eingetragenes Abreisedatum frühestens zur Check-out-Frist —, solange heute noch nicht gereinigt wurde und kein „Nicht stören" anliegt.',
    className: 'text-attention-strong',
  },
  checkout: {
    label: 'Ausgecheckt — Reinigung offen',
    text: 'Der Check-out ist erfolgt, das Zimmer ist noch nicht gereinigt. Es bleibt so lange offen, bis eine Reinigungskraft abschließt oder die Rezeption es als gereinigt markiert.',
    className: 'text-caution-strong',
  },
  priority: {
    label: 'Priorisiert',
    text: 'Von der Rezeption von Hand gesetzt — für Beschwerden und Sonderfälle. Das Zimmer rückt auf dem Reinigungsboard nach vorn und die Etage trägt eine violette Warnlampe. Kein Automatismus.',
    className: 'text-accent-strong',
  },
  cleaning: {
    label: 'Reinigung läuft',
    text: 'Eine Reinigungskraft hat den Start-Slider gezogen; ihr Name steht im Zimmer. Wird der Abschluss vergessen, geht das Zimmer nach dem Zeitlimit von selbst wieder auf offen.',
    className: 'text-positive-strong',
    spin: true,
  },
  orders: {
    label: 'Offene Service-Anfrage',
    text: 'Der Gast hat etwas bestellt, das noch niemand abgehakt hat. Die Anfragen liegen unter „Services"; abgehakt wird dort oder im Zimmer-Dialog.',
    className: 'text-action',
  },
  urgent: {
    label: 'Dringende Service-Anfrage',
    text: 'Mindestens eine offene Anfrage betrifft einen Service, der im Baukasten als „dringend" markiert ist. Glocke, Ring und die Zahl in der Navigation blinken rot, bis sie abgehakt ist.',
    className: 'blink-icon text-critical-strong',
  },
}

export const ROOM_SYMBOL_IDS = Object.keys(ROOM_SYMBOLS) as RoomSymbolId[]

// ---------------------------------------------------------------------------
// Farbbalken
// ---------------------------------------------------------------------------

export type RoomBarId =
  | 'priority' | 'working' | 'checkout' | 'wanted' | 'dnd' | 'occupied' | 'ready'
  | 'neutral' | 'deactivated'

export type RoomBar = {
  label: string
  text: string
  /** Hintergrundklasse des Balkens. */
  className: string
}

/**
 * Der Balken über der Nummer, in der Reihenfolge des Vorrangs: Was weiter
 * oben steht, gewinnt, wenn mehrere Zustände zugleich gelten. Eine laufende
 * Reinigung ändert den Balken der Rezeption bewusst NICHT (nur der Spinner
 * zeigt sie) — die Grundfarbe bleibt, bis der Abschluss den Zustand wirklich
 * ändert. Auf dem Reinigungsboard dagegen ist „in Arbeit" grün, weil es dort
 * kein grünes „bereit" gibt.
 */
export const ROOM_BARS: Record<RoomBarId, RoomBar> = {
  priority: {
    label: 'Priorisiert',
    text: 'Gewinnt gegen alles andere. Solange die Priorität steht, ist der Balken violett — auch bei ausgechecktem Zimmer.',
    className: 'bg-accent',
  },
  working: {
    label: 'In Arbeit',
    text: 'Nur auf dem Reinigungsboard: Eine Kollegin ist gerade im Zimmer. In der Rezeption zeigt das nur der Spinner, der Balken behält seine Farbe.',
    className: 'bg-positive-soft',
  },
  checkout: {
    label: 'Ausgecheckt',
    text: 'Reinigung nach Check-out offen.',
    className: 'bg-caution',
  },
  wanted: {
    label: 'Reinigung gewünscht oder Routine fällig',
    text: 'Der Gast hat getippt, oder die Routine des Hauses ist fällig. Ein aufgeschobener Wunsch („ab HH:MM") färbt den Balken erst zur Uhrzeit.',
    className: 'bg-attention',
  },
  dnd: {
    label: '„Bitte nicht stören"',
    text: 'Belegt, und der Gast will nicht gestört werden.',
    className: 'bg-blocked',
  },
  occupied: {
    label: 'Belegt',
    text: 'Aufenthalt läuft, nichts zu tun.',
    className: 'bg-fresh',
  },
  ready: {
    label: 'Frei & bereit',
    text: 'Unbelegt und gereinigt — der Check-in ist ein Klick.',
    className: 'bg-positive',
  },
  neutral: {
    label: 'Ohne Auftrag',
    text: 'Nur auf dem Reinigungsboard: unbelegt, belegt ohne Wunsch, „Nicht stören" oder ein Wunsch, der erst später gilt. Sichtbar, aber ausgegraut — nicht gesperrt.',
    className: 'bg-edge',
  },
  deactivated: {
    label: 'Außer Betrieb',
    text: 'Gestrichelter Rahmen, blasse Kachel. Kein Check-in möglich.',
    className: 'bg-edge-strong',
  },
}

// ---------------------------------------------------------------------------
// Rahmen
// ---------------------------------------------------------------------------

export type RoomRingId = 'urgent' | 'priority'

export type RoomRing = {
  label: string
  text: string
  className: string
}

/**
 * Nur ein Ring kann blinken: Rot (dringende Service-Anfrage) schlägt Violett
 * (Priorität) — die Priorität bleibt dann über Balken und Flagge sichtbar.
 */
export const ROOM_RINGS: Record<RoomRingId, RoomRing> = {
  urgent: {
    label: 'Rot blinkender Rahmen',
    text: 'Dringende Service-Anfrage. Gewinnt gegen den violetten Ring; die Priorität bleibt über Balken und Flagge erkennbar.',
    className: 'border-critical blink-ring-overdue',
  },
  priority: {
    label: 'Violett blinkender Rahmen',
    text: 'Priorisierte Reinigung, solange keine dringende Anfrage anliegt.',
    className: 'border-accent blink-ring-priority',
  },
}
