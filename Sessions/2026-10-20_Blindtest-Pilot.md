# Sitzung 20.10.2026 (Abend) – Blindtest-Pilot und Funde

## 1. Anlass

Frage des Users: Lässt sich der Echtbetrieb testen, den weder er noch Claude
mehr testen können, weil beide zu viel über das System wissen? Idee: ein
„unwissender Agent“, der nur die Oberfläche sieht und ein Hotel nach Lastenheft
einrichtet und betreibt.

Antwort: ja – als eigene Claude-Sitzung ohne Projektwissen, nur mit dem
Browser. Das Verfahren ist beschrieben in
[Blindtest/Blindtest-Verfahren.md](Blindtest/Blindtest-Verfahren.md).

Entscheidungen des Users:
- erst **lokal und ganz klein** (Pilot), Verbrauch vorher abschätzen und mit
  **Abbruchbedingungen** absichern, damit kein Endloslauf das Kontingent
  verbraucht;
- Funde **in die TODO**, dann Punkt für Punkt gemeinsam abarbeiten.

## 2. Pilotlauf

- Ordner `F:\Coding_Projekte\RoSe-Blindtest` (außerhalb des Repos), Auftrag
  [Blindtest/AUFTRAG-Pilot-2026-10-20.md](Blindtest/AUFTRAG-Pilot-2026-10-20.md),
  Sonnet, Dev-Server lokal.
- Lastenheft „Pension Lindenhof“: registrieren, 8 Zimmer auf 2 Etagen, Regeln
  (Check-out 11, Check-in 15, tägliche Reinigung ab 10, PIN-Zugang), eine
  Reinigungskraft, „Frühstück aufs Zimmer“ 14,50 €, zwei Check-ins, als Gast
  Reinigung wünschen und Frühstück bestellen, als Rezeption erledigen, als
  Reinigungskraft Schicht und Reinigung, zwei Check-outs.
- Ergebnis: A–H im ersten Lauf (147/150 Aktionen), I im Nachlauf (42/40),
  J (Check-out) danach von Claude von Hand geprüft – ohne Befund
  („Zu kassieren 14,50 €“, Aufstellung).
- Protokoll des Agenten: [Blindtest/Protokoll-Agent-Pilot-2026-10-20.md](Blindtest/Protokoll-Agent-Pilot-2026-10-20.md).
- Verbrauch: 5-Stunden-Fenster 4 %, Woche 9 % (inkl. dieser Sitzung); Kontext
  der Blind-Sitzung ~160k Token.
- Konto „Pension Lindenhof“ danach über „Daten löschen“ entfernt, in der DB
  nachgeprüft.

## 3. Funde und was daraus wurde

Alle in [TODO.md](../TODO.md) unter „Funde aus dem Blindtest (20.10.2026)“,
jeweils mit Ergebnis. Jeder Punkt im Browser nachgewiesen, mit kurzlebigen
Testhäusern (`create-tenant.mjs`, danach über die Oberfläche gelöscht und in
der DB nachgeprüft).

| Fund | Lösung | Commit |
|---|---|---|
| Gästeportal nannte „ab morgen täglich ab 11:00“, obwohl 10:00 eingestellt und Abreisedatum bekannt | `routineTomorrow` in `board.ts` (Routine-Zeit, wenn der Gast über morgen bleibt; neuer Text, wenn morgen Abreise); Check-in-Blatt und Mail mit `knownStayover` | `b6d021e` |
| Preis nur über eine „Option“ | `service_definitions.price_cents` (Migration eingespielt), Preisfeld beim Anlegen und an der Karte, Snapshot `{ whole: true }`; genau eine Option vorausgewählt | `66d177c` |
| Übersetzungsbanner für FR/ES in einer deutschen Pension | `maintainedLanguages` – gemahnt nur für Rückfall- und Blatt-Sprachen, übrige Chips „optional“ | `cc73d85` |
| „Dringend an / aus“ mehrdeutig | Schalter mit `role="switch"` | `2180181` |
| „Gespeichert“ übersehen | Leiste grün, „Gespeichert um HH:MM Uhr.“, 8 s | `c1b1c53` |
| Wisch-Schieber nicht erkennbar | Tipp ⇒ Griff rutscht an, „Zum Bestätigen wischen“ | `7a86f0c` |
| Anmeldeadressen fehlen | Check-in-Dialog und Personal-Seite nennen die Adresse | `d6fa563` |
| Lange Wartezeiten | In Produktion gemessen (Sitzung des Users): Dialog 6 ms, Check-in 0,58 s, Check-out 0,65 s – war der Dev-Modus | `4c418ed` |
| Kleinigkeiten | Etagen-Feld zählt weiter, Gästezugang-Wortlaut begründet, „Schritt 1 von 2“; Etagen-Reihenfolge bleibt | `c973bbf` |
| Bedienelemente ohne Beschriftung | Großteils Werkzeug-Artefakt (DOM-Prüfung 12 Seiten ohne Lücke); `aria-pressed`/`aria-expanded` im Gästeportal ergänzt | `caead57` |

Texte immer in allen vier Sprachen (de, en, fr, es; `fr-typo.mjs` nach jeder
Änderung an `fr/`). Hilfe und Lotse zum Preis mitgezogen. `verify` und
Integrationstests (84) vor beiden Pushes grün.

## 4. Lehren

- **Das Verfahren trägt.** Die ersten drei Funde (Uhrzeit, Preis, Banner)
  hätten weder User noch Claude gesehen.
- **Dev-Modus verfälscht:** Ein Großteil der Aktionen ging für Nachprüfen nach
  langsamen Klicks drauf. Nächster Lauf mit Produktions-Build.
- **Werkzeug-Artefakte erkennen:** Fehlende Namen im Accessibility-Baum sind
  oft keine – vor dem Weitergeben im DOM prüfen. Claude hat das zunächst
  selbst falsch bestätigt.
- **In Produktion meldet sich Claude nicht selbst an** (Sicherheitsregeln);
  Messungen dort nur in einer Sitzung des Users.
- Gelernt nebenbei: Claude rutschte mitten in der Arbeit ins Englische – der
  User will durchgehend Deutsch (Memory „immer-deutsch“).

## 5. Spur in Produktion

Zum Messen wurde im Haus „Test-Hotelkette“ Zimmer 105 ein- und ausgecheckt.
Es steht als „zu reinigen“, im Verlauf ein Check-in und ein Check-out.

## 6. Nächste Schritte (morgen)

1. **Auftrag für den zweiten Lauf anpassen** (`RoSe-Blindtest/AUFTRAG.md`):
   Hinweis zu fehlenden Namen (nur mit Bildschirmfoto als Befund), Limit
   ~250 Aktionen, Lastenheft vollständig inklusive Check-out.
2. **Lokal mit Produktions-Build** starten (`npm run build && npm start`),
   Launch-Eintrag dafür in `.claude/launch.json` ergänzen.
3. **Zweiter Pilot gleicher Größe** als Gegenprobe: Werden die behobenen
   Funde noch gemeldet? Neue Funde?
4. Danach **größerer Lauf**: zwei Gebäude, 30–60 Zimmer, Link-Zugang statt
   PIN, zwei Reinigungskräfte nacheinander, Zusatzleistung mit Optionen,
   Sprachen, Abreisetag. Verbrauch vorher aus dem Pilot hochrechnen.
5. Optional: **Staging-Subdomain** (Vercel-Preview) für Läufe nah am
   Echtbetrieb – mit dem User entscheiden.
6. Offen aus früheren Sitzungen unverändert: siehe TODO (u. a. Review der
   neuen französischen Texte beim nächsten Durchgang).

## 🔖 Wiederaufnahme

- Stand: alles gepusht bis `caead57` (+ dieses Protokoll), Produktion gebaut.
- Kein lokales Testhaus mehr übrig (Lindenhof, Uhrzeit, Preis, Sprach,
  Runde, Klein – alle gelöscht und nachgeprüft).
- Blindtest-Ordner `F:\Coding_Projekte\RoSe-Blindtest` mit `AUFTRAG.md`,
  `zugang.txt` (Einladungscode, Pilot-Passwort – das Konto existiert nicht
  mehr) und `protokoll.md` des Piloten. Vor dem nächsten Lauf `protokoll.md`
  umbenennen oder löschen und ein neues Passwort in `zugang.txt` erzeugen.
- Die Blind-Sitzung „Blindtest RoSe – Pilot Pension Lindenhof“ ist idle;
  für den zweiten Lauf eine **neue** Sitzung starten (frischer Kontext).
- Einstieg morgen: Abschnitt 6, Schritt 1.
