-- ============================================================================
-- Verweise im Service-Baukasten — 16.09.2026
--
-- Dritte Art von Service neben „bestellbar" (mit Optionen und Preisen) und
-- „Meldung ans Haus" (Instandhaltung): ein VERWEIS. Das Haus hinterlegt einen
-- Link — Trinkgeld-App fürs Housekeeping-Team, Lieferdienst, Taxi, Stadtplan —
-- und der Gast bekommt im Portal eine Kachel, die nach außen öffnet.
--
-- Ein Verweis erzeugt NIE eine Anfrage: keine Bestellung, keine Zeile auf dem
-- Board der Rezeption, nichts auf der Check-out-Aufstellung. Er hat weder
-- Optionen noch die Kennzeichen `urgent`/`maintenance` (der Code lässt sie
-- auf false und legt keine Optionen an).
--
-- Warum verlinken statt einbetten: Ein Widget oder iframe lädt fremde Skripte
-- ins Gastportal und zieht das Cookie-Banner nach sich, das RoSe bewusst
-- nicht hat (nur technisch notwendige Cookies, siehe Datenschutzerklärung).
-- Ein Link ist ein Link — die Verantwortung für das Ziel liegt beim Haus.
--
-- `link_url IS NOT NULL` ist der Diskriminator. Nur http(s), damit im
-- Gastportal kein `javascript:`- oder `data:`-Ziel landet.
--
-- Additiv, nullable: Alt-Code kennt die Spalte nicht und behandelt jede Zeile
-- als bestellbaren Service — bis zum Deploy gibt es keine Verweise.
-- ============================================================================

alter table service_definitions
  add column if not exists link_url text;

alter table service_definitions
  drop constraint if exists service_definitions_link_url_scheme;
alter table service_definitions
  add constraint service_definitions_link_url_scheme
  check (link_url is null or link_url ~* '^https?://');

comment on column service_definitions.link_url is
  'Nicht null = Verweis: Kachel im Gastportal, die diesen Link nach außen öffnet (Trinkgeld-App, Lieferdienst). Erzeugt nie eine Anfrage, hat keine Optionen.';
