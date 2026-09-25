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
| Gast bleibt im Zimmer, will nichts (2) | geklopft, abgelehnt | „Nicht stören" im Portal | tippt nicht |
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
