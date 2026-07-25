# Testplan — gemeinsamer Walkthrough (alle Portale, Schritt für Schritt)

> **Durchlauf vom 25.07.2026 abgeschlossen** (lokal gegen die gemeinsame
> Supabase-DB, alle Portale). Ergebnis: 2 Befunde, siehe „Befunde" unten.
> Haken im Plan = an diesem Tag verifiziert.

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

## Befunde des Durchlaufs (25.07.2026)

1. ~~**Maid-Login per Username+PIN scheitert bei doppeltem Benutzernamen**~~
   → **behoben am 25.07.2026.** Auf der Stage existieren `@maria` in „Mein
   Hotel" UND in „Pension Alpenblick". `maidLoginAction` suchte nur nach
   `username` mit `limit(1)`, nahm das erstbeste Profil und baute daraus
   die synthetische E-Mail → falsches Hotel → Abweisung trotz korrekter
   PIN. Der QR-Auto-Login war nicht betroffen (eindeutiger Token).
   Jetzt entscheidet die PIN: alle aktiven Kandidaten laden, über die
   Karten-PIN vorsortieren, dann der Reihe nach anmelden.
   Verifiziert: beide Marias kommen in ihr jeweils eigenes Haus, falsche
   PIN bleibt generisch abgewiesen.
2. **Zimmer-Anlage: Präfix-Option ist per Default an** (Bedienfalle, mild).
   „Etagennummer voranstellen" ist vorausgewählt, während der Platzhalter
   volle Nummern vorschlägt („z. B. 101-110"). Wer dem Platzhalter folgt,
   erzeugt 3301–3306 statt 301–306. Vorschlag: Default aus, oder
   Platzhalter auf Suffixe ändern („z. B. 01-10").

**Kein Fehler, nur zur Kenntnis:** Das Löschen eines Zimmers nimmt per
Fremdschlüssel-Kaskade auch dessen Service-Anfragen mit (beim Aufräumen
beobachtet). Für echte Häuser relevant, falls jemand ein Zimmer löscht,
statt es außer Betrieb zu nehmen.

**Zustand nach dem Durchlauf:** Testzimmer 301–303 gelöscht, Testkraft
„Petra T." deaktiviert (Historie bleibt), Hilfs-Service „Frühstück aufs
Zimmer" archiviert, Policies zurückgesetzt (PIN-Länge 4, Stayover aus,
Hotelname „Mein Hotel"), Marias Schicht beendet. Zimmer 203 war durch den
Rate-Limit-Test 15 Minuten gesperrt. Die Seed-Testlage (5 belegte Zimmer,
4 offene Anfragen) steht unverändert.

## 0) Aufräumen (Testreste der Bau-Sessions)

- [x] ~~Zimmer 101 auschecken~~ erledigt durch „Alles zurücksetzen" (25.07.)
- [x] Orders-Tab: „Zuletzt erledigt" zeigt Historie mit Bearbeiter + Zeit

## A) Rezeption — Zimmer & Aufenthalt

- [x] Login mit falschem Passwort → generische Fehlermeldung
- [x] Login korrekt → Übersicht
- [x] Zimmer anlegen: einzeln, Komma-Liste, Bereich „301-303" → wieder löschen
      *(→ Befund 2: Präfix-Option beachten)*
- [x] Löschen eines belegten Zimmers wird blockiert — belegte Zimmer haben
      gar keinen Löschen-Button
- [x] Check-in auf freies Zimmer → PIN groß sichtbar, KPI „belegt" zählt
- [x] Erneuter Klick aufs Zimmer → PIN weiterhin ablesbar
- [x] Check-out → Kachel orange „ausgecheckt", KPI „zu reinigen"
- [x] Check-in auf ungereinigtes Zimmer → Warnung → „Trotzdem einchecken"
- [x] Priorisieren → violette Blink-Kachel mit Flagge (nicht mehr rot,
      siehe Symbolik-Update); Aufheben
- [x] „Reinigung als erledigt markieren" räumt orange/violett weg

## B) Gastportal

- [x] /guest: Zimmernummer + falsche PIN → generisch abgewiesen
- [x] 5× falsche PIN → 15-Minuten-Sperre greift („Zu viele Fehlversuche —
      bitte in 15 Min. erneut versuchen.", getestet auf Zimmer 203)
- [x] Richtige PIN → Status-Seite
- [x] „Zimmer reinigen" → Rezeption sieht amber + Funken-Symbol (Realtime)
- [x] DND ersetzt Reinigungswunsch; erneut tippen nimmt zurück
- [x] QR-Deep-Link: zeigt Zimmer vorbestimmt, nur PIN — neue Zimmer brauchen
      vorher „fehlende QR-Codes erzeugen"
- [x] Check-out an der Rezeption → Gast-Seite wirft zur Anmeldung, alte PIN tot
      *(indirekt belegt: Check-out von 301 in Abschnitt A, danach war für den
      neuen Aufenthalt eine neue PIN nötig)*

## C) Reinigungsboard

- [x] Maid-Karte: QR-Ziel (`/service/auto/<token>`) führt direkt aufs Board
      *(Scan mit echtem Gerät nur auf der Stage möglich — Endpunkt verifiziert)*
- [x] Abmelden → manueller Login Username + PIN; falsche PIN generisch
      abgewiesen *(korrekte PIN scheiterte zunächst → Befund 1, behoben)*
- [x] Ohne Schicht: man kommt gar nicht erst auf die Etage („Erst die Schicht
      beginnen.") — strenger als geplant
- [x] Slider „Schicht beginnen"
- [x] Aktives Zimmer: Slider „Reinigung starten"
- [x] Während Reinigung: zweites Zimmer verweigert („Du bist noch in einem
      anderen Zimmer"); „Schicht beenden" gesperrt mit Begründung
- [x] Admin-Übersicht zeigt parallel „Reinigung läuft“, KPI „1 in Arbeit“,
      Etagen-Header nennt die Kraft (Realtime)
- [x] „Reinigung abschließen" → Zimmer neutral, Wunsch + Prio weg
- [x] „Reinigung abbrechen" → Zimmer bleibt offen
- [x] Pause an/aus, sonstige Reinigung als Zeitraum (Start/Stopp)
- [x] Schichtende (schließt offene Pause und sonstige Reinigung mit)
- [x] **Kollegin-Anzeige:** zweite Kraft „Petra T." angelegt, ihre Reinigung
      gesetzt → Maria sieht „Petra T. reinigt gerade" live
- [x] **Stale-Test:** Reinigungsstart 3 h zurückdatiert → „verwaist"-Hinweis
      mit Namen, Zimmer wieder offen, Übernahme möglich

## D) Service-Baukasten

- [x] Service „Frühstück aufs Zimmer" mit 2 Optionen (14,50 € / ohne Preis)
- [x] Option archivieren → beim Gast nicht mehr wählbar, alte Bestellung
      zeigt sie unverändert
- [x] Gast bestellt (Option + Notiz) → Nav-Badge zählt live hoch (4 → 5)
- [x] Urgent-Service bestellen → rote Karte mit Blink-Ring im Services-Board
- [x] „Erledigt" → Badge runter, Gast sieht „erledigt", Historie nennt Bearbeiter
- [x] Service archivieren → weg beim Gast, Historie bleibt lesbar

## E) Einstellungen & Policies

- [x] Hotelname ändern → Header überall aktualisiert (danach zurückgesetzt)
- [x] PIN-Länge auf 6 → Check-in erzeugte 6-stellige PIN (897699) → zurück auf 4
- [x] **Stayover:** aktiviert mit Uhrzeit 00:05 (sofort fällig) → Zimmer 202
      (Gast von gestern) zeigte „Routine-Reinigung fällig" → als erledigt
      markiert → für heute verschwunden. Danach wieder aus.
- [x] **Reinigungs-Zeitfenster** (neue Policy): außerhalb ist „Zimmer reinigen"
      gesperrt mit Hinweis, DND und Rücknahme bleiben möglich
      *(am 25.07. beim Bau verifiziert)*
- [~] Passwort ändern: **nur die Validierung geprüft** („Passwörter stimmen
      nicht überein"). Bewusst NICHT wirklich geändert — sonst wären die im
      Testplan dokumentierten Zugangsdaten ungültig.

## F) Druck (echter Drucker oder PDF)

- [x] Zimmer-QR-Aushänge: eine Karte pro Seite (11 Seitenumbrüche bei 11 Zimmern),
      Header/Bedienelemente sind `print:hidden` — echter Papierdruck steht noch aus
- [x] „Code erneuern" bei Zimmer 303 → alter Link zeigt „Dieser Link ist
      ungültig.", neuer führt auf „Zimmer 303"
- [x] Gast-Handout: Zimmer, PIN und QR vorhanden, Bedienelemente `print:hidden`
- [x] Maid-Karte: QR + PIN vorhanden, Auto-Login-Ziel funktioniert

## G) Robustheit / Ränder

- [x] Zwei Admin-Fenster parallel: Priorisierung in Fenster 1 erschien in
      Fenster 2 ohne Zutun (Realtime)
- [x] Fallback-Poll nachgewiesen: `profiles` löst KEIN Realtime-Event aus —
      eine Umbenennung der Kraft war nach ~60 s trotzdem in der offenen
      Übersicht sichtbar, also durch den Poll
- [x] Handy-Format (375 px): Gastportal und Reinigungsboard ohne horizontales
      Scrollen
