# Bauplan: Druckblätter — Piktogramme + Englisch (09.09.2026)

Ergebnis einer Diskussion über die beiden Druckflächen (Zimmer-Aushang je
Zimmer, Gast-Handout je Aufenthalt). Der Plan ersetzt den bisherigen Ansatz
„vier Sprachen auf jedes Blatt".

---

## 0. Die Entscheidung

**Das Papier hört auf, ein Handbuch sein zu wollen.** Es trägt Piktogramme,
die die **Bedienelemente des Gästeportals** abbilden, dazu Text in **einer
Hauptsprache und einer zweiten Sprache** (Vorgabe Deutsch + Englisch, je Haus
umstellbar). Details, Uhrzeiten und Regeln stehen im Portal — dort sind sie
immer aktuell, kostenlos übersetzbar und niemand muss nachdrucken.

**Papier = Einladung, Bildschirm = Anleitung.**

Warum das besser ist als die vier Sprachen von heute:

- Die vier Sprachen (de/en/es/fr) sind willkürlich. Ein italienischer,
  niederländischer, polnischer, türkischer oder chinesischer Gast bekommt vier
  Blöcke, von denen ihm keiner hilft. Piktogramme plus Englisch helfen ihm
  mehr — und das Übersetzungsgerät hat er in der Hand, wir bitten ihn ja
  gerade, damit zu scannen.
- Vier Blöcke × fünf Sätze sind der Grund, warum das heutige A4-Handout ein
  dichtes Formular bei 10 px ist. Ein bis zwei Blöcke geben Platz für Luft,
  große Typo und ein großes QR.
- Es fällt weg: `stays.language`, ein Klick am Tresen, ein Datenschutz-Absatz,
  der Sprachkatalog als Produktfläche, RTL-Layouts, das Risiko der falsch
  geratenen Sprache, die Zwei-Stufen-Textquelle (Kurz/Lang) — und die zweite
  Layoutvariante, weil Aushang und Handout **dasselbe Blatt** sind und sich nur
  im Zugangsblock unterscheiden.

Die vier Sprachen in [guest-guide.ts](../src/lib/guest-guide.ts) bleiben: sie
tragen weiter die Mail und sind die Saat für die Portal-Übersetzung.

### Piktogramme zeigen Knöpfe, nicht Begriffe

Ein Besen bedeutet „Reinigung" — aber „nur auf Wunsch" ist eine **Bedingung**,
und dafür gibt es kein Piktogramm. Deshalb zeigt das Blatt einen
**Handy-Umriss mit den Schaltflächen, wie sie nach dem Scannen erscheinen**,
in ihren Farben und mit ihren Icons. Das Blatt ist damit eine **Legende für den
Bildschirm**: der Gast erkennt wieder, was er sieht, statt ein Sinnbild zu
deuten. Die Regel bleibt dem Portal.

### Der feste Aushang druckt keine Regel

Die Reinigungsregel hängt an den Policies. Ein gedruckter Satz veraltet
stillschweigend, wenn das Haus die Routine umstellt — 200 Aushänge lügen dann
an der Wand. Also:

| | Regel + Uhrzeiten | Nachhaltigkeit |
|---|---|---|
| **Aushang** (permanent) | **nein** — nur die Knöpfe | policy-**neutraler** Satz |
| **Handout** (je Aufenthalt, frisch gedruckt) | **ja**, voller Satz aus den Policies | verzweigter Satz (wie heute) |

Der neutrale Nachhaltigkeits-Satz muss in **beiden** Welten wahr sein:
„Weniger Reinigung spart Wasser, Waschmittel und Energie — ein Tipp auf ‚Bitte
nicht stören' genügt." Gilt mit und ohne Routine-Reinigung.

---

## 1. Was gebaut wird

Zwei Layouts, beide für **beide** Flächen:

- **DIN A4** — Zimmermappe, Kunststoff-Aufsteller, Rahmen an der Wand.
- **A6, vier pro Seite** mit gestrichelten Schnittlinien — der Zettel in die
  Hand am Tresen bzw. der Massendruck der Aushänge. Ersetzt „eine Karte pro
  Seite" (bei 60 Zimmern heute 60 Blatt für 9-cm-Kärtchen).

Umschalter „DIN A4 · A6" über der Vorschau, auf beiden Seiten, **ohne**
Speicherung in der Datenbank.

### Maßbudget A4 (Breite 186 mm, nutzbare Höhe ~277 mm)

| Zeile | Höhe | Inhalt |
|---|---|---|
| Kopf | 28 mm | **Logo** links (max. 55 × 16 mm), rechts Zimmernummer groß; darunter Gebäudeteil + Hausname, „Willkommen · Welcome" |
| Zugang | 74 mm | QR **50 mm** links; rechts PIN groß bzw. Gültigkeitshinweis, Adresse ohne QR, Scan-Piktogramm |
| Legende | 96 mm | Handy-Umriss + drei Knopfzeilen à 32 mm: Knopf-Nachbildung, eine Zeile Sprache 1, kleiner Sprache 2 |
| Variabler Block | 26–34 mm | Aushang: Nachhaltigkeit (neutral) · Handout: Reinigungsregel + Nachhaltigkeit (verzweigt) |
| Fuß | 14 mm | Hausname, „Details im Portal", bei `link` „gilt bis zum Check-out" |

Summe ≈ 238–246 mm. Reserve ~30 mm für Ränder und Skalierungsdrift — das
heutige Handout liegt bei ~230 mm **mit** 10-px-Text, hier ist derselbe Platz
für die Hälfte des Textes da.

### A6 (105 × 148,5 mm, vier pro Seite)

Logo klein (max. 34 × 10 mm) neben der Zimmernummer, QR **40 mm**, PIN (nur
Handout), **eine** Zeile je Sprache, drei Mini-Piktogramme in einer Reihe,
Adresse klein. Kein Handy-Umriss — dafür ist kein Platz, und der Zettel wandert
in die Tasche, nicht an die Wand.

Schnittmarken als **gestrichelte Haarlinien** auf den geteilten Kanten, nicht
als Eck-Beschnittmarken: Rahmen und Linien drucken immer, Flächen nicht.

---

## 2. Druck-Realität (die Regeln, an denen sonst etwas kaputtgeht)

1. **Keine Farbfläche mit weißer Schrift.** Browser drucken Hintergründe
   standardmäßig nicht, und im Projekt steht nirgends `print-color-adjust:
   exact`. Der heutige Aushang hat genau diesen Fehler: `bg-action` mit
   `text-action-foreground` — „Zimmerservice / Zimmer 101" druckt weiß auf
   weiß. Erlaubt sind helle Tints mit **dunklem** Text (fällt die Fläche weg,
   bleibt es lesbar) und farbige **Linien**.
2. **Graustufen-fest.** Viele Häuser drucken schwarz-weiß; keine Information
   darf allein an Farbe hängen.
3. **Kein randloser Druck.** ~10 mm tote Zone, deshalb 186 mm Satzbreite und
   keine randabfallenden Flächen.
4. **QR-Größe nach Leseabstand**, Faustregel Kantenlänge ≈ Abstand ÷ 10:
   Mappe/Aufsteller ~30 cm, Rahmen mit ausgestrecktem Arm ~50 cm ⇒ **50 mm auf
   A4**, 40 mm auf A6.
5. **QR-Auflösung:** [QrImage](../src/components/QrImage.tsx) erzeugt das PNG
   mit `size + 60` px. 190 px auf 50 mm gedruckt sind ~96 dpi und weichgerechnet
   — für den Druck das PNG mit ~600 px erzeugen und per CSS auf 50 mm
   skalieren. Dazu `margin: 4` statt `2`: die Norm sieht vier Module Ruhezone
   vor, auf einem vollen Blatt ist das keine Kür.
6. **Piktogramme sind keine UI-Icons.** `lucide-react` ist da (MIT), aber die
   Strichstärke muss hoch (2,5–3) und die Größe deutlich über UI-Maß liegen.

---

## 3. Textquelle: `guest-guide.ts` erweitern

Neu, neben dem bestehenden `buildGuestGuide` (das die Mail weiter bedient):

```ts
export type GuestSheetText = {
  lang: GuideLang
  langLabel: string
  welcome: string
  room: string
  pinLabel: string          // „Ihre PIN" / „Your PIN"
  pinFromReception: string   // Aushang: „PIN vom Check-in-Zettel"
  scan: string
  /** Die drei Knöpfe — Beschriftung WIE IM PORTAL + eine Zeile Erklärung. */
  buttons: {
    clean:    { label: string; hint: string }
    dnd:      { label: string; hint: string }
    services: { label: string; hint: string }
  }
  /** Policy-NEUTRAL — für den permanenten Aushang. */
  sustainabilityNeutral: string
  /** Verzweigt + mit Uhrzeiten — nur fürs Handout. */
  cleaningRule: string
  sustainability: string
  access: string
  footer: string
}

export function buildGuestSheet(
  policies: Record<string, unknown>,
  opts: GuestGuideOptions,
  lang: GuideLang,
): GuestSheetText

/** 1–2 Sprachen aus den Policies, dedupliziert, unbekannte Werte auf Vorgabe. */
export function parseSheetLanguages(policies: Record<string, unknown>): GuideLang[]
```

Die Knopf-Beschriftungen müssen **wörtlich** die des Portals sein
(„Zimmer reinigen", „Bitte nicht stören"), sonst ist die Legende keine.
Sprachkatalog bleibt de/en/es/fr; eine weitere Sprache ist ein Objekt in
`VORLAGEN`.

---

## 4. Policies

Zwei neue Schlüssel im `policies`-JSONB — **keine Migration**:

| Schlüssel | Vorgabe | Bedeutung |
|---|---|---|
| `sheetLanguage` | `de` | Hauptsprache: größere Typo, und **die Sprache der Mail** |
| `sheetLanguage2` | `en` | Zweite Sprache, kleiner gesetzt; leer = ein Block, mehr Luft |

Die Vorgabe `de` + `en` ist bewusst: sie **ändert das heutige Verhalten der
Mail nicht** (die geht deutsch heraus) und stellt Englisch trotzdem auf jedes
Blatt. Ein Haus im Ausland dreht es um. Die Reihenfolge ist eine
Gestaltungs-, keine Wertungsfrage.

Bedient auf `…/admin/einstellungen/gastzugang` als neuer Abschnitt „Sprachen
der Ausdrucke", Action `updateSheetLanguagesAction` nach dem Muster von
`updateGuestAccessModeAction` (Merge in `policies`, `getAdminContext`).

---

## 5. Hotel-Logo

Bewusst **jetzt** mit, nicht später: das Blatt-Layout entsteht gerade, und ein
Logo nachträglich in einen fertigen Kopf zu schieben heißt, ihn zweimal zu
bauen.

**Wo es hin kommt:** A4-Kopf links, max. 55 × 16 mm; A6-Kopf max. 34 × 10 mm;
Zimmernummer rechts daneben. **Ohne** Logo bleibt es beim Hausnamen in Text —
das muss wie Absicht aussehen, nicht wie eine Lücke.

### Ablage: Supabase Storage, öffentlicher Bucket `hotel-logos`

Storage ist im Projekt bisher **unbenutzt** — das ist der eine neue Baustein
dieses Vorhabens. Die naheliegende Alternative habe ich verworfen:

- **Nicht in `hotels.policies`.** Die Policies hängen im `ManagementContext`
  und werden bei **jedem** Request mitgeladen; ein 40-KB-Logo dort wäre eine
  Latenzregression auf jeder Seite — genau gegen „Roundtrips sind die Latenz".
- **Auch nicht als eigene Base64-Spalte.** Möglich, aber ein öffentlicher
  Storage-Pfad hat zwei Vorteile, die wir beide noch brauchen: der Browser holt
  das Bild über den CDN statt durch jede Seitenauslieferung, und **eine echte
  URL funktioniert in der Mail** — `data:`-URIs blockiert Gmail, das ist beim
  QR-Bild schon einmal aufgefallen.

**In der Datenbank steht nur der Pfad:** `hotels.logo_path text null`
(Migration `2026-09-09_hotels_logo.sql`, additiv). Die URL baut
`logoPublicUrl(path)` aus `NEXT_PUBLIC_SUPABASE_URL` — eine gespeicherte
Voll-URL würde bei einem Instanzwechsel zum Datenbank-Update.

**Dateiname mit Zufallsanteil:** `<hotelId>/logo-<8 hex>.<ext>`; nach
erfolgreichem Upload wird der vorige Gegenstand gelöscht. Ein fester Name mit
`upsert` liefert über den CDN sonst tagelang das alte Bild aus. Unveränderliche
URLs sind billiger als Cache-Busting per `?v=`.

**Erlaubt:** PNG, JPG, SVG, max. 1 MB. Geprüft wird MIME **und** Magic Bytes —
ein umbenanntes ZIP soll nicht durchgehen. SVG ist fürs Papier das Beste
(vektoriell, klein) und über `<img src>` unbedenklich: Skripte in einem SVG
laufen dort nicht, und die Storage-Domain ist ohnehin nicht unser Origin.

**Zwei Hinweise muss die Oberfläche geben**, sonst kommt der Ärger erst nach dem
Drucken:

1. **Auflösung** — unter ~400 px Breite wird das Logo auf 55 mm sichtbar
   unscharf. Hinweis, keine Ablehnung; SVG ausgenommen.
2. **Helles Logo auf weißem Papier** — ein für dunkle Hintergründe gebautes
   weißes Logo ist auf dem Blatt unsichtbar. Die Vorschau zeigt es deshalb
   **auf weißem Grund**, nicht in der Theme-Fläche, damit das vor dem Druck
   auffällt.

**Bedient** auf `…/einstellungen/hotel` (Hotel & Regeln) — das Logo ist
Haus-Identität, nicht Gäste-Zugang. Eigene Actions `uploadHotelLogoAction` /
`removeHotelLogoAction` (`getAdminContext`, Admin-Client), **außerhalb** des
großen Policies-Formulars: ein Datei-Upload im selben `<form>` belastet den
Speichern-Knopf mit einem zweiten Zustand.

**Löschen nicht vergessen** — genau das Muster, das dieses Projekt schon zweimal
getroffen hat (`room_state_transitions`, `auth.users`): Storage-Gegenstände
haben **keinen Fremdschlüssel** auf `hotels`, die Kaskade räumt sie nicht ab.
`purgeHotel` in [deletion.ts](../src/utils/deletion.ts) entfernt den Ordner
`<hotelId>/` **vor** dem Löschen des Hauses — danach ist die ID nicht mehr aus
der Zeile zu lesen —, und [deletion.test.ts](../tests/integration/deletion.test.ts)
prüft es.

**Bucket-Anlage gehört in dieselbe Migration** (`insert into storage.buckets …
on conflict do nothing`) samt Policies auf `storage.objects`: öffentliches
Lesen für diesen Bucket, Schreiben nur über den Secret Key — Uploads laufen wie
jeder Schreibzugriff im Projekt über den Admin-Client.

**Nicht in dieser Runde:** Logo im Gästeportal-Kopf und in der Mail. Der
Unterbau macht beides zum Einzeiler, aber es ist eine eigene Entscheidung (im
Portal konkurriert es mit der Zimmernummer, in der Mail mit der
Spam-Bewertung).

---

## 6. Betroffene Dateien

**Neu**

- `src/components/print/GuestSheet.tsx` — exportiert `GuestSheetA4` und
  `GuestSheetCompact` über **einer** Props-Definition, absichtlich in einer
  Datei, damit Drift sichtbar wird.
- `src/components/print/PortalLegend.tsx` — Handy-Umriss + drei Knopfzeilen,
  Icons und Farb-Token identisch zu `GuestSignalPanel`.
- `src/lib/guest-guide.ts` — erweitert (Abschnitt 3).
- `src/lib/logo.ts` — I/O-frei und getestet: `logoObjectPath(hotelId, ext)`,
  `logoPublicUrl(path)`, `validateLogoUpload(mime, bytes, size)` (Whitelist,
  Magic Bytes, 1-MB-Grenze).
- `src/utils/logo.ts` — der I/O-Teil: `uploadHotelLogo`, `removeHotelLogo`,
  `purgeHotelLogos(hotelId)` gegen Storage, alle über den Admin-Client.
- `src/components/print/HotelLogo.tsx` — `<img>` mit Höhen- und Breitengrenze,
  Rückfall auf den Hausnamen.
- `Supabase_sql/2026-09-09_hotels_logo.sql` — Spalte, Bucket, Storage-Policies.

**Geändert**

- [handout/[roomId]/GuestHandoutCard.tsx](../src/app/h/[slug]/admin/handout/[roomId]/GuestHandoutCard.tsx)
  — Blatt raus, `GuestSheet*` rein, Umschalter A4/A6, Mail-Formular bleibt.
- [handout/[roomId]/page.tsx](../src/app/h/[slug]/admin/handout/[roomId]/page.tsx)
  — `buildGuestSheet` je Sprache statt `buildGuestGuides`.
- [zimmer/aushang/RoomQrSheet.tsx](../src/app/h/[slug]/admin/zimmer/aushang/RoomQrSheet.tsx)
  — neues Blatt, vier pro Seite, **Farbflächen-Kopf weg**, „du" → „Sie",
  Lotsen-Anker erhalten (siehe 6).
- [zimmer/aushang/page.tsx](../src/app/h/[slug]/admin/zimmer/aushang/page.tsx)
  — Sheet-Texte laden und durchgeben.
- [einstellungen/gastzugang/page.tsx](../src/app/h/[slug]/admin/einstellungen/gastzugang/page.tsx)
  + [einstellungen/actions.ts](../src/app/h/[slug]/admin/einstellungen/actions.ts)
  — Abschnitt + Action.
- [utils/mail.ts](../src/utils/mail.ts) bzw. die Handout-Action — Mail nimmt
  `sheetLanguage` statt `DEFAULT_GUIDE_LANG`.
- [QrImage.tsx](../src/components/QrImage.tsx) — Render-Pixel und Ruhezone
  (Punkt 2.5), abwärtskompatibel über ein optionales Prop.
- [einstellungen/hotel/page.tsx](../src/app/h/[slug]/admin/einstellungen/hotel/page.tsx)
  + [HotelSettingsForm.tsx](../src/app/h/[slug]/admin/einstellungen/HotelSettingsForm.tsx)
  — Abschnitt „Logo" **neben** dem Policies-Formular, eigene Actions.
- [utils/deletion.ts](../src/utils/deletion.ts) — `purgeHotelLogos` in
  `purgeHotel`, vor dem Löschen des Hauses.
- Beide Blatt-Seiten laden `logo_path` **ausdrücklich** mit — es darf nicht in
  den Kontext-Guard wandern, sonst hängt es an jedem Request.

---

## 7. Lotsen — Anker nicht verlieren

`RoomQrSheet` trägt vier Anker, die
[lotsen.anchors.test.ts](../src/lib/lotsen.anchors.test.ts) gegen den Katalog
prüft: `aushang.karte` (an der **ersten** Karte), `aushang.knopf`,
`aushang.erneuern`, `aushang.hinweis`. Der Umbau muss alle vier behalten;
`aushang.knopf` gehört an den Druck-Knopf samt Umschalter.

Neu: `gastzugang.sprachen` am neuen Abschnitt plus ein Schritt im Lotsen
„Gäste-Zugang" und `regeln.logo` plus ein Schritt im Lotsen „Hotel & Regeln" —
sonst stehen zwei Einstellungen ohne Erklärung im Haus, und der Anspruch ist,
dass die zwölf Lotsen die Oberfläche vollständig abdecken.

---

## 8. Tests

**Unit** ([guest-guide.test.ts](../src/lib/guest-guide.test.ts) erweitern)

- Jede Sprache hat jedes Feld von `GuestSheetText` (der Test, der eine
  vergessene Übersetzung findet).
- `sustainabilityNeutral` enthält **keine** Uhrzeit und ist in beiden
  Policy-Welten identisch — der Riegel gegen die veraltende Wand.
- `cleaningRule` verzweigt wie `buildGuestGuide().cleaning` und nennt die
  effektive Zeit (Check-out-Frist als Untergrenze).
- Knopf-Beschriftungen sind wörtlich die des Portals.
- `parseSheetLanguages` — drei Fälle, die auseinandergehalten werden müssen:
  **fehlender** Schlüssel (Altbestand) ⇒ Vorgabe `['de','en']`, **ausdrücklich
  leere** Zweitsprache ⇒ nur eine (sonst wäre sie nicht abwählbar),
  **unbekannter** Wert ⇒ erste Sprache auf Vorgabe, zweite fällt ersatzlos weg
  (ein Wert, den wir nicht kennen, ist kein Auftrag, Englisch zu drucken).
  Dazu: doppelte Angabe ⇒ ein Eintrag.

**Unit** (`logo.test.ts`, neu)

- `validateLogoUpload`: PNG/JPG/SVG durch, umbenanntes ZIP abgewiesen (Magic
  Bytes schlagen die Endung), > 1 MB abgewiesen.
- `logoObjectPath`: Zufallsanteil, Endung aus dem MIME, Pfad beginnt mit der
  Hotel-ID (die Grenze, an der ein Haus nicht in den Ordner des Nachbarn
  schreibt).
- `logoPublicUrl`: baut aus `NEXT_PUBLIC_SUPABASE_URL`, verträgt einen
  abschließenden Schrägstrich.

**Integration** ([deletion.test.ts](../tests/integration/deletion.test.ts))

- Nach `deleteHotelData` ist der Storage-Ordner des Hauses leer — und der des
  Nachbarhauses **unberührt** (dieselbe Probe, die die Tabellen schon fahren).

**Automatisch mit:** `lotsen.anchors.test.ts`.

**GUI** ([GUI-Testkatalog.md](GUI-Testkatalog.md) erweitern) — Druck ist nur am
Papier zu beurteilen:

- A4 in **Graustufen** drucken: alles lesbar, keine weiße Schrift verschwunden,
  Logo erkennbar (**M**).
- Logo hochladen: PNG, SVG, ein zu kleines Bild (Hinweis erscheint), ein
  helles Logo (Vorschau auf Weiß zeigt das Problem), Logo entfernen — danach
  steht der Hausname (**C+M**, Dateiauswahl).
- A4 aus **50 cm** scannen, A6 aus **30 cm** (**C+M**, Handy).
- A6-Blatt: vier Karten, Schnittlinien sichtbar, keine Karte über den Umbruch
  (**M**).
- Blatt bei Dark-Mode-Sitzung drucken (der Print-Block muss hell ziehen)
  (**M**).
- Höhe des A4-Blatts in der Vorschau nachmessen (≤ 277 mm, eine Seite) (**C**).

---

## 9. Reihenfolge

1. `guest-guide.ts` + Tests — I/O-frei, ändert die Oberfläche nicht, muss grün
   sein, bevor Layout entsteht.
2. `logo.ts` + Tests (auch I/O-frei), Migration schreiben — **noch nicht
   einspielen**.
3. `GuestSheet.tsx` + `PortalLegend.tsx` + `HotelLogo.tsx`, rein
   props-getrieben.
4. Handout-Seite umstellen (Umschalter, Mail unberührt).
5. Aushang-Seite umstellen (vier pro Seite, Anker, Kopf ohne Fläche, „Sie").
6. Policies-UI (Sprachen) + Action.
7. **Migration einspielen** (Spalte, Bucket, Policies), dann Logo-Upload
   (`utils/logo.ts`, Einstellungs-Abschnitt, `deletion.ts`) — die Spalte ist
   additiv, also ist die Reihenfolge unkritisch; ohne Bucket schlägt der Upload
   aber sichtbar fehl, deshalb Migration vor der Oberfläche.
8. Lotse-Schritte + Anker.
9. `npm run verify`, Vorschau-Messung, Doku (AGENTS.md-Punkt „Handout und Mail
   tragen dieselbe Kurzanleitung" fortschreiben, Datenmodell um `logo_path`
   ergänzen) und Session-Protokoll.

Schritte 1–3 sind die Arbeit, 4–8 ist Verdrahtung.

---

## 10. Risiken und bewusste Grenzen

- **Die Legende veraltet, wenn das Portal umgestaltet wird.** Kein Test kann
  das prüfen — Gegenmittel ist, dieselben Icons und Farb-Token wie
  `GuestSignalPanel` zu verwenden und an beiden Stellen einen Kommentar zu
  setzen, der auf die andere zeigt.
- **Nachhaltigkeit bleibt der eine Punkt, den ein Nicht-Englisch-Leser nur als
  Tropfen und Blatt sieht.** Vertretbar: es ist die einzige Botschaft auf dem
  Blatt, die freiwillig ist. Nichts geht kaputt, wenn sie nur als Andeutung
  ankommt.
- **Ein Haus kann auf seiner Landessprache bestehen** (in Frankreich ist
  Verbraucherinformation auf Französisch rechtlich aufgeladen, in Québec
  strenger). Genau dafür sind die beiden Sprachfelder da; „Englisch, Punkt"
  wäre die falsche Härte.
- **Storage ist ein neuer Baustein** — Bucket und Policies werden wie jede
  Migration von Hand im SQL-Editor eingespielt. Solange der Bucket fehlt,
  schlägt der Upload fehl (sichtbar, nicht still); das Blatt druckt in dem Fall
  wie bisher mit dem Hausnamen.
- **Ein Logo ist eine Marke.** Wir prüfen nicht, ob das Haus die Rechte daran
  hat. Die AGB decken das nur mittelbar ab („trägt keine rechtswidrigen Inhalte
  ein", § 5) — ob dort ein ausdrücklicher Satz zu hochgeladenen Bildern und
  Rechten Dritter hinein soll, ist eine kleine offene Frage für die
  AGB-Durchsicht, kein Blocker.

## 11. Nicht in dieser Runde

A5 als drittes Layout · Logo im Gästeportal und in der Mail (Unterbau ist dann
da) · serverseitige PDF-Erzeugung (Browser-Druck genügt) · Fotos und
Illustrationen (Toner, Alterung) · **Portal-i18n** mit der Rangfolge „Wahl im
Portal → `Accept-Language` → Haus-Sprache" — der nächste eigene Schritt, und
der eigentliche Grund, warum das Papier kurz sein darf.
