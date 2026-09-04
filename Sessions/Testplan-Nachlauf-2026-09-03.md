# Testplan — Nachlauf zur Implementierung vom 03.09.2026

Manueller Durchlauf der Bausteine vom 03.09. (siehe die beiden Protokolle
[Zimmer, Personal, Abrechnung, Löschbegehren](2026-09-03_Zimmer-loeschen-bearbeiten-und-Testdaten.md)
und [Gast-Zugangsverfahren](2026-09-03_Gast-Zugangsverfahren.md)). Gestern
wurde jeder Baustein beim Bau im Browser durchgespielt — heute geht es um den
**zusammenhängenden** Durchlauf mit frischem Blick, so wie ein Tester ihn
erlebt. Haken setzen, Auffälligkeiten sofort unter „Befunde" notieren.

**Reihenfolge ist bewusst:** Erst die harmlosen Dinge (Bearbeiten, Einstellungen),
dann die Löschvorgänge, zuletzt das Löschbegehren — es braucht ein eigenes
Wegwerf-Haus und ist nicht umkehrbar.

## Vorbereitung

- **Umgebung: Produktion**, https://rose-roomservice.app — dort laufen
  Zugänge, Portale, Mail und QR-Scans mit dem Handy unter echten Bedingungen;
  lokal klappt manches davon nicht. Produktion und lokal teilen dieselbe
  Datenbank. Jeder Push auf `main` deployt automatisch — Korrekturen aus
  Befunden sind nach dem Push in wenigen Minuten live.
  **Einzige Ausnahme:** die Testzugänge ohne Mail (Block 4, erster Teil)
  existieren nur lokal, weil `ALLOW_TEST_ACCOUNTS` in Produktion absichtlich
  nicht gesetzt ist. Für Rezeptions- und Manager-Zugänge in Produktion braucht
  es eine echte Adresse und die Einladungsmail.
- **Haus:** `test-hotelkette` (81 Zimmer, 0 belegt, **keine**
  Reinigungskraft — die entsteht in Block 4; für Block 2 vorher eine anlegen).
  Im selben Konto liegt `marcus-hotel` (135 Zimmer, 83 belegt, 1 Reinigungskraft)
  — das zweite Haus für den Manager-Test in Block 4. Stand 04.09. morgens.
  Als **Inhaber** anmelden (Manager reicht für Block 1–5, nicht für Block 6
  und 8).
- **Zweites Fenster:** Ein Privatfenster (oder zweiter Browser) für Gast- und
  Reinigungs-Sitzungen, damit die Cookies sich nicht in die Quere kommen.
- **Ausgangslage sauber:** Einstellungen → Test-Szenario → „Testdaten
  vollständig entfernen". Danach sollte die Übersicht 0 belegte Zimmer zeigen.
- **Gedankenmodell für alles Folgende:** *Was verschwindet, wird vorher
  beziffert. Was Nachweis ist, überlebt.* Wo der Dialog etwas anderes sagt als
  das, was danach passiert, ist es ein Befund.

## 1) Zimmer-Setup: Bearbeiten (Einstellungen → Zimmer)

Anlegen zum Üben: Gebäudeteil „ZZ-Test", Etage 90, Zimmer ZZ01–ZZ03.

- [x] Ab dem zweiten Gebäudeteil erscheint die **Gebäude-Ebene** in der Liste
      mit eigener Aktion; vorher nicht.
- [x] Klick auf ein Zimmer öffnet den Dialog mit **drei benannten Aktionen**
      (Bearbeiten · Außer Betrieb nehmen · Endgültig löschen) samt Erklärsatz.
      Derselbe Dialog an der Etage und am Gebäudeteil.
- [x] Zimmer bearbeiten: ZZ02 → ZZ09, Etage 90 → 91. Liste sortiert sich um,
      Zimmer-Verlauf und QR-Token bleiben (Aushang öffnen: gleicher Link).
- [x] Hinweis „gedruckte Aushänge tragen die alte Beschriftung" erscheint
      **nur** bei Nummern- oder Gebäudeteil-Änderung, nicht bei reinem
      Etagenwechsel.
- [x] Kollision: ZZ01 in ZZ03 umbenennen → Fehlermeldung nennt Gebäudeteil
      und Etage des Bestandszimmers, **nichts** wurde geändert.
- [x] Etage verschieben (90 → 92): alle Zimmer der Etage zugleich. Danach eine
      Kollision provozieren (Etage mit vorhandener Nummer zusammenlegen) →
      Abbruch, **kein** Zimmer halb verschoben.
- [x] Gebäudeteil umbenennen („ZZ-Test" → „ZZ-Prüfung"): alle Zimmer folgen,
      QR-Hinweis erscheint.

## 2) Zimmer-Setup: Außer Betrieb und Löschen

- [x] Zimmer außer Betrieb nehmen → verschwindet von Reinigungsboard und
      Aushang, Übersicht zeigt es ausgegraut, Check-in abgewiesen. „Wieder in
      Betrieb" stellt es her.
- [x] **Löschen ohne Historie** (frisches ZZ-Zimmer): Dialog sagt „Noch nie
      benutzt", **kein** Abtippfeld, Löschen sofort möglich. Nummer ist danach
      wieder frei (gleiches Zimmer neu anlegen klappt).
- [x] **Löschen mit Historie:** ZZ-Zimmer einchecken, Gast setzt
      „Zimmer reinigen", Reinigungskraft reinigt (Start + Abschluss), Check-out.
      Dialog beziffert: Aufenthalte, Service-Anfragen, Verlaufs-Einträge,
      ungültig werdende Aushänge — und sagt ausdrücklich, dass
      Reinigungs-Stiche **bleiben**. Zahlen mit dem Zimmer-Verlauf abgleichen.
- [x] Abtipp-Riegel: Knopf bleibt gesperrt bis die Bezeichnung **exakt**
      stimmt (Kleinschreibung reicht nicht). Daneben der Ausweg „Lieber außer
      Betrieb nehmen".
- [x] Nach dem Löschen: Auswertung → die Reinigung der Kraft ist noch gezählt
      (Stich überlebt, nur ohne Zimmerbezug).
- [x] **Belegtes Zimmer:** Check-in, dann Löschen versuchen → hart gesperrt
      mit „bitte zuerst auschecken", kein Abtippfeld, das etwas freischalten
      könnte.
- [x] Etage löschen, deren Zimmer teils belegt sind → gesperrt, nichts passiert.
- [x] Letztes Zimmer einer Etage löschen → Etage verschwindet; letztes Zimmer
      eines Gebäudeteils → Gebäude-Ebene verschwindet wieder.
- [x] Singular/Plural in Dialog und Meldung („1 Aufenthalt", nicht
      „1 Aufenthalte").

## 3) Testdaten vollständig entfernen (Einstellungen → Test-Szenario)

- [x] Szenario erzeugen, dann bei einem belegten Zimmer den Löschdialog
      öffnen → mit Historie, gesperrt (belegt).
- [x] „Alles zurücksetzen" → Dialog derselben Zimmer: **weiterhin** Historie
      (Aufenthalte, Verlauf). Das ist gewollt und der Unterschied zum nächsten
      Punkt.
- [x] „Testdaten vollständig entfernen" → Meldung beziffert Aufenthalte,
      Anfragen, Verlauf, Stiche. Danach: Löschdialog meldet „Noch nie
      benutzt", Zimmer-Verlauf leer, Auswertung leer, Übersicht neutral.
- [x] Zimmer und Personal sind **nicht** angetastet (Anzahl vorher/nachher).

## 4) Personal: Ein Modell für drei Arten (Einstellungen → Personal)

Wegwerf-Kräfte anlegen: Reinigung `zztest`, Rezeption und Manager jeweils mit
Häkchen „Ohne E-Mail anlegen (Testbetrieb)" und Adresse `zz-…@rose.local`.

**Testzugänge ohne Mail (nur lokal mit `npm run dev`, `ALLOW_TEST_ACCOUNTS=1` in `.env.local` — in Produktion nicht vorhanden):**
- [~] Häkchen erscheint in beiden Anlege-Formularen (Rezeption, Manager).
      *(nur lokal, in Produktion nicht geprüft)*
- [~] Zugang entsteht sofort, Passwort wird **genau einmal** angezeigt
      (Seite neu laden → weg). Keine Mail. *(nur lokal)*
- [~] Anmelden mit dem Testzugang im Privatfenster → landet im richtigen Haus
      mit der richtigen Rolle. *(nur lokal)*
- [x] Gegenprobe Produktion: auf rose-roomservice.app fehlt das Häkchen
      (04.09. in Produktion geprüft: beide Formulare ohne Häkchen).

**Bearbeiten (alle drei Arten dieselbe Zeile, derselbe Dialog):**
- [x] Reinigung: Anzeige- **und** Benutzername änderbar; Hinweis zur
      gedruckten Karte erscheint nur bei Benutzernamen-Änderung.
      (Mary → Mary Test, @mary → @marytest; Hinweis erst beim Benutzernamen)
- [x] Nach Benutzernamen-Wechsel: **PIN-Login mit dem neuen Namen** klappt,
      alter Name „Benutzername oder PIN ist falsch", QR-Karte weiter gültig;
      offene Sitzung überlebt die Umbenennung, Kopfzeile zeigt neuen Namen.
      Auth-Adresse in der DB nachgemessen: `marytest@<hotel>.rose.svc`.
- [x] Rezeption: nur Anzeigename-Feld, kein Benutzername. *(Manager: keiner
      vorhanden, nicht geprüft)*

**Stufe 1 — Zugang beenden (umkehrbar):**
- [x] Reinigung mit offener Sitzung: Zugang beenden → Reload wirft raus mit
      „Dieser Zugang ist nicht mehr aktiv. Bitte wende dich an die Rezeption."
      PIN-Login: dieselbe Meldung. QR-Karte: „QR-Code ist nicht mehr gültig …
      neue Karte anfordern" (→ Beobachtung 8). Liste zeigt „Beendete Zugänge".
- [ ] Rezeption/Manager mit offener Sitzung: **nicht geprüft** — bräuchte eine
      zweite angemeldete Sitzung bzw. einen Manager mit zwei Häusern (keiner
      angelegt, echte Adresse nötig).
- [x] „Wieder aktivieren" → Meldung „alter Zugang (PIN + Karte) gilt erneut",
      QR-Karte meldet sofort wieder an.

**Stufe 2 — Endgültig löschen:**
- [x] Reinigung **ohne** Historie (ZZ Test): „hat noch keinen einzigen
      Eintrag … es geht nichts verloren", kein Abtippfeld, gelöscht.
- [x] Reinigung **mit** Historie (Mary Test, 4 Stiche): Dialog nennt
      „4 Einträge im Tätigkeits-Protokoll (4.9.2026 bis 4.9.2026)", die
      Login-Karte, Abtippfeld „marytest", Knopf gesperrt, Ausweg „Lieber
      Zugang beenden — Arbeitsnachweis bleibt". **Nur gelesen, abgebrochen**
      (Mary bleibt). → **Befund 7**: Dialog im Dark Mode kaum lesbar.
- [~] Rezeption: Dialog sagt korrekt „An diesem Zugang hängt nichts, das
      Anmeldekonto wird deshalb vollständig gelöscht" — Variante **mit**
      Vorgang nicht geprüft (kein Rezeptions-Vorgang vorhanden). Abgebrochen.
- [ ] Manager in zwei Häusern: **nicht geprüft** (kein Manager angelegt).
- [x] Papierkorb sitzt an der **aktiven** Kraft.

**Nach Befund 5 — vergessener Abschluss:**
- [x] Zeitlimit 5 min, Mary startet 808 um 18:00:40 UTC, Übersicht und Board
      **gleichzeitig** geladen nach 18:05:40 → Zimmer offen, `room_states`
      mit Quelle `system`, **genau ein** `clean_aborted` (Race-Test bestanden),
      `at` = 18:05:40.072 = Start + 5 min exakt. Verlauf: „Reinigung nicht
      abgeschlossen (Zeitlimit, Mary Test) · System". Auswertung: „Auffällig 1
      · 1 abgebrochen", 0 Zimmer. Timeout zurück auf 90.
- [x] Marcus-Hotel, Zimmer 902: Check-in 20:01 · Oli, Check-out 20:03 · Oli
      (Befund 3 + 4 bestätigt).

## 5) Gast-Zugangsverfahren (Einstellungen → Gastzugang)

Durchlauf 04.09. in Produktion (Chrome + Vorschau-Browser), Ausgangslage:
Haus stand auf `link` (vom Vortag), zuerst auf PIN gestellt.

- [x] Seite zeigt beide Karten, aktives Verfahren markiert, zweiter Faktor
      steht offen im Text. Befund 1 behoben, Karte im Dark Mode lesbar.
- [x] **Nach Befund 2:** Abschnitt „QR-Aushänge für die Zimmer" erscheint im
      PIN-Verfahren, im Link-Verfahren der Hinweis „ausgeblendet". Hub ohne
      Aushänge-Kachel für Inhaber. *(Rezeptions-Sicht und Aushang-Seite im
      Link-Verfahren nicht separat angesehen.)*
- [x] PIN-Verfahren: Check-in 801 → PIN 169663, Gast-Login per Zimmernummer +
      PIN funktioniert.
- [x] Umstellen auf Link → Meldung samt „Aushänge aus den Zimmern nehmen".
- [x] **Kernbeweis:** 801 zeigt weiter PIN 169663 — vor und nach beiden
      Umstellungen; Gast-Login per PIN weiter möglich.
- [x] Check-in 802 im Link-Verfahren → „ZUGANG AUSHÄNDIGEN", keine PIN;
      Handout mit QR, Sicherheitshinweis, Link `/guest/s/…`; **Adressfeld für
      Mail-Versand vorhanden** (Block 7, erster Punkt).
- [x] Link geöffnet → ohne Eingabe im Portal 802. „Zimmer reinigen" und
      Bestellung „Technischer Dienst" funktionieren; Übersicht zeigt „Gast
      wünscht Reinigung · DRINGENDE Service-Anfrage", Services-Board die
      Bestellung; Verlauf: Anfrage · Gast, erledigt · Oli.
- [x] Gast-Formular im Link-Modus: erklärender Hinweis, Formular bleibt. Fünf
      Fehlversuche mit Zimmer 802 → `pin_attempts` bleibt 0 auf **beiden**
      Aufenthalten (DB nachgemessen), 801 meldet sich danach normal an.
      *(Zimmer-QR von 802 nicht geprüft — für die Räume existieren keine
      Aushang-Token.)*
- [x] Check-out 802 → Link erneut: Weiterleitung auf `/guest?error=link`;
      offene Gast-Sitzung: nächster Aufruf landet auf der Anmeldung.
      → **Beobachtung 9**: Hinweisseite spricht vom „QR-Code im Zimmer".
- [x] Zurück auf PIN → Check-in 802 löste die Warnung „Zimmer nicht bereit"
      aus (ungereinigt nach Check-out), „Trotzdem einchecken" → PIN 632723.
      801 unverändert.

## 6) Abrechnungs-Snapshot (`/admin`, Konto-Kasten, nur Inhaber)

- [x] Stand 04.09. nach den Zimmerlöschungen aus Block 2: laufender Monat
      „222 Zimmer in Betrieb · 223 abrechenbar" (ein gelöschtes/deaktiviertes
      Zimmer zählt im laufenden Monat weiter), August 2026: 216 Zimmer,
      Juli 2026: 81 Zimmer, beide „festgeschrieben". Zahlen der geschlossenen
      Monate haben sich durch die Löschungen des Tages nicht bewegt (die
      Snapshots stammen vom 03.09.).
- [ ] Zimmer neu anlegen → laufender Monat steigt, geschlossene nicht.
      *(nicht gesondert geprüft)*

## 7) Mail-Versand und Handout in Produktion (rose-roomservice.app)

Offener Punkt aus [TODO.md](../TODO.md).

- [x] Handout eines belegten Zimmers: **Adressfeld** für den Mail-Versand ist
      da → beide Variablen greifen (04.09., Handout 802).
- [x] Einmal an die eigene Adresse senden (vom User an yahoo.de): Mail kam an
      (Spam-Ordner, Befund 6). *(Absender-Anzeigename, QR-frei, Link-Ziel
      nicht einzeln abgehakt — bitte in der Mail nachsehen.)*
- [ ] Im Link-Verfahren: Mail trägt den Aufenthalts-Link; nach Check-out ist
      er tot.
- [ ] QR aus dem Handout mit dem Handy scannen (beide Verfahren).
- [x] Postfach prüfen: Spam-/Werbung-Ordner? → **Befund 6**, Yahoo: Spam.
- [x] In der Yahoo-Mail „Original anzeigen": `Authentication-Results` zeigt
      `spf=pass dkim=pass dmarc=pass` → Technik sauber, **reine Reputation**.
- [x] Tracking in Resend: nicht aktiv (läuft nur über eine eigene
      Tracking-Subdomain, keine angelegt). Nichts zu tun, nichts anlegen.

## 8) Löschbegehren (`/admin` → „Daten löschen", nur Inhaber) — zuletzt

Durchlauf 04.09. in Produktion mit Wegwerf-Haus „ZZ-Löschprobe"
(`/zz-loeschprobe`, 2 Zimmer, Reinigungskraft ZZ Kraft, ein Check-in/-out,
eine abgeschlossene Reinigung mit Schicht). Kein Rezeptions-Testzugang
(bräuchte echte Adresse).

- [x] Bereich eingeklappt, öffnet mit Erklärtext; je Haus ein „Löschen", dazu
      „Gesamtes Konto löschen". *(Manager-Sicht nicht geprüft — kein Manager.)*
- [x] Vorschau beziffert **exakt** den DB-Stand vorher (nachgemessen):
      2 Zimmer · 1 Aufenthalt · 4 Einträge im Tätigkeits-Protokoll ·
      2 Einträge im Zimmer-Verlauf · 1 Anmeldekonto samt E-Mail-Adresse
      (ZZ Kraft). Der Inhaber wird nicht als verschwindend gezählt.
- [x] Hausname muss abgetippt werden („ZZ-Löschprobe").
- [x] Nach dem Löschen: Meldung „ZZ-Löschprobe wurde vollständig entfernt",
      Konto zeigt wieder 2 Häuser, Zahlen der geschlossenen Monate unverändert
      (216 / 81). DB: hotels, rooms, stays, room_state_transitions, staff_log,
      profiles, maid_login_tokens, billing_snapshots des Hauses alle 0;
      Auth-Konten 14 → 13, `zzkraft@…` weg. Inhaber weiterhin angemeldet,
      Nachbarhäuser unberührt. `/h/zz-loeschprobe/service` → 404.
- [~] Anmeldung mit gelöschtem Rezeptions-Testzugang schlägt fehl —
      **nicht geprüft** (kein Rezeptions-Zugang im Wegwerf-Haus); ersatzweise:
      QR-Karte/Sitzung der gelöschten Reinigungskraft führt auf 404 des Hauses.
- [ ] **Stammhaus-Grenzfall:** nicht erreichbar — das Stammhaus des Inhabers
      ist `test-hotelkette` (DB: `profiles.hotel_id`), das Wegwerf-Haus war
      neu. Bleibt durch den Integrationstest abgedeckt.
- [x] **Nicht getestet, wie geplant:** Konto löschen.

## Nicht durchgeführt

Was im Produktionslauf am 04.09. **nicht** geprüft werden konnte, mit Grund
und dem, was es bräuchte. Bleibt offen, bis die Voraussetzung da ist.

| Block | Test | Warum nicht | Was es bräuchte |
|---|---|---|---|
| 4 | Testzugänge ohne Mail (Häkchen, Einmal-Passwort, Anmeldung) | existieren nur lokal (`ALLOW_TEST_ACCOUNTS`), in Produktion absichtlich nicht | lokaler Lauf mit `npm run dev` |
| 4 | Rezeption/Manager **mit offener Sitzung** Zugang beenden → Umleitung | nur eine Management-Sitzung (Inhaber) verfügbar; die Rezeption war nicht angemeldet | zweiter Browser, als `Test-Rezeptionist` angemeldet |
| 4 | Manager mit **zwei Häusern**: beenden/löschen wirkt nur auf eines | kein Manager angelegt | Manager mit echter Adresse anlegen, in `test-hotelkette` **und** `marcus-hotel` eintragen |
| 4 | Manager bearbeiten (nur Anzeigename) | kein Manager angelegt | s. o. |
| 4 | Rezeption löschen **mit** Vorgang → Dialog sagt „Anmeldekonto bleibt", Verlauf behält den Namen | `Test-Rezeptionist` hat noch keinen Vorgang (Check-in oder „gereinigt markieren") | als Rezeption anmelden, einen Check-in machen, dann Löschdialog öffnen |
| 4 | Reinigung **mit** Historie tatsächlich löschen (Kaskade, Verlauf namenlos) | Dialog nur gelesen, Mary bewusst behalten | Wegwerf-Kraft mit ein paar Stichen anlegen und löschen |
| 5 | Zimmer-QR (Wandaushang) von 802 im Link-Verfahren → PIN-Formular ohne PIN | für die Zimmer existieren keine Aushang-Token | auf der Aushang-Seite „fehlende QR-Codes erzeugen", dann `/guest/r/<token>` |
| 7 | Mail-Inhalt (Absender = Hotelname, Link-Ziel, kein QR-Bild) | Mail vom User verschickt, Inhalt nicht eingesehen; zweiter Versuch kam gar nicht an (auch nicht im Spam) — in den Vercel-Logs aller heutigen Deployments kein `[mail]`-Fehler | Zeitpunkt und Adresse des Versuchs, dann Resend → Logs (Delivered/Bounced) |
| 8 | Stammhaus-Grenzfall, Rezeptions-Zugang gelöscht → Anmeldung tot, Manager-Sicht des Bereichs, Konto löschen | s. Block 8 | eigenes Wegwerf-Konto über `/registrieren` |

## Befunde

| # | Block | Beobachtung | Erwartet | Status |
|---|---|---|---|---|
| 1 | 5 | Aktive Karte auf „Gäste-Zugang" im Dark Mode: fast weißer Hintergrund (`bg-action-tint` = Blau-50, Tints kennen kein Dark) mit heller Ink-Schrift — unlesbar. | Auswahl lesbar in beiden Themes. | behoben 04.09.: Karte behält `bg-surface`, Auswahl über Rahmen + Ring in Aktionsfarbe |
| 3 | 2 | Zimmer-Verlauf: „Check-in · Oli", aber „Check-out · Rezeption" — derselbe Aufenthalt, zwei Namen. Ursache: `stays` hatte nur `created_by`, für den Check-out keine Spalte; der Verlauf setzte pauschal „Rezeption". | Beide Ereignisse nennen die Person. | behoben 04.09.: Migration `stays.checked_out_by`, `checkOutAction` schreibt sie, Verlauf liest sie (Alt-Aufenthalte weiter „Rezeption") |
| 4 | Rückfrage | Zimmer-Verlauf löste Namen nur über `profiles.hotel_id` auf (= Stammhaus). Inhaber/Manager mit mehreren Häusern erschienen in jedem weiteren Haus als „Rezeption", obwohl die ID gespeichert war. | Name in jedem Haus. | behoben 04.09.: Auflösung über die vorkommenden Akteur-IDs |
| 5 | Rückfrage | Stale-Timeout (vergessener Abschluss) war reine Ableitung: im Verlauf blieb „Reinigung gestartet" ohne Ende, der stille Reset war unsichtbar. Label `clean_aborted` existierte, nichts schrieb es. | Reset nachvollziehbar. | umgesetzt 04.09.: erster Zugriff nach dem Limit schreibt `clean_aborted` (Quelle `system`, datiert auf Start + Limit) und setzt `room_states` zurück |
| 6 | 7 | Gast-Mail landet bei Yahoo beim ersten Versuch im Spam. Technik (SPF, DKIM auf `send.rose-roomservice.app`) steht; Mail hatte **keinen** Plain-Text-Teil; Domain ohne Sendehistorie. | Posteingang. | teils 04.09.: `text/plain` ergänzt, Spam-Hinweis auf dem Handout. Rest ist Dashboard/DNS/Zeit — Schritte in TODO.md |
| 7 | 4 | Löschdialog Personal (`bg-critical-tint`) im Dark Mode: Aufzählung und Nebenknöpfe fast unsichtbar — Tints haben keine Dark-Variante, dieselbe Ursache wie Befund 1, nur breiter (alle Tint-Kästen mit Ink-Text). | Lesbar in beiden Themes. | behoben 04.09. an der Wurzel: Dark-Werte für Tint-, Pill-, Deep- und Text-Strong-Token in `globals.css`; in Produktion am Board-Hinweis nachgemessen |
| 8 | 4 | QR-Login einer **beendeten** Kraft: „QR-Code ist nicht mehr gültig … neue Karte anfordern" — sachlich falsch, eine neue Karte hilft nicht, der Zugang ist gesperrt. PIN-Login sagt es richtig. | Gleiche Meldung wie beim PIN-Login. | behoben 04.09.: eigener Fehlercode `deactivated`, dieselbe Meldung |
| 9 | 5 | Hinweisseite `/guest?error=link` nach Check-out eines Link-Gastes: „Bitte den QR-Code im Zimmer scannen" — in einem Link-Haus gibt es keinen, und der eigentliche Grund (Aufenthalt beendet) steht nicht da. | Text nennt den Fall: „Dieser Zugang ist mit dem Check-out erloschen." | behoben 04.09.: `/guest?error=link` erklärt den erloschenen Zugang statt auf den Zimmer-QR zu verweisen |
| 2 | 5 | QR-Aushänge als eigene Hub-Kachel, obwohl sie nur im PIN-Verfahren Sinn haben. | Aushänge dort, wo das Verfahren gewählt wird, und nur wenn „Fester QR-Code je Zimmer" aktiv ist. | umgesetzt 04.09.: Abschnitt auf „Gäste-Zugang", Kachel/Knopf entfernt, Rezeptions-Kachel nur im PIN-Verfahren |

## Aufräumen nach dem Durchlauf

- [ ] ZZ-Zimmer, ZZ-Personal entfernt
- [ ] Gastzugang wieder auf „PIN"
- [ ] „Testdaten vollständig entfernen" ein letztes Mal
