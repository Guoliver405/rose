# 04.09.2026 — Produktions-Testlauf der Implementierung vom 03.09.

**Auftrag:** Die Bausteine vom Vortag systematisch durchtesten — auf Wunsch des
Users **in Produktion** (rose-roomservice.app), nicht lokal, weil Zugänge,
Portale, Mail und QR-Scans nur dort unter echten Bedingungen laufen. Ab Block 4
hat Claude die Klickarbeit in Chrome übernommen (User angemeldet, Claude
fährt), Gast- und Reinigungssitzungen parallel im Vorschau-Browser.

Der Plan mit allen Haken, Befunden und dem Abschnitt „Nicht durchgeführt":
[Testplan-Nachlauf-2026-09-03.md](Testplan-Nachlauf-2026-09-03.md).

## Ergebnis in einem Satz

Alle acht Blöcke bestanden, neun Befunde, davon acht am selben Tag behoben und
deployt; der neunte (Mail-Zustellbarkeit) ist Reputation, keine Technik.

## Befunde und was daraus wurde

| # | Befund | Erledigung |
|---|---|---|
| 1 | Aktive Karte auf „Gäste-Zugang" im Dark Mode unlesbar | Karte ohne Tint, Auswahl über Rahmen + Ring |
| 2 | QR-Aushänge als eigene Kachel, obwohl nur im PIN-Verfahren sinnvoll | Abschnitt auf „Gäste-Zugang", nur im PIN-Verfahren; Rezeptions-Kachel ebenso; Aushang-Seite warnt im Link-Verfahren |
| 3 | Check-in „Oli", Check-out „Rezeption" | `stays.checked_out_by` (Migration, archiviert) |
| 4 | Verlauf löste Namen nur über das Stammhaus auf — Inhaber mit zwei Häusern erschien im zweiten als „Rezeption" | Auflösung über die vorkommenden Akteur-IDs |
| 5 | Stale-Timeout war reine Ableitung, stiller Reset unsichtbar | `reapStaleCleanings`: erster Zugriff nach dem Limit schreibt `clean_aborted` (Quelle `system`, datiert auf Start + Limit), race-sicher; in Produktion mit gleichzeitigem Laden von Übersicht und Board bestätigt: genau ein Stich |
| 6 | Gast-Mail bei Yahoo im Spam | `text/plain`-Teil, Spam-Hinweis auf dem Handout; `Authentication-Results` dreimal `pass`; Tracking nicht aktiv; DMARC `p=quarantine` für die Sende-Domain gesetzt. Rest ist Reputation |
| 7 | Löschdialog Personal im Dark Mode kaum lesbar | **Wurzel:** Dark-Werte für Tint-, Pill-, Deep- und Text-Strong-Token in `globals.css`; Print setzt zurück |
| 8 | QR-Login einer beendeten Kraft: „neue Karte anfordern" | eigener Fehlercode `deactivated`, dieselbe Meldung wie beim PIN-Login |
| 9 | Hinweisseite nach erloschenem Aufenthalts-Link verwies auf den Zimmer-QR | `/guest?error=link` erklärt den erloschenen Zugang |

## Was der Lauf sonst gezeigt hat

- **Das Verfahren hängt am Aufenthalt** — Zimmer 801 behielt seine PIN über
  zwei Umstellungen, während 802 daneben je nach Einstellung mal Link, mal PIN
  bekam. Fünf Fehlversuche auf das Link-Zimmer erhöhten keinen Zähler.
- **Zugang beenden** wirkt an allen drei Stellen (offene Sitzung, PIN, QR),
  „Wieder aktivieren" stellt alles her; ein Benutzernamen-Wechsel zieht die
  Auth-Adresse mit (in der DB nachgemessen).
- **Löschbegehren** mit Wegwerf-Haus: Vorschau exakt gleich dem DB-Stand,
  danach alle Tabellen des Hauses auf 0, Auth-Konto der Kraft weg, Nachbarn
  und Inhaber unberührt.
- Die Warnung „Zimmer nicht bereit" beim Check-in auf ein ungereinigtes Zimmer
  greift, „Trotzdem einchecken" funktioniert.

## Werkzeug-Notizen (für den nächsten Lauf)

- **Chrome (Erweiterung):** Klicks über `ref` treffen wegen der
  Windows-Skalierung daneben; **Koordinaten aus einem 0.5-Screenshot × 2**
  treffen zuverlässig. `form_input` funktioniert. Dialog-Positionen wandern
  mit dem Inhalt (Verlauf, Warnungen) — vor jedem Klick in einen Dialog neu
  screenshoten.
- **Vorschau-Browser:** Bei ausgeblendetem Pane sind Screenshots oft
  Timeouts und `read_page` leer. Mit `resize_window 1280×800` funktioniert
  `read_page`; Koordinaten dann **CSS-Pixel × 0.625** (Frame 800×500).
  `javascript_tool` mit `getBoundingClientRect` liefert die Positionen.
  `left_click_drag` braucht einen vorherigen Screenshot (Scale 0.2 reicht).
  SlideAction-Züge zeigen sich im Seitentext erst nach einem zweiten Lesen.
- **DB-Nachmessen** über ein kleines Node-Skript mit dem Secret Key aus
  `.env.local` war das schnellste Verifikationsmittel (Zähler, Kaskaden,
  Auth-Adressen).

## Offen

- **Mail-Zustellung Yahoo:** Ein zweiter Versand kam laut User gar nicht an,
  auch nicht im Spam. In den Vercel-Logs aller heutigen Deployments kein
  `[mail]`-Fehler, der Server hat also nicht abgelehnt. Nächster Schritt:
  Zeitpunkt und Adresse, dann Resend → Logs (Delivered/Bounced/Complained).
- Die Liste „Nicht durchgeführt" im Testplan: Testzugänge ohne Mail (nur
  lokal), Rezeption/Manager mit offener Sitzung, Manager in zwei Häusern,
  Rezeption löschen mit Vorgang, Kraft mit Historie tatsächlich löschen,
  Zimmer-QR im Link-Verfahren, Mail-Inhalt, Stammhaus-Grenzfall live,
  Konto löschen.
- Testhaus `test-hotelkette`: 801, 802, 808 stehen auf „zu reinigen", Mary
  Test mit ihren Stichen bleibt — bewusst nicht abgeräumt, damit Verlauf und
  Auswertung ansehbar bleiben. „Testdaten vollständig entfernen" ist der
  letzte Schritt des Plans.

---

## 🔖 Wiederaufnahme

**Stand am Ende des 04.09.2026:** Der Testlauf zur Implementierung vom 03.09.
ist komplett durch, alle Befunde außer der Mail-Reputation sind behoben und
deployt (`verify` grün, 118 Unit-Tests). Neu im Code: `stays.checked_out_by`,
`reapStaleCleanings` (Stale-Timeout festgeschrieben), Dark-Mode-Werte für die
Tint-Schicht, Aushänge unter „Gäste-Zugang", Fehlercode `deactivated`,
Hinweistext für erloschene Links, Plain-Text-Teil der Gast-Mail.

**Nachtrag zum Abschluss:** Die Mail-Frage ist geklärt — der dritte Versand
(nach Plain-Text-Teil und DMARC) kam bei Yahoo **im Posteingang** an; der
vermeintlich verlorene Versuch hatte Resend nie erreicht (Bedienung). Das
Testhaus ist abgeräumt (0 Aufenthalte, 0 Verlauf, 0 Stiche, nachgemessen).
Als bleibende Infrastruktur entstand der
[GUI-Testkatalog](GUI-Testkatalog.md): nummerierte Fälle A–K, Kennzeichnung,
was Claude allein kann und was den Menschen braucht, Lauf-Vorlage.

**Wenn hier weitergearbeitet wird:**

- Neue GUI-Tests in den Katalog, nicht in Protokolle; ein Lauf =
  `Sessions/GUI-Lauf-<Datum>.md` nach der Vorlage in Abschnitt 6.
- Die offenen **C+M**/**M**-Fälle (B6, B10, B11, I4, I5, J3, J5, J6) brauchen
  vom Menschen: zweite Management-Sitzung, Manager mit echter Adresse, Handy,
  Postfach, Drucker — vorher bereitstellen, dann in einem Lauf abarbeiten.
- Wer eine weitere Stelle baut, die `room_states.cleaning_by` zurücksetzt,
  muss vorher `reapStaleCleanings` rufen — sonst geht der Start der Kraft
  spurlos verloren.
- Neue Hinweis-Kästen dürfen wieder `bg-*-tint` mit `text-ink*` oder
  `text-*-deepest` nutzen; beides ist jetzt in beiden Themes lesbar.
