/**
 * Die Zeichensprache der Zimmer-Kacheln — eine Quelle für beide Boards und
 * die Hilfe.
 *
 * Bis zum 14.09.2026 waren Symbole und Farbbalken in `RoomGrid` (Rezeption)
 * und `ServiceBoard` (Reinigung) je einmal verdrahtet. Seit die Kontexthilfe
 * eine Legende zeichnet, gibt es einen dritten Ort, der dasselbe sagen muss —
 * und eine Legende, die vom Board abweicht, ist schlimmer als keine. Deshalb
 * hier: IDs und Farbklassen als reine Strings; Beschriftung und Bedeutung
 * stehen seit 11.10.2026 in der Sprachdatei (`i18n/<sprache>/symbols.ts`,
 * dieselben IDs als Schlüssel) und kommen über `getMessages(…).symbols` in
 * die Legende. Die Boards brauchen nur Farbe und Icon. Welches
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
    className: 'text-ink-muted',
  },
  occupied: {
    className: 'text-active-strong',
  },
  departure: {
    className: 'text-ink-soft',
  },
  dnd: {
    className: 'text-blocked-strong',
  },
  clean: {
    className: 'text-attention-strong',
  },
  deferred: {
    className: 'text-ink-soft',
  },
  declined: {
    className: 'text-ink-soft',
  },
  routine: {
    className: 'text-attention-strong',
  },
  checkout: {
    className: 'text-caution-strong',
  },
  priority: {
    className: 'text-accent-strong',
  },
  cleaning: {
    className: 'text-positive-strong',
    spin: true,
  },
  orders: {
    className: 'text-action',
  },
  urgent: {
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
    className: 'bg-accent',
  },
  working: {
    className: 'bg-positive-soft',
  },
  checkout: {
    className: 'bg-caution',
  },
  wanted: {
    className: 'bg-attention',
  },
  dnd: {
    className: 'bg-blocked',
  },
  occupied: {
    className: 'bg-fresh',
  },
  ready: {
    className: 'bg-positive',
  },
  neutral: {
    className: 'bg-edge',
  },
  deactivated: {
    className: 'bg-edge-strong',
  },
}

// ---------------------------------------------------------------------------
// Rahmen
// ---------------------------------------------------------------------------

export type RoomRingId = 'urgent' | 'priority'

export type RoomRing = {
  className: string
}

/**
 * Nur ein Ring kann blinken: Rot (dringende Service-Anfrage) schlägt Violett
 * (Priorität) — die Priorität bleibt dann über Balken und Flagge sichtbar.
 */
export const ROOM_RINGS: Record<RoomRingId, RoomRing> = {
  urgent: {
    className: 'border-critical blink-ring-overdue',
  },
  priority: {
    className: 'border-accent blink-ring-priority',
  },
}
