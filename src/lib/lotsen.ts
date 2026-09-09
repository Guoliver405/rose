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
  id: string
  title: string
  subtitle: string
  zugang: LotseZugang
  /** Fehlt der Wert, läuft der Lotse im Haus. */
  bereich?: LotseBereich
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
    {
      path: '',
      title: 'Beim Check-out steht der Betrag',
      body: 'Hat der Gast kostenpflichtige Leistungen bestellt, zeigt der Dialog schon vor der Bestätigung hervorgehoben, was zu kassieren ist — mit „Details" als druckbare Aufstellung: Zimmer, Zeitraum, Posten mit Zeitpunkten, Summe. Kein Gastname, keine Rechnung. Wurde nichts Kostenpflichtiges bestellt, steht dort nur ein Hinweis, und Sie checken aus wie bisher.',
      tun: 'Offene Anfragen schließt der Check-out als „nicht erbracht" — was tatsächlich erbracht wurde, haken Sie vorher im selben Kasten ab. Später kommen Sie über den Verlauf des Zimmers wieder an die Aufstellung: Der Eintrag „Check-out" trägt den Link.',
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
      title: 'Preise landen beim Check-out auf der Aufstellung',
      body: 'Optionen dürfen einen Preis tragen; der Gast sieht ihn bei der Bestellung. Beim Check-out zeigt der Zimmer-Dialog die Summe der erbrachten Leistungen — deshalb lohnt es sich, die Preise gleich hier zu pflegen. Was keinen Preis trägt (etwa der technische Dienst), taucht auf keiner Aufstellung auf. RoSe bucht und kassiert nichts, es rechnet nur zusammen.',
      tun: 'Tragen Sie bei einer Option einen Preis ein — ab der nächsten Bestellung steht sie damit beim Check-out auf dem Blatt.',
    },
  ],
}

const ANFRAGEN: Lotse = {
  id: 'anfragen',
  title: 'Service-Anfragen',
  subtitle: 'Das Board der Rezeption: was Gäste bestellt haben und wie es abgehakt wird',
  zugang: 'alle',
  steps: [
    {
      path: '/bestellungen', anchor: 'anfragen.zaehler',
      title: 'Alles, was Gäste bestellt haben',
      body: 'Hier laufen die Anfragen aus den Gäste-Portalen auf. Dieselbe Zahl steht als Abzeichen an „Services" in der Navigation — sie blinkt rot, sobald mindestens eine Anfrage einen dringenden Service betrifft, und die betroffene Zimmer-Kachel bekommt eine Glocke.',
    },
    {
      path: '/bestellungen', anchor: 'anfragen.liste',
      title: 'Was eine Anfrage mitbringt',
      body: 'Zimmernummer, Service, die gewählten Optionen samt Preis, eine freie Anmerkung des Gastes und das Alter der Anfrage. Neue Anfragen erscheinen von selbst — die Seite wird über dieselbe Live-Verbindung aktualisiert wie die Boards.',
    },
    {
      path: '/bestellungen', anchor: 'anfragen.erledigt',
      title: 'Der Haken entscheidet über den Betrag',
      body: 'Eine Anfrage ist offen oder abgeschlossen; es gibt kein „in Bearbeitung" und keine Zuweisung. Beim Abschluss zählt der Unterschied: „Erledigt" heißt erbracht — und erscheint mit Betrag auf der Aufstellung beim Check-out. Was bis dahin offen bleibt, schließt RoSe als „nicht erbracht": gekennzeichnet, aber nicht berechnet. Deshalb lohnt sich das Abhaken hier direkt nach der Leistung.',
      tun: 'Haken Sie eine erledigte Anfrage gleich ab — sonst fehlt sie am Ende in der Summe.',
    },
    {
      path: '/bestellungen', anchor: 'anfragen.verlauf',
      title: 'Abgeschlossenes bleibt nachvollziehbar',
      body: 'Abgeschlossene Anfragen rutschen in die eingeklappte Liste darunter, mit Zeitpunkt und Namen; nicht erbrachte tragen dort ein Kennzeichen. Sie tauchen außerdem im Verlauf des Zimmers auf — praktisch, wenn ein Gast später nachfragt, ob sein Wunsch angekommen ist.',
    },
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
  title: 'Aushänge & Handouts',
  subtitle: 'Was gedruckt wird: Zimmer-Aushang, Check-in-Handout, Login-Karte — und wie lange es gilt',
  zugang: 'alle',
  steps: [
    {
      path: '/zimmer/aushang', anchor: 'aushang.karte',
      title: 'Ein Aushang je Zimmer',
      body: 'Die Karte hängt im Zimmer: QR-Code, Zimmernummer, Hausname. Der Gast scannt sie und tippt nur noch seine PIN. Der Code gehört zum Zimmer, nicht zum Aufenthalt — er bleibt über alle Gäste hinweg gültig und wird genau einmal gedruckt.',
    },
    {
      path: '/zimmer/aushang', anchor: 'aushang.knopf',
      title: 'Erst erzeugen, dann drucken',
      body: 'Zimmer ohne Code sammeln sich hier: Der Knopf erzeugt die fehlenden auf einmal. Sind alle da, wird er zum Druck-Knopf — eine Seite je Karte, damit man sie einzeln aufhängen kann. Neu angelegte Zimmer brauchen also einen zweiten Durchgang.',
    },
    {
      path: '/zimmer/aushang', anchor: 'aushang.erneuern',
      title: 'Erneuern macht den alten Aushang ungültig',
      body: 'Kommt eine Karte abhanden oder soll ein Code aus anderem Grund weg, erzeugt „Code erneuern" einen neuen — und der alte Aushang funktioniert ab dann nicht mehr. Deshalb liegt das nur bei Inhaber und Manager, und deshalb betrifft es immer nur ein Zimmer.',
    },
    {
      path: '/zimmer/aushang', anchor: 'aushang.hinweis',
      title: 'Nur im Verfahren mit festem Zimmer-QR',
      body: 'Nutzt Ihr Haus individuelle Zugänge je Aufenthalt, führen diese Aushänge auf eine PIN-Eingabe, die neue Gäste gar nicht bedienen können — dann gehören sie nicht ins Zimmer. Die Seite sagt das oben ausdrücklich, statt sich einfach zu sperren.',
    },
    {
      path: '', anchor: 'uebersicht.kachel',
      title: 'Das Handout entsteht beim Check-in',
      body: 'Anders als der Aushang gehört es zu genau einem Aufenthalt. Sie finden es im Zimmer-Dialog, sobald eingecheckt ist: ein Blatt mit PIN, QR-Code und einer Kurzanleitung, die sich nach den Regeln Ihres Hauses richtet — steht die Routine-Reinigung an, sagt der Text das, sonst bittet er darum, die Reinigung im Portal anzufordern. Wahlweise geht dasselbe als E-Mail; die Adresse wird dabei nicht gespeichert.',
      tun: 'Klicken Sie ein belegtes Zimmer an — der Weg zum Handout liegt im Dialog.',
    },
    {
      path: '/personal', anchor: 'aushang.login',
      title: 'Login-Karten für die Reinigung',
      body: 'Die dritte Drucksache: eine Karte je Reinigungskraft, mit der sie sich ohne Tippen am Board anmeldet. Eine neu ausgegebene Karte macht die alte ungültig — genau der Weg, wenn eine verloren geht. Die Karte überlebt ein „Zugang beenden" und gilt nach einer Reaktivierung wieder.',
    },
  ],
}

const AUSWERTUNG: Lotse = {
  id: 'auswertung',
  title: 'Auswertung',
  subtitle: 'Arbeitszeiten aus den Stichen, Auffälligkeiten und wann Gäste Reinigung wünschen',
  zugang: 'verwaltung',
  steps: [
    {
      path: '/auswertung', anchor: 'auswertung.zeitraum',
      title: 'Der Zeitraum steht in der Adresse',
      body: 'Von–bis als ganz normales Formular, das den Zeitraum in die URL schreibt. Dadurch lässt sich ein Stand verlinken, weiterschicken und drucken — und beim Drucken fällt das Formular selbst weg.',
    },
    {
      path: '/auswertung', anchor: 'auswertung.kennzahlen',
      title: 'Alles gerechnet, nichts gespeichert',
      body: 'Die Zahlen entstehen aus den Stichen der Reinigungskräfte: Schichtbeginn und -ende, Pause, sonstige Reinigung, Start und Abschluss je Zimmer. „Netto-Arbeitszeit" ist die Schicht ohne Pause, „Übrige Zeit" das, was weder Zimmer- noch sonstige Reinigung war — Wege und Rüstzeit.',
    },
    {
      path: '/auswertung', anchor: 'auswertung.auffaellig',
      title: 'Unplausibles fliegt aus den Summen',
      body: 'Eine Schicht über 16 Stunden ist ein vergessenes Schichtende, eine Pause über vier Stunden dasselbe, und eine Reinigung ohne Abschluss zählt nicht als geleistete Arbeit. Solche Fälle werden hier gezählt statt eingerechnet — sonst schleppte eine offene Schicht die Arbeitszeit tagelang mit und machte die ganze Auswertung unbrauchbar.',
    },
    {
      path: '/auswertung', anchor: 'auswertung.tabelle',
      title: 'Je Kraft — auch ausgeschiedene',
      body: 'Wer den Zugang beendet hat, bleibt in der Auswertung sichtbar; der Arbeitsnachweis überlebt das Ausscheiden. Ein Klick auf den Namen öffnet das Tagesprotokoll mit den einzelnen Stichen.',
    },
    {
      path: '/auswertung', anchor: 'auswertung.nachfrage',
      title: 'Wann die Arbeit anfällt',
      body: 'Der zweite Teil beantwortet eine Planungsfrage: Zu welchen Stunden wünschen Gäste Reinigung, wann wird ausgecheckt — und wie viele Kräfte waren dann im Dienst? Die Kennzahl „Wünsche ohne Kraft im Dienst" ist der eigentliche Hinweis. Deshalb fragt RoSe Gäste auch nicht nach Wunschzeiten: Die Daten liegen schon vor.',
    },
  ],
}

const KONTO: Lotse = {
  id: 'konto',
  title: 'Plan & Abrechnung',
  subtitle: 'Was das Konto kostet, wie gezählt wird und wo Zahlungsweg und Rechnungen liegen',
  zugang: 'inhaber',
  bereich: 'konto',
  steps: [
    {
      path: '/abrechnung', anchor: 'konto.plan',
      title: 'Ein Preis, keine Pakete',
      body: 'Abgerechnet wird je Zimmer und Kalendermonat, mit einem Mindestbetrag je Konto — nicht je Haus. Eine Kette zahlt also die Summe ihrer Zimmer und nicht dreimal das Minimum. Alle Funktionen sind enthalten; es gibt nichts, worauf Sie später hochstufen müssten.',
    },
    {
      path: '/abrechnung', anchor: 'konto.laufend',
      title: 'Gezählt wird großzügig, aber eindeutig',
      body: 'Ein Zimmer zählt für den Monat, sobald es darin auch nur vorübergehend in Betrieb war — heute außer Betrieb genommen zählt noch mit, heute angelegt ebenfalls. Die Zahl steht deshalb erst mit dem Monatsende fest, und der laufende Monat ist immer eine Vorschau.',
    },
    {
      path: '/abrechnung', anchor: 'konto.monate',
      title: 'Abgeschlossene Monate liegen fest',
      body: 'Sobald ein Monat vorbei ist, ändert sich sein Betrag nicht mehr — auch dann nicht, wenn Sie später Zimmer löschen: Vor jeder Löschung wird die Zimmerzahl der betroffenen Monate festgeschrieben. Solange nichts gelöscht wird, entsteht dafür keine einzige Zeile.',
    },
    {
      path: '/abrechnung', anchor: 'konto.zahlungsweg',
      title: 'Zahlungsweg und Rechnungsdaten',
      body: 'Karte oder SEPA-Lastschrift werden ohne Belastung hinterlegt und beim Monatslauf eingezogen; wer auf Rechnung zahlen will, bekommt eine Überweisung mit eigener Bankverbindung. Rechnungsempfänger, Anschrift und — außerhalb Deutschlands innerhalb der EU — die USt-IdNr. sind Pflicht, weil sonst die Steuer nicht richtig gerechnet werden kann.',
    },
    {
      path: '/abrechnung', anchor: 'konto.rechnungen',
      title: 'Rechnungen kommen am Monatsersten',
      body: 'Für den Vormonat, elektronisch, zahlbar innerhalb von 14 Tagen. Jede Rechnung ist hier als PDF und als Ansichtsseite hinterlegt und bleibt es auch dann, wenn Sie das Konto später löschen — Belege müssen aufbewahrt werden.',
    },
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
  gast: ['zugang', 'portal', 'aufschub', 'gewuenscht', 'dnd', 'services', 'bestellt'],
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
  title: 'Das Reinigungsboard',
  subtitle: 'Nachgebaut: Anmeldung, Schicht, Etagen, Slider — was die Reinigungskraft am Handy sieht',
  zugang: 'alle',
  steps: [
    {
      path: '/hilfe/reinigung', anchor: 'reinigung.login', sim: 'login',
      title: 'Anmeldung ohne E-Mail',
      body: 'Eine Reinigungskraft hat Benutzernamen und PIN — oder scannt ihre gedruckte Login-Karte und ist sofort drin. Beides gilt nur in diesem Haus; dieselbe Namensvetterin darf es anderswo noch einmal geben.',
    },
    {
      path: '/hilfe/reinigung', anchor: 'reinigung.schicht', sim: 'schicht',
      title: 'Erst Schichtbeginn, dann Arbeit',
      body: 'Ohne begonnene Schicht lässt sich keine Reinigung starten. Der Schichtbeginn ist zugleich der erste Stich im Arbeitsnachweis — aus diesen Stichen rechnet die Auswertung später Arbeits-, Pausen- und Reinigungszeiten.',
      tun: 'Ziehen Sie den Slider ganz durch — er löst erst bei 97 % der Bahn aus.',
    },
    {
      path: '/hilfe/reinigung', anchor: 'reinigung.etagen', sim: 'etagen',
      title: 'Etagen statt einer langen Liste',
      body: 'Nach dem Schichtbeginn kommt zuerst die Etagen-Ebene, in fester Reihenfolge wie in der Rezeption. Jede Zeile sagt, wie viel dort offen ist, ob eine Priorität wartet und wer schon vor Ort arbeitet.',
    },
    {
      path: '/hilfe/reinigung', anchor: 'reinigung.naechstes', sim: 'etagen',
      title: '„Als Nächstes" ist eine Empfehlung, keine Zuweisung',
      body: 'Genau eine Etage trägt das Abzeichen: die höchste noch offene Dringlichkeit, geteilt durch die Zahl der Kräfte vor Ort plus eins. Wo schon jemand arbeitet, lohnt der Weg weniger. Etagen ohne offene Arbeit fallen heraus, bei Gleichstand gewinnt die untere — damit die Empfehlung nicht hin und her springt.',
    },
    {
      path: '/hilfe/reinigung', anchor: 'reinigung.kacheln', sim: 'zimmer',
      title: 'Eine Etage wählen heißt einbuchen',
      body: 'Die Kollegin steht ab jetzt sichtbar auf dieser Etage — in der Rezeptions-Übersicht und für alle anderen Kräfte. Ausgegraute Zimmer sind nicht gesperrt, sondern nur ohne Auftrag: unbelegt, „Nicht stören", oder ein Wunsch, der erst später gilt.',
    },
    {
      path: '/hilfe/reinigung', anchor: 'reinigung.starten', sim: 'dialog',
      title: 'Starten per Slider, nicht per Knopf',
      body: 'Ein Tipp auf die Kachel öffnet das Zimmer. Gestartet wird mit einem Zug, der am Griff beginnen und die Bahn fast ganz zurücklegen muss — ein Handy in der Schürzentasche soll keine Reinigung auslösen.',
    },
    {
      path: '/hilfe/reinigung', anchor: 'reinigung.abschliessen', sim: 'reinigung',
      title: 'Abschließen — und was passiert, wenn es jemand vergisst',
      body: 'Zwischen Start und Abschluss steht das Zimmer für alle als „in Arbeit". Wird der Abschluss vergessen, geht das Zimmer nach der eingestellten Zeit von selbst wieder auf offen, und der Verlauf hält fest, dass das Zeitlimit gerissen ist — statt dass ein halber Vorgang für immer stehen bleibt.',
    },
    {
      path: '/hilfe/reinigung', anchor: 'reinigung.status', sim: 'status',
      title: 'Pause, sonstige Reinigung, Schichtende',
      body: 'Alle Zustandswechsel liegen auf einer eigenen Seite, nicht auf dem Board — am Handy greift so die Zurück-Taste. Pause und sonstige Reinigung sind Zeiträume innerhalb der Schicht und dürfen sich mit nichts überschneiden; das Schichtende beendet beides. Darunter steht die Tagesbilanz der Kraft.',
    },
    {
      path: '/hilfe/reinigung', anchor: 'reinigung.verlassen', sim: 'zimmer',
      title: 'Die Etage verlässt man bewusst',
      body: 'Auch der Rückweg ist ein Slider, und zwar von rechts nach links. Ein Fehltipper soll niemanden aus der Etage werfen — das würde die Verortung für die Kolleginnen falsch machen.',
    },
  ],
}

const GAST: Lotse = {
  id: 'gast',
  title: 'Was der Gast sieht',
  subtitle: 'Nachgebaut: das Gäste-Portal am Handy — Reinigung, „frühestens ab", Nicht stören, Services',
  zugang: 'alle',
  steps: [
    {
      path: '/hilfe/gast', anchor: 'gast.zugang', sim: 'zugang',
      title: 'Kein Konto, keine App',
      body: 'Der Gast scannt den QR-Aushang im Zimmer und gibt die PIN vom Handout ein — oder er öffnet den individuellen Link, den er beim Check-in bekommen hat, und ist ohne PIN drin. Welcher der beiden Wege gilt, entscheidet das Haus unter „Gäste-Zugang".',
    },
    {
      path: '/hilfe/gast', anchor: 'gast.portal', sim: 'portal',
      title: 'Ein Bildschirm, mehr nicht',
      body: 'Nach der Anmeldung merkt sich ein Cookie den Aufenthalt — die PIN wird kein zweites Mal verlangt. Das Portal nennt Haus und Zimmer, damit niemand versehentlich für das Nachbarzimmer bestellt.',
    },
    {
      path: '/hilfe/gast', anchor: 'gast.reinigen', sim: 'portal',
      title: 'Ein Tipp genügt',
      body: '„Zimmer reinigen" setzt den Wunsch, und das Zimmer erscheint sofort auf dem Reinigungsboard und in der Rezeptions-Übersicht. Erneut tippen nimmt ihn zurück. Nichts davon ist ein Termin — das Housekeeping kommt, wenn es in die Runde passt.',
      tun: 'Tippen Sie ruhig darauf; der Nachbau reagiert wie das echte Portal.',
    },
    {
      path: '/hilfe/gast', anchor: 'gast.aufschub', sim: 'aufschub',
      title: '„Frühestens ab" — für Ausschläfer',
      body: 'Der Gast wünscht Reinigung, aber nicht vor einer Uhrzeit. Bis dahin gilt das Zimmer auf dem Board als nicht offen, die Kachel zeigt eine Uhr. Wie weit aufgeschoben werden darf, gibt das Haus vor — und das Portal sagt dazu, dass die Grenze vom Haus stammt.',
    },
    {
      path: '/hilfe/gast', anchor: 'gast.aktiv', sim: 'gewuenscht',
      title: 'Der Gast sieht, was er ausgelöst hat',
      body: 'Ein aktiver Wunsch bleibt sichtbar, samt der gewählten Uhrzeit. Das ist die einzige Rückmeldung, die das Portal gibt — bewusst: Ein Versprechen, wann jemand kommt, könnte RoSe ohne Zuweisungslogik nicht halten.',
    },
    {
      path: '/hilfe/gast', anchor: 'gast.dnd', sim: 'dnd',
      title: '„Nicht stören" schlägt alles',
      body: 'Solange es aktiv ist, klopft niemand, und auch die tägliche Routine-Reinigung setzt aus. Zurücknehmen geht jederzeit — anders als der Reinigungswunsch ist „Nicht stören" nie durch ein Zeitfenster gesperrt, sonst säße jemand damit fest.',
    },
    {
      path: '/hilfe/gast', anchor: 'gast.services', sim: 'services',
      title: 'Zusatzleistungen aus dem Baukasten',
      body: 'Der Gast sieht genau die Services, die das Haus angelegt hat, mit den Preisen als Anzeige. Bestellt wird mit einem Tipp; die Anfrage landet auf dem Services-Board der Rezeption. Abgerechnet wird in RoSe nichts.',
    },
    {
      path: '/hilfe/gast', anchor: 'gast.bestellt', sim: 'bestellt',
      title: 'Und dann ist Schluss',
      body: 'Offene Anfragen bleiben für den Gast sichtbar, bis die Rezeption sie erledigt. Mit dem Check-out erlöschen PIN, Link und Cookie sofort — der Aufenthalt bleibt anonym, es war nie ein Name im Spiel.',
    },
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

/** Die vier Konfigurations-Punkte in Reihenfolge — eine Quelle für Hub und Band. */
function konfigItems(f: SetupKonfig): SetupItem[] {
  return [
    {
      id: 'zimmer',
      label: 'Zimmer angelegt',
      todo: 'Zimmer anlegen',
      hint: f.rooms > 0
        ? `${f.rooms} Zimmer in Betrieb`
        : 'Ohne Zimmer gibt es keinen Check-in und kein Reinigungsboard',
      done: f.rooms > 0,
      path: '/zimmer', lotse: 'zimmer',
    },
    {
      id: 'regeln',
      label: 'Regeln des Hauses geprüft',
      todo: 'Regeln des Hauses prüfen',
      hint: f.timeZoneChosen
        ? 'Zeitzone gesetzt — Routine, Check-out-Frist und Auswertung rechnen richtig'
        : 'Vor allem die Zeitzone: ohne sie liegen alle Uhrzeiten um Stunden daneben',
      done: f.timeZoneChosen,
      path: '/einstellungen/hotel', lotse: 'regeln',
    },
    {
      id: 'gastzugang',
      label: 'Gäste-Zugang gewählt',
      todo: 'Gäste-Zugang wählen',
      hint: f.guestAccessChosen
        ? 'Das Verfahren steht — jeder Check-in hält es am Aufenthalt fest'
        : 'Fester Zimmer-QR mit PIN oder individueller Zugang je Aufenthalt',
      done: f.guestAccessChosen,
      path: '/einstellungen/gastzugang', lotse: 'gastzugang',
    },
    {
      id: 'personal',
      label: 'Reinigungskraft angelegt',
      todo: 'Reinigungskraft anlegen',
      hint: f.maids > 0
        ? `${f.maids === 1 ? 'Ein Zugang' : `${f.maids} Zugänge`} für die Reinigung`
        : 'Ohne Zugang kommt niemand auf das Reinigungsboard',
      done: f.maids > 0,
      path: '/personal', lotse: 'personal',
    },
  ]
}

/** Nur die noch offenen Konfigurations-Punkte — Grundlage des Bands. */
export function offeneEinrichtung(f: SetupKonfig): SetupItem[] {
  return konfigItems(f).filter(i => !i.done)
}

export function setupProgress(facts: SetupFacts): SetupProgress {
  const items: SetupItem[] = [
    ...konfigItems(facts),
    {
      id: 'services',
      label: 'Zusatzleistungen eingerichtet',
      todo: 'Zusatzleistungen einrichten',
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
      todo: 'Ersten Check-in ausprobieren',
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
      todo: 'Zahlungsweg hinterlegen',
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
