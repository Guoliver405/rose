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
 * - **Die Knopf-Beschriftung folgt der Sprache des PORTALS, nicht der des
 *   Blattes** (`portalLang`). Eine Legende, die „Clean my room" nennt, während
 *   auf dem Bildschirm „Zimmer reinigen" steht, ist keine Legende. Der Hinweis
 *   daneben steht dagegen in der Blatt-Sprache. Sobald das Portal übersetzt
 *   ist, wandert `portalLang` mit.
 *
 * Die vier Sprachen bleiben trotzdem vollständig: sie tragen die Mail und sind
 * die Saat für die Portal-Übersetzung.
 *
 * **Nachhaltigkeit** ist ein eigener Punkt, und er ist ehrlich verzweigt:
 * Reinigt das Haus nur auf Wunsch, ist der Verzicht der Normalfall und wird
 * begründet. Läuft die Routine, ist „Bitte nicht stören" der Hebel, den der
 * Gast in der Hand hat. Ein Werbetext, der zum Verzicht aufruft, während
 * ohnehin täglich gereinigt wird, wäre eine Lüge auf Papier.
 *
 * Ohne I/O: Policies rein, Text raus — testbar in `guest-guide.test.ts`.
 */
import { parseCleanDefer, parseCleaningWindow, parseStayoverPolicy, stayoverDueTime } from './board'
import type { GuestAccessMode } from './guest-access'

/** Sprachen des gedruckten Handouts, in Druckreihenfolge. */
export const GUIDE_LANGS = ['de', 'en', 'es', 'fr'] as const
export type GuideLang = (typeof GUIDE_LANGS)[number]

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

type Vorlage = {
  langLabel: string
  heading: string
  sheet: SheetLabels
  labels: GuestGuide['labels']
  buttons: GuestSheetText['buttons']
  /** Ohne Uhrzeit und ohne Policy-Verzweigung — siehe Kopfkommentar. */
  sustainabilityNeutral: string
  footer: string
  purpose: string
  dnd: string
  services: string
  cleaningRoutine: (due: string) => string
  cleaningOnRequest: string
  window: (start: string, end: string) => string
  defer: (limit: string) => string
  sustainabilityRoutine: string
  sustainabilityOnRequest: string
  accessLink: string
  accessPinDeep: string
  accessPinManual: string
}

/**
 * Die Vorlagen. Typografische Apostrophe und Anführungszeichen sind Absicht —
 * das hier wird gedruckt.
 */
const VORLAGEN: Record<GuideLang, Vorlage> = {
  de: {
    langLabel: 'Deutsch',
    heading: 'So funktioniert’s',
    sheet: {
      welcome: 'Willkommen',
      room: 'Zimmer',
      scan: 'QR-Code scannen',
      pin: 'Ihre PIN',
      pinFromReception: 'PIN erhalten Sie beim Check-in.',
      withoutQr: 'Ohne QR-Code',
      keep: 'Bitte aufbewahren — dieser Zettel ist Ihr Zugang.',
    },
    // Beschriftungen wortgleich mit dem Gastportal (GuestSignalPanel,
    // GuestServicesPanel) — das Blatt ist die Legende zum Bildschirm.
    buttons: {
      clean: { label: 'Zimmer reinigen', hint: 'Tippen, wenn Ihr Zimmer gereinigt werden soll.' },
      dnd: { label: 'Bitte nicht stören', hint: 'Niemand klopft, keine Reinigung.' },
      services: {
        label: 'Service bestellen',
        hint: 'Handtücher, Reparaturen und mehr — die Rezeption sieht es sofort.',
      },
    },
    sustainabilityNeutral:
      'Jede Reinigung, die nicht nötig ist, spart Wasser, Waschmittel und Energie — Sie entscheiden im Portal.',
    footer: 'Alle Angaben und die aktuellen Zeiten stehen im Portal.',
    labels: {
      cleaning: 'Reinigung',
      sustainability: 'Nachhaltigkeit',
      dnd: 'Ruhe',
      services: 'Services',
      access: 'Zugang',
    },
    purpose:
      'Über das Gäste-Portal erreichen Sie die Rezeption direkt vom Zimmer aus — rund um die Uhr, ohne Anruf.',
    dnd: '„Bitte nicht stören" im Portal hält das Personal von Ihrem Zimmer fern, bis Sie es wieder zurücknehmen.',
    services:
      'Wünsche wie frische Handtücher oder eine Reparatur bestellen Sie direkt im Portal — die Rezeption sieht Ihre Anfrage sofort.',
    cleaningRoutine: due =>
      `Ihr Zimmer wird täglich ab ${due} Uhr gereinigt — Sie müssen nichts anfordern; am Abreisetag nach dem Check-out. Möchten Sie zwischendurch eine Reinigung, fordern Sie sie im Portal an.`,
    cleaningOnRequest:
      'Ihr Zimmer wird auf Wunsch gereinigt: Bitte fordern Sie die Reinigung im Portal an, sobald es Ihnen passt — ohne Anforderung bleibt das Zimmer unberührt.',
    window: (start, end) => ` Reinigungswünsche nimmt das Portal täglich von ${start} bis ${end} Uhr entgegen.`,
    defer: limit => ` Im Portal können Sie die Reinigung auch bis spätestens ${limit} Uhr aufschieben — vorher kommt dann niemand.`,
    sustainabilityRoutine:
      'Sie brauchen heute keine Reinigung? Ein Tipp auf „Bitte nicht stören" spart Wasser, Waschmittel und Energie — und Ihnen die Störung.',
    sustainabilityOnRequest:
      'Weniger Reinigung, weniger Verbrauch: Jede Reinigung, die nicht nötig ist, spart Wasser, Waschmittel und Energie. Deshalb kommen wir nur, wenn Sie es möchten.',
    accessLink:
      'Der QR-Code bzw. Link ist Ihr persönlicher Zugang — ohne PIN. Er gilt nur für diesen Aufenthalt und erlischt mit dem Check-out.',
    accessPinDeep:
      'QR-Code scannen und PIN eingeben — danach bleiben Sie angemeldet. Die PIN gilt bis zum Check-out.',
    accessPinManual:
      'Adresse öffnen, Zimmernummer und PIN eingeben — danach bleiben Sie angemeldet. Die PIN gilt bis zum Check-out.',
  },

  en: {
    langLabel: 'English',
    heading: 'How it works',
    sheet: {
      welcome: 'Welcome',
      room: 'Room',
      scan: 'Scan the QR code',
      pin: 'Your PIN',
      pinFromReception: 'You receive your PIN at check-in.',
      withoutQr: 'Without a QR code',
      keep: 'Please keep this slip — it is your access.',
    },
    buttons: {
      clean: { label: 'Clean my room', hint: 'Tap whenever you would like your room cleaned.' },
      dnd: { label: 'Do not disturb', hint: 'Nobody knocks, no cleaning.' },
      services: {
        label: 'Order a service',
        hint: 'Towels, repairs and more — reception sees it right away.',
      },
    },
    sustainabilityNeutral:
      'Every cleaning that isn’t needed saves water, detergent and energy — it is your choice in the portal.',
    footer: 'All details and current times are in the portal.',
    labels: {
      cleaning: 'Cleaning',
      sustainability: 'Sustainability',
      dnd: 'Quiet',
      services: 'Services',
      access: 'Access',
    },
    purpose:
      'The guest portal connects you to reception straight from your room — around the clock, without a phone call.',
    dnd: '“Do not disturb” in the portal keeps staff away from your room until you switch it off again.',
    services:
      'Ask for fresh towels, a repair or other services directly in the portal — reception sees your request immediately.',
    cleaningRoutine: due =>
      `Your room is cleaned daily from ${due} — you don’t have to request anything; on your day of departure after check-out. Would you like cleaning in between? Simply request it in the portal.`,
    cleaningOnRequest:
      'Your room is cleaned on request: please ask for cleaning in the portal whenever it suits you — without a request we leave your room untouched.',
    window: (start, end) => ` The portal accepts cleaning requests daily from ${start} to ${end}.`,
    defer: limit => ` You can also postpone cleaning until ${limit} at the latest — nobody will come before then.`,
    sustainabilityRoutine:
      'No cleaning needed today? One tap on “Do not disturb” saves water, detergent and energy — and spares you the interruption.',
    sustainabilityOnRequest:
      'Less cleaning, less consumption: every cleaning that isn’t needed saves water, detergent and energy. That is why we only come when you want us to.',
    accessLink:
      'The QR code or link is your personal access — no PIN needed. It is valid for this stay only and expires at check-out.',
    accessPinDeep:
      'Scan the QR code and enter the PIN — you stay signed in afterwards. The PIN is valid until check-out.',
    accessPinManual:
      'Open the address, enter your room number and PIN — you stay signed in afterwards. The PIN is valid until check-out.',
  },

  es: {
    langLabel: 'Español',
    heading: 'Cómo funciona',
    sheet: {
      welcome: 'Bienvenido',
      room: 'Habitación',
      scan: 'Escanee el código QR',
      pin: 'Su PIN',
      pinFromReception: 'Recibirá su PIN al hacer el check-in.',
      withoutQr: 'Sin código QR',
      keep: 'Conserve este papel: es su acceso.',
    },
    buttons: {
      clean: { label: 'Limpiar la habitación', hint: 'Pulse cuando desee que limpiemos su habitación.' },
      dnd: { label: 'No molestar', hint: 'Nadie llama a la puerta, no hay limpieza.' },
      services: {
        label: 'Pedir un servicio',
        hint: 'Toallas, reparaciones y más: recepción lo ve al instante.',
      },
    },
    sustainabilityNeutral:
      'Cada limpieza que no hace falta ahorra agua, detergente y energía: usted decide en el portal.',
    footer: 'Todos los datos y los horarios actuales están en el portal.',
    labels: {
      cleaning: 'Limpieza',
      sustainability: 'Sostenibilidad',
      dnd: 'Tranquilidad',
      services: 'Servicios',
      access: 'Acceso',
    },
    purpose:
      'El portal de huéspedes le conecta con recepción desde su propia habitación, las 24 horas y sin llamar por teléfono.',
    dnd: '«No molestar» en el portal mantiene al personal fuera de su habitación hasta que usted lo desactive.',
    services:
      'Pida toallas limpias, una reparación u otros servicios directamente en el portal: recepción ve su solicitud al instante.',
    cleaningRoutine: due =>
      `Su habitación se limpia a diario a partir de las ${due} — no tiene que solicitar nada; el día de salida, después del check-out. ¿Desea limpieza antes? Solicítela en el portal.`,
    cleaningOnRequest:
      'Su habitación se limpia cuando usted lo pide: solicite la limpieza en el portal cuando le venga bien — sin solicitud, no entramos en la habitación.',
    window: (start, end) => ` El portal admite solicitudes de limpieza a diario de ${start} a ${end}.`,
    defer: limit => ` También puede aplazar la limpieza hasta las ${limit} como máximo: antes no vendrá nadie.`,
    sustainabilityRoutine:
      '¿Hoy no necesita limpieza? Un toque en «No molestar» ahorra agua, detergente y energía, y a usted le evita la interrupción.',
    sustainabilityOnRequest:
      'Menos limpieza, menos consumo: cada limpieza que no hace falta ahorra agua, detergente y energía. Por eso solo vamos cuando usted lo desea.',
    accessLink:
      'El código QR o el enlace es su acceso personal, sin PIN. Solo es válido para esta estancia y caduca con el check-out.',
    accessPinDeep:
      'Escanee el código QR e introduzca el PIN; después permanecerá conectado. El PIN es válido hasta el check-out.',
    accessPinManual:
      'Abra la dirección, introduzca el número de habitación y el PIN; después permanecerá conectado. El PIN es válido hasta el check-out.',
  },

  fr: {
    langLabel: 'Français',
    heading: 'Comment ça marche',
    sheet: {
      welcome: 'Bienvenue',
      room: 'Chambre',
      scan: 'Scannez le QR code',
      pin: 'Votre code PIN',
      pinFromReception: 'Vous recevez votre code PIN à l’arrivée.',
      withoutQr: 'Sans QR code',
      keep: 'Conservez ce papier : c’est votre accès.',
    },
    buttons: {
      clean: { label: 'Nettoyer la chambre', hint: 'Appuyez quand vous souhaitez le ménage.' },
      dnd: { label: 'Ne pas déranger', hint: 'Personne ne frappe, pas de ménage.' },
      services: {
        label: 'Commander un service',
        hint: 'Serviettes, réparations et plus : la réception le voit aussitôt.',
      },
    },
    sustainabilityNeutral:
      'Chaque ménage inutile économise eau, lessive et énergie — c’est vous qui décidez sur le portail.',
    footer: 'Toutes les informations et les horaires actuels sont sur le portail.',
    labels: {
      cleaning: 'Ménage',
      sustainability: 'Durabilité',
      dnd: 'Tranquillité',
      services: 'Services',
      access: 'Accès',
    },
    purpose:
      'Le portail client vous met en relation avec la réception depuis votre chambre, 24 h/24 et sans appel téléphonique.',
    dnd: '« Ne pas déranger » sur le portail tient le personnel à l’écart de votre chambre jusqu’à ce que vous le désactiviez.',
    services:
      'Demandez des serviettes propres, une réparation ou d’autres services directement sur le portail — la réception voit votre demande immédiatement.',
    cleaningRoutine: due =>
      `Votre chambre est nettoyée chaque jour à partir de ${due} — vous n’avez rien à demander ; le jour du départ, après le check-out. Vous souhaitez un ménage entre-temps ? Demandez-le sur le portail.`,
    cleaningOnRequest:
      'Votre chambre est nettoyée à la demande : demandez le ménage sur le portail quand cela vous convient — sans demande, nous n’entrons pas dans la chambre.',
    window: (start, end) => ` Le portail accepte les demandes de ménage tous les jours de ${start} à ${end}.`,
    defer: limit => ` Vous pouvez aussi reporter le ménage jusqu’à ${limit} au plus tard : personne ne viendra avant.`,
    sustainabilityRoutine:
      'Pas besoin de ménage aujourd’hui ? Un appui sur « Ne pas déranger » économise eau, lessive et énergie — et vous évite le dérangement.',
    sustainabilityOnRequest:
      'Moins de ménage, moins de consommation : chaque ménage inutile économise de l’eau, de la lessive et de l’énergie. C’est pourquoi nous ne venons que si vous le souhaitez.',
    accessLink:
      'Le QR code ou le lien est votre accès personnel, sans code PIN. Il n’est valable que pour ce séjour et expire au check-out.',
    accessPinDeep:
      'Scannez le QR code et saisissez le code PIN — vous restez ensuite connecté. Le code PIN est valable jusqu’au check-out.',
    accessPinManual:
      'Ouvrez l’adresse, saisissez le numéro de chambre et le code PIN — vous restez ensuite connecté. Le code PIN est valable jusqu’au check-out.',
  },
}

function hhmm(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function buildGuestGuide(
  policies: Record<string, unknown>,
  opts: GuestGuideOptions,
  lang: GuideLang = DEFAULT_GUIDE_LANG,
): GuestGuide {
  const v = VORLAGEN[lang]
  const stayover = parseStayoverPolicy(policies)
  const window = parseCleaningWindow(policies)
  const defer = parseCleanDefer(policies)

  const zusatz =
    (window.enabled ? v.window(window.start, window.end) : '') +
    (defer.enabled ? v.defer(hhmm(defer.hour, defer.minute)) : '')

  // Genannt wird die Zeit, ab der die Routine WIRKLICH fällig wird — nie vor
  // der Check-out-Frist des Hauses (siehe `stayoverDueTime`).
  const due = stayoverDueTime(stayover)
  const cleaning = stayover.enabled
    ? `${v.cleaningRoutine(hhmm(due.hour, due.minute))}${zusatz}`
    : `${v.cleaningOnRequest}${zusatz}`

  const access =
    opts.accessMode === 'link'
      ? v.accessLink
      : opts.deepLink
        ? v.accessPinDeep
        : v.accessPinManual

  return {
    lang,
    langLabel: v.langLabel,
    heading: v.heading,
    purpose: v.purpose,
    cleaning,
    sustainability: stayover.enabled ? v.sustainabilityRoutine : v.sustainabilityOnRequest,
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
  return VORLAGEN[lang].sheet
}

/**
 * Name der Sprache in ihrer eigenen Sprache — für die Auswahl im Haus.
 * Absichtlich nicht übersetzt: „Français" findet auch, wer kein Deutsch kann.
 */
export function sheetLanguageLabel(lang: GuideLang): string {
  return VORLAGEN[lang].langLabel
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
 */
export function parseSheetLanguages(policies: Record<string, unknown>): GuideLang[] {
  const erste = alsSprache(policies.sheetLanguage) ?? SHEET_LANG_DEFAULT
  const roh = policies.sheetLanguage2
  const zweite =
    roh === undefined || roh === null ? SHEET_LANG2_DEFAULT : alsSprache(roh)

  return zweite && zweite !== erste ? [erste, zweite] : [erste]
}

export type GuestSheetOptions = GuestGuideOptions & {
  /**
   * Sprache, in der das PORTAL seine Knöpfe zeigt — heute immer die
   * Standardsprache, weil das Gastportal noch nicht übersetzt ist. Die
   * Beschriftungen der Legende folgen ihr, damit auf Papier dasselbe Wort
   * steht wie auf dem Bildschirm.
   */
  portalLang?: GuideLang
}

/** Ein Sprachblock des gedruckten Blattes. */
export function buildGuestSheet(
  policies: Record<string, unknown>,
  opts: GuestSheetOptions,
  lang: GuideLang = DEFAULT_GUIDE_LANG,
): GuestSheetText {
  const v = VORLAGEN[lang]
  const portal = VORLAGEN[opts.portalLang ?? DEFAULT_GUIDE_LANG]
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
    keep: v.sheet.keep,
    buttons: {
      clean: { label: portal.buttons.clean.label, hint: v.buttons.clean.hint },
      dnd: { label: portal.buttons.dnd.label, hint: v.buttons.dnd.hint },
      services: { label: portal.buttons.services.label, hint: v.buttons.services.hint },
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
