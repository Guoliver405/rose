# Bauplan: Reinigungs-Simulator als eigenes Werkzeug hinter einer Anmeldung

Stand 26.09.2026 · Entscheidungen des Users in dieser Session · **noch nichts gebaut**

> **Wiederaufnahme in einer neuen Session:** Erst `AGENTS.md` lesen (Abschnitte
> „Landing Page", „Check-out-Druck", „Mail-Versand mit Rückmeldung"), dann diesen
> Plan. Mit Phase 1 beginnen. Antworten durchgehend auf **Deutsch** – auch
> Zwischensätze zwischen Werkzeugaufrufen (Rückmeldung des Users).

---

## 1. Ziel

Der Tagesvergleich der Landing Page (`#vergleich`) ist inzwischen ein
vollständiges Modell. Er soll als **eigenes Werkzeug** bereitstehen: Ein Hotel
rechnet **sein** Haus durch – Größe, Personal, Gästeverhalten, Zeiten – und sieht
die Wirkung der Koordination über viele Tage.

- **Öffentlich bleibt**, was heute auf der Landing Page steht: der feste,
  errechnete mittlere Tag mit dem Umschalter täglich/auf Wunsch.
- **Hinter einer Anmeldung** (E-Mail, Passwort, Bestätigung per Mail, **keine
  Zahlungsdaten**): volle Konfiguration, Auswertung über viele Tage, Szenarien
  speichern und vergleichen.

## 2. Entscheidungen des Users (26.09.2026)

1. **Umwandlung in ein Hotelkonto muss komfortabel sein** – ein Klick, ohne neue
   Anmeldung, und was im Simulator eingestellt ist, wird mitgenommen.
2. **Werbe-Einwilligung ja, aber transparent**: eigenes, nicht vorausgewähltes
   Häkchen; klar gesagt, dass es **ausschließlich um RoSe** geht – keine
   Weitergabe, keine breite Produktpalette.
3. **Bernd ist informiert und einverstanden** (neues offenes Angebot unter
   seinem Impressum).

## 3. Ausgangslage im Code

- **Rechenkern:** [cleaning-sim.ts](../src/lib/cleaning-sim.ts), I/O-frei,
  getestet. `buildScenario(seed, config?)` nimmt seit dem 26.09. eine
  `ScenarioConfig` (Etagen, Zimmer je Etage, Kräfte, Belegung `mix`,
  Gästeverhalten `guest`). `simulate(coord, policy, scn)`, `highlights`,
  `tilesAt`, `maidsAt`, `turnedAwayAt`, `typicalSeed`.
- **Noch feste Konstanten** im Modul, die konfigurierbar werden müssen:
  `DURATION` (Reinigungsdauern, Wege), `CHECKOUT_AT`, `CHECKIN_AT`,
  `STAY_ROUTINE_AT`, `DND_GIVE_UP`, `COMPLAINT`, `SIM_START_HOUR`,
  Verteilungen der Geh- und Check-out-Zeiten (7:00–11:00).
- **Ohne Software** bekommt jede Kraft `floors / maids` feste Etagen – das muss
  bei beliebigen Zahlen ungleich verteilt werden können.
- **Die Board-Logik ist geteilt** ([board.ts](../src/lib/board.ts)):
  `SCORE_WEIGHTS`, `departurePressure`/`departureWeight`, `shouldSwitchFloor`.
  Der Simulator zeigt nur, was das echte Board tut – diese Regel bleibt.
- **Laufzeit:** 600 Zimmer × 101 Tage × 2 Bilder ≈ 16 s im Test (Node). Im
  Browser gehört das in einen **Web Worker**.
- **Anzeige:** [CleaningSimulation.tsx](../src/components/landing/CleaningSimulation.tsx)
  nimmt heute `SCENARIO` fest; für den Simulator muss sie Szenario und Ergebnisse
  als Props nehmen.
- **Mail:** alle Mails über `dispatch` in [mail.ts](../src/utils/mail.ts) mit
  Protokoll `mail_log`; Links über `generateLink` → `/auth/confirm`
  (`verifyOtp` mit `token_hash`).
- **Registrierung** (`/registrieren`, [actions.ts](../src/app/registrieren/actions.ts))
  ist per `SIGNUP_INVITE_CODE` geschlossen und legt Auth-Zugang, Konto, Haus,
  Profil, Inhaberschaft und Beispiel-Services in einem Zug an.

## 4. Konto und Anmeldung

### Datenmodell (eine Migration `2026-09-xx_simulator.sql`)

- **`sim_accounts`** – `user_id` (PK, FK `auth.users`, Kaskade), `created_at`,
  `confirmed_at`, `marketing_opt_in` (bool), `marketing_opt_in_at`,
  `marketing_text_version` (Nachweis, welchem Text zugestimmt wurde),
  `converted_account_id` (nullable, ohne FK wie die Belegtabellen).
  RLS: nur die eigene Zeile lesen; schreiben nur Admin-Client.
- **`sim_scenarios`** – `id`, `user_id` (FK, Kaskade), `name`, `config` (jsonb),
  `created_at`, `updated_at`. RLS: nur eigene Zeilen, lesen und schreiben.
- **`signup_attempts`** – `ip_hash`, `at` (Drossel für das offene Formular,
  Muster von `guest_login_failures`).
- **`mail_log.purpose`**: CHECK um `sim_confirm` erweitern.

### Abläufe

- **Registrierung** `/simulator/registrieren`: E-Mail, Passwort, Häkchen
  Werbung (leer), Hinweis auf Datenschutz und Nutzungsbedingungen. Server:
  Drossel je IP (z. B. 5 je Stunde), Auth-User per Admin-API **unbestätigt**,
  Zeile in `sim_accounts`, Bestätigungslink per `generateLink({ type: 'signup' })`
  und eigene Mail über `dispatch` (Zweck `sim_confirm`) – dieselbe Rückmeldung
  mit Zustellstatus und Countdown wie bei Einladungen.
- **Bestätigung** über `/auth/confirm` (Typ `signup`/`email`), setzt
  `confirmed_at`, leitet auf `/simulator`.
- **Unbestätigte Konten verfallen** nach 7 Tagen; aufgeräumt bei jeder neuen
  Registrierung (kein Cron – dieselbe Haltung wie `mail_log`).
- **Anmeldung:** vorhandenes `/login`. Die Weiterleitung nach dem Login muss
  Simulator-Konten erkennen (Zeile in `sim_accounts`, keine Mitgliedschaft) und
  auf `/simulator` schicken. Passwort-vergessen funktioniert unverändert.
- **Guard** `getSimContext()` in [auth.ts](../src/utils/auth.ts), in `cache()`
  gewickelt. **Wichtig:** Ein Simulator-Konto darf nirgends im Produkt Rechte
  bekommen – es hat weder `profiles` noch `account_members`/`hotel_members`,
  die bestehenden Guards weisen es also ab. Das gehört in
  [guards.test.ts](../tests/integration/guards.test.ts) als eigener Fall.
- **Konto löschen** selbst, im Simulator unter „Mein Konto" (Auth-User weg,
  Kaskade nimmt `sim_accounts` und `sim_scenarios` mit).

### Werbe-Einwilligung (Entscheidung 2)

Vorschlag für den Text am Häkchen:

> Ja, RoSe darf mich gelegentlich per E-Mail über neue Funktionen und besondere
> Angebote informieren – ausschließlich zu RoSe. Meine Adresse wird nicht
> weitergegeben. Abbestellen jederzeit mit einem Klick oder im Konto.

- Die Bestätigungsmail erwähnt die Einwilligung ausdrücklich, wenn das Häkchen
  gesetzt war (Double-Opt-in in einem Schritt).
- Umschalter im Konto; Zeitpunkt und Textversion werden gespeichert.
- **Nicht in diesem Plan:** der Versand von Werbemails selbst (samt
  Abmeldelink). Erst die Einwilligung sauber erfassen.

### Rechtstexte

- **Datenschutz:** neuer Abschnitt „Simulator-Konto" – Zweck, Rechtsgrundlage
  (Konto: Art. 6 Abs. 1 lit. b; Werbung: lit. a), Speicherdauer, Löschung,
  Resend als Versender. Anbieter ist Verantwortlicher (nicht das Hotel).
- **Kurze Nutzungsbedingungen** für den Simulator: kostenlos,
  **Modellrechnung, keine Zusicherung**, keine Verfügbarkeitsgarantie.
- Impressum unverändert.

## 5. Umwandlung in ein Hotelkonto (Entscheidung 1)

- Knopf „Als Hotel bei RoSe starten" im Simulator.
- **Derselbe Auth-User**, keine neue Anmeldung: Die Logik der Registrierung
  wird in eine gemeinsame Funktion gezogen (`createHotelAccount(userId, …)`),
  die `/registrieren` und die Umwandlung beide nutzen.
- **Übernommen wird aus dem gewählten Szenario:**
  - Zimmer: Etagen × Zimmer je Etage (vorausgefüllt, im Zimmer-Setup änderbar),
  - Regeln: tägliche Routine an/aus, Check-out bis, Check-in ab,
  - Hotelname (abgefragt).
- `sim_accounts.converted_account_id` wird gesetzt; gespeicherte Szenarien
  bleiben erreichbar.
- Danach wie heute: Zahlungsweg (überspringbar) und Einrichtungs-Lotse.
- **Offen:** Braucht die Umwandlung den Einladungscode, solange die
  Registrierung geschlossen ist? (siehe Abschnitt 10)

## 6. Rechenkern erweitern

- Alle festen Konstanten (Abschnitt 3) in die `ScenarioConfig`, mit den heutigen
  Werten als Vorgabe. **Die Landing Page und alle bestehenden Tests bleiben
  unverändert** – das ist die Abnahme für diesen Schritt.
- Etagen je Kraft ohne Software auch bei ungeraden Verhältnissen (Rest reihum).
- **Gültigkeitsgrenzen** mit klaren Meldungen, z. B. höchstens 60 Etagen,
  50 Zimmer je Etage, 200 Kräfte, 365 Tage; Anteile summieren sich zu 100 %.
- **Web Worker** für Läufe über viele Tage: Nachrichtenprotokoll als reine
  Funktion (testbar), Fortschritt, Abbruch.
- Auswertung als reine Funktion `summarize(runs)`: Median, 10./90. Perzentil,
  Anteil der Tage mit verpasstem Check-in, vergebliche Gänge, Leerlauf, Auslastung
  je Kraft, eingesparte Stunden (über `roi.ts` optional in Euro).

## 7. Oberfläche `/simulator`

- **Konfiguration** in Gruppen: Haus · Personal und Zeiten · Gäste · Betrieb.
  Jede Annahme mit Vorgabe und kurzer Erklärung; „Vorgabe wiederherstellen".
- **Auswertung über viele Tage:** Kennzahlen-Kacheln, Verteilungen als kleine
  Diagramme (vor dem Bau den `dataviz`-Skill laden), Hinweis „Modellrechnung".
- **Einzelner Tag zum Ansehen:** der Tagesvergleich der Landing Page, aber mit
  dem eigenen Szenario (Komponente auf Props umbauen; bei großen Häusern
  skalierte Kacheln).
- **Szenarien:** speichern, umbenennen, löschen, zwei bis drei nebeneinander
  vergleichen.
- **Drucken statt PDF-Bibliothek** (Druck-CSS wie beim Check-out-Blatt).
- **Landing Page:** unter `#vergleich` der Aufruf „Mit den Zahlen Ihres Hauses
  rechnen" → `/simulator`; `sitemap.ts`/`robots.ts` nachziehen.

## 8. Tests

- **Unit:** Konfiguration mit Vorgaben ergibt exakt die heutigen Ergebnisse
  (bestehende Tests grün, `typicalSeed` unverändert); Gültigkeitsgrenzen;
  ungleiche Etagenverteilung; `summarize`; Worker-Protokoll.
- **Integration:** Simulator-Konto hat in keinem Guard Zugriff (`guards.test`);
  `sim_scenarios` nur eigene Zeilen (`rls.test`); Umwandlung legt Konto, Haus
  und Zimmer für **denselben** Auth-User an; Drossel der Registrierung.
- **GUI-Katalog:** neuer Bereich „Simulator" (Registrierung mit echter Mail,
  Bestätigung, Login-Weiterleitung, Umwandlung) – braucht den Menschen fürs
  Postfach (C+M).

## 9. Phasen

1. **Fundament** – Konstanten in die Konfiguration, Worker, `summarize`, Seite
   `/simulator` zunächst lokal ohne Anmeldung. Abnahme: Landing unverändert,
   Tests grün.
2. **Konto** – Migration, Registrierung mit Bestätigung, Login-Weiterleitung,
   Guard, Konto löschen, Werbe-Einwilligung, Datenschutz und
   Nutzungsbedingungen. Erst danach öffentlich schalten.
3. **Auswertung und Szenarien** – Diagramme, speichern und vergleichen, Druck,
   Aufruf auf der Landing Page.
4. **Umwandlung** – gemeinsame Kontoanlage, Übernahme von Zimmern und Regeln.
5. **Varianten „ohne Software"** – z. B. Funk (Abreisen bekannt, dafür
   Unterbrechungen der Kräfte) und freie Etagenwahl, damit Profis den Vergleich
   nicht für einen Pappkameraden halten.

## 10. Offene Fragen für den Start der nächsten Session

1. Umwandlung bei geschlossener Registrierung: Einladungscode verlangen oder
   Simulator-Konten ausdrücklich freischalten?
2. Name des Werkzeugs auf der Seite („Simulator", „Housekeeping-Rechner", …).
3. Sollen Häuser außerhalb Deutschlands den Simulator schon nutzen können
   (Sprache bleibt vorerst Deutsch)?
