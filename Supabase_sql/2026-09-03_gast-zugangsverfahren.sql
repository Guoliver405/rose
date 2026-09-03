-- ----------------------------------------------------------------------------
-- Zwei Gast-Zugangsverfahren (03.09.2026)
--
-- 1) 'pin'  — Fester QR-Code je Zimmer (hängt im Zimmer) + 6-stellige PIN je
--             Aufenthalt. Der Standardfall und der bisherige Weg.
-- 2) 'link' — Individueller QR/Link je Aufenthalt, ohne PIN. Wird beim
--             Check-in ausgehändigt (Ausdruck oder Mail) und erlischt mit dem
--             Check-out.
--
-- Das Verfahren wird **am Aufenthalt festgehalten**, nicht bei jedem Zugriff
-- aus der Hotel-Einstellung gelesen. Dadurch bleibt ein Wechsel der Einstellung
-- folgenlos für laufende Aufenthalte: ausgegebene Zugänge funktionieren bis zum
-- Check-out weiter, erst der nächste Check-in folgt dem neuen Verfahren. Kein
-- Stichtag, keine Sonderbehandlung.
--
-- `pin` wird nullable: Bei 'link' entsteht **keine** PIN. Eine erzeugte, nie
-- ausgegebene PIN wäre ein toter zweiter Zugangsweg — genau das soll das
-- individuelle Verfahren ja vermeiden.
--
-- ADDITIV — alter Code läuft weiter (Default 'pin', `pin` bleibt bei allen
-- bestehenden Zeilen gefüllt). Reihenfolge: erst einspielen, dann pushen.
-- ----------------------------------------------------------------------------

alter table stays
  add column if not exists access_mode text not null default 'pin',
  add column if not exists guest_token text;

-- Erst nach dem Anlegen, damit die Spalte in beiden Fällen existiert.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'stays_access_mode_check'
  ) then
    alter table stays
      add constraint stays_access_mode_check check (access_mode in ('pin', 'link'));
  end if;
end $$;

-- Der Token ist global eindeutig — er trägt den Mandanten selbst und bleibt
-- deshalb wie der Zimmer-Token über jeden Routing-Umbau hinweg gültig.
create unique index if not exists idx_stays_guest_token
  on stays(guest_token) where guest_token is not null;

alter table stays alter column pin drop not null;

-- Selbstsichernd: jedes Verfahren braucht genau seinen Zugangsweg. Ohne diese
-- Bedingung könnte ein Aufenthalt entstehen, auf den niemand mehr zugreifen
-- kann — beim Check-in fällt das erst dem Gast auf.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'stays_zugangsweg_vorhanden'
  ) then
    alter table stays add constraint stays_zugangsweg_vorhanden check (
      (access_mode = 'pin'  and pin is not null)
      or
      (access_mode = 'link' and guest_token is not null)
    );
  end if;
end $$;

comment on column stays.access_mode is
  'Zugangsverfahren dieses Aufenthalts, beim Check-in aus hotels.policies '
  '(guestAccessMode) festgehalten. Ein späterer Wechsel der Einstellung '
  'berührt laufende Aufenthalte nicht.';
comment on column stays.guest_token is
  'Nur bei access_mode = link: individueller Zugang ohne PIN, global '
  'eindeutig, erlischt mit dem Check-out.';
