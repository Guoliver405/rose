-- 2026-09-06 — Geplantes Abreisedatum am Aufenthalt (optional).
--
-- RoSe kennt bewusst kein Buchungssystem und damit kein Abreisedatum. Für
-- die Stayover-Routine ist das ein Problem: Am Abreisetag darf nicht vor dem
-- Check-out gereinigt werden, sonst wird das Zimmer doppelt gemacht. Die
-- Rezeption kann das Datum deshalb beim Check-in mitgeben (Nächte oder
-- Datum) oder später im Zimmer-Dialog nachtragen; ohne Datum greift die
-- Check-out-Zeit des Hauses (policies.checkoutUntil) als Untergrenze der
-- Routine.
--
-- Additiv, NULL erlaubt — alter Code liest die Spalte einfach nicht.
-- Einspielen VOR dem Push, weil die Loader sie danach selektieren.

alter table stays add column if not exists expected_checkout date;

comment on column stays.expected_checkout is
  'Geplanter Abreisetag (lokales Datum), optional. Am Abreisetag keine Routine-Reinigung; Rezeption kann ihn jederzeit ändern.';
