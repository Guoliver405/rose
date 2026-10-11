/**
 * Lotsen — geführte Erklärungen im Rezeptions-Portal.
 *
 * Diese Datei ist die EINE Stelle, an der Lotsen, ihre Schritte und ihre Anker
 * stehen. Der Grund ist derselbe wie bei `provider.ts`: Ein Anker ist ein
 * `data-lotse`-Attribut irgendwo im JSX, und den kann kein Type-Check
 * schützen — verschiebt jemand einen Abschnitt, zeigt der Lotse ins Leere.
 * Zentral abgelegt lässt er sich gegen die Quellen prüfen (siehe
 * `lotsen.anchors.test.ts`), und der Overlay meldet ein fehlendes Ziel im
 * Dev-Betrieb auf der Konsole, statt still danebenzuzeigen.
 *
 * Bewusst I/O-frei und ohne React: der Katalog ist Reihenfolge, Pfad und
 * Anker, kein Rendering. Die Texte stehen seit 11.10.2026 in der Sprachdatei
 * (`i18n/<sprache>/help/lotsen.ts`) und kommen über `lotseText`/`stepText`
 * dazu. Was die Karte daraus macht, entscheidet `LotsePilot`.
 */

import { plural } from './i18n/format'
import type { lotsen as deLotsen } from './i18n/de/help/lotsen'

/** Texte der Lotsen in einer Sprache — Form der deutschen Sprachdatei. */
export type LotsenMessages = typeof deLotsen
export type LotseId = keyof LotsenMessages['tours']
export type LotseStepKey = keyof LotsenMessages['steps']
export type LotseStepText = { title: string; body: string; /** Was der Nutzer hier selbst tun kann – steht abgesetzt unter dem Text. */ tun?: string }
export type LotseText = { title: string; subtitle: string }

/**
 * Wer den Lotsen sehen darf. `alle` = jede Rolle mit Zugang zum Haus,
 * `verwaltung` = Inhaber und Manager, `inhaber` = nur der Kontoinhaber. Der
 * Wert entscheidet nur über die Anzeige im Hilfe-Hub; die Seiten selbst halten
 * über ihre Guards dicht.
 */
export type LotseZugang = 'alle' | 'verwaltung' | 'inhaber'

/**
 * In welchem der beiden Auth-Bereiche der Lotse läuft. `haus` = unterhalb von
 * `/h/<slug>/admin`, `konto` = der Konto-Bereich unter `/admin`.
 *
 * Der Unterschied ist nicht kosmetisch: Beide Bereiche haben ihren eigenen
 * Rahmen und damit ihren eigenen `LotsePilot` mit eigener Basis. Ein Lotse
 * kann deshalb nicht über die Grenze laufen — und jeder Pilot lässt Lotsen des
 * anderen Bereichs unangetastet liegen, statt sie mit falscher Basis zu
 * verlinken.
 */
export type LotseBereich = 'haus' | 'konto'

export type LotseStep = {
  /**
   * Route unterhalb von `/h/<slug>/admin` mit führendem Slash; `''` ist die
   * Übersicht. Wechselt der Pfad von einem Schritt zum nächsten, navigiert der
   * Lotse selbst — deshalb steht der Schritt-Index in der URL.
   */
  path: string
  /**
   * Wert des `data-lotse`-Attributs am Zielelement. Ohne Anker erscheint die
   * Karte mittig — richtig für Einleitungen und für Schritte, deren Ziel es
   * je nach Zustand des Hauses gar nicht gibt.
   */
  anchor?: string
  /**
   * Schlüssel des Textes in der Sprachdatei (`i18n/<sprache>/help/lotsen.ts`,
   * `steps`). Vorgabe ist der Anker; eigener Schlüssel nur für Schritte ohne
   * Anker oder mit fremdem Anker (`stepKey`).
   */
  key?: LotseStepKey
  /**
   * Teil der Ersteinrichtung. Der Einrichtungs-Lotse fädelt nur diese
   * Schritte auf; die Fach-Lotsen zeigen alle. So bleibt der erste Durchlauf
   * kurz, ohne dass die Erklärungen dahinter fehlen.
   */
  kern?: boolean
  /**
   * Szene, in die sich eine Simulation für diesen Schritt versetzt (siehe
   * `SIM_SZENEN`). Nur für die beiden nachgebauten Portale relevant: Deren
   * Anker gibt es erst, wenn der Nachbau im passenden Zustand ist — ein
   * „Reinigung abschließen"-Slider existiert nun einmal nur während einer
   * laufenden Reinigung.
   */
  sim?: string
}

export type Lotse = {
  /** Zugleich Schlüssel von Name und Untertitel in der Sprachdatei (`tours`). */
  id: LotseId
  zugang: LotseZugang
  /** Fehlt der Wert, läuft der Lotse im Haus. */
  bereich?: LotseBereich
  steps: LotseStep[]
}

/** Reihenfolge der Fach-Lotsen in der Ersteinrichtung. */
export const EINRICHTUNG_ORDER = ['zimmer', 'regeln', 'gastzugang', 'personal', 'services'] as const

const UEBERSICHT: Lotse = {
  id: 'uebersicht',
  zugang: 'alle',
  steps: [
    { path: '', anchor: 'uebersicht.kpi' },
    { path: '', anchor: 'uebersicht.etage' },
    { path: '', anchor: 'uebersicht.kachel' },
    { key: 'uebersicht.dialog', path: '' },
    { key: 'uebersicht.checkout', path: '' },
  ],
}

const ZIMMER: Lotse = {
  id: 'zimmer',
  zugang: 'verwaltung',
  steps: [
    { path: '/zimmer', anchor: 'zimmer.anlegen', kern: true },
    { path: '/zimmer', anchor: 'zimmer.modus', kern: true },
    { path: '/zimmer', anchor: 'zimmer.bereich' },
    { path: '/zimmer', anchor: 'zimmer.nummern', kern: true },
    { path: '/zimmer', anchor: 'zimmer.praefix' },
    { path: '/zimmer', anchor: 'zimmer.absenden' },
    { path: '/zimmer', anchor: 'zimmer.bestand', kern: true },
  ],
}

const REGELN: Lotse = {
  id: 'regeln',
  zugang: 'verwaltung',
  steps: [
    { path: '/einstellungen/hotel', anchor: 'regeln.logo' },
    { path: '/einstellungen/hotel', anchor: 'regeln.zeitzone', kern: true },
    { path: '/einstellungen/hotel', anchor: 'regeln.routine', kern: true },
    { path: '/einstellungen/hotel', anchor: 'regeln.checkout', kern: true },
    { path: '/einstellungen/hotel', anchor: 'regeln.checkin' },
    { path: '/einstellungen/hotel', anchor: 'regeln.aufschub' },
    { path: '/einstellungen/hotel', anchor: 'regeln.personenbezug' },
    { path: '/einstellungen/hotel', anchor: 'regeln.fenster' },
    { path: '/einstellungen/hotel', anchor: 'regeln.pin' },
    { path: '/einstellungen/hotel', anchor: 'regeln.adresse' },
    { path: '/einstellungen/hotel', anchor: 'regeln.speichern', kern: true },
  ],
}

const GASTZUGANG: Lotse = {
  id: 'gastzugang',
  zugang: 'verwaltung',
  steps: [
    { path: '/einstellungen/gastzugang', anchor: 'gastzugang.wahl', kern: true },
    { path: '/einstellungen/gastzugang', anchor: 'gastzugang.speichern', kern: true },
    { path: '/einstellungen/gastzugang', anchor: 'gastzugang.sprachen' },
    { path: '/einstellungen/gastzugang', anchor: 'gastzugang.aushang' },
  ],
}

const PERSONAL: Lotse = {
  id: 'personal',
  zugang: 'verwaltung',
  steps: [
    { path: '/personal', anchor: 'personal.reinigung', kern: true },
    { path: '/personal', anchor: 'personal.liste', kern: true },
    { path: '/personal', anchor: 'personal.karte' },
    { path: '/personal', anchor: 'personal.rezeption' },
    { path: '/personal', anchor: 'personal.manager' },
  ],
}

const SERVICES: Lotse = {
  id: 'services',
  zugang: 'verwaltung',
  steps: [
    { path: '/services', anchor: 'services.anlegen', kern: true },
    { path: '/services', anchor: 'services.beispiele' },
    { path: '/services', anchor: 'services.liste', kern: true },
  ],
}

const ANFRAGEN: Lotse = {
  id: 'anfragen',
  zugang: 'alle',
  steps: [
    { path: '/bestellungen', anchor: 'anfragen.zaehler' },
    { path: '/bestellungen', anchor: 'anfragen.liste' },
    { path: '/bestellungen', anchor: 'anfragen.erledigt' },
    { path: '/bestellungen', anchor: 'anfragen.verlauf' },
  ],
}

/**
 * Alles Gedruckte an einer Stelle. Der Lotse läuft über drei Seiten, weil die
 * drei Papiere an drei Orten entstehen — und genau das ist die Erklärung, die
 * fehlt: Welcher Zettel kommt woher, gilt wie lange, und was macht ihn
 * ungültig.
 *
 * Zwei Schritte hängen an fremden Ankern (`uebersicht.kachel`,
 * `aushang.login`), weil Handout und Login-Karte pro Zimmer bzw. pro Person
 * entstehen: Ihre eigenen Seiten liegen hinter einer ID in der Route, die ein
 * fest verdrahteter Schritt gar nicht kennen kann.
 */
const AUSHANG: Lotse = {
  id: 'aushang',
  zugang: 'alle',
  steps: [
    { path: '/zimmer/aushang', anchor: 'aushang.karte' },
    { path: '/zimmer/aushang', anchor: 'aushang.knopf' },
    { path: '/zimmer/aushang', anchor: 'aushang.erneuern' },
    { path: '/zimmer/aushang', anchor: 'aushang.hinweis' },
    { key: 'aushang.blatt', path: '', anchor: 'uebersicht.kachel' },
    { path: '/personal', anchor: 'aushang.login' },
  ],
}

const AUSWERTUNG: Lotse = {
  id: 'auswertung',
  zugang: 'verwaltung',
  steps: [
    { path: '/auswertung', anchor: 'auswertung.zeitraum' },
    { path: '/auswertung', anchor: 'auswertung.kennzahlen' },
    { path: '/auswertung', anchor: 'auswertung.auffaellig' },
    { path: '/auswertung', anchor: 'auswertung.tabelle' },
    { path: '/auswertung', anchor: 'auswertung.nachfrage' },
  ],
}

const KONTO: Lotse = {
  id: 'konto',
  zugang: 'inhaber',
  bereich: 'konto',
  steps: [
    { path: '/abrechnung', anchor: 'konto.plan' },
    { path: '/abrechnung', anchor: 'konto.laufend' },
    { path: '/abrechnung', anchor: 'konto.monate' },
    { path: '/abrechnung', anchor: 'konto.zahlungsweg' },
    { path: '/abrechnung', anchor: 'konto.rechnungen' },
  ],
}

/**
 * Szenen der beiden nachgebauten Portale.
 *
 * Sie stehen hier und nicht in den Komponenten, damit die Zuordnung
 * Schritt → Szene testbar bleibt: Ein Tippfehler im `sim`-Feld führte sonst
 * dazu, dass die Simulation stumm in der Ausgangsszene stehen bleibt und der
 * Coach Mark einen Anker sucht, den es gerade nicht gibt.
 */
export const SIM_SZENEN = {
  reinigung: ['login', 'schicht', 'etagen', 'zimmer', 'dialog', 'reinigung', 'status'],
  gast: ['zugang', 'portal', 'aufschub', 'gewuenscht', 'verzicht', 'dnd', 'services', 'bestellt'],
} as const

export type SimBereich = keyof typeof SIM_SZENEN

/**
 * Reinigungsboard und Gäste-Portal sind aus der Rezeptions-Sitzung **nicht**
 * erreichbar: eigener Cookie-Namespace (`svc_`), eigenes Konto, und das
 * Gastportal verlangt einen laufenden Aufenthalt samt PIN. Ein Coach Mark
 * kann dort nicht hinlaufen — deshalb ein Nachbau auf einer eigenen Seite.
 *
 * Das ist nicht nur der Ausweg, sondern für diese beiden Themen der bessere
 * Weg: kein zweites Konto, kein Handy, keine Testdaten, reproduzierbar, und
 * Zustände wie „Prio und dringende Anfrage gleichzeitig" lassen sich zeigen,
 * ohne sie erst mühsam herzustellen. Bedienen darf man den Nachbau frei; der
 * nächste Schritt stellt die Szene wieder her.
 */
const REINIGUNG: Lotse = {
  id: 'reinigung',
  zugang: 'alle',
  steps: [
    { path: '/hilfe/reinigung', anchor: 'reinigung.login', sim: 'login' },
    { path: '/hilfe/reinigung', anchor: 'reinigung.schicht', sim: 'schicht' },
    { path: '/hilfe/reinigung', anchor: 'reinigung.etagen', sim: 'etagen' },
    { path: '/hilfe/reinigung', anchor: 'reinigung.naechstes', sim: 'etagen' },
    { path: '/hilfe/reinigung', anchor: 'reinigung.kacheln', sim: 'zimmer' },
    { path: '/hilfe/reinigung', anchor: 'reinigung.starten', sim: 'dialog' },
    { path: '/hilfe/reinigung', anchor: 'reinigung.tuer', sim: 'dialog' },
    { path: '/hilfe/reinigung', anchor: 'reinigung.abschliessen', sim: 'reinigung' },
    { path: '/hilfe/reinigung', anchor: 'reinigung.status', sim: 'status' },
    { path: '/hilfe/reinigung', anchor: 'reinigung.verlassen', sim: 'zimmer' },
  ],
}

const GAST: Lotse = {
  id: 'gast',
  zugang: 'alle',
  steps: [
    { path: '/hilfe/gast', anchor: 'gast.zugang', sim: 'zugang' },
    { path: '/hilfe/gast', anchor: 'gast.portal', sim: 'portal' },
    { path: '/hilfe/gast', anchor: 'gast.reinigen', sim: 'portal' },
    { path: '/hilfe/gast', anchor: 'gast.aufschub', sim: 'aufschub' },
    { path: '/hilfe/gast', anchor: 'gast.aktiv', sim: 'gewuenscht' },
    { path: '/hilfe/gast', anchor: 'gast.verzicht', sim: 'verzicht' },
    { path: '/hilfe/gast', anchor: 'gast.dnd', sim: 'dnd' },
    { path: '/hilfe/gast', anchor: 'gast.services', sim: 'services' },
    { path: '/hilfe/gast', anchor: 'gast.bestellt', sim: 'bestellt' },
  ],
}

/** Die Fach-Lotsen in der Reihenfolge des Hubs. */
export const LOTSEN: Lotse[] = [
  UEBERSICHT, ANFRAGEN, ZIMMER, REGELN, GASTZUGANG, AUSHANG, PERSONAL, SERVICES,
  REINIGUNG, GAST, AUSWERTUNG, KONTO,
]

/**
 * Szene, in die sich eine Simulation für den gegebenen Schritt versetzt.
 * `null` = keine Vorgabe (dann bleibt der Nachbau, wie der Nutzer ihn
 * hinterlassen hat, bzw. startet in seiner Ausgangsszene).
 */
export function szeneFuerSchritt(lotseId: string | null, schritt: string | number | null): string | null {
  if (!lotseId) return null
  const lotse = lotseById(lotseId)
  if (!lotse) return null
  return lotse.steps[clampStep(lotse, schritt)]?.sim ?? null
}

/**
 * Der Einrichtungs-Lotse ist kein eigener Text, sondern die Kernschritte der
 * Fach-Lotsen in Reihenfolge, gerahmt von Begrüßung und Abschluss. So kann
 * dieselbe Erklärung nicht an zwei Stellen auseinanderlaufen.
 */
export const EINRICHTUNG: Lotse = {
  id: 'einrichtung',
  zugang: 'verwaltung',
  steps: [
    { key: 'einrichtung.start', path: '/zimmer' },
    ...EINRICHTUNG_ORDER.flatMap(id => {
      const lotse = LOTSEN.find(l => l.id === id)
      if (!lotse) throw new Error(`Unbekannter Lotse in EINRICHTUNG_ORDER: ${id}`)
      return lotse.steps.filter(s => s.kern)
    }),
    { key: 'einrichtung.ende', path: '/hilfe', anchor: 'hilfe.katalog' },
  ],
}

/** Schlüssel des Schritt-Textes: eigener Schlüssel, sonst der Anker. */
export function stepKey(step: LotseStep): string {
  const key = step.key ?? step.anchor
  if (!key) throw new Error(`Lotsen-Schritt ohne Schlüssel und Anker (${step.path})`)
  return key
}

/** Name und Untertitel eines Lotsen in der Sprache von `m`. */
export function lotseText(m: LotsenMessages, lotse: Lotse): LotseText {
  return m.tours[lotse.id]
}

/** Text eines Schritts in der Sprache von `m`. */
export function stepText(m: LotsenMessages, step: LotseStep): LotseStepText {
  const text: LotseStepText | undefined = (m.steps as Record<string, LotseStepText>)[stepKey(step)]
  if (!text) throw new Error(`Kein Text für Lotsen-Schritt ${stepKey(step)}`)
  return text
}

/**
 * Wohin ein frisch registriertes Konto geführt wird: der erste Schritt der
 * Einrichtung. Als Funktion, damit Registrierung, Zahlungsweg-Seite und
 * Hilfe-Hub nicht drei Varianten derselben URL zusammenbauen.
 */
export function einrichtungStart(slug: string): string {
  return lotseStart(EINRICHTUNG, slug)
}

/** Alle Lotsen, die es gibt — Fach-Lotsen plus Einrichtung. */
export const ALLE_LOTSEN: Lotse[] = [EINRICHTUNG, ...LOTSEN]

export function lotseById(id: string): Lotse | null {
  return ALLE_LOTSEN.find(l => l.id === id) ?? null
}

/** Fach-Lotsen, die eine Rolle im Hub sehen darf. */
export function lotsenFuer(istVerwaltung: boolean, istInhaber = false): Lotse[] {
  return LOTSEN.filter(l => {
    if (l.zugang === 'alle') return true
    if (l.zugang === 'verwaltung') return istVerwaltung
    return istInhaber
  })
}

/**
 * Vollständige Start-URL eines Lotsen. Die Basis hängt am Bereich: Konto-
 * Lotsen liegen unter `/admin`, alle anderen unter `/h/<slug>/admin`. Als
 * Funktion, damit Hub und Seiten nicht jeder für sich raten.
 */
export function lotseStart(lotse: Lotse, slug: string): string {
  const basis = lotse.bereich === 'konto' ? '/admin' : `/h/${slug}/admin`
  return `${basis}${lotse.steps[0].path}?lotse=${lotse.id}&schritt=0`
}

/** Alle vorkommenden Anker — Grundlage der Anker-Prüfung gegen die Quellen. */
export function alleAnker(): string[] {
  const set = new Set<string>()
  for (const l of ALLE_LOTSEN) for (const s of l.steps) if (s.anchor) set.add(s.anchor)
  return [...set].sort()
}

/**
 * Schritt-Index sicher einlesen. Er kommt aus der URL und damit vom Nutzer —
 * ein „schritt=99" darf keinen leeren Overlay erzeugen, sondern landet auf
 * dem letzten Schritt.
 */
export function clampStep(lotse: Lotse, raw: string | number | null | undefined): number {
  const n = typeof raw === 'number' ? raw : Number.parseInt(String(raw ?? ''), 10)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(Math.trunc(n), lotse.steps.length - 1)
}

// ---------------------------------------------------------------------------
// Einrichtungs-Fortschritt
// ---------------------------------------------------------------------------

/**
 * Was das Haus tatsächlich hat. Bewusst rohe Zahlen aus der Datenbank statt
 * gespeicherter Häkchen: Ein Häkchen kann lügen, sobald jemand das letzte
 * Zimmer wieder löscht oder das Personal ausscheidet. Dieselbe Haltung wie bei
 * `isBillable` und `isStayoverDue` — ableiten, nicht festschreiben.
 */
export type SetupFacts = {
  rooms: number
  maids: number
  services: number
  /** `policies.guestAccessMode` ist gesetzt — das Verfahren wurde bewusst gewählt. */
  guestAccessChosen: boolean
  /** `policies.timeZone` ist gesetzt — die Regelseite wurde einmal angefasst. */
  timeZoneChosen: boolean
  /** Aufenthalte insgesamt, auch beendete: Ist schon einmal eingecheckt worden? */
  stays: number
  /** Zahlungsweg hinterlegt; `null`, wenn die Rolle damit nichts zu tun hat. */
  paymentMethod: boolean | null
}

export type SetupItem = {
  id: string
  label: string
  /** Dasselbe als Handlungsaufforderung — „Zimmer anlegen" statt „Zimmer angelegt". */
  todo: string
  hint: string
  done: boolean
  /** Ziel-Route unterhalb von `/h/<slug>/admin`; `null` = außerhalb des Hauses. */
  path: string | null
  /** Passender Lotse, falls es einen gibt. */
  lotse: string | null
  /** Absolute Route außerhalb des Hauses (Konto-Bereich). */
  href?: string
  /** Nicht nötig für den Betrieb — zählt nicht gegen „fertig". */
  optional?: boolean
}

export type SetupProgress = {
  items: SetupItem[]
  done: number
  total: number
  /** Alles erledigt, was für den Betrieb nötig ist. */
  complete: boolean
}

/**
 * Was die **Einrichtung** eines Hauses ausmacht — ohne Meilensteine wie den
 * ersten Check-in und ohne Freiwilliges.
 *
 * Eigener Typ, weil das Band auf der Übersicht genau diese vier Punkte
 * braucht und sonst nichts: Zimmer und Policies liegen dort ohnehin auf dem
 * Tisch, die Reinigungskräfte kommen aus einer Abfrage, die es schon gibt.
 * Der Rest von `SetupFacts` (Services, Aufenthalte, Zahlungsweg) würde eigene
 * Abfragen kosten — auf der meistbesuchten Seite des Portals.
 */
export type SetupKonfig = Pick<SetupFacts, 'rooms' | 'maids' | 'timeZoneChosen' | 'guestAccessChosen'>

/** Texte der Checkliste in einer Sprache, dazu der `Intl`-Sprach-Tag für die Pluralformen. */
export type SetupTexts = { m: LotsenMessages['setup']; intl: string }

type SetupId = keyof LotsenMessages['setup']

/** Beschriftung, Handlungsform und Hinweis eines Punkts aus der Sprachdatei. */
function texte(t: SetupTexts, id: SetupId, done: boolean, count = 0): Pick<SetupItem, 'label' | 'todo' | 'hint'> {
  const e = t.m[id]
  const hint = done ? e.done : e.open
  return {
    label: e.label,
    todo: e.todo,
    hint: typeof hint === 'string' ? hint : plural(t.intl, count, hint),
  }
}

/** Die vier Konfigurations-Punkte in Reihenfolge — eine Quelle für Hub und Band. */
function konfigItems(f: SetupKonfig, t: SetupTexts): SetupItem[] {
  return [
    {
      id: 'zimmer',
      ...texte(t, 'zimmer', f.rooms > 0, f.rooms),
      done: f.rooms > 0,
      path: '/zimmer', lotse: 'zimmer',
    },
    {
      id: 'regeln',
      ...texte(t, 'regeln', f.timeZoneChosen),
      done: f.timeZoneChosen,
      path: '/einstellungen/hotel', lotse: 'regeln',
    },
    {
      id: 'gastzugang',
      ...texte(t, 'gastzugang', f.guestAccessChosen),
      done: f.guestAccessChosen,
      path: '/einstellungen/gastzugang', lotse: 'gastzugang',
    },
    {
      id: 'personal',
      ...texte(t, 'personal', f.maids > 0, f.maids),
      done: f.maids > 0,
      path: '/personal', lotse: 'personal',
    },
  ]
}

/** Nur die noch offenen Konfigurations-Punkte — Grundlage des Bands. */
export function offeneEinrichtung(f: SetupKonfig, t: SetupTexts): SetupItem[] {
  return konfigItems(f, t).filter(i => !i.done)
}

export function setupProgress(facts: SetupFacts, t: SetupTexts): SetupProgress {
  const items: SetupItem[] = [
    ...konfigItems(facts, t),
    {
      id: 'services',
      ...texte(t, 'services', facts.services > 0, facts.services),
      done: facts.services > 0,
      path: '/services', lotse: 'services',
      optional: true,
    },
    {
      id: 'checkin',
      ...texte(t, 'checkin', facts.stays > 0),
      done: facts.stays > 0,
      path: '', lotse: 'uebersicht',
    },
  ]

  if (facts.paymentMethod !== null) {
    items.push({
      id: 'zahlungsweg',
      ...texte(t, 'zahlungsweg', facts.paymentMethod),
      done: facts.paymentMethod,
      path: null, lotse: null,
      href: '/admin/abrechnung/zahlungsweg',
      optional: true,
    })
  }

  // „Fertig" hängt nur an den Pflichtpunkten. Services und Zahlungsweg sind
  // ausdrücklich freiwillig und dürfen ein eingerichtetes Haus nicht für
  // immer als unfertig anzeigen.
  return {
    items,
    done: items.filter(i => i.done).length,
    total: items.length,
    complete: items.filter(i => !i.optional).every(i => i.done),
  }
}
