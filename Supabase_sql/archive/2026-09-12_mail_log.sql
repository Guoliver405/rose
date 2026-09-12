-- ----------------------------------------------------------------------------
-- Zustellprotokoll für Mails (12.09.2026)
--
-- Bis dahin wusste die Anwendung nur, ob ein Versand ANGENOMMEN wurde:
-- Supabase-SMTP bzw. Resend antworteten 200, fertig. Ob Freenet die Mail eine
-- Sekunde später abwies, stand allein im Resend-Log — die Rezeption sagte dem
-- Gast „ist unterwegs", die Mail kam nie an. Seit heute verschickt die
-- Anwendung ALLE Mails selbst über Resend (auch Einladung und Passwort-Link;
-- Supabase liefert nur noch den Link), und Resend meldet jeden Schritt per
-- Webhook zurück: übergeben → zugestellt oder abgewiesen, mit Grund. Diese
-- Tabelle hält den Stand, die Oberfläche fragt ihn nach dem Senden eine
-- Minute lang nach. Zugleich ist sie die Drossel: eine Mail je Bezug und
-- Minute (src/lib/mail-status.ts).
--
-- Datenschutz: KEINE Adresse. Der Bezug ist eine ID — Auth-Konto (Einladung,
-- Passwort), Aufenthalt (Gast-Zugang) — und die kaskadiert mit ihrem Gegen-
-- stand; `stays` bleibt anonym. Der Bounce-Text des Empfänger-Servers kann
-- die Adresse enthalten, deshalb löscht jeder Versand Zeilen, die älter als
-- 30 Tage sind (kein Cron).
--
-- ADDITIV — neue Tabelle. Reihenfolge: erst einspielen, dann pushen (der
-- neue Code schreibt sie beim ersten Versand).
-- ----------------------------------------------------------------------------

create table if not exists mail_log (
  id          uuid primary key default gen_random_uuid(),
  purpose     text not null check (purpose in ('invite', 'recovery', 'guest_access')),
  status      text not null default 'queued'
              check (status in ('queued', 'sent', 'delayed', 'delivered', 'complained', 'bounced', 'failed')),
  -- Kennung bei Resend; null, wenn die Übergabe selbst scheiterte.
  resend_id   text unique,
  -- Grund (Bounce-Text des Empfängers, Fehlermeldung von Resend).
  detail      text,
  hotel_id    uuid references hotels(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  stay_id     uuid references stays(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Die Drossel: jüngste Zeile je Bezug und Zweck.
create index if not exists idx_mail_log_user_purpose on mail_log(user_id, purpose, created_at desc);
create index if not exists idx_mail_log_stay_purpose on mail_log(stay_id, purpose, created_at desc);
-- Das Aufräumen.
create index if not exists idx_mail_log_created on mail_log(created_at);

-- Keine Policies: gelesen und geschrieben wird ausschließlich über den
-- Admin-Client (Webhook und Server-Actions). Die Status-Abfrage der
-- Oberfläche läuft über die unratbare Zeilen-ID.
alter table mail_log enable row level security;

comment on table mail_log is
  'Zustellprotokoll der von RoSe über Resend verschickten Mails. Keine Adressen; '
  'Bezug über Auth-Konto oder Aufenthalt. Zeilen älter als 30 Tage werden beim '
  'nächsten Versand gelöscht.';
