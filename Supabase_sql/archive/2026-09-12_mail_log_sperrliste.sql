-- ----------------------------------------------------------------------------
-- Sperrliste selbst erkennen und lösen (12.09.2026, zweiter Schritt)
--
-- Der Produktionslauf hat gezeigt: Nach einem harten Bounce setzt Resend die
-- Adresse auf seine Sperrliste und liefert spätere Mails dorthin still nicht
-- mehr aus. Ohne Gedächtnis sähe die Rezeption beim nächsten Versuch nur
-- „übergeben" und wartete vergeblich — und niemand außer uns könnte es lösen.
--
-- Zwei Spalten geben dem Protokoll das Gedächtnis, ohne Adressen zu speichern:
--   recipient_hash    — SHA-256 der Adresse (erste 32 Hex), wie ip_hash bei
--                       der Gast-Anmeldung. Frage: „hat DIESE Adresse schon
--                       einmal abgewiesen?" — dann wird vor dem Senden gewarnt,
--                       mit Grund und Datum, und die Freigabe angeboten.
--   recipient_domain  — der Teil hinter dem @, kein Personenbezug. Frage: „lehnt
--                       dieser PROVIDER uns ab?" — zwei verschiedene Adressen
--                       abgewiesen, keine zugestellt (src/lib/mail-status.ts,
--                       domainPattern). Keine gepflegte Liste: das Muster
--                       entsteht aus dem Protokoll und erlischt von selbst.
--
-- Dazu der Status `suppressed` (Ereignis email.suppressed von Resend).
--
-- ADDITIV — Spalten nullable, alter Code läuft weiter. Reihenfolge: erst
-- einspielen, dann pushen. Der Status-Check wird ersetzt, weil der neue Code
-- `suppressed` schreibt; ohne die Migration scheitert das Update still.
-- ----------------------------------------------------------------------------

alter table mail_log
  add column if not exists recipient_hash   text,
  add column if not exists recipient_domain text;

alter table mail_log drop constraint if exists mail_log_status_check;
alter table mail_log add constraint mail_log_status_check
  check (status in ('queued', 'sent', 'delayed', 'delivered', 'complained', 'bounced', 'suppressed', 'failed'));

-- „Hat diese Adresse schon einmal abgewiesen?"
create index if not exists idx_mail_log_recipient_hash on mail_log(recipient_hash, created_at desc);
-- „Lehnt dieser Provider uns ab?"
create index if not exists idx_mail_log_recipient_domain on mail_log(recipient_domain, created_at desc);

comment on column mail_log.recipient_hash is
  'SHA-256 der Empfängeradresse, erste 32 Hex-Zeichen. Nie die Adresse selbst.';
comment on column mail_log.recipient_domain is
  'Domain hinter dem @ — für die Erkennung von Providern, die unsere Mails ablehnen.';
