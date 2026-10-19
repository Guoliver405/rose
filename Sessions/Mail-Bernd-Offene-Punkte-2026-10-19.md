# Mail an Bernd – offene Punkte, Stripe live schalten, AVV-Entwurf (Entwurf, 19.10.2026)

> Entwurf von Claude im Auftrag von Oliver, nicht verschickt. Absender Oliver,
> Empfänger Bernd Köhl. Anhang: `Verträge/AVV-RoSe-Entwurf-2026-10-19.pdf` (nicht im Repo).
> Grundlagen: [Mail-Bernd-Stripe-Live-2026-09-13.md](Mail-Bernd-Stripe-Live-2026-09-13.md),
> [2026-10-11_Lizenzvertrag-Gegenentwurf.md](2026-10-11_Lizenzvertrag-Gegenentwurf.md), [TODO.md](../TODO.md).

**Betreff:** RoSe – was bei dir liegt: Stripe live schalten zuerst, dazu AVV-Entwurf

Hallo Bernd,

ich habe einmal alles zusammengetragen, was für RoSe gerade bei dir liegt. Am
wichtigsten ist Punkt 1: Ich möchte einen echten Zahlungslauf testen – Einzug,
Rechnung per Mail, Beleg im Konto –, bevor der erste Kunde zahlt. Den Rest
kannst du nach und nach abarbeiten.

**Deine To-dos auf einen Blick**

1. Stripe-Konto der UG live schalten (Details unten) – **dringend**
2. AVV-Entwurf prüfen, neun offene Punkte (Anhang)
3. Lizenzvertrag: unser Telefonat zu deinem Gegenentwurf
4. Anwalt beauftragen: AGB, Datenschutz, AVV und Marken-Recherche „RoSe“

**1. Stripe live schalten – dringend**

Die Sandbox in deinem Konto läuft seit September stabil: Rechnungen, Steuer,
Einzug und Rückmeldungen funktionieren dort. Für den Live-Betrieb fehlt noch:

- **Teamzugang für mich** (Einstellungen → Team, Rolle „Entwickler“ oder
  „Administrator“) – dann sehe ich Ereignisse und Rechnungen selbst.
- **Kontoaktivierung:** Unternehmensdaten der UG, deine Identität als
  Geschäftsführer, Bankkonto für Auszahlungen, USt-IdNr. DE434570609. Das
  Konto muss auf „I²D UG (haftungsbeschränkt)“ lauten, wie im Impressum –
  der Name steht auf jeder Rechnung und jedem Lastschrift-Mandat.
- **Einstellungen im Dashboard** (erst nach der Aktivierung möglich):
  öffentliche Unternehmensinformationen (Name, Abbuchungstext,
  Support-Adresse support@rose-roomservice.app, Website),
  Rechnungsnummern-Präfix `RS`, Kunden-Mails für Rechnungen und
  fehlgeschlagene Zahlungen, SEPA-Lastschrift und Banküberweisung im
  Live-Modus freischalten.
- **Live-Schlüssel** an mich – bitte nicht per offener Mail, lieber per
  Anruf oder Passwort-Manager-Link. Webhook, Steuer und Zahlungswege lege ich
  dann selbst an, wie in der Sandbox.

Den Testlauf mache ich anschließend mit einem eigenen Testhaus und meiner
eigenen Karte: eine kleine echte Rechnung (5 € Mindestbetrag zzgl. USt),
Einzug, Rechnungs-Mail, PDF, Anzeige im Konto. Die Zahlung landet auf dem
Auszahlungskonto der UG; wir können sie danach erstatten oder stehen lassen.

**2. AVV-Entwurf (Anhang)**

Unsere AGB versprechen in § 8 einen Auftragsverarbeitungsvertrag, den es
bisher nicht gab – Kunden brauchen ihn, weil RoSe Gäste- und Personaldaten
für sie verarbeitet. Der Entwurf beschreibt, was RoSe heute tatsächlich
speichert und wann es gelöscht wird. Ganz oben stehen neun Punkte, die du
klären müsstest, unter anderem:

- ob der AVV mit den AGB bei der Registrierung gilt (Vorschlag: ja, als
  eigene Seite /avv verlinkt),
- die Meldefrist bei Datenpannen (Vorschlag: möglichst 24 Stunden),
- welche Datensicherung unser Supabase-Tarif hat,
- wer bei uns Zugriff auf die Produktionsdaten hat,
- ob die Verträge mit Supabase, Vercel und Resend abgeschlossen sind.

Wenn du einverstanden bist, stelle ich ihn nach deiner Durchsicht als Seite
online und verlinke ihn in AGB und Registrierung.

**3. Lizenzvertrag**

Dein Gegenentwurf vom Oktober liegt mit meinen Anmerkungen bei dir. Lass uns
dazu wie besprochen telefonieren; danach gehen Steuerberater und Anwalt
darüber.

**4. Anwaltliche Prüfung**

AGB, Datenschutzerklärung und der AVV sind Entwürfe ohne anwaltliche Prüfung.
Das sollte vor dem ersten zahlenden Kunden passieren. In denselben Termin
gehört die Ähnlichkeitsrecherche für die Wortmarke „RoSe“ (DPMA, Klassen 9
und 42) – erst danach melden wir an.

**Zur Info:** Kunden können seit heute in RoSe „Problem melden“ – mit
Gesprächsverlauf im System und Hinweis-Mail an support@rose-roomservice.app.
Das Postfach leitet an mich weiter. Datenschutz und AGB sind dafür ergänzt
(Stand Oktober 2026).

Viele Grüße
Oliver
