-- ----------------------------------------------------------------------------
-- Partnerprogramm, erster Bauabschnitt (15.11.2026)
--
-- Wer RoSe empfiehlt, bekommt dauerhaft einen Anteil (Vorgabe 20 %) am
-- bezahlten Nettobetrag der geworbenen Konten. Dieser Abschnitt legt an:
-- den Partner-Eintrag, die Zuordnung am Konto und das Provisionsbuch.
-- Ausgezahlt wird noch nichts – das Buch sammelt aber vom ersten Tag an.
-- Bauplan: Sessions/Affiliate-Plan-2026-11-15.md
--
-- ADDITIV – zwei neue Tabellen, vier neue Spalten.
-- Reihenfolge: erst einspielen, dann pushen.
-- ----------------------------------------------------------------------------

-- 1) Partner. Ein Partner ist ein Anmeldekonto (Inhaber, Manager, Rezeption
--    oder Simulator-Konto); löscht die Person ihren Zugang, geht der Eintrag
--    mit. Das Buch unten bleibt als Beleg ohne Person stehen.
--    `approved_at` ist die Freischaltung durch uns: Solange die Registrierung
--    nur mit Einladungscode offen ist, öffnet sie nur der Code eines
--    freigeschalteten Partners. Zuordnen darf jeder Code.
create table if not exists affiliates (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references auth.users(id) on delete cascade,
  -- 8 Zeichen ohne verwechselbare (kein 0/O, 1/I/L), siehe src/lib/affiliate.ts.
  code           text not null unique check (code ~ '^[A-HJKMNP-Z2-9]{8}$'),
  -- Satz in Basispunkten (2000 = 20 %). Je Partner abweichend setzbar; jede
  -- Buchung friert den Satz ein, der bei ihrer Entstehung galt.
  rate_bps       int  not null default 2000 check (rate_bps between 0 and 10000),
  -- Welchen Partnerbedingungen zugestimmt wurde, und wann.
  terms_version  text not null,
  accepted_at    timestamptz not null default now(),
  approved_at    timestamptz,
  created_at     timestamptz not null default now()
);

alter table affiliates enable row level security;

drop policy if exists affiliates_select_own on affiliates;
create policy affiliates_select_own on affiliates
  for select using (user_id = auth.uid());
-- Schreiben nur über den Admin-Client.

comment on table affiliates is
  'Partner des Partnerprogramms. Ein Eintrag je Anmeldekonto; approved_at = von uns freigeschaltet.';

-- 2) Zuordnung am Konto. Wird NUR beim Anlegen gesetzt und danach nicht mehr
--    geändert (Korrekturen per SQL durch uns). Löscht der Partner seinen
--    Zugang, wird das Feld leer.
alter table accounts
  add column if not exists referred_by uuid references affiliates(id) on delete set null,
  add column if not exists referred_at timestamptz;

create index if not exists accounts_referred_by_idx on accounts (referred_by) where referred_by is not null;

-- 3) Simulator-Konten tragen den Partner bis zur Umwandlung mit – zwischen
--    Registrierung und Umwandlung liegen Tage, die URL ist dann weg.
--    Ohne Fremdschlüssel wie converted_account_id.
alter table sim_accounts
  add column if not exists referred_by uuid;

-- 4) Der Partner wird an der RECHNUNG eingefroren, wenn die Spiegel-Zeile
--    entsteht. Die Schlussrechnung wird bezahlt, nachdem das Konto gelöscht
--    ist – accounts.referred_by gibt es dann nicht mehr. Ohne Fremdschlüssel
--    wie die ganze Tabelle.
alter table invoices
  add column if not exists affiliate_id uuid;

-- 5) Das Provisionsbuch. OHNE Fremdschlüssel wie invoices und
--    billing_snapshots: ein Beleg, den die Löschung mitnimmt, ist keiner.
--    Buchungen statt Status: eine Rücknahme ist eine eigene, negative Zeile –
--    ein Statusfeld könnte weder eine Teilerstattung noch eine Erstattung
--    nach der Auszahlung ausdrücken. Der Stand eines Partners ist die Summe.
--    `source` ist der Schlüssel des Auslösers (Rechnung bezahlt, Erstattung,
--    Rückbuchung) und macht jede Buchung idempotent.
create table if not exists affiliate_commissions (
  id            uuid primary key default gen_random_uuid(),
  affiliate_id  uuid not null,
  account_id    uuid not null,
  invoice_id    uuid,
  kind          text not null check (kind in ('commission', 'reversal')),
  source        text not null unique,
  period_start  date not null,
  base_cents    int  not null,
  rate_bps      int  not null check (rate_bps between 0 and 10000),
  -- Provision positiv; Rücknahme negativ (eine zurückgewonnene Rückbuchung
  -- ist eine Rücknahme mit positivem Vorzeichen).
  amount_cents  int  not null check (kind <> 'commission' or amount_cents > 0),
  -- Ende der Haltefrist; nur an Provisionen.
  available_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists affiliate_commissions_affiliate_idx
  on affiliate_commissions (affiliate_id, period_start desc);
create index if not exists affiliate_commissions_invoice_idx
  on affiliate_commissions (invoice_id);

alter table affiliate_commissions enable row level security;

drop policy if exists affiliate_commissions_select_own on affiliate_commissions;
create policy affiliate_commissions_select_own on affiliate_commissions
  for select using (
    exists (
      select 1 from affiliates a
      where a.id = affiliate_commissions.affiliate_id and a.user_id = auth.uid()
    )
  );
-- Schreiben nur über den Admin-Client (Webhook, Monatslauf).

comment on table affiliate_commissions is
  'Provisionsbuch des Partnerprogramms. Ohne Fremdschlüssel; Rücknahmen sind eigene, negative Buchungen.';
