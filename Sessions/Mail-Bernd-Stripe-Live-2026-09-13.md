# Mail an Bernd — Stripe: Sandbox umgezogen, was für den Live-Betrieb fehlt (Entwurf, 13.09.2026)

> Entwurf von Claude im Auftrag von Oliver, nicht verschickt. Absender Oliver,
> Empfänger Bernd Köhl. Grundlage:
> [2026-09-13_Stripe-Umzug-I2D-Sandbox.md](2026-09-13_Stripe-Umzug-I2D-Sandbox.md).

**Betreff:** RoSe — Stripe läuft jetzt auf dem I²D-Konto (Sandbox); fünf Punkte bis zum Live-Betrieb

Hallo Bernd,

danke für die Schlüssel. Die Sandbox des I²D-Kontos ist seit heute Nachmittag
die Testumgebung von RoSe. Eingerichtet habe ich per API: Stripe Tax mit dem
Hauptsitz in der Saarbrücker Straße, die deutsche Steuer-Registrierung,
Karte, SEPA-Lastschrift und Überweisung als Zahlungswege, den Webhook nach
Produktion. Eine Probe-Rechnung über 5,95 € netto ist mit 19 % Steuer
erzeugt und per simulierter Überweisung bezahlt worden, die Rückmeldungen
kamen in RoSe an.

Bis wir echte Rechnungen stellen können, brauche ich noch fünf Dinge von dir,
am besten in dieser Reihenfolge:

**1. Teamzugang für mich im Stripe-Konto.** Einstellungen → Team → mich mit
der Rolle „Entwickler" (oder Administrator) einladen. Dann sehe ich
Ereignisse, Webhook-Zustellungen und Rechnungen selbst, und die meisten
Rückfragen erledigen sich. Nebeneffekt: Die Sandbox schickt Test-Mails nur
an Adressen, die zum Konto gehören — mit dem Zugang sehe ich auch die.

**2. Kontoaktivierung.** Stripe verlangt für den Live-Modus die
Unternehmensdaten der UG, deine Identität als Geschäftsführer, ein Bankkonto
für Auszahlungen und die USt-IdNr. (DE434570609). Ohne diese Verifizierung
gibt es keine brauchbaren Live-Schlüssel, und die Angaben, die auf jeder
Rechnung stehen, lassen sich nicht setzen.

**3. Rechtsperson.** Das Konto sollte auf „I²D UG (haftungsbeschränkt)"
lauten — genau so steht es im Impressum, in den AGB und im Datenschutz von
RoSe. Der Name aus dem Stripe-Konto erscheint auf allen Rechnungen und
Lastschrift-Mandaten.

**4. Vier Einstellungen, die nur im Dashboard gehen** (erst nach der
Verifizierung freigeschaltet):
- Öffentliche Unternehmensinformationen: Name, Abbuchungstext auf dem
  Kontoauszug der Kunden, Support-Adresse, Website.
- Rechnungsnummern-Präfix `RS` (Einstellungen → Abrechnung → Rechnungen).
- Kunden-Mails: fertige Rechnungen versenden, fehlgeschlagene Zahlungen,
  Belege, Zahlungsanweisungen für Überweisungen (Abschnitt 8 der Anleitung,
  die du hast).
- Freischaltung von SEPA-Lastschrift und Banküberweisung im Live-Modus —
  beides prüft Stripe, das ist nicht nur ein Häkchen.

**5. Live-Schlüssel**, wenn 2 bis 4 stehen. Bitte nicht per offener Mail; ein
kurzer Anruf oder ein Passwort-Manager-Link reicht. Den Rest (Webhook,
Steuer-Einstellungen, Zahlungsmethoden) lege ich per API an, genau wie heute
in der Sandbox.

Was sich für dich nicht ändert: Der Preis bleibt 0,50 € je Zimmer und Monat,
mindestens 5 €, erster Monat frei. Rechnungen schreibt Stripe im Namen der
UG, die Steuer rechnet Stripe Tax, Zahlungen laufen über einen Kanal.

Viele Grüße
Oliver
