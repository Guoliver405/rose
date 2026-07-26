-- ============================================================================
-- Mandantenfähigkeit: hotels.slug
--
-- Der Slug trägt den Mandanten in die URL (/h/<slug>/guest,
-- /h/<slug>/service/login). Vorher lösten die beiden öffentlichen Formular-
-- Logins Zimmernummer bzw. Benutzername über ALLE Hotels hinweg auf — beides
-- ist nur je Hotel eindeutig (unique (hotel_id, number) / (hotel_id, username)).
--
-- Testbetrieb: Backfill und PIN-Umstellung laufen in einem Rutsch, es gibt
-- keine schützenswerten Bestandsdaten. Reihenfolge trotzdem sauber:
-- Migration einspielen, DANN Code pushen (der Code erwartet den Slug).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Slug-Erzeugung in SQL — nur für den Backfill unten.
--    Maßgeblich im Anwendungscode ist src/lib/slug.ts (gleiche Regeln).
-- ----------------------------------------------------------------------------
create or replace function rose_slugify(raw text)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(
      trim(both '-' from
        regexp_replace(
          regexp_replace(
            lower(
              replace(replace(replace(
                replace(replace(replace(
                  replace(raw, 'ß', 'ss'),
                'ä', 'ae'), 'ö', 'oe'), 'ü', 'ue'),
              'Ä', 'ae'), 'Ö', 'oe'), 'Ü', 'ue')
            ),
            '[^a-z0-9]+', '-', 'g'
          ),
          '-{2,}', '-', 'g'
        )
      ),
      ''
    ),
    'hotel'
  );
$$;

-- ----------------------------------------------------------------------------
-- 2) Spalte + Backfill
--    Bei gleichem Slug gewinnt das ältere Hotel; die weiteren bekommen einen
--    Zähler-Suffix (gleiche Regel wie slugify/uniqueSlug im App-Code).
-- ----------------------------------------------------------------------------
alter table hotels add column if not exists slug text;

update hotels h
set slug = c.candidate
from (
  select
    id,
    case when rn = 1 then base else base || '-' || rn::text end as candidate
  from (
    select
      id,
      left(rose_slugify(name), 60) as base,
      row_number() over (
        partition by left(rose_slugify(name), 60)
        order by created_at, id
      ) as rn
    from hotels
    where slug is null
  ) x
) c
where h.id = c.id
  and h.slug is null;

alter table hotels alter column slug set not null;

create unique index if not exists hotels_slug_key on hotels (slug);

alter table hotels drop constraint if exists hotels_slug_format;
alter table hotels add constraint hotels_slug_format
  check (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$' and length(slug) <= 60);

-- ----------------------------------------------------------------------------
-- 3) PIN-Länge: neuer Default 6 (war 4).
--    10.000 Kombinationen tragen bei einem Haus, nicht bei tausenden
--    gleichzeitigen Aufenthalten. Bestehende Hotels werden hier mitgezogen —
--    im Testbetrieb bewusst, damit alle Mandanten gleich konfiguriert sind.
--    Laufende Aufenthalte behalten ihre bereits vergebene PIN.
-- ----------------------------------------------------------------------------
update hotels
set policies = policies || jsonb_build_object('pinLength', 6)
where coalesce((policies ->> 'pinLength')::int, 4) < 6;

-- ----------------------------------------------------------------------------
-- 4) Aufräumen: die Slug-Funktion wird nach dem Backfill nicht mehr gebraucht.
-- ----------------------------------------------------------------------------
drop function if exists rose_slugify(text);
