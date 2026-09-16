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
 * Wie `lotsen.ts` ist der Katalog I/O-frei und ohne React: Text, Struktur und
 * Zuordnung Pfad → Thema. Gezeichnet wird in `components/hilfe/HilfeThema.tsx`.
 *
 * **Der Erweiterungspunkt:** Kommt Rückmeldung „X war unverständlich", wird
 * daraus ein Eintrag in `fragen` oder `legende` — keine Layout-Arbeit.
 *
 * Zeichen der Legende sind **typisierte Schlüssel** in die Tabellen von
 * `room-symbols.ts` (Kachel-Symbole, Balken, Ringe) bzw. in die Icon-Liste
 * unten. Beschriftung und Bedeutung eines Kachel-Symbols kommen aus derselben
 * Quelle, aus der die Boards zeichnen — die Legende kann damit nicht vom Board
 * abweichen, und ein Tippfehler im Schlüssel fällt beim Type-Check auf.
 */

import type { LotseBereich, LotseZugang } from './lotsen'
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

export type HilfeThema = {
  /** Dieselbe ID wie der zugehörige Lotse, wo es einen gibt. */
  id: string
  title: string
  subtitle: string
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
  lotse?: string
  bloecke: HilfeBlock[]
}

// ---------------------------------------------------------------------------
// Bausteine, die mehrfach vorkommen
// ---------------------------------------------------------------------------

/** Die Symbole der Rezeptions-Kachel in Kachel-Reihenfolge. */
const KACHEL_SYMBOLE: LegendeEintrag[] = (
  ['occupied', 'departure', 'dnd', 'clean', 'deferred', 'routine', 'checkout', 'priority', 'cleaning', 'orders', 'urgent', 'deactivated'] as RoomSymbolId[]
).map(id => ({ zeichen: { art: 'symbol', id } }))

// ---------------------------------------------------------------------------
// Themen im Haus
// ---------------------------------------------------------------------------

const UEBERSICHT: HilfeThema = {
  id: 'uebersicht',
  title: 'Die Zimmer-Übersicht',
  subtitle: 'Farben und Symbole der Kacheln, Check-in und Check-out, Priorität, Verlauf',
  zugang: 'alle',
  pfade: ['', '/aufstellung'],
  lotse: 'uebersicht',
  bloecke: [
    {
      art: 'text',
      absaetze: [
        'Die Übersicht ist der Bildschirm der Rezeption: alle Zimmer nach Etagen, der Zustand jedes Zimmers auf einen Blick, ein Klick öffnet den Dialog mit Check-in, Check-out, PIN, Handout, Abreisedatum, Priorität und Verlauf.',
        'Sie aktualisiert sich von selbst, sobald ein Gast tippt, eine Reinigungskraft startet oder eine Kollegin am zweiten Bildschirm etwas ändert. Neu laden müssen Sie nie.',
      ],
    },
    {
      art: 'legende',
      titel: 'Der Balken über der Nummer',
      hinweis: 'Gilt mehr als ein Zustand, gewinnt der weiter oben stehende.',
      eintraege: (['priority', 'checkout', 'wanted', 'dnd', 'occupied', 'ready', 'deactivated'] as RoomBarId[])
        .map(id => ({ zeichen: { art: 'balken', id } })),
    },
    {
      art: 'legende',
      titel: 'Die Symbole auf der Kachel',
      hinweis: 'Mehrere Symbole zugleich sind normal — belegt, Reinigung gewünscht und eine offene Anfrage zum Beispiel. Der Tooltip der Kachel nennt alles im Klartext.',
      eintraege: KACHEL_SYMBOLE,
    },
    {
      art: 'legende',
      titel: 'Rahmen und Etagen-Kopf',
      eintraege: [
        { zeichen: { art: 'ring', id: 'urgent' } },
        { zeichen: { art: 'ring', id: 'priority' } },
        {
          zeichen: { art: 'icon', id: 'users', ton: 'neutral' },
          label: 'Name im Etagen-Kopf',
          text: 'Eine Reinigungskraft hat sich auf dieser Etage eingebucht. Sie sehen, wo gearbeitet wird, ohne zu fragen.',
        },
        {
          zeichen: { art: 'pille', text: '3', ton: 'attention' },
          label: 'Zahl an „Services" in der Navigation',
          text: 'So viele Anfragen sind offen. Sie blinkt rot, sobald eine davon einen dringenden Service betrifft.',
        },
      ],
    },
    {
      art: 'fragen',
      eintraege: [
        {
          frage: 'Warum ist ein Zimmer nach dem Check-out orange und nicht sofort grün?',
          antwort: 'Der Zustand ist ereignisgetrieben: Der Check-out sagt „Reinigung offen", und erst der Abschluss einer Reinigungskraft — oder Ihr „Als gereinigt markieren" im Dialog — sagt „bereit". RoSe rät nicht, ob inzwischen jemand da war.',
        },
        {
          frage: 'Ich soll einchecken, das Zimmer ist aber nicht bereit. Geht das?',
          antwort: 'Ja. Der Dialog warnt und lässt Sie trotzdem einchecken. Dieselbe Warnung erscheint, wenn eine Meldung ans Haus offen ist (etwa ein gemeldeter Defekt) — dann wissen Sie es wenigstens, bevor der Gast im Zimmer steht.',
        },
        {
          frage: 'Wo steht die PIN, und was sage ich dem Gast?',
          antwort: 'Nach dem Check-in steht die PIN groß im Dialog — vorlesen genügt, zusammen mit dem Handout zum Drucken oder als E-Mail. Nutzt Ihr Haus individuelle Zugänge je Aufenthalt, gibt es keine PIN: Der Gast bekommt einen eigenen QR-Code bzw. Link, der mit dem Check-out erlischt.',
        },
        {
          frage: 'Muss ich beim Check-in ein Abreisedatum angeben?',
          antwort: 'Nein — die Vorgabe ist „offen", damit der Check-in ein Klick bleibt. Tragen Sie es ein, setzt die Routine-Reinigung am Abreisetag aus und die Kachel zeigt den Koffer. Nachtragen oder verlängern geht jederzeit im Dialog. Ein überholtes Datum (gestern) gilt als unbekannt, damit ein vergessenes Nachziehen die Routine nicht dauerhaft abschaltet.',
        },
        {
          frage: 'Wann setze ich eine Priorität?',
          antwort: 'Bei Beschwerden und Sonderfällen — von Hand, es gibt keinen Automatismus. Das Zimmer rückt auf dem Reinigungsboard nach vorn, die Etage trägt dort eine violette Warnlampe. Mit dem Abschluss der Reinigung erlischt die Priorität von selbst.',
        },
        {
          frage: 'Was passiert beim Check-out genau?',
          antwort: 'PIN, Link und die Sitzung des Gastes sind sofort tot, das Zimmer geht auf „Reinigung offen". Offene Service-Anfragen dieses Aufenthalts werden als „nicht erbracht" geschlossen — was tatsächlich erbracht wurde, haken Sie vorher im selben Kasten ab. Meldungen ans Haus (Defekte) bleiben offen. Hat der Gast Kostenpflichtiges bestellt, steht die Summe vor der Bestätigung im Dialog.',
        },
        {
          frage: 'Wo finde ich die Aufstellung später wieder?',
          antwort: 'Im Verlauf des Zimmers: Der Eintrag „Check-out" trägt den Link. Die Aufstellung ist ausdrücklich keine Rechnung — kein Gastname, keine Rechnungsnummer, kein Steuerausweis. Sie zeigt, was zu kassieren ist.',
        },
        {
          frage: 'Was steht im Verlauf?',
          antwort: 'Die letzten 30 Tage des Zimmers: Gast-Tipps (immer nur „Gast", nie eine Identität), Reinigungen mit Namen, Check-in und Check-out mit der Person am Tresen, Service-Anfragen. Auch „Reinigung nicht abgeschlossen (Zeitlimit)" steht dort — der Verlauf ist der Arbeitsnachweis und das Werkzeug bei Beschwerden.',
        },
        {
          frage: 'Warum zeigt die Kachel „Reinigung ab 11:00" und erscheint nicht auf dem Board?',
          antwort: 'Der Gast hat „frühestens ab" gewählt. Bis zur Uhrzeit ist das Zimmer auf beiden Boards nicht offen; zur Uhrzeit wechselt es von selbst in „Reinigung gewünscht". Bis wann aufgeschoben werden darf, legen Sie unter Hotel & Regeln fest.',
        },
      ],
    },
    {
      art: 'verweise',
      eintraege: [
        { label: 'Service-Anfragen', hinweis: 'Was hinter Glocke und Zahl steckt', ziel: { art: 'thema', id: 'anfragen' } },
        { label: 'Aushänge & Handouts', hinweis: 'Das Handout zum Check-in', ziel: { art: 'thema', id: 'aushang' } },
        { label: 'Was der Gast sieht', hinweis: 'Der Nachbau des Gäste-Portals', ziel: { art: 'thema', id: 'gast' } },
      ],
    },
  ],
}

const ANFRAGEN: HilfeThema = {
  id: 'anfragen',
  title: 'Service-Anfragen',
  subtitle: 'Das Board der Rezeption: offen, erledigt, nicht erbracht — und was das für die Aufstellung heißt',
  zugang: 'alle',
  pfade: ['/bestellungen'],
  lotse: 'anfragen',
  bloecke: [
    {
      art: 'text',
      absaetze: [
        'Hier laufen die Bestellungen aus den Gäste-Portalen auf, älteste oben. Eine Anfrage ist offen oder abgeschlossen — es gibt kein „in Bearbeitung" und keine Zuweisung an eine Person; das Board ist für alle am Tresen dasselbe.',
        'Neue Anfragen erscheinen von selbst, ohne Neuladen.',
      ],
    },
    {
      art: 'legende',
      titel: 'Zeichen auf dem Board',
      eintraege: [
        {
          zeichen: { art: 'pille', text: 'dringend', ton: 'critical', icon: 'siren' },
          label: 'Dringend',
          text: 'Der Service ist im Baukasten als „dringend" markiert. Die Anfrage hat einen rot blinkenden Rahmen, die Zimmer-Kachel eine blinkende Glocke, die Zahl in der Navigation blinkt.',
        },
        {
          zeichen: { art: 'pille', text: 'nicht erbracht', ton: 'outline' },
          label: 'Nicht erbracht',
          text: 'Beim Check-out war die Anfrage noch offen und wurde geschlossen, ohne dass jemand sie erledigt hat. Sie bleibt sichtbar und steht ohne Betrag auf der Aufstellung — sonst verschwände etwas, worüber der Gast womöglich noch spricht.',
        },
        {
          zeichen: { art: 'pille', text: 'Erledigt', ton: 'positive', icon: 'check' },
          label: 'Erledigt',
          text: 'Erbracht. Trägt die Anfrage einen Preis, erscheint sie damit auf der Aufstellung beim Check-out. Der Zeitpunkt und Ihr Name werden festgehalten.',
        },
        { zeichen: { art: 'symbol', id: 'orders' }, text: 'So sieht eine offene Anfrage auf der Zimmer-Kachel der Übersicht aus.' },
        { zeichen: { art: 'symbol', id: 'urgent' } },
      ],
    },
    {
      art: 'fragen',
      eintraege: [
        {
          frage: 'Ich habe versehentlich „Erledigt" gedrückt. Kann ich das zurücknehmen?',
          antwort: 'Nein — es gibt bewusst keinen Rückweg, der Haken ist ein Ereignis mit Zeitpunkt und Namen. Die Anfrage steht dann mit Betrag auf der Aufstellung; klären Sie den Posten beim Check-out mit dem Gast. Wenn das öfter passiert, ist das eine Rückmeldung an uns wert.',
        },
        {
          frage: 'Warum ist eine Anfrage nach dem Check-out weg?',
          antwort: 'Sie ist nicht weg, sondern als „nicht erbracht" abgeschlossen und steht in der Liste „Zuletzt abgeschlossen". Anfragen gehören zum Aufenthalt, nicht zum Zimmer — sonst läge morgen auf dem Board eine Bestellung für ein leeres Zimmer.',
        },
        {
          frage: 'Was ist eine „Meldung ans Haus", und warum bleibt sie offen?',
          antwort: 'Ein Kennzeichen am Service im Baukasten, gedacht für Defekte: Solche Anfragen gehören zum Zimmer, nicht zum Aufenthalt. Sie überleben den Check-out, stehen auf keiner Aufstellung (auch mit Preis nicht) und der nächste Check-in warnt davor — ein kaputter Wasserhahn hört nicht auf zu existieren, weil der Gast abreist.',
        },
        {
          frage: 'Kann ich eine Anfrage einer Kollegin zuweisen?',
          antwort: 'Nein, bewusst nicht. RoSe hat keine Personalplanung; wer am Tresen steht, sieht dasselbe Board. Wer etwas erledigt, hakt es ab — mehr Koordination braucht ein Board für eine Rezeption nicht.',
        },
        {
          frage: 'Wie lange bleiben abgeschlossene Anfragen sichtbar?',
          antwort: 'Die letzten 20 stehen eingeklappt unter den offenen. Darüber hinaus finden Sie jede Anfrage im Verlauf des Zimmers (30 Tage) und, sofern kostenpflichtig, auf der Aufstellung des Aufenthalts.',
        },
        {
          frage: 'Der Gast sagt, er habe bestellt, hier steht nichts.',
          antwort: 'Prüfen Sie im Verlauf des Zimmers, ob eine Anfrage angekommen ist. Häufigste Ursache: Der Gast war im Portal eines anderen Zimmers (das Portal nennt Haus und Zimmer im Kopf) oder hat vor dem Absenden abgebrochen.',
        },
      ],
    },
    {
      art: 'verweise',
      eintraege: [
        { label: 'Zusatzleistungen', hinweis: 'Der Baukasten: Preise, „dringend", „Meldung ans Haus"', ziel: { art: 'thema', id: 'services' } },
        { label: 'Zimmer-Übersicht', hinweis: 'Abhaken auch im Zimmer-Dialog', ziel: { art: 'thema', id: 'uebersicht' } },
      ],
    },
  ],
}

const ZIMMER: HilfeThema = {
  id: 'zimmer',
  title: 'Zimmer & Etagen',
  subtitle: 'Anlegen, korrigieren, außer Betrieb nehmen, löschen — und was jeweils mitgeht',
  zugang: 'verwaltung',
  pfade: ['/zimmer'],
  lotse: 'zimmer',
  bloecke: [
    {
      art: 'text',
      absaetze: [
        'Zimmer werden etagenweise angelegt: Nummern als Liste („201, 202, 205") oder als Bereich („101-110"), wahlweise mit der Etagennummer als Präfix. Unter dem Formular steht vorher, was entsteht — geschrieben wird erst beim Klick.',
        'Zimmer, Etage und Gebäudeteil öffnen denselben Dialog mit denselben drei Möglichkeiten: bearbeiten, außer Betrieb nehmen, löschen.',
      ],
    },
    {
      art: 'fragen',
      eintraege: [
        {
          frage: 'Wozu der Gebäudeteil?',
          antwort: 'Nur für Häuser mit wirklich getrennten Trakten. Er wirkt auf die Eindeutigkeit: Zimmernummern müssen je Gebäudeteil eindeutig sein, die „101" darf es im Haupthaus und im Nebenhaus geben. Ohne Trakte lassen Sie ihn leer.',
        },
        {
          frage: 'Wann „Etagennummer voranstellen"?',
          antwort: 'Wenn jede Etage denselben Nummernkreis nutzt: Aus Etage 2 und „05" wird „205". Ohne das Häkchen kollidieren die Nummern ab der zweiten Etage — die Seite warnt vorher.',
        },
        {
          frage: 'Eine Nummer ist falsch. Löschen und neu anlegen?',
          antwort: 'Nein — bearbeiten. Nummer, Etage und Gebäudeteil lassen sich ändern, ohne dass Verlauf, Aufenthalte oder Arbeitsnachweise verloren gehen; alles hängt am Zimmer, nicht an seiner Nummer. Löschen ist für Fehlanlagen ohne Historie.',
        },
        {
          frage: 'Außer Betrieb oder löschen?',
          antwort: 'Außer Betrieb ist der empfohlene Weg für Renovierung und Stilllegung: kein Check-in, nicht auf dem Reinigungsboard, nicht auf den Aushängen — aber alles bleibt erhalten, und ein Klick holt das Zimmer zurück. Die Nummer bleibt dabei belegt. Löschen ist endgültig und gibt die Nummer frei.',
        },
        {
          frage: 'Was geht beim Löschen mit?',
          antwort: 'Der Dialog beziffert es vorher: Aufenthalte, Service-Anfragen samt Summe, Verlaufs-Einträge, und die QR-Aushänge des Zimmers werden ungültig. Die Reinigungs-Stiche überleben und verlieren nur den Zimmerbezug — die Auswertung bleibt vollständig. Ein belegtes Zimmer lässt sich nicht löschen; ein Bereich mit Historie verlangt die abgetippte Bezeichnung.',
        },
        {
          frage: 'Zählt ein Zimmer außer Betrieb bei der Abrechnung?',
          antwort: 'Für den laufenden Monat ja, wenn es darin auch nur vorübergehend in Betrieb war; ab dem nächsten vollen Monat außer Betrieb nicht mehr. Vor jeder Löschung werden die Zimmerzahlen abgeschlossener Monate festgeschrieben — ein gelöschtes Zimmer fehlt also rückwirkend in keiner Abrechnung.',
        },
        {
          frage: 'Neue Zimmer, aber kein QR-Aushang?',
          antwort: 'Der Aushang wird je Zimmer erzeugt. Nach dem Anlegen einmal zu den Aushängen gehen: Der Knopf dort erzeugt die fehlenden Codes auf einen Schlag.',
        },
      ],
    },
    {
      art: 'verweise',
      eintraege: [
        { label: 'Aushänge & Handouts', hinweis: 'Codes für neue Zimmer erzeugen', ziel: { art: 'thema', id: 'aushang' } },
        { label: 'Plan & Abrechnung', hinweis: 'Wie Zimmer gezählt werden', ziel: { art: 'thema', id: 'konto' } },
      ],
    },
  ],
}

const REGELN: HilfeThema = {
  id: 'regeln',
  title: 'Hotel & Regeln',
  subtitle: 'Zeitzone, Routine-Reinigung, Check-out-Frist, Aufschub, Zeitfenster, PIN, Zeitlimit, Adresse, Logo',
  zugang: 'verwaltung',
  pfade: ['/einstellungen/hotel'],
  lotse: 'regeln',
  bloecke: [
    {
      art: 'text',
      absaetze: [
        'Die Regeln gelten ab dem Speichern für alles Weitere. Laufende Aufenthalte, gesetzte Wünsche und ausgegebene PINs laufen unverändert weiter — nichts wird rückwirkend umgestellt.',
      ],
    },
    {
      art: 'fragen',
      eintraege: [
        {
          frage: 'Warum ist die Zeitzone so wichtig?',
          antwort: 'Alle Uhrzeiten dieser Seite gelten in ihr — und die Server laufen in UTC. Mit falscher Zeitzone wird eine Routine „ab 10:00" tatsächlich um 12:00 fällig, das Zeitfenster liegt daneben, „heute gereinigt" kippt nachts zur falschen Stunde und die Tagesgrenzen der Auswertung stimmen nicht.',
        },
        {
          frage: 'Routine-Reinigung an oder aus?',
          antwort: 'Ab Werk aus: Gereinigt wird auf Wunsch des Gastes und nach dem Check-out. Das spart Wasser, Waschmittel und Arbeitszeit und ist Teil des Nachhaltigkeits-Versprechens. Eingeschaltet erscheinen belegte Zimmer ab der zweiten Nacht ab der Uhrzeit von selbst auf dem Board — außer bei „Nicht stören", bei einem Gast-Wunsch (der Gast hat entschieden), am Abreisetag und wenn heute schon gereinigt wurde.',
        },
        {
          frage: 'Was bewirkt „Check-out bis"?',
          antwort: 'Es ist die Untergrenze der Routine. RoSe kennt kein Buchungssystem und weiß nicht, wer heute abreist; deshalb wird die Routine nie vor dieser Zeit fällig — wer danach noch da ist, bleibt. Sonst würde ein Abreisezimmer vor dem Check-out gereinigt und danach noch einmal. Das Handout nennt die effektive Zeit.',
        },
        {
          frage: '„Frühestens ab" — wie wähle ich die Grenze?',
          antwort: 'Der Gast wünscht Reinigung, aber nicht vor einer Uhrzeit. Er darf volle Stunden zwischen jetzt und Ihrer Grenze wählen. Legen Sie sie so, dass die Reinigung danach noch in die Schicht fällt: Housekeeping bis 15:00 heißt Grenze 13:00. Ausschalten geht auch, dann gibt es im Portal nur „jetzt".',
        },
        {
          frage: 'Wozu ein Zeitfenster für den Reinigungswunsch?',
          antwort: 'Außerhalb des Fensters kann der Gast keinen Wunsch absetzen und sieht Ihre Reinigungszeiten. Es betrifft nur den Wunsch: „Nicht stören" und das Zurücknehmen bleiben jederzeit möglich, bereits gesetzte Wünsche laufen weiter. Ein Fenster über Mitternacht (22:00–06:00) wird richtig verstanden.',
        },
        {
          frage: 'Was passiert bei einer vergessenen Reinigung?',
          antwort: 'Wird eine gestartete Reinigung nicht abgeschlossen, geht das Zimmer nach dem Zeitlimit von selbst wieder auf offen, und im Verlauf steht „Reinigung nicht abgeschlossen (Zeitlimit, Name)". Das Limit sollte großzügig über der längsten echten Reinigung liegen — Vorgabe 90 Minuten.',
        },
        {
          frage: 'Die PIN-Länge ändern — was passiert mit laufenden Aufenthalten?',
          antwort: 'Nichts. Die Länge gilt nur für neu erzeugte PINs; jeder laufende Aufenthalt behält seine. Vorgabe sind sechs Ziffern; kürzer ist bequemer, länger sicherer — dazu kommt die Sperre nach fünf Fehlversuchen.',
        },
        {
          frage: 'Kann ich die Adresse des Hauses ändern?',
          antwort: 'Ja, der Kurzname in der Adresse ist änderbar. Gedruckte QR-Codes bleiben gültig, weil sie einen eigenen Schlüssel tragen. Nur wer die Adresse abgetippt hat oder ein älteres Handout mit ausgeschriebener Adresse besitzt, kommt nicht mehr an — die Anmeldeseiten von Gästen und Reinigung liegen unter dem neuen Namen.',
        },
        {
          frage: 'Welche Anforderungen hat das Logo?',
          antwort: 'PNG, JPG oder SVG bis 1 MB. Es steht auf Aushang und Handout in höchstens 55 × 16 mm; unter etwa 400 px Breite wird es dort unscharf. Die Vorschau steht auf weißem Grund — ein helles Logo für dunkle Hintergründe ist auf Papier sonst unsichtbar. Ohne Logo tragen die Blätter den Hausnamen.',
        },
      ],
    },
    {
      art: 'verweise',
      eintraege: [
        { label: 'Gäste-Zugang', hinweis: 'PIN oder individueller Link, Sprachen der Blätter', ziel: { art: 'thema', id: 'gastzugang' } },
        { label: 'Was der Gast sieht', hinweis: 'So wirken Aufschub und Zeitfenster im Portal', ziel: { art: 'thema', id: 'gast' } },
      ],
    },
  ],
}

const GASTZUGANG: HilfeThema = {
  id: 'gastzugang',
  title: 'Gäste-Zugang',
  subtitle: 'Fester Zimmer-QR mit PIN oder individueller Zugang je Aufenthalt, Sprachen der Blätter, Aushänge',
  zugang: 'verwaltung',
  pfade: ['/einstellungen/gastzugang'],
  lotse: 'gastzugang',
  bloecke: [
    {
      art: 'text',
      absaetze: [
        'Zwei Wege ins Gäste-Portal, Wahl je Haus. Beim festen Zimmer-QR klebt ein einmal gedruckter Code im Zimmer, und jeder Aufenthalt bekommt seine PIN. Beim individuellen Zugang entsteht je Aufenthalt ein eigener Code bzw. Link ohne PIN, der mit dem Check-out erlischt.',
      ],
    },
    {
      art: 'fragen',
      eintraege: [
        {
          frage: 'Welches Verfahren passt zu uns?',
          antwort: 'Fester QR + PIN, wenn Sie Aushänge in den Zimmern anbringen können und zwei Faktoren wollen (Code im Zimmer, PIN vom Tresen). Individueller Zugang, wenn Aushänge nicht möglich oder nicht gewünscht sind — bequemer für den Gast, aber wer den Zettel sieht, ist drin. Die Seite stellt beides ausführlich gegenüber.',
        },
        {
          frage: 'Was passiert mit laufenden Aufenthalten, wenn ich wechsle?',
          antwort: 'Nichts. Das Verfahren wird beim Check-in am Aufenthalt festgehalten. Ausgegebene PINs und Links funktionieren bis zum Check-out weiter; erst der nächste Check-in folgt dem neuen Verfahren. Kein Stichtag, keine Umstellung.',
        },
        {
          frage: 'Warum gibt es beim individuellen Zugang keine PIN als Rückfall?',
          antwort: 'Eine PIN, die niemand erfährt, wäre ein zweiter Zugangsweg ohne Nutzen — und ein Angriffspunkt mehr. Der Aufenthalt hat genau den Zugang, den der Gast in der Hand hält.',
        },
        {
          frage: 'Der Gast möchte den Zugang per E-Mail.',
          antwort: 'Im Zimmer-Dialog lässt sich das Handout als Mail verschicken. Die Adresse wird nicht gespeichert; der Aufenthalt bleibt anonym. Die Mail enthält den Link, kein QR-Bild — viele Mail-Programme zeigen eingebettete Bilder nicht. Unter dem Knopf steht, ob die Mail zugestellt wurde oder abgewiesen — und warum.',
        },
        {
          frage: 'Warum nur ein bis zwei Sprachen auf dem Papier?',
          antwort: 'Die Blätter erklären das Portal mit Bildern seiner Knöpfe; Text steht in einer Hauptsprache und wahlweise einer zweiten. Vier Sprachen halfen dem italienischen oder polnischen Gast auch nicht und machten das Blatt zum Formular. Wer keine der beiden liest, kommt über Bilder und QR ins Portal und übersetzt dort mit dem Handy. Die erste Sprache ist zugleich die der Zugangs-Mail.',
        },
        {
          frage: 'Wo sind die Aushänge hin?',
          antwort: 'Sie stehen unten auf dieser Seite — nur im PIN-Verfahren. Im Verfahren mit individuellem Zugang führten sie auf eine PIN-Eingabe, die neue Gäste gar nicht bedienen können; die Rezeption erreicht sie im PIN-Verfahren über ihre Kachel im Einstellungen-Hub.',
        },
      ],
    },
    {
      art: 'verweise',
      eintraege: [
        { label: 'Aushänge & Handouts', hinweis: 'Formate, Gültigkeit, Drucken', ziel: { art: 'thema', id: 'aushang' } },
        { label: 'Was der Gast sieht', hinweis: 'Der Nachbau des Portals', ziel: { art: 'thema', id: 'gast' } },
      ],
    },
  ],
}

const AUSHANG: HilfeThema = {
  id: 'aushang',
  title: 'Aushänge & Handouts',
  subtitle: 'Zimmer-Aushang, Check-in-Handout, Login-Karte: woher, wie lange gültig, was sie ungültig macht',
  zugang: 'alle',
  pfade: ['/zimmer/aushang', '/handout', '/personal/karte'],
  lotse: 'aushang',
  bloecke: [
    {
      art: 'text',
      absaetze: [
        'Drei Papiere entstehen an drei Orten: der Zimmer-Aushang je Zimmer (unter Gäste-Zugang bzw. „QR-Aushänge"), das Handout je Aufenthalt (im Zimmer-Dialog nach dem Check-in) und die Login-Karte je Reinigungskraft (unter Personal).',
        'Aushang und Handout sind dasselbe Blatt in zwei Formaten — DIN A4 oder vier kompakte Karten je Seite — und unterscheiden sich nur im Zugangsblock: fester Code mit „PIN erhalten Sie beim Check-in" gegen den Zugang dieses Aufenthalts.',
      ],
    },
    {
      art: 'fragen',
      eintraege: [
        {
          frage: 'A4 oder kompakt?',
          antwort: 'A4 für Rahmen, Aufsteller und Mappe; kompakt (92 × 130 mm, vier je Seite zum Auseinanderschneiden) für Türschilder und den Tresen. Die Wahl hängt am Anlass und wird nicht gespeichert. Der QR-Code ist nach Leseabstand bemessen: 55 mm auf A4, 42 mm kompakt.',
        },
        {
          frage: 'Warum steht auf dem Aushang keine Reinigungszeit?',
          antwort: 'Der Aushang hängt dauerhaft. Eine gedruckte Regel veraltet stillschweigend, sobald das Haus die Routine umstellt — 200 Blätter lügen dann an der Wand. Regel und Uhrzeiten stehen nur auf dem Handout, das je Check-in frisch entsteht.',
        },
        {
          frage: 'Der Ausdruck kommt ohne Farben aus dem Drucker.',
          antwort: 'Browser drucken Hintergrundflächen standardmäßig nicht. Die Blätter sind deshalb so gebaut, dass Farbe nur an Linien und hellen Tönungen mit dunkler Schrift hängt — sie funktionieren auch in Graustufen. Wer Farbe will, aktiviert im Druckdialog „Hintergrundgrafiken".',
        },
        {
          frage: 'Ein Aushang ist abhandengekommen.',
          antwort: '„Code erneuern" erzeugt einen neuen Code für genau dieses Zimmer; der alte Aushang ist ab dann ungültig. Nur Inhaber und Manager können das, und es betrifft immer nur ein Zimmer. Danach neu drucken.',
        },
        {
          frage: 'Die Zugangs-Mail landet beim Gast im Spam.',
          antwort: 'Das ist Sendereputation, kein Fehler — das Handout weist darauf hin. Bei einer abgewiesenen Adresse steht der Grund unter dem Knopf; ein Tippfehler in der Adresse ist der häufigste. Der Ausweg ist immer der Druck.',
        },
        {
          frage: 'Eine Login-Karte ist verloren.',
          antwort: 'Unter Personal eine neue ausstellen: neue PIN und neuer Code in einem Schritt, die alte Karte ist damit ungültig. Die Karte überlebt ein „Zugang beenden" und gilt nach der Reaktivierung wieder.',
        },
        {
          frage: 'Warum finde ich die Aushänge nicht?',
          antwort: 'Ihr Haus nutzt individuelle Zugänge je Aufenthalt. Dann gibt es keinen festen Zimmer-Code, und der Gast bekommt sein Blatt beim Check-in aus dem Zimmer-Dialog.',
        },
      ],
    },
    {
      art: 'verweise',
      eintraege: [
        { label: 'Gäste-Zugang', hinweis: 'Verfahren und Sprachen der Blätter', ziel: { art: 'thema', id: 'gastzugang' } },
        { label: 'Personal', hinweis: 'Login-Karten ausstellen', ziel: { art: 'thema', id: 'personal' } },
      ],
    },
  ],
}

const PERSONAL: HilfeThema = {
  id: 'personal',
  title: 'Personal',
  subtitle: 'Reinigung, Rezeption, Manager — Zugänge, Einladungen, Login-Karten, beenden und löschen',
  zugang: 'verwaltung',
  pfade: ['/personal'],
  lotse: 'personal',
  bloecke: [
    {
      art: 'text',
      absaetze: [
        'Drei Personal-Arten an einer Stelle. Reinigungskräfte bekommen Benutzername und PIN (keine E-Mail) und eine Login-Karte; Rezeption und Manager werden per E-Mail eingeladen und setzen ihr Passwort selbst. Alle drei folgen demselben Muster: Zugang beenden (umkehrbar) oder endgültig löschen (mit bezifferter Folgenanzeige).',
      ],
    },
    {
      art: 'legende',
      titel: 'Knöpfe an der Zeile',
      eintraege: [
        { zeichen: { art: 'icon', id: 'printer', ton: 'neutral' }, label: 'Karte drucken', text: 'Die Login-Karte der Reinigungskraft mit QR-Code und Zugangsdaten — einmal scannen, angemeldet.' },
        { zeichen: { art: 'icon', id: 'idcard', ton: 'neutral' }, label: 'Neue Karte', text: 'Neue PIN und neuer QR-Code in einem Schritt; die alte Karte ist ab sofort ungültig. Der Weg bei Verlust oder vergessener PIN.' },
        { zeichen: { art: 'icon', id: 'pencil', ton: 'neutral' }, label: 'Bearbeiten', text: 'Anzeigename, bei der Reinigung auch der Benutzername.' },
        { zeichen: { art: 'icon', id: 'userminus', ton: 'caution' }, label: 'Zugang beenden', text: 'Anmeldung sofort tot, auch eine offene Sitzung. Nichts geht verloren; „Wieder aktivieren" macht es rückgängig.' },
        { zeichen: { art: 'icon', id: 'trash', ton: 'critical' }, label: 'Endgültig löschen', text: 'Vorher zeigt der Dialog, was mitgeht. Bei der Reinigung mit Historie muss der Benutzername abgetippt werden.' },
      ],
    },
    {
      art: 'fragen',
      eintraege: [
        {
          frage: 'Die Reinigungskraft wird mit richtiger PIN abgewiesen.',
          antwort: 'Fast immer steht der Anzeigename im Feld „Benutzername". Angemeldet wird mit dem kurzen Benutzernamen, der auf der Login-Karte unter „Zugangsdaten" steht. Zweite Ursache: Der Zugang wurde beendet — dann sagt die Anmeldeseite das.',
        },
        {
          frage: 'PIN vergessen?',
          antwort: 'Eine neue Login-Karte ausstellen: Das erzeugt eine neue PIN und einen neuen QR-Code in einem Schritt; die alte Karte ist damit ungültig. Eine PIN „nachschlagen" gibt es nicht.',
        },
        {
          frage: 'Die Einladung ist nicht angekommen.',
          antwort: 'Unter dem Sende-Knopf steht der Zustellstatus: übergeben, zugestellt oder abgewiesen — mit dem Grund des Empfänger-Servers. Meist ist es ein Tippfehler in der Adresse. Nach einem Bounce lässt sich die Adresse freigeben und erneut senden; und es gibt „Einladungslink anzeigen", um den Link per Messenger oder Zettel zu übergeben. Zwischen zwei Sendungen an denselben Bezug liegt eine Minute Wartezeit.',
        },
        {
          frage: 'Zugang beenden oder löschen?',
          antwort: 'Beenden, fast immer. Der Arbeitsnachweis bleibt vollständig, die Auswertung zeigt die Person weiter, und die Rückkehr ist ein Klick. Löschen nimmt bei der Reinigung die Stiche mit — deshalb der abgetippte Benutzername als Riegel. Beim Management bleibt das Anmeldekonto stehen, sobald Vorgänge daran hängen; der Dialog sagt das vorher.',
        },
        {
          frage: 'Was darf die Rezeption, was der Manager?',
          antwort: 'Rezeption: Check-in und Check-out, Prioritäten, Anfragen, Handouts, Karten und Aushänge drucken, eigenes Passwort. Nicht: Einstellungen, Zimmer, Services, Personal, „Code erneuern". Manager: im Haus dieselben Rechte wie der Inhaber, aber kein Zugriff auf Konto und Abrechnung. Manager ernennt nur der Inhaber.',
        },
        {
          frage: 'Eine Person soll mehrere Häuser betreuen.',
          antwort: 'Je Haus eintragen. Ab dem zweiten Mal wählen Sie sie aus den vorhandenen Managern des Kontos, ohne neuen Zugang. „Zugang beenden" wirkt nur auf das jeweilige Haus.',
        },
        {
          frage: 'Warum brauchen Reinigungskräfte keine E-Mail?',
          antwort: 'Sie melden sich mit Benutzername und PIN oder per Karte an; ein Postfach wäre eine Hürde ohne Nutzen. Der Benutzername ist nur in diesem Haus eindeutig — dieselbe Namensvetterin darf es in einem anderen Haus geben.',
        },
      ],
    },
    {
      art: 'verweise',
      eintraege: [
        { label: 'Das Reinigungsboard', hinweis: 'Was die Kraft nach der Anmeldung sieht', ziel: { art: 'thema', id: 'reinigung' } },
        { label: 'Auswertung', hinweis: 'Arbeitszeiten aus den Stichen', ziel: { art: 'thema', id: 'auswertung' } },
      ],
    },
  ],
}

const SERVICES: HilfeThema = {
  id: 'services',
  title: 'Zusatzleistungen',
  subtitle: 'Der Service-Baukasten: Services, Optionen, Preise, „dringend", „Meldung ans Haus"',
  zugang: 'verwaltung',
  pfade: ['/services'],
  lotse: 'services',
  bloecke: [
    {
      art: 'text',
      absaetze: [
        'Ein Service ist ein Baukasten: oben der Name („Wäscheservice"), darunter die Optionen, aus denen der Gast wählt, jede wahlweise mit Preis. Zwei Kennzeichen steuern den Ablauf, sonst nichts — keine Kategorien, keine Zuständigkeiten.',
      ],
    },
    {
      art: 'legende',
      titel: 'Die zwei Kennzeichen',
      eintraege: [
        {
          zeichen: { art: 'pille', text: 'dringend', ton: 'critical', icon: 'siren' },
          label: 'Dringend — wie laut',
          text: 'Anfragen dazu blinken rot: auf der Zimmer-Kachel, auf dem Anfragen-Board und als Zahl in der Navigation. Für alles, was nicht warten kann.',
        },
        {
          zeichen: { art: 'pille', text: 'Meldung ans Haus', ton: 'neutral' },
          label: 'Meldung ans Haus — wem es gehört',
          text: 'Die Anfrage gehört zum Zimmer, nicht zum Aufenthalt: Sie bleibt über den Check-out hinaus offen, steht auf keiner Aufstellung und der nächste Check-in warnt davor. Für Defekte — der technische Dienst ist der Standardfall.',
        },
      ],
    },
    {
      art: 'fragen',
      eintraege: [
        {
          frage: 'Was bewirkt ein Preis?',
          antwort: 'Der Gast sieht ihn bei der Bestellung, und beim Check-out steht die erbrachte Leistung damit auf der Aufstellung. Ohne Preis erscheint eine Option auf keiner Aufstellung — was nichts kostet, muss niemand prüfen. RoSe bucht und kassiert nichts; es rechnet zusammen.',
        },
        {
          frage: 'Ich benenne einen Service um. Ändert das alte Anfragen?',
          antwort: 'Nein. Name, Optionen und Preise werden zum Bestellzeitpunkt eingefroren; alte Anfragen und Aufstellungen bleiben, wie sie waren. Das Kennzeichen „Meldung ans Haus" dagegen wirkt sofort auch auf offene Anfragen — es entscheidet über Verhalten, nicht über den Inhalt eines Belegs.',
        },
        {
          frage: 'Archivieren oder löschen?',
          antwort: 'Archivieren. Der Service verschwindet aus dem Portal, alte Anfragen behalten ihren Bezug. Die Beispiel-Services sind ganz normale Services und lassen sich genauso archivieren.',
        },
        {
          frage: 'Kann ein Service mehrere Optionen zugleich erlauben?',
          antwort: 'Ja — der Gast wählt beliebig viele Optionen und kann eine Anmerkung dazuschreiben. Eine Bestellung ist ein Service mit den gewählten Optionen.',
        },
        {
          frage: 'Sieht der Gast auch Services ohne Optionen?',
          antwort: 'Ja, dann bestellt er den Service als Ganzes. Der technische Dienst braucht keine Optionen, ein Wäscheservice schon.',
        },
        {
          frage: 'Was ist ein „Verweis"?',
          antwort: 'Eine Kachel im Gastportal, die einen Link nach außen öffnet — etwa die Trinkgeld-App fürs Housekeeping-Team, ein Lieferdienst oder ein Taxi. Ein Verweis erzeugt keine Anfrage: nichts auf dem Board, nichts auf der Aufstellung. Vorlagen füllen das Formular vor; die Adresse passen Sie auf Ihr Konto oder Ihre Stadt an. Das Portal bettet nichts ein, es verlinkt nur — für das Ziel ist der Anbieter verantwortlich.',
        },
        {
          frage: 'Kann der Gast dem Zimmermädchen persönlich Trinkgeld geben?',
          antwort: 'Nicht über RoSe. Das Gastportal nennt keine Namen, und ein Verweis gilt für das ganze Haus — die Trinkgeld-Apps verteilen im Team. Ob Trinkgeld über eine App steuerfrei bleibt, hängt vom Zahlungsweg der App ab, nicht von RoSe.',
        },
      ],
    },
    {
      art: 'verweise',
      eintraege: [
        { label: 'Service-Anfragen', hinweis: 'Was aus den Bestellungen wird', ziel: { art: 'thema', id: 'anfragen' } },
        { label: 'Was der Gast sieht', hinweis: 'Die Bestellung aus Sicht des Gastes', ziel: { art: 'thema', id: 'gast' } },
      ],
    },
  ],
}

const REINIGUNG: HilfeThema = {
  id: 'reinigung',
  title: 'Das Reinigungsboard',
  subtitle: 'Farben, Zustände, Slider, Etagen — was die Reinigungskraft am Handy sieht und warum',
  zugang: 'alle',
  pfade: ['/hilfe/reinigung'],
  lotse: 'reinigung',
  bloecke: [
    {
      art: 'legende',
      titel: 'Der Balken über der Nummer',
      hinweis: 'Auf dem Reinigungsboard gibt es kein grünes „bereit" — Grün heißt dort „in Arbeit".',
      eintraege: (['priority', 'working', 'checkout', 'wanted', 'neutral'] as RoomBarId[])
        .map(id => ({ zeichen: { art: 'balken', id } })),
    },
    {
      art: 'legende',
      titel: 'Die Symbole auf der Kachel',
      eintraege: (['occupied', 'departure', 'dnd', 'clean', 'deferred', 'routine', 'checkout', 'priority', 'cleaning'] as RoomSymbolId[])
        .map(id => ({ zeichen: { art: 'symbol', id } })),
    },
    {
      art: 'legende',
      titel: 'Statusleiste und Etagen',
      eintraege: [
        { zeichen: { art: 'pille', text: 'Auf Schicht seit 07:02', ton: 'positive' }, label: 'Auf Schicht', text: 'Die Schicht läuft; Reinigungen lassen sich starten.' },
        { zeichen: { art: 'pille', text: 'Pause', ton: 'caution' }, label: 'Pause', text: 'Zeitraum innerhalb der Schicht; Reinigungen sind währenddessen nicht möglich. Das Pausenende setzt die Schicht fort.' },
        { zeichen: { art: 'pille', text: 'Sonstige Reinigung', ton: 'attention' }, label: 'Sonstige Reinigung', text: 'Flure, Lobby, Frühstücksraum — Arbeit ohne Zimmer, als Zeitraum. Der Start einer Zimmerreinigung beendet sie von selbst.' },
        { zeichen: { art: 'pille', text: 'Nicht auf Schicht', ton: 'neutral' }, label: 'Nicht auf Schicht', text: 'Vor dem Schichtbeginn und nach dem Schichtende. Das Board zeigt nichts zu tun.' },
        { zeichen: { art: 'pille', text: 'Als Nächstes', ton: 'action', icon: 'target', blink: true }, label: 'Als Nächstes', text: 'Empfehlung, keine Zuweisung: die Etage mit der höchsten offenen Dringlichkeit, geteilt durch die Kräfte vor Ort plus eins. Bei Gleichstand die untere Etage, damit sie nicht springt.' },
        { zeichen: { art: 'pille', text: 'Prio', ton: 'accent', icon: 'flag' }, label: 'Prio an der Etage', text: 'Auf der Etage wartet eine priorisierte Reinigung; die Zeile blinkt violett.' },
        { zeichen: { art: 'pille', text: 'Prio offen', ton: 'accent', icon: 'siren', blink: true }, label: 'Warnlampe in der Statusleiste', text: 'Auf einer anderen Etage ist eine Priorität offen. Reine Anzeige, kein Knopf — die Etage wechselt man über den Slider.' },
        { zeichen: { art: 'icon', id: 'users', ton: 'neutral' }, label: 'Namen an der Etage', text: 'Kolleginnen, die dort eingebucht sind. Wer sich einbucht, steht auch in der Rezeptions-Übersicht.' },
      ],
    },
    {
      art: 'fragen',
      eintraege: [
        {
          frage: 'Der Slider löst nicht aus.',
          antwort: 'Der Zug muss am Griff beginnen und die Bahn fast ganz (97 %) zurücklegen. Ein Tipp irgendwo auf die Bahn oder ein kurzer Ruck tut nichts — mit Absicht: Ein Handy in der Schürzentasche soll keine Reinigung starten. „Etage verlassen" geht von rechts nach links.',
        },
        {
          frage: 'Warum ist ein Zimmer ausgegraut?',
          antwort: 'Es ist nicht gesperrt, sondern ohne Auftrag: unbelegt, belegt ohne Wunsch, „Nicht stören" oder ein Wunsch, der erst später gilt („ab 11:00"). Sichtbar bleibt es, damit die Etage vollständig ist. Zur Uhrzeit wechselt ein aufgeschobener Wunsch von selbst nach offen.',
        },
        {
          frage: 'Der Abschluss wurde vergessen.',
          antwort: 'Nach dem vom Haus eingestellten Zeitlimit (Vorgabe 90 Minuten) geht das Zimmer von selbst wieder auf offen; im Verlauf steht „Reinigung nicht abgeschlossen (Zeitlimit, Name)". Die Reinigung zählt in der Auswertung dann nicht als geleistet — deshalb lohnt der Abschluss-Slider immer.',
        },
        {
          frage: 'Warum erst eine Etage wählen?',
          antwort: 'Die Etage wählen heißt einbuchen: Kolleginnen und Rezeption sehen, wer wo arbeitet, und die Empfehlung „Als Nächstes" rechnet damit. Ein Fehltipper soll niemanden aus der Etage werfen, deshalb ist der Rückweg ein Slider.',
        },
        {
          frage: 'Kann ich Pause und sonstige Reinigung zugleich haben?',
          antwort: 'Nein — beides sind Zeiträume innerhalb der Schicht und dürfen sich mit nichts überschneiden. Der Pausenbeginn beendet eine laufende sonstige Reinigung, das Schichtende beendet beides. Alle Wechsel liegen auf der Seite „Status", nicht auf dem Board.',
        },
        {
          frage: 'Anmeldung abgewiesen, obwohl die PIN stimmt.',
          antwort: 'Im Feld steht der Anzeigename statt des kurzen Benutzernamens — der steht auf der Login-Karte unter „Zugangsdaten". Oder der Zugang wurde beendet; dann sagt die Seite das. Die Karte scannen ist der Weg ohne Tippen.',
        },
        {
          frage: 'Woher weiß die Rezeption, was ich gemacht habe?',
          antwort: 'Aus den Stichen: Schichtbeginn und -ende, Pause, sonstige Reinigung, Start und Abschluss je Zimmer. Daraus rechnet die Auswertung Arbeits- und Reinigungszeiten; der Zimmer-Verlauf zeigt jede Reinigung mit Namen.',
        },
      ],
    },
    {
      art: 'verweise',
      eintraege: [
        { label: 'Personal', hinweis: 'Zugänge, Login-Karten, PIN', ziel: { art: 'thema', id: 'personal' } },
        { label: 'Auswertung', hinweis: 'Was aus den Stichen wird', ziel: { art: 'thema', id: 'auswertung' } },
        { label: 'Hotel & Regeln', hinweis: 'Routine, Aufschub-Grenze, Zeitlimit', ziel: { art: 'thema', id: 'regeln' } },
      ],
    },
  ],
}

const GAST: HilfeThema = {
  id: 'gast',
  title: 'Was der Gast sieht',
  subtitle: 'Zugang, PIN-Sperre, Reinigung und „frühestens ab", Nicht stören, Bestellungen, Check-out',
  zugang: 'alle',
  pfade: ['/hilfe/gast'],
  lotse: 'gast',
  bloecke: [
    {
      art: 'fragen',
      eintraege: [
        {
          frage: 'Wie kommt der Gast ins Portal?',
          antwort: 'Im PIN-Verfahren auf zwei gleichwertigen Wegen: Zimmer-QR scannen und PIN eingeben, oder die Adresse des Hauses aufrufen und Zimmernummer plus PIN eingeben (beides steht auf dem Handout). Beim individuellen Zugang öffnet er seinen QR-Code bzw. Link und ist ohne PIN drin. Danach merkt sich ein Cookie den Aufenthalt.',
        },
        {
          frage: 'Der Gast hat sich ausgesperrt.',
          antwort: 'Nach fünf falschen PINs ist der Aufenthalt 15 Minuten gesperrt — auch für die richtige PIN. Das gilt nur für dieses Zimmer, nicht für das Haus. Die PIN steht im Zimmer-Dialog; ein Wechsel der PIN ist nicht vorgesehen, bei Bedarf hilft aus- und wieder einchecken.',
        },
        {
          frage: 'Was bewirkt „Zimmer reinigen"?',
          antwort: 'Das Zimmer erscheint sofort als offen auf dem Reinigungsboard und in Ihrer Übersicht. Kein Termin — das Housekeeping kommt, wenn es in die Runde passt. Erneut tippen nimmt den Wunsch zurück. Mit „frühestens ab" wählt der Gast eine volle Stunde; bis dahin ist das Zimmer nicht offen.',
        },
        {
          frage: 'Was sagt die Statuskarte über den Knöpfen?',
          antwort: 'Woran der Gast mit der Reinigung ist, aus denselben Daten wie Ihre Boards: „vorgesehen" (Wunsch, Priorität oder fällige Routine), „ab HH:MM" (Aufschub des Gastes oder Routine vor der Fälligkeit), „wird gerade gereinigt", „heute um HH:MM gereinigt" oder „heute nichts vorgesehen" — mit dem Grund (Anreisetag, Abreisetag, Haus reinigt nur auf Wunsch). „Gereinigt" zählt nur ab dem Check-in dieses Gastes; ein Name der Reinigungskraft erscheint nie. Die Karte aktualisiert sich alle 15 Sekunden.',
        },
        {
          frage: 'Warum kann der Gast gerade keine Reinigung wünschen?',
          antwort: 'Das Haus hat ein Zeitfenster gesetzt; außerhalb sieht der Gast die Reinigungszeiten statt des Knopfes. „Nicht stören" und das Zurücknehmen bleiben immer möglich.',
        },
        {
          frage: 'Was bewirkt „Nicht stören"?',
          antwort: 'Niemand klopft, die Routine setzt aus, das Zimmer ist auf dem Board ausgegraut — solange, bis der Gast es zurücknimmt. Nur der Gast kann das; die Rezeption sieht es, überstimmt es aber nicht.',
        },
        {
          frage: 'Bezahlt der Gast im Portal?',
          antwort: 'Nein. Er sieht Preise als Anzeige und bestellt mit einem Tipp; die Anfrage landet auf Ihrem Board. Beim Check-out zeigt RoSe die Summe des Erbrachten — kassiert wird am Tresen wie bisher.',
        },
        {
          frage: 'In welcher Sprache ist das Portal?',
          antwort: 'Heute Deutsch. Die gedruckten Blätter erklären die Knöpfe mit Bildern, und der Gast übersetzt den Bildschirm mit dem Handy, das er zum Scannen ohnehin in der Hand hat. Mehrsprachigkeit des Portals ist geplant.',
        },
        {
          frage: 'Was weiß RoSe über den Gast?',
          antwort: 'Nichts. Ein Aufenthalt ist Zimmer, Zeitraum, PIN oder Link — kein Name, keine Adresse. Eine für die Zugangs-Mail eingegebene Adresse wird nicht gespeichert. Mit dem Check-out erlöschen PIN, Link und Cookie.',
        },
      ],
    },
    {
      art: 'verweise',
      eintraege: [
        { label: 'Gäste-Zugang', hinweis: 'PIN oder individueller Link', ziel: { art: 'thema', id: 'gastzugang' } },
        { label: 'Hotel & Regeln', hinweis: 'Zeitfenster, Aufschub-Grenze, PIN-Länge', ziel: { art: 'thema', id: 'regeln' } },
      ],
    },
  ],
}

const AUSWERTUNG: HilfeThema = {
  id: 'auswertung',
  title: 'Auswertung',
  subtitle: 'Arbeits-, Pausen- und Reinigungszeiten aus den Stichen, Auffälligkeiten, Nachfrage nach Stunden',
  zugang: 'verwaltung',
  pfade: ['/auswertung'],
  lotse: 'auswertung',
  bloecke: [
    {
      art: 'text',
      absaetze: [
        'Alles hier ist gerechnet, nichts gespeichert: Grundlage sind die Stiche der Reinigungskräfte (Schichtbeginn und -ende, Pause, sonstige Reinigung, Start und Abschluss je Zimmer) sowie Gast-Tipps und Check-outs. Der Zeitraum steht in der Adresse — ein Stand lässt sich verlinken und drucken.',
      ],
    },
    {
      art: 'fragen',
      eintraege: [
        {
          frage: 'Was bedeuten Netto-Arbeitszeit und Übrige Zeit?',
          antwort: 'Netto = Schicht ohne Pausen. Übrige Zeit = Netto minus Zimmerreinigung minus sonstige Reinigung — also Wege, Rüstzeit, Warten. Eine hohe übrige Zeit ist nicht Faulheit, sondern meist weite Wege oder Leerlauf zwischen Wünschen.',
        },
        {
          frage: 'Was zählt als „auffällig"?',
          antwort: 'Schichten über 16 Stunden (vergessenes Schichtende), Pausen über vier Stunden, Reinigungen ohne Abschluss oder länger als das Zeitlimit des Hauses. Sie werden gezählt, aber nicht eingerechnet — sonst schleppte eine offene Schicht die Arbeitszeit tagelang mit.',
        },
        {
          frage: 'Warum stehen ausgeschiedene Kräfte noch in der Tabelle?',
          antwort: 'Weil der Arbeitsnachweis das Ausscheiden überlebt. Wer den Zugang beendet hat, bleibt für seinen Zeitraum sichtbar. Nur endgültiges Löschen entfernt die Stiche — deshalb ist es ein Riegel mit abgetipptem Namen.',
        },
        {
          frage: 'Zählt „Als gereinigt markieren" der Rezeption mit?',
          antwort: 'Es schreibt einen Reinigungs-Stich, damit die Routine-Reinigung befriedigt ist — aber die Tabelle je Kraft zeigt nur Reinigungskräfte. Wer regelmäßig am Tresen „als gereinigt" markiert, sollte wissen, dass die Auswertung diese Reinigungen keiner Kraft zurechnet.',
        },
        {
          frage: 'Wozu der Abschnitt „Nachfrage"?',
          antwort: 'Er zeigt je Stunde und Wochentag, wann Gäste Reinigung wünschen und wann ausgecheckt wird — und wie viele Kräfte dann im Dienst waren. „Wünsche ohne Kraft im Dienst" ist der Planungshinweis. Deshalb fragt RoSe Gäste nicht nach Wunschzeiten: Die Daten liegen schon vor.',
        },
        {
          frage: 'In welcher Zeit werden die Stunden gebildet?',
          antwort: 'In der Zeitzone des Hauses (Hotel & Regeln). Ist sie falsch, verrutschen Tagesgrenzen und Stunden um die Differenz zur Serverzeit.',
        },
      ],
    },
    {
      art: 'verweise',
      eintraege: [
        { label: 'Das Reinigungsboard', hinweis: 'Woher die Stiche kommen', ziel: { art: 'thema', id: 'reinigung' } },
        { label: 'Personal', hinweis: 'Zugang beenden statt löschen', ziel: { art: 'thema', id: 'personal' } },
      ],
    },
  ],
}

const ZUGANG: HilfeThema = {
  id: 'zugang',
  title: 'Mein Zugang',
  subtitle: 'Anzeigename und Passwort der angemeldeten Person',
  zugang: 'alle',
  pfade: ['/einstellungen/zugang'],
  bloecke: [
    {
      art: 'fragen',
      eintraege: [
        {
          frage: 'Wo erscheint der Anzeigename?',
          antwort: 'Im Kopf des Portals, im Zimmer-Verlauf bei Check-in und Check-out, an erledigten Anfragen und in der Personal-Liste. Er wird an allen Stellen zugleich geändert.',
        },
        {
          frage: 'Warum verlangt der Passwortwechsel das aktuelle Passwort?',
          antwort: 'Weil eine offen stehende Sitzung am Rezeptionstresen sonst genügte, um jemanden auszusperren.',
        },
        {
          frage: 'Passwort vergessen?',
          antwort: 'Abmelden und auf der Anmeldeseite „Passwort vergessen" wählen. Der Link kommt per E-Mail und lässt sich auf jedem Gerät öffnen. Kommt keine Mail, kann der Inhaber oder ein Manager unter Personal den Passwort-Link erneut senden oder direkt anzeigen.',
        },
        {
          frage: 'Kann ich die E-Mail-Adresse ändern?',
          antwort: 'Hier nicht — die Adresse ist der Anmeldename. Bei einem Wechsel legt Inhaber oder Manager unter Personal einen neuen Zugang an und beendet den alten.',
        },
      ],
    },
    {
      art: 'verweise',
      eintraege: [
        { label: 'Passwort vergessen', ziel: { art: 'url', href: '/passwort-vergessen' } },
        { label: 'Personal', hinweis: 'Zugänge anlegen und beenden', ziel: { art: 'thema', id: 'personal' } },
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// Themen im Konto-Bereich
// ---------------------------------------------------------------------------

const HAEUSER: HilfeThema = {
  id: 'haeuser',
  title: 'Häuser & Konto',
  subtitle: 'Die Häuser-Seite: Lagebild je Haus, Haus anlegen, Konto-Kasten, Daten löschen',
  zugang: 'verwaltung',
  bereich: 'konto',
  pfade: [''],
  bloecke: [
    {
      art: 'text',
      absaetze: [
        'Die Häuser-Seite ist der Einstieg für Inhaber und Manager: alle erreichbaren Häuser mit Lagebild (offene Reinigungen, Anfragen), darunter für den Inhaber der Konto-Kasten und „Haus anlegen". Die Rezeption sieht diese Seite nie — sie kennt genau ein Haus.',
      ],
    },
    {
      art: 'fragen',
      eintraege: [
        {
          frage: 'Ich habe nur ein Haus. Warum diese Seite?',
          antwort: 'Weil hier das Konto liegt: Abrechnung, Zahlungsweg, ein zweites Haus, Datenlöschung. Der Weg „Häuser" in der Kopfzeile des Hauses führt immer hierher — auch bei einem einzigen Haus.',
        },
        {
          frage: 'Was sieht ein Manager hier?',
          antwort: 'Nur die Häuser, für die er eingetragen ist. Konto-Kasten, „Haus anlegen" und „Daten löschen" gibt es für ihn nicht.',
        },
        {
          frage: 'Was bedeutet „Daten löschen"?',
          antwort: 'Das vollständige Entfernen eines Hauses oder des ganzen Kontos — mit bezifferter Vorschau und abgetipptem Namen, nicht umkehrbar. Anders als im Tagesgeschäft, wo Nachweise bewusst überleben, räumt es alles ab: auch Verlauf, Anmeldekonten und Logo. Nur die Rechnungsbelege bleiben, weil sie aufbewahrt werden müssen. Das Löschen des Kontos ist zugleich die Kündigung.',
        },
        {
          frage: 'Was passiert beim Anlegen eines weiteren Hauses?',
          antwort: 'Es entsteht mit eigener Adresse, eigenen Zimmern, eigenem Personal und eigenen Regeln. Abgerechnet wird je Zimmer über alle Häuser des Kontos; der Mindestbetrag gilt je Konto, nicht je Haus.',
        },
      ],
    },
    {
      art: 'verweise',
      eintraege: [
        { label: 'Plan & Abrechnung', hinweis: 'Preise, Zählung, Zahlungsweg, Rechnungen', ziel: { art: 'thema', id: 'konto' } },
        { label: 'Allgemeine Geschäftsbedingungen', ziel: { art: 'url', href: '/agb' } },
      ],
    },
  ],
}

const KONTO: HilfeThema = {
  id: 'konto',
  title: 'Plan & Abrechnung',
  subtitle: 'Preis je Zimmer, Freimonat, Zählung, Mindestbetrag, Zahlungsweg, Rechnungen',
  zugang: 'inhaber',
  bereich: 'konto',
  pfade: ['/abrechnung'],
  lotse: 'konto',
  bloecke: [
    {
      art: 'text',
      absaetze: [
        'Ein Preis, keine Pakete: je Zimmer und Kalendermonat, mit einem Mindestbetrag je Konto. Alle Funktionen sind enthalten. Die Seite rechnet nichts selbst — Anzeige und Rechnung nutzen dieselbe Regel, damit nie zwei Zahlen im Raum stehen.',
      ],
    },
    {
      art: 'fragen',
      eintraege: [
        {
          frage: 'Welcher Monat ist frei?',
          antwort: 'Der Kalendermonat der Registrierung und, wenn Sie nicht am Monatsersten registriert haben, auch der folgende — also immer mindestens ein voller Monat.',
        },
        {
          frage: 'Wie wird ein Zimmer gezählt?',
          antwort: 'Es zählt für den Monat, sobald es darin auch nur vorübergehend in Betrieb war — heute außer Betrieb genommen zählt noch, heute angelegt ebenfalls. Der laufende Monat ist deshalb immer eine Vorschau; abgeschlossene Monate liegen fest, auch wenn Sie später Zimmer löschen.',
        },
        {
          frage: 'Warum ein Mindestbetrag je Konto und nicht je Haus?',
          antwort: 'Eine Kette zahlt die Summe ihrer Zimmer, nicht dreimal das Minimum. Ein Konto ohne ein einziges abrechenbares Zimmer zahlt nichts.',
        },
        {
          frage: 'Welche Zahlungswege gibt es?',
          antwort: 'Karte oder SEPA-Lastschrift, ohne Belastung hinterlegt und beim Monatslauf eingezogen — oder Überweisung auf Rechnung mit eigener Bankverbindung, zahlbar in 14 Tagen. Rechnungsempfänger und Anschrift sind Pflicht, weil sonst die Steuer nicht gerechnet werden kann; in der EU außerhalb Deutschlands zusätzlich die USt-IdNr.',
        },
        {
          frage: 'Wann kommt die Rechnung, und wo finde ich sie?',
          antwort: 'Am Monatsersten für den Vormonat, als PDF und Ansichtsseite in der Karte „Rechnungen". Bei 0 € entsteht keine Rechnung. Der Anbieter bewahrt die Belege auch nach einer Kontolöschung auf — laden Sie die PDFs vorher herunter, danach kommen Sie nicht mehr an die Seite.',
        },
        {
          frage: 'Was heißt „Testbetrieb — es wird nichts belastet"?',
          antwort: 'Die Zahlungsabwicklung läuft noch im Testmodus des Zahlungsdienstleisters. Rechnungen entstehen, aber es fließt kein Geld. Der Hinweis verschwindet mit dem Wechsel in den Echtbetrieb.',
        },
        {
          frage: 'Wie kündige ich?',
          antwort: 'Monatlich zum Monatsende, durch Löschen des Kontos auf der Häuser-Seite. Ein Haus außer Betrieb zu nehmen reicht nicht — Zimmer außer Betrieb zählen im laufenden Monat noch.',
        },
      ],
    },
    {
      art: 'verweise',
      eintraege: [
        { label: 'Häuser & Konto', hinweis: 'Haus anlegen, Daten löschen', ziel: { art: 'thema', id: 'haeuser' } },
        { label: 'Allgemeine Geschäftsbedingungen', ziel: { art: 'url', href: '/agb' } },
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// Katalog und Funktionen
// ---------------------------------------------------------------------------

/** Alle Themen in der Reihenfolge des Hubs. */
export const HILFE_THEMEN: HilfeThema[] = [
  UEBERSICHT, ANFRAGEN, ZIMMER, REGELN, GASTZUGANG, AUSHANG, PERSONAL, SERVICES,
  REINIGUNG, GAST, AUSWERTUNG, ZUGANG, HAEUSER, KONTO,
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
