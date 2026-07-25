# Testplan — gemeinsamer Walkthrough (alle Portale, Schritt für Schritt)

Für die nächste Session vereinbart: alles einmal von Hand durchtesten, in
dieser Reihenfolge. Haken setzen, Auffälligkeiten direkt notieren.

**Zugänge:** Rezeption `rezeption@rose.local` / `F51DeP17ed1w` ·
Maid `maria` / PIN `046055` (Karte unter /admin/personal).
**Start:** `npm run dev` → http://localhost:3000 — oder besser direkt auf dem
Test-Deployment https://rose-sand-one.vercel.app (gleiche DB; QR-Scans mit
Handy/Tablet funktionieren nur dort).

**Hilfsmittel (vorübergehend, 25.07. eingebaut):** Unter
`/admin/einstellungen/test` (Kachel „Test-Szenario" im Einstellungen-Hub,
nur Admin) gibt es das Seeding-Panel. „Szenario erzeugen" setzt
alles zurück und baut per Prozent-Reglern + Zufalls-Seed eine praxisnahe Lage
auf (echte Stays mit PINs — werden im Panel angezeigt —, Reinigungswünsche,
DND, ausgecheckte + priorisierte Zimmer, offene Bestellungen; zufällig über
die Zimmer verteilt, gleicher Seed ⇒ identische Verteilung; rund die Hälfte
der Stays ist „seit gestern" für Stayover-Tests).
„Alles zurücksetzen" räumt jede Testlage ab (Stays ausgecheckt, Status
neutral, offene Bestellungen gelöscht). Rückbau nach der Testphase:
`TestScenarioPanel.tsx` + `test-actions.ts` + `test/page.tsx` löschen,
Kachel in `einstellungen/page.tsx` entfernen.

**Layout-Update 25.07.:** Nav ist jetzt Übersicht | Services |
Einstellungen — „Services" ist das frühere Bestellungen-Board, der
Konfigurator heißt „Service-Baukasten" und liegt wie Zimmer, Personal
und QR-Aushänge als Kachel im Einstellungen-Hub (rollenabhängig).
KPI „frei" heißt jetzt „bereit" (frei & gereinigt, grün), Kacheln freier
gereinigter Zimmer tragen einen grünen Balken, die KPI-Leiste bleibt beim
Scrollen stehen. Zimmer mit offener Service-Anfrage zeigen eine Glocke
neben der Nummer — blinkend rot bei mindestens einer dringenden Anfrage.

**Reinigungsboard-Umbau 25.07. (Migration nötig!):** Neue Etagen-
Zwischenebene: nach Schichtbeginn erst verdichtete Etagen-Zeilen (feste
Reihenfolge wie Rezeption, keine Score-Umsortierung mehr), Etage antippen =
einbuchen (live sichtbar für Kolleginnen + Rezeptions-Etagen-Header), dann
nur die Zimmer der Etage mit „Zurück"-Button und violetter Blink-Warnlampe
bei offenem Prio-Zimmer. Voraussetzung:
`Supabase_sql/2026-07-25_maid_presence.sql` einspielen.

**Symbolik-Update 25.07.:** Priorisierte Reinigung ist jetzt VIOLETT
(Balken, Flagge statt Warndreieck, violetter Blink-Ring, violetter
Start-Slider auf dem Reinigungsboard). Rot + Blinken heißt ausschließlich
„dringende Service-Anfrage" (Kachel-Ring, Glocke, Nav-Badge blinken rot).
DND bleibt rosé, Symbol ist jetzt der Verbots-Kreis (Ban) statt Mond —
auf beiden Boards.

## 0) Aufräumen (Testreste der Bau-Sessions)

- [x] ~~Zimmer 101 auschecken~~ erledigt durch „Alles zurücksetzen" (25.07.)
- [ ] Orders-Tab: „Zuletzt erledigt" ansehen — Alt-Bestellungen sind ok als Historie

## A) Rezeption — Zimmer & Aufenthalt

- [ ] Login mit falschem Passwort → generische Fehlermeldung
- [ ] Login korrekt → Übersicht
- [ ] Zimmer anlegen: einzeln, Komma-Liste, Bereich „301-303" → wieder löschen
- [ ] Löschen eines belegten Zimmers wird blockiert
- [ ] Check-in auf freies Zimmer → PIN groß sichtbar, KPI „belegt" zählt
- [ ] Erneuter Klick aufs Zimmer → PIN weiterhin ablesbar
- [ ] Check-out → Kachel orange „ausgecheckt", KPI „zu reinigen"
- [ ] Check-in auf ungereinigtes Zimmer → Warnung → „Trotzdem einchecken"
- [ ] Priorisieren → rote Blink-Kachel; Aufheben
- [ ] „Reinigung als erledigt markieren" räumt orange/rot weg

## B) Gastportal

- [ ] /guest: Zimmernummer + falsche PIN → generisch abgewiesen
- [ ] 5× falsche PIN → 15-Minuten-Sperre greift (Meldung mit Restzeit)
      *(Achtung: blockiert das Zimmer 15 min — am besten am Schluss von B testen)*
- [ ] Richtige PIN → Status-Seite
- [ ] „Zimmer reinigen" → Rezeption sieht amber (Realtime, zweites Fenster)
- [ ] DND ersetzt Reinigungswunsch; erneut tippen nimmt zurück
- [ ] QR-Deep-Link (Aushang-Seite → URL kopieren): zeigt Zimmer vorbestimmt, nur PIN
- [ ] Check-out an der Rezeption → Gast-Seite wirft sofort zur Anmeldung, alte PIN tot

## C) Reinigungsboard

- [ ] Maid-Karte drucken (/admin/personal → Karte) — QR mit Handy/Tablet scannen → Auto-Login
- [ ] Abmelden → manueller Login Username + PIN; falsche PIN generisch abgewiesen
- [ ] Ohne Schicht: Zimmer-Dialog verweigert Start („Erst Schicht beginnen")
- [ ] Slider „Schicht beginnen"
- [ ] Aktives Zimmer (vorher als Gast „Reinigen" wünschen): Slider „Reinigung starten"
- [ ] Während Reinigung: zweites Zimmer starten wird verweigert; „Schicht beenden" gesperrt
- [ ] Admin-Übersicht zeigt parallel „in Arbeit" (Realtime)
- [ ] „Reinigung abschließen" → Zimmer neutral, Wunsch weg
- [ ] Einmal „Reinigung abbrechen" testen → Zimmer bleibt offen
- [ ] Pause an/aus, „Sonstige Reinigung" loggen
- [ ] Schichtende (schließt offene Pause mit)
- [ ] **Kollegin-Anzeige:** zweite Maid anlegen, in zweitem Browser/Inkognito einloggen,
      Zimmer starten → erste sieht „X reinigt gerade" live
- [ ] **Stale-Test:** Einstellungen → Stale-Minuten auf 5 stellen, Reinigung starten,
      6 min warten → Zimmer gilt wieder als offen, „verwaist"-Hinweis, Übernahme möglich.
      Danach Stale-Minuten zurück auf 90.

## D) Service-Baukasten

- [ ] Neuen Service mit 2–3 Optionen (mit/ohne Preis) anlegen
- [ ] Option archivieren → verschwindet beim Gast, alte Bestellungen unverändert
- [ ] Gast bestellt (Option + Notiz) → Badge an der Rezeption zählt hoch (Realtime)
- [ ] Urgent-Service bestellen → rote Blink-Karte im Orders-Tab
- [ ] „Erledigt" → Badge runter, Gast sieht „erledigt", Historie zeigt Bearbeiter
- [ ] Service archivieren → weg beim Gast, Historie bleibt lesbar

## E) Einstellungen & Policies

- [ ] Hotelname ändern → Header überall aktualisiert
- [ ] PIN-Länge auf 6 → nächster Check-in erzeugt 6-stellige PIN → zurück auf 4
- [ ] **Stayover:** aktivieren, Uhrzeit ein paar Minuten in die Zukunft, Zimmer mit
      Gast von gestern nötig (über Nacht belegt lassen oder checked_in_at zurückdatieren)
      → zur Uhrzeit erscheint „Routine fällig" auf beiden Boards → Reinigung
      abschließen → weg für heute. Danach Stayover wieder aus (oder bewusst an lassen).
- [ ] Passwort ändern (danach neu einloggen!) — neues Passwort sicher notieren

## F) Druck (echter Drucker oder PDF)

- [ ] Zimmer-QR-Aushänge: „Alle drucken" → eine Karte pro Seite, Header nicht mit drauf
- [ ] „Code erneuern" bei einem Zimmer → alter Aushang-Link tot, neuer funktioniert
- [ ] Gast-Handout nach Check-in drucken
- [ ] Maid-Karte drucken

## G) Robustheit / Ränder

- [ ] Zwei Admin-Tabs parallel: Aktionen in Tab 1 erscheinen in Tab 2 (Realtime)
- [ ] Board 1 h+ offen stehen lassen → aktualisiert weiter (60-s-Fallback-Poll)
- [ ] Handy-Formatprüfung: Gastportal + Reinigungsboard auf schmalem Viewport
