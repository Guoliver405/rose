-- Stripe-Anbindung (Bauplan Sessions/Stripe-Plan-2026-09-06.md, Schritt 1 + 2).
-- Additiv: neue Spalten mit NULL-Default, zwei neue Tabellen. Alter Code läuft
-- gegen das neue Schema weiter; einspielen VOR dem Push des Stripe-Codes.

-- ── accounts: Stripe-Kunde, Zahlungsweg, Rechnungsdaten ─────────────────────
alter table accounts
  add column if not exists stripe_customer_id     text unique,
  add column if not exists payment_method_kind    text
    check (payment_method_kind in ('card', 'sepa_debit', 'bank_transfer')),
  add column if not exists stripe_payment_method  text,   -- pm_… bei card/sepa_debit
  add column if not exists payment_method_label   text,   -- „Visa •••• 4242", „SEPA •••• 3000"
  add column if not exists billing_name           text,   -- Rechnungsempfänger (Default: Kontoname)
  add column if not exists billing_address        jsonb,  -- { line1, line2, postal_code, city, country }
  add column if not exists vat_id                 text,   -- USt-IdNr., Pflicht bei EU-Land außer DE
  add column if not exists vat_id_status          text;   -- Stripe-Prüfstatus: pending/verified/unverified/unavailable

-- ── invoices: Spiegel der Stripe-Rechnungen ─────────────────────────────────
-- OHNE Fremdschlüssel — wie billing_snapshots: ein Beleg, den die Löschung
-- des Kontos mitnimmt, ist keiner (Aufbewahrungspflicht § 14b UStG).
create table if not exists invoices (
  id                    uuid primary key default gen_random_uuid(),
  account_id            uuid not null,
  period_start          date not null,
  rooms                 int  not null check (rooms >= 0),
  net_cents             int  not null check (net_cents >= 0),  -- aus billingLine
  stripe_invoice_id     text unique,
  number                text,                                   -- Stripe-Nummer, nach Finalisierung
  status                text not null default 'draft'
    check (status in ('draft', 'open', 'paid', 'uncollectible', 'void')),
  total_cents           int,                                    -- brutto, von Stripe
  tax_cents             int,
  hosted_invoice_url    text,
  invoice_pdf           text,
  due_at                date,
  paid_at               timestamptz,
  last_error            text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (account_id, period_start)   -- ein doppelter Monatslauf erzeugt nie zwei Rechnungen
);
create index if not exists idx_invoices_account on invoices (account_id, period_start desc);

alter table invoices enable row level security;
drop policy if exists invoices_select on invoices;
create policy invoices_select on invoices
  for select using (
    exists (
      select 1 from account_members am
      where am.user_id = auth.uid() and am.account_id = invoices.account_id
    )
  );
-- Schreiben ausschließlich über den Admin-Client (Monatslauf, Webhook).

-- ── stripe_events: Webhook-Idempotenz ───────────────────────────────────────
create table if not exists stripe_events (
  id          text primary key,           -- evt_…
  type        text not null,
  received_at timestamptz not null default now()
);
alter table stripe_events enable row level security;
-- keine Policies: nur der Admin-Client fasst sie an.
