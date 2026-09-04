# GUI-Testkatalog — RoSe auf Oberflächen-Ebene

**Zweck:** Das Gegenstück zu den automatisierten Tests. Unit-Tests sichern die
Rechenlogik, Integrationstests die Mandantengrenzen an der Datenbank. Was
beide nicht sehen, ist die Oberfläche: Dialoge, Meldungen, Kontraste, das
Zusammenspiel von zwei angemeldeten Personen, QR-Scans, Mail im Postfach. Das
prüft dieser Katalog — **wiederholbar** und **erweiterbar**.

**Verhältnis zu den anderen Dokumenten:**
[Testplan-Walkthrough.md](Testplan-Walkthrough.md) war der erste Durchlauf
(25./26.07.), [Testplan-Nachlauf-2026-09-03.md](Testplan-Nachlauf-2026-09-03.md)
der Lauf vom 04.09. mit seinen Befunden. Beide bleiben als **Protokolle**
stehen. Der Katalog hier ist die **Vorlage**: Jeder neue Lauf kopiert die
Lauf-Tabelle am Ende, hakt ab, notiert Befunde — die Fälle selbst werden hier
gepflegt, nicht im Protokoll.

**Umgebung:** Produktion (`rose-roomservice.app`), siehe
[[testen-in-produktion]] im Gedächtnis. Lokal nur für die Fälle, die
`ALLOW_TEST_ACCOUNTS` brauchen. Beide teilen dieselbe Datenbank; ein Push auf
`main` ist nach wenigen Minuten live — **Seiten nach einem Deploy neu laden**,
sonst laufen Formulare gegen alte Server-Aktionen und melden nichts.

---

## 1. Rollen, Sitzungen, Voraussetzungen

Die Tests brauchen bis zu **fünf getrennte Sitzungen**. Cookies gelten je
Browser-Profil, deshalb je Rolle ein eigener Browser, ein Privatfenster oder
der Vorschau-Browser.

| Kürzel | Wer | Wie anmelden | Wer kann das bedienen |
|---|---|---|---|
| **INH** | Inhaber des Testkontos | E-Mail + Passwort auf `/login` | nur der Mensch meldet an; danach kann Claude in diesem Chrome fahren |
| **MGR** | Manager mit **zwei** Häusern | Einladung per Mail, eigenes Passwort | braucht **echte Adresse** und ein zweites Postfach — Mensch |
| **REZ** | Rezeptions-Zugang eines Hauses | Einladung per Mail | wie MGR; lokal alternativ Testzugang ohne Mail |
| **REI** | Reinigungskraft | Benutzername + PIN oder QR-Karte auf `/h/<slug>/service/login` | Claude allein (Vorschau-Browser), Karte aus Personal → Karte |
| **GAST** | Gast eines Aufenthalts | Zimmer + PIN, Zimmer-QR oder Aufenthalts-Link | Claude allein |

**Testkonto:** Konto „Test-Hotelkette" mit den Häusern `test-hotelkette`
(Spielwiese, darf jederzeit abgeräumt werden) und `marcus-hotel` (großes
Haus mit Szenario-Daten, für Zweithaus-Tests). Wegwerf-Häuser heißen `ZZ-…`,
Wegwerf-Personal `zz…` — alles mit diesem Präfix darf gelöscht werden.

**Ausgangslage vor einem Lauf:** Einstellungen → Test-Szenario → „Testdaten
vollständig entfernen" (bestätigt per Browser-Dialog). Danach: 0 belegt, alle
Zimmer ohne Historie, Verfahren „PIN", Timeout 90.

**Nachmessen:** Wo die Oberfläche eine Zahl behauptet (Löschvorschau,
Abrechnung, Zähler), gegen die Datenbank prüfen. Ein kleines Node-Skript mit
dem Secret Key aus `.env.local` reicht (Muster im Protokoll vom 04.09.).

---

## 2. Was Claude allein kann — und was nicht

Aus dem Lauf vom 04.09. ([Werkzeug-Notizen](2026-09-04_Produktions-Testlauf.md)):

**Claude allein (bei angemeldetem INH-Chrome):** alles im Rezeptions- und
Verwaltungsportal per Koordinaten-Klick, Formulare per `form_input`, Gast- und
Reinigungssitzungen im Vorschau-Browser (Login mit PIN/Link/QR-URL), Slider
per Drag, Datenbank-Nachmessen, Vercel-Logs.

**Nur mit dem Menschen:**

| Was | Warum | Was der Mensch tut |
|---|---|---|
| Anmeldung als INH/MGR/REZ | Passwörter darf Claude nicht eingeben | einmal anmelden, Tab offen lassen |
| **Zweite Management-Sitzung** (MGR oder REZ parallel zu INH) | zweite Anmeldung mit Passwort | zweiter Browser/Profil, dort anmelden |
| **Manager mit zwei Häusern** anlegen | Einladungsmail an echte Adresse, Passwort vergeben | Postfach bereitstellen, Einladung annehmen |
| Rezeptions-Zugang anlegen (Produktion) | wie oben | wie oben; lokal: Häkchen „Ohne E-Mail" (`ALLOW_TEST_ACCOUNTS`) |
| **Browser-Bestätigungsdialoge** (`window.confirm`, z. B. Test-Szenario) | blockieren die Fernsteuerung | OK klicken, wenn Claude es ansagt |
| **QR mit dem Handy scannen** | kein Gerät | Aushang/Handout/Karte scannen, Ergebnis nennen |
| **Mail im Postfach** (Absender, Inhalt, Spam/Posteingang) | kein Postfach | Mail öffnen, ggf. „Original anzeigen" |
| **Druck** (Papier, Seitenumbrüche) | kein Drucker | drucken oder PDF ansehen |
| **Bedien-Eindruck** (Farben, Blinken, Abstände, Handy-Format) | Claude liest Seitentext, Screenshots nur grob | mitschauen, Auffälliges nennen |
| **Konto löschen** | nimmt die eigene Anmeldung mit | nur mit eigenem Wegwerf-Konto über `/registrieren` |

---

## 3. Testfälle

Kennzeichen je Fall: **C** = Claude allein · **C+M** = Claude fährt, Mensch
liefert Sitzung/Gerät/Postfach · **M** = nur Mensch. Erwartungen sind so
formuliert, dass ein Abweichen ein Befund ist.

### A — Konto und Häuser (`/admin`, INH)

| ID | Fall | Schritte | Erwartung | Wer |
|---|---|---|---|---|
| A1 | Konto-Kasten | `/admin` öffnen | Plan, Anzahl Häuser, Zimmer in Betrieb, abrechenbar (laufender Monat), abgeschlossene Monate mit Markierung „festgeschrieben", Häuserliste mit Lagebild, „Haus anlegen" | C |
| A2 | Haus anlegen | Name eingeben, Anlegen | Haus erscheint mit Slug, 0 Zimmer, „alles bereit"; Slug unter Hotel & Regeln änderbar | C |
| A3 | Manager-Sicht | als MGR `/admin` | Häuserliste nur mit den eigenen Häusern, **kein** Konto-Kasten, **kein** „Daten löschen" | C+M |
| A4 | Rezeptions-Sicht | als REZ | „Häuser" in der Kopfzeile fehlt, `/admin` nicht erreichbar | C+M |

### B — Personal (`…/admin/personal`)

| ID | Fall | Schritte | Erwartung | Wer |
|---|---|---|---|---|
| B1 | Reinigungskraft anlegen | Name + Benutzername | Zeile mit PIN, Karte druckbar, QR-URL `/service/auto/<token>` | C |
| B2 | Bearbeiten Reinigung | Anzeige- und Benutzername ändern | Karten-Hinweis **nur** bei Benutzernamen; PIN-Login mit neuem Namen ok, alter abgewiesen; QR-Karte weiter gültig; offene Sitzung bleibt; Auth-Adresse in DB = `neu@<hotel>.rose.svc` | C |
| B3 | Bearbeiten Rezeption/Manager | Bearbeiten | nur Anzeigename-Feld | C (Manager: C+M) |
| B4 | Zugang beenden Reinigung | mit offener Sitzung im Vorschau-Browser | Reload: „Dieser Zugang ist nicht mehr aktiv"; PIN-Login gleiche Meldung; QR-Karte gleiche Meldung (Fehlercode `deactivated`); Liste „Beendete Zugänge"; Auswertung zeigt sie weiter | C |
| B5 | Wieder aktivieren | Knopf | Meldung „alter Zugang gilt erneut", QR-Karte meldet an | C |
| B6 | Zugang beenden REZ/MGR mit offener Sitzung | zweiter Browser | nächster Aufruf im Haus → Anmeldung/„Häuser"; MGR mit zwei Häusern: **nur dieses** Haus fällt weg | **C+M** |
| B7 | Löschen ohne Historie | frische Kraft | „noch keinen einzigen Eintrag … nichts verloren", kein Abtippfeld | C |
| B8 | Löschen mit Historie (Dialog) | Kraft mit Stichen | Anzahl Einträge mit Zeitraum, abgeschlossene Reinigungen, Login-Karte, was bleibt; Abtippfeld Benutzername; Ausweg „Lieber Zugang beenden" | C |
| B9 | Löschen mit Historie (ausführen) | Wegwerf-Kraft mit Stichen abtippen | `staff_log` und Karte der Kraft weg; Zimmer-Verlauf zeigt ihre Einträge namenlos; Auswertung ohne sie | C |
| B10 | REZ löschen **mit** Vorgang | REZ hat Check-in gemacht | Dialog sagt **vorher**: Anmeldekonto bleibt; Verlauf behält den Namen | **C+M** |
| B11 | MGR in zwei Häusern löschen | in Haus A | in Haus B weiterhin Manager | **C+M** |
| B12 | Testzugang ohne Mail | lokal, `ALLOW_TEST_ACCOUNTS=1` | Häkchen in beiden Formularen, Passwort genau einmal, Anmeldung klappt; in Produktion fehlt das Häkchen | C (lokal) |
| B13 | Personal-Seite als REZ | Hub-Kachel „Personal-Karten" | nur Karten ansehen/drucken, kein Anlegen/Löschen | C+M |

### C — Zimmer-Setup (`…/admin/zimmer`, INH/MGR)

| ID | Fall | Schritte | Erwartung | Wer |
|---|---|---|---|---|
| C1 | Anlegen | Etage + Bereich „101-104" | Vorschau „4 Zimmer werden angelegt", nach Anlegen „4 Zimmer angelegt", Liste je Etage | C |
| C2 | Gebäude-Ebene | zweiten Gebäudeteil anlegen | Gebäude-Ebene erscheint erst ab dem zweiten; verschwindet, wenn nur einer bleibt | C |
| C3 | Dialog je Ebene | Zimmer, Etage, Gebäudeteil anklicken | überall derselbe Dialog: Bearbeiten · Außer Betrieb · Endgültig löschen mit Erklärsatz | C |
| C4 | Bearbeiten | Nummer/Etage/Gebäudeteil ändern | Liste sortiert um, QR-Token bleibt; Aushang-Hinweis nur bei Nummer/Gebäudeteil | C |
| C5 | Kollision | Nummer auf vorhandene ändern | Meldung nennt Gebäudeteil und Etage, nichts geändert; Etagen-Verschiebung mit Kollision: **kein** Zimmer halb verschoben | C |
| C6 | Außer Betrieb | Zimmer | weg von Board, Aushang, KPIs; Check-in abgewiesen; „Wieder in Betrieb" | C |
| C7 | Löschen ohne Historie | frisches Zimmer | „Noch nie benutzt", kein Abtippfeld; Nummer danach frei | C |
| C8 | Löschen mit Historie | Zimmer mit Aufenthalt/Reinigung | Zahlen (Aufenthalte, Anfragen, Verlauf, Aushänge) = DB; Hinweis „Stiche bleiben"; Abtippen exakt (Kleinschreibung reicht nicht); Auswertung zählt Reinigung weiter | C |
| C9 | Belegtes Zimmer | Löschen versuchen | hart gesperrt, „bitte zuerst auschecken" | C |
| C10 | Letztes Zimmer | einer Etage / eines Gebäudeteils löschen | Etage bzw. Gebäude-Ebene verschwindet | C |
| C11 | Abrechnung nach Löschung | `/admin` vorher/nachher | geschlossene Monate unverändert und „festgeschrieben", laufender Monat zählt gelöschtes Zimmer weiter | C |

### D — Gast-Zugang (`…/einstellungen/gastzugang`, INH/MGR)

| ID | Fall | Schritte | Erwartung | Wer |
|---|---|---|---|---|
| D1 | Seite | öffnen, beide Themes | zwei Karten, „derzeit aktiv", zweiter Faktor steht offen; ausgewählte Karte lesbar im Dark Mode | C |
| D2 | Aushänge-Kopplung | PIN ↔ Link umstellen | PIN: Abschnitt „QR-Aushänge" mit Link; Link: Hinweis „ausgeblendet"; Hub ohne Aushänge-Kachel (INH); REZ-Kachel nur im PIN-Verfahren; Aushang-Seite warnt im Link-Verfahren | C (REZ-Teil C+M) |
| D3 | Umstellen | Karte wählen, „Verfahren umstellen" | Meldung; bei Link zusätzlich Hinweis „Aushänge abnehmen" | C |
| D4 | **Kernbeweis** | Zimmer A im PIN-Verfahren einchecken, umstellen auf Link | A zeigt weiter PIN, Gast-Login mit PIN funktioniert; zurück auf PIN: A unverändert | C |
| D5 | Link-Check-in | Zimmer B im Link-Verfahren | „ZUGANG AUSHÄNDIGEN", keine PIN; Handout: QR ohne PIN, Sicherheitshinweis, Link `/guest/s/…`, Mail-Feld | C |
| D6 | Link nutzen | Link öffnen | ohne Eingabe im Portal; Reinigen/DND/Bestellung wirken in Übersicht und Services-Board | C |
| D7 | Rate-Limit über Verfahren | 5 Fehlversuche mit Zimmer B im Formular | `pin_attempts` auf **allen** Aufenthalten 0, A meldet sich weiter an | C |
| D8 | Zimmer-QR im Link-Verfahren | Aushang-Token von B öffnen | PIN-Formular, kein Weg hinein, nichts gesperrt | C (Token vorher erzeugen) |
| D9 | Gast-Formular im Link-Modus | `/h/<slug>/guest` | Hinweis auf Check-in-Beleg, Formular bleibt | C |
| D10 | Check-out Link-Gast | Check-out B, Link erneut, offener Tab | `/guest?error=link` erklärt erloschenen Zugang; offener Tab landet auf Anmeldung | C |
| D11 | Check-in auf ungereinigt | nach Check-out erneut einchecken | Warnung „Zimmer nicht bereit", „Trotzdem einchecken" | C |

### E — Rezeption Tagesgeschäft (`/h/<slug>/admin`)

| ID | Fall | Schritte | Erwartung | Wer |
|---|---|---|---|---|
| E1 | Check-in/-out | Kachel → Check-in → Check-out (Bestätigung) | PIN sichtbar, Handout-Link; nach Check-out „Reinigung nach Check-out offen" | C |
| E2 | Verlauf-Attribution | Dialog öffnen | Check-in **und** Check-out mit Namen der Person (auch im **zweiten** Haus des Inhabers), Gast-Ereignisse „Gast", Service erledigt mit Namen | C |
| E3 | Priorisieren | Knopf | violetter Balken/Flagge, Board zeigt Prio, Verlauf „Reinigung priorisiert" | C |
| E4 | Als gereinigt markieren | Knopf | Status bereit, `clean_done`-Stich der Rezeption, Stayover befriedigt | C |
| E5 | Glocke | Gast bestellt | Glocke an der Kachel, rot blinkend bei dringendem Service; Nav-Badge zählt | C (Blinken: M) |
| E6 | Realtime | zweites Fenster | Änderung erscheint ohne Reload; Poll-Fallback nach ~60 s | C+M |
| E7 | REZ-Rechte | als REZ | Übersicht, Services, Handouts, Aushänge, Karten, Mein Zugang — **keine** Einstellungen/Zimmer/Services-Baukasten/Personalverwaltung/„Code erneuern" | C+M |

### F — Reinigungsboard (`/h/<slug>/service`, REI)

| ID | Fall | Schritte | Erwartung | Wer |
|---|---|---|---|---|
| F1 | Login | PIN-Formular und QR-URL | Board; falscher Name/PIN „Benutzername oder PIN ist falsch" | C |
| F2 | Schicht | Status-Seite, Slider | Auf Schicht seit …; Pause/Sonstige/Beenden; Tagesbilanz | C |
| F3 | Etagen | Etage wählen | „Als Nächstes" auf der Etage mit höchster offener Dringlichkeit; Zimmer nur dieser Etage; Verlassen per Slider | C |
| F4 | Reinigen | Start + Abschluss | Kollegin sieht „Kollegin in Zimmer X" live; Rezeption sieht Spinner; Verlauf beide Stiche | C (Kollegin: zweite REI-Sitzung, C) |
| F5 | **Vergessener Abschluss** | Timeout 5 min, Start ohne Ende, nach 5 min Übersicht **und** Board laden | Zimmer offen; `room_states` Quelle `system`; **genau ein** `clean_aborted` datiert auf Start + Limit; Verlauf „Reinigung nicht abgeschlossen (Zeitlimit, Name) · System"; Auswertung „Auffällig" | C |
| F6 | Übernahme nach Timeout | Kollegin startet stale Zimmer | Claim greift, vorher `clean_aborted` für die erste Kraft | C |
| F7 | Fremder Slug | Board unter anderem Haus-Slug | Umleitung auf dessen Anmeldung, kein fremdes Branding | C |
| F8 | Handy-Format | 375 px | kein horizontales Scrollen, Slider bedienbar | M (Eindruck) |

### G — Services

| ID | Fall | Schritte | Erwartung | Wer |
|---|---|---|---|---|
| G1 | Baukasten | Service mit Optionen, archivieren | beim Gast sichtbar/unsichtbar, alte Bestellung unverändert | C |
| G2 | Bestellung | Gast bestellt mit Notiz | Board zeigt Zimmer, Service, Notiz, „dringend"; Erledigt → Gast sieht „erledigt", Verlauf nennt Bearbeiter | C |
| G3 | Beispiel-Services | leerer Baukasten | „Beispiel-Services anlegen" skippt vorhandene Namen | C |

### H — Auswertung und Abrechnung

| ID | Fall | Schritte | Erwartung | Wer |
|---|---|---|---|---|
| H1 | Auswertung | Zeitraum, Kraft | Hausbilanz, Tabelle je Kraft inkl. beendete, Tagesprotokoll; „Auffällig" trennt offene/abgebrochene/unplausible | C |
| H2 | Abrechnung | `/admin` | siehe C11; Snapshots entstehen **nur** bei Löschung | C |

### I — Löschbegehren (`/admin` → „Daten löschen", INH)

| ID | Fall | Schritte | Erwartung | Wer |
|---|---|---|---|---|
| I1 | Sichtbarkeit | INH vs. MGR | Bereich nur für INH, eingeklappt | C+M |
| I2 | Vorschau | Wegwerf-Haus mit Zimmern, Kraft, Aufenthalt, Reinigung | Zahlen = DB (Zimmer, Aufenthalte, Stiche, Verlauf, Anmeldekonten); Inhaber nicht als verschwindend gezählt | C |
| I3 | Ausführen | Hausname abtippen | „vollständig entfernt"; alle Tabellen des Hauses 0 inkl. `room_state_transitions` und `billing_snapshots`; Auth-Konto der Kraft weg; Nachbarn und INH unberührt; Slug → 404 | C |
| I4 | Stammhaus-Grenzfall | Haus löschen, das Stammhaus des INH ist, dann Check-in anderswo | klappt (Stammhaus umgehängt) | **M** (nur mit Wegwerf-Konto) |
| I5 | Konto löschen | — | eigener Zugang weg, Anmeldung führt auf Login | **M** (Wegwerf-Konto) |
| I6 | Gelöschter Zugang | Anmeldung mit gelöschtem REZ | „ungültige Zugangsdaten", kein 500 | C+M |

### J — Mail und Druck

| ID | Fall | Schritte | Erwartung | Wer |
|---|---|---|---|---|
| J1 | Mail-Feld | Handout in Produktion | Adressfeld vorhanden (Variablen greifen) | C |
| J2 | Versand | an eigenes Postfach | Meldung „verschickt … Spam-Ordner"; Resend-Log „Delivered"; Absender = Hotelname; Link auf Produktions-URL; kein QR-Bild; Text-Teil vorhanden | **C+M** |
| J3 | Zustellbarkeit | Gmail, Yahoo, eigene Domain | Posteingang oder Spam notieren; `Authentication-Results` dreimal `pass` | **M** |
| J4 | Link-Mail nach Check-out | Link aus der Mail | erloschen (D10) | C |
| J5 | Druck | Aushänge, Handout, Karte | eine Karte je Seite, Bedienelemente `print:hidden`, Light-Theme im Druck | **M** |
| J6 | QR scannen | Aushang, Handout (beide Verfahren), Karte | Handy landet richtig (PIN-Formular / Portal / Board) | **M** |

### K — Theme und Robustheit

| ID | Fall | Schritte | Erwartung | Wer |
|---|---|---|---|---|
| K1 | Dark Mode | jede Seite mit Hinweis-/Warnkasten, Dialoge, Pills | dunkler Kasten, heller Text — nichts hell auf hell (Befunde 1/7 vom 04.09.) | C (Computed Style) + M (Eindruck) |
| K2 | Farbsprache | Prio violett, dringend rot blinkend, DND rosé, ausgecheckt orange, bereit grün, belegt blau | wie AGENTS.md | M |
| K3 | Cookie-Trennung | Admin und Reinigung im selben Browser | beide Sitzungen stören sich nicht | C |
| K4 | Deploy während offener Seite | Formular nach Deploy absenden | verständliche Meldung statt stillem Nichts (Beobachtung 04.09.: Handout-Versand ohne Rückmeldung — nicht reproduziert) | C+M |

---

## 4. Erweitern

Neuer Fall = neue Zeile in der passenden Tabelle mit ID, Schritten,
Erwartung und Wer-Kennzeichen. Ein Befund aus einem Lauf, der eine
**dauerhafte** Erwartung beschreibt, wandert als Fall hierher (Beispiel: F5
aus Befund 5, D2 aus Befund 2). Fälle, die durch Automatisierung abgedeckt
werden, bleiben stehen, bekommen aber den Vermerk „auch in `rls.test.ts`" —
der GUI-Blick ersetzt den Test nicht und umgekehrt.

## 5. Durchführung — Ablauf eines Laufs

1. Mensch meldet INH in Chrome an (und, falls B6/B10/B11/E7 dran sind, MGR
   und REZ in weiteren Profilen). Postfach und Handy bereit für J.
2. Ausgangslage herstellen (Abschnitt 1). Claude misst den Stand in der DB.
3. Claude fährt die **C**-Fälle, ruft bei **C+M** den Menschen für Dialog,
   Scan oder Postfach; **M**-Fälle macht der Mensch und nennt das Ergebnis.
4. Nach jedem Block: Ergebnis und Befunde in die Lauf-Tabelle, Korrekturen
   sofort committen und pushen, danach Seiten neu laden.
5. Abschluss: „Testdaten vollständig entfernen", Wegwerf-Objekte weg,
   Einstellungen zurück (Verfahren PIN, Timeout 90).

## 6. Lauf-Vorlage

Für jeden Lauf eine Datei `Sessions/GUI-Lauf-<Datum>.md` mit diesem Kopf:

```
# GUI-Lauf <Datum> — Anlass: <was wurde gebaut>
Umgebung: Produktion / lokal · Sitzungen: INH ✓ MGR ✗ REZ ✗ REI ✓ GAST ✓
Ausgangslage: <Haus, Zimmerzahl, Personal, Verfahren, Timeout>

| ID | Ergebnis | Notiz |
|---|---|---|
| A1 | ✅ / ❌ / ⏭ (Grund) | |

## Befunde
| # | ID | Beobachtung | Erwartet | Status |

## Nicht durchgeführt
| ID | Grund | Was es bräuchte |
```

Das Protokoll vom 04.09. ([Testplan-Nachlauf-2026-09-03.md](Testplan-Nachlauf-2026-09-03.md))
ist der erste Lauf in diesem Sinn — noch ohne die IDs, aber mit derselben
Gliederung.
