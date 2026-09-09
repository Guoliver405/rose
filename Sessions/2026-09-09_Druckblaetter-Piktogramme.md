# Gedruckte Blätter: Piktogramme statt Sprachliste — 09.09.2026

Zweiter Abschnitt des Tages (vormittags: [Check-out-Aufstellung](2026-09-09_Checkout-Aufstellung.md)).
Bauplan: [Druckblaetter-Plan-2026-09-09.md](Druckblaetter-Plan-2026-09-09.md).

## Worum es ging

Der User wollte für die beiden Stellen, an denen ein Zugang gedruckt wird —
Zimmer-Aushang je Zimmer, Gast-Handout je Aufenthalt — **ein zweites, schönes
Format**: DIN A4 mit mehrsprachiger Erläuterung, Hintergrund (Nachhaltigkeit)
und Hinweis auf die Komfortfunktionen, druckbar auf jedem Standarddrucker, für
Zimmermappe, Aufsteller oder Rahmen.

Der Bestand war diagonal gefüllt: Das **Handout** war seit dem 08.09. DIN A4 mit
vier Sprachen, der **Aushang** eine kompakte Karte auf Deutsch. Es fehlte also
je Fläche genau das andere Format.

## Wie die Entscheidung gewandert ist

Drei Runden, und die dritte hat die ersten beiden erledigt:

1. **Ein Blatt-Paar für beide Flächen** — sie unterscheiden sich nur im
   Zugangsblock, alles andere kommt schon aus `guest-guide.ts`.
2. **Sprache am Aufenthalt** (`stays.language`, Rezeption wählt beim Check-in).
   Hätte Papier und Mail gelöst, das Portal nur halb — und den Ein-Klick-Check-in
   belastet, einen Datenschutz-Absatz gekostet und das Risiko der falsch
   geratenen Sprache eingeführt.
3. **Die Idee des Users: Piktogramme plus Englisch.** Damit fällt Punkt 2
   ersatzlos weg.

Der Ausschlag: **Die vier Sprachen sind willkürlicher Eurozentrismus.** Ein
italienischer, niederländischer, polnischer, türkischer oder chinesischer Gast
bekommt vier Blöcke, von denen ihm keiner hilft — der englische hätte ihm mehr
genützt als die anderen drei zusammen, ein Bild mehr als alle vier. Und der Gast
hat das Übersetzungsgerät ohnehin in der Hand: Wir bitten ihn gerade, damit zu
scannen.

Daraus folgt die Arbeitsteilung, die den Rest trägt: **Papier ist die Einladung,
der Bildschirm die Anleitung.** Sprache gehört auf den Bildschirm — dort kommt
sie kostenlos aus dem Browser, ist jederzeit korrigierbar und zwingt niemanden
zum Nachdrucken.

Zwei Verfeinerungen gegen die zwei schwachen Stellen der Idee:

- **Die Bilder zeigen Knöpfe, keine Begriffe.** Ein Besen bedeutet „Reinigung",
  aber „nur auf Wunsch" ist eine *Bedingung* — dafür gibt es kein Piktogramm.
  Das Blatt zeigt deshalb die Schaltflächen, wie sie nach dem Scannen
  erscheinen: eine **Legende für den Bildschirm** statt eines Rätsels.
- **Ein Sprachblock, Vorgabe Deutsch, plus eine zweite (Vorgabe Englisch).**
  „Englisch, Punkt" wäre die falsche Härte: Ein bayerisches Landhotel will
  Deutsch, in Frankreich ist Verbraucherinformation auf Französisch rechtlich
  aufgeladen. Das Layout ist für ein bis zwei Blöcke gebaut — die Matrix kommt
  dadurch nicht zurück.

## Was gebaut wurde

**Textquelle** — [guest-guide.ts](../src/lib/guest-guide.ts) um `GuestSheetText`,
`buildGuestSheet`/`buildGuestSheets`, `parseSheetLanguages` und
`sheetLanguageLabel` erweitert. Die Policy-Verzweigung steht weiterhin **genau
einmal** (`buildGuestSheet` ruft intern `buildGuestGuide`), was ein Test
festhält. Die vier Sprachen bleiben vollständig: sie tragen die Mail und sind
die Saat für die spätere Portal-Übersetzung.

**Blatt** — [GuestSheet.tsx](../src/components/print/GuestSheet.tsx)
(`GuestSheetA4`, `GuestSheetCompact` über einer Props-Definition),
[PortalLegend.tsx](../src/components/print/PortalLegend.tsx),
[HotelLogo.tsx](../src/components/print/HotelLogo.tsx). Beide Druckseiten
rendern dasselbe Blatt.

**Einstellung** — Abschnitt „Sprachen der Ausdrucke" auf `…/einstellungen/gastzugang`
(gilt für beide Zugangsverfahren), `updateSheetLanguagesAction`. Die **erste**
Sprache ist zugleich die der Zugangs-Mail; die Mail bleibt einsprachig.

**Logo** — Migration [2026-09-09_hotels_logo.sql](../Supabase_sql/archive/2026-09-09_hotels_logo.sql)
(Spalte + Bucket), [lib/logo.ts](../src/lib/logo.ts) I/O-frei und getestet,
[utils/logo.ts](../src/utils/logo.ts) für Storage, `LogoForm` unter Hotel &
Regeln, `purgeHotelLogos` in [deletion.ts](../src/utils/deletion.ts).

**Nebenbei** — der alte Aushang-Kopf war eine Farbfläche mit weißer Schrift und
hätte weiß auf weiß gedruckt; das „du" im Aushang ist zum „Sie" der übrigen
Texte geworden; der Massendruck macht aus 60 Blatt für 9-cm-Kärtchen 15 Seiten
mit vier Karten.

## Entscheidungen, die man später nicht mehr sieht

- **`portalLang` als eigener Parameter.** Die Knopf-*Beschriftung* folgt der
  Sprache des Portals, der *Hinweis* daneben der des Blattes. Ein englisches
  Blatt mit „Clean my room" neben einem deutschen Bildschirm wäre keine Legende.
  In der App belegt: englisches Blatt, deutsche Knopfnamen.
- **Der Aushang druckt keine Regel.** Sie hängt an den Policies; ein gedruckter
  Satz veraltet stillschweigend, wenn das Haus umstellt — 200 Blätter lügen dann
  an der Wand. Der Nachhaltigkeits-Satz des Aushangs ist policy-neutral
  formuliert und im Test gegen Uhrzeiten abgesichert.
- **`data-theme="light"` an der Wurzel des Blattes.** Die Token hängen an einem
  einfachen Attribut-Selektor, also genügt das Attribut am `<article>`: Die
  Vorschau sieht aus wie das Papier, auch im Dark Mode.
- **92 × 130 mm statt echtem A6.** Vier A6-Karten ergeben exakt 297 mm, und kein
  Standarddrucker druckt randlos — die äußeren Kanten wären abgeschnitten.
- **Höhen gemessen, nicht geschätzt** (Vorschau, umgerechnet auf 186 mm
  Satzbreite): Aushang **219 mm**, Handout **240 mm** von 277 mm nutzbarer Höhe.
  Der erste Entwurf des Handouts lag bei 250 mm — zu knapp für den längsten
  Regeltext (Routine *plus* Zeitfenster *plus* Aufschub-Grenze in zwei
  Sprachen).
- **QR nach Leseabstand ÷ 10** (55 mm A4, 42 mm kompakt) und `QrImage` trennt
  jetzt Layout-Maß von Auflösung: 190 px auf 50 mm sind ~96 dpi.
- **Logo nicht in die Policies.** Die hängen im `ManagementContext` und werden
  bei jedem Request mitgeladen. Der **Pfad** dagegen darf mit — die Haus-Zeile
  wird ohnehin geladen, das kostet keinen Roundtrip und erspart beiden
  Blatt-Seiten je eine eigene Abfrage. Das ist die einzige bewusste Abweichung
  vom Bauplan, dort korrigiert.
- **Unveränderliche Logo-Dateinamen.** Fester Name plus `upsert` liefert über
  den CDN tagelang das alte Bild aus.

## Geprüft

- `npm run verify` grün: typecheck, lint, **308 Unit-Tests** (21 Dateien),
  darunter der Anker-Wächter — alle vier `data-lotse` des Aushangs haben den
  Umbau überlebt.
- [deletion.test.ts](../tests/integration/deletion.test.ts) um Storage
  erweitert, 4 Tests grün: Logo-Datei verschwindet mit dem Haus, die des
  **Nachbarkontos** bleibt.
- In der laufenden App (Stripe-Testhaus): Aushang A4 und kompakt, Handout A4 und
  kompakt mit echter PIN (Check-in gesetzt und wieder ausgecheckt),
  Sprachumstellung auf Englisch-zuerst und zurück, Logo hochgeladen → im Kopf →
  entfernt → Storage-Ordner leer. Das Testhaus steht wie vorher.
- **Nicht geprüft:** der tatsächliche Ausdruck. Papier, Graustufen, Schnittkante
  und Scan aus 50 cm kann nur der Mensch beurteilen — die Fälle stehen im
  [GUI-Testkatalog](GUI-Testkatalog.md) unter J.

## 🔖 Wiederaufnahme

**Stand:** Alle neun Schritte des Bauplans umgesetzt, Migration eingespielt und
nach `Supabase_sql/archive/` verschoben.

**Was als Nächstes ansteht, wenn hier weitergemacht wird:**

1. **Drucktest auf Papier** (GUI-Katalog J5–J9) — der einzige Weg, das Ergebnis
   wirklich abzunehmen. Besonders: Graustufen, ob die vier kompakten Karten
   sauber auf eine Seite fallen, und ein Scan des A4-Blatts aus ~50 cm.
2. **Portal-i18n** — der eigentliche Grund, warum das Papier kurz sein darf.
   Rangfolge: ausdrückliche Wahl im Portal → `Accept-Language` → erste Sprache
   des Hauses. Die vier Vorlagen in `guest-guide.ts` sind die Saat.
3. **Logo im Gästeportal und in der Mail** — der Unterbau steht, beides ist ein
   Einzeiler; im Portal konkurriert es mit der Zimmernummer, in der Mail mit der
   Spam-Bewertung, deshalb bewusst offen gelassen.
4. **A5 als drittes Format**, falls ein Tester es verlangt (viele Tischaufsteller
   sind A5).
5. **AGB-Kleinigkeit:** § 5 deckt hochgeladene Bilder nur mittelbar ab („keine
   rechtswidrigen Inhalte"); ein ausdrücklicher Satz zu Rechten Dritter wäre
   sauberer. Für die anwaltliche Durchsicht vormerken.
