-- ============================================================================
-- Check-out-Aufstellung — 09.09.2026
--
-- Beim Check-out soll die Rezeption in einer Sekunde sehen, ob noch etwas zu
-- kassieren ist. Dafür fehlen dem Service-Baukasten genau zwei Dinge:
--
--   1) Ein dritter Zustand. Der Lifecycle war `open -> done`; was bestellt,
--      aber nicht erbracht wurde, ließ sich gar nicht ausdrücken. Auf der
--      Aufstellung muss es aber gekennzeichnet und aus der Summe heraus sein.
--      `done_at`/`done_by` behalten ihre Bedeutung als „abgeschlossen am/durch"
--      — welcher der beiden Endzustände es war, sagt `status`. Bewusst KEIN
--      zweites Spaltenpaar: zwei parallel gepflegte Zeitstempel laufen
--      auseinander.
--
--   2) Der Servicename als Snapshot. Die Optionen sind seit v1 in
--      `items_snapshot` eingefroren, der Name kam aus dem Join — eine spätere
--      Umbenennung im Baukasten hätte alte Aufstellungen rückwirkend geändert.
--      Auf einem gedruckten Blatt fällt genau das auf.
--
-- Additiv: Alt-Code schreibt nie 'cancelled' und liest `service_name` nicht.
-- Darf also vor dem Deployment eingespielt werden.
-- ============================================================================

-- 1) Dritter Zustand ------------------------------------------------------
alter table service_orders drop constraint if exists service_orders_status_check;
alter table service_orders add constraint service_orders_status_check
  check (status in ('open', 'done', 'cancelled'));

comment on column service_orders.status is
  'open = offen · done = erbracht (zählt in die Check-out-Aufstellung) · cancelled = nicht erbracht (gekennzeichnet, zählt nicht). done_at/done_by tragen in beiden Endzuständen Zeitpunkt und Person.';

-- 2) Servicename einfrieren ----------------------------------------------
alter table service_orders add column if not exists service_name text;

-- Bestand nachziehen: solange nichts umbenannt wurde, ist der Join die
-- richtige Quelle. Danach steht der Name fest.
update service_orders o
   set service_name = d.name
  from service_definitions d
 where d.id = o.service_id
   and o.service_name is null;

comment on column service_orders.service_name is
  'Servicename zum Bestellzeitpunkt (Snapshot wie items_snapshot). NULL bei Alt-Zeilen ohne Definition — der Code fällt dann auf den Join zurück.';
