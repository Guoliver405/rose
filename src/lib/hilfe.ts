/**
 * Kontexthilfe — das „?" auf jeder Seite.
 *
 * Die zweite Hälfte des Hilfe-Bereichs neben den Lotsen (`lotsen.ts`). Der
 * Lotse führt beim ersten Mal über die echte Seite; die Hilfe ist zum
 * **Nachschlagen**, wenn man hängt — abends am Tresen, Monate nach der
 * Einrichtung: „Was heißt dieses Symbol?", „Warum ist das Zimmer grau?".
 * Deshalb eine andere Form: Legende, Fragen, Verweise — statt zeigender
 * Schritte.
 *
 * Wie `lotsen.ts` ist der Katalog I/O-frei und ohne React: Struktur und
 * Zuordnung Pfad → Thema. Die Texte samt Blöcken stehen seit 11.10.2026 in der
 * Sprachdatei (`i18n/<sprache>/help/topics.ts`, über `themaText`). Gezeichnet
 * wird in `components/hilfe/HilfeThema.tsx`.
 *
 * **Der Erweiterungspunkt:** Kommt Rückmeldung „X war unverständlich", wird
 * daraus ein Eintrag in `fragen` oder `legende` der Sprachdatei — keine
 * Layout-Arbeit.
 *
 * Zeichen der Legende sind **typisierte Schlüssel** in die Tabellen von
 * `room-symbols.ts` (Kachel-Symbole, Balken, Ringe) bzw. in die Icon-Liste
 * unten. Beschriftung und Bedeutung eines Kachel-Symbols kommen aus derselben
 * Quelle, aus der die Boards zeichnen — die Legende kann damit nicht vom Board
 * abweichen, und ein Tippfehler im Schlüssel fällt beim Type-Check auf.
 */

import type { LotseBereich, LotseId, LotseZugang } from './lotsen'
import type { topics as deTopics } from './i18n/de/help/topics'
import type { RoomBarId, RoomRingId, RoomSymbolId } from './room-symbols'

// ---------------------------------------------------------------------------
// Typen
// ---------------------------------------------------------------------------

/**
 * Sonstige Zeichen der Oberfläche, die keine Kachel-Symbole sind. Die
 * Zuordnung zu Lucide-Icons liegt in `HilfeThema.tsx` als `Record` über alle
 * IDs — vollständigkeitsgeprüft.
 */
export const ICON_IDS = [
  'siren', 'target', 'users', 'flag', 'check', 'printer', 'idcard', 'pencil', 'userminus', 'trash',
] as const
export type IconId = typeof ICON_IDS[number]

/** Farbfamilie einer Pille — wie die Tint/Pill-Token in `globals.css`. */
export type PillenTon = 'positive' | 'caution' | 'attention' | 'critical' | 'accent' | 'action' | 'neutral' | 'outline'

export type Zeichen =
  /** Kachel-Symbol — Icon, Farbe, Beschriftung und Bedeutung aus `ROOM_SYMBOLS`. */
  | { art: 'symbol'; id: RoomSymbolId }
  /** Farbbalken über der Zimmernummer — aus `ROOM_BARS`. */
  | { art: 'balken'; id: RoomBarId }
  /** Blinkender Rahmen einer Kachel — aus `ROOM_RINGS`. */
  | { art: 'ring'; id: RoomRingId }
  /** Ein einzelnes Icon in einer Farbfamilie. */
  | { art: 'icon'; id: IconId; ton?: PillenTon; blink?: boolean }
  /** Eine Pille mit Text, wie die Status-Pillen der Boards. */
  | { art: 'pille'; text: string; ton: PillenTon; icon?: IconId; blink?: boolean }

export type LegendeEintrag = {
  zeichen: Zeichen
  /** Pflicht bei `icon` und `pille`; bei Symbol, Balken und Ring kommt die Beschriftung aus `room-symbols.ts`. */
  label?: string
  text?: string
}

export type Verweis = {
  label: string
  hinweis?: string
  ziel:
    | { art: 'thema'; id: string }
    | { art: 'lotse'; id: string }
    /** Route unterhalb der Basis des angegebenen Bereichs (Vorgabe: Bereich des Themas). */
    | { art: 'seite'; path: string; bereich?: LotseBereich }
    /** Absolute Adresse außerhalb beider Bereiche (Rechtsseiten, Anmeldungen). */
    | { art: 'url'; href: string }
}

export type HilfeBlock =
  | { art: 'text'; titel?: string; absaetze: string[] }
  | { art: 'legende'; titel: string; hinweis?: string; eintraege: LegendeEintrag[] }
  | { art: 'fragen'; titel?: string; eintraege: { frage: string; antwort: string }[] }
  | { art: 'verweise'; titel?: string; eintraege: Verweis[] }

/** Text eines Themas in einer Sprache (`i18n/<sprache>/help/topics.ts`). */
export type HilfeThemaText = {
  title: string
  subtitle: string
  bloecke: HilfeBlock[]
}

/** Texte aller Themen in einer Sprache — Form der deutschen Sprachdatei. */
export type HilfeMessages = typeof deTopics
export type HilfeThemaId = keyof HilfeMessages

export type HilfeThema = {
  /** Dieselbe ID wie der zugehörige Lotse, wo es einen gibt; zugleich Schlüssel des Textes. */
  id: HilfeThemaId
  zugang: LotseZugang
  /** Fehlt der Wert, gehört das Thema ins Haus. */
  bereich?: LotseBereich
  /**
   * Routen unterhalb der Basis, auf denen das „?" zu diesem Thema führt.
   * `''` ist die Startseite des Bereichs und passt nur exakt; alle anderen
   * Pfade passen auch auf Unterseiten (`/zimmer` deckt `/zimmer/aushang`
   * ab, solange kein Thema den längeren Pfad selbst trägt).
   */
  pfade: string[]
  /** Lotse zu dieser Seite — wird als „Lotse starten" angeboten. */
  lotse?: LotseId
}

/** Titel, Untertitel und Blöcke eines Themas in der Sprache von `m`. */
export function themaText(m: HilfeMessages, thema: HilfeThema): HilfeThemaText {
  return m[thema.id]
}

// ---------------------------------------------------------------------------
// Katalog und Funktionen
// ---------------------------------------------------------------------------

/** Alle Themen in der Reihenfolge des Hubs. */
export const HILFE_THEMEN: HilfeThema[] = [
  {
    id: 'uebersicht',
    zugang: 'alle',
    pfade: ['', '/aufstellung'],
    lotse: 'uebersicht',
  },
  {
    id: 'anfragen',
    zugang: 'alle',
    pfade: ['/bestellungen'],
    lotse: 'anfragen',
  },
  {
    id: 'zimmer',
    zugang: 'verwaltung',
    pfade: ['/zimmer'],
    lotse: 'zimmer',
  },
  {
    id: 'regeln',
    zugang: 'verwaltung',
    pfade: ['/einstellungen/hotel'],
    lotse: 'regeln',
  },
  {
    id: 'gastzugang',
    zugang: 'verwaltung',
    pfade: ['/einstellungen/gastzugang'],
    lotse: 'gastzugang',
  },
  {
    id: 'aushang',
    zugang: 'alle',
    pfade: ['/zimmer/aushang', '/handout', '/personal/karte'],
    lotse: 'aushang',
  },
  {
    id: 'personal',
    zugang: 'verwaltung',
    pfade: ['/personal'],
    lotse: 'personal',
  },
  {
    id: 'services',
    zugang: 'verwaltung',
    pfade: ['/services'],
    lotse: 'services',
  },
  {
    id: 'reinigung',
    zugang: 'alle',
    pfade: ['/hilfe/reinigung'],
    lotse: 'reinigung',
  },
  {
    id: 'gast',
    zugang: 'alle',
    pfade: ['/hilfe/gast'],
    lotse: 'gast',
  },
  {
    id: 'auswertung',
    zugang: 'verwaltung',
    pfade: ['/auswertung'],
    lotse: 'auswertung',
  },
  {
    id: 'zugang',
    zugang: 'alle',
    pfade: ['/einstellungen/zugang'],
  },
  {
    id: 'haeuser',
    zugang: 'verwaltung',
    bereich: 'konto',
    pfade: [''],
  },
  {
    id: 'konto',
    zugang: 'inhaber',
    bereich: 'konto',
    pfade: ['/abrechnung'],
    lotse: 'konto',
  },
]

export function themaById(id: string): HilfeThema | null {
  return HILFE_THEMEN.find(t => t.id === id) ?? null
}

export function themaBereich(thema: HilfeThema): LotseBereich {
  return thema.bereich ?? 'haus'
}

/** Themen, die eine Rolle im Hub sehen darf — dieselbe Regel wie `lotsenFuer`. */
export function themenFuer(istVerwaltung: boolean, istInhaber = false): HilfeThema[] {
  return HILFE_THEMEN.filter(t => {
    if (t.zugang === 'alle') return true
    if (t.zugang === 'verwaltung') return istVerwaltung
    return istInhaber
  })
}

/** Basis eines Bereichs — dieselbe Regel wie `lotseStart`. */
export function bereichBasis(bereich: LotseBereich, slug: string): string {
  return bereich === 'konto' ? '/admin' : `/h/${slug}/admin`
}

/**
 * Adresse der Hilfe-Seite eines Themas. Konto-Themen liegen unter `/admin`,
 * alle anderen unter `/h/<slug>/admin`.
 */
export function hilfeUrl(thema: HilfeThema, slug: string): string {
  return `${bereichBasis(themaBereich(thema), slug)}/hilfe/${thema.id}`
}

/** Der Hilfe-Hub des Hauses. */
export function hilfeHub(slug: string): string {
  return `/h/${slug}/admin/hilfe`
}

/**
 * Die Seite, um die es in einem Thema geht — dorthin führt „Erklärung" im
 * Hub, mit offener Leiste daneben. Der erste Pfad ist die Hauptseite.
 */
export function hilfeZiel(thema: HilfeThema, slug: string): string {
  return `${bereichBasis(themaBereich(thema), slug)}${thema.pfade[0]}`
}

/**
 * Bereich und relativer Pfad aus einem vollständigen `pathname`. `null`, wenn
 * die Adresse in keinem der beiden Bereiche liegt.
 */
export function relativerPfad(pathname: string): { bereich: LotseBereich; slug: string | null; pfad: string } | null {
  const haus = pathname.match(/^\/h\/([^/]+)\/admin(\/.*)?$/)
  if (haus) return { bereich: 'haus', slug: haus[1], pfad: haus[2] ?? '' }
  const konto = pathname.match(/^\/admin(\/.*)?$/)
  if (konto) return { bereich: 'konto', slug: null, pfad: konto[1] ?? '' }
  return null
}

/**
 * Das Thema zu einer Seite: längster passender Pfad gewinnt. `''` passt nur
 * exakt (die Startseite), alle anderen Pfade auch auf ihre Unterseiten.
 */
export function themaFuerPfad(pfad: string, bereich: LotseBereich = 'haus'): HilfeThema | null {
  const rein = pfad.replace(/\/$/, '')
  let bestes: { thema: HilfeThema; laenge: number } | null = null
  for (const thema of HILFE_THEMEN) {
    if (themaBereich(thema) !== bereich) continue
    for (const p of thema.pfade) {
      const passt = p === '' ? rein === '' : rein === p || rein.startsWith(`${p}/`)
      if (passt && (!bestes || p.length > bestes.laenge)) bestes = { thema, laenge: p.length }
    }
  }
  return bestes?.thema ?? null
}

/**
 * Hub und Themenseiten: Dort gibt es weder Knopf noch Leiste — die Seite
 * IST die Hilfe. Die Simulationsseiten sind ausgenommen, obwohl sie unter
 * `/hilfe/` liegen: Sie tragen ein eigenes Thema (`pfade`), und die Leiste
 * neben dem Nachbau ist genau das, was sie erklären soll.
 */
export function istHilfeSeite(pfad: string, bereich: LotseBereich = 'haus'): boolean {
  if (pfad === '/hilfe') return true
  return pfad.startsWith('/hilfe/') && themaFuerPfad(pfad, bereich) === null
}
