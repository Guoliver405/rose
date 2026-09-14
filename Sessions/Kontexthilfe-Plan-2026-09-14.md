# Bauplan: Kontexthilfe — das „?" auf jeder Seite (14.09.2026)

Ergebnis der Diskussion zum offenen TODO-Punkt „Kontextuelles ‚?' auf den
Seiten selbst". Die ursprüngliche Idee (das „?" startet den Lotsen der Seite)
ist verworfen: Der Lotse ist die Führung beim ersten Mal und soll kompakt
bleiben. Gebaut wird stattdessen eine **Hilfe zum Nachschlagen**, je Seite.

---

## 0. Die Entscheidung

Lotse und Hilfe beantworten verschiedene Fragen und bekommen deshalb
verschiedene Formen:

| | Lotse | Hilfe |
|---|---|---|
| Wann | einmal, am Anfang | wenn man hängt — abends am Tresen, Monate später |
| Form | linear, zeigend („die Zahlen oben …") | nachschlagen: Legende, Fragen, Verweise |
| Ort | Overlay über der echten Seite | eigene Seite, verlinkbar, druckbar |

Die Lotsen-Texte werden **nicht** als Hilfe wiederverwendet — sie sind für
Coach Marks geschrieben und zeigen auf Bildschirmpositionen. Die Hilfe hat
eigene Texte in eigener Form; beide verweisen aufeinander.

**Der Erweiterungspunkt ist der Katalog:** Kommt Tester-Rückmeldung „X war
unverständlich", wird daraus ein Eintrag in `hilfe.ts` — ohne Layout-Arbeit.

## 1. Der Katalog — `src/lib/hilfe.ts`

Nach dem Muster von `lotsen.ts`: I/O-frei, ohne React, getestet. Ein
**Thema je Bereich**, mit denselben IDs wie die Lotsen (Übersicht, Anfragen,
Zimmer, Regeln, Gäste-Zugang, Aushänge, Personal, Services, Reinigung, Gast,
Auswertung, Konto), dazu die kleinen Seiten ohne Lotsen (Mein Zugang,
Häuser).

Jedes Thema besteht aus wenigen **Block-Typen**:

- **Text** — wozu die Seite da ist, kurz.
- **Legende** — Zeichen mit Bedeutung. Das Zeichen wird **mit dem echten
  Icon, der echten Farbe** gerendert (Kachel-Symbole, Farbbalken, blinkende
  Ringe, Pillen). Kernstück, weil die Symbole der Boards heute nur als
  Fließtext im Lotsen stehen.
- **Fragen** — „Warum …?", „Was passiert, wenn …?" mit Antwort. Hier landet
  künftiges Feedback.
- **Verweise** — Lotse zu dieser Seite, verwandte Themen, Einstellungen.

Ein Thema trägt seine **Pfade** (Routen unterhalb der Basis), das „?"
bestimmt das Thema über den längsten passenden Präfix. Ohne Treffer führt es
zum Hilfe-Hub.

## 2. Zeichen, die nicht lügen können — `src/lib/room-symbols.ts`

Die Kachel-Symbole (Flagge, Glocke, Ban, Koffer, Uhr, Spinner, …) und die
Farbbalken sind heute in `RoomGrid` **und** `ServiceBoard` je einmal
verdrahtet. Sie wandern in eine gemeinsame Zuordnung: `room-symbols.ts`
(IDs, Beschriftung, Bedeutung, Farbklasse — reine Strings) plus
`RoomSymbol.tsx` (ID → Lucide-Icon, `Record` über alle IDs, also
vollständigkeitsgeprüft). Beide Boards und die Legende zeichnen aus derselben
Quelle — die Legende kann damit nicht vom UI abweichen, und ein neues Symbol
fehlt nirgends still.

Die Legende referenziert Zeichen über typisierte Schlüssel; ein Tippfehler
fällt beim Type-Check, nicht erst im Browser.

## 3. Route statt Overlay — **überholt, siehe Nachtrag unten**

`…/admin/hilfe/<thema>` im Haus, `/admin/hilfe/<thema>` im Konto-Bereich
(eigener Rahmen, wie beim zweiten Piloten). Gründe: verlinkbar (Rezeption
schickt den Link der Kollegin), druckbar, Zurück-Taste greift — die Regel,
die das Projekt bei `/service/status` schon gezogen hat. Und der
Overlay-Platz gehört dem Lotsen; zwei Overlays kollidieren.

Preis: Ein offener Zimmer-Dialog geht beim Wechsel verloren. In Kauf
genommen.

Die beiden Simulationsseiten (`hilfe/reinigung`, `hilfe/gast`) **bleiben** und
tragen ihre Hilfe-Blöcke unter dem Nachbau — die statische Route gewinnt
gegen `[thema]`, und der Nachbau ist für diese beiden Themen die beste
Legende.

## 4. Das „?" in der Kopfzeile

Kleiner runder Knopf rechts, neben „Häuser". Eine Client-Komponente liest
`usePathname`, schneidet die Basis ab und fragt den Katalog. So muss keine
einzelne Seite angefasst werden, und das „?" sitzt immer am selben Ort. Auf
dem Hub selbst verschwindet es (es zeigte auf sich selbst). Bei Druckseiten
ist die Kopfzeile ohnehin `print:hidden`.

„Hilfe" in der Navigation bleibt der Katalog; das „?" ist der Kontext.

## 5. Der Hub wächst zusammen

Eine Karte je Thema mit zwei Wegen: **Erklärung lesen** und **Lotse starten**
(wo es einen gibt). Rollenfilter wie bisher (`zugang`) — nur für die Anzeige,
die Seiten selbst halten über ihre Guards dicht.

## 6. Bewusst nicht

- Kein „Gesehen"-Zustand, keine Suche (bei gut einem Dutzend Themen reicht
  der Hub), kein Chat.
- **Gastportal ohne Hilfe:** Der Bildschirm *ist* dort die Anleitung, und
  jede Hilfe zöge sofort die Mehrsprachigkeit nach sich.
- Reinigungsboard: Erklärungen liegen unter der Simulation im
  Rezeptions-Portal (wer das Board erklärt, ist die Rezeption). Ein „?" im
  Board selbst wäre ein zweiter Schritt, falls Kräfte danach fragen.

## Nachtrag (gleicher Tag): Leiste statt Seite

Nach dem ersten Blick in Produktion: „Wenn man die Hilfe-Seite öffnet, sieht
man die Seite nicht mehr, zu der geholfen werden soll. Auf Quer-Monitoren ist
seitlich so viel Platz — wäre eine Sidebar nicht besser, die mit dem ‚?'
ein- und ausgeklappt wird?" Ja. Der Grund für Abschnitt 3 (Overlay-Kollision
mit dem Lotsen) trifft eine **Leiste** nicht: Sie überlagert nichts, der
Inhalt rückt nach links. Umgesetzt:

- `HilfeLeiste` rechts neben `main` (400 px, sticky unter der Kopfzeile),
  unter `lg` als Überlagerung von rechts. Thema folgt dem Pfad; ohne Thema die
  Themenliste; Verweise wechseln in der Leiste; Esc schließt.
- Zustand in `leiste.ts` (externer Store, `localStorage` für „offen",
  Themenwahl pfadgebunden).
- Hub-„Erklärung" führt auf die Seite, um die es geht, mit offener Leiste.
- Die Routen bleiben für Drucken und Teilen („Als Seite öffnen").
- Kopfzeile ab `lg` mit fester Höhe 52 px, damit die Leiste exakt andockt.

## 7. Reihenfolge

1. `room-symbols.ts` + `RoomSymbol.tsx`, Boards umstellen — keine sichtbare
   Änderung, `verify` grün.
2. `hilfe.ts` mit Typen und Funktionen, Test.
3. `HilfeThema.tsx` (Blöcke rendern), Themenseite Haus + Konto.
4. `HilfeKnopf.tsx` in beiden Kopfzeilen, Hub-Karten.
5. Inhalte für alle Themen.
6. Browser-Durchlauf, Doku (AGENTS.md, TODO.md, Protokoll), Commit + Push.
