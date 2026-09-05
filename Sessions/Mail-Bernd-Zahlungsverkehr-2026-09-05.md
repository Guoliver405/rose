# Mail an Bernd — Zahlungsverkehr für RoSe (Entwurf, 05.09.2026)

> Entwurf von Claude im Auftrag von Oliver, nicht verschickt. Absender Oliver,
> Empfänger Bernd Köhl (Geschäftsführer I²D UG). Grundlage:
> [Zahlungsprovider-Gegenueberstellung-2026-09-05.md](Zahlungsprovider-Gegenueberstellung-2026-09-05.md).

**Betreff:** RoSe — wie wir den Zahlungsverkehr abwickeln wollen (Stripe), und was ich dafür von dir brauche

Hallo Bernd,

danke fürs Nachtragen des Impressums — die Daten stehen seit heute Abend auf
rose-roomservice.app, der Platzhalter-Hinweis ist weg.

Ich habe heute die Zahlungsabwicklung durchgearbeitet und möchte dir die
Entscheidung samt Begründung vorlegen, bevor wir sie umsetzen. Kurzfassung:
**Stripe**, mit Karte als Hauptweg, SEPA-Lastschrift für den Euroraum und
Überweisung auf Rechnung als drittem Weg. Die Rechnung erzeugt RoSe selbst.

**Woraus die Entscheidung folgt**

Unser Preismodell steht: 0,50 € je Zimmer und Monat, mindestens 5 €, erster
Monat frei, monatlich nachträglich abgerechnet. Daraus ergeben sich vier
Anforderungen an den Zahlungsweg, und die sind unabhängig vom Anbieter:

1. Die Beträge sind klein (5 bis etwa 120 € brutto im Monat) und variabel —
   RoSe berechnet sie selbst aus der Zimmerzahl. Der Anbieter soll den Betrag
   einziehen, nicht ermitteln. Ein Abo mit Festpreis passt nicht.
2. Das Zahlungsmittel soll bei der Registrierung hinterlegt werden, obwohl der
   erste Monat frei ist — also ohne Belastung, sonst endet der freie Monat in
   einer Sperre statt in einer Rechnung.
3. Die Rechnung müssen wir ohnehin selbst schreiben: fortlaufende Nummer,
   unsere USt-IdNr., Reverse-Charge-Hinweis für EU-Kunden — und ab dem
   1. Januar 2028 ist die I²D UG zur E-Rechnung (ZUGFeRD/XRechnung) an
   deutsche Geschäftskunden verpflichtet. Keiner der Anbieter liefert das.
4. RoSe soll weltweit verfügbar sein, nur für Geschäftskunden. Das heißt:
   Karte muss überall gehen, und für die Steuer gilt fast überall das
   Empfängerortprinzip — Hotels außerhalb Deutschlands bekommen eine
   Nettorechnung und versteuern selbst.

**Warum Stripe**

Ich habe Stripe, Mollie, PayPal und Paddle verglichen (Zahlen an drei
Beispielrechnungen: 10, 50 und 200 Zimmer).

- Stripe kann alle vier Punkte als Standardweg: Zahlungsmittel ohne
  Belastung speichern, später mit beliebigem Betrag belasten, Ergebnis per
  Webhook melden. Karten aus aller Welt, dazu je nach Land des Kunden lokale
  Verfahren (SEPA, ACH in den USA, Bacs in UK, PayPal im EWR). Vertragspartner
  ist Stripe Payments Europe in Dublin — für den Datenschutz dieselbe Lage
  wie bei unserer Datenbank und unserem Hosting.
- Bei unseren Beträgen zählt die Festgebühr, nicht der Prozentsatz: Eine
  SEPA-Lastschrift kostet 0,35 € je Einzug, egal ob 5 € oder 120 €. Eine
  Karte aus dem EWR 1,5 % + 0,25 €, außerhalb des EWR rund 3,25 % + 0,25 €.
  Beim Mindestbetrag von 5,95 € brutto sind das 34 bis 35 Cent — bei PayPal
  54 Cent, bei Paddle 75 Cent.
- Mollie wäre die europäische Alternative zum gleichen Preis, ist aber auf
  europäische Händler und Verfahren ausgerichtet und kann das Zahlungsmittel
  nicht ohne eine erste Zahlung speichern. Mit „weltweit" fällt es weg.
- PayPal ist als Wallet stark, aber als Einzugsweg umständlich: variable
  Abbuchungen laufen über „Reference Transactions", die PayPal je Konto erst
  freischalten muss, die Kartengebühr ist die höchste, und der Käuferschutz
  schützt den Käufer, nicht uns. Als zusätzliche Zahlungsart können wir es
  über Stripe anbieten.
- Paddle übernimmt als „Merchant of Record" den Vertrag und die Steuer
  weltweit — dafür 5 % + 0,50 $ je Vorgang, beim Mindestbetrag über 12 %,
  und Produkte unter 10 $ nur auf Anfrage. Vor allem aber: Der Hotelier bekäme
  seine Rechnung von Paddle in London, nicht von uns. Das passt nicht zu
  einem B2B-Verhältnis mit deutschen Hotels und widerspricht § 1 unserer AGB.

**Die drei Zahlungswege im Detail**

- **Karte** (Visa, Mastercard, Amex, Apple/Google Pay): der Hauptweg, weil er
  überall funktioniert. Rückbuchung als Chargeback bis 120 Tage möglich.
- **SEPA-Lastschrift**: der bequeme Weg im Euroraum. Der Zahler kann acht
  Wochen ohne Angabe von Gründen zurückbuchen — das ist bei der
  Basislastschrift so, die Firmenlastschrift ohne Widerspruchsrecht bietet
  keiner der Anbieter an. Das Risiko ist begrenzt: ein Monatsbetrag, und nach
  einer Rücklastschrift sperren wir den Zugang (steht in § 6 der AGB). Wer den
  Dienst weiter nutzen will, zahlt.
- **Überweisung auf Rechnung**: Stripe legt je Kunde eine virtuelle IBAN an,
  die auf unserer Rechnung steht; der Eingang wird automatisch zugeordnet. Kein
  Einzug, keine Rückbuchung, und Hotelbuchhaltungen mögen den Weg ohnehin.
  Dafür Zahlungsziel 14 Tage und Erinnerung/Sperre, wenn nichts kommt.

**Steuer**

Zunächst rechnen wir selbst: Deutschland 19 %, EU-Geschäftskunden Reverse
Charge nach Prüfung der USt-IdNr., Drittland ohne deutsche Steuer. Land und
USt-IdNr. fragen wir bei der Registrierung ab. Sobald nennenswert Umsatz
außerhalb der EU entsteht, schalten wir „Stripe Tax" dazu (0,5 % je
Transaktion): Es überwacht, in welchen Ländern Registrierungspflichten
entstehen, und rechnet die Steuer dort. Das ist ein Schalter im Stripe-Konto,
kein Umbau. Einen Merchant of Record bräuchten wir erst, wenn wir je an
Verbraucher verkaufen sollten.

**Was ich von dir brauche**

Das Stripe-Konto muss auf die I²D UG laufen, und anlegen kann es nur der
Geschäftsführer:

1. Stripe-Konto unter stripe.com für die I²D UG anlegen (Handelsregister,
   USt-IdNr., Geschäftskonto für Auszahlungen, Ausweis des Geschäftsführers —
   die Verifikation dauert meist ein bis zwei Tage). Mir dann Zugriff als
   Entwickler geben; ich brauche keine Auszahlungsrechte.
2. **Gläubiger-Identifikationsnummer** bei der Bundesbank beantragen
   (kostenlos, online, wenige Tage). Ohne sie können wir keine
   SEPA-Lastschriften einziehen.
3. Im Stripe-Konto SEPA-Lastschrift, Karten und Überweisungen freischalten
   (mache ich mit dir zusammen, dauert eine halbe Stunde).
4. Für die Rechtstexte: Die Datenschutzerklärung nennt dann Stripe als
   Auftragsverarbeiter für Zahlungsdaten, und § 6 der AGB bekommt die
   Lastschrift-Vorabankündigung. Beides sollte in die anwaltliche Prüfung mit
   hinein, die ohnehin ansteht.

Sobald das Konto steht, brauche ich für die Einbindung grob vier Tage:
Zahlungsmittel bei der Registrierung und auf der Konto-Seite, Monatslauf mit
Rechnung (gleich als ZUGFeRD, damit 2028 nichts umgebaut wird) und Einzug,
Webhooks für bezahlt/fehlgeschlagen, Rechnungs-Download im Portal.

Die vollständige Gegenüberstellung mit allen Zahlen und Quellen schicke ich
dir gern als Datei mit, falls du tiefer einsteigen willst. Wenn du mit dem
Weg einverstanden bist, leg das Konto an — dann fange ich an.

Viele Grüße
Oliver
