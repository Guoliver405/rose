# Landing-Page-Konzept: Nutzenrechner · interaktive Vorschau · OG-Bild

Stand 05.09.2026, Entwurf zur Diskussion. Nichts davon ist gebaut; die
Landing Page vom selben Tag (CSS-Miniaturen, Ablauf-Strip, Preistabelle)
ist die Grundlage. Ziel des Dokuments: ein Gesamtbild, das wir gemeinsam
umsetzen — Code von Claude, Bildmaterial aus Olivers Flux-/ComfyUI-Flows.

## Inhalt

1. Nutzenrechner „Was gewinnt euer Haus?"
2. Interaktive Produktvorschau „Ein Tipp, alle sehen es"
3. OG-Bild und Bildmaterial
4. Reihenfolge, Aufwand, offene Entscheidungen
5. Quellen

---

## 1. Nutzenrechner „Was gewinnt euer Haus?"

### Warum nicht Zimmer × Preis

Die heutige Tabelle beantwortet „Was kostet es?". Ein Hotelier fragt aber
„Was bringt es?". RoSe spart an zwei Stellen messbar Arbeitszeit, und beide
lassen sich mit veröffentlichten Richtwerten beziffern:

- **A — entfallende Reinigungen.** Gäste, die bequem „heute keine
  Reinigung" sagen können, tun das zu einem erheblichen Anteil. Jede
  entfallene Stayover-Reinigung spart die Zeit dieser Reinigung.
- **B — weniger Leerlauf je Reinigung.** Live-Status statt Klopfen, Warten,
  Nachfragen: keine Wege zu DND-Zimmern, keine Rückfrage an der Rezeption,
  ob 204 schon raus ist, kein Suchen nach der Kollegin.

Alles andere (weniger Wäsche und Wasser, weniger Beschwerden, zufriedenere
Gäste, Arbeitsnachweis für die Lohnabrechnung) nennen wir als Text, rechnen
es aber **nicht** ein — sonst wird der Rechner unglaubwürdig.

### Eingaben (Schieberegler, mit sinnvollen Vorgaben)

| Eingabe | Vorgabe | Bereich | Herkunft der Vorgabe |
|---|---|---|---|
| Zimmer | 40 | 1–300 | frei |
| Auslastung | 65 % | 30–95 % | grober Bundesdurchschnitt Stadthotellerie, bewusst nicht als Quelle ausgewiesen, der Nutzer kennt seine Zahl |
| Ø Aufenthaltsdauer | 2,5 Nächte | 1–10 | bestimmt den Stayover-Anteil: `1 − 1/Nächte` (bei 2,5 Nächten sind 60 % der belegten Zimmer Stayover, 40 % Abreisen) |
| Stundenkosten Reinigung | 17 € | 12–30 € | Mindestlohn 13,90 € (2026) × 1,23 Lohnnebenkosten ≈ 17,10 € [Q4][Q5]. Wer Tarif Gebäudereinigung zahlt (15,00 €), liegt bei ≈ 18,50 € |

### Annahmen (jede mit Sternchen im UI, veränderbar unter „Annahmen anpassen")

| # | Annahme | Vorgabe | Bereich | Beleg |
|---|---|---|---|---|
| A1 | Dauer einer Stayover-Reinigung | 18 min | 10–30 | Branchen-Richtwerte 12–15 min [Q2], 15–20 min [Q3], 25 min [Q6]; 18 ist die Mitte |
| A2 | Anteil der Stayover-Gäste, die auf die tägliche Reinigung verzichten, wenn es einen Tipp kostet | 20 % | 0–50 % | 20 % als Planungswert eines Hilton-GM [Q7]; 34 % nach 18 Monaten in einer Fallstudie [Q6]; 70 % der Gäste **wünschen** keine tägliche Reinigung (AHLA 2022 [Q1]) — Wunsch ≠ Verhalten, daher konservativ 20 % |
| A3 | Ersparnis je verbleibender Reinigung durch Live-Status und Koordination | 2 min | 0–5 | Hersteller von Housekeeping-Software nennen 25–67 % Produktivitätsgewinn [Q8][Q9]; das sind Marketingzahlen, wir nehmen bewusst nur ≈ 7–10 % einer 18–30-Minuten-Reinigung |
| A4 | Gespartes Zeitvolumen wird zu Geld | 100 % | — | **Nur wahr, wenn die Einsatzplanung mitzieht.** Wer die Stunden nicht umplant, hat Leerlauf, keine Ersparnis [Q6]. Steht als Hinweis unter dem Ergebnis |

### Rechnung

```
belegt/Tag        = Zimmer × Auslastung
stayover/Tag      = belegt × (1 − 1/Nächte)
entfallen/Monat   = stayover/Tag × A2 × 30
verbleibend/Monat = (belegt − stayover × A2) × 30
Stunden A         = entfallen/Monat × A1 / 60
Stunden B         = verbleibend/Monat × A3 / 60
Ersparnis €       = (Stunden A + Stunden B) × Stundenkosten
Kosten RoSe €     = monthlyPriceCents(Zimmer) / 100   (aus pricing.ts)
```

**Beispiel mit den Vorgaben (40 Zimmer):** 26 belegt, 15,6 Stayover, davon
3,1 verzichten → 94 entfallene Reinigungen/Monat × 18 min ≈ **28 h**;
687 verbleibende Reinigungen × 2 min ≈ **23 h**; zusammen ≈ 51 h ≈
**870 €/Monat**. RoSe kostet **20 €/Monat**. Das ist ein Faktor 40 — und
genau deshalb müssen die Annahmen sichtbar und verstellbar sein, sonst
glaubt es niemand. Mit A2 = 10 % und A3 = 1 min sind es immer noch ≈ 25 h
≈ 430 €. Beide Stellungen zeigen wir als Voreinstellung „vorsichtig" /
„typisch".

### Darstellung

- Zwei Karten nebeneinander: links **„RoSe kostet"** (Betrag aus
  `pricing.ts`, erster Monat frei), rechts **„RoSe spart"** mit
  Stunden **und** Euro, darunter die Aufteilung A/B als zwei Balken.
- Darunter die Schieberegler; die Annahmen A1–A3 eingeklappt unter
  „Annahmen anpassen", jede mit Sternchen und einem Satz Herkunft.
- Fußnoten-Block „Quellen und Annahmen" mit den Links aus Abschnitt 5.
- Hinweis-Satz unter dem Ergebnis (A4): „Gesparte Stunden werden nur zu
  gesparten Kosten, wenn die Einsatzplanung mitzieht — RoSe zeigt dafür in
  der Auswertung, wie viel Reinigungszeit tatsächlich anfällt."
- Technik: eine Client-Komponente, Rechenlogik I/O-frei in
  `src/lib/roi.ts` mit Tests (Kanten: 1 Nacht ⇒ 0 Stayover, 0 % Verzicht,
  Rundung). Keine Persistenz, kein Tracking.
- Die bestehende Beispieltabelle fällt weg; die Preiskarte bleibt.

---

## 2. Interaktive Produktvorschau „Ein Tipp, alle sehen es"

### Ziel

Der Kernnutzen in fünf Sekunden erlebbar: Der Besucher tippt im
Gast-Ausschnitt auf „Zimmer reinigen" und sieht, wie Rezeption und
Reinigungsboard **gleichzeitig** reagieren. Keine Registrierung, keine
Datenbank, kein Video.

### Eine Szene statt drei Karten

Die drei Miniaturen werden zu **einer verbundenen Szene** „Hotel
Alpenblick, Etage 2, Vormittag". Das Gast-Handy steht in der Mitte, weil
es der Auslöser ist; links die Rezeptions-Übersicht (Tablet-Rahmen),
rechts das Reinigungsboard (Handy-Rahmen). Auf dem Handy-Format stapeln
sich die drei untereinander; ein Tipp im Gast-Ausschnitt lässt die
betroffene Kachel kurz aufleuchten und scrollt sie sanft ins Bild.

### Zustände und Interaktionen

Alle Aktionen wirken auf ein kleines gemeinsames Modell (sechs Zimmer,
Zimmer 203 ist „unseres"):

| Wer | Aktion | Rezeption zeigt | Board zeigt |
|---|---|---|---|
| Gast | **Zimmer reinigen** | 203 Balken Amber, „Reinigung gewünscht" | Etage 2: „1 offen", 203 erscheint mit Slider |
| Gast | **Nicht stören** | 203 Rosé mit Ban-Icon | 203 ausgegraut, Zähler runter |
| Gast | Service **Frühstück** bestellen | Glocke an 203, Badge „Services 1" | — |
| Gast | Service **Technischer Dienst** (dringend) | Ring rot blinkend, Glocke rot | — |
| Rezeption | **Check-in 107** | 107 Blau „belegt", PIN erscheint | — |
| Rezeption | **Check-out 104** | 104 Orange „ausgecheckt" | 104 erscheint, Zähler hoch |
| Rezeption | **Priorisieren 105** | 105 Violett mit Flagge | 105 blinkt violett, rückt nach oben |
| Housekeeping | Slider **Reinigung starten** (203) | Spinner an 203 | „Maria in 203", Slider wird „abschließen" |
| Housekeeping | Slider **abschließen** | 203 Grün „bereit" | Zähler runter, Zeile grau |

Jede Aktion ist umkehrbar bzw. führt in den nächsten sinnvollen Zustand;
„Zurücksetzen" oben rechts stellt die Ausgangslage her.

### Geführter Modus

Beim ersten Sichtbarwerden läuft eine **Bildergeschichte in fünf
Schritten** automatisch ab (dieselben Schritte wie der Ablauf-Strip:
Check-in → Zugang → Tipp → Rezeption sieht → Board), je Schritt mit
Untertitel und Zeiger-Animation, gesamt ≈ 15 s. Ein Knopf „Selbst
ausprobieren" hält an und gibt alle Elemente frei. Bei
`prefers-reduced-motion` gibt es keinen Autoplay, nur die Schrittknöpfe.
Der bestehende Ablauf-Strip bleibt darunter als statische Zusammenfassung
(oder wird zur Schritt-Navigation der Demo — Entscheidung offen).

### Technik

- Eine Client-Komponente `LiveDemo` mit `useReducer`; Zustand = sechs
  Zimmer × {signal, checkoutPending, priority, cleaning, orders} +
  Schrittzähler. Rein clientseitig, nichts wird gespeichert.
- Bewusst **keine** Wiederverwendung der echten Board-Komponenten: die
  hängen an Daten, Actions und Realtime. Die Miniaturen bleiben eigene,
  kleine Bausteine mit denselben Tokens und derselben Farbsprache
  (Blau belegt, Grün bereit, Amber Wunsch, Orange ausgecheckt, Violett
  priorisiert, Rosé DND, Rot dringend) — so bleibt die Demo auch dann
  richtig, wenn das echte UI Feinschliff bekommt.
- Der Slider ist der echte `SlideAction`-Baustein in `compact`-Größe; den
  gibt es schon und er fühlt sich genau so an wie im Board.
- Barrierefreiheit: alle Aktionen sind Buttons mit Beschriftung; die
  Miniaturen tragen `aria-live="polite"`-Statuszeilen („Zimmer 203:
  Reinigung gewünscht"), damit der Effekt auch ohne Sehen ankommt.

### Wo Bildmaterial aus Flux/ComfyUI hilft

Die Demo selbst braucht **keine** Bilder — sie lebt von den Zuständen. Bilder
heben stattdessen die Umgebung:

1. **Hero-Illustration** hinter oder neben der Überschrift: ein
   stilisierter Hotelflur oder eine Rezeptionsszene, in der die drei
   Rollen sichtbar sind.
2. **Bildergeschichte statt Icons** im Ablauf-Strip: fünf Panels mit
   wiederkehrenden Figuren (Rezeptionistin, Gast, Reinigungskraft), je
   Panel ein Moment: Klick am Tresen · Zettel/QR in der Hand · Tipp im
   Zimmer · Glocke an der Rezeption · Board auf dem Flur.
3. **Vier Use-Case-Bilder** (Pension, Boutique, Stadthotel, Kette) als
   Kopf der Karten.
4. **OG-Bild-Hintergrund** (Abschnitt 3).

**Stilvorgabe** (für die Prompts, damit alles zusammenpasst):

- Ein Stil für alles. Vorschlag: flache Vektor-Illustration mit weichen
  Verläufen, wenige Farben, keine Fotorealistik. Alternativen zur
  Auswahl: isometrisch (passt zu „Etagen") oder weiches 3D („Claymation").
- Palette aus den Tokens: Blau `#2563eb` (Aktion), Violett `#7c3aed`
  (Priorität), Rosé `#f43f5e` (Nicht stören), Rot `#ef4444` (dringend),
  Amber `#f59e0b` (Wunsch), Orange `#f97316` (ausgecheckt), Smaragd
  `#10b981` (bereit); Grundton Slate (`#0f172a` dunkel, `#f8fafc` hell).
- Motive müssen **in Hell und Dunkel** funktionieren: freigestellte Figuren
  auf transparentem Hintergrund (WebP/PNG mit Alpha), keine eingebackenen
  weißen Flächen. Für den Hero je eine helle und eine dunkle Variante.
- Keine realen Marken, keine erkennbaren Personen, keine Texte im Bild
  (Text setzen wir selbst, sonst ist er nicht übersetzbar).
- Wiederkehrende Figuren: drei Charaktere mit festen Merkmalen (Kleidung,
  Haarfarbe), damit die fünf Panels als Geschichte lesbar sind. Ein
  Charakter-Sheet als erstes Bild, daraus die Szenen.
- Formate: Hero 1600×900, Panels quadratisch 800×800, Use-Cases 1200×600,
  OG-Hintergrund 1200×630. Ablage unter `public/illustrations/`,
  Einbindung mit `next/image` und Alt-Texten.

---

## 3. OG-Bild

Für Link-Vorschauen in WhatsApp, Mail, LinkedIn: 1200×630, erzeugt über
`src/app/opengraph-image.tsx` mit `ImageResponse` — dann bleiben Claim und
Preis Text im Code und ändern sich mit `pricing.ts`, statt in einem PNG
einzufrieren. Aufbau:

- Links: Wortmarke „RoSe" (Rot auf Slate), Claim „Reinigung, Wünsche und
  Services — in einem Takt", Zeile „0,50 € je Zimmer und Monat · erster
  Monat frei", Domain.
- Rechts: **eine Flux-Illustration** (Hero-Motiv in der dunklen Variante)
  oder, solange keine existiert, die Rezeptions-Miniatur in
  satori-tauglichem Flexbox (kein Grid, keine Tailwind-Klassen).
- Dunkler Grund (Slate 900), weil Vorschauen meist auf hellen Flächen
  liegen und sich so abheben.
- Zusätzlich `twitter.card = summary_large_image`. Die Rechtsseiten
  erben das Bild; ein eigenes brauchen sie nicht.

Docking an Punkt 2: dasselbe Hero-Motiv, derselbe Stil — das OG-Bild ist
der erste Abnehmer der Illustrationen und ein guter Test, ob der Stil
trägt.

---

## 4. Reihenfolge, Aufwand, offene Entscheidungen

| Schritt | Aufwand | Braucht |
|---|---|---|
| 1. Nutzenrechner (`roi.ts` + Tests + Komponente, Quellen-Block) | eine Sitzung | Freigabe der Vorgaben unten |
| 2. `LiveDemo` (Modell, Miniaturen, geführter Modus) | ein bis zwei Sitzungen | Freigabe des Konzepts |
| 3. OG-Bild mit Miniatur als Platzhalter | eine Stunde | — |
| 4. Illustrationen (Charakter-Sheet, Hero, fünf Panels, vier Use-Cases) | Oliver, Flux | Stilentscheidung |
| 5. Illustrationen einbauen, OG-Bild auf Illustration umstellen | halbe Sitzung | Schritt 4 |

Schritte 1–3 sind unabhängig von den Bildern und können sofort starten.

**Entscheidungen (05.09.2026, User: „ich folge vollständig deiner
Empfehlung"):**

1. Nutzenrechner: Vorgaben 20 % Verzicht und 2 min Koordination; Euro
   **und** Stunden, mit dem Hinweis zur Einsatzplanung.
2. Demo: Autoplay beim Scrollen ins Bild (einmal, nicht bei reduzierter
   Bewegung), „Selbst ausprobieren" hält an.
3. Ablauf-Strip bleibt als statische Zusammenfassung unter der Demo.
4. Illustrationsstil: flache Vektor-Illustration mit weichen Verläufen.
5. Drei feste Figuren, Charakter-Sheet zuerst.

**Umgesetzt am selben Tag:** Schritte 1–3 (`roi.ts` + Tests,
`RoiCalculator`, `LiveDemo`, `opengraph-image.tsx` mit Miniatur als
Platzhalter). Offen: Schritte 4–5 (Illustrationen).

---

## 5. Quellen

- [Q1] AHLA, „Survey: Hotel Room Cleaning Practices Reflect Guest Preferences", 24.03.2022 — 70 % der Gäste wünschen keine tägliche Reinigung; 38 % nur auf Wunsch, 19 % nur beim Check-out. https://www.ahla.com/resource/survey-hotel-room-cleaning-practices-reflect-guest-preferences
- [Q2] Cellypso, „Hotel Room Cleaning Time" — Richtwert 25–30 min Abreise, 12–15 min Stayover. https://cellypso.com/en/knowledge-base/hospitality/hotel-room-cleaning-time/
- [Q3] Workprocedures, „Hotel Housekeeping SOPs" (2026) — Abreise 20–35 min, Stayover 15–20 min, 12–16 Zimmer je Schicht. https://www.workprocedures.com/blog/hotel-housekeeping-sop-hospitality
- [Q4] Gesetzlicher Mindestlohn 13,90 €/h ab 01.01.2026; Branchenmindestlohn Gebäudereinigung Lohngruppe 1: 15,00 €. https://www.dgb.de/service/ratgeber/branchenmindestloehne/ · https://www.blink.de/blog/mindestlohn-reinigungskraft-2026/
- [Q5] Destatis, Arbeits- und Lohnnebenkosten — rund 23 € Lohnnebenkosten je 100 € Bruttoverdienst. https://www.destatis.de/DE/Themen/Arbeit/Arbeitskosten-Lohnnebenkosten/_inhalt.html
- [Q6] CityShift Finance, „Identify When Guest Opt-Outs Break Hotel Housekeeping Cost Model" — Fallstudie: 34 % Verzicht nach 18 Monaten; 25 min je Stayover; Ersparnis nur bei angepasster Einsatzplanung. https://cityshiftfinance.com/hotel-labor-management-hotel-housekeeping-stayover-opt-out-labor-cos/
- [Q7] Lodging Magazine, „The Value of Opting Out", 02.04.2024 — 20 % als Planungswert (Hilton Wilmington/Christiana); 8–10 $ Ersparnis je Tag und Zimmer (IHG). https://lodgingmagazine.com/the-value-of-opting-out/
- [Q8] Lodging Magazine, „Room for Improvement: Housekeeping Management Software" — Herstellerangaben 40–67 % Produktivität (Flexkeeping). https://lodgingmagazine.com/room-for-improvement-housekeeping-management-software-enables-teams-to-reach-new-levels-of-efficiency/
- [Q9] Stayntouch, „Hotel Housekeeping Software with Real-Time Room Status" — Herstellerangabe 25 % Produktivität, 30–40 % des Tages einer Housekeeping-Leitung gehen für Koordination drauf. https://www.stayntouch.com/articles/hotel-housekeeping-software-real-time
- [Q10] Roomchecking (DE), Leitfaden Reinigungsdauer — 20–30 min Abreise, ca. 15 min Stayover. https://www.roomchecking.com/de/

Hinweis zur Quellenlage: Q1 nennt keine Stichprobe und keinen
Durchführenden; Q8 und Q9 sind Herstellerangaben. Beides steht im
Fußnoten-Block der Seite so dabei. Eine deutsche Erhebung zum
Verzichtsverhalten habe ich nicht gefunden — falls DEHOGA oder ein
Hotelverband etwas hat, wäre das die bessere Quelle für A2.
