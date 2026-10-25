# Affiliate-Programm – Notizen (26.10.2026)

Stand: **Planung**, nichts gebaut. Mit Bernd besprochen.

## Entschieden (User, 26.10.)

- **20 % dauerhaft** auf den vermittelten Umsatz, ohne Befristung. Begründung: Der Preis ist niedrig, die Provision lohnt sich nur über die Laufzeit. Sie bindet Vermittler und Kunden, und der Vermittler hat ein eigenes Interesse daran, den Kunden zu halten. „Solange 80 % bei uns bleiben, geben wir ein Fünftel gern ab.“
- **Affiliate-Programm als Hauptweg in Marketing und Vertrieb.** Kein eigenes Vertriebsteam, wenig Investition, schnelle Marktdurchdringung, bevor die Idee kopiert wird.
- **Zielgruppen:** zufriedene Kunden und engagierte Vermittler, ausdrücklich auch in Ländern mit niedrigem Lohnniveau (Beispiel Mexiko), dazu Social Media, Content Creator und Influencer.

## Architektur-Skizze (aus dem Gespräch)

- **Grundlage ist die bezahlte Rechnung**, nicht die Zimmerzahl: 20 % vom bezahlten Nettobetrag. Mindestbetrag (5 € ⇒ 1 €) und Freimonat (0 €) laufen damit richtig mit. Der Webhook `invoice.paid` schreibt je Rechnung eine Zeile in ein Provisionsbuch (`affiliate_commissions`, ohne Fremdschlüssel wie `invoices`). Erstattungen und Rückbuchungen ziehen die Provision zurück.
- **Zuordnung ohne Cookie**, sonst wäre ein Cookie-Banner nötig: Der Link `/registrieren?ref=…` füllt „Empfohlen von“ vor, `createHotelAccount` schreibt `accounts.referred_by`. Damit ist die Umwandlung aus dem Simulator mit abgedeckt.
- **Wer Partner sein kann:** jedes Konto, also Inhaber, Manager, Rezeption, Reinigung und Simulator-Konten. Das Personal ist ausdrücklich gemeint, weil es in der Hotellerie oft den Arbeitgeber wechselt.
- **Missbrauch:** keine Selbstwerbung (gleiches Konto, gleicher Auth-Nutzer, gleicher Fingerabdruck des Zahlungsmittels); Haltefrist vor der Auszahlung (SEPA-Rückbuchung bis 8 Wochen); Mindestbetrag für die Auszahlung.
- **Partnerbereich:** Link, QR-Code, Flyer aus den vorhandenen Druckblättern, geworbene Häuser, Zimmer, Provision, Auszahlungen. Dem Partner nur Zahlen zeigen, keine Hotelnamen ohne Zustimmung.
- **Simulator als Verkaufswerkzeug:** Der Vermittler rechnet das Haus durch und teilt das Szenario per Link; die Registrierung daraus ordnet es ihm zu. Teilbare Ergebnisse (Bild für Social Media) liefern Creatorn fertigen Inhalt.
- **Partnerbedingungen:** Influencer müssen Werbung kennzeichnen.
- **Weitere Wege ohne Budget:** Zertifizierer und Umweltsiegel (Green Key u. a.) als Multiplikatoren für „Reinigung auf Wunsch“; eine Registrierung, die ohne Menschen zum Abschluss führt (Blindtest).

## Auszahlung – Recherche (26.10.2026)

### Stripe Connect (grenzüberschreitend)

Eine Plattform im EWR kann **nur an verbundene Konten in den USA, UK, EWR, Kanada und der Schweiz** auszahlen. Andere Länder gehen über Connect nicht, auch Mexiko nicht. [Stripe-Doku](https://docs.stripe.com/connect/cross-border-payouts)
Vorteil: Stripe übernimmt Identitätsprüfung und Compliance, der Partner verwaltet seine Bankdaten selbst.

### Stripe Global Payouts

- Auszahlung direkt auf ein Bankkonto, nur mit E-Mail, Name und gegebenenfalls Anschrift des Empfängers. Stripe nennt Affiliate-Auszahlungen ausdrücklich als Anwendungsfall.
- **Absender:** allgemein verfügbar nur für Unternehmen in den USA und UK. **Deutschland ist in der Private Preview**, Zugang auf Anfrage. Setzt Stripe Treasury voraus. [Stripe-Doku](https://docs.stripe.com/global-payouts)
- **Empfänger:** rund 100 Länder per Bank, darunter **Mexiko, Peru, Costa Rica, Dominikanische Republik, Indien, Indonesien, Philippinen, Vietnam, Thailand, Malaysia, Pakistan, Sri Lanka, Ägypten, Marokko, Tunesien, Kenia, Tansania, Ruanda, Senegal, Elfenbeinküste, Südafrika, Türkei**, ganz Europa, USA, Kanada, Australien. [Empfängerliste](https://docs.stripe.com/global-payouts/recipient-requirements)
- **Fehlen** u. a. Brasilien, Argentinien, Chile, Kolumbien, Nigeria, Ghana, Bangladesch und China.
- Stablecoin-Auszahlungen (USDC) in über 160 Länder gibt es bisher nur für Absender in den USA.
- Achtung: Bei Global Payouts liegt die Compliance bei uns selbst, laut Stripe kann je nach Ausgestaltung eine Lizenz nötig sein. Für das Auszahlen eigener Provisionen (kein fremdes Geld) dürfte das nicht greifen – mit dem Steuerberater bzw. Stripe klären.

### Andere Wege

- **PayPal Payouts:** Massenauszahlung per API an eine E-Mail-Adresse. Abdeckung laut PayPal je nach Seite 96 bzw. über 156 Länder; Einschränkungen u. a. für Brasilien, Argentinien, Malaysia (Währung), Kolumbien (nur grenzüberschreitend). Für Partner ohne Bankverbindung, die PayPal ohnehin nutzen, der breiteste Rückfall. [PayPal-FAQ](https://developer.paypal.com/payouts/faqs), [Länder](https://docs.paypal.ai/payouts/reference/countries-supported-features)
- **Wise Business:** Sammelüberweisung bis 1.000 Empfänger per Datei, Batch-Werkzeug kostenlos, Auszahlung in lokaler Währung; Wechselkurs nahe am Mittelkurs. API vorhanden. Genaue Länderzahl nicht ermittelt. [Wise Batch](https://wise.com/gb/blog/send-batch-payments), [Wise Payouts](https://wise.com/payouts/)
- **Fertige Affiliate-Software** (Rewardful, FirstPromoter, PartnerStack): Tracking und Auszahlung (PayPal, Wise, Stripe) aus einer Hand, ab etwa 49 $/Monat, teils mit Prozent auf die Auszahlung. Arbeiten mit Tracking-Cookies – das widerspricht „kein Cookie-Banner“. Eher nicht. [Vergleich FirstPromoter](https://firstpromoter.com/blog/rewardful-alternatives), [PartnerStack Payouts](https://partnerstack.com/payouts)

### Vorschlag: Auszahlungsweg je Partner, Provisionsbuch bei uns

Wie beim Zahlungsweg der Kunden (`payment_method_kind`) wählt der Partner seinen **Auszahlungsweg**; das Provisionsbuch bleibt in RoSe, der Anbieter steckt hinter einer Schnittstelle (Muster `InvoiceGateway`).

1. **Guthaben** – für Partner, die selbst Kunde sind. Verrechnung mit der eigenen Rechnung (Stripe Customer Balance). Keine Auszahlung, keine Gebühr, weltweit.
2. **Stripe Connect** – USA, UK, EWR, Kanada, Schweiz.
3. **Stripe Global Payouts** – sobald die Private Preview für Deutschland freigegeben ist; deckt viele Zielländer mit niedrigem Lohnniveau ab (Mexiko, Indien, Philippinen …).
4. **PayPal Payouts** – breiter Rückfall für alle übrigen Länder (u. a. Brasilien, Kolumbien, Nigeria).
5. Optional **Wise** für Länder, in denen PayPal schwach ist; am Anfang auch von Hand per Sammeldatei einmal im Monat.

Monatslauf: Provisionen nach Haltefrist freigeben, je Partner summieren, ab Mindestbetrag über seinen Weg auszahlen, Ergebnis ins Buch. Kleinbeträge (10 Cent je Zimmer) nur gesammelt auszahlen, sonst fressen die Gebühren die Provision.

## Offen

- Zugang zur Private Preview von Stripe Global Payouts für Deutschland anfragen (kostet nichts, klärt Weg 3).
- Steuer: Gutschrift (§ 14 Abs. 2 UStG), Reverse Charge bei ausländischen Unternehmern, Behandlung privater Partner – Steuerberater.
- Höhe von Haltefrist und Mindestauszahlung; Startbonus oder Staffel (im Gespräch vorgeschlagen, nicht entschieden).
- Partnerbedingungen (Vertrag, Kennzeichnung, Kündigung, Verhalten bei Missbrauch).
