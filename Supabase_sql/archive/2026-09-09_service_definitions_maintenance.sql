-- ============================================================================
-- Instandhaltung als eigene Art von Service — 09.09.2026
--
-- Bis hierher unterschied der Baukasten Services nur über `urgent` (blinkt die
-- Glocke?) und den Preis. Für die Check-out-Aufstellung hat der Preis als
-- Abgrenzung gereicht: Was nichts kostet, steht nicht drauf. Für den
-- LEBENSZYKLUS reicht er nicht.
--
-- Der Check-out schließt offene Anfragen des Aufenthalts. Das ist richtig für
-- alles, was der Gast bestellt hat — aber falsch für einen gemeldeten Defekt:
-- Der hört nicht auf zu existieren, weil der Gast abreist. Er verschwände vom
-- Board, und der nächste Gast zöge in ein kaputtes Zimmer.
--
-- Der Preis kann diese Unterscheidung nicht treffen: Kostenfreie Extra-
-- Handtücher gehören zum Aufenthalt, ein kostenpflichtiger Handwerker-Einsatz
-- zum Zimmer. Deshalb ein ausdrückliches Kennzeichen.
--
-- `maintenance = true` bedeutet: **gehört zum Zimmer, nicht zum Aufenthalt.**
-- Daraus folgt dreierlei — offen über den Check-out hinaus, nie auf einer
-- Aufstellung (auch mit Preis), und beim Check-in eine Warnung.
--
-- Additiv mit Default `false`: Alt-Code kennt die Spalte nicht.
-- ============================================================================

alter table service_definitions
  add column if not exists maintenance boolean not null default false;

comment on column service_definitions.maintenance is
  'true = Meldung ans Haus (Defekt, Instandhaltung): gehört zum Zimmer, nicht zum Aufenthalt. Bleibt beim Check-out offen, steht auf keiner Check-out-Aufstellung und warnt beim Check-in.';

-- Bestand: „Technischer Dienst" stammt ausnahmslos aus der Vorlage in
-- service-templates.json (kostenfrei, dringend) und ist genau dieser Fall.
-- Eng auf diesen Namen begrenzt — alles andere wäre geraten.
update service_definitions
   set maintenance = true
 where name = 'Technischer Dienst'
   and maintenance = false;
