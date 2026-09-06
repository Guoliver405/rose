**Betreff:** RoSe – Stripe läuft im Testbetrieb, was wir für die I²D brauchen

Hallo Bernd,

kurzer Stand zur Abrechnung: Stripe ist komplett in RoSe eingebaut und läuft seit heute im Testbetrieb über eine Sandbox auf meinem Konto. Es wird nichts real belastet, die Oberfläche sagt das auch. Sobald dein Stripe-Konto für die I²D steht, ziehen wir um.

**Was eingerichtet ist**

- Jeder Kunde hinterlegt bei der Registrierung Rechnungsdaten (Firma, Anschrift, Land, USt-IdNr.) und einen Zahlungsweg: Karte, SEPA-Lastschrift oder Überweisung. Der Schritt lässt sich überspringen, die Übersicht erinnert dann.
- Am 1. jeden Monats erzeugt RoSe automatisch je Kunde eine Stripe-Rechnung für den Vormonat: eine Position, Zimmerzahl mal 0,50 €, mindestens 5 €. Stripe rechnet die Steuer (19 % Deutschland, Reverse Charge für EU-Firmen mit USt-IdNr., steuerfrei für Drittländer), verschickt die Rechnung mit PDF und Zahlungsseite, zieht Karte oder Lastschrift ein und erinnert bei Nichtzahlung. Bei Überweisung steht eine Stripe-Bankverbindung auf der Rechnung, der Eingang wird automatisch zugeordnet. Kein Abgleich auf dem Firmenkonto nötig.
- Der Freimonat ist jetzt der Registrierungsmonat plus der erste volle Kalendermonat, also immer mindestens ein voller Monat. Die Rechtstexte (AGB, Datenschutz) sind entsprechend angepasst.
- Deine Übersicht ist das Stripe-Dashboard: alle Rechnungen mit Status offen, überfällig, bezahlt, dazu Steuerbericht und DATEV-Export. Die Kunden sehen ihre Rechnungen in RoSe unter „Plan & Abrechnung".

**Was getestet ist**

- Zwei Testkonten mit zurückdatierten Zimmern. Der Monatslauf hat für beide eine Rechnung erzeugt, mit korrekter Steuer und Fußzeile mit den I²D-Daten.
- Überweisung: simulierter Zahlungseingang, von Stripe automatisch zugeordnet, Rechnung auf „bezahlt".
- Karte: sofortiger Einzug, Rechnung auf „bezahlt".
- SEPA-Lastschrift: Mandat hinterlegt, der Einzug läuft mit dem nächsten Monatslauf am 1. Oktober.
- Webhooks von Stripe kommen in Produktion an, der Rechnungsstatus wird gespiegelt.

**Was wir von dir für den Umzug auf die I²D brauchen**

1. Stripe-Konto für die I²D UG anlegen und verifizieren (Unternehmensdaten, Registerauszug, Bankkonto für Auszahlungen). Das ist der Teil, den nur du machen kannst.
2. SEPA-Lastschrift und Banküberweisung als Zahlungsmethoden aktivieren. Für Lastschrift beantragt Stripe die Gläubiger-ID mit.
3. Stripe Tax einschalten: Hauptsitz Saarbrücken, Steuer-Registrierung Deutschland mit USt-IdNr. DE434570609, Standard-Steuercode „Software as a service – business use".
4. Rechnungseinstellungen: Nummernkreis mit Präfix RS, Zahlungsziel 14 Tage, Fußzeile mit Firmendaten, USt-IdNr. als Steuer-ID auf der Rechnung.
5. Kunden-Mails einschalten: Rechnungsversand, Erinnerungen bei Nichtzahlung, Belege, Zahlungsanweisungen für Überweisungen.
6. Öffentliche Unternehmensinformationen: Name „RoSe – RoomService", Support-Adresse, Website, Zahlungsbeschreibung „ROSE ROOMSERVICE" für den Kontoauszug der Kunden.
7. Mir dann die beiden Live-Schlüssel (Secret Key und Publishable Key) sicher zukommen lassen, nicht per Mail im Klartext. Alternativ lädst du mich als Entwickler in dein Stripe-Konto ein, dann hole ich sie selbst und richte auch den Webhook ein.

Eine ausführliche Anleitung mit Menüpfaden habe ich; die schicke ich dir, sobald das Konto steht. Der Umzug selbst ist danach eine Sache von einer Stunde.

Viele Grüße
Oliver
