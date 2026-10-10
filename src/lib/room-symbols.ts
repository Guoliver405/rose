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

// Beschriftungen und Legendentexte stehen seit 11.10.2026 in der Sprachdatei.
// Vorerst fest Deutsch: Boards und Legende lesen diese Tabellen direkt; die
// Umstellung auf die Sprache der Anfrage folgt mit der Hilfe.
import { symbols as T } from './i18n/de/symbols'

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
    ...T.symbols.deactivated,
    className: 'text-ink-muted',
  },
  occupied: {
    ...T.symbols.occupied,
    className: 'text-active-strong',
  },
  departure: {
    ...T.symbols.departure,
    className: 'text-ink-soft',
  },
  dnd: {
    ...T.symbols.dnd,
    className: 'text-blocked-strong',
  },
  clean: {
    ...T.symbols.clean,
    className: 'text-attention-strong',
  },
  deferred: {
    ...T.symbols.deferred,
    className: 'text-ink-soft',
  },
  declined: {
    ...T.symbols.declined,
    className: 'text-ink-soft',
  },
  routine: {
    ...T.symbols.routine,
    className: 'text-attention-strong',
  },
  checkout: {
    ...T.symbols.checkout,
    className: 'text-caution-strong',
  },
  priority: {
    ...T.symbols.priority,
    className: 'text-accent-strong',
  },
  cleaning: {
    ...T.symbols.cleaning,
    className: 'text-positive-strong',
    spin: true,
  },
  orders: {
    ...T.symbols.orders,
    className: 'text-action',
  },
  urgent: {
    ...T.symbols.urgent,
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
    ...T.bars.priority,
    className: 'bg-accent',
  },
  working: {
    ...T.bars.working,
    className: 'bg-positive-soft',
  },
  checkout: {
    ...T.bars.checkout,
    className: 'bg-caution',
  },
  wanted: {
    ...T.bars.wanted,
    className: 'bg-attention',
  },
  dnd: {
    ...T.bars.dnd,
    className: 'bg-blocked',
  },
  occupied: {
    ...T.bars.occupied,
    className: 'bg-fresh',
  },
  ready: {
    ...T.bars.ready,
    className: 'bg-positive',
  },
  neutral: {
    ...T.bars.neutral,
    className: 'bg-edge',
  },
  deactivated: {
    ...T.bars.deactivated,
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
    ...T.rings.urgent,
    className: 'border-critical blink-ring-overdue',
  },
  priority: {
    ...T.rings.priority,
    className: 'border-accent blink-ring-priority',
  },
}
