# 25./26.09.2026 — Landing Page: „Derselbe Tag, dreimal"

Neuer Abschnitt `#vergleich` auf der Landing Page, zwischen „So funktioniert's"
und „Durchdacht bis ins Detail". Drei Gebäudeschnitte (6 × 6 Zimmer, zwei
Reinigungskräfte) spielen denselben Tag an einer Uhr: **ohne Steuerung**,
**mit RoSe** (tägliche Routine), **mit RoSe + Reinigung auf Wunsch**. Statt
Zahlen zum Vergleichen steht unter jedem Bild ein Protokoll, dessen Einträge
an festen Plätzen eingeblendet werden, wenn sie passieren; darüber
„Fertig um" und „Abreisen bezugsfertig".

- Rechnung: [src/lib/cleaning-sim.ts](../src/lib/cleaning-sim.ts) (I/O-frei, 20 Tests in `cleaning-sim.test.ts`)
- Anzeige: [src/components/landing/CleaningSimulation.tsx](../src/components/landing/CleaningSimulation.tsx)

## Modell (nach mehreren Runden mit dem User)

| | Ohne Steuerung | Mit RoSe | + auf Wunsch |
|---|---|---|---|
| Abreise bekannt | Papierliste: welche, nicht wann — Start zur Check-out-Frist 11:00 | beim Check-out live auf dem Board | wie Mitte |
| Bleibezimmer | ab 11:00 (sonst Doppelreinigung nach Abreise) | Routine ab 11:00 | nur, wer beim Gehen tippt |
| Gast bleibt im Zimmer, will nichts (2) | geklopft, abgelehnt; die aushelfende Kraft klopft erneut | geklopft, „Heute nicht" getippt — RoSe merkt es sich für alle (seit Nachtrag 2) | tippt nicht |
| Gast unterwegs, bräuchte nichts (2) | gereinigt | gereinigt | tippt nicht |
| Verzicht | 0 % | ≈ 10 % („vorsichtig" im Nutzenrechner) | ≈ 20 % („typisch") |
| Kräfte | feste Hälften; wer fertig ist, hilft aus — mit eigenem Wissen | gemeinsames Board, Etagenscore ÷ (Kräfte vor Ort + 1) | wie Mitte |
| Sonderfall 13:00 in einem schon gereinigten Zimmer | Rezeption erreicht die Kraft erst nach 20 min | ein Klick, nächste freie Kraft | wie Mitte |

Zeiten: Abreise 30 min (Planwert, **nicht** recherchiert; üblich 25–45 min),
Bleibe 18 min (aus dem Nutzenrechner), Zimmerwechsel 1 min, Etagenwechsel
3 min, Klopfen 3 min.

## Entscheidungen

- **Fair im Modell, gewählt im Beispiel.** Die Regeln sind für alle drei
  gleich hart (Korrekturen des Users: Papierliste kennt die Abreisen; auch ohne
  Software wird vor der Frist nicht gereinigt; der Sonderfall trifft in allen
  drei Bildern ein bereits gereinigtes Zimmer). Der **gezeigte Tag (Startwert
  297) ist dagegen bewusst gewählt** — Vorgabe des Users: „RoSe + auf Wunsch"
  gewinnt bei beiden Zeiten. Gesucht unter 300 Tagen nach den Bedingungen im
  Kommentar an `SCENARIO_SEED`, davon der Tag am nächsten am Durchschnitt.
  Die Seite sagt deshalb **nicht** mehr „typischer Tag". Der Test über 20
  Startwerte sichert nur die Reihenfolge der Fertig-Zeiten allgemein ab.
- **Hinweise werden aus dem Ablauf abgeleitet**, nicht von Hand gesetzt;
  Tests prüfen, dass jeder durch ein Ereignis gedeckt ist. Das gemeinsame
  RoSe-Protokoll (`roseHighlights`) steht über beiden RoSe-Spalten und muss
  für beide stimmen („erledigt nach rund 20 Minuten").
- **„RoSe merkt es sich" wurde gestrichen**, weil es die Funktion „Gast lehnt
  an der Tür ab" noch nicht gibt (siehe TODO). Auch der Hinweis „Nicht stören
  im Portal" in Bild 2 ist raus — das kann ein Türschild genauso.
- **Schleife**: startet bei 40 % Sichtbarkeit, hält am Ende 8 s, beginnt neu;
  Pause/Regler/„Zurück" beenden die Schleife; außer Sicht steht die Uhr.
  Bei reduzierter Bewegung nur der Endstand.

## Ergebnis des gezeigten Tags

| | Abreisen fertig | Fertig um | Sonderfall |
|---|---|---|---|
| Ohne Steuerung | 16:19 | 16:33 | 40 min |
| Mit RoSe | 13:50 | 15:08 | 19 min |
| Mit RoSe + auf Wunsch | 12:52 | 14:12 | 22 min |

## Nebenbefunde fürs Produkt

1. **Reinigungsboard: „Gast an der Tür — in 30 min / in 1 h / heute nicht"**
   fehlt. Lehnt ein Gast ohne Türschild ab, bleibt ein routine-fälliges Zimmer
   aktiv, und die Kollegin klopft erneut. Als Aufgabe angelegt (TODO).
2. **Routine erst ab Check-out-Frist**: Mit gesetztem Abreisedatum, das nicht
   heute ist, könnte die Routine früher fällig werden (Wartezeit am Vormittag).
3. Gastportal kennt kein eigenes „heute keine Reinigung" — „Nicht stören" ist
   der Abwahl-Knopf. Ob ein ausdrücklicher Knopf mehr Verzicht bringt, offen.

## Nachweis

`npm run verify` grün (374 Unit-Tests). Browser: Raster 1280 px (Protokoll
RoSe 705 px über zwei Spalten), Handy 375 px ohne Überlauf, keine
Konsolenfehler. Den zeitlichen Ablauf der Schleife konnte Claude nicht live
messen — das Browser-Fenster war ausgeblendet, `requestAnimationFrame` lief
nicht; Knopffolge und Zustände geprüft.

---

# Nachtrag 26.09.2026: „Gast an der Tür" und „Heute keine Reinigung"

Nebenbefund 1 oben ist gebaut. Entscheidungen im Gespräch:

- **Drei Knöpfe an der Tür** im Zimmer-Dialog der Kraft, ohne Start:
  „In 30 Min", „In 1 Std", „Heute nicht". „Später" setzt `clean_not_before`
  (gilt jetzt auch für die Routine), das Zimmer ist bis dahin für alle Kräfte
  nicht offen.
- **Frage des Users: dem Gast „Heute keine Reinigung" anbieten?** Ja, aber nur
  bei täglicher Routine. Es ist nicht dasselbe wie „Bitte nicht stören": DND =
  Privatsphäre, gilt bis zur Rücknahme; Verzicht = nur heute. Daraus folgte
  der Umbau vom reinen Stich auf **ein Feld für Gast und Kraft**:
  `room_states.clean_declined_on` (Datum vor Ort, verfällt um Mitternacht).
- **Papier:** Handout-Satz zeigt auf den neuen Knopf, der permanente Aushang
  nicht (Policy-abhängig).
- Migration `2026-09-26_heute_keine_reinigung.sql` (Spalte, zwei Stich-Arten,
  Audit-Trigger) eingespielt und archiviert.

## Nachweis (lokal gegen die Produktions-DB, Lotsen-Haus)

Testgerüst per Skript: Test-Kraft mit Login-Karte (Anmeldung über
`/service/auto/<token>`, keine Passwort-Eingabe), zwei Aufenthalte im
Link-Verfahren seit gestern, Routine vorübergehend sofort fällig.

- 201 „In 30 Min" → Kachel grau „Reinigung ab 02:30", DB `clean_not_before`
  00:30 UTC, Stich `clean_deferred`; Gastseite „Reinigung heute ab 02:30 Uhr —
  wie an der Tür besprochen".
- 202 „Heute nicht" → Kachel grau „Heute keine Reinigung", Etage 1 offen statt 3;
  Gastseite Karte „Heute keine Reinigung", grüner Knopf aktiv; Gast nimmt zurück,
  setzt wieder, wünscht dann „Zimmer reinigen" → Board wieder offen.
- Audit-Trigger: `clean_declined_on` mit Quelle maid/guest protokolliert.
- **Nicht im Browser geprüft:** Rezeptions-Übersicht und Zimmer-Verlauf
  (Management-Anmeldung braucht ein Passwort) — gleiche Ableitung, Typecheck
  und Tests decken sie ab. Bitte beim nächsten Produktionslauf ansehen.
- Testgerüst restlos entfernt (Aufenthalte, Kraft samt Auth-Konto, Stiche,
  Verlaufszeilen, Policies des Lotsen-Hauses zurückgesetzt).

`npm run verify` grün.

---

# Nachtrag 2: Hilfe-Nachbauten und „RoSe merkt es sich"

- **Hilfe-Nachbauten:** `SimReinigung` zeigt im Zimmer-Dialog die drei
  Tür-Knöpfe; danach trägt die Kachel Uhr bzw. Blatt und ist nicht mehr offen
  (neuer Lotsen-Schritt `reinigung.tuer`). `SimGast` hat den Knopf „Heute keine
  Reinigung" mit dem Hinweis, dass es ihn nur bei täglicher Routine gibt (neue
  Szene `verzicht`, Schritt `gast.verzicht`); der DND-Schritt sagt jetzt, dass
  DND bis zur Rücknahme gilt. Zwei Texte zu „ausgegraut" nennen den Verzicht.
  Im Browser **nicht** geöffnet (liegt hinter der Management-Anmeldung) —
  Typecheck und der Anker-Test der Lotsen sind grün.
- **Landing-Vergleich:** Bild 2 modelliert die ablehnenden Gäste jetzt wie
  Bild 1 an der Tür (vorher „Nicht stören" im Portal), aber mit geteiltem
  Wissen: jede Ablehnung genau einmal (2 statt 4 Gänge). Neuer Eintrag im
  gemeinsamen RoSe-Protokoll, als Fähigkeit formuliert, weil er auch über
  Bild 3 steht: „Möchte ein Gast an der Tür heute keine Reinigung, reicht ein
  Tipp – RoSe merkt es sich für alle Kräfte." Bild 2 jetzt 13:55 / 15:13,
  Reihenfolge und alle Tests unverändert gültig.

---

# Nachtrag 3: Bleibezimmer ab 9:00 (faire Korrektur)

Frage des Users: Warum beginnt Bild 1 erst um 11:00? Zu Recht — wer die
Abreiseliste hat, weiß auch, wer bleibt. Voraussetzung auf Produktseite
(Commit 84c65db): Mit eingetragenem Abreisedatum nach heute gilt die Routine
ab der Routine-Zeit, nicht erst ab der Check-out-Frist.

- Simulation: zwei Zeiten statt einer — `CHECKOUT_AT` (11:00, Abreisen ohne
  Software) und `STAY_ROUTINE_AT` (9:00, Bleibezimmer in Bild 1 und 2, mit
  Klopfen, wo der Gast noch da ist). Kleingedrucktes nennt die Annahme, dass
  die Rezeption das Abreisedatum eingetragen hat.
- Ergebnis über 300 Tage: fertig 15:08 / 14:51 / 14:14, Abreisen 15:01 /
  14:07 / 13:48. Bild 2 an 288/300 Tagen vor Bild 1, Bild 3 immer vor Bild 2.
  Der Vorsprung von Bild 2 liegt jetzt vor allem bei den Abreisen.
- Gezeigter Tag: Startwert 2 (am nächsten am Mittel unter den Tagen, die alle
  Bedingungen erfüllen): 15:08/15:08 · 13:00/14:50 · 12:49/14:14.

---

# Nachtrag 4: Schichtbeginn 8:00, Etagenwechsel 5 min, Abreisen als Hauptzahl

Anmerkung des User: Der Vorteil von Bild 2 war mit fairen Regeln gering; die
Schicht beginnt eher um 8:00, und dann werden viele Kräfte weggeschickt.

- Schicht ab 8:00; Gäste gehen weiter 9:00–10:40, Check-outs 9:00–11:00.
  Ohne Software Bleibezimmer ab 8:00 laut Liste (neuer Protokolleintrag „N-mal
  weggeschickt"), mit RoSe Routine ab 9:00. Nachgemessen über 300 Tage:
  Routine 10:00 lässt die RoSe-Kräfte warten (nur 185/300 Tage vorn), 8:00
  klopft so oft wie ohne Software; 9:00 ist am stimmigsten (292/300).
- Ehrliche Lesart: Das Wegschicken trifft Bild 1 und 2 fast gleich — ihm
  entkommt man nur mit Reinigung auf Wunsch.
- Etagenwechsel mit Wagen und Aufzug 5 statt 3 min.
- Hauptzahl im Kasten ist jetzt „Abreisen bezugsfertig", darunter „Alles fertig".
- Mittel über 300 Tage: Abreisen 15:15 / 14:14 / 13:55, fertig 15:23 / 15:00 /
  14:24. Gezeigter Tag Startwert 48: 15:18/15:18 · 13:59/14:56 · 13:45/14:27.

---

# Nachmittag 26.09.: Umbau, Board-Änderungen, Simulator-Plan

Kurzfassung; die Begründungen stehen in `AGENTS.md` (Landing Page,
Check-out-Druck, Leiste „Ungespeicherte Änderungen").

- **Landing-Vergleich umgebaut:** zwei Bilder (ohne Steuerung / mit RoSe),
  100 Zimmer, fünf Kräfte, Umschalter täglich/auf Wunsch für beide Bilder,
  gerechneter mittlerer Tag (`typicalSeed`), gleiche Rahmenbedingungen
  (Routine in beiden ab 8:00). Gästemodell mit linear steigendem Klopferfolg,
  Wunsch-Anzeige, „frühestens ab" (ohne Software als Schild bis zur Uhrzeit),
  wechselndem „Nicht stören", „später" an der Tür.
- **Reinigungsboard:** Wunsch wiegt doppelt so viel wie Routine; Check-out-Druck
  mit Wechselhinweis nach jedem Zimmer, Priorität bleibt vorrangig;
  Einstellung „Check-in ab"; „Nicht stören aufgehoben" als Hinweis auf der
  Kachel und mit Gewicht eines Wunsches (Zeitfenster-Argument des Users).
- **Sonst:** Leiste „Ungespeicherte Änderungen" auf Hotel & Regeln und
  Gäste-Zugang; Aufschub an der Tür neutral angezeigt; Quellen der
  Reinigungsdauer; Produktionsprüfung der Tür-Knöpfe bestanden.

## 🔖 Wiederaufnahme

Nächstes Vorhaben: **Simulator als eigenes Werkzeug hinter einer Anmeldung** –
Bauplan in [Simulator-Plan-2026-09-26.md](Simulator-Plan-2026-09-26.md), mit
Phase 1 beginnen. Nicht live gesehen: der Hinweis „Nicht stören aufgehoben" im
Board (im Lotsen-Haus gab es keinen solchen Wechsel). Tägliche Routine im
Lotsen-Haus ist absichtlich an.
