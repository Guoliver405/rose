-- ----------------------------------------------------------------------------
-- Anmelde-Adresse selbst ändern (11.10.2026)
-- Protokoll: Sessions/2026-10-11_Email-aendern.md
--
-- Verwaltungs-Zugänge (Inhaber, Manager, Rezeption) ändern ihre Anmelde-
-- Adresse unter „Mein Zugang“: aktuelles Passwort + neue Adresse, Link an die
-- NEUE Adresse, erst der Klick stellt um, danach Hinweis an die ALTE.
--
-- Warum eine eigene Tabelle statt Supabases `email_change`: Im Projekt ist
-- „Secure email change“ aktiv (11.10.2026 nachgemessen: ein bestätigter Link
-- an die neue Adresse ändert nichts, es fehlt die zweite Bestätigung an der
-- alten). Das sperrte genau die aus, deren alte Adresse nicht mehr erreichbar
-- ist — und der Ablauf hinge an einem Schalter im Dashboard, den der Code
-- nicht sieht. Die Bestätigung liegt deshalb hier, umgestellt wird per
-- Admin-API (`updateUserById`).
--
-- ADDITIV — eine neue Tabelle und ein erweiterter CHECK. Reihenfolge: erst
-- einspielen, dann pushen.
-- ----------------------------------------------------------------------------

-- 1) Offene Änderung, höchstens eine je Person. Die neue Adresse steht hier im
--    Klartext, weil sie bis zur Bestätigung nirgends sonst steht; die Zeile
--    verschwindet mit der Bestätigung, dem Abbruch oder spätestens mit der
--    nächsten Anfrage nach Ablauf (24 h, aufgeräumt bei jeder Anfrage, kein
--    Cron). Vom Link steht nur der SHA-256-Hash hier.
create table if not exists email_change_requests (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  new_email   text not null,
  token_hash  text not null unique,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);

alter table email_change_requests enable row level security;
-- Keine Policies: nur der Admin-Client fasst sie an.

-- 2) Zwei neue Zwecke im Zustellprotokoll: der Bestätigungslink an die neue
--    Adresse und der Hinweis an die alte.
alter table mail_log drop constraint if exists mail_log_purpose_check;
alter table mail_log add constraint mail_log_purpose_check
  check (purpose in ('invite', 'recovery', 'guest_access', 'sim_confirm', 'email_change', 'email_changed'));
