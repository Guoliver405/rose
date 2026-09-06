# 06.09.2026 (Abend) — Stripe Schritt 2: Monatslauf, Stripe-Rechnung, Webhook, Cron

Bauplan: [Stripe-Plan-2026-09-06.md](Stripe-Plan-2026-09-06.md), Schritt 1:
[2026-09-06_Stripe-Schritt-1.md](2026-09-06_Stripe-Schritt-1.md). Commits
`d0d5218` (Schritt 2) und `f40f35b` (Testbetrieb-Hinweis), in Produktion;
lokal, im Integrationstest und in Produktion verifiziert.

## Was gebaut wurde

1. **[invoice.ts](../src/lib/invoice.ts)** (I/O-frei, 10 Tests): Vormonat
   (`previousMonthPeriod`), Positionstext („RoSe – Nutzung im August 2026:
   3 Zimmer (Mindestbetrag 5,00 € je Monat)"), Memo mit Leistungszeitraum,
   Fußzeile aus `provider.ts` (Firma, Geschäftsführer, HRB, USt-IdNr.,
   Zahlungsziel), Idempotenzschlüssel `invoice-<konto>-<periode>`,
   Stripe-Status → Spiegel-Status, Überfälligkeit. Fallstrick beim Test:
   `formatCents` setzt ein geschütztes Leerzeichen vor das €-Zeichen — die
   Erwartung muss `formatCents` selbst nehmen, nicht den getippten String.
2. **[invoicing.ts](../src/utils/invoicing.ts)**: `runMonthlyInvoicing` je
   Konto: `ensureBillingSnapshots` (Vormonat festschreiben) → Zimmer aus den
   Snapshots → `billingLine` → 0 € ⇒ keine Rechnung → Spiegel-Zeile in
   `invoices` (Unique `account_id, period_start` als Riegel; Unique-Verletzung
   = paralleler Lauf war schneller) → fehlen Stripe-Kunde oder Rechnungsdaten,
   bleibt die Zeile `draft` mit `last_error` und wird beim nächsten Lauf
   erneut versucht → sonst `InvoiceGateway.createInvoice`. Danach Abgleich
   aller offenen Spiegel-Zeilen gegen Stripe (Sicherheitsnetz für verpasste
   Webhooks). Das Gateway ist austauschbar; `accountIds` grenzt den Lauf ein.
   **`stripeGateway`**: `invoices.create` (`automatic_tax`, `footer`, Memo,
   `custom_fields` Leistungszeitraum, A4, Metadaten mit Konto/Periode/
   Spiegel-ID; Karte/Lastschrift ⇒ `charge_automatically`, Überweisung oder
   kein Zahlungsweg ⇒ `send_invoice` mit 14 Tagen und
   `customer_balance`/`eu_bank_transfer` DE + Karte + SEPA auf der
   Zahlungsseite), `invoiceItems.create` mit `amount`, `tax_behavior:
   exclusive`, `tax_code` SaaS, `finalizeInvoice`, bei Einzug sofort
   `invoices.pay` (Fehlschlag lässt die Rechnung offen, Stripe wiederholt).
   Idempotency-Keys auf Rechnung und Position.
3. **`/api/billing/run`** (GET, `Authorization: Bearer CRON_SECRET`; ohne
   Variable 503, falsch 401) und **Vercel Cron** `0 4 1 * *` in vercel.json.
   Zusätzlich zieht `/admin` und die Konto-Seite den Lauf des eigenen Kontos
   nach (`ensureInvoicesForAccount`, idempotent) — der Cron ist Komfort.
4. **`/api/stripe/webhook`** (POST): Signaturprüfung mit
   `STRIPE_WEBHOOK_SECRET`, Idempotenz über `stripe_events` (PK-Verletzung =
   Duplikat), Ereignisse `invoice.finalized/paid/payment_failed/
   marked_uncollectible/voided/updated` (Spiegel-Zeile; unbekannte Rechnung
   mit Konto/Periode in den Metadaten wird angelegt), `setup_intent.succeeded`,
   `payment_method.detached`, `customer.tax_id.created/updated`
   (`vat_id_status`). Antwort 200, sobald angenommen — Verarbeitungsfehler
   ins Log, sonst käme das Ereignis drei Tage lang wieder.
5. **Konto-Seite**: Karte „Rechnungen" (Monat, Nummer, Brutto, Status-Pille
   mit Überfälligkeit, Fälligkeit, PDF, „Ansehen / bezahlen" auf die
   Stripe-Seite, Fehlergrund bei `draft`); die Monatstabelle zeigt statt
   „nicht berechnet" den Rechnungsstatus. **`/admin`**: rotes Banner bei
   überfälliger, nicht einbringlicher oder nicht stellbarer Rechnung.
   **Hinweiskasten**: bei `sk_test_`-Schlüssel „Testbetrieb — es wird nichts
   belastet" (`stripeTestMode()`), im Live-Betrieb kein Kasten mehr.
6. **[invoicing.test.ts](../tests/integration/invoicing.test.ts)** gegen die
   Testwelt mit Fake-Gateway: Registrierung, Häuser **und Zimmer** drei Monate
   zurückdatiert (Snapshots entstehen nur für abgeschlossene Monate seit
   Anlage des Hauses — ohne das Zurückdatieren der Häuser war die Zimmerzahl 0);
   Alpha mit Karte ⇒ `charge`, Mindestbetrag, Snapshot 3 Zimmer; Beta ohne
   Rechnungsdaten ⇒ `draft` mit Grund, nach Nachtragen ⇒ `bank_transfer`;
   zweiter Lauf erzeugt nichts; Abgleich setzt `paid`. Räumt `invoices` und
   `billing_snapshots` der Welt selbst ab (keine Fremdschlüssel).

## Verifikation

- **Lokal**: Testkonto „Stripe-Testhaus" auf 15.06.2026 zurückdatiert, drei
  Zimmer mit `created_at` 01.07.2026 angelegt. `curl` auf
  `/api/billing/run` mit Secret → `created: 1`; ohne Secret 401. Bei Stripe:
  Rechnung `WVL2WRJW-0001`, Position „3 Zimmer (Mindestbetrag 5,00 €)",
  Stripe Tax 19 % = 0,95 €, brutto 5,95 €, `send_invoice`, 14 Tage,
  Zahlwege customer_balance/sepa_debit/card, `automatic_tax: complete`,
  Fußzeile und Leistungszeitraum gesetzt. Snapshots Juni/Juli/August
  geschrieben. Überweisung per Test-Helper `fund_cash_balance` (595 Cent,
  Referenz = Rechnungsnummer) → Stripe hat die Rechnung automatisch auf
  `paid` gesetzt; der Abgleich beim nächsten Seitenaufruf übernahm es:
  Karte „Rechnungen" zeigt „bezahlt", PDF, Ansehen; Monatstabelle „bezahlt".
- **Produktion**: Cron-Route liefert `skipped: 4` (Rechnung existiert),
  401 ohne Secret; Webhook-Endpunkt **per API angelegt**
  (`we_1UCkgcFnKa5mCIAylVweTuY9`, zehn Ereignisse, Secret nach `.env.local`
  und Vercel) — ein `invoice.updated` (Metadaten-Touch) kam an:
  `stripe_events` trägt `evt_1UCkl4FnKa5mCIAy2zYzkHrY`. Konto-Seite zeigt
  Testbetrieb-Hinweis und die bezahlte Rechnung.
- **Unit** 219 grün, Integration `invoicing.test.ts` 3/3, typecheck + lint.

## Offen / Befunde

- **Rechnungsnummern-Präfix** ist Stripe-Vorgabe (`WVL2WRJW-…`) — nur im
  Dashboard änderbar, dort an der Verifizierung hängend; im UG-Live-Konto
  auf `RS` setzen (Einrichtungsanleitung, Abschnitt 7).
- **Nicht durchgespielt:** Einzug per Karte/Lastschrift (`charge_automatically`
  + `invoices.pay`) — das Testkonto hatte beim Lauf keinen Zahlungsweg, und je
  Konto und Periode gibt es genau eine Rechnung. Der Codepfad ist
  ausschließlich Stripe-Aufrufe ohne eigene Logik; Nachweis beim nächsten
  Monatslauf (1.10.) am Testkonto mit hinterlegter Testkarte, oder vorher mit
  einem zweiten zurückdatierten Testkonto. **Nachtrag:** Testkarte `Visa
  •••• 4242` ist am Testkonto hinterlegt (SetupIntent per API, Speicherung
  über den Return-URL-Pfad in Produktion, Default am Stripe-Kunden) — der
  Lauf am 1.10. für September (3 Zimmer, 5,95 €) sollte `charge_automatically`
  + `invoices.pay` zeigen; Ergebnis in `invoices` und im Stripe-Dashboard
  prüfen.
- **Stripe-Mails** aus der Sandbox gehen nur an Adressen des Stripe-Kontos;
  das Testkonto hat `zz-stripe-test@rose.local`, es kam also keine Mail.
- **Schritt 3** (Rechtstexte, Übergabe an das UG-Konto) steht aus; AGB § 6
  Abs. 4 beschreibt noch „solange kein Zahlungsverfahren eingerichtet ist,
  stellt der Anbieter keine Rechnung".

## Schritt 3 — Rechtstexte (06.09., spät, Commit `4c15154`)

- **Datenschutz Abschnitt 6** heißt jetzt „Rechnungen und Zahlungsdaten":
  Stripe Payments Europe, Ltd. (Dublin) mit Anschrift; was Stripe erhält
  (Rechnungsdaten, Inhaber-Mail, Rechnungen, Zahlungsstatus; Karte/IBAN nur
  in Stripe-Formularen, RoSe speichert nur Kennung und letzte Ziffern), was
  Stripe tut (Rechnungen, Einzug, Erinnerungen, Steuer nach Land und
  USt-IdNr. mit VIES, Betrugs-/Geldwäscheprävention als eigener
  Verantwortlicher), Rechtsgrundlage Art. 6 Abs. 1 lit. b und c, zehn Jahre
  Aufbewahrung (§ 147 AO, § 14b UStG), Rechnungen überleben die
  Kontolöschung, der Stripe-Kunde nicht. Abschnitt 4: Stripes Cookies
  `__stripe_mid`/`__stripe_sid` auf der Zahlungsweg-Seite als technisch
  notwendig. Abschnitt 7: Stripe in Irland, Weitergabe an Stripe, Inc. (USA)
  unter SCC/DPF; Stripe handelt als eigener Verantwortlicher.
- **Bewusst nicht** in § 8 AGB (Unterauftragsverarbeiter) und nicht in die
  AVV-Liste: Stripe verarbeitet die Daten des **Kunden** (Firma, Inhaber),
  nicht die Gäste- und Personaldaten, die das Hotel in RoSe verarbeitet.
  Für diese Daten ist der Anbieter Auftragsverarbeiter, für die Abrechnung
  Verantwortlicher — zwei Rollen, wie Abschnitt 2 der Erklärung sie trennt.
- **AGB § 6 Abs. 4** neu: Rechnung am 1. des Folgemonats über den
  Zahlungsdienstleister, elektronisch (Mail mit PDF und Zahlungsseite, im
  Konto), Rechnungsdaten als Pflicht des Kunden, Umsatzsteuer nach diesen
  Angaben. **Abs. 4a** neu: Einzug mit Rechnungsstellung bei hinterlegter
  Karte/Lastschrift (Vorabankündigung durch Stripe), sonst 14 Tage per
  Überweisung oder Zahlungsseite; fehlgeschlagener Einzug wird wiederholt,
  Kosten einer vom Kunden zu vertretenden Rücklastschrift trägt er. Der alte
  Satz „solange kein Zahlungsverfahren eingerichtet ist, stellt der Anbieter
  keine Rechnung" ist weg. Abs. 6 (Sperre nach 30 Tagen Verzug und Mahnung)
  bleibt; die Sperre selbst ist E3 und nicht gebaut.
- **Konto-Seite**, Modalitäten: zwei Regeln zu Rechnungstermin und Zahlung.
- Lokal geprüft: alle drei Texte rendern, `&amp;` in „Plan & Abrechnung"
  korrekt. Weiterhin Entwürfe ohne Rechtsrat — anwaltliche Prüfung offen.

Nebenbei aus der Rückfrage des Users: Das **Banner zu überfälligen
Rechnungen auf `/admin`** sitzt im Konto-Kasten, den nur der Kontoinhaber
sieht (`getAccountContext` liefert für Manager und Rezeption null; die
Rezeption landet ohnehin auf `/h/<slug>/admin`). Manager sehen es also
nicht — Abrechnung ist Inhabersache, so ist es gewollt.

Und ein neuer **TODO-Punkt „Mail-Sperre sichtbar machen"**: Supabase Auth
lässt je Adresse nur eine Einladung/Reset-Mail pro 60 Sekunden zu, die
Oberfläche nennt den Grund nicht und zeigt keinen Countdown — für den
Live-Betrieb zu lösen.

## 🔖 Wiederaufnahme

Alle drei Schritte des Bauplans sind umgesetzt. Offen: Übergabe
an das UG-Konto, sobald Bernd es verifiziert hat (Live-Schlüssel, Webhook,
Steuer-Registrierung, Präfix `RS`, Kunden-Mails). Testkonto „Stripe-Testhaus"
(zurückdatiert, 3 Zimmer, Rechnung August bezahlt) bleibt stehen.
