# Mail an Bernd — Stripe: vier Punkte bis zum Live-Betrieb (15.11.2026)

Entwurf. Hintergrund und Stand des Live-Kontos:
[2026-11-15_Stripe-Live-Vorbereitung.md](2026-11-15_Stripe-Live-Vorbereitung.md).

---

**Betreff:** Stripe: vier Punkte bis zum Live-Betrieb

Hallo Bernd,

danke für den Zugang, das Stripe-Konto ist verifiziert, und Kartenzahlungen
wären schon möglich. Ich habe heute die Steuer-Registrierung für Deutschland
angelegt und die Zahlungsarten aufgeräumt (Klarna, Pix und Ähnliches sind
aus). RoSe läuft bis auf Weiteres noch gegen die Testumgebung, es wird also
nichts belastet.

Damit wir umschalten können, brauche ich von dir noch vier Dinge:

**1. Verifizierung ergänzen (das Wichtigste)**
Stripe verlangt für Banküberweisung und SEPA-Lastschrift noch drei Angaben,
die nur du machen kannst:

- Gründungsdatum der UG (Tag der Eintragung)
- deine persönliche Steuer-Identifikationsnummer
- die Bestätigung, dass alle Geschäftsführer angegeben sind

Du findest das im Dashboard unter Einstellungen (Zahnrad) → Unternehmen →
Kontodetails; Stripe zeigt dort an, was fehlt. Ohne diese Angaben können
Kunden nur per Karte zahlen, und Rechnungen an Kunden ohne hinterlegte Karte
würden scheitern.

**2. Firmenname**
Bei Stripe steht „Internetinformationsdienste UG“, im Impressum und in den
AGB „I²D UG (haftungsbeschränkt)“. Auf den Rechnungen sollte der Name aus dem
Handelsregister stehen, und überall derselbe. Sag mir bitte, welcher gilt.
Dann passe ich die Seite an, oder du korrigierst den Namen bei Stripe.

**3. Offene Testrechnung stornieren**
Im Live-Konto liegt eine offene Rechnung über 5,00 € an den Kunden
„Bernd KÖHL“ vom 28.10. (Nr. AYGX4AHF-0001). Das ist formal eine echte
Forderung. Bitte unter Abrechnung → Rechnungen öffnen und stornieren.

**4. Einen Schritt bitte nicht anklicken**
Im Leitfaden rechts unten steht „Ihre Integrationsauswahl bestätigen“.
Dahinter steckt ein Vertrag für Plattformen, die Zahlungen für Dritte
einziehen (Stripe Connect). Das ist RoSe nicht, und die Zustimmung brächte
nur zusätzliche Prüfpflichten. Auch „Abonnements“, „Checkout“ und
„Kundenportal“ im Leitfaden brauchen wir nicht: RoSe legt die Monatsrechnung
selbst an, weil die Zimmerzahl jeden Monat neu gezählt wird.

**Was ich danach mache**
Sobald Punkt 1 durch ist (Stripe prüft meist innerhalb eines Tages), schalte
ich Banküberweisung und SEPA-Lastschrift frei, trage die Support-Adresse ein
und stelle die Rechnungsnummern auf das Präfix „RS“ um. Dann verbinde ich
RoSe mit dem Live-Konto, damit Stripe Zahlungseingänge an RoSe zurückmeldet,
und tausche die Zugangsschlüssel in der Produktionsumgebung. Ab diesem Moment
entstehen am Monatsersten echte Rechnungen. Die bisherigen Testkonten
bekommen dabei neue Kundeneinträge und müssten ihren Zahlungsweg neu
hinterlegen; da es noch keine echten Kunden gibt, hat das keine Folgen.

Gib mir kurz Bescheid, wenn Punkt 1 erledigt ist.

Viele Grüße
Oliver
