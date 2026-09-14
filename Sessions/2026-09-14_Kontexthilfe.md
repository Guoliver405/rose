# Session 14.09.2026 — Kontexthilfe: das „?" auf jeder Seite

## Anlass

Der offene TODO-Punkt „Kontextuelles ‚?' auf den Seiten selbst, das den zur
Seite passenden Lotsen startet" (Lotsen-Session 08.09.). Der User griff ihn
auf, aber mit einer anderen Stoßrichtung: **nicht** als Lotsen-Start — der
Lotse läuft beim ersten Mal und soll kompakt bleiben —, sondern als
**kontextabhängige Hilfe-Seite**: Erläuterungen und Hilfestellungen je Seite,
erweiterbar, wenn Rückmeldungen kommen, dass etwas unverständlich ist oder
Symbole erklärungswürdig sind.

Bauplan: [Kontexthilfe-Plan-2026-09-14.md](Kontexthilfe-Plan-2026-09-14.md).
Drei Vorab-Entscheidungen des Users (alle „ja"): Route statt Drawer, Inhalte
schreibt Claude aus AGENTS.md und Code, Icon-Zuordnung der Boards extrahieren.

## Was gebaut wurde

### 1. Eine Zeichensprache für beide Boards und die Legende

[room-symbols.ts](../src/lib/room-symbols.ts) trägt die Kachel-Symbole (12),
Farbbalken (9) und blinkenden Ringe (2) als reine Strings: ID, Beschriftung,
Bedeutung, Farbklasse. [RoomSymbol.tsx](../src/components/RoomSymbol.tsx)
ordnet jeder ID ihr Lucide-Icon zu — als `Record` über alle IDs, also
vollständigkeitsgeprüft. `RoomGrid` (Rezeption) und `ServiceBoard` (Reinigung)
zeichnen seither aus dieser Quelle; vorher waren Icons und Klassen in beiden
je einmal verdrahtet. Sichtbar ändert sich nichts — aber die Legende der Hilfe
kann jetzt nicht vom Board abweichen, und ein neues Symbol, das der Legende
fehlt, fällt beim Type-Check.

### 2. Der Katalog — `hilfe.ts`

[hilfe.ts](../src/lib/hilfe.ts) nach dem Muster von `lotsen.ts`: I/O-frei,
ohne React, getestet ([hilfe.test.ts](../src/lib/hilfe.test.ts), 18 Fälle).
14 Themen mit vier Block-Typen:

| Block | Wozu |
|---|---|
| Text | wozu die Seite da ist, zwei Absätze höchstens |
| Legende | Zeichen mit Bedeutung — **gerendert mit Icon und Farbe des Boards** |
| Fragen | „Warum …?", „Was passiert, wenn …?" — der Erweiterungspunkt |
| Verweise | verwandte Themen, Rechtsseiten |

Themen: Übersicht, Anfragen, Zimmer, Regeln, Gäste-Zugang, Aushänge, Personal,
Services, Reinigung, Gast, Auswertung (alle parallel zu den Lotsen, gleiche
Kennungen — im Test abgesichert), dazu **Mein Zugang** und **Häuser & Konto**
ohne Lotsen sowie **Plan & Abrechnung** (Konto-Bereich).

Zeichen der Legende sind typisierte Schlüssel: `symbol`/`balken`/`ring` aus
`room-symbols.ts` (Beschriftung und Text kommen automatisch mit), `icon` und
`pille` für Zeichen, die keine Kachel-Symbole sind (Status-Pillen des Boards,
„Als Nächstes", „dringend", „nicht erbracht", Knöpfe der Personal-Zeile).

Jedes Thema trägt seine **Pfade**; `themaFuerPfad` wählt den längsten
passenden (`''` nur exakt, sonst auch Unterseiten — `/personal/karte/…`
gehört zu „Aushänge", `/handout/…` ebenso, `/aufstellung/…` zur Übersicht).

### 3. Seiten, Knopf, Hub

- `…/admin/hilfe/[thema]` im Haus, `/admin/hilfe/[thema]` im Konto-Bereich
  (eigener `KontoShell`, Rückweg auf die Häuser-Seite, Inhaber-Thema bleibt
  Managern verschlossen). Unbekannte Kennung oder falscher Bereich ⇒ 404.
- Die beiden **Simulationsseiten bleiben** und tragen ihre Blöcke unter dem
  Nachbau (statische Route gewinnt gegen `[thema]`).
- [HilfeKnopf.tsx](../src/components/hilfe/HilfeKnopf.tsx): rundes „?" rechts
  in beiden Kopfzeilen, Client-Komponente über `usePathname`. Ohne Thema →
  Hub; auf `/hilfe*` verschwindet es. Keine Seite musste angefasst werden.
- Hub: eine Karte je Thema mit **Erklärung** und **Lotse (n Schritte)**;
  Intro-Text nennt das „?".

### 4. Im Browser nachgewiesen (lokal, Testkonto „Stripe-Testhaus")

- `/admin` → „?" → `/admin/hilfe/haeuser` (Konto-Bereich, `KontoShell`).
- Übersicht → „?" → `hilfe/uebersicht`: drei Legenden (Balken als
  Mini-Kacheln, Symbole mit echten Icons und Farben, Ringe blinken), Fragen,
  Verweise; „Lotse starten" oben rechts; das „?" ist auf der Hilfe-Seite weg.
- Hub: 14 Karten, alle Links geprüft (Erklärung + Lotse mit Schrittzahl,
  Konto-Themen unter `/admin/hilfe/…`).
- `hilfe/reinigung`: Blöcke unter der Simulation, alle acht Pillen mit den
  Board-Token gerendert (Dark Mode), „Als Nächstes" und „Prio offen" blinken.
- `/einstellungen` → Hub, `/einstellungen/zugang` → „Mein Zugang".
- 404 für `hilfe/konto` im Haus, `hilfe/zimmer` im Konto, unbekannte Kennung.
- Keine Konsolenfehler; `npm run verify` grün (338 Tests).

## Nachtrag: Leiste statt Seite

Erster Blick des Users in Produktion: „Wenn man die Hilfe-Seite öffnet, sieht
man die Seite nicht mehr, zu der geholfen werden soll. Wir haben auf normalen
Quer-Format-Monitoren seitlich so viel Platz." Richtig — und mein Einwand
gegen ein Overlay (Kollision mit dem Lotsen) trifft eine Leiste nicht, weil
sie nichts überlagert. Also umgebaut, gleicher Tag:

- **[HilfeLeiste.tsx](../src/components/hilfe/HilfeLeiste.tsx):** 400 px
  rechts neben dem Inhalt, sticky unter der Kopfzeile; der Inhalt rückt nach
  links (Flex-Zeile `main` + `aside`, bei 1600 px: 1200 + 400). Unter `lg`
  eine Überlagerung von rechts mit Schließen-Knopf. Kopf mit Titel,
  „Lotse starten", „Als Seite öffnen" (Drucken/Teilen), Listen-Knopf; darunter
  die Blöcke in kompakter Fassung (eine Spalte). Verweise auf andere Themen
  sind Buttons und wechseln **in der Leiste**. Esc schließt.
- **Das Thema folgt der Seite:** Übersicht → Anfragen → Einstellungen — die
  Leiste bleibt offen, zeigt das jeweilige Thema, und auf einer Seite ohne
  Thema die Liste mit Hinweis.
- **[leiste.ts](../src/components/hilfe/leiste.ts):** externer Store nach dem
  Muster von `schritt.ts`. „Offen" in `localStorage` (Neuladen schließt
  nichts); die Themenwahl ist an den Pfad gebunden, auf dem sie getroffen
  wurde — abgeleitet, kein Effekt setzt sie zurück. Der Store überlebt den
  Wechsel zwischen Haus-Layout und `KontoShell`.
- **Hub:** „Erklärung" führt jetzt auf die Seite, um die es geht, mit offener
  Leiste daneben ([ErklaerungLink.tsx](../src/components/hilfe/ErklaerungLink.tsx),
  `hilfeZiel`); neuer Test: jedes Ziel bildet wieder auf sein Thema ab.
- **Kopfzeile ab `lg` mit fester Höhe 52 px** (Haus und Konto): Vorher hing
  die Höhe am höchsten Knopf — mit dem 36-px-„?" wurde sie 61 px, und die
  Leiste dockte 8 px daneben an. Nachgemessen: Kopf 53, Leiste ab 53.
- Die Simulationsseiten tragen ihre Blöcke nicht mehr inline — die Leiste
  neben dem Nachbau ist genau das, was sie zeigen sollen; `istHilfeSeite`
  nimmt sie deshalb aus (Thema auf den Pfad gemappt).
- Die Routen `…/hilfe/<thema>` bleiben für Drucken und Teilen.

Nachgewiesen (lokal, 1600 × 900 und Tablet): Klappen, Thema folgt der
Navigation, Verweis-Wechsel in der Leiste, Liste, Esc, Hub-„Erklärung" mit
offener Leiste, Konto-Bereich (`/admin`, `/admin/abrechnung`), Überlagerung
unter `lg`. `npm run verify` grün (340 Tests).

## Entscheidungen, die es festzuhalten lohnt

- **Lotse und Hilfe sind zwei Dinge.** Der Lotse zeigt („die Zahlen oben …"),
  die Hilfe erklärt. Lotsen-Texte als Hilfe wiederzuverwenden hätte
  Coach-Mark-Prosa auf eine Nachschlageseite gestellt. Beide Kataloge sind
  parallel geschnitten und verweisen aufeinander.
- **Leiste statt Seite** (Nachtrag). Die erste Fassung als eigene Seite
  nahm dem Nutzer die Seite weg, zu der er Hilfe wollte. Eine Leiste
  überlagert nichts — mein Einwand gegen Overlays galt ihr nicht. Die Routen
  bleiben als Druck- und Teil-Fassung.
- **Die Legende kann nicht lügen**, weil sie aus derselben Tabelle zeichnet
  wie die Boards. Das war der Grund für den Umbau in Schritt 1 — nicht
  Ordnungsliebe.
- **Ehrliche Antworten** statt Beschönigung: „Ich habe versehentlich
  ‚Erledigt' gedrückt" wird mit „kein Rückweg, beim Check-out klären"
  beantwortet, „In welcher Sprache ist das Portal?" mit „heute Deutsch".
  Eine Hilfe, die Lücken verschweigt, erzeugt Support-Fälle statt sie zu
  vermeiden.
- **Bewusst nicht:** Gastportal (Bildschirm ist die Anleitung; Hilfe zöge
  die Mehrsprachigkeit nach sich), „Gesehen"-Zustand, Suche, „?" im
  Reinigungsboard selbst.

## Dateien

Neu: `src/lib/room-symbols.ts`, `src/components/RoomSymbol.tsx`,
`src/lib/hilfe.ts`, `src/lib/hilfe.test.ts`,
`src/components/hilfe/HilfeThema.tsx`, `src/components/hilfe/HilfeKnopf.tsx`,
`src/app/h/[slug]/admin/hilfe/[thema]/page.tsx`,
`src/app/admin/hilfe/[thema]/page.tsx`, `Sessions/Kontexthilfe-Plan-2026-09-14.md`.

Geändert: `RoomGrid.tsx`, `ServiceBoard.tsx` (Symbole aus der Quelle),
`admin/layout.tsx` und `KontoShell.tsx` (Knopf), `hilfe/page.tsx` (Hub),
`hilfe/reinigung/page.tsx` und `hilfe/gast/page.tsx` (Blöcke), `AGENTS.md`,
`TODO.md`.

## 🔖 Wiederaufnahme

- **Inhalte durchlesen.** Die 14 Themen sind aus AGENTS.md und Code
  geschrieben, nicht aus Tester-Rückmeldungen. Was fehlt oder falsch klingt,
  ist ein Eintrag in `hilfe.ts` — kein Layout.
- Wenn Rückmeldungen zu Symbolen kommen: `room-symbols.ts` ist die Stelle
  (Text ändert sich dann zugleich im Tooltip-Sinn der Boards und in der
  Legende).
- Offen aus dem TODO: ein „?" im Reinigungsboard selbst, falls Kräfte danach
  fragen; heute liegt die Erklärung unter der Simulation im Rezeptions-Portal.
- Die Leiste merkt sich „offen" je Browser (`localStorage`). Falls das
  stört (Rezeptions-PC mit vielen Nutzern): Schlüssel `rose.hilfe.leiste`.
- Für einen Blick im Hellmodus: in Produktion das „?" auf der Übersicht
  drücken.
