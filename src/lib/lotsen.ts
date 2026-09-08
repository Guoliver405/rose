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
 * Bewusst I/O-frei und ohne React: der Katalog ist Text und Reihenfolge, kein
 * Rendering. Was die Karte daraus macht, entscheidet `LotsePilot`.
 */

/**
 * Wer den Lotsen sehen darf. `alle` = jede Rolle mit Zugang zum Haus,
 * `verwaltung` = Inhaber und Manager. Der Wert entscheidet nur über die
 * Anzeige im Hilfe-Hub; die Seiten selbst halten über ihre Guards dicht.
 */
export type LotseZugang = 'alle' | 'verwaltung'

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
  title: string
  body: string
  /** Was der Nutzer hier selbst tun kann — steht abgesetzt unter dem Text. */
  tun?: string
  /**
   * Teil der Ersteinrichtung. Der Einrichtungs-Lotse fädelt nur diese
   * Schritte auf; die Fach-Lotsen zeigen alle. So bleibt der erste Durchlauf
   * kurz, ohne dass die Erklärungen dahinter fehlen.
   */
  kern?: boolean
}

export type Lotse = {
  id: string
  title: string
  subtitle: string
  zugang: LotseZugang
  steps: LotseStep[]
}

/** Reihenfolge der Fach-Lotsen in der Ersteinrichtung. */
export const EINRICHTUNG_ORDER = ['zimmer', 'regeln', 'gastzugang', 'personal', 'services'] as const

const UEBERSICHT: Lotse = {
  id: 'uebersicht',
  title: 'Die Zimmer-Übersicht',
  subtitle: 'Der Bildschirm der Rezeption: Farben lesen, Check-in, Check-out, Prioritäten',
  zugang: 'alle',
  steps: [
    {
      path: '', anchor: 'uebersicht.kpi',
      title: 'Das Lagebild in einer Zeile',
      body: 'Die Zahlen oben sind der Stand des Hauses auf einen Blick — belegt, bereit, zu reinigen, „Nicht stören", gerade in Arbeit. Sie aktualisieren sich von selbst, sobald ein Gast oder eine Reinigungskraft etwas ändert.',
    },
    {
      path: '', anchor: 'uebersicht.etage',
      title: 'Nach Etagen sortiert',
      body: 'Jede Etage ist ein Block, oberste zuerst. Ist eine Reinigungskraft gerade auf der Etage eingebucht, steht ihr Name im Kopf der Zeile — so sehen Sie, wo gearbeitet wird, ohne zu fragen.',
    },
    {
      path: '', anchor: 'uebersicht.kachel',
      title: 'Die Farbe ist der Zustand',
      body: 'Der Balken über der Nummer sagt alles: Grün = bereit, Blau = belegt, Amber = Reinigung gewünscht oder Routine fällig, Orange = ausgecheckt, Rosé = „Nicht stören". Violett und eine Flagge bedeuten priorisiert, ein rot blinkender Ring eine dringende Service-Anfrage. Die kleinen Symbole darunter nennen den Grund.',
      tun: 'Fahren Sie mit der Maus über eine Kachel — der Tooltip nennt den Zustand im Klartext.',
    },
    {
      path: '',
      title: 'Ein Klick öffnet das Zimmer',
      body: 'Im Dialog liegen Check-in und Check-out, die Gast-PIN zum Vorlesen, das Handout zum Drucken, das Abreisedatum, die Priorität und der Verlauf der letzten 30 Tage. Der Check-in ist ein Klick; das Abreisedatum ist freiwillig und lässt sich jederzeit nachtragen.',
      tun: 'Klicken Sie ruhig ein Zimmer an — der Lotse bleibt offen.',
    },
  ],
}

const ZIMMER: Lotse = {
  id: 'zimmer',
  title: 'Zimmer & Etagen',
  subtitle: 'Ganze Etagen auf einmal anlegen, Nummern korrigieren, Zimmer außer Betrieb nehmen',
  zugang: 'verwaltung',
  steps: [
    {
      path: '/zimmer', anchor: 'zimmer.anlegen', kern: true,
      title: 'Alles beginnt mit den Zimmern',
      body: 'Ohne Zimmer gibt es keinen Check-in, kein Reinigungsboard und keine QR-Aushänge. Hier legen Sie ganze Etagen auf einmal an — einzeln eintippen müssen Sie nichts.',
    },
    {
      path: '/zimmer', anchor: 'zimmer.modus', kern: true,
      title: 'Zwei Wege, viele Zimmer anzulegen',
      body: '„Etagen individuell" legt die eingegebenen Nummern auf genau einer Etage an — richtig, wenn jede Etage anders aussieht. „Etagen identisch" wiederholt denselben Nummernkreis auf mehreren Etagen.',
    },
    {
      path: '/zimmer', anchor: 'zimmer.bereich',
      title: 'Gebäudeteil und Etage',
      body: 'Der Gebäudeteil ist freiwillig und nur für Häuser gedacht, die wirklich getrennte Trakte haben. Er wirkt aber auf die Eindeutigkeit: Zimmernummern müssen nur je Gebäudeteil eindeutig sein — die „101" darf es im Haupthaus und im Nebenhaus geben.',
    },
    {
      path: '/zimmer', anchor: 'zimmer.nummern', kern: true,
      title: 'Nummern als Liste oder als Bereich',
      body: '„101-110" legt zehn Zimmer an, „201, 202, 205" genau drei. Führende Nullen bleiben erhalten — aus „01-10" wird 01 bis 10, nicht 1 bis 10.',
      tun: 'Tippen Sie einen Bereich ein: Unter dem Feld steht sofort, welche Zimmer daraus entstehen.',
    },
    {
      path: '/zimmer', anchor: 'zimmer.praefix',
      title: 'Etagennummer voranstellen',
      body: 'Wer auf jeder Etage denselben Nummernkreis nutzt, braucht dieses Häkchen: Aus Etage 2 und „05" wird „205". Ohne das Häkchen kollidieren die Nummern, und nur die erste Etage entstünde — die Seite warnt vorher.',
    },
    {
      path: '/zimmer', anchor: 'zimmer.absenden',
      title: 'Erst die Vorschau, dann der Klick',
      body: 'Über dem Knopf steht, wie viele Zimmer entstehen und wie sie heißen werden. Geschrieben wird erst beim Klick — Sie können vorher beliebig ausprobieren.',
    },
    {
      path: '/zimmer', anchor: 'zimmer.bestand', kern: true,
      title: 'Verschrieben? Kein Problem',
      body: 'Zimmer, Etage und Gebäudeteil lassen sich anklicken — der Dialog bietet überall dasselbe: bearbeiten, außer Betrieb nehmen, löschen. Bearbeiten ändert Nummer, Etage und Gebäudeteil, ohne dass Verlauf oder Arbeitsnachweise verloren gehen; „außer Betrieb" ist der schonende Weg für Renovierungen. Gelöscht wird erst nach einer bezifferten Warnung.',
    },
  ],
}

const REGELN: Lotse = {
  id: 'regeln',
  title: 'Hotel & Regeln',
  subtitle: 'Zeitzone, Routine-Reinigung, Check-out-Frist, PIN-Länge — die Regeln des Hauses',
  zugang: 'verwaltung',
  steps: [
    {
      path: '/einstellungen/hotel', anchor: 'regeln.zeitzone', kern: true,
      title: 'Zeitzone zuerst',
      body: 'Alle Uhrzeiten dieser Seite gelten in dieser Zeitzone — und die Server laufen in UTC. Steht hier das Falsche, wird eine Routine „ab 10:00" in Wahrheit erst um 12:00 fällig, und auch die Tagesgrenzen der Auswertung liegen daneben.',
    },
    {
      path: '/einstellungen/hotel', anchor: 'regeln.routine', kern: true,
      title: 'Reinigung nur auf Wunsch — oder täglich',
      body: 'Ab Werk ist die Routine aus: Gereinigt wird, wenn der Gast es wünscht oder das Zimmer ausgecheckt ist. Das spart Wasser, Waschmittel und Arbeitszeit. Schalten Sie sie ein, erscheinen belegte Zimmer ab der zweiten Nacht ab der gewählten Uhrzeit von selbst auf dem Reinigungsboard.',
    },
    {
      path: '/einstellungen/hotel', anchor: 'regeln.checkout', kern: true,
      title: '„Check-out bis" ist die Untergrenze der Routine',
      body: 'RoSe kennt kein Buchungssystem und weiß nicht, wer heute abreist. Deshalb wird die Routine nie vor dieser Zeit fällig: Wer danach noch im Zimmer ist, bleibt. Sonst würde ein Abreisezimmer vor dem Check-out gereinigt — und danach gleich noch einmal.',
    },
    {
      path: '/einstellungen/hotel', anchor: 'regeln.aufschub',
      title: '„Frühestens ab" — der Gast schiebt auf',
      body: 'Der Gast wünscht Reinigung, aber nicht vor einer Uhrzeit, weil er ausschlafen will. Bis dahin gilt das Zimmer auf dem Board als nicht offen. Wählen Sie die Grenze so, dass die Reinigung danach noch in die Schicht fällt: Housekeeping bis 15:00 heißt 13:00.',
    },
    {
      path: '/einstellungen/hotel', anchor: 'regeln.fenster',
      title: 'Reinigungswunsch nur zu festen Zeiten',
      body: 'Außerhalb des Fensters kann der Gast keinen Wunsch mehr absetzen und sieht stattdessen Ihre Reinigungszeiten. „Nicht stören" und das Zurücknehmen eines Wunsches bleiben immer möglich — sonst säße jemand mit einem Wunsch fest, den er nicht mehr los wird.',
    },
    {
      path: '/einstellungen/hotel', anchor: 'regeln.pin',
      title: 'PIN-Länge und verwaiste Reinigungen',
      body: 'Die PIN-Länge gilt für neu erzeugte Gast-PINs; laufende Aufenthalte behalten ihre. Der zweite Wert räumt vergessene Abschlüsse auf: Wird eine gestartete Reinigung nicht abgeschlossen, geht das Zimmer nach dieser Zeit von selbst wieder auf offen — und der Verlauf hält fest, dass das Zeitlimit gerissen ist.',
    },
    {
      path: '/einstellungen/hotel', anchor: 'regeln.adresse',
      title: 'Die Adresse Ihres Hauses',
      body: 'Unter dieser Adresse melden sich Gäste und Reinigungskräfte an. Sie steht in beiden Anmeldungen, weil Zimmernummern und Benutzernamen nur innerhalb des Hauses eindeutig sind. Gedruckte QR-Codes bleiben bei einer Änderung gültig — nur abgetippte Adressen auf älteren Handouts stimmen dann nicht mehr.',
    },
    {
      path: '/einstellungen/hotel', anchor: 'regeln.speichern', kern: true,
      title: 'Speichern nicht vergessen',
      body: 'Die Regeln gelten ab dem Speichern für alles Weitere. Laufende Aufenthalte und bereits gesetzte Wünsche laufen unverändert weiter.',
    },
  ],
}

const GASTZUGANG: Lotse = {
  id: 'gastzugang',
  title: 'Gäste-Zugang',
  subtitle: 'Fester Zimmer-QR mit PIN oder individueller Zugang je Aufenthalt — samt Aushängen',
  zugang: 'verwaltung',
  steps: [
    {
      path: '/einstellungen/gastzugang', anchor: 'gastzugang.wahl', kern: true,
      title: 'Zwei Wege ins Gäste-Portal',
      body: 'Beim festen Zimmer-QR klebt ein einmal gedruckter Code im Zimmer, und jeder Aufenthalt bekommt seine eigene PIN — zwei Faktoren. Beim individuellen Zugang entsteht je Aufenthalt ein eigener Link ohne PIN, der mit dem Check-out erlischt: bequemer, aber wer den Zettel sieht, ist drin.',
    },
    {
      path: '/einstellungen/gastzugang', anchor: 'gastzugang.speichern', kern: true,
      title: 'Ein Wechsel ist folgenlos für laufende Aufenthalte',
      body: 'Das Verfahren wird beim Check-in am Aufenthalt festgehalten, nicht bei jedem Zugriff neu gelesen. Ausgegebene Zugänge funktionieren deshalb bis zum Check-out weiter; erst der nächste Check-in folgt dem neuen Verfahren. Kein Stichtag, keine Umstellung von Bestandsdaten.',
    },
    {
      path: '/einstellungen/gastzugang', anchor: 'gastzugang.aushang',
      title: 'Die Aushänge für die Zimmer',
      body: 'Im PIN-Verfahren braucht jedes Zimmer seinen Aushang — eine Karte je Zimmer, einmal gedruckt, dauerhaft gültig. Im Verfahren mit individuellem Zugang sind die Aushänge ausgeblendet: Sie führten auf eine PIN-Eingabe, die dort niemand bedienen kann.',
    },
  ],
}

const PERSONAL: Lotse = {
  id: 'personal',
  title: 'Personal',
  subtitle: 'Reinigung, Rezeption und Manager — anlegen, Zugang beenden, Login-Karten drucken',
  zugang: 'verwaltung',
  steps: [
    {
      path: '/personal', anchor: 'personal.reinigung', kern: true,
      title: 'Reinigungskräfte brauchen keine E-Mail',
      body: 'Eine Reinigungskraft bekommt Benutzernamen und PIN — mehr nicht. Beides gilt nur in diesem Haus; dieselbe Namensvetterin darf es in einem anderen Haus noch einmal geben.',
    },
    {
      path: '/personal', anchor: 'personal.liste', kern: true,
      title: 'Zugang beenden statt löschen',
      body: 'Scheidet jemand aus, beenden Sie den Zugang: Die Anmeldung ist sofort tot, auch eine offene Sitzung fliegt heraus, und der Arbeitsnachweis bleibt vollständig. Kommt die Person zurück, wird der Zugang wieder aktiviert — die Login-Karte gilt weiter. Endgültiges Löschen gibt es auch, aber es nimmt bei der Reinigung die Stiche mit; der Dialog beziffert vorher, was verschwindet.',
    },
    {
      path: '/personal', anchor: 'personal.karte',
      title: 'Login-Karten mit QR',
      body: 'Statt PIN-Eingabe kann sich die Reinigung über eine gedruckte Karte anmelden — einmal scannen, drin. Eine neu ausgegebene Karte macht die alte ungültig; genau das ist der Weg, wenn eine Karte abhandenkommt.',
    },
    {
      path: '/personal', anchor: 'personal.rezeption',
      title: 'Rezeptions-Zugänge',
      body: 'Die Rezeption macht das Tagesgeschäft: Check-in und Check-out, Prioritäten, Bestellungen, Handouts und Karten drucken. Einstellungen, Zimmer-Setup, Services und Personalverwaltung bleiben ihr verschlossen.',
    },
    {
      path: '/personal', anchor: 'personal.manager',
      title: 'Manager — nur der Kontoinhaber',
      body: 'Ein Manager hat im Haus dieselben Rechte wie Sie, aber keinen Zugriff auf Konto und Abrechnung. Wer über mehrere Häuser eingesetzt wird, wird je Haus eingetragen — ab dem zweiten Mal ohne neuen Zugang. Entfernen wirkt immer nur auf dieses eine Haus.',
    },
  ],
}

const SERVICES: Lotse = {
  id: 'services',
  title: 'Zusatzleistungen',
  subtitle: 'Der Service-Baukasten: was Gäste im Portal bestellen können',
  zugang: 'verwaltung',
  steps: [
    {
      path: '/services', anchor: 'services.anlegen', kern: true,
      title: 'Ein Service ist ein Baukasten',
      body: 'Oben steht der Service — „Wäscheservice", „Technischer Dienst" —, darunter hängen die Optionen, die der Gast auswählt. Der Haken „dringend" ist der einzige Unterschied im Ablauf: Eine dringende Anfrage lässt die Glocke auf der Zimmer-Kachel und die Zahl in der Navigation rot blinken.',
    },
    {
      path: '/services', anchor: 'services.beispiele',
      title: 'Mit Beispielen anfangen',
      body: 'Solange noch kein Service angelegt ist, können Sie zwei fertige übernehmen und anpassen. Das sind ganz normale Services — umbenennen, ergänzen oder archivieren ist jederzeit möglich.',
    },
    {
      path: '/services', anchor: 'services.liste', kern: true,
      title: 'Preise sind Anzeige, keine Abrechnung',
      body: 'Optionen dürfen einen Preis tragen; der Gast sieht ihn bei der Bestellung. RoSe rechnet damit nicht ab und bucht nichts — die Anfrage landet auf dem Services-Board der Rezeption und wird dort auf „erledigt" gesetzt.',
    },
  ],
}

/** Die Fach-Lotsen in der Reihenfolge des Hubs. */
export const LOTSEN: Lotse[] = [UEBERSICHT, ZIMMER, REGELN, GASTZUGANG, PERSONAL, SERVICES]

/**
 * Der Einrichtungs-Lotse ist kein eigener Text, sondern die Kernschritte der
 * Fach-Lotsen in Reihenfolge, gerahmt von Begrüßung und Abschluss. So kann
 * dieselbe Erklärung nicht an zwei Stellen auseinanderlaufen.
 */
export const EINRICHTUNG: Lotse = {
  id: 'einrichtung',
  title: 'Erste Einrichtung',
  subtitle: 'Der geführte Weg vom leeren Haus bis zum ersten Check-in',
  zugang: 'verwaltung',
  steps: [
    {
      path: '/zimmer',
      title: 'Willkommen bei RoSe',
      body: 'In den nächsten Minuten richten wir Ihr Haus ein: Zimmer, die Regeln des Hauses, der Weg Ihrer Gäste ins Portal, das Personal und die Zusatzleistungen. Sie können jederzeit abbrechen und später weitermachen — der Fortschritt ergibt sich aus dem, was tatsächlich angelegt ist, nicht aus Häkchen.',
      tun: 'Weiter mit der Eingabetaste oder dem Pfeil nach rechts, beenden mit Esc.',
    },
    ...EINRICHTUNG_ORDER.flatMap(id => {
      const lotse = LOTSEN.find(l => l.id === id)
      if (!lotse) throw new Error(`Unbekannter Lotse in EINRICHTUNG_ORDER: ${id}`)
      return lotse.steps.filter(s => s.kern)
    }),
    {
      path: '/hilfe', anchor: 'hilfe.katalog',
      title: 'Geschafft — und hier geht es weiter',
      body: 'Ihr Haus ist eingerichtet. Unter „Hilfe" finden Sie jederzeit alle Lotsen wieder, dazu eine Übersicht, was noch fehlt. Jeder Lotse lässt sich einzeln starten, so oft Sie wollen.',
    },
  ],
}

/**
 * Wohin ein frisch registriertes Konto geführt wird: der erste Schritt der
 * Einrichtung. Als Funktion, damit Registrierung, Zahlungsweg-Seite und
 * Hilfe-Hub nicht drei Varianten derselben URL zusammenbauen.
 */
export function einrichtungStart(slug: string): string {
  return `/h/${slug}/admin${EINRICHTUNG.steps[0].path}?lotse=${EINRICHTUNG.id}&schritt=0`
}

/** Alle Lotsen, die es gibt — Fach-Lotsen plus Einrichtung. */
export const ALLE_LOTSEN: Lotse[] = [EINRICHTUNG, ...LOTSEN]

export function lotseById(id: string): Lotse | null {
  return ALLE_LOTSEN.find(l => l.id === id) ?? null
}

/** Fach-Lotsen, die eine Rolle im Hub sehen darf. */
export function lotsenFuer(istVerwaltung: boolean): Lotse[] {
  return LOTSEN.filter(l => istVerwaltung || l.zugang === 'alle')
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

export function setupProgress(facts: SetupFacts): SetupProgress {
  const items: SetupItem[] = [
    {
      id: 'zimmer',
      label: 'Zimmer angelegt',
      hint: facts.rooms > 0
        ? `${facts.rooms} Zimmer in Betrieb`
        : 'Ohne Zimmer gibt es keinen Check-in und kein Reinigungsboard',
      done: facts.rooms > 0,
      path: '/zimmer', lotse: 'zimmer',
    },
    {
      id: 'regeln',
      label: 'Regeln des Hauses geprüft',
      hint: facts.timeZoneChosen
        ? 'Zeitzone gesetzt — Routine, Check-out-Frist und Auswertung rechnen richtig'
        : 'Vor allem die Zeitzone: ohne sie liegen alle Uhrzeiten um Stunden daneben',
      done: facts.timeZoneChosen,
      path: '/einstellungen/hotel', lotse: 'regeln',
    },
    {
      id: 'gastzugang',
      label: 'Gäste-Zugang gewählt',
      hint: facts.guestAccessChosen
        ? 'Das Verfahren steht — jeder Check-in hält es am Aufenthalt fest'
        : 'Fester Zimmer-QR mit PIN oder individueller Zugang je Aufenthalt',
      done: facts.guestAccessChosen,
      path: '/einstellungen/gastzugang', lotse: 'gastzugang',
    },
    {
      id: 'personal',
      label: 'Reinigungskraft angelegt',
      hint: facts.maids > 0
        ? `${facts.maids === 1 ? 'Ein Zugang' : `${facts.maids} Zugänge`} für die Reinigung`
        : 'Ohne Zugang kommt niemand auf das Reinigungsboard',
      done: facts.maids > 0,
      path: '/personal', lotse: 'personal',
    },
    {
      id: 'services',
      label: 'Zusatzleistungen eingerichtet',
      hint: facts.services > 0
        ? `${facts.services === 1 ? 'Ein Service' : `${facts.services} Services`} im Baukasten`
        : 'Freiwillig — ohne Services zeigt das Gastportal nur Reinigung und „Nicht stören"',
      done: facts.services > 0,
      path: '/services', lotse: 'services',
      optional: true,
    },
    {
      id: 'checkin',
      label: 'Erster Check-in',
      hint: facts.stays > 0
        ? 'Der Ablauf ist einmal durchlaufen'
        : 'Ein Klick auf ein Zimmer, dann „Check-in" — die PIN steht sofort am Bildschirm',
      done: facts.stays > 0,
      path: '', lotse: 'uebersicht',
    },
  ]

  if (facts.paymentMethod !== null) {
    items.push({
      id: 'zahlungsweg',
      label: 'Zahlungsweg hinterlegt',
      hint: facts.paymentMethod
        ? 'Rechnungsdaten und Zahlungsweg stehen'
        : 'Der erste Monat ist frei — hinterlegen können Sie den Weg jederzeit',
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
