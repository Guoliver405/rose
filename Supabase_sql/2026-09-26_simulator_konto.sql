-- ----------------------------------------------------------------------------
-- Simulator-Konto (Phase 2 des Simulators, 26.09.2026)
-- Bauplan: Sessions/Simulator-Plan-2026-09-26.md, Abschnitt 4.
--
-- Wer den Housekeeping-Simulator nutzen will, legt ein eigenes Konto an:
-- E-Mail, Passwort, Bestätigung per Mail, KEINE Zahlungsdaten. Ein solches
-- Konto hat weder `profiles` noch `account_members`/`hotel_members` — die
-- bestehenden Guards und RLS-Funktionen geben ihm also nirgends im Produkt
-- Rechte. Das prüfen guards.test.ts und rls.test.ts.
--
-- ADDITIV — drei neue Tabellen und ein erweiterter CHECK. Reihenfolge: erst
-- einspielen, dann pushen (der neue Code liest `sim_accounts` in der
-- Login-Weiche).
-- ----------------------------------------------------------------------------

-- 1) Das Konto. Eine Zeile je Auth-Nutzer; die Kaskade am Auth-Nutzer nimmt
--    sie mit (Selbstlöschung unter „Mein Konto").
create table if not exists sim_accounts (
  user_id                 uuid primary key references auth.users(id) on delete cascade,
  created_at              timestamptz not null default now(),
  -- Gesetzt beim Klick auf den Bestätigungslink. Ohne Bestätigung kein
  -- Zugang; unbestätigte Konten verfallen nach 7 Tagen (aufgeräumt bei jeder
  -- neuen Registrierung, kein Cron).
  confirmed_at            timestamptz,
  -- Werbe-Einwilligung, ausschließlich zu RoSe. Double-Opt-in: das Häkchen
  -- bei der Registrierung setzt `marketing_opt_in`, WIRKSAM wird es erst mit
  -- der Bestätigung — dann steht der Zeitpunkt in `marketing_opt_in_at`.
  -- `marketing_text_version` ist der Nachweis, welchem Wortlaut zugestimmt
  -- wurde (src/lib/sim-account.ts).
  marketing_opt_in        boolean not null default false,
  marketing_opt_in_at     timestamptz,
  marketing_text_version  text,
  -- Phase 4: das Hotelkonto, in das umgewandelt wurde. Ohne Fremdschlüssel
  -- wie die Belegtabellen — der Vermerk überlebt die Löschung des Kontos.
  converted_account_id    uuid
);

alter table sim_accounts enable row level security;

drop policy if exists sim_accounts_select_own on sim_accounts;
create policy sim_accounts_select_own on sim_accounts
  for select using (user_id = auth.uid());
-- Schreiben nur über den Admin-Client (Registrierung, Bestätigung, Konto).

comment on table sim_accounts is
  'Konten des Housekeeping-Simulators. Keine Rechte im Produkt; Werbe-Einwilligung mit Zeitpunkt und Textversion.';

-- 2) Gespeicherte Szenarien (genutzt ab Phase 3). Nur eigene Zeilen.
create table if not exists sim_scenarios (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 120),
  config      jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_sim_scenarios_user on sim_scenarios(user_id, updated_at desc);

alter table sim_scenarios enable row level security;

drop policy if exists sim_scenarios_own on sim_scenarios;
create policy sim_scenarios_own on sim_scenarios
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

comment on table sim_scenarios is
  'Gespeicherte Szenarien des Housekeeping-Simulators, je Auth-Nutzer.';

-- 3) Drossel des offenen Registrierungsformulars — Muster von
--    guest_login_failures: eine Zeile je Versuch, nur der IP-Hash, Zeilen
--    außerhalb des Fensters (1 h) löscht jeder Versuch mit.
create table if not exists signup_attempts (
  id            bigint generated always as identity primary key,
  ip_hash       text not null,
  attempted_at  timestamptz not null default now()
);

create index if not exists idx_signup_attempts_ip_time on signup_attempts(ip_hash, attempted_at desc);
create index if not exists idx_signup_attempts_time on signup_attempts(attempted_at);

alter table signup_attempts enable row level security;

comment on table signup_attempts is
  'Registrierungsversuche des Simulators je Absender-IP (SHA-256, nie die Adresse). Fenster 1 h.';

-- 4) Neuer Mail-Zweck: Bestätigung (und Hinweis „schon registriert").
alter table mail_log drop constraint if exists mail_log_purpose_check;
alter table mail_log add constraint mail_log_purpose_check
  check (purpose in ('invite', 'recovery', 'guest_access', 'sim_confirm'));
