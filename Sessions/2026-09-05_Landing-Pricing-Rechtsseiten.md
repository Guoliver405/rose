# 05.09.2026 — Landing Page, Pricing, Impressum, Datenschutz, AGB

Zweiter Abschnitt des Tages (der erste: [IP-Drossel und Login-Tests](2026-09-05_Login-Tests-und-IP-Drossel.md)).
Auftrag: aufräumen, dann die Landing Page aufpolieren, Rechtsseiten anlegen,
Produktbeschreibung schärfen, Pricing veröffentlichen. Die manuellen
GUI-Fälle (M / C+M) bleiben bewusst liegen.

## Inhalt

1. Aufräumen
2. Entscheidungen (Pricing, Anbieter)
3. Was gebaut wurde
4. Befunde beim Anbieter-Impressum
5. Verifikation
6. Offen

## 1. Aufräumen

- Der TODO-Eintrag „Testplan D–G durchlaufen" war seit dem 25.07. erledigt
  ([Testplan-Walkthrough.md](Testplan-Walkthrough.md), D–G alle abgehakt)
  und stammte aus der Übergabe vom 26.07. — gestrichen, mit Verweis auf die
  tatsächlich offenen M-/C+M-Fälle des [GUI-Testkatalogs](GUI-Testkatalog.md).
- Fall **D12 „IP-Drossel"** in den Katalog aufgenommen (30 Fehlversuche mit
  einer nicht belegten Nummer, dann richtige PIN; Gegenprobe aus anderem
  Netz ist M).

## 2. Entscheidungen

**Pricing** (User): zimmergenau, **0,50 € je Zimmer und Monat, Mindestbetrag
5 € je Konto und Monat, erster Kalendermonat frei**, keine Pakete, keine
Zimmergrenzen. Abgelegt in [pricing.ts](../src/lib/pricing.ts) mit Tests
(`monthlyPriceCents`, `isFreePeriod`). Zwei Feinheiten, die der Code
festlegt: Der Mindestbetrag gilt je **Konto**, nicht je Haus (eine Kette
mit drei kleinen Häusern zahlt die Summe ihrer Zimmer); ein Konto ohne ein
einziges abrechenbares Zimmer zahlt **nichts** (sonst zahlte ein frisch
registriertes Haus vor dem ersten Zimmer). „Frei" ist der Kalendermonat der
Registrierung — kalendermonatsgenau, weil die Zimmerzählung ebenso läuft.

**Anbieter** (User): I²D Internet-Informations-Dienste, Inhaber Bernd Köhl,
www.internetinformationsdienste.de. Impressum und AGB dort als grobe
Orientierung, aber „alle Aspekte genau prüfen und ggf. berichtigen".

## 3. Was gebaut wurde

- [provider.ts](../src/lib/provider.ts) — **die eine Stelle** für
  Anbieter-Daten. Fehlende Werte stehen als `[…]`-Platzhalter;
  `providerIncomplete()` erkennt sie, und `ProviderNotice` zeigt auf allen
  drei Rechtsseiten einen gelben Kasten, solange etwas fehlt. Ein Impressum
  mit „[Straße]" soll nie still in Produktion stehen.
- Rechtsseiten als Route-Gruppe `src/app/(legal)/` mit eigenem Layout
  (schmale Lesespalte, Kopfzeile, Pflichtlinks) und kleinen
  Typografie-Bausteinen ([ui.tsx](../src/app/(legal)/ui.tsx)):
  - `/impressum` — § 5 DDG, § 18 Abs. 2 MStV, § 36 VSBG, Haftung, Urheberrecht.
  - `/datenschutz` — tragende Unterscheidung **zwei Rollen**: für
    Website-Besucher und Kunden ist der Anbieter Verantwortlicher; für alles,
    was ein Hotel in RoSe verarbeitet (Gäste, Personal, Stiche), ist das
    **Hotel** Verantwortlicher und der Anbieter Auftragsverarbeiter. Fakten
    aus dem Code: Vercel (Dublin), Supabase (Irland), Resend; nur technisch
    notwendige Cookies (`sb-…`, `svc_sb-…`, `rose_guest`), kein Tracking,
    kein Banner; Gäste anonym; Gast-Mail-Adresse nicht in RoSe gespeichert,
    wohl aber im Zustellprotokoll von Resend (ehrlich benannt); IP-Hash bei
    Fehlversuchen 15 Minuten.
  - `/agb` — von Grund auf für einen B2B-SaaS mit Monatslaufzeit: nur
    Unternehmer, Leistungsgegenstand (kein PMS), Preise **aus `pricing.ts`**,
    Zählregel wie `countBillableRooms`, monatlich kündbar, Konto löschen =
    Kündigung, Auftragsverarbeitung mit Unterauftragsverarbeitern,
    Haftungsstaffel, Änderungsklausel, deutsches Recht.
- [LegalFooter.tsx](../src/components/LegalFooter.tsx) auf **allen
  öffentlichen Seiten**: Landing, `/login`, `/registrieren`,
  `/passwort-vergessen`, `/passwort-neu`, beide Reinigungs-Anmeldungen und —
  über `GuestShell` — beide Gast-Layouts. Das Impressum muss von jeder Seite
  aus mit einem Klick erreichbar sein.
- Registrierung: Hinweis „Mit dem Anlegen des Kontos akzeptieren Sie die AGB
  …" unter dem Knopf, plus „Der Kalendermonat der Registrierung ist
  kostenfrei".
- [robots.ts](../src/app/robots.ts) und [sitemap.ts](../src/app/sitemap.ts):
  Marketing- und Rechtsseiten erlaubt, Portale und **`/h/`** gesperrt — die
  Anmeldeseiten je Haus würden sonst ein Kunden-Verzeichnis im Suchindex
  ergeben, das die Anwendung bewusst nirgends anbietet. Basis-URL über
  [site.ts](../src/lib/site.ts) (`NEXT_PUBLIC_SITE_URL`, Rückfall auf die
  Produktionsdomain, damit ein Build mit Platzhalter-Keys keine
  Localhost-Adresse ausliefert); `metadataBase` im Root-Layout.
- **Landing Page** neu geschrieben:
  - Hero: „Reinigung, Wünsche und Services — in einem Takt", Preis-Zeile
    darunter, CTA „Kostenlos starten" → `/registrieren`.
  - **Produktvorschau statt Screenshots**: drei in CSS nachgebaute
    Miniaturen (Rezeptions-Übersicht mit sechs Kacheln in der
    Board-Farbsprache und Glocke, Gast-Portal als dunkler Handy-Ausschnitt,
    Reinigungsboard mit Etagen und Slider). Folgen dem Theme, veralten nicht
    mit jedem UI-Feinschliff, `aria-hidden`.
  - **Ablauf als Bildergeschichte**: fünf Schritte mit Rolle, Icon und
    Verbindungslinie (Check-in → Zugang → Tipp im Zimmer → Rezeption sieht →
    Board).
  - Pricing „Ein Preis. Keine Pakete.": Preiskarte + Beispieltabelle
    (8/25/60/150 Zimmer, effektiv je Zimmer) aus `monthlyPriceCents`,
    Zählregel und Kündigung in Worten.
  - FAQ um Preis, Datenstandort und Zugangswege ergänzt; Fußzeile mit
    Pflichtlinks und Anbieter-Zeile; OpenGraph-Metadaten.

## 4. Befunde beim Anbieter-Impressum

Das Impressum auf internetinformationsdienste.de ist selbst unvollständig
und teils veraltet — deshalb nicht übernommen, sondern korrigiert:

| Dort | Hier | Grund |
|---|---|---|
| `[Ihre Straße und Hausnummer]`, `[PLZ] [Ort]`, `[Ihre Telefonnummer]`, `[Ihre USt-IdNr.]` | Platzhalter in `provider.ts`, gelber Hinweis | Werte sind nirgends veröffentlicht, müssen vom Anbieter kommen |
| „§ 5 TMG" | „§ 5 DDG" | Telemediengesetz seit 14.05.2024 durch das Digitale-Dienste-Gesetz abgelöst |
| „§ 55 Abs. 2 RStV" | „§ 18 Abs. 2 MStV" | Rundfunkstaatsvertrag seit 07.11.2020 im Medienstaatsvertrag aufgegangen |
| Link auf ec.europa.eu/consumers/odr | entfernt | EU-Plattform zur Online-Streitbeilegung am 20.07.2025 eingestellt |
| AGB-Seite (`agb.html`) | eigene AGB | liefert 404 |
| Datenschutz nennt Google Analytics | nicht übernommen | RoSe hat kein Tracking |

## 5. Verifikation

- `npm run verify` grün: Typecheck, Lint, **146 Unit-Tests** (12 neue in
  `pricing.test.ts`). Lint hatte ASCII-Anführungszeichen in JSX-Text
  moniert (`react/no-unescaped-entities`) — typografische `„…“` gesetzt.
- Dev-Server im Browser-Pane: `/`, `/impressum`, `/datenschutz`, `/agb`
  200; `robots.txt` und `sitemap.xml` korrekt (Produktionsdomain als
  Rückfall, weil auf dem Mac keine `.env.local` liegt). Landing in Hell und
  Dunkel gesichtet: Miniaturen, Ablauf-Strip, Preistabelle, Fußzeile.
  Handy-Breite 375 px ohne horizontales Scrollen.
- **Werkzeug-Notiz:** Ist das Browser-Pane eingeklappt, liefert
  `screenshot` nach einem `scrollTo` nur eine leere Fläche (die Seite wird
  nicht neu gezeichnet). Abhilfe: `resize_window` auf eine Höhe, die die
  ganze Seite fasst (hier 1280×6000), dann frisch navigieren (`?v=n`
  anhängen, sonst kein Reload) und einmal screenshotten; Details per `zoom`.
- Eine falsche Spalte gefunden und ersetzt: „pro Zimmer und Tag" zeigte für
  jede Hausgröße 0,02 € — nichtssagend. Jetzt „effektiv je Zimmer" (0,63 €
  bei 8 Zimmern, 0,50 € darüber), das macht den Mindestbetrag sichtbar.

## 5b. Nachmittag: Nutzenrechner, Live-Demo, OG-Bild

Auf die Frage „Ideen zur Landing Page?" folgte das
[Landing-Konzept](Landing-Konzept-2026-09-05.md) (Nutzenrechner mit
recherchierten Annahmen statt Zimmer × Preis, interaktive Vorschau als eine
verbundene Szene, OG-Bild, Stilvorgabe für Flux-Illustrationen). Der User
folgte allen fünf Empfehlungen; Schritte 1–3 sind umgesetzt:

- [roi.ts](../src/lib/roi.ts) + Tests: zwei Hebel (entfallende
  Stayover-Reinigungen, weniger Leerlauf je Reinigung), Vorgaben 40 Zimmer /
  65 % / 2,5 Nächte / 17 €, Annahmen A1 18 min, A2 20 %, A3 2 min, Presets
  „vorsichtig"/„typisch", `ROI_SOURCES` mit sechs Quellen. Beispiel: 51 h ≈
  866 € Ersparnis gegen 20 € Kosten — deshalb Sternchen und verstellbare
  Annahmen. Quellenlage ehrlich benannt: AHLA ohne Stichprobe,
  Hersteller-Zahlen als solche markiert, keine deutsche Erhebung gefunden.
- [RoiCalculator.tsx](../src/components/landing/RoiCalculator.tsx): vier
  Schieberegler, zwei Ergebnis-Karten (kostet / spart, Stunden **und** Euro),
  Aufteilung als Balken, Annahmen eingeklappt, Quellen als `<details>`.
  Ersetzt die Beispieltabelle; die Preiskarte bleibt.
- [LiveDemo.tsx](../src/components/landing/LiveDemo.tsx): sechs Zimmer in
  einem Reducer, Gast-Handy als Auslöser (Zimmer 202, ohne Aufenthalt erst
  „einchecken"), Rezeption mit Check-in/-out, Prio, Anfragen-Liste und
  Badge, Board mit echtem `SlideAction`. Bildergeschichte in fünf Schritten
  à 3,2 s per IntersectionObserver, `applied`-Ref gegen den doppelten
  Effekt-Lauf im StrictMode, `aria-live`-Statuszeile. Lint verbot
  `setState` synchron im Effekt — der Zweig war ohnehin unerreichbar.
- [opengraph-image.tsx](../src/app/opengraph-image.tsx): 1200×630, Slate
  900, Wortmarke, Claim, Preis aus `pricing.ts`, rechts die
  Rezeptions-Miniatur. **Satori-Fallstrick:** `{ausdruck} Text` sind zwei
  Kindknoten → „Expected <div> to have explicit display: flex" → als String
  zusammenbauen. `twitter.card = summary_large_image` ergänzt.

Verifikation: `verify` grün (154 Tests). Im Browser: Geschichte läuft und
setzt die Zustände (202 eingecheckt → Wunsch → Anfrage mit Badge →
Reinigung), freie Bedienung per Skript geprüft (Reinigen/DND-Umschalten,
Bestellung mit Badge „Services 1", Prio 205, Check-out 204 → drei
Board-Zeilen mit Slidern), OG-Bild als PNG (80 KB) gesichtet. Im
versteckten Browser-Pane feuern IntersectionObserver und Timer erst beim
Zeichnen — Zeitverhalten der Geschichte dort nicht messbar, Klicks über
`javascript_tool` statt Koordinaten.

## 6. Offen

Siehe [TODO.md](../TODO.md), Abschnitt Landing-Page d):

1. **Anbieter-Daten nachtragen** in `provider.ts` — Anschrift, Telefon,
   E-Mail, USt-IdNr. Erst dann verschwindet der gelbe Hinweis.
2. **Rechtstexte prüfen lassen** — AGB und Datenschutzerklärung sind
   Entwürfe, kein Rechtsrat. Anschriften von Supabase (Singapur), Vercel
   (Covina) und Resend (San Francisco) gegen deren aktuelle DPA-Dokumente
   abgleichen; Drittland-Grundlage (SCC/DPF) je Anbieter bestätigen.
3. **AVV** als Dokument (§ 8 AGB verweist darauf).
4. OG-Bild für Link-Vorschauen.
5. Die Konto-Seite `/admin` sagt weiter „aktuell läuft das Konto ohne
   Berechnung" — richtig, solange kein Zahlungsweg existiert; sobald der
   kommt, `monthlyPriceCents` und `isFreePeriod` dort anzeigen.

---

## 🔖 Wiederaufnahme

**Stand am Ende des 05.09.2026:** Alles committet und in Produktion.
Commit `0e4c8e1` (27 Dateien: Landing mit Nutzenrechner, Live-Demo und
OG-Bild; Pricing; Impressum, Datenschutz, AGB; robots/sitemap; Doku).
CI-Lauf 33983219796 grün — `verify` und `integration` beide erfolgreich.
Vercel hat deployt; auf rose-roomservice.app nachgemessen: Nutzenrechner
auf `/`, `/impressum` 200, `/opengraph-image` als PNG (80 KB),
`robots.txt` gibt die Rechtsseiten frei. **Die Rechtsseiten zeigen in
Produktion den gelben Platzhalter-Hinweis**, bis die Anbieter-Daten
eingetragen sind — bewusst sichtbar statt still.

Offen aus diesem Tag, nach Dringlichkeit:

1. Anbieter-Daten von Bernd Köhl (Mail ist formuliert und verschickt):
   Firmierung mit Rechtsformzusatz, Anschrift, Geschäftsführer,
   Handelsregister, USt-IdNr., Telefon, E-Mail, Bundesland.
2. Rechtstexte anwaltlich prüfen; AVV als Dokument.
3. Illustrationen (Oliver, Flux) nach der Stilvorgabe im Konzept.
4. Deutsche Quelle zum Verzichtsverhalten für Annahme A2 des Rechners.

**Wenn hier weitergearbeitet wird:** Anbieter-Daten in `provider.ts`
eintragen (Bernd Köhl liefert sie per Mail; die I²D ist eine **UG** —
Rechtsformzusatz, Geschäftsführer und Handelsregister kommen dann ins
Impressum-Template dazu), `npm run verify`, commit, push. Danach AVV und
anwaltliche Prüfung. Parallel: Illustrationen nach der Stilvorgabe im
[Landing-Konzept](Landing-Konzept-2026-09-05.md), Abschnitt 2 — erst das
Charakter-Sheet, dann Hero, Panels, Use-Cases; Einbau und OG-Umstellung
sind eine halbe Sitzung. Die manuellen GUI-Fälle bleiben weiter liegen,
bis der User sie aufruft.
