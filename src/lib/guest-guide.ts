/**
 * Kurzanleitung fürs Gäste-Portal — der Text, der dem Gast erklärt, wozu das
 * Portal da ist und was er tun muss (und was nicht).
 *
 * Eine Quelle für Handout (Druck) und Mail, damit beide dasselbe sagen. Der
 * entscheidende Satz hängt an den Hotel-Policies: Bei eingeschalteter
 * Routine-Reinigung (`stayoverAutoClean`) muss der Gast NICHTS anfordern —
 * ohne sie wird nur auf Wunsch gereinigt, und genau das muss der Gast wissen,
 * sonst wartet er vergeblich. Das Zeitfenster (`cleaningWindow*`) kommt dazu,
 * wenn es gesetzt ist.
 *
 * **Vier Sprachen** (08.09.2026): Das gedruckte Handout ist DIN A4 und trägt
 * die Anleitung neben dem QR-Bereich in Deutsch, Englisch, Spanisch und
 * Französisch — ein Gast, der kein Deutsch liest, soll den Zettel nicht
 * weglegen müssen. Alle vier stammen aus derselben Vorlage, damit eine neue
 * Regel nicht in einer Sprache vergessen wird; fehlt ein Satz, fällt es im
 * Test auf. Die Mail bleibt vorerst deutsch (Standardsprache), weil sie sonst
 * viermal so lang würde.
 *
 * **Kehrtwende 09.09.2026 — Piktogramme statt Sprachliste** (`GuestSheetText`,
 * Bauplan `Sessions/Druckblaetter-Plan-2026-09-09.md`): Vier Sprachen auf einem
 * Blatt sind willkürlich — ein italienischer, polnischer oder chinesischer Gast
 * bekommt vier Blöcke, von denen ihm keiner hilft, und sie sind der Grund,
 * warum das Blatt ein dichtes Formular bei 10 px ist. Das gedruckte Blatt trägt
 * deshalb **Piktogramme der Portal-Knöpfe** und Text in **einer bis zwei**
 * Sprachen (`policies.sheetLanguage` / `sheetLanguage2`, Vorgabe de + en). Die
 * Details liefert das Portal, das der Gast ohnehin gerade öffnet — Papier ist
 * die Einladung, der Bildschirm die Anleitung.
 *
 * Zwei Feinheiten, die dabei zählen:
 *
 * - **Der permanente Zimmer-Aushang darf keine Regel drucken.** Sie hängt an
 *   den Policies, und ein gedruckter Satz veraltet stillschweigend, wenn das
 *   Haus die Routine umstellt. Dafür ist `sustainabilityNeutral` da: in beiden
 *   Welten wahr. Der verzweigte `cleaningRule` gehört nur aufs Handout, das je
 *   Aufenthalt frisch entsteht.
 * - **Die Knopf-Beschriftung folgt der Sprache des PORTALS** (`portalLocaleFor`):
 *   Eine Legende, die „Clean my room" nennt, während auf dem Bildschirm
 *   „Zimmer reinigen" steht, ist keine Legende. Seit 17.10.2026 zeigt jeder
 *   Sprachblock die Knöpfe so, wie ein Handy in dieser Sprache sie sähe — in
 *   der Blatt-Sprache, wenn das Portal sie kann, sonst in der Rückfallsprache
 *   des Hauses. Der Hinweis daneben steht immer in der Blatt-Sprache.
 *
 * Die vier Sprachen bleiben trotzdem vollständig: sie tragen die Mail und sind
 * die Saat für die Portal-Übersetzung.
 *
 * **Nachhaltigkeit** ist ein eigener Punkt, und er ist ehrlich verzweigt:
 * Reinigt das Haus nur auf Wunsch, ist der Verzicht der Normalfall und wird
 * begründet. Läuft die Routine, ist seit 26.09.2026 der Knopf „Heute keine
 * Reinigung" der Hebel, den der Gast in der Hand hat (vorher „Bitte nicht
 * stören" — das hält aber auch den Service fern und gilt über den Tag hinaus). Ein Werbetext, der zum Verzicht aufruft, während
 * ohnehin täglich gereinigt wird, wäre eine Lüge auf Papier.
 *
 * Ohne I/O: Policies rein, Text raus — testbar in `guest-guide.test.ts`.
 */
import { parseCleanDefer, parseCleaningWindow, parseStayoverPolicy, stayoverDueTime } from './board'
import type { GuestAccessMode } from './guest-access'
import { format, getMessages, GUEST_LOCALES, isLocale, parseFallbackLanguage, parseHomeLanguage, type Locale } from './i18n'
import { GUIDE_LANGS, SHEETS, type GuideLang } from './i18n/sheets'

// Die Sätze selbst stehen seit 10.10.2026 in den Sprachdateien
// (`i18n/<sprache>/sheet.ts`); hier steht nur noch, welcher Satz wann gilt.
export { GUIDE_LANGS, type GuideLang }

/** Sprache der Mail und aller Stellen ohne ausdrückliche Wahl. */
export const DEFAULT_GUIDE_LANG: GuideLang = 'de'

export type GuestGuide = {
  lang: GuideLang
  /** Name der Sprache in der Sprache selbst — Überschrift des Blocks. */
  langLabel: string
  /** „So funktioniert's". */
  heading: string
  /** Wozu das Portal da ist. */
  purpose: string
  /** Reinigung: Routine oder auf Wunsch — der Satz, der an den Policies hängt. */
  cleaning: string
  /** Warum weniger Reinigung gut ist — verzweigt nach Routine an/aus. */
  sustainability: string
  /** „Bitte nicht stören". */
  dnd: string
  /** Service-Anfragen. */
  services: string
  /** Wie man hineinkommt und wie lange der Zugang gilt. */
  access: string
  /** Beschriftungen der Aufzählung, in derselben Sprache. */
  labels: {
    cleaning: string
    sustainability: string
    dnd: string
    services: string
    access: string
  }
}

export type GuestGuideOptions = {
  /** Verfahren DIESES Aufenthalts (`stays.access_mode`). */
  accessMode: GuestAccessMode
  /** Führt QR/Link direkt ins Zimmer (true) oder nur auf die Hotel-Adresse (false)? */
  deepLink: boolean
  /**
   * Steht beim Ausstellen fest, dass der Gast über heute hinaus bleibt
   * (Abreisedatum in der Zukunft, `isKnownStayover`)? Dann gilt die Routine-Zeit
   * selbst statt der Check-out-Frist — wie auf dem Board (20.10.2026).
   */
  knownStayover?: boolean
}

/** Beschriftungen des Zugangs-Bereichs — auf dem Blatt vierfach nebeneinander. */
export type SheetLabels = {
  welcome: string
  room: string
  scan: string
  pin: string
  /** Aushang: Die PIN steht nicht auf dem Aushang, sondern kommt vom Check-in. */
  pinFromReception: string
  withoutQr: string
  /** Alternativtext des QR-Codes. */
  qrAlt: string
  /** Nur im Verfahren `link`: Der Zettel IST der Zugang. */
  keep: string
}

/** Ein Knopf des Portals, wie ihn das Blatt als Legende zeigt. */
export type SheetButton = {
  /** Wortgleich mit dem Portal — Sprache des Portals, nicht des Blattes. */
  label: string
  /** Was der Knopf bewirkt, in der Sprache des Blattes. */
  hint: string
}

/**
 * Ein Textblock des gedruckten Blattes. Kurz gehalten: was hier steht, muss
 * neben Piktogrammen und einem 50-mm-QR auf DIN A4 Platz haben.
 */
export type GuestSheetText = {
  lang: GuideLang
  langLabel: string
  welcome: string
  room: string
  scan: string
  pinLabel: string
  pinFromReception: string
  withoutQr: string
  qrAlt: string
  keep: string
  /** Legende der drei Portal-Knöpfe. */
  buttons: {
    clean: SheetButton
    dnd: SheetButton
    services: SheetButton
  }
  /** Policy-NEUTRAL, für den permanenten Aushang — in beiden Welten wahr. */
  sustainabilityNeutral: string
  /** Verzweigt und mit Uhrzeiten — nur fürs Handout je Aufenthalt. */
  cleaningRule: string
  /** Verzweigt — nur fürs Handout. */
  sustainability: string
  access: string
  footer: string
}

/**
 * In welcher Sprache zeigt ein Sprachblock die Knöpfe des Portals? So, wie
 * ein Handy in dieser Sprache sie sähe (Entscheidung 17.10.2026): in der
 * Blatt-Sprache, wenn das Gästeportal sie anbietet, sonst in der
 * Rückfallsprache des Hauses — die zeigt das Portal einem Gast, dessen
 * Sprache es nicht kennt. Eine Legende muss das Wort vom Bildschirm tragen.
 */
export function portalLocaleFor(lang: GuideLang, policies: Record<string, unknown>): Locale {
  return isLocale(lang) && GUEST_LOCALES.includes(lang) ? lang : parseFallbackLanguage(policies)
}

function hhmm(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function buildGuestGuide(
  policies: Record<string, unknown>,
  opts: GuestGuideOptions,
  lang: GuideLang = DEFAULT_GUIDE_LANG,
): GuestGuide {
  const v = SHEETS[lang]
  const stayover = parseStayoverPolicy(policies)
  const window = parseCleaningWindow(policies)
  const defer = parseCleanDefer(policies)

  const zusatz =
    (window.enabled ? format(v.window, { start: window.start, end: window.end }) : '') +
    (defer.enabled ? format(v.defer, { limit: hhmm(defer.hour, defer.minute) }) : '')

  // Genannt wird die Zeit, ab der die Routine WIRKLICH fällig wird — ohne
  // bekanntes Abreisedatum nie vor der Check-out-Frist (siehe `stayoverDueTime`).
  const due = stayoverDueTime(stayover, opts.knownStayover)
  const cleaning = stayover.enabled
    ? `${format(v.cleaningRoutine, { due: hhmm(due.hour, due.minute) })}${zusatz}`
    : `${v.cleaningOnRequest}${zusatz}`

  const access =
    opts.accessMode === 'link'
      ? v.access.link
      : opts.deepLink
        ? v.access.pinDeep
        : v.access.pinManual

  return {
    lang,
    langLabel: v.langLabel,
    heading: v.heading,
    purpose: v.purpose,
    cleaning,
    sustainability: stayover.enabled
      ? format(v.sustainabilityRoutine, { skip: getMessages(portalLocaleFor(lang, policies)).guest.signal.skip.label })
      : v.sustainabilityOnRequest,
    dnd: v.dnd,
    services: v.services,
    access,
    labels: v.labels,
  }
}

/** Alle Sprachen des Handouts, in Druckreihenfolge. */
export function buildGuestGuides(
  policies: Record<string, unknown>,
  opts: GuestGuideOptions,
): GuestGuide[] {
  return GUIDE_LANGS.map(lang => buildGuestGuide(policies, opts, lang))
}

/** Beschriftungen des Zugangs-Bereichs je Sprache. */
export function sheetLabels(lang: GuideLang): SheetLabels {
  return SHEETS[lang].sheet
}

/**
 * Name der Sprache in ihrer eigenen Sprache — für die Auswahl im Haus.
 * Absichtlich nicht übersetzt: „Français" findet auch, wer kein Deutsch kann.
 */
export function sheetLanguageLabel(lang: GuideLang): string {
  return SHEETS[lang].langLabel
}

/** Die Punkte in Lesereihenfolge — für Reintext und Aufzählungen. */
export function guideLines(g: GuestGuide): string[] {
  return [g.purpose, g.cleaning, g.sustainability, g.dnd, g.services, g.access]
}

/* ─────────────────────────────────────────────────────────────────────────
   Das gedruckte Blatt (ab 09.09.2026) — ein bis zwei Sprachen, siehe Kopf.
   ───────────────────────────────────────────────────────────────────────── */

/** Erste Sprache des Blattes, wenn das Haus nichts gewählt hat. */
export const SHEET_LANG_DEFAULT: GuideLang = 'de'
/** Zweite Sprache, wenn das Haus nichts gewählt hat. */
export const SHEET_LANG2_DEFAULT: GuideLang = 'en'

function alsSprache(wert: unknown): GuideLang | null {
  return typeof wert === 'string' && (GUIDE_LANGS as readonly string[]).includes(wert)
    ? (wert as GuideLang)
    : null
}

/**
 * Die Sprachen des gedruckten Blattes, in Druckreihenfolge — eine oder zwei.
 *
 * Drei Fälle, die auseinandergehalten werden müssen: Ein **fehlender**
 * Schlüssel ist Altbestand und bekommt die Vorgabe (de + en). Eine
 * **ausdrücklich leere** zweite Sprache heißt „nur eine Sprache" — ohne diese
 * Unterscheidung könnte ein Haus die zweite nie abwählen. Ein **unbekannter**
 * Wert in der zweiten Position ist kein Auftrag, Englisch zu drucken: er fällt
 * ersatzlos weg. Die erste Sprache muss es dagegen immer geben.
 *
 * **Seit 17.10.2026 ist die erste Sprache die Rückfallsprache des Hauses**
 * (`policies.fallbackLanguage`) — keine eigene Einstellung mehr, sonst liefen
 * drei Spracheinstellungen leise auseinander. Kennen die Blätter sie nicht,
 * wird englisch gedruckt. Häuser ohne Rückfallsprache behalten ihre frühere
 * erste Blatt-Sprache (`sheetLanguage`), bis sie die Sprachen speichern.
 */
export function sheetLanguageFor(locale: Locale): GuideLang {
  return alsSprache(locale) ?? 'en'
}

export function parseSheetLanguages(policies: Record<string, unknown>): GuideLang[] {
  const erste = isLocale(policies.fallbackLanguage)
    ? sheetLanguageFor(policies.fallbackLanguage)
    : alsSprache(policies.sheetLanguage) ?? sheetLanguageFor(parseHomeLanguage(policies))
  const roh = policies.sheetLanguage2
  const zweite =
    roh === undefined || roh === null ? SHEET_LANG2_DEFAULT : alsSprache(roh)

  return zweite && zweite !== erste ? [erste, zweite] : [erste]
}

/**
 * Sprachen, für die der Service-Baukasten Übersetzungen anmahnt (20.10.2026):
 * Rückfallsprache und Blatt-Sprachen des Hauses — die hat es selbst gewählt.
 * Die Heimatsprache fällt je Service ohnehin heraus (Grundtext). Alle übrigen
 * Sprachen des Gästeportals bleiben übersetzbar, gelten aber als „optional“;
 * vorher mahnte der Baukasten eine deutsche Pension für Französisch und
 * Spanisch (Fund aus dem Blindtest).
 */
export function maintainedLanguages(policies: Record<string, unknown>, offered: readonly Locale[]): Locale[] {
  const wanted = new Set<string>([parseFallbackLanguage(policies), ...parseSheetLanguages(policies)])
  return offered.filter(locale => wanted.has(locale))
}

export type GuestSheetOptions = GuestGuideOptions

/** Ein Sprachblock des gedruckten Blattes. */
export function buildGuestSheet(
  policies: Record<string, unknown>,
  opts: GuestSheetOptions,
  lang: GuideLang = DEFAULT_GUIDE_LANG,
): GuestSheetText {
  const v = SHEETS[lang]
  // Knopf-Beschriftungen so, wie ein Handy in dieser Sprache sie sieht.
  const portal = getMessages(portalLocaleFor(lang, policies)).guest
  // Reinigung, Nachhaltigkeit und Zugang verzweigen an den Policies — die
  // Verzweigung steht genau einmal, in `buildGuestGuide`.
  const g = buildGuestGuide(policies, opts, lang)

  return {
    lang,
    langLabel: v.langLabel,
    welcome: v.sheet.welcome,
    room: v.sheet.room,
    scan: v.sheet.scan,
    pinLabel: v.sheet.pin,
    pinFromReception: v.sheet.pinFromReception,
    withoutQr: v.sheet.withoutQr,
    qrAlt: v.sheet.qrAlt,
    keep: v.sheet.keep,
    buttons: {
      clean: { label: portal.signal.clean.label, hint: v.buttonHints.clean },
      dnd: { label: portal.signal.dnd.label, hint: v.buttonHints.dnd },
      services: { label: portal.services.heading, hint: v.buttonHints.services },
    },
    sustainabilityNeutral: v.sustainabilityNeutral,
    cleaningRule: g.cleaning,
    sustainability: g.sustainability,
    access: g.access,
    footer: v.footer,
  }
}

/** Die Blöcke des Blattes in Druckreihenfolge, nach der Wahl des Hauses. */
export function buildGuestSheets(
  policies: Record<string, unknown>,
  opts: GuestSheetOptions,
): GuestSheetText[] {
  return parseSheetLanguages(policies).map(lang => buildGuestSheet(policies, opts, lang))
}
