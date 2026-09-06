# 06.09.2026 (Nachmittag) — Stripe Schritt 1: Freimonat, Rechnungsdaten, Zahlungsweg

Bauplan: [Stripe-Plan-2026-09-06.md](Stripe-Plan-2026-09-06.md) (Fassung 2,
Stripe Invoicing + Stripe Tax). Einrichtung der Sandbox:
[Stripe-Einrichtung-Testkonto-2026-09-06.md](Stripe-Einrichtung-Testkonto-2026-09-06.md).
Commits `2a6d5a4` (Schritt 1) und `eed4d17` (Migration ins Archiv), in
Produktion, lokal und in Produktion verifiziert.

## Vorab: Entscheidungen des Users am Mittag

- **Stripe Invoicing + Stripe Tax** statt eigener Rechnung — alle Zahlungen
  über einen Kanal, Übersicht im Stripe-Dashboard, Steuer von Stripe. Die
  E-Rechnungspflicht 2028 bleibt als eigener Baustein (Plan, Abschnitt 9).
- **Freimonat** = Registrierungsmonat plus erster voller Kalendermonat. Die
  Landing Page versprach „erster Monat frei", die Regel gab dem, der am 27.
  registrierte, vier Tage.
- **Rechnung am 1. für den Vormonat** (nicht am Monatsletzten für den
  laufenden): Monat ist zu, Snapshot steht, Zeitzone unkritisch, Leistungs-
  zeitraum eindeutig.
- **Kein neues Stripe-Konto nötig.** Der Registrierungsversuch scheiterte an
  der Zwei-Faktor-Anmeldung; in `.env.local` lag aber bereits eine gültige
  Sandbox („GoodMood Studio Sandbox", `goodmood.development@gmail.com`,
  `acct_1UChWKFnKa5mCIAy`). Schlüssel per `printf | vercel env add` aus
  `.env.local` nach Vercel übertragen, ohne dass sie durch den Chat liefen.
- **Sandbox per API konfiguriert** (Dashboard nicht nötig): Zahlungsmethoden
  Karte/SEPA/Banküberweisung an, **Link aus** (die „Meine Daten speichern"-
  Box im Payment Element), Stripe Tax mit Hauptsitz Saarbrücken,
  Standard-Steuercode `txcd_10103001` (SaaS business use), Steuerverhalten
  exklusiv, Steuer-Registrierung DE aktiv (`taxreg_1UChrsFnKa5mCIAytsRK1Oi1`).
  Fallstrick: Umlaute in `curl -d` aus der Git-Bash kommen falsch kodiert an
  („Invalid request"), mit Python/urllib klappt es.

## Was gebaut wurde

1. **Freimonat-Regel** in [pricing.ts](../src/lib/pricing.ts): `isFreePeriod`
   und `lastFreePeriodStart` nehmen die Zeitzone (Default Europe/Berlin) —
   der Registrierungstag wird in Ortszeit bestimmt, sonst wäre eine
   Registrierung am 1. um 00:30 noch „am 31." (Test deckt genau das ab).
   `FREE_MONTHS` entfällt. Texte: AGB § 6 Abs. 3, Landing (Hero, Preis-Pille,
   FAQ, CTA), OG-Bild, Nutzenrechner, Registrierungsformular, Konto-Seite
   („frei bis Ende Oktober 2026"), `/admin` („Freimonat").
2. **Migration** `2026-09-06_stripe_und_rechnungen.sql` (eingespielt, im
   Archiv): `accounts.stripe_customer_id/payment_method_kind/
   stripe_payment_method/payment_method_label/billing_name/billing_address/
   vat_id/vat_id_status`; `invoices` (Spiegel der Stripe-Rechnungen, **ohne
   Fremdschlüssel** wie `billing_snapshots`, Unique `account_id,
   period_start`, RLS SELECT für Kontomitglieder); `stripe_events`
   (Webhook-Idempotenz, keine Policies).
3. **[stripe.ts](../src/utils/stripe.ts)**: `stripeReady()` nach dem
   `mailReady`-Muster; `ensureStripeCustomer` prüft, ob die gespeicherte ID
   im aktuellen Stripe-Konto existiert (Sandbox → Live), sonst neu;
   `syncCustomerBillingDetails` schreibt Name/Adresse an den Kunden und
   gleicht die `eu_vat`-Tax-ID ab (Stripe prüft gegen VIES, Status
   `pending` bis der Webhook aus Schritt 2 ihn setzt);
   `savePaymentMethodFromSetupIntent` prüft, dass der SetupIntent zum Kunden
   DIESES Kontos gehört (die ID kommt aus dem Browser), löst das alte
   Zahlungsmittel und setzt `invoice_settings.default_payment_method`;
   `chooseBankTransfer`, `detachStoredPaymentMethod`, `deleteStripeCustomer`.
4. **[vat.ts](../src/lib/vat.ts)** (I/O-frei, 11 Tests): EU-Liste, Präfix je
   Land (GR → EL), Normalisierung, Formatprüfung, `validateBillingDetails`
   (USt-IdNr. Pflicht in der EU außer DE, verboten außerhalb), Länder-Codes
   (Namen über `Intl.DisplayNames('de')`).
5. **Seite `/admin/abrechnung/zahlungsweg`** (nur Inhaber; ohne Stripe-Keys
   Redirect): Rechnungsdaten-Formular und Zahlungsweg-Kasten mit Payment
   Element (SetupIntent `card`+`sepa_debit`, `usage: off_session`,
   `confirmSetup` mit `redirect: 'if_required'`; Return-URL-Pfad
   `?setup_intent=…&redirect_status=succeeded` wird serverseitig
   verarbeitet), Überweisung auf Rechnung, Entfernen. Mit `?neu=<slug>`
   „Schritt 2 von 2" und Wege ins Zimmer-Setup. Dark-Mode über Appearance
   `night`.
6. **Konto-Seite**: Karte „Zahlungsverfahren" zeigt Zahlungsweg und
   Rechnungsdaten mit „Ändern"; Hinweiskasten sagt jetzt „in Vorbereitung".
   **`/admin`**: Banner „Noch kein Zahlungsweg hinterlegt" mit Link, solange
   keiner gesetzt ist.
7. **Registrierung**: legt den Stripe-Kunden an (nicht fatal) und leitet nach
   `/admin/abrechnung/zahlungsweg?neu=<slug>` statt direkt ins Zimmer-Setup.
   **Kontolöschung**: `customers.del` vor dem Löschen der `accounts`-Zeile.
8. ESLint ignoriert `Verträge/**` (dort liegt das docx-Build-Skript).

## Verifikation

**Lokal** (Testkonto `zz-stripe-test@rose.local` / `StripeTest2026!`, Konto
„Stripe-Testhaus", Slug `stripe-testhaus`, Stripe-Kunde
`cus_VD8bp3XKnf64S5` — bleibt für Schritt 2 stehen): Registrierung → Zahlungs-
schritt mit Slug ✓ · Stripe-Kunde beim Signup angelegt ✓ · Rechnungsdaten
gespeichert, am Stripe-Kunden Adresse + Tax-ID `DE123456789` (`pending`) ✓
· Return-URL-Pfad mit per API bestätigtem SetupIntent (`pm_card_visa`):
Karte gespeichert, Default am Kunden, Seite zeigt „Visa •••• 4242" ✓ ·
Überweisung gewählt → Karte bei Stripe gelöst (`payment_methods` leer) ✓ ·
Entfernen → Felder leer, Banner auf `/admin` ✓ · Konto-Seite: Karte mit
Rechnungsdaten, „frei bis Ende Oktober 2026" ✓ · Payment Element rendert im
Dark-Mode mit Tabs Karte/SEPA ✓.

**Produktion** (nach Deploy): Login mit dem Testkonto, Banner auf `/admin`,
Zahlungsweg-Seite lädt das Payment Element (4 Stripe-Frames), Überweisung
wählen und entfernen ✓; Landing und AGB tragen die neue Freimonat-Formulierung ✓.

**Nicht geprüft — Eingabe in die Stripe-Felder:** Die Vorschau-Browser-
Werkzeuge bekommen keine Tastatureingaben in die Stripe-iframes hinein
(Klick landet, Zeichen kommen nicht an), die Chrome-Erweiterung war nicht
verbunden. Der Weg `confirmSetup` → `confirmPaymentMethodAction` ist damit
nur bis zum Server nachgewiesen (über den Return-URL-Pfad). **Einmal von
Hand:** in Produktion Testkarte `4242 4242 4242 4242` und Test-IBAN
`DE89 3704 0044 0532 0130 00` über die Oberfläche hinterlegen (GUI-Katalog,
C+M).

## Befunde am Rand

- Der Mandatstext im Payment Element nennt „GoodMood Studio Sandbox" — das
  ist der Unternehmensname aus den öffentlichen Unternehmensinformationen
  der Sandbox (Anleitung Abschnitt 4, Dashboard).
- Screenshots der Vorschau frieren nach dem Scrollen ein; Text und Datenbank
  per JS/PostgREST sind verlässlicher. Mit `resize_window 1280×900` sind
  Klicks in Stripe-iframes unmöglich („frame owner is CSS-transformed"),
  ohne Emulation ist die Koordinatenebene 1:1.

## 🔖 Wiederaufnahme

Schritt 2 des Bauplans: `invoicing.ts` (Monatslauf → Stripe-Rechnung mit
einer Position, `automatic_tax`, `charge_automatically` bzw. `send_invoice`
+ `customer_balance`), Webhook `/api/stripe/webhook` (Endpunkt im Dashboard,
`STRIPE_WEBHOOK_SECRET`), Cron `/api/billing/run` (`CRON_SECRET`), Karte
„Rechnungen", `/admin`-Kurzkasten, Integrationstest mit `InvoiceGateway`-
Fake. Vorher im Dashboard: Abschnitte 4, 7, 8 der Einrichtungsanleitung
(Unternehmensname, Rechnungsnummern-Präfix `RS`, Fußzeile, Steuer-ID,
Erinnerungen, Kunden-Mails). Testkonto „Stripe-Testhaus" steht bereit.
