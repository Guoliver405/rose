# Blindtest – RoSe aus Sicht eines unwissenden Nutzers testen

Stand 20.10.2026, nach dem ersten Pilotlauf. Ergebnis und Funde des Piloten:
[2026-10-20_Blindtest-Pilot.md](../2026-10-20_Blindtest-Pilot.md).

## Idee

Ein KI-Agent bedient RoSe **nur über die Oberfläche**, ohne Wissen über Code,
Konzept oder Begriffe des Projekts. Er bekommt ein Lastenheft, wie es ein
Hotelier hätte („Pension mit 8 Zimmern, tägliche Reinigung ab 10 Uhr, eine
Reinigungskraft, Frühstück für 14,50 € …“), und arbeitet es ab wie ein neuer
Kunde. Sein Ergebnis ist ein **Reibungsprotokoll**: wo er gesucht, falsch
verstanden, gezweifelt hat – nicht nur, wo etwas kaputt ist.

Wozu: Der User und Claude kennen das System zu gut, um zu sehen, woran ein
neuer Kunde scheitert. Der Agent ersetzt keine menschlichen Tester (er ist
geduldiger, liest mehr, kennt andere Software), findet aber zuverlässig
Stellen, an denen die Oberfläche etwas voraussetzt, das sie nicht sagt.

## Aufbau

1. **Eigener Ordner ohne Projektwissen** – `F:\Coding_Projekte\RoSe-Blindtest`,
   neben dem Repo, nicht darin. Darüber liegt keine `CLAUDE.md`, global auch
   nicht; eine Claude-Sitzung dort startet also ohne Projektanweisungen und
   ohne Memory. (Ein Unteragent aus der Projektsitzung heraus wäre nicht
   sauber genug.)
2. **`AUFTRAG.md`** im Ordner – Rolle, Regeln, Abbruchbedingungen, Lastenheft,
   Protokollformat. Vorlage: [AUFTRAG-Pilot-2026-10-20.md](AUFTRAG-Pilot-2026-10-20.md).
   Das Lastenheft nennt **Ziele, keine Wege**: keine RoSe-Begriffe („Haus &
   Regeln“, „Gästeportal“, „Lotse“), kein Hinweis, wo etwas liegt, keine
   Erwähnung der Hilfe.
3. **`zugang.txt`** im Ordner – Einladungscode und ein frisch erzeugtes
   Passwort. Gehört nicht ins Repo.
4. **Dev-Server bzw. Produktions-Build lokal** (siehe „Wo er läuft“).
5. **Blind-Sitzung starten** – eigene Claude-Sitzung mit `cwd` auf den Ordner,
   Modell **Sonnet** (günstiger, und ein weniger gewiefter Tester ist näher am
   echten Nutzer), kurzer Auftrag „Lies AUFTRAG.md und führe ihn aus“.
6. **Auswerten mit Systemwissen** – Claude in der Projektsitzung liest
   `protokoll.md` und ordnet jeden Punkt ein: echter Fehler, Bedienproblem,
   Irrtum des Agenten oder Werkzeug-Artefakt. Funde gehen in die TODO.
7. **Aufräumen** – das angelegte Konto über „Daten löschen“ auf `/admin`
   entfernen und in der Datenbank nachprüfen (Haus, Konto, Anmeldekonten).

## Regeln für den Agenten (im Auftrag)

- Nur Browser-Werkzeuge: Seiten aufrufen, Text lesen, klicken, tippen,
  Bildschirmfotos. **Kein** JavaScript, keine Konsole, kein Netzwerkverkehr,
  keine Dateien außerhalb seines Ordners, keine Internetsuche.
  Durchsetzen lässt sich das nur über den Auftrag – im Verlauf der Sitzung
  nachprüfbar.
- Seiten bevorzugt als Text lesen, Bildschirmfotos nur bei Unklarheit (spart
  Token).
- Keine Mails verschicken (lokal ist der Resend-Schlüssel gesetzt, Mails
  gingen wirklich raus) – Mail-Optionen nur notieren.
- Nichts löschen, was er nicht selbst angelegt hat.
- Protokoll **laufend** nach jeder Aufgabe schreiben, damit bei Abbruch
  nichts verloren geht.

## Abbruchbedingungen (gegen Token-Verbrauch ohne Ende)

- Jede Browser-Aktion zählt 1, der Zähler steht im Protokoll.
- **Hartes Limit** (Pilot: 150, Nachlauf: 40) – danach Protokoll abschließen.
- 3 Fehlversuche bei derselben Sache ⇒ „gescheitert“, weiter.
- 15 Aktionen ohne Fortschritt ⇒ Aufgabe abbrechen, weiter.
- Dieselbe Seite zum dritten Mal mit demselben Ziel ⇒ anhalten.
- Unerwartete Lage ⇒ höchstens ein neuer Versuch.
- Von außen: Die Sitzung erscheint als eigene Zeile und lässt sich stoppen.

Im Pilot hat der Agent alle Bedingungen eingehalten und sauber am Limit
aufgehört.

## Verbrauch (gemessen im Pilot)

- 189 Browser-Aktionen für einen Lauf A–I (Registrieren bis Reinigung).
- Kontext der Blind-Sitzung am Ende rund 160.000 Token, also grob
  1.000 Token je Aktion.
- Claude Max: 5-Stunden-Fenster nach Pilot **und** Auswertung bei 4 %, Woche
  bei 9 %.
- Hochgerechnet: voller kleiner Lauf ≈ 200 Aktionen; großes Haus (60 Zimmer,
  mehrere Kräfte) eher 400–600 Aktionen, grob 10–20 % eines Fensters.
  Schätzwert.

## Wo er läuft – und warum nicht in Produktion

Claude gibt nach seinen Sicherheitsregeln Passwörter, PINs und Testkonten nur
auf **lokalen** Hosts ein (`localhost`) oder auf einer Adresse, deren Name sie
als Testumgebung ausweist (z. B. `staging.rose-roomservice.app`).
`rose-roomservice.app` zählt als Produktion, auch mit reinen Testdaten. Darum:

- **Blindtest lokal**, gegen dieselbe Supabase-Datenbank wie Produktion.
- **Messen in Produktion** nur in einer Sitzung, in der sich der **User selbst**
  angemeldet hat (so am 20.10. für die Reaktionszeiten).
- Für Läufe nah am Echtbetrieb wäre eine Staging-Subdomain auf ein
  Vercel-Preview-Deployment der Weg.

**Lokal mit Produktions-Build, nicht mit `npm run dev`:** Im Pilot kosteten
die Übersetzungszeiten von Turbopack (5–10 s beim ersten Aufruf jeder Seite)
den größten Teil der Aktionen – der Agent prüfte nach jedem Klick nach, ob er
gewirkt hat. In Produktion gemessen: Dialog 6 ms, Check-in 0,58 s.
`npm run build && npm start` (Port 3000) statt Dev-Server.

## Bekannte Grenzen und Fallen

- **Accessibility-Baum des Browser-Werkzeugs zeigt verschachtelte Namen
  nicht an.** Links und Knöpfe, deren Text in `<span>`s liegt, und Felder in
  einem umschließenden `<label>` erscheinen als namenlos („button“, „link“,
  „textbox“), obwohl Screenreader sie korrekt vorlesen. Der Pilot meldete das
  als Barrierefreiheits-Befund; auch Claude hat es zunächst bestätigt.
  ⇒ Im Auftrag: fehlende Namen nur mit Bildschirmfoto als Befund werten;
  bei der Auswertung im DOM prüfen.
- QR-Codes scannen, drucken, Mails im Postfach, echte Uhrzeiten (Routine
  „ab 10:00“) kann der Agent nicht oder kaum testen.
- Mehrere Personen gleichzeitig nur mit getrennten Sitzungen. Gast-, Reinigungs-
  und Verwaltungs-Cookies sind getrennt (`rose_guest`, `svc_`, `sb-`), drei
  Rollen in einem Browser gehen also; zwei Reinigungskräfte nicht.
- Wisch-Schieber bedient der Agent per Ziehen – ein Mensch am Handy wischt
  eher von selbst. Solche Funde wiegen für echte Nutzer etwas weniger.
- Der Agent ist geduldiger und belesener als ein typischer Rezeptionist.
