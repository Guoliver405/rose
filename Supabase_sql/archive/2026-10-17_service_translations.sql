-- ============================================================================
-- Mehrsprachiger Service-Baukasten (17.10.2026)
-- Bauplan: Sessions/Sprachen-des-Hauses-Plan-2026-10-17.md, Abschnitt 3
--
-- Das Haus legt Services in seiner Heimatsprache an und übersetzt selbst –
-- keine automatische Übersetzung (Entscheidung des Users). Die vorhandenen
-- Spalten (`name`, `description`, `label`) bleiben die Grundtexte;
--
--   service_definitions.lang          Sprache der Grundtexte dieser Zeile.
--                                     Ändert das Haus später seine
--                                     Heimatsprache, bleibt erkennbar, worin ein
--                                     Bestand geschrieben ist. Bestand: 'de'.
--   service_definitions.translations  { "en": { "name": …, "description": … } }
--   service_items.translations        { "en": { "label": … } }
--
-- Das Gästeportal zeigt je Feld die Sprache des Gastes, sonst den Grundtext.
-- Anfragen frieren weiter den Grundtext ein (`service_name`,
-- `items_snapshot`) – die Rezeption sieht sie in der Sprache des Hauses.
--
-- Additiv mit Vorgaben: Alt-Code kennt die Spalten nicht und schreibt weiter
-- nur die Grundtexte. Vor dem Push einspielen.
-- ============================================================================

alter table service_definitions
  add column if not exists lang text not null default 'de',
  add column if not exists translations jsonb not null default '{}'::jsonb;

alter table service_items
  add column if not exists translations jsonb not null default '{}'::jsonb;

alter table service_definitions
  drop constraint if exists service_definitions_translations_object;
alter table service_definitions
  add constraint service_definitions_translations_object
  check (jsonb_typeof(translations) = 'object');

alter table service_items
  drop constraint if exists service_items_translations_object;
alter table service_items
  add constraint service_items_translations_object
  check (jsonb_typeof(translations) = 'object');

comment on column service_definitions.lang is
  'Sprache der Grundtexte (name, description) dieses Service, z. B. de. Gesetzt beim Anlegen aus der Heimatsprache des Hauses.';
comment on column service_definitions.translations is
  'Übersetzungen je Sprache: { "en": { "name": "…", "description": "…" } }. Fehlt ein Feld, zeigt das Gästeportal den Grundtext.';
comment on column service_items.translations is
  'Übersetzungen der Option je Sprache: { "en": { "label": "…" } }. Fehlt sie, zeigt das Gästeportal den Grundtext.';
