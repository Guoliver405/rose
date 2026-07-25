-- ============================================================================
-- PROFILES.DEACTIVATED_AT — Deaktivieren statt Löschen (25.07.2026)
-- ============================================================================
-- Beim Löschen einer Reinigungskraft räumt die FK-Kaskade ihren staff_log mit
-- ab — für Arbeitsnachweise fatal. Ausgeschiedene Kräfte werden deshalb
-- deaktiviert: Login (Username+PIN UND QR-Karte) wird abgewiesen, das Profil
-- bleibt samt Historie erhalten. Hartes Löschen bleibt als Notausgang für
-- versehentlich angelegte Konten.
--
-- Additiv — alter Code läuft unverändert (Spalte ist NULL = aktiv).
-- ============================================================================

alter table profiles add column if not exists deactivated_at timestamptz;

-- Aktive Kräfte je Hotel sind der Normalfall aller Listen-Queries.
create index if not exists idx_profiles_active
  on profiles(hotel_id) where deactivated_at is null;
