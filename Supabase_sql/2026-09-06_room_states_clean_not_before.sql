-- 2026-09-06 — „Frühestens ab": Gast wünscht Reinigung, aber nicht vor einer Uhrzeit.
--
-- Der Gast setzt weiter guest_signal = 'please_clean'; zusätzlich kann er den
-- Wunsch bis zu einer vom Haus begrenzten Uhrzeit aufschieben
-- (policies.cleanDeferEnabled / cleanDeferUntil, Default an / 11:00). Bis zum
-- Zeitpunkt gilt das Zimmer auf den Boards als nicht aktiv („Reinigung ab
-- HH:MM"), danach wie jeder Wunsch. Reine Ableitung im Code (`isCleanDeferred`),
-- die Spalte zählt nur, solange guest_signal = 'please_clean' ist.
--
-- Additiv, NULL erlaubt. Einspielen VOR dem Push, weil die Loader sie lesen.

alter table room_states add column if not exists clean_not_before timestamptz;

comment on column room_states.clean_not_before is
  'Gast-Wunsch „Reinigung frühestens ab" (Zeitpunkt). Nur relevant, solange guest_signal = please_clean.';
