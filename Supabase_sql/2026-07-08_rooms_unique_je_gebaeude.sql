-- ============================================================================
-- Zimmernummern: eindeutig je Gebäudeteil statt hotelweit.
--
-- Vorher: unique (hotel_id, number) — Nebenhaus 101 kollidierte mit
-- Haupthaus 101. Jetzt gilt die Nummer je Gebäudeteil.
--
-- NULLS NOT DISTINCT ist wichtig: Zimmer OHNE Gebäudeteil (building IS NULL)
-- bilden gemeinsam eine Gruppe — sonst wären dort doppelte Nummern erlaubt.
--
-- Code-Seite (gleicher Commit): rooms-Upsert nutzt
-- onConflict 'hotel_id,building,number'; Gast-Login prüft die PIN gegen
-- alle Zimmer gleicher Nummer (PIN entscheidet bei Duplikaten).
-- ============================================================================

alter table rooms drop constraint rooms_hotel_id_number_key;

alter table rooms add constraint rooms_hotel_building_number_key
  unique nulls not distinct (hotel_id, building, number);
