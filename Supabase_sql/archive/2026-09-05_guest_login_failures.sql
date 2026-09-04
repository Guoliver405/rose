-- ----------------------------------------------------------------------------
-- IP-Drossel für die Gast-Anmeldung (05.09.2026)
--
-- Bisher limitierte nur der Aufenthalt selbst (`stays.pin_attempts`: fünf
-- Fehlversuche → 15 Minuten Sperre). Das schützt die PIN EINES Zimmers, nicht
-- das Haus: wer von außen alle Zimmernummern durchprobiert, sperrt mit fünf
-- Versuchen je Zimmer nacheinander jeden echten Gast aus und erfährt dabei,
-- welche Nummern existieren.
--
-- Deshalb zusätzlich ein Protokoll der Fehlversuche je Absender-IP über alle
-- Häuser hinweg. Die Anwendung wertet es als gleitendes Fenster aus (Schwelle
-- und Fenster in src/lib/login-throttle.ts, Stand 30 Fehlversuche / 15 min);
-- Erfolge werden nicht festgehalten.
--
-- Eine Zeile je Fehlversuch statt eines Zählers: kein Lese-Schreib-Rennen,
-- echtes Gleiten. Klein bleibt die Tabelle, weil jeder Fehlversuch zugleich
-- alle Zeilen löscht, die aus dem Fenster gefallen sind — kein Cron.
--
-- Datenschutz: Eine IP-Adresse ist personenbezogen. Gespeichert wird nur ein
-- SHA-256-Hash (32 Hex-Zeichen), und die Zeilen leben Minuten, nicht Tage.
-- Der Bezug zum Haus kaskadiert mit dessen Löschung; er dient nur der
-- Diagnose („welches Haus wird gerade abgeklopft?").
--
-- ADDITIV — neue Tabelle, alter Code läuft weiter. Reihenfolge: erst
-- einspielen, dann pushen (der neue Code liest die Tabelle sofort).
-- ----------------------------------------------------------------------------

create table if not exists guest_login_failures (
  id            bigint generated always as identity primary key,
  ip_hash       text not null,
  hotel_id      uuid references hotels(id) on delete cascade,
  attempted_at  timestamptz not null default now()
);

-- Die Abfrage der Anwendung: jüngste Versuche EINER IP im Fenster.
create index if not exists idx_guest_login_failures_ip_time
  on guest_login_failures(ip_hash, attempted_at desc);

-- Das Aufräumen: alles vor dem Fenster, über alle IPs.
create index if not exists idx_guest_login_failures_time
  on guest_login_failures(attempted_at);

-- Keine Policies: gelesen und geschrieben wird ausschließlich über den
-- Admin-Client (die Gäste sind zu diesem Zeitpunkt nicht angemeldet). Mit
-- aktivierter RLS und ohne Policy sieht der Publishable Key nichts.
alter table guest_login_failures enable row level security;

comment on table guest_login_failures is
  'Fehlversuche der Gast-Anmeldung je Absender-IP (pseudonymisiert). '
  'Grundlage der IP-Drossel; Zeilen außerhalb des Fensters werden bei jedem '
  'Fehlversuch gelöscht.';
comment on column guest_login_failures.ip_hash is
  'SHA-256 der Absender-IP, erste 32 Hex-Zeichen. Nie die Adresse selbst.';
