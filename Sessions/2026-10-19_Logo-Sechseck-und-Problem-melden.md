# 19.10.2026 – Logo als Sechseck, „Problem melden“, AVV-Entwurf

Commits: `caf15ce`, `0240c4d` (Logo) · `71dd39c`, `4254e12`, `6f66fc7` (Problem melden) · `4ec7e44`, `b2e7d33` (Mail an Bernd, Prompt). Alles in Produktion, vom User live getestet („Das Ticketsystem läuft gut“).

## 1. Logo: Symbol als Sechseck

- **Kritik von außen:** Das Symbol V15 las sich als „A“ statt „o“. Ursache war der Umriss (oben schmal, unten breit), nicht die Ecken.
- Drei Skizzen gezeigt (Sechseck, Kreis, Kreis mit Innenraum); der User wählte das **symmetrische Sechseck ohne Innenraum**. Der Kreis hätte an den umgedrehten Mercedes-Stern erinnert.
- Der Y-Steg teilt das Sechseck in drei gleiche Fünfecke (rote Blüte, zwei grüne Blätter). Außenecken 7,5 % der Höhe gerundet, Steg- und Mittelecken 2,5 %.
- **Stegbreite einheitlich 15 % der Höhe** für Wortmarke und Icon (User: Konsistenz). Erst 11/14 %, das wirkte schmaler als V15 (13/17 %). Im 16-px-Favicon bleiben ~1,7 px Lücke.
- [scripts/brand-symbol.mjs](../scripts/brand-symbol.mjs) erzeugt die Form; `--write` schreibt alle SVGs unter `Design/Logo-V15/` und `logo-paths.ts`, danach `brand-icons.mjs`.
- Das „?“ in der Kopfzeile wirkt leicht tief: Das liegt an Lucides Zeichnung (knapp 1 px), nicht am Knopf. Bleibt so (User).

## 2. „Problem melden“ – Tickets in RoSe

Ausführlich in [AGENTS.md](../AGENTS.md) unter „Problem melden“. Die Entscheidungen des Users:

- **Gemeinsam statt automatisch.** Claude sieht sich Meldungen nur auf Aufforderung an und erledigt nichts selbständig, auch keine Übersetzung. Eine Automatik ist erst später denkbar.
- **Dialog im System, nicht per Mail** (User: offen, wer an der Rezeption das Postfach liest). Mails nur als Hinweis mit Link, nie mit Inhalt.
- **Sichtbar** für die meldende Person, Inhaber und Manager des Hauses.
- **Gäste und Reinigung melden nicht selbst**, sondern über die Rezeption.
- **Vorgangsnummer `M-0002`** statt `2`: Die nackte Zahl las sich wie „Ihre zweite Meldung“ (User beim Test).

Umsetzung:
- Migration `2026-10-19_tickets.sql` (eingespielt, archiviert): `tickets`, `ticket_messages`, privater Bucket `ticket-screenshots`, drei neue Mail-Zwecke.
- **Support-Adresse** `support@rose-roomservice.app`: Weiterleitung bei Porkbun, vom User eingerichtet (MX `fwd1/fwd2.porkbun.com`, Resend-Einträge unter `send.` unberührt, geprüft).
- **Support-Konto** `goodmood.development@gmail.com`, per Admin-API ohne Passwort angelegt, Passwort-Link über RoSe verschickt (zugestellt). ID in `SUPPORT_USER_IDS` lokal und in Vercel. Ein Support-Konto ohne Haus landet nach der Anmeldung auf `/support` (`landingRoute`).
- Lotse „Die Zimmer-Übersicht“ endet am „?“ (`kopf.hilfe`); der Abschluss der Einrichtung nennt die Funktion.
- **Rechtstexte** (Stand Oktober 2026, Wortlaut vom User freigegeben): Datenschutz Abschnitt 4 „Meldungen an den Support“, Abschnitte 5 und 9 ergänzt; AGB § 4 Abs. 3, § 8 Abs. 4, § 10 Abs. 1.
- **Getestet:** lokal von der Meldung bis zum Abschluss (Bildschirmfoto, Antwort, Kundenantwort, Punkt am „?“, Foto gelöscht, `/support` für andere 404), dann vom User in Produktion.

## 3. AVV-Entwurf und Mail an Bernd

- **AVV-Entwurf** als Claude-Doc ([AVV RoSe – Entwurf](https://claude.ai/code/artifact/a364ff4e-c941-4f08-8c22-d5f406bd07c2)) und als PDF in `Verträge/AVV-RoSe-Entwurf-2026-10-19.pdf` (nicht im Repo). Neun offene Punkte für Bernd stehen oben im Dokument.
- **Verweise auf den AVV** bisher nur in AGB § 8 Abs. 1 (verspricht ihn als bereitgestellt), § 8 Abs. 4, § 12 Abs. 3 und Datenschutz Abschnitt 2/9. Nach Bernds Freigabe: eigene Seite `/avv`, verlinkt aus AGB § 8 und dem Registrierungssatz.
- **Mail an Bernd** ([Mail-Bernd-Offene-Punkte-2026-10-19.md](Mail-Bernd-Offene-Punkte-2026-10-19.md)), vom User verschickt: (1) Stripe live schalten – dringend, damit ein echter Zahlungslauf getestet werden kann, (2) AVV prüfen, (3) Telefonat Lizenzvertrag, (4) Anwalt für AGB, Datenschutz, AVV und Marke. Anhänge: AVV-PDF und ein allgemeiner Claude-Code-Prompt für ein Ticket-System in Bernds eigenem Projekt ([Prompt-Support-Tickets-fuer-Bernd-2026-10-19.md](Prompt-Support-Tickets-fuer-Bernd-2026-10-19.md)).

## 4. Offen

- Bernds Antworten (Stripe live, AVV-Punkte, Lizenzvertrag, Anwalt).
- Nach Stripe live: echter Testlauf mit eigenem Testhaus und eigener Karte (5 € zzgl. USt), Einzug, Rechnungs-Mail, PDF, Anzeige im Konto.
- Nach Bernds Freigabe: AVV als Seite `/avv`, Links in AGB § 8 und bei der Registrierung, Fundstellen der DPAs in Anlage 3.
- Testhaus „ZZ Ticket-Testhaus“ (Meldung M-0001, erledigt) liegt in der Datenbank; kann bleiben.

## 🔖 Wiederaufnahme

Das Ticket-System läuft. Kommen Meldungen, sieht Claude sie **nur auf Aufforderung** unter `/support` an; beraten und entschieden wird gemeinsam. Als Nächstes warten wir auf Bernd (Stripe live, AVV). Danach steht der echte Zahlungslauf an, außerdem der AVV als Rechtsseite. Offen aus der Vorsitzung bleibt der Test des Sprachwechsels mit Englisch durch den User ([2026-10-18_Englisch-komplett.md](2026-10-18_Englisch-komplett.md)).
