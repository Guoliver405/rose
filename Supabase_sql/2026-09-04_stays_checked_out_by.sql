-- ============================================================================
-- Check-out attribuieren: stays.checked_out_by
--
-- Der Zimmer-Verlauf nennt beim Check-in die Person (stays.created_by), beim
-- Check-out bisher pauschal „Rezeption" — es gab keine Spalte dafür. Beide
-- Ereignisse desselben Aufenthalts trugen so unterschiedliche Namen (Befund
-- aus dem Testlauf am 04.09.2026). Der checkout_pending-Übergang im Audit
-- trägt den Akteur zwar, wird im Verlauf aber bewusst als Dublette
-- übersprungen; ihn zeitlich zurückzurechnen wäre eine Heuristik.
--
-- Gleiche Semantik wie created_by: Verweis auf profiles, `on delete set null`
-- — die Person darf verschwinden, der Aufenthalt bleibt und verliert nur den
-- Namen. Alt-Aufenthalte behalten NULL und werden weiter als „Rezeption"
-- angezeigt.
--
-- REIN ADDITIV. Erst einspielen, dann den Code pushen — checkOutAction
-- schreibt die Spalte ab dem nächsten Deploy.
-- ============================================================================

alter table stays
  add column if not exists checked_out_by uuid references profiles(id) on delete set null;
