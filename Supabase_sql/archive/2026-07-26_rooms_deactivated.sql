-- ============================================================================
-- Zimmer weich deaktivieren (Vorbereitung der Abrechnung je Zimmer)
--
-- Bisher gab es für Zimmer nur hartes Löschen, und das kaskadiert auf
-- room_guest_tokens, stays, room_states und service_orders. Sobald das Zimmer
-- die Abrechnungseinheit ist, wäre eine Periode danach nicht mehr
-- rekonstruierbar.
--
-- Abrechnungsregel (entschieden 26.07.2026):
--   Jedes Zimmer, das in der Periode AUCH NUR VORÜBERGEHEND aktiv war, zählt.
--   Zimmer, die über die ganze Periode deaktiviert waren, zählen nicht.
--
-- Damit ist die Messgröße eine einzige Abfrage — ohne Snapshots und ohne Cron,
-- passend zur Projektlinie („reine Loader-Ableitung"):
--
--   select count(*) from rooms
--   where hotel_id = $hotel
--     and created_at < $periode_ende
--     and (deactivated_at is null or deactivated_at > $periode_start);
--
-- Voraussetzung dafür ist genau diese Spalte — und dass nicht mehr hart
-- gelöscht wird (Löschen bleibt der Notausgang für Fehlanlagen ohne Historie).
--
-- REIN ADDITIV.
-- ============================================================================

alter table rooms add column if not exists deactivated_at timestamptz;

-- Teil-Index: die Boards fragen fast immer nur die aktiven Zimmer ab.
create index if not exists idx_rooms_hotel_active
  on rooms (hotel_id)
  where deactivated_at is null;

comment on column rooms.deactivated_at is
  'Zimmer außer Betrieb (Renovierung, Rückbau). Nicht auf den Boards, kein '
  'Check-in, kein QR-Aushang. Grundlage der Abrechnung je Zimmer: wer in der '
  'Periode auch nur vorübergehend aktiv war, zählt.';
