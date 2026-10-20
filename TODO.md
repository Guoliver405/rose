# Offene Punkte

Stand 20.10.2026. Herkunft in Klammern; Erledigtes wird gestrichen, nicht
gelöscht, damit erkennbar bleibt, was einmal offen war.

## Vor den ersten echten Kunden

- [x] ~~**„Problem melden“ in die Datenschutzerklärung** (19.10.2026)~~ — am
      selben Tag: Datenschutz Abschnitt 4 „Meldungen an den Support“, Abschnitt 5
      und 9 ergänzt, AGB § 4 Abs. 3, § 8 Abs. 4, § 10 Abs. 1; Stand Oktober 2026.
      **Offen bleibt der AVV selbst** (gibt es noch nicht als Dokument): Er muss
      Bildschirmfotos in Support-Meldungen als Verarbeitung im Auftrag nennen.

- [x] ~~**Zwei Migrationen einspielen, dann pushen** (16.09.)~~ — am selben
      Abend erledigt, Browser-Nachweis in
      [Sessions/2026-09-16_Gaststatus-Verweise-Teammodus.md](Sessions/2026-09-16_Gaststatus-Verweise-Teammodus.md).

- [ ] **Lizenzvertrag mit I²D** — 06.09. durchgesprochen und **Entwurf 2 an
      Bernd geschickt** (in `Verträge/`, nicht im Repo): 50/50 als
      Innengesellschaft im selben Vertrag, Lizenz als Kette „Nettoerlöse −
      Kosten − Pauschale, Rest hälftig", Auslaufphase für Hotels, Konten
      bleiben bei den Lizenzgebern. AGB § 12 Abs. 3 (Vertragsübergang) dazu in
      Produktion. ~~**Wartet auf Bernd:** Registerauszug, Pauschale,
      Abrechnungsrhythmus, Wortmarke~~ — **11.10.: Gegenentwurf von Bernd**
      (unentgeltliche Lizenz), angereichert mit Änderungsverfolgung und
      Antwort-Mail ([Protokoll](Sessions/2026-10-11_Lizenzvertrag-Gegenentwurf.md)).
      **Wartet auf Bernd** (Telefonat); danach Steuerberater und Anwalt.

- [ ] **Pilotkunden länger kostenlos — erst, wenn der erste Pilot konkret
      wird** (18.10.). Heute gibt es dafür keinen Hebel: die freie Zeit hängt
      allein an `accounts.created_at`, und ein verschobenes Datum macht nur
      Monate *ab* dem Datum frei — die Monate davor würden berechnet. Plan:
      nullbare Spalte `accounts.free_until`, `isFreePeriod` in
      [pricing.ts](src/lib/pricing.ts) wertet Monate davor als frei (dann
      gilt es für Anzeige, Monatslauf und Schlussrechnung zugleich), keine
      Oberfläche, gesetzt per SQL. Nebenbei: Testkonten mit abgelaufener
      freier Zeit bekommen seit dem Lauf am 01.10. Rechnungen und auf
      `/admin` eine Überfällig-Warnung (Sandbox, nichts belastet).

- [x] ~~**Login-Actions testen**~~ — 05.09. erledigt:
      [login.test.ts](tests/integration/login.test.ts) fährt beide Actions
      gegen die Testwelt, inklusive *fünf Fehlversuche sperren nur den eigenen
      Aufenthalt* und der IP-Drossel. (Übergabe 26.07.)
- [x] ~~**IP-Rate-Limit für die Gast-Anmeldung**~~ — 05.09. erledigt:
      gleitendes Fenster je Absender-IP über alle Häuser (30 Fehlversuche /
      15 min), Tabelle `guest_login_failures`, Migration
      `2026-09-05_guest_login_failures.sql`. (Übergabe 26.07.)
- [x] ~~**Testplan D–G** durchlaufen.~~ — war seit dem 25.07. erledigt
      ([Testplan-Walkthrough.md](Sessions/Testplan-Walkthrough.md), Abschnitte
      D–G alle abgehakt), der Eintrag stammte aus der Übergabe vom 26.07. und
      wurde nie gestrichen. Was tatsächlich noch aussteht, sind die Fälle des
      [GUI-Testkatalogs](Sessions/GUI-Testkatalog.md), die den Menschen
      brauchen (**M** und **C+M**: zweite Management-Sitzung, Manager in zwei
      Häusern, Konto löschen, Druck) — bewusst zurückgestellt (05.09.).

## Housekeeping-Simulator (26./27.09.2026)

- [ ] **Phase 5 im Detail prüfen** (User, 27.09.) — Arbeitsweise ohne Software:
      Funk als ein Kanal für alle, freie Etagen, „Abreisen zuerst", Vorgabewerte.
      Stand und Regeln: [Simulator-Plan-2026-09-26.md](Sessions/Simulator-Plan-2026-09-26.md), Abschnitte 16–17.
- [ ] **Ergänzungen nach ausgiebigem Testen** — vom User angekündigt.
- [ ] **Nachträge vom 27.09. in Produktion prüfen** (User, 28.09.): „später“/„abgelehnt“/
      erneutes Klopfen an den Kacheln, Tätigkeitszeile, wartende Kräfte; „Rechnen“
      ausgegraut, „Andere Tage würfeln“ inkl. Speichern und Vergleich. Checkliste:
      [Simulator-Plan-2026-09-26.md](Sessions/Simulator-Plan-2026-09-26.md), Abschnitt 18.
- [ ] **GUI-Fall L17** in Produktion ([GUI-Testkatalog](Sessions/GUI-Testkatalog.md)).
- [ ] **Werbe-Mails mit Abmeldelink**, falls sie gebaut werden (Datenschutz Abschnitt 7).
- [ ] **Rechtstexte des Simulators** anwaltlich prüfen lassen (mit den AGB).

## Funde aus dem Blindtest (20.10.2026)

Herkunft: Pilot eines „unwissenden Agenten“ (Sonnet, eigene Sitzung in
`F:\Coding_Projekte\RoSe-Blindtest` ohne Repo-Zugriff, nur Browser, lokal):
Pension Lindenhof registrieren, 8 Zimmer, Regeln, eine Reinigungskraft,
Frühstück als Zusatzleistung, zwei Check-ins, Gast, Rezeption, Reinigung,
Check-out. 189 Browser-Aktionen, A–I erledigt, J (Check-out) danach von Hand
geprüft – ohne Befund. Protokoll des Agenten: `RoSe-Blindtest/protokoll.md`
(neben dem Repo). Einordnung unten mit Systemwissen.

**Fehler**

- [x] ~~**Gästeportal nennt die falsche Uhrzeit der täglichen Reinigung.**~~ —
      20.10. behoben: `routineTomorrow` in [board.ts](src/lib/board.ts)
      (getestet) rechnet für morgen — Routine-Zeit, wenn der Gast über morgen
      hinaus bleibt, sonst die Frist; ist morgen der Abreisetag, neuer Text
      `firstDayDeparture` (vier Sprachen). Check-in-Blatt und Mail hatten
      denselben Fehler und bekommen `knownStayover`. Im Browser nachgewiesen.
      Ursprünglicher Befund:
      [status/page.tsx:102](src/app/h/[slug]/guest/status/page.tsx) ruft
      `stayoverDueTime(stayover)` ohne `knownStayover` auf und zeigt deshalb
      immer das Spätere aus Routine-Zeit und Check-out-Frist. Zimmer 102 hatte
      ein Abreisedatum (übermorgen), das Board reinigt morgen also ab 10:00 –
      der Gast las „ab morgen täglich ab 11:00“. Für den Satz „ab morgen“ ist
      maßgeblich, ob **morgen** ein bekannter Bleibetag ist. Prüfen, ob
      `guest-guide.ts:188` (Check-in-Blatt, Mail) denselben Fall hat; die
      Auswertung (`auswertung/page.tsx:109`) ist hausweit und darf bleiben.

**Bedienung**

- [x] ~~**Preis nur über eine „Option“.**~~ — 20.10. behoben: Preisfeld beim
      Anlegen und an der Karte (`service_definitions.price_cents`, Migration
      `2026-10-20_service_definitions_price.sql`), gilt nur ohne Optionen; die
      Anfrage friert ihn als Position mit `whole` ein. Genau eine Option ist im
      Gästeportal vorausgewählt. Im Browser nachgewiesen bis zur Aufstellung.
      Ursprünglicher Befund: „Neuen Service anlegen“ hat kein
      Preisfeld; erwartet wurde der Preis am Service. Danach muss der Gast die
      einzige Option ankreuzen, „Bestellen“ bleibt bis dahin grau, ohne
      Hinweis. Idee: Preisfeld beim Anlegen (legt eine Option an), und bei
      genau einer Option ist sie vorausgewählt.
- [x] ~~**Übersetzungsbanner drängt Sprachen auf, die das Haus nicht braucht.**~~
      — 20.10. behoben ohne neue Einstellung: gemahnt wird nur für
      Rückfallsprache und Blatt-Sprachen (`maintainedLanguages` in
      [guest-guide.ts](src/lib/guest-guide.ts), getestet); die übrigen
      Sprachen bleiben übersetzbar, Chip „optional“ ohne Warnfarbe. Im Browser
      nachgewiesen. Ursprünglicher Befund:
      Eine deutsche Pension bekommt nach dem ersten Service „noch nicht
      vollständig in Français/Español übersetzt“ und „EN · fehlt / FR · fehlt /
      ES · fehlt“ – wirkte wie ein Fehler oder eine Pflicht. Idee: Haus wählt,
      welche Gast-Sprachen es pflegen will; gemahnt wird nur für diese.
- [ ] **„Dringend an / aus“, „Meldung ans Haus an / aus“** – unklar, ob Zustand
      oder Aktion (es ist die Aktion). Als Schalter mit Zustand darstellen.
- [ ] **„Gespeichert“ wird übersehen** (Leiste „Ungespeicherte Änderungen“,
      „Verfahren bestätigen“ beim Gästezugang): Der Agent war jedes Mal
      unsicher, ob gespeichert wurde. Rückmeldung länger und deutlicher.
- [ ] **Wisch-Schieber sind nicht als solche erkennbar** (Schicht beginnen,
      Reinigung starten/abschließen): ein Tipp tut nichts, nirgends steht
      „wischen“. Absicht gegen Fehltipper bleibt – aber ein Tipp sollte den
      Hinweis „Zum Bestätigen nach rechts wischen“ zeigen (kurzes Anstupsen des
      Griffs). Am Handy wohl weniger schlimm als für einen Klick-Bot.
- [ ] **Anmeldeadressen fehlen dort, wo man sie braucht.** Der Check-in nennt
      nur die PIN (nicht die Adresse, nicht dass die Zimmernummer mit
      eingegeben wird); die Adresse für die Reinigungskraft steht nicht auf der
      Personal-Seite, nur auf der Karte. Der Agent fand beide nur unter Hotel &
      Regeln. Zu prüfen: Hinweis „Adresse und Zugang stehen auf dem
      Check-in-Blatt“ bzw. Adresse unter der neu angelegten Kraft.
- [ ] **Keine Rückmeldung während Aktionen** (Anlegen, Erledigt, Kachel öffnen,
      Wisch): Oberfläche grau ohne Text, der Agent prüfte jedes Mal nach.
      Großteils Dev-Modus (Turbopack übersetzt beim ersten Aufruf) – in
      Produktion nachmessen, bevor etwas gebaut wird.
- [ ] Kleinigkeiten: Etagen-Feld springt nach „Anlegen“ nicht auf die nächste
      Etage; Zimmerliste zeigt Etage 2 über Etage 1 (gewollt wie im Gebäude?);
      „Bestätigen Sie die Wahl einmal – auch wenn Sie dabei bleiben“ beim
      Gästezugang irritiert (bewusste Entscheidung vom 22.09., Wortlaut prüfen);
      „Schritt 2 von 2“ beim Zahlungsweg ohne sichtbaren Schritt 1.

**Barrierefreiheit**

- [ ] **Bedienelemente ohne zugängliche Beschriftung:** Knöpfe im Gästeportal
      (nur „button“), Einstellungs-Kacheln (nicht als Link erkennbar),
      Eingabefelder der Anmeldeseite ohne zugeordnetes Label (von Hand
      nachgeprüft). Trifft Screenreader genauso wie Test-Agenten.

**Für den nächsten Blindtest**

- [ ] Lokal mit Produktions-Build statt Dev-Server (spart Wartezeit und
      Kontroll-Aktionen); Limit für den vollen Pilot ~200 Aktionen; größere
      Häuser und mehrere Kräfte gleichzeitig erst danach. Verbrauch des
      Piloten: kaum messbar im 5-Stunden-Fenster (Sonnet, ~160k Kontext).

## Produktentscheidungen

- [x] ~~**Pricing-Form**: zimmergenau oder Staffeln.~~ — 05.09. entschieden:
      **zimmergenau, 0,50 € je Zimmer und Monat, Mindestbetrag 5 € je Konto,
      erster Kalendermonat frei**, keine Pakete. Rechenlogik in
      [pricing.ts](src/lib/pricing.ts), veröffentlicht auf `/` und in den AGB.
      Die Rechnungsseite selbst (Zahlungsprovider, Rechnungen) bleibt offen,
      siehe „Konto-Seite" und „Zahlungsprovider" unten.
- [x] ~~**Reinigungsboard: „Gast an der Tür — in 30 min / in 1 h / heute nicht"**~~
      — 26.09. erledigt, dazu im Gastportal „Heute keine Reinigung" (nur bei
      Routine); Hilfe-Nachbauten und Landing-Vergleich („RoSe merkt es sich")
      nachgezogen.
      (26.09., aus dem Landing-Vergleich): Lehnt ein Gast ohne Türschild an der
      Tür ab, kann die Kraft das nicht erfassen; ein routine-fälliges Zimmer
      bleibt aktiv, zählt in den Etagenscore, und die Kollegin klopft erneut.
      Nur „abbrechen (Zimmer bleibt offen)" existiert. Vorschlag des Users: drei
      Knöpfe, bis zur Zeit nicht aktiv (Mechanismus wie `clean_not_before`),
      „heute nicht" erledigt die Routine ohne als Reinigung zu zählen. Erst
      danach darf die Landing Page „RoSe merkt es sich" sagen. Aufgabe liegt als
      Chip in der Sitzung vom 26.09.; Details im
      [Protokoll](Sessions/2026-09-26_Landing-Tagesvergleich.md).
- [x] ~~**Routine früher bei bekanntem Abreisedatum**~~ — 26.09. erledigt
      (`isKnownStayover` in board.ts, Texte in Einstellung, Hilfe, Lotse).
      Das Handout nennt weiter die Zeit ohne Abreisedatum. Ursprünglich (26.09.):
      Die Routine wird frühestens zur Check-out-Frist fällig, weil RoSe nicht
      weiß, wer abreist. Ist `stays.expected_checkout` gesetzt und nicht heute,
      ist das Zimmer sicher ein Bleibezimmer — dann schon zur Routine-Zeit
      fällig (`isStayoverDue`/`stayoverDueTime` in board.ts, Gaststatus,
      Handout-Zeitangabe, Tests). Voraussetzung für die faire Korrektur des
      Landing-Vergleichs (nächster Punkt).
- [x] ~~**Landing-Vergleich: Bleibezimmer ohne Software ab 9:00**~~ — 26.09. erledigt (Startwert 2). Ursprünglich: (26.09., Frage
      des Users): Wer die Abreiseliste auf Papier hat, weiß auch, wer bleibt —
      Bild 1 wartet heute zu Unrecht bis 11:00 (Überlagerung zweier früherer
      Korrekturen, siehe Protokoll 2026-09-26). Korrektur: Bild 1 reinigt
      Bleibezimmer ab 9:00 und klopft umsonst, wo der Gast noch da ist; Bild 2
      bekommt dasselbe Wissen über das Abreisedatum (Punkt davor). Danach
      Startwert neu suchen, Fertig-Zeiten und Protokolle prüfen.
- [x] ~~**In Produktion ansehen**~~ — 26.09. vormittags alles bestanden.
      (a)/(b) mit echten Klicks im Lotsen-Haus (Gast 203, Kraft Emma Putz):
      Blatt-Kachel, Uhr-Kachel, Verlauf „Heute keine Reinigung gewünscht ·
      Gast" und „An der Tür: Gast möchte später · Emma Putz". Befund behoben:
      „bitte später" auf einen offenen Wunsch wurde dem Gast zugeschrieben
      (Kachel „Gast wünscht Reinigung ab …", Gaststatus „Wie von dir
      gewünscht") — beides schreibt `clean_not_before`, die Anzeige ist dort
      jetzt neutral. Nicht gefahren: „Heute nicht" an der Tür (dasselbe Feld
      wie der Gast-Verzicht, dessen Anzeige geprüft ist). Stand
      nach der Prüfung am 26.09. vormittags: (c) bestanden (Tür-Knöpfe und
      Verzicht in beiden Nachbauten; Lotsen-Text „einzige Rückmeldung" an die
      Statuskarte angepasst), (d) bestanden (15:18 · 13:59 · 13:45; Knopf hieß
      noch „Zurück auf 9:00", behoben; Schleife nur im Code geprüft, Chrome
      drosselt die Animation im Hintergrund-Tab), (e) bestanden (Lotsen-Haus
      203 mit Abreise 28.09. um 9:36 „Routine-Reinigung fällig", Zustand danach
      zurückgesetzt). (a)/(b) brauchen einen echten Verzicht im Gastportal und
      einen Tür-Knopf im Reinigungsboard — das Lotsen-Haus hat keine
      Reinigungskraft, und ein nachgestellter Gast-Eintrag per Skript in
      Produktion wurde nicht zugelassen. Ursprünglich:
      (a) Rezeptions-Übersicht in einem Haus mit Routine: Kachel mit Blatt
      („Heute keine Reinigung") bzw. Uhr („Reinigung ab … an der Tür
      vereinbart"); (b) Zimmer-Verlauf: „Heute keine Reinigung gewünscht —
      Gast", „An der Tür: Gast möchte später / heute keine Reinigung";
      (c) Hilfe → „Das Reinigungsboard" (Tür-Knöpfe, Schritt „Gast ist da …")
      und „Was der Gast sieht" (Verzicht-Knopf); (d) Landing `#vergleich`:
      Stand vom 26.09. (Schicht ab 8:00, „N-mal weggeschickt", Abreisen als
      Hauptzahl: 15:18 · 13:59 · 13:45) ansehen und ob die Schleife nach 8 s
      Endstand wieder ab 8:00 läuft; (e) eine Routine-Kachel mit eingetragenem
      Abreisedatum: schon zur Routine-Zeit offen statt erst zur Frist?
- [x] ~~**Reinigungsdauer einer Abreise belegen**~~ — 26.09. erledigt: im
      Kleingedruckten als Annahme gekennzeichnet („eher knapp", gemessen 35–43
      bzw. 20–25 min), Quellen Q4 (Heath & Co. via Hotel Business 2018), Q7
      (Reinigung Aktuell 2015), Q8 (CCOHS) im Nutzenrechner. Die alte Q4
      (Cellypso) nannte die zitierten Werte nicht mehr. Ursprünglich (26.09.): Landing-Vergleich
      rechnet 30 min als Planwert, nicht recherchiert (üblich 25–45 min). Eine
      Quelle suchen oder die Zahl im Kleingedruckten als Annahme kennzeichnen.
- [ ] **Simulator als eigenes Werkzeug hinter einer Anmeldung** (26.09., Vision
      des Users, Bernd einverstanden): volle Konfiguration, Auswertung über
      viele Tage, Szenarien, komfortable Umwandlung in ein Hotelkonto,
      Werbe-Einwilligung nur für RoSe. Bauplan mit Phasen und offenen Fragen:
      [Simulator-Plan-2026-09-26.md](Sessions/Simulator-Plan-2026-09-26.md).
- [ ] **„Nicht stören aufgehoben" live ansehen** (26.09.): Kachel-Hinweis und
      Gewicht im Reinigungsboard — braucht einen Gast, der DND setzt und wieder
      zurücknimmt, bei täglicher Routine.
- [ ] **Zwei Zimmer-Zustände?** Aktuell gibt es einen (`deactivated_at`). Ob
      „Renovierung" von „abbestellt" getrennt gehört, ist eine reine
      Preisfrage — am Datenmodell ändert sie nichts. (6d-Plan, Abschnitt 14)
- [ ] **Hotel zwischen Konten verschieben** (Betreiberwechsel) — bisher außen
      vor. (6d-Plan, Abschnitt 14)

## Produkt-Ausbau (Wunschliste 04.09.2026)

Mittelfristig umzusetzen; Reihenfolge noch offen. Die Punkte zur
Veröffentlichung (Pricing, Impressum, Datenschutz, Zahlungsprovider) hängen
zusammen und gehören vor den ersten zahlenden Kunden.

- [ ] **Check-out-Aufstellung im Betrieb prüfen** — 09.09. gebaut (Protokoll: [2026-09-09_Checkout-Aufstellung.md](Sessions/2026-09-09_Checkout-Aufstellung.md)), Migration `2026-09-09_service_orders_abrechnung.sql`. Offen ist der Durchlauf am echten Zimmer: bestellen → erledigt → Check-out mit Summe → Blatt drucken, dazu der Fall „offene Anfrage direkt im Check-out-Kasten abhaken“ (beides am 09.09. gefahren). Neu zu prüfen: das Häkchen „Meldung ans Haus“ im Baukasten, eine offene Meldung über den Check-out hinaus und die Check-in-Warnung, die daraus folgt. Ebenfalls offen und bewusst zurückgestellt: ein Halbsatz im gedruckten Handout, dass kostenpflichtige Leistungen beim Check-out aufgestellt werden — er kostet vier Sprachen auf einem Blatt, das gerade erst auf 230 mm gerechnet wurde.
- [x] ~~**„Auswertung" aus den Einstellungen ins Hauptmenü**~~ — 04.09.
      erledigt: eigener Nav-Punkt „Auswertung" für Inhaber und Manager, Kachel
      im Hub und Rücklink der Seite entfallen. Offen bleibt die Idee, den
      Zimmer-Verlauf (heute nur im Zimmer-Dialog) dort mit anzubinden.
- [x] ~~**„Frühestens ab" im Gastportal**~~ — 06.09. gebaut, zusammen mit
      der Zeitzone des Hauses: `room_states.clean_not_before`, Haus-Grenze
      `cleanDeferUntil` (Default 11:00, an), Chips im Gastportal mit Hinweis
      auf die Grenze, Boards zeigen „Reinigung ab HH:MM". Feste Wunschzeiten
      weiterhin bewusst nicht.
- [x] ~~**Coach Marks für die Ersteinrichtung**~~ — 08.09. als **Lotsen**
      gebaut (zwölf Fach-Lotsen plus Einrichtungs-Lotse, Nav-Punkt „Hilfe";
      Protokoll: [2026-09-08_Lotsen-Tutorial.md](Sessions/2026-09-08_Lotsen-Tutorial.md)).
      Die Registrierung führt direkt hinein, reaktivierbar ist alles über den
      Hilfe-Hub. **Zwei Vorgaben dieses Eintrags sind bewusst anders gelöst:**
      Der Katalog liegt in der Nav statt in den Einstellungen (wer Hilfe sucht,
      sucht sie oben), und einen gespeicherten „Gesehen"-Zustand gibt es gar
      nicht — er wäre nur nötig, wenn die Tour von selbst aufginge. Sie startet
      ausschließlich über einen Link, und was noch fehlt, leitet die
      Einrichtungs-Checkliste aus dem Datenbestand ab. Damit gibt es nichts,
      was auf einem zweiten Gerät „wieder käme".
- [x] ~~**Hinweis auf die unfertige Einrichtung außerhalb von „Hilfe"**~~ —
      08.09. gebaut: schmales Band auf der Übersicht, solange die vier
      Konfigurations-Punkte offen sind; nennt einen nächsten Schritt, führt in
      dessen Lotsen, endet von selbst. Nur Verwaltung, kein Roundtrip extra.
      **Bewusst ohne Ausblenden:** Ein Haus, das einen Punkt dauerhaft
      überspringen will (etwa eine Pension ohne eigene Reinigungskraft), sähe
      das Band sonst dauerhaft — falls das in der Praxis auffällt, ist ein
      „Nicht mehr anzeigen" je Person der nächste Schritt, und dann mit
      Speicherung am Konto statt im Browser.
- [x] ~~**Konto-Seite „Plan & Abrechnung"** für den Inhaber~~ — 05.09.
      erledigt: `/admin/abrechnung` zeigt Plan, laufenden Monat je Haus mit
      voraussichtlichem Betrag, abgeschlossene Monate mit Betrag und Status
      (frei / festgeschrieben / nicht berechnet), Modalitäten; Beträge aus
      `billingLine` in [pricing.ts](src/lib/pricing.ts). **Zahlungsverfahren
      und Rechnungen sind Platzhalter-Karten** und sagen das auch — gefüllt
      werden sie mit dem Zahlungsprovider (unten).
- [ ] **Landing-Page aufmöbeln** (`/`):
      - a) ~~**Bildmaterial**: klare Screenshots der drei Oberflächen~~ —
        05.09. anders gelöst: keine Screenshots (veralten mit jedem
        Feinschliff), sondern CSS-Miniaturen, seit demselben Tag als
        interaktive `LiveDemo`. Der Comic mit den Kernschritten lebt als
        Ablauf-Strip und als Bildergeschichte der Demo weiter; die
        gezeichneten Panels kommen mit f).
      - b) **Erklärvideo** oder Animation, eventuell mit ComfyUI und Voicebox
        (lokal installiert) erzeugt.
      - c) ~~**Pricing erstellen und veröffentlichen**~~ — 05.09. erledigt,
        Abschnitt „Ein Preis. Keine Pakete." mit Beispieltabelle aus
        `pricing.ts`.
      - d) ~~**Impressum und Datenschutzerklärung** veröffentlichen~~ — 05.09.
        erledigt: `/impressum`, `/datenschutz`, `/agb` (Route-Gruppe
        `(legal)`), Pflichtlinks auf allen öffentlichen Seiten und in der
        Gast-Shell. **Noch offen, bevor es trägt:**
        1. ~~**Anbieter-Daten nachtragen** in [provider.ts](src/lib/provider.ts)~~
           — 05.09. (Abend) erledigt, aus dem aktualisierten Impressum auf
           internetinformationsdienste.de: I²D UG (haftungsbeschränkt),
           Geschäftsführer Bernd Köhl, Saarbrücker Straße 92, 66130
           Saarbrücken, HRB 102734 Amtsgericht Saarbrücken, USt-IdNr.
           DE434570609, info@… — keine Telefonnummer (nach § 5 DDG nicht
           zwingend, die Zeile entfällt). Der gelbe Hinweis ist damit weg.
        2. **Rechtstexte prüfen lassen** (AGB, Datenschutz) — Entwürfe von
           Claude, kein Rechtsrat. Besonders Haftungsklauseln (§ 10 AGB) und
           die Drittland-Passage (Abschnitt 7 Datenschutz); Anschriften von
           Supabase/Vercel/Resend gegen deren aktuelle DPA-Dokumente prüfen.
        3. **Auftragsverarbeitungsvertrag (AVV)** als Dokument — § 8 AGB
           verweist darauf, er existiert noch nicht. Muster: Art. 28 Abs. 3
           DSGVO, Unterauftragsverarbeiter Supabase, Vercel, Resend.
        4. ~~Neu ab 05.09.: Landing-Page-Punkt e) **OG-Bild**~~ — am selben
           Tag erledigt: `opengraph-image.tsx` (ImageResponse) mit der
           Rezeptions-Miniatur; wird auf eine Illustration umgestellt,
           sobald der Stil steht.
      - e) **Nutzenrechner und Live-Demo** — 05.09. umgesetzt
        ([Landing-Konzept-2026-09-05.md](Sessions/Landing-Konzept-2026-09-05.md)):
        `roi.ts` mit ausgewiesenen Annahmen und Quellen, `RoiCalculator`,
        `LiveDemo` (eine verbundene Szene, Bildergeschichte beim ersten
        Sichtbarwerden). **Offen:** eine deutsche Quelle zum
        Verzichtsverhalten (DEHOGA?) für Annahme A2.
      - f) **Illustrationen** (Oliver, Flux/ComfyUI) nach der Stilvorgabe im
        Konzept, Abschnitt 2: Charakter-Sheet, Hero, fünf Ablauf-Panels,
        vier Use-Case-Bilder, OG-Hintergrund. Danach Einbau und Umstellung
        des OG-Bilds.
- [ ] **Zahlungsprovider einbinden** — **06.09.: alle drei Schritte in
      Produktion** ([Stripe-Plan-2026-09-06.md](Sessions/Stripe-Plan-2026-09-06.md),
      Fassung 2: Stripe Invoicing + Stripe Tax statt eigener Rechnung):
      Rechnungsdaten und Zahlungsweg am Konto, Stripe-Kunde bei der
      Registrierung, Sandbox konfiguriert; Monatslauf mit Stripe-Rechnung
      (Stripe Tax), Webhook, Cron, Karte „Rechnungen", erste Testrechnung
      bezahlt. Rechtstexte angepasst (Datenschutz Abschnitt 6, AGB § 6 Abs. 4/4a).
      **13.09.: Sandbox auf das I²D-Konto umgezogen** (Tax, Registrierung,
      Zahlungsmethoden, Webhook per API, Nachweis in Produktion; siehe
      [2026-09-13_Stripe-Umzug-I2D-Sandbox.md](Sessions/2026-09-13_Stripe-Umzug-I2D-Sandbox.md)).
      **Offen:** Live-Übergabe — Bernds fünf Punkte (Teamzugang, Verifizierung,
      Rechtsperson, Dashboard-Einstellungen inkl. Präfix `RS` und Kunden-Mails,
      Live-Schlüssel; Mail-Entwurf [Mail-Bernd-Stripe-Live-2026-09-13.md](Sessions/Mail-Bernd-Stripe-Live-2026-09-13.md)),
      danach Webhook/Tax/Zahlungsmethoden per API wie in der Sandbox;
      Zahlungswege der Testkonten neu hinterlegen (durch den Umzug verworfen);
      Sperre bei Nichtzahlung (E3); Einzug per Karte/Lastschrift am nächsten
      Monatslauf nachweisen; Erinnerungen für einmalige Rechnungen prüfen
      (Dashboard) oder über Resend selbst schicken. Anmeldung beim Provider als Teil der
      Registrierung, auch wenn der erste Monat frei ist (Zahlungsmittel liegt
      dann schon vor). ~~Vorher Alternativen gegenüberstellen.~~ **05.09.
      (Abend) Gegenüberstellung liegt vor:**
      [Zahlungsprovider-Gegenueberstellung-2026-09-05.md](Sessions/Zahlungsprovider-Gegenueberstellung-2026-09-05.md)
      — Stripe, Mollie, PayPal, Paddle mit Gebühren an drei Beispielrechnungen.
      **Empfehlung: Stripe** (SEPA-Lastschrift als Hauptweg, Karte als
      Nebenweg, Zahlungsmittel per SetupIntent ohne Belastung bei der
      Registrierung), Mollie als EU-Zweitwahl mit gleichem Bauplan; Paddle
      (Vertragsübernahme, 5 % + 0,50 $, Sonderfall unter 10 $) und PayPal als
      einziger Weg (Freischaltung, Gebühren) nicht. **Rechnung erzeugt RoSe
      selbst** — E-Rechnungspflicht ab 01.01.2028, von Anfang an ZUGFeRD.
      **Nachtrag nach Rückfrage (Abschnitt 7):** weltweite Verfügbarkeit →
      Karte als Hauptweg, SEPA-Lastschrift als Komfortweg im Euroraum,
      Überweisung mit virtueller IBAN als rückbuchungssicherer dritter Weg;
      Stripe Tax als späterer Schalter. Mail an Bernd mit Entscheidung und
      Aufgabenliste (Stripe-Konto der UG, Gläubiger-ID) liegt als Entwurf in
      [Mail-Bernd-Zahlungsverkehr-2026-09-05.md](Sessions/Mail-Bernd-Zahlungsverkehr-2026-09-05.md).
      Offene Entscheidungen des Users stehen in Abschnitt 6. Betrifft
      `/registrieren`, die Karten „Zahlungsverfahren"/„Rechnungen" auf
      `/admin/abrechnung` und die Abrechnung aus `billing_snapshots`.
- [ ] **E-Rechnungspflicht 2028** (06.09.): ab 01.01.2028 müssen inländische
      B2B-Rechnungen als E-Rechnung (XRechnung/ZUGFeRD) gestellt werden.
      Stripe-PDFs sind keine. Rückfall: aus den Stripe-Rechnungsdaten (alle
      Felder über die API) eine XRechnung erzeugen und dem Kunden zusätzlich
      anbieten. 2027 prüfen, ob Stripe bis dahin E-Rechnungen für Deutschland
      liefert. Herkunft: [Stripe-Plan-2026-09-06.md](Sessions/Stripe-Plan-2026-09-06.md),
      Abschnitt 9.
- [ ] **Wortmarke „RoSe" anmelden** (05.09., aus Bernds Anregung, ein © ans
      Logo zu setzen): Das © bringt für das Logo nichts — Urheberrecht
      entsteht ohne Vermerk, und ein zweifarbiger Schriftzug erreicht die
      Schöpfungshöhe kaum. Was den Namen schützt, ist die **Marke**. Vor der
      Anmeldung beim DPMA (Klassen 9 Software, 42 SaaS; ab 290 € elektronisch)
      **Ähnlichkeitsrecherche** — „Rose" ist ein Allerweltswort, es gibt
      etliche ROSE-Marken auch in Software-Klassen, und „RoSe" hilft dagegen
      nicht (Ähnlichkeit wird nach Klang und Bild beurteilt). Gehört in die
      anwaltliche Prüfung. Erst mit Eintragung darf ein ® ans Logo; ein ®
      ohne Eintragung ist irreführend (§ 5 UWG). Bei Erfolg Ausbau zur
      EU-Marke (EUIPO) passend zur weltweiten Ausrichtung. Die
      Copyright-Zeile „© Jahr I²D UG" steht seit 05.09. in der
      [Fußzeile](src/components/LegalFooter.tsx) aller öffentlichen Seiten.
      Mail an Bernd dazu:
      [Mail-Bernd-Copyright-und-Marke-2026-09-05.md](Sessions/Mail-Bernd-Copyright-und-Marke-2026-09-05.md).
- [ ] **Mehrsprachigkeit**: en, es, fr, de. Betrifft alle drei Portale, die
      Landing-Page und Mails; die **Druckseiten sind seit dem 09.09. erledigt**
      (Piktogramme plus ein bis zwei Sprachen je Haus). Die
      Gast-Sprache muss unabhängig von der Hotel-Sprache wählbar sein — das
      Gastportal ist die Fläche mit den meisten Sprachen. i18n-Ansatz für den
      App Router festlegen (Next.js-16-Doku in `node_modules/next/dist/docs/`
      lesen, bevor eine Bibliothek gewählt wird).
      **Vorbereitung 03.–10.10.2026:** Bestand erhoben (rund 3.800 Textstellen,
      31.000 Wörter, 578 zerstückelte Sätze — [Glossar-Oberflaeche-2026-10-03.xlsx](Sessions/Glossar-Oberflaeche-2026-10-03.xlsx)),
      Begriffe und Anrede mit dem User entschieden ([Begriffe-Entscheidungen.md](Sessions/Begriffe-Entscheidungen.md)).
      **10.10.: Gästeportal ausgelagert** (`src/lib/i18n/`, eigene Lösung ohne
      Bibliothek, siehe AGENTS „Texte in Sprachdateien“), Entscheidungen dort umgesetzt.
      **10.10.: Reinigungsboard ausgelagert. 11.10.: Druckblätter und Mails** (Blatt-Sprachen
      in `i18n/<sprache>/sheet.ts`, Legende aus der Portal-Sprachdatei, Gast-Mail ganz in der
      Sprache des Hauses). **11.10.: Rezeption** (`i18n/de/admin/`, Zimmer-Symbole in
      `de/symbols.ts`). Nachzuziehen (erledigt bis auf die Rollennamen): alte Seitennamen in Hilfe und Lotsen; Fehlermeldungen
      des Logo-Uploads (`lib/logo.ts`, `utils/logo.ts`); Rollennamen in der Einladungs-Mail.
      **11.10.: Anmeldung, Registrierung, Passwort** (`de/auth.ts`; Navigation „Anfragen“). **11.10.: Konto** (`de/account/`). **11.10.: Simulator** (`de/simulator/`; Tagesbild-Komponente
      `landing/CleaningSimulation.tsx` trägt noch eigene Texte, u. a. „Kollegin“ in der Legende).
      **11.10.: Fließtexte** — Hilfe und Lotsen (`de/help/`), Landing Page (`de/landing/`),
      Rechtstexte (`de/legal/`, Entscheidung des Users: trotz ausstehender Prüfung auslagern,
      nur Deutsch); Zimmer-Symbole lesen ihre Worte aus der Sprache der Anfrage.
      Protokoll: [2026-10-11_Mehrsprachigkeit-Auslagerung.md](Sessions/2026-10-11_Mehrsprachigkeit-Auslagerung.md).
      **11.10. abends: erklärende Texte gemeinsam gegengelesen** (29 Blöcke, Protokoll Abschnitt 9).
      **Nächste Session (frisch):** Sprachwahl des Gastes in `getLocale()` und erste Übersetzung
      (Englisch) des Gästeportals – Einstieg und offene Fragen im Protokoll, Abschnitt 7.
      Rest: Rollennamen in der Einladungs-Mail, Stripe-`locale`, `service-templates.json`.
      **17.10.: Sprachen des Hauses und Service-Baukasten entschieden** (Heimat- und Rückfallsprache,
      Blatt-Sprache gekoppelt, Baukasten mehrsprachig im Self-Service ohne automatische Übersetzung):
      [Sprachen-des-Hauses-Plan-2026-10-17.md](Sessions/Sprachen-des-Hauses-Plan-2026-10-17.md).
      **17.10.: Gästeportal auf Englisch gebaut** (Sprachwahl, Umschalter, Legende, Entwurf).
      **17.10.: gegengelesen** (31 Vorschläge, übernommen bis auf „schedule“ für den Aufschub — „frühestens ab“ ist kein Termin;
      „front desk“ statt „reception“ auch auf dem englischen Blatt).
      **17.10.: Heimat- und Rückfallsprache gebaut**, erste Blatt-Sprache folgt der Rückfallsprache.
      **17.10.: Service-Baukasten mehrsprachig gebaut** (Self-Service, Rückfall je Feld, Beispiel-Services zweisprachig).
      **17.10.: Reinigungsboard auf Englisch gebaut** (Sprache folgt dem Gerät); Gegenlesen offen:
      [Uebersetzung-Reinigungsboard-en-2026-10-17.xlsx](Sessions/Uebersetzung-Reinigungsboard-en-2026-10-17.xlsx).
      **17.10.: Verwaltung Etappe 1 auf Englisch** (Rezeption, Mails, Druckseiten; Sprache unter „Mein Zugang“); Gegenlesen offen:
      `Sessions/Uebersetzung-Verwaltung-{admin,mail,print}-en-2026-10-17.xlsx`.
      **17.10.: Etappe 2 Hilfe und Lotsen auf Englisch**; Gegenlesen offen: `Sessions/Uebersetzung-Hilfe-{help,symbols}-en-2026-10-17.xlsx`.
      **17.10. abends: zweite Gegenlese-Runde (alle Bereiche)** — 53 von 99 Vorschlägen übernommen (12 angepasst); verworfen: Rezeption
      (Zeilen verrutscht), Gästeportal (bereits abgelehnte „schedule“-Vorschläge), Kürzungen mit Inhaltsverlust.
      **17.10.: Konto und Abrechnung auf Englisch** (Rechnungen bleiben bewusst deutsch – Entscheidung offen, ob englische Rechnungen gewünscht sind).
      **17.10.: Anmeldung, Registrierung, Passwort auf Englisch** (Umschalter auf allen vier Seiten, Passwort-Mail in der Sprache der Seite).
      **18.10.: Simulator auf Englisch** (Werkzeug, Tagesbild, Konto, Mails; Einwilligung mit eigener Fassung). **18.10.: Landing Page auf Englisch** (Fußzeile der Rechtstexte englisch mit „(German)“). Noch deutsch: Rechtstexte, Vorschaubild der Link-Vorschau. **18.10.: Rechnungen auf Englisch** für Kunden außerhalb deutschsprachiger Länder (nach Land der Rechnungsanschrift).
      **Schlussrunde Gegenlesen:** `Sessions/Uebersetzung-en-neu-seit-Gegenlesen.xlsx` (nur Neues und seit der Runde Geändertes,
      erzeugt mit `--since Sessions/Uebersetzung-en-gegengelesen-2026-10-17.xlsx --full admin`; Rezeption vollständig, weil in der Runde nicht wirklich gelesen) – **18.10.: gegengelesen, nichts beanstandet.** Neuer Stand für künftige Differenzen: `Sessions/Uebersetzung-en-gegengelesen-2026-10-18.xlsx` (alle 3104 Texte).
      Offen: Rechtstexte erst nach der anwaltlichen Prüfung.
- [ ] **Thailändisch als Belastungsprobe** — probehalber implementieren, um zu
      sehen, wie weit das Sprach-System trägt: nicht-lateinische Schrift,
      andere Zeilenumbruch-Regeln (keine Leerzeichen zwischen Wörtern),
      Schriftart-Einbindung, Längen in Buttons und Slidern, Druckseiten.
- [ ] **Performance** — die App reagiert im Browser teils erst nach 1–2 s auf
      einen Klick. **04.09. erster Schnitt im Code** (siehe AGENTS.md
      „Roundtrips sind die Latenz"): `getClaims()` statt `getUser()`, Guards
      in `cache()`, serielle Abfragen parallelisiert bzw. per FK-Einbettung
      zusammengelegt, Check-in mit einem statt vier Reads. Noch offen:
      1. ~~**Vercel-Region gegen Supabase-Region prüfen**~~ — 04.09.: Funktionen
         liefen in `iad1` (Washington), die DB liegt in Irland. `vercel.json`
         mit `regions: ["dub1"]` legt sie daneben.
      2. ~~In Produktion nachmessen~~ — 04.09. vom User bestätigt: „vieles
         reagiert deutlich schneller", auch der Check-in. Kein akuter Bedarf
         mehr.
      3. Falls es später wieder spürbar wird: Seiten-Render aus der
         Action-Antwort nehmen (PIN sofort zeigen, Übersicht per
         `router.refresh()` nachziehen), optimistische Zustände in
         `RoomDialog`/`ServiceBoard` (`useOptimistic`), doppeltes Rendern nach
         Actions (`revalidatePath` + eigenes Realtime-Ereignis) entkoppeln.

- [x] ~~**Tutorial-Bereich „Lotsen"**~~ — 08.09. gebaut: Nav-Punkt „Hilfe",
      sechs Fach-Lotsen als Coach Marks über den echten Seiten,
      Einrichtungs-Lotse über fünf Seiten (Einstieg direkt aus der
      Registrierung), Hilfe-Hub mit **abgeleiteter** Einrichtungs-Checkliste.
      Protokoll:
      [2026-09-08_Lotsen-Tutorial.md](Sessions/2026-09-08_Lotsen-Tutorial.md).
- [x] ~~**Simulierte Lotsen für Reinigungsboard und Gast-Sicht**~~ — 08.09.
      gebaut: Nachbauten unter `…/hilfe/reinigung` und `…/hilfe/gast`, für
      jede Rolle sichtbar, Szenen je Schritt (`sim`-Feld), freie Bedienung
      dazwischen. Offen bleibt der Feinschliff der Beispieldaten, falls sie
      sich im Gebrauch als unpassend erweisen.
- [x] ~~**Weitere Fach-Lotsen**: Services-Board (Anfragen), Auswertung,
      Konto & Abrechnung~~ — 08.09. gebaut. Der Konto-Lotse brauchte einen
      **zweiten Piloten** im Konto-Rahmen, weil `/admin` außerhalb des
      Haus-Layouts liegt.
- [x] ~~**Lotse für Aushänge und Handouts**~~ — 08.09. gebaut. Die Sorge um
      eigene Druck-Layouts war unbegründet: Alle drei Seiten liegen unter
      `/h/<slug>/admin` und damit im Layout, das den Piloten trägt. Der Lotse
      läuft über Aushang-Seite, Übersicht (Handout) und Personal
      (Login-Karte). **Damit ist der Tutorial-Bereich vollständig** — zwölf
      Fach-Lotsen plus Einrichtung.
- [x] ~~**Kontextuelles „?" auf den Seiten selbst**, das den zur Seite
      passenden Lotsen startet~~ — 14.09. gebaut, **aber nicht als
      Lotsen-Start** (der soll kompakt bleiben und läuft beim ersten Mal),
      sondern als eigene **Nachschlage-Hilfe** je Seite: Legende mit den
      echten Symbolen und Farben, Fragen und Antworten, Verweise — als
      **Leiste rechts neben dem Inhalt** (nach dem ersten Blick des Users:
      die eigene Seite nahm die Seite weg, zu der geholfen werden sollte),
      14 Themen parallel zu den Lotsen, Hub mit Erklärung und Lotse je Karte,
      Routen `…/admin/hilfe/<thema>` bleiben zum Drucken und Teilen. Protokoll:
      [2026-09-14_Kontexthilfe.md](Sessions/2026-09-14_Kontexthilfe.md).
      **Der Erweiterungspunkt:** Tester-Rückmeldung „X war unverständlich"
      wird ein Eintrag in [hilfe.ts](src/lib/hilfe.ts). Offen bleibt ein „?"
      im Reinigungsboard selbst, falls Kräfte danach fragen — die Erklärung
      liegt heute unter der Simulation im Rezeptions-Portal. (Lotsen 08.09.)

## Komfort für Mehrhaus-Kunden (Ketten)

- [ ] **Konto-weite Service-Vorschlagsliste**
- [ ] **Kontoweite Policy-Vorgaben** mit Abweichung je Haus — **Achtung:** Das
      Gast-Zugangsverfahren (`guestAccessMode`) gehört ausdrücklich zu denen,
      die je Haus abweichen dürfen. Es hängt an der baulichen Situation
      (Aushänge im Zimmer möglich oder nicht), nicht am Konto.
- [ ] **Konsolidierte Auswertung** über alle Häuser

(alle drei: 6d-Plan, Abschnitt 13)

- [ ] **Blätter wirklich drucken** — die Höhen sind im Browser gerechnet
      (Aushang 219 mm, Handout 240 mm bei 186 mm Satzbreite), aber noch nie
      durch einen echten Druckdialog gegangen. Fälle J5, **J7–J9** im
      [GUI-Testkatalog](Sessions/GUI-Testkatalog.md): Graustufen, ob die vier
      kompakten Karten sauber auf eine Seite fallen, Scan des A4-Blatts aus
      ~50 cm. (Handout 08.09., neu gefasst 09.09.)
- [x] ~~**Zugangs-Mail mehrsprachig?**~~ — 09.09. entschieden und erledigt: Die
      Mail folgt der **ersten Sprache des Hauses** (`policies.sheetLanguage`,
      Vorgabe Deutsch); zwei Sprachen in einer Mail wären doppelt so lang, ohne
      mehr zu sagen. Das gedruckte Blatt trägt seither Piktogramme plus ein bis
      zwei Sprachen statt vier. (Handout 08.09.)
- [ ] **Gastportal mehrsprachig** — der eigentliche Grund, warum das Papier seit
      dem 09.09. kurz sein darf („Papier ist die Einladung, der Bildschirm die
      Anleitung"). Rangfolge: ausdrückliche Wahl im Portal → `Accept-Language`
      → erste Sprache des Hauses. Die vier Vorlagen in
      [guest-guide.ts](src/lib/guest-guide.ts) sind die Saat; `portalLang` in
      `buildGuestSheet` zieht die Knopf-Beschriftungen der Blätter dann
      automatisch mit. Teil der großen Mehrsprachigkeit oben.
- [ ] **Logo im Gästeportal und in der Mail** — der Unterbau steht seit dem
      09.09. (`hotels.logo_path`, Storage-Bucket, `logoUrlFor`), beides ist ein
      Einzeiler. Bewusst offen: im Portal-Kopf konkurriert es mit der
      Zimmernummer, in der Mail mit der Spam-Bewertung. (Druckblätter 09.09.)
- [ ] **A5 als drittes Druckformat**, falls Tester es verlangen — viele
      Tischaufsteller sind A5; heute gibt es DIN A4 und kompakt (92 × 130 mm,
      vier je Seite). (Druckblätter 09.09.)

## Kleinkram und Beobachtungen

- [ ] **Test-Szenario ausbauen**, wenn es nicht mehr gebraucht wird — samt
      `purgeTestDataAction`. Rückbau-Hinweis steht in `test-actions.ts`.
- [ ] **Testzugänge ohne Mailversand ausbauen** (gehört zum selben Rückbau):
      `ALLOW_TEST_ACCOUNTS`, [test-accounts.ts](src/lib/test-accounts.ts), der
      `ohneMail`-Zweig in `ladeEin` und das Häkchen in `PersonalManager`.
      **Seit 12.09. ist `ALLOW_TEST_ACCOUNTS` auch in Vercel gesetzt** (User:
      Tester brauchen fiktives Personal ohne Postfach, und getestet wird in
      Produktion). **Vor dem ersten echten Kunden wieder entfernen** — sonst
      wären vorgelesene Passwörter zurück, die im Juli bewusst abgeschafft
      wurden.
- [x] ~~**Mail-Sperre sichtbar machen**~~ (06.09., User) — **12.09. erledigt,
      und weiter gegangen:** Alle Mails (Einladung, Passwort-Link, Gast-Zugang)
      verschickt die Anwendung jetzt selbst über Resend; Supabase liefert nur
      noch den Link (`generateLink`). Damit ist das Auth-Limit weg, die
      Minuten-Drossel sitzt in `mail_log` und zählt an jedem Sende-Knopf
      sichtbar herunter, und der **Resend-Webhook** meldet zurück, ob die Mail
      zugestellt oder abgewiesen wurde (mit Grund) — vorher blieb ein Bounce
      (Freenet) unbemerkt. Siehe AGENTS.md „Mail-Versand mit Rückmeldung".
      **Produktionslauf 12.09. bestanden** (Bounce mit Grund, Zustellung,
      Countdown, Meldung an der Zeile). **Sperrliste am selben Abend
      gelöst** (User: kein Support-Fall): Abfrage bei Resend vor jedem
      Versand, „Adresse freigeben und erneut senden", „Einladungslink
      anzeigen" als Ausweg ohne Mail, Provider-Muster aus dem Protokoll.
      **Freenet-Fall am selben Abend im Resend-Log geklärt:** `550 unrouteable
      address` = unbekanntes Postfach, Buchstabendreher in der Adresse;
      Freenet hat nie blockiert. Keine dedizierte IP nötig. Erledigt.
- [ ] **Gmail-Zustellbarkeit**: Einladungen landen im Werbung-Ordner. Kein
      Fehler, sondern fehlende Sendereputation — hilft nur regelmäßiger
      Versand über Tage. Praktische Relevanz vermutlich begrenzt, weil Hotels
      eigene Mail-Domains nutzen. (Übergabe 26.07.)
      **04.09.: auch die Gast-Mail landet bei Yahoo im Spam**, schon beim
      ersten Versuch. Im Code erledigt: `text/plain`-Teil (fehlte) und
      Spam-Hinweis auf dem Handout. Was nur außerhalb des Codes geht, in
      dieser Reihenfolge:
      1. ~~`Authentication-Results` prüfen~~ — 04.09. geprüft: dreimal
         `pass`. Es ist reine Reputation.
      2. ~~Click-/Open-Tracking in Resend aus~~ — 04.09. geprüft: Tracking
         läuft in Resend nur über eine eigene Tracking-Subdomain, und es ist
         keine angelegt. Also nicht aktiv, Links zeigen direkt auf
         `rose-roomservice.app`. **Keine anlegen** — der Dialog „New tracking
         subdomain" hinter „Configure" würde es erst einschalten.
      3. ~~DMARC schärfen~~ — 04.09. gesetzt und per DNS bestätigt:
         `_dmarc.send.rose-roomservice.app TXT "v=DMARC1; p=quarantine;"`
         (ohne `rua`, bewusst keine Berichte). Auf der Hauptdomain bleibt
         `p=none`.
      4. Bei Yahoo (Sender Hub, Complaint Feedback Loop) und Google
         (Postmaster Tools) die Domain registrieren — Sichtbarkeit, kein
         Freifahrtschein.
      5. Warm-up: über Tage kleine Mengen an Adressen, die die Mail öffnen
         und aus dem Spam holen. Das ist das Einzige, was Reputation wirklich
         baut.
      Nicht sinnvoll: `List-Unsubscribe` (transaktional), Resend-eigene
      IP (Volumen viel zu klein).
- [ ] Optional: **E-Mail-Bestätigung bei der Registrierung** einschalten (dann
      echtes `signUp()` statt Admin-API mit `email_confirm`).
- [ ] **Dev-Log zeigt Passwörter**: Next.js protokolliert Server-Action-
      Argumente im Development-Modus, inklusive `loginAction(...)`. Laut Doku
      Dev-only, Produktion nicht betroffen. Abschaltbar mit
      `logging: { serverFunctions: false }` — kostet aber ein nützliches
      Werkzeug. Bewusst nicht geändert. (03.09.)
- [x] ~~**Supabase-Rate-Limit in den Integrationstests**~~ — 05.09. erledigt:
      Anmeldungen je Nutzer und Testdatei gebündelt (`sessionFor` in
      [world.ts](tests/integration/helpers/world.ts)), 16 statt 42
      Passwort-Anmeldungen je Lauf; zwei Läufe direkt hintereinander grün.
      (03.09.)

## Erledigt

- [x] ~~Mailversand in Produktion einmal ansehen~~ — 04.09. echte Mail aus
      Produktion verschickt und zugestellt (Yahoo: Spam-Ordner, siehe
      Zustellbarkeit oben)

- [x] ~~Abrechnungs-Snapshot~~ — `billing_snapshots`, geschrieben vor jeder
      Zimmerlöschung (03.09.)
- [x] ~~Löschbegehren~~ — `deletion.ts` räumt auch das ab, woran keine Kaskade
      hängt: Verlauf, Abrechnungsbelege und die Anmeldekonten (03.09.)
- [x] ~~Drei Modelle beim Personal vereinheitlichen~~ (03.09.)
- [x] ~~Zimmer/Etagen/Gebäudeteile bearbeiten und löschen~~ (03.09.)
