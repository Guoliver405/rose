-- ----------------------------------------------------------------------------
-- „Problem melden“ – Tickets (19.10.2026)
--
-- Wer in der Verwaltung arbeitet (Inhaber, Manager, Rezeption), meldet aus der
-- Hilfe-Leiste einen Fehler, eine Übersetzung, eine Frage oder einen Vorschlag.
-- Daraus entsteht ein Ticket mit Gesprächsverlauf IN RoSe – nicht per Mail,
-- weil offen ist, ob die meldende Person das Postfach der Anmelde-Adresse
-- liest (gemeinsamer Rezeptionszugang). Das RoSe-Team antwortet unter
-- /support (Liste der Konten in SUPPORT_USER_IDS); per Mail geht nur ein
-- Hinweis mit Link, nie der Inhalt.
--
-- Sichtbar ist ein Ticket für die meldende Person, den Inhaber des Kontos und
-- die Manager des betroffenen Hauses. Die Prüfung steht im Code
-- (lib/tickets.ts), gelesen und geschrieben wird nur über den Admin-Client.
--
-- ADDITIV – neue Tabellen, ein privater Bucket, ein erweiterter CHECK.
-- Reihenfolge: erst einspielen, dann pushen.
-- ----------------------------------------------------------------------------

-- 1) Tickets. `number` ist die kurze Kennung für Gespräche („Meldung 12“).
--    Haus und Konto kaskadieren: Wer seine Daten löschen lässt, verliert auch
--    seine Meldungen (Bildschirmfotos können Gäste und Personal zeigen).
--    Die meldende Person steht als Auth-ID (set null beim Löschen des Zugangs)
--    und als Name zum Zeitpunkt der Meldung.
create table if not exists tickets (
  id              uuid primary key default gen_random_uuid(),
  number          bigint generated always as identity unique,
  account_id      uuid not null references accounts(id) on delete cascade,
  hotel_id        uuid references hotels(id) on delete cascade,
  reporter_id     uuid references auth.users(id) on delete set null,
  reporter_name   text not null,
  reporter_role   text not null check (reporter_role in ('admin', 'manager', 'reception')),
  kind            text not null check (kind in ('bug', 'translation', 'question', 'idea')),
  status          text not null default 'new' check (status in ('new', 'open', 'waiting', 'done')),
  subject         text not null check (char_length(subject) between 1 and 120),
  -- Seite, Sprache, Bildschirm, Browser, letzte Fehlermeldungen im Browser.
  context         jsonb not null default '{}'::jsonb,
  screenshot_path text,
  -- Neue Antwort des RoSe-Teams, die die meldende Person noch nicht gesehen hat.
  reporter_unread boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists tickets_account_idx  on tickets (account_id, updated_at desc);
create index if not exists tickets_hotel_idx    on tickets (hotel_id, updated_at desc);
create index if not exists tickets_reporter_idx on tickets (reporter_id) where reporter_unread;
create index if not exists tickets_status_idx   on tickets (status, updated_at desc);

alter table tickets enable row level security;
-- Keine Policies: nur der Admin-Client fasst sie an.

-- 2) Der Gesprächsverlauf. Die erste Nachricht ist die Meldung selbst.
create table if not exists ticket_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references tickets(id) on delete cascade,
  author      text not null check (author in ('customer', 'support')),
  author_id   uuid references auth.users(id) on delete set null,
  author_name text not null,
  body        text not null check (char_length(body) between 1 and 5000),
  created_at  timestamptz not null default now()
);

create index if not exists ticket_messages_ticket_idx on ticket_messages (ticket_id, created_at);

alter table ticket_messages enable row level security;
-- Keine Policies.

-- 3) Bildschirmfotos: PRIVATER Bucket (anders als hotel-logos). Angezeigt wird
--    über kurzlebige signierte Links, die der Server erst nach der
--    Sichtbarkeitsprüfung ausstellt. Pfad: <account_id>/<ticket_id>-<zufall>.<endung>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ticket-screenshots',
  'ticket-screenshots',
  false,
  1048576,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
-- Keine Policies auf storage.objects: Schreiben und Signieren nur über den
-- Secret Key, wie beim Logo.

-- 4) Drei neue Zwecke im Zustellprotokoll: neue Meldung und Rückmeldung eines
--    Kunden an support@, Antwort des RoSe-Teams an die meldende Person.
alter table mail_log drop constraint if exists mail_log_purpose_check;
alter table mail_log add constraint mail_log_purpose_check
  check (purpose in ('invite', 'recovery', 'guest_access', 'sim_confirm', 'email_change', 'email_changed',
                     'ticket_new', 'ticket_reply', 'ticket_answer'));
