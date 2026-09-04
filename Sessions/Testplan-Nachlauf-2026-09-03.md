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
- [ ] Häkchen erscheint in beiden Anlege-Formularen (Rezeption, Manager).
- [ ] Zugang entsteht sofort, Passwort wird **genau einmal** angezeigt
      (Seite neu laden → weg). Keine Mail.
- [ ] Anmelden mit dem Testzugang im Privatfenster → landet im richtigen Haus
      mit der richtigen Rolle (Rezeption sieht keine Einstellungen außer
      Aushänge/Karten/Mein Zugang).
- [ ] Gegenprobe Produktion: auf rose-roomservice.app fehlt das Häkchen
      (die Variable ist dort nicht gesetzt — heute gegen Vercel geprüft).

**Bearbeiten (alle drei Arten dieselbe Zeile, derselbe Dialog):**
- [ ] Reinigung: Anzeige- **und** Benutzername änderbar; Hinweis zur
      gedruckten Karte erscheint nur bei Benutzernamen-Änderung.
- [ ] Nach Benutzernamen-Wechsel: **PIN-Login mit dem neuen Namen** klappt,
      alter Name wird abgewiesen, gedruckte QR-Karte (Link aus
      Personal → Karte) funktioniert weiter.
- [ ] Rezeption/Manager: nur Anzeigename; erscheint danach in Kopfzeile,
      Personal-Liste und Zimmer-Verlauf einheitlich.

**Stufe 1 — Zugang beenden (umkehrbar):**
- [ ] Reinigung mit offener Sitzung im Privatfenster: Zugang beenden →
      das Board wirft die Kraft **sofort** raus (nächster Klick / Reload), die
      Login-Seite erklärt den gesperrten Zugang statt im Kreis zu leiten.
      PIN- und QR-Login abgewiesen. Auswertung zeigt sie weiter (unter
      „deaktiviert").
- [ ] Rezeption/Manager mit offener Sitzung: Zugang beenden → Haus nicht mehr
      erreichbar (Umleitung auf Anmeldung / „Häuser"). Ein Manager mit
      **zwei Häusern**: nur dieses Haus fällt weg, das andere bleibt.
- [ ] „Wieder aktivieren" → Anmeldung klappt wieder, nichts fehlt.

**Stufe 2 — Endgültig löschen:**
- [ ] Reinigung **ohne** Historie: „es geht nichts verloren", kein Abtippfeld.
- [ ] Reinigung **mit** Historie (Schicht + 1 Reinigung gestochen): Dialog
      nennt Anzahl Stiche mit Zeitraum, abgeschlossene Reinigungen,
      Login-Karte — und was bleibt (Check-ins, erledigte Anfragen ohne Namen).
      Benutzername muss abgetippt werden. Danach: Auswertung ohne die Kraft,
      Zimmer-Verlauf zeigt ihre Einträge namenlos.
- [ ] Rezeption **mit** Vorgang (vorher als diese Rezeption ein Zimmer
      „gereinigt" markiert oder einen Check-in gemacht): Dialog sagt
      **vorher** an, dass das Anmeldekonto stehen bleibt, weil Vorgänge daran
      hängen. Kein Abtippfeld (gilt nur der Reinigung). Nach dem Löschen:
      Check-in im Verlauf trägt weiterhin den Namen, die Reinigung ist in der
      Stayover-Ableitung weiter da — der gestern behobene Bug.
- [ ] Manager in zwei Häusern: löschen in Haus A → in Haus B weiterhin Manager.
- [ ] Papierkorb sitzt an der **aktiven** Kraft, nicht erst nach Deaktivieren.

**Nach Befund 5 — vergessener Abschluss:**
- [ ] Hotel & Regeln: Reinigungs-Timeout auf 5 Minuten. Kraft startet eine
      Reinigung und schließt sie **nicht** ab. Nach 5 Minuten die Übersicht
      oder das Board laden → Zimmer wieder offen, Verlauf zeigt „Reinigung
      nicht abgeschlossen (Zeitlimit, Name) · System", datiert auf Start +
      5 min. Auswertung zählt sie unter „Auffällig", nicht in den Summen.
      Danach Timeout zurück auf 90.
- [ ] Im zweiten Haus (`marcus-hotel`) einen Check-in/-out machen → Verlauf
      nennt „Oli", nicht „Rezeption" (Befund 4).

## 5) Gast-Zugangsverfahren (Einstellungen → Gastzugang)

- [x] Seite zeigt beide Karten (Ablauf, Dafür, Dagegen, „Passt, wenn …"),
      aktives Verfahren markiert, beim individuellen Verfahren steht der
      fehlende zweite Faktor **offen** im Text. → **Befund 1** (Kontrast der
      aktiven Karte im Dark Mode), behoben.
- [ ] **Nach Befund 2:** Unter den Karten steht im PIN-Verfahren der Abschnitt
      „QR-Aushänge für die Zimmer" mit Link auf die Aushang-Seite; im
      Link-Verfahren nur der Hinweis, dass die Aushänge ausgeblendet sind. Im
      Einstellungen-Hub gibt es für Inhaber/Manager **keine** eigene
      Aushänge-Kachel mehr, auf der Zimmer-Seite keinen Knopf. Die Aushang-Seite
      führt zurück zu „Gäste-Zugang" und zeigt im Link-Verfahren einen
      Warnhinweis. Als Rezeption: Kachel „QR-Aushänge" nur im PIN-Verfahren.
- [ ] Im PIN-Verfahren einchecken (Zimmer A) → PIN am Bildschirm, Handout mit
      QR **und** PIN.
- [ ] Umstellen auf „individueller Link" → Meldung mit Hinweis, die Aushänge
      abzunehmen.
- [ ] **Kernbeweis:** Zimmer A (vor der Umstellung eingecheckt) zeigt im
      Rezeptions-Dialog **weiterhin die PIN**, Gast-Login per Zimmernummer +
      PIN funktioniert weiter.
- [ ] Neuer Check-in (Zimmer B) → „Zugang aushändigen", **keine** PIN,
      Handout mit QR ohne PIN und dem Hinweis „wie einen Zimmerschlüssel
      behandeln".
- [ ] Link aus dem Handout öffnen (Privatfenster) → ohne Eingabe im Portal von
      Zimmer B. Reinigen/DND und eine Service-Bestellung funktionieren wie im
      PIN-Verfahren; Rezeption sieht Wunsch und Bestellung.
- [ ] Zimmer-QR (Wandaushang) von Zimmer B öffnen → PIN-Formular, aber es
      gibt keine PIN. Erwartung: kein Weg hinein, und fünf Fehlversuche
      sperren nichts (Zimmer A muss weiter per PIN erreichbar bleiben). Hier
      genau hinschauen — die Meldung sollte nicht irreführen.
- [ ] `/h/<slug>/guest` im Link-Modus: erklärender Hinweis auf den
      Check-in-Beleg, Formular bleibt (für Zimmer A nötig).
- [ ] Check-out Zimmer B → Link erneut öffnen → abgewiesen, landet auf der
      Hinweisseite `/guest`. Ein noch offener Portal-Tab: nächster Klick
      fliegt raus.
- [ ] Zurück auf PIN stellen → Zimmer B neu einchecken → wieder PIN. Nichts
      an Zimmer A hat sich je verändert.

## 6) Abrechnungs-Snapshot (`/admin`, Konto-Kasten, nur Inhaber)

- [ ] Vor der ersten Zimmerlöschung des Tages: Abrechnungsübersicht zeigt die
      letzten Monate. Beide Häuser des Kontos tragen bereits Snapshots
      (`test-hotelkette` 2, `marcus-hotel` 1, aus den Löschungen von gestern),
      die abgeschlossenen Monate sind dort also schon als festgeschrieben
      markiert. Zahlen notieren.
- [ ] Ein Zimmer löschen (Block 2) → abgeschlossene Monate sind danach als
      festgeschrieben markiert, die Zahlen haben sich durch das Löschen
      **nicht** verringert. Laufender Monat bleibt abgeleitet.
- [ ] Zweites Zimmer löschen → keine Doppelung, Zahlen der geschlossenen
      Monate unverändert.
- [ ] Zimmer neu anlegen → laufender Monat steigt, geschlossene Monate nicht.

## 7) Mail-Versand und Handout in Produktion (rose-roomservice.app)

Offener Punkt aus [TODO.md](../TODO.md).

- [ ] Handout eines belegten Zimmers: **Adressfeld** für den Mail-Versand ist
      da (nicht „Versand per E-Mail ist nicht eingerichtet") → beide
      Variablen greifen.
- [ ] Einmal an die eigene Adresse senden: Absender-Anzeigename ist der
      **Hotelname**, Link zeigt auf `rose-roomservice.app` (nicht localhost),
      kein QR-Bild in der Mail, Link führt ins Portal.
- [ ] Im Link-Verfahren: Mail trägt den Aufenthalts-Link; nach Check-out ist
      er tot.
- [ ] QR aus dem Handout mit dem Handy scannen (beide Verfahren).
- [x] Postfach prüfen: Spam-/Werbung-Ordner? → **Befund 6**, Yahoo: Spam.
- [x] In der Yahoo-Mail „Original anzeigen": `Authentication-Results` zeigt
      `spf=pass dkim=pass dmarc=pass` → Technik sauber, **reine Reputation**.
- [x] Tracking in Resend: nicht aktiv (läuft nur über eine eigene
      Tracking-Subdomain, keine angelegt). Nichts zu tun, nichts anlegen.

## 8) Löschbegehren (`/admin` → „Daten löschen", nur Inhaber) — zuletzt

**Nicht umkehrbar.** Dafür ein eigenes Wegwerf-Haus im selben Konto anlegen
(„ZZ-Löschprobe") mit 2 Zimmern, einer Reinigungskraft, einem Rezeptions-
Testzugang, einem Check-in und einer Reinigung.

- [ ] Bereich ist eingeklappt, für einen Manager unsichtbar.
- [ ] Vorschau beziffert: Zimmer, Aufenthalte, Verlauf, Stiche, Personal, und
      welche Anmeldekonten **verschwinden** bzw. **bleiben** (der Inhaber
      bleibt, die Reinigungskraft geht, der Rezeptions-Testzugang geht — außer
      er sitzt noch in einem anderen Haus).
- [ ] Hausname muss abgetippt werden.
- [ ] Nach dem Löschen: Haus weg aus der Liste, Anmeldung mit dem gelöschten
      Rezeptions-Testzugang schlägt fehl („ungültige Zugangsdaten", nicht
      Fehler 500). Inhaber weiterhin angemeldet.
- [ ] **Stammhaus-Grenzfall:** Danach in einem anderen Haus einen **Check-in**
      machen → klappt. (Trifft nur, wenn das gelöschte Haus das Stammhaus des
      Inhabers war — das ist das erste Haus des Kontos. Bei einem neu
      angelegten Wegwerf-Haus ist der Fall nicht erreichbar; dann genügt der
      Integrationstest, der ihn abdeckt.)
- [ ] **Nicht testen:** Konto löschen — nimmt den eigenen Zugang mit. Nur
      wenn ein eigenes Wegwerf-Konto über `/registrieren` angelegt wird.

## Befunde

| # | Block | Beobachtung | Erwartet | Status |
|---|---|---|---|---|
| 1 | 5 | Aktive Karte auf „Gäste-Zugang" im Dark Mode: fast weißer Hintergrund (`bg-action-tint` = Blau-50, Tints kennen kein Dark) mit heller Ink-Schrift — unlesbar. | Auswahl lesbar in beiden Themes. | behoben 04.09.: Karte behält `bg-surface`, Auswahl über Rahmen + Ring in Aktionsfarbe |
| 3 | 2 | Zimmer-Verlauf: „Check-in · Oli", aber „Check-out · Rezeption" — derselbe Aufenthalt, zwei Namen. Ursache: `stays` hatte nur `created_by`, für den Check-out keine Spalte; der Verlauf setzte pauschal „Rezeption". | Beide Ereignisse nennen die Person. | behoben 04.09.: Migration `stays.checked_out_by`, `checkOutAction` schreibt sie, Verlauf liest sie (Alt-Aufenthalte weiter „Rezeption") |
| 4 | Rückfrage | Zimmer-Verlauf löste Namen nur über `profiles.hotel_id` auf (= Stammhaus). Inhaber/Manager mit mehreren Häusern erschienen in jedem weiteren Haus als „Rezeption", obwohl die ID gespeichert war. | Name in jedem Haus. | behoben 04.09.: Auflösung über die vorkommenden Akteur-IDs |
| 5 | Rückfrage | Stale-Timeout (vergessener Abschluss) war reine Ableitung: im Verlauf blieb „Reinigung gestartet" ohne Ende, der stille Reset war unsichtbar. Label `clean_aborted` existierte, nichts schrieb es. | Reset nachvollziehbar. | umgesetzt 04.09.: erster Zugriff nach dem Limit schreibt `clean_aborted` (Quelle `system`, datiert auf Start + Limit) und setzt `room_states` zurück |
| 6 | 7 | Gast-Mail landet bei Yahoo beim ersten Versuch im Spam. Technik (SPF, DKIM auf `send.rose-roomservice.app`) steht; Mail hatte **keinen** Plain-Text-Teil; Domain ohne Sendehistorie. | Posteingang. | teils 04.09.: `text/plain` ergänzt, Spam-Hinweis auf dem Handout. Rest ist Dashboard/DNS/Zeit — Schritte in TODO.md |
| 2 | 5 | QR-Aushänge als eigene Hub-Kachel, obwohl sie nur im PIN-Verfahren Sinn haben. | Aushänge dort, wo das Verfahren gewählt wird, und nur wenn „Fester QR-Code je Zimmer" aktiv ist. | umgesetzt 04.09.: Abschnitt auf „Gäste-Zugang", Kachel/Knopf entfernt, Rezeptions-Kachel nur im PIN-Verfahren |

## Aufräumen nach dem Durchlauf

- [ ] ZZ-Zimmer, ZZ-Personal entfernt
- [ ] Gastzugang wieder auf „PIN"
- [ ] „Testdaten vollständig entfernen" ein letztes Mal
