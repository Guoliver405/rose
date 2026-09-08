# Lotsen — geführte Erklärungen im Rezeptions-Portal (08.09.2026)

> **Ausgangsfrage des Users:** Eine Tutorial-Section, in der man sich die
> Bereiche des Systems erklären lassen kann; vor allem die Einrichtung des
> ersten Hotels geführt per Coach Marks, dazu Check-in, Personal,
> Reinigungsboard, Zusatzleistungen — unterteilt in einzelne Lotsen mit
> Themenfokus, eigener Punkt im Hauptmenü, und die Ersteinrichtung läuft
> automatisch, weil der Interessent nach der Registrierung ohnehin dort landet.

## 1. Was entschieden wurde, bevor gebaut wurde

Der Vorschlag zerfiel in drei Teile mit sehr verschiedenem Risiko:

1. **Erklär-Lotsen auf den echten Seiten** — billig und robust, solange sie
   *zeigen und erklären* statt Klicks zu erzwingen.
2. **Ein Lotse, der echte Aktionen fernsteuert** — brüchig. Kein Haus gleicht
   dem anderen: Zimmer schon angelegt, andere Rolle, `guestAccessMode = link`
   (dann gibt es weder Aushänge noch PIN). Jeder Schritt bräuchte Vorbedingung
   und Ausweg. **Stattdessen: abgeleitete Einrichtungs-Checkliste.**
3. **Reinigungsboard und Gast-Portal sind aus der Rezeptions-Sitzung gar nicht
   erreichbar** — eigener Cookie-Namespace `svc_`, eigenes Konto, und das
   Gastportal braucht einen laufenden Aufenthalt samt PIN. Ein Coach Mark kann
   dort nicht hinlaufen. Dafür ist die **Simulation nach dem Muster von
   [LiveDemo.tsx](../src/components/landing/LiveDemo.tsx)** der bessere Weg:
   kein zweites Konto, kein Handy, keine Testdaten, reproduzierbar — und sie
   kann Zustände zeigen, die man von Hand kaum herstellt.

Der User hat den ersten Wurf auf **Gerüst + Einrichtung** geschnitten und die
fremden Portale auf **simuliert** gesetzt. Beides ist in diesem Protokoll
umgesetzt bzw. als Folgeschritt notiert.

Bewusst **nicht** gemacht: ein echter Übungs-Check-in im Lotsen. Er ist zwar
umkehrbar, hinterlässt aber Verlauf — und macht das Zimmer damit dauerhaft
historienbehaftet, also nur noch mit abgetippter Bezeichnung löschbar. Genau
die Falle, die am 03.09. das Test-Szenario aufgerissen hat.

## 2. Was gebaut wurde

### Registry — [src/lib/lotsen.ts](../src/lib/lotsen.ts)

Die **eine** Stelle für Lotsen, Schritte und Anker; I/O-frei und ohne React,
also testbar wie `board.ts` oder `pricing.ts`. Sechs Fach-Lotsen:

| Lotse | Seite | Schritte | Zugang |
|---|---|---|---|
| Die Zimmer-Übersicht | `…/admin` | 4 | alle Rollen |
| Zimmer & Etagen | `…/admin/zimmer` | 7 | Verwaltung |
| Hotel & Regeln | `…/einstellungen/hotel` | 8 | Verwaltung |
| Gäste-Zugang | `…/einstellungen/gastzugang` | 3 | Verwaltung |
| Personal | `…/admin/personal` | 5 | Verwaltung |
| Zusatzleistungen | `…/admin/services` | 3 | Verwaltung |

Dazu kamen am selben Tag zwei **nachgebaute Portale** — Reinigungsboard und
Gäste-Sicht, beide für jede Rolle; siehe Abschnitt 5.

Der **Einrichtungs-Lotse** ist kein eigener Text, sondern die als `kern`
markierten Schritte der Fach-Lotsen in Reihenfolge, gerahmt von Begrüßung und
Abschluss — 16 Schritte über fünf Seiten. So kann dieselbe Erklärung nicht an
zwei Stellen auseinanderlaufen, und der erste Durchlauf bleibt kurz, ohne dass
die Vertiefung fehlt.

Die **Rezeption sieht nur den Übersichts-Lotsen**: Alles andere liegt hinter
`getAdminContext`, ein Katalog voller unerreichbarer Themen wäre eine Liste mit
Vorwürfen.

### Overlay — [src/components/lotse/LotsePilot.tsx](../src/components/lotse/LotsePilot.tsx)

Liegt im Admin-Layout (in `Suspense`, wegen `useSearchParams`). Vier
Entscheidungen tragen den Rest:

1. **Der Schritt steht in der URL** (`?lotse=…&schritt=…`). Ein Lotse läuft
   über mehrere Seiten, jede davon ist ein echter Seitenwechsel mit neuem
   Server-Rendering; React-State überlebt das nicht, die URL schon. *Innerhalb*
   derselben Seite wird nur `history.replaceState` benutzt — `router.replace`
   würde für jeden Schritt die Server-Komponenten neu rendern, der teuerste
   denkbare Weg, einen Text auszutauschen.
2. **Nichts wird blockiert.** Alle Overlay-Ebenen sind `pointer-events-none`,
   nur die Karte nimmt Klicks an. Die Lotsen erklären, sie fernsteuern nicht:
   Wer währenddessen etwas ausprobieren will, soll das können. Nachgewiesen im
   Browser — der Zimmer-Dialog öffnet sich bei offenem Lotsen.
3. **Der Anker wird gesucht, nicht vorausgesetzt.** Nach einem Seitenwechsel
   ist das Ziel womöglich noch nicht im DOM, und ein Board mit Realtime-Updates
   verschiebt sich unter dem Coach Mark. Ein Intervall (200 ms) misst deshalb
   dauerhaft nach, dazu `scroll`/`resize`. Nach ~3 s ohne Treffer erscheint die
   Karte unten rechts mit einem Hinweis statt gar nicht, und im Dev-Betrieb eine
   Konsolenwarnung.
4. **Zustand wird abgeleitet, nicht in Effekten nachgezogen.** Messung, Schritt
   und „beendet" hängen an einem Schlüssel aus Pfad, Lotse und Schritt; passt
   er nicht, gilt der Wert als veraltet. Das war kein Selbstzweck: `eslint`
   (`react-hooks/set-state-in-effect`) verbietet `setState` im Effekt-Körper,
   und die erste Fassung hatte davon vier.

Weitere Feinheiten: Tastatur (Esc beendet, Pfeile/Eingabe blättern) **nur, wenn
gerade nicht getippt wird** — sonst schaltete die Eingabetaste im
Zimmernummern-Feld den Lotsen weiter. Hervorgehoben wird über vier Flächen um
den Anker herum statt über eine SVG-Maske; das Ziel bleibt sichtbar *und*
bedienbar. Ankerlose Schritte bekommen **keine** Abdunklung und sitzen unten
rechts — sie laden ausdrücklich zum Ausprobieren ein („Klicken Sie ruhig ein
Zimmer an"), und eine mittige Karte lag genau über dem geöffneten Dialog.

### Anker in den Seiten

23 `data-lotse`-Attribute in acht Dateien. Zwei Stellen brauchten dafür eine
kleine Änderung: `RoomGrid` markiert die **erste** Etage und deren **erstes**
Zimmer (sonst trügen alle Kacheln denselben Anker), `ServicesManager` ebenso
den ersten Service.

### Hilfe-Hub — [`…/admin/hilfe`](../src/app/h/[slug]/admin/hilfe/page.tsx)

Fünfter Nav-Punkt „Hilfe" (nicht „Lotsen" — gesucht wird nach Hilfe). Oben die
**Einrichtungs-Checkliste**, darunter der Lotsen-Katalog.

Der Fortschritt wird **abgeleitet**, nicht gespeichert: Zimmerzahl,
Reinigungspersonal, Services, ob `policies.timeZone` und `guestAccessMode`
bewusst gesetzt sind, ob je ein Aufenthalt existierte, ob ein Zahlungsweg
hinterlegt ist. Dieselbe Haltung wie bei `isBillable` und `isStayoverDue` — ein
gespeichertes Häkchen bliebe stehen, wenn jemand das letzte Zimmer wieder
löscht. Kein Schema-Eingriff, keine Migration. „Zusatzleistungen" und
„Zahlungsweg" sind als *freiwillig* markiert und zählen nicht gegen „fertig",
sonst stünde ein eingerichtetes Haus für immer auf unfertig.

### Einstieg nach der Registrierung

`einrichtungStart(slug)` in `lotsen.ts` ist die einzige Stelle, die diese URL
baut; Registrierung ([actions.ts](../src/app/registrieren/actions.ts)),
Zahlungsweg-Seite und Hub lesen sie von dort. Der letzte Schritt der Einrichtung
führt auf `…/admin/hilfe` — der vom User gewünschte Verweis auf den
Tutorial-Bereich.

## 3. Tests

- [lotsen.test.ts](../src/lib/lotsen.test.ts) — Katalog (eindeutige Kennungen,
  Pfadform), die Zusammensetzung des Einrichtungs-Lotsen, Rollenfilter,
  `clampStep` gegen Müll aus der URL, und die Fortschritts-Ableitung samt der
  beiden Fälle, auf die es ankommt: **ohne Services trotzdem fertig** und **ein
  wieder geleertes Haus fällt zurück auf unfertig**.
- [lotsen.anchors.test.ts](../src/lib/lotsen.anchors.test.ts) — der Wächter
  gegen verrottende Anker: Jeder Anker des Katalogs muss im Quelltext
  vorkommen, jeder gesetzte Anker im Katalog stehen. Das ist die **einzige
  Stelle im Projekt, an der ein Unit-Test I/O macht** — Absicht: Ein Anker ist
  eine Zeichenkette, die weder `tsc` noch ESLint schützt.

`npm run verify` grün (243 Tests).

## 4. Im Browser nachgewiesen (lokal, Testkonto „Stripe-Testhaus")

- Hub: Checkliste „3 von 7", die drei erledigten Punkte stimmen mit dem
  Datenbestand überein (3 Zimmer, 2 Services, Zahlungsweg hinterlegt).
- Coach Mark auf `…/zimmer`: Rahmen um „Zimmer anlegen", Karte darunter,
  Weiterschalten setzt den Rahmen auf den Modus-Umschalter.
- Rahmen sitzt exakt (nachgemessen: Anker 33–156 × 731–767, Rahmen 25–164 ×
  723–775 — also `RAND` = 8 auf jeder Seite).
- Seitenwechsel innerhalb des Einrichtungs-Lotsen: von `…/zimmer` Schritt 5/16
  auf `…/einstellungen/hotel` Schritt 6/16, URL zieht mit.
- Tastatur: Pfeil rechts blättert weiter; Esc beendet und räumt die
  Suchparameter aus der URL. (Ein Pfeil-rechts wurde einmal geschluckt, weil
  der Fokus in einem Eingabefeld stand — das ist die eingebaute Absicht.)
- Zimmer-Dialog öffnet bei offenem Lotsen; die Karte verdeckt ihn nicht.
- Hell und Dunkel geprüft.

## 5. Nachtrag am selben Tag: die simulierten Lotsen

Direkt im Anschluss gebaut — die beiden Themen, die per Coach Mark nicht
erreichbar sind.

**Zwei neue Seiten** unter Hilfe: `…/hilfe/reinigung` und `…/hilfe/gast`,
beide über `getManagementContext` und damit für **jede Rolle**. Das ist
Absicht: Auch die Rezeption erklärt Kolleginnen das Board und Gästen ihr
Portal, und zu sehen bekommt sie beides sonst nie.

**Die Nachbauten** [SimReinigung.tsx](../src/components/lotse/SimReinigung.tsx)
(9 Schritte: Anmeldung, Schichtbeginn, Etagen, „Als Nächstes", Kacheln,
Starten, Abschließen, Status-Seite, Etage verlassen) und
[SimGast.tsx](../src/components/lotse/SimGast.tsx) (8 Schritte: Zugang,
Portal, Reinigungswunsch, „frühestens ab", aktiver Wunsch, Nicht stören,
Services, Ende) folgen dem Muster von `LiveDemo.tsx`: eigene Miniaturen in der
Farbsprache der Boards, nur der Slider ist der echte `SlideAction`. Die
Ableitungen spiegeln `board.ts` — einschließlich der Etagen-Empfehlung, die
im Nachbau auch etwas zu zeigen hat: Etage 3 trägt die Priorität, bekommt das
Abzeichen aber **nicht**, weil dort schon eine Kollegin arbeitet.

**Szenen statt Zufall.** Ein Schritt kann den Nachbau in einen Zustand
versetzen (`sim`-Feld, erlaubte Werte in `SIM_SZENEN`, gegen die Schritte
getestet). Ohne das gäbe es die Hälfte der Anker gar nicht — einen
„Reinigung abschließen"-Slider gibt es nun einmal nur während einer
laufenden Reinigung. Bedient werden darf trotzdem frei: Die eigene Bedienung
hängt am Schritt-Schlüssel und gilt, bis der nächste Schritt die Szene
wiederherstellt — dieselbe Ableitung wie im `LotsePilot`, wieder ohne
`setState` im Effekt.

**Der Fallstrick, der zweimal zugeschlagen hat:** Der Nachbau kann den Schritt
**nicht** über `useSearchParams` lesen. Innerhalb einer Seite schreibt der
Pilot nur `history.replaceState` — davon erfährt Next nichts, und beide
Lotsen liegen vollständig auf je einer Seite. Also ein externer Store über
`location.search` ([schritt.ts](../src/components/lotse/schritt.ts)), den der
Pilot bei jedem Wechsel anstößt. Beim ersten Anlauf fehlte darin der Fall
**echte Navigation**: Wer den Lotsen über den Link „Lotse starten" beginnt,
ändert die Adresszeile über den Router, und weder `popstate` noch das eigene
Ereignis feuern — der Nachbau blieb in dem Zustand stehen, den der Nutzer ihm
zuletzt gegeben hatte. Ein `useEffect` am `urlKey` des Piloten meldet jetzt
auch diese Wechsel.

**Nachgewiesen im Browser:** Szenenwechsel bei jedem Schritt (Anmeldung →
Schichtbeginn → Etagen → Empfehlung → Kacheln → laufende Reinigung), die
Empfehlung landet auf Etage 2 statt auf der Prio-Etage 3, das Gäste-Portal
zeigt „frühestens ab" mit gewählter Uhrzeit und die offene Anfrage, freie
Bedienung wirkt und wird vom nächsten Schritt zurückgesetzt, Katalog führt
acht Lotsen, hell und dunkel geprüft. `npm run verify` grün (250 Tests).

**Werkzeug-Notiz:** Die Vorschau-Klicks trafen die Schaltflächen des Nachbaus
zeitweise nicht — Koordinaten-Skalierung der Pane, nicht die Anwendung.
Geprüft wurde dann über `element.click()` im Seitenkontext, was denselben Weg
durch Reacts Ereignis-Delegation nimmt wie ein echter Klick.

## 6. Offen

- **Simulierte Lotsen** für Reinigungsboard und Gast-Sicht nach dem
  LiveDemo-Muster — der Grund, warum diese beiden Themen im Katalog noch
  fehlen.
- Weitere Fach-Lotsen: Services-Board (Anfragen), Auswertung, Konto &
  Abrechnung, Aushänge und Handouts.
- Ein kontextuelles „?" auf den Seiten selbst, das den zur Seite passenden
  Lotsen startet — dort wird so etwas tatsächlich benutzt.
- Ein Merker „schon gesehen" gibt es bewusst noch nicht; die Checkliste
  ersetzt ihn für den Einstieg.

---

## 🔖 Wiederaufnahme

**Stand:** Acht Fach-Lotsen plus Einrichtungs-Lotse, davon zwei als Nachbau
(Reinigungsboard, Gäste-Sicht); lokal verifiziert, `npm run verify` grün (250
Tests). Der Einrichtungs-Lotse läuft über fünf Seiten, der Hilfe-Hub trägt
Checkliste und Katalog, die Registrierung führt hinein.

**Wenn weitergebaut wird:**

1. **Neuer Lotse** = ein Eintrag in `LOTSEN` in
   [lotsen.ts](../src/lib/lotsen.ts) plus `data-lotse`-Attribute an den
   Zielelementen. Der Anker-Test schlägt an, wenn eines fehlt — und auch, wenn
   ein Attribut ohne zugehörigen Schritt herumsteht.
2. **Soll ein Schritt in die Ersteinrichtung**, bekommt er `kern: true`; er
   erscheint dann automatisch im Einrichtungs-Lotsen an der Stelle, die
   `EINRICHTUNG_ORDER` vorgibt.
3. **Anker in Komponenten mit Listen** brauchen die „erste Zeile"-Regel (siehe
   `RoomGrid`), sonst zeigt der Coach Mark auf ein zufälliges Element.
4. **Neue Szene in einem Nachbau** = ein Eintrag in `SIM_SZENEN`, ein Zweig in
   `szeneState` der Komponente und das `sim`-Feld am Schritt. Der Test hält
   fest, dass jeder Schritt eine bekannte Szene nennt.
5. **Wer einen dritten Nachbau baut**, denkt an die Schritt-Meldung: Ohne den
   externen Store aus [schritt.ts](../src/components/lotse/schritt.ts) bekommt
   die Simulation von Schrittwechseln innerhalb einer Seite nichts mit.

**Nicht vergessen:** Der Katalog ist Text, der veraltet. Ändert sich eine
Regel des Hauses (etwa eine neue Policy), gehört der zugehörige Lotsen-Schritt
mit angefasst — er beschreibt Verhalten, nicht nur Bedienung.
