# Stripe im Testmodus — Bauplan (Fassung 2: Stripe Invoicing + Stripe Tax)

Stand 06.09.2026, nach Rücksprache mit dem User. Setzt den Bauplan aus
[Zahlungsprovider-Gegenueberstellung-2026-09-05.md](Zahlungsprovider-Gegenueberstellung-2026-09-05.md)
um, **weicht aber in einem Punkt bewusst davon ab:** Die Rechnung schreibt
nicht RoSe, sondern **Stripe Invoicing**, und die Steuer rechnet **Stripe
Tax**. Grund: der User will alle Zahlungen über einen Kanal, eine fertige
Übersicht „wer hat nicht gezahlt" ohne eigene Betreiber-Oberfläche und so
wenig eigene Steuerlogik wie möglich. Preis dafür ist die E-Rechnungspflicht
2028 (Abschnitt 9), die als eigener späterer Baustein bleibt.

Entscheidung des Users: Stripe, **zuerst im Testmodus** mit Olivers eigenem
Stripe-Konto und Testschlüsseln, ohne auf das Konto der I²D UG zu warten.
Der spätere Wechsel ist ein Tausch von drei Umgebungsvariablen plus
Konto-Einstellungen (Abschnitt 7) im UG-Konto.

## 1. Was am Ende steht

- Bei der Registrierung hinterlegt der Kunde Rechnungsdaten (Empfänger,
  Anschrift, Land, USt-IdNr.) und einen Zahlungsweg: Karte oder
  SEPA-Lastschrift, ohne Belastung gespeichert, oder Überweisung. Auch die
  Überweisung läuft über Stripe (virtuelle IBAN, automatische Zuordnung,
  Auszahlung zusammen mit allem anderen) — **kein Abgleich auf dem
  Firmenkonto**.
- Am 1. jeden Monats erzeugt RoSe je Konto eine Stripe-Rechnung **für den
  Vormonat** mit einer Position aus `billingLine` (Zimmerzahl aus dem
  festgeschriebenen Snapshot). Stripe vergibt die Nummer, rechnet die Steuer,
  erzeugt das PDF, verschickt die Rechnung, zieht bei Karte/Lastschrift ein
  bzw. zeigt die Überweisungsdaten, erinnert bei Nichtzahlung.
- Webhooks spiegeln den Rechnungsstatus in RoSe; die Konto-Seite zeigt
  Zahlungsweg, Rechnungsdaten und die Rechnungsliste mit Link auf PDF und
  Zahlungsseite; `/admin` warnt bei fehlendem Zahlungsweg und überfälliger
  Rechnung.
- Die Übersicht für Bernd ist das Stripe-Dashboard (Rechnungen, Filter
  offen/überfällig/bezahlt, Steuerbericht, DATEV-Export). RoSe braucht keine
  Betreiber-Ansicht.
- Freimonat-Regel neu: Rest des Registrierungsmonats **plus der erste volle
  Kalendermonat** (Abschnitt 3).

## 2. Was bereits da ist und wiederverwendet wird

| Baustein | Wo | Rolle |
|---|---|---|
| `billingLine`, `monthlyPriceCents`, `isFreePeriod` | [pricing.ts](../src/lib/pricing.ts) | Rechenregel der Rechnungsposition; `isFreePeriod` bekommt die neue Regel |
| `countBillableRooms`, `closedMonthPeriods`, `periodKey` | [rooms.ts](../src/lib/rooms.ts) | Zimmerzahl je Periode |
| `ensureBillingSnapshots`, `getBillingOverview` | [billing.ts](../src/utils/billing.ts) | Der Monatslauf schreibt **vor** der Rechnung den Snapshot; die Pille „festgeschrieben" wird für abgerechnete Monate wahr |
| `AccountContext.createdAt` | [auth.ts](../src/utils/auth.ts) | Freier Monat |
| `mailReady()`-Muster | [mail.ts](../src/utils/mail.ts) | Vorbild für `stripeReady()` |
| Platzhalter-Karten „Zahlungsverfahren", „Rechnungen" | [abrechnung/page.tsx](../src/app/admin/abrechnung/page.tsx) | Werden gefüllt |
| `signupAction` | [registrieren/actions.ts](../src/app/registrieren/actions.ts) | Stripe-Kunde anlegen, in den Zahlungsschritt leiten |
| `deleteAccountData` | [deletion.ts](../src/utils/deletion.ts) | Stripe-Kunden löschen (Stripe behält dessen Rechnungen), Spiegel-Zeilen behalten |
| `tz.ts` | [tz.ts](../src/lib/tz.ts) | Registrierungstag in Europe/Berlin für die Freimonat-Regel |

## 3. Freimonat-Regel

Bisher: der Kalendermonat der Registrierung (`FREE_MONTHS = 1`). Wer am 27.
registriert, hat vier freie Tage — die Landing Page verspricht aber an vier
Stellen „erster Monat frei" bzw. „Kostenlos starten".

Neu: **Frei sind der Kalendermonat der Registrierung und, wenn das Konto
nicht am Monatsersten angelegt wurde, der darauf folgende Kalendermonat.**
Also immer mindestens ein voller Monat, höchstens ein Monat und 30 Tage.
Der Registrierungstag wird in `Europe/Berlin` bestimmt (`zonedParts`), nicht
in Server-UTC. Umsetzung in `pricing.ts` (`isFreePeriod`, neue Hilfsfunktion
`freePeriodEnd(accountCreatedAt)` für Texte), getestet mit den Grenzfällen
1., 2., 31., Jahreswechsel. `FREE_MONTHS` entfällt.

Texte, die mitziehen: AGB § 6 Abs. 3 („… mindestens also ein voller
Kalendermonat"), Landing Page (Hero, Preisabschnitt, FAQ, CTA-Zeile:
„mindestens ein voller Monat frei"), OG-Bild, Registrierungsformular,
Konto-Seite („frei bis Ende Oktober 2026"), `/admin`-Kurzkasten.

Beispiel: Registrierung am 27.09. → September und Oktober frei → erste
Rechnung am 1.11. für Oktober über 0 € entfällt, erste echte Rechnung am
1.12. für November.

## 4. Datenmodell (eine Migration, additiv)

```sql
alter table accounts
  add column stripe_customer_id     text unique,
  add column payment_method_kind    text check (payment_method_kind in ('card','sepa_debit','bank_transfer')),
  add column stripe_payment_method  text,     -- pm_… bei card/sepa_debit
  add column payment_method_label   text,     -- „Visa •••• 4242", „DE •••• 3000"
  add column billing_name           text,
  add column billing_address        jsonb,    -- { line1, line2, postal_code, city, country }
  add column vat_id                 text,
  add column vat_id_status          text;     -- Stripe-Prüfstatus: pending/verified/unverified/unavailable

-- Spiegel der Stripe-Rechnungen, OHNE Fremdschlüssel (Belege überleben die Kontolöschung)
create table invoices (
  id                    uuid primary key default gen_random_uuid(),
  account_id            uuid not null,
  period_start          date not null,
  rooms                 int  not null,
  net_cents             int  not null,           -- aus billingLine
  stripe_invoice_id     text unique,
  number                text,                    -- Stripe-Nummer, nach Finalisierung
  status                text not null check (status in ('draft','open','paid','uncollectible','void')),
  total_cents           int,                     -- brutto, von Stripe
  tax_cents             int,
  hosted_invoice_url    text,
  invoice_pdf           text,
  due_at                date,
  paid_at               timestamptz,
  last_error            text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (account_id, period_start)              -- ein doppelter Lauf erzeugt nie zwei Rechnungen
);
-- RLS an, SELECT für Kontomitglieder (wie billing_snapshots), Schreiben nur Admin-Client

create table stripe_events (                     -- Webhook-Idempotenz
  id          text primary key,                  -- evt_…
  type        text not null,
  received_at timestamptz not null default now()
);
```

Kein Storage-Bucket, kein PDF in RoSe: PDF und Zahlungsseite liegen bei
Stripe (`invoice_pdf`, `hosted_invoice_url`). Die Spiegel-Zeile trägt nur,
was die Konto-Seite und `/admin` anzeigen.

## 5. Umgebungsvariablen und Pakete

| Variable | Zweck |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_…`, später `sk_live_…` der UG |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` für das Payment Element |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` des Endpunkts |
| `CRON_SECRET` | Vercel setzt `Authorization: Bearer …` beim Cron-Aufruf |

`stripeReady()` = die drei Stripe-Schlüssel gesetzt. Fehlen sie, bleibt
alles wie heute (Platzhalter-Karten, Registrierung ohne Zahlungsschritt,
kein Monatslauf); CI mit Platzhaltern und lokale Entwicklung ohne Stripe
laufen weiter.

Pakete: `stripe` (Server-SDK: Signaturprüfung, Idempotency-Keys, Typen),
`@stripe/stripe-js` + `@stripe/react-stripe-js` (Payment Element). Kein
`pdf-lib`, kein XML.

## 6. Schritte — jeder für sich deploybar

### Schritt 1 — Freimonat, Stripe-Kunde, Rechnungsdaten, Zahlungsweg

1. **Freimonat-Regel** (Abschnitt 3) in `pricing.ts` + Tests + Texte.
2. **Migration** aus Abschnitt 4.
3. **`src/utils/stripe.ts`**: `stripeReady()`, `stripeClient()`,
   `ensureStripeCustomer(accountId)` — legt den Kunden an, wenn keiner da
   ist oder die gespeicherte ID im aktuellen Stripe-Konto nicht existiert
   (Wechsel Test → Live), mit Name, E-Mail des Inhabers
   (`auth.admin.getUserById`), `metadata.account_id`;
   `syncCustomerBillingDetails(accountId)` schreibt Anschrift und USt-IdNr.
   (`customers.update` + `customers.createTaxId({ type: 'eu_vat' })`,
   Stripe prüft gegen VIES und meldet den Status per Webhook
   `customer.tax_id.updated`); `describePaymentMethod(pm)` für das Label.
4. **Seite `/admin/abrechnung/zahlungsweg`** (nur Inhaber):
   - **Rechnungsdaten**: Empfänger (Default Kontoname), Straße, PLZ, Ort,
     Land (Auswahl), USt-IdNr. (Pflicht bei EU-Land außer DE, Format-Check
     I/O-frei in `src/lib/vat.ts`; die inhaltliche Prüfung macht Stripe).
     Anschrift ist Pflicht, weil Stripe Tax ohne Kundenadresse nicht
     rechnet.
   - **Zahlungsweg**: Karte / SEPA-Lastschrift / Überweisung. Karte und
     Lastschrift: SetupIntent (`payment_method_types: ['card','sepa_debit']`,
     `usage: 'off_session'`), Payment Element; nach Bestätigung speichert
     der Server `stripe_payment_method`, Art, Label und setzt
     `invoice_settings.default_payment_method`. Überweisung: nur
     `payment_method_kind = 'bank_transfer'`.
   - Actions in `src/app/admin/abrechnung/actions.ts`:
     `saveBillingDetailsAction`, `createSetupIntentAction`,
     `confirmPaymentMethodAction`, `chooseBankTransferAction`,
     `removePaymentMethodAction`.
5. **Karte „Zahlungsverfahren"** auf `/admin/abrechnung` zeigt Zahlungsweg
   und Rechnungsdaten mit „Ändern"; ohne Zahlungsweg Hinweis + Knopf.
6. **Registrierung**: `signupAction` legt den Stripe-Kunden an (nicht
   fatal) und leitet nach `/admin/abrechnung/zahlungsweg?neu=1` („Schritt 2
   von 2"), danach ins Zimmer-Setup. „Später" möglich; `/admin` erinnert per
   Banner, solange kein Zahlungsweg da ist (E1).
7. **Kontolöschung**: `customers.del` in `deleteAccountData`; Stripe behält
   die Rechnungen des Kunden, RoSe die Spiegel-Zeilen.

Verifikation in Produktion mit Testschlüsseln: Testkarte `4242 4242 4242
4242`, Test-IBAN `DE89 3704 0044 0532 0130 00`, EU-USt-IdNr. im Testmodus
z. B. `DE123456789` (Stripe simuliert die Prüfung).

### Schritt 2 — Monatslauf, Stripe-Rechnung, Webhooks, Rechnungsliste

1. **`src/utils/invoicing.ts`**: `runMonthlyInvoicing(now)`:
   - alle Konten mit Stripe-Kunde; je Konto `ensureBillingSnapshots`
     (schreibt den Vormonat fest), Zimmerzahl des Vormonats aus dem
     Snapshot, `billingLine`;
   - `cents === 0` (kein Zimmer oder freier Monat) → keine Rechnung (E2);
   - Spiegel-Zeile `invoices` mit `status = 'draft'` einfügen (Unique
     `account_id, period_start` fängt Doppelläufe ab), dann bei Stripe mit
     Idempotency-Key `invoice-<account>-<period>`:
     `invoices.create({ customer, collection_method, days_until_due,
     automatic_tax: { enabled: true }, metadata: { account_id, period_start,
     invoice_id }, pending_invoice_items_behavior: 'exclude' })`,
     `invoiceItems.create({ invoice, customer, amount: cents, currency:
     'eur', description: 'RoSe — Nutzung im September 2026: 12 Zimmer
     (mindestens 5,00 €)', tax_behavior: 'exclusive' })` — ohne Produkt; der
     Steuer-Code kommt aus dem voreingestellten Produktsteuercode der
     Steuereinstellungen (SaaS, business use), `invoices.finalizeInvoice` →
     Nummer, Steuer, PDF, Zahlungsseite; Stripe verschickt die Rechnung.
   - **Einzugsart je Zahlungsweg:** Karte/Lastschrift →
     `collection_method: 'charge_automatically'` (Stripe zieht bei
     Finalisierung ein; SEPA-Vorabankündigung verschickt Stripe; Ausfall →
     Smart Retries, dann `invoice.payment_failed`). Überweisung →
     `collection_method: 'send_invoice'`, `days_until_due: 14`,
     `payment_settings.payment_method_types: ['customer_balance', 'card',
     'sepa_debit']` — die Zahlungsseite zeigt IBAN und Verwendungszweck,
     Stripe ordnet den Eingang zu; Erinnerungen nach Stripe-Zeitplan
     (Abschnitt 7).
   - ohne Zahlungsweg: `send_invoice` mit 14 Tagen (der Kunde kann auf
     der Stripe-Seite zahlen); zusätzlich Banner in RoSe.
   - Auslöser: Vercel Cron `0 4 1 * *` auf `/api/billing/run`
     (`CRON_SECRET`) **und** derselbe idempotente Lauf beim ersten Aufruf
     von `/admin` im neuen Monat (Muster `ensureBillingSnapshots`). Der
     Cron ist Komfort, der Seitenaufruf die Sicherheit.
2. **Webhook** `src/app/api/stripe/webhook/route.ts`: `req.text()`,
   `constructEvent`, Idempotenz über `stripe_events`. Ereignisse:
   `invoice.finalized` (Nummer, Beträge, URLs, Fälligkeit),
   `invoice.paid`, `invoice.payment_failed` (Status + `last_error`),
   `invoice.marked_uncollectible`, `invoice.voided`, `setup_intent.succeeded`
   (Zahlungsweg absichern), `payment_method.detached` und
   `customer.tax_id.updated` (Status am Konto). Endpunkt im Dashboard auf
   `https://rose-roomservice.app/api/stripe/webhook`, **kein Stripe CLI**
   (E7). `/api/…` liegt außerhalb des Proxy-Matchers, richtig so.
3. **Abgleich** (Sicherheitsnetz gegen verpasste Webhooks): der Lauf am
   Monatsersten holt zusätzlich für alle Spiegel-Zeilen mit Status
   `open`/`draft` die Stripe-Rechnung und gleicht den Status ab
   (`invoices.list` mit `metadata`-Filter je Konto ist unnötig — die IDs
   stehen in der Spiegel-Tabelle).
4. **Karte „Rechnungen"** auf `/admin/abrechnung`: Liste (Nummer, Monat,
   Zimmer, Betrag brutto, Status-Pille, Fälligkeit), Links „PDF" und
   „Rechnung ansehen / bezahlen" auf die Stripe-URLs. Die Pille „nicht
   berechnet" verschwindet für Perioden mit Rechnung.
5. **`/admin`-Kurzkasten**: Zahlungsweg-Status, letzte Rechnung mit Status,
   Banner bei fehlendem Zahlungsweg oder Rechnung überfällig/fehlgeschlagen.
   Sperre bei Nichtzahlung bleibt außen vor (E3).
6. **Tests**: `tax`-Logik gibt es nicht mehr; getestet werden Freimonat
   (`pricing.test.ts`), `vat.ts`, der Aufbau der Rechnungsposition
   (`src/lib/invoice.ts`: Beschreibungstext, Betrag, Periode, I/O-frei) und
   der Monatslauf gegen die Testwelt
   (`tests/integration/invoicing.test.ts`) mit einem Fake hinter dem
   Interface `InvoiceGateway` (echte Implementierung `stripeGateway`), damit
   Snapshot, Auswahl der Konten, Idempotenz und Spiegel-Zeilen ohne
   Stripe-Netzverkehr geprüft sind. Die Stripe-Seite wird einmal von Hand
   in Produktion durchgespielt (Testkarte, Test-IBAN, Überweisung im
   Dashboard simulieren, Webhook-Log).

### Schritt 3 — Rechtstexte und Übergabe an die UG

1. Datenschutz Abschnitt 7: Stripe Payments Europe Ltd. (Dublin) als
   Empfänger von Rechnungs- und Zahlungsdaten (Anschrift, USt-IdNr.,
   Zahlungsmittel, Mandat), Rechnungsversand durch Stripe; AVV-Liste.
2. AGB § 6 Abs. 3 (Freimonat, siehe Abschnitt 3) und Abs. 4: „Bei
   hinterlegtem Zahlungsmittel wird der Rechnungsbetrag mit
   Rechnungsstellung eingezogen (Lastschrift nach Vorabankündigung), sonst
   ist die Rechnung innerhalb von 14 Tagen fällig"; Abs. 6 Sperre nach
   30 Tagen bleibt Text, Umsetzung später (E3).
3. **Wechsel auf das UG-Konto**: Schlüssel in Vercel tauschen, Webhook-Endpunkt, Steuer-Registrierung, Bank
   transfers, Kunden-Mails und Erinnerungen im UG-Konto einrichten
   (Abschnitt 7 noch einmal), Gläubiger-ID für SEPA (Live). Test-Kunden
   verfallen; `ensureStripeCustomer` legt beim nächsten Aufruf neue an und
   leert den Zahlungsweg, `/admin` erinnert.

## 7. Einstellungen im Stripe-Konto (Sandbox, macht Oliver)

Ausführliche Schritt-für-Schritt-Anleitung mit geprüften Menüpfaden:
[Stripe-Einrichtung-Testkonto-2026-09-06.md](Stripe-Einrichtung-Testkonto-2026-09-06.md).
Kurzfassung:

1. **Konto anlegen**, Testmodus; Firmendaten dürfen leer bleiben. Unter
   „Developers → API keys" `sk_test_…` und `pk_test_…` holen → `.env.local`
   und Vercel (Git-Bash-`printf`-Muster aus AGENTS.md).
2. Kein eigenes Produkt nötig: der Steuer-Code „Software as a service
   (SaaS) – business use" (`txcd_10103001`) wird als **voreingestellter
   Produktsteuercode** in den Steuereinstellungen gesetzt und gilt für alle
   Rechnungspositionen.
3. **Stripe Tax** aktivieren: Settings → Tax; Herkunftsadresse (im Test die
   UG-Anschrift Saarbrücken), Steuer-Registrierung **Deutschland** anlegen
   (in der Sandbox ohne Nachweis), Steuerverhalten „Exklusive".
4. **Zahlungsmethoden**: Settings → Payment methods: Karten, SEPA-Lastschrift
   und **Bank transfers (Kundenguthaben)** einschalten. Im Testmodus lassen
   sich Überweisungen im Dashboard simulieren.
5. **Rechnungen**: Settings → Billing → Invoices: Nummernkreis (Präfix,
   z. B. `RS-`), Vorlage mit Firmendaten und Fußzeile (Steuer-Hinweis liefert
   Stripe Tax), Standard-Zahlungsziel 14 Tage.
6. **Kunden-Mails**: Settings → Emails: „Rechnungen senden" und
   „Zahlungserinnerungen" ein, Zeitplan der Erinnerungen (z. B. 3, 7 und
   14 Tage nach Fälligkeit) und Smart Retries für automatische Einzüge;
   Branding (Logo, Farbe). Absender ist zunächst Stripe im Namen der UG;
   eine eigene Absender-Domain braucht DNS-Einträge bei Porkbun (später).
7. **Webhook**: Developers → Webhooks → Endpunkt
   `https://rose-roomservice.app/api/stripe/webhook` mit den Ereignissen
   aus Schritt 2 → `whsec_…` nach `STRIPE_WEBHOOK_SECRET` (erst in Schritt 2
   nötig).

## 8. Entscheidungen (alle vom User bestätigt, 06.09.)

- **E1** Zahlungsweg direkt nach der Registrierung, überspringbar mit
  Erinnerungsbanner.
- **E2** Freier Monat ohne Rechnung.
- **E3** Sperre bei Nichtzahlung später; jetzt Stripe-Erinnerungen und
  Banner.
- **E4** Überweisung von Anfang an, über Stripe.
- **E5** Land und USt-IdNr. abfragen, Steuer durch Stripe Tax, keine
  Länder-Sperre.
- **E6** Euro überall.
- **E7** Kein Stripe CLI.
- **E8 (neu)** Stripe schreibt und verschickt die Rechnung, Stripe Tax
  rechnet die Steuer; Rechnungs-Mails und Erinnerungen kommen von Stripe im
  Namen der UG, Fristen aus den AGB (14 Tage).
- **E9 (neu)** Freimonat = Registrierungsmonat plus erster voller
  Kalendermonat; Rechnung am 1. für den Vormonat.

## 9. Was bei uns bleibt und was offen ist

- **Steuerberater**: Umsatzsteuer-Voranmeldung und Zusammenfassende Meldung
  aus dem Stripe-Tax-Bericht, Buchung der Auszahlungen und Gebühren
  (DATEV-Export aus dem Stripe-App-Verzeichnis). Kein Steuermodul in RoSe.
- **E-Rechnungspflicht ab 01.01.2028** (inländisches B2B): Stripe-PDFs sind
  keine ZUGFeRD-Rechnungen. Rückfall: aus den Stripe-Rechnungsdaten (alle
  Felder über die API) eine XRechnung erzeugen und dem Kunden zusätzlich
  anbieten. Eigener Baustein 2027, in TODO.md eintragen; vorher prüfen, ob
  Stripe bis dahin E-Rechnungen für Deutschland liefert.
- **Aufwand**: Schritt 1 ≈ ein halber Tag, Schritt 2 ≈ ein Tag, Schritt 3 ≈
  zwei Stunden plus Übergabe. Nach jedem Schritt Verifikation in Produktion
  mit Testschlüsseln, Protokoll, Commit, Push.
