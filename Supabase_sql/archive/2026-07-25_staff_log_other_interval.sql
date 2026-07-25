-- ============================================================================
-- STAFF_LOG — „Sonstige Reinigung" als Zeitraum statt Stich (25.07.2026)
-- ============================================================================
-- Bisher war `other_cleaning` ein einzelner Stich ohne Ende: die dafür
-- aufgewendete Zeit ließ sich nicht ausweisen und landete in der Auswertung
-- im Sammelposten „Übrige Zeit". Mit `other_start`/`other_end` wird daraus
-- ein echtes Intervall.
--
-- Nur der erlaubte Wertebereich wird erweitert — `other_cleaning` bleibt
-- gültig, damit die bereits gestochenen Alt-Einträge erhalten und zählbar
-- bleiben. Alter Code läuft unverändert weiter, also gefahrlos VOR dem
-- Code-Push einspielbar.
-- ============================================================================

alter table staff_log drop constraint if exists staff_log_kind_check;

alter table staff_log add constraint staff_log_kind_check check (kind in (
  'shift_start', 'shift_end',
  'break_start', 'break_end',
  'other_cleaning',              -- historisch: Einzelstich ohne Ende
  'other_start', 'other_end',    -- neu: sonstige Reinigung als Zeitraum
  'clean_start', 'clean_done', 'clean_aborted'
));
