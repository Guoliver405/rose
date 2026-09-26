-- ============================================================================
-- „Heute keine Reinigung" und „Gast an der Tür" (26.09.2026)
-- ============================================================================
-- 1) room_states.clean_declined_on — Datum (vor Ort), an dem für dieses Zimmer
--    auf die Reinigung verzichtet wurde: vom Gast im Portal („Heute keine
--    Reinigung", nur in Häusern mit Routine) oder von der Reinigungskraft an
--    der Tür („heute nicht"). Verfällt von selbst: gilt nur, solange das Datum
--    heute ist — kein Cron. „Zimmer reinigen" hebt es auf.
--
-- 2) staff_log — zwei neue Stiche als Nachweis der Kraft:
--      clean_deferred — „bitte später" (in 30 min / in 1 h); die Uhrzeit steht
--                       in room_states.clean_not_before
--      clean_declined — „heute nicht"; zählt NICHT als Reinigung
--
-- 3) Audit-Trigger: protokolliert clean_declined_on mit, damit der
--    Zimmer-Verlauf zeigt, wer verzichtet hat (Quelle guest bzw. maid).
--
-- Rein additiv: Alter Code liest und schreibt die neue Spalte nicht und
-- nutzt die neuen Stich-Arten nicht — gefahrlos VOR dem Code-Push.
-- ============================================================================

-- 1) Verzicht für heute
alter table room_states add column if not exists clean_declined_on date;

-- 2) Stich-Arten
alter table staff_log drop constraint if exists staff_log_kind_check;

alter table staff_log add constraint staff_log_kind_check check (kind in (
  'shift_start', 'shift_end',
  'break_start', 'break_end',
  'other_cleaning',              -- historisch: Einzelstich ohne Ende
  'other_start', 'other_end',
  'clean_start', 'clean_done', 'clean_aborted',
  'clean_deferred', 'clean_declined'  -- neu: Gast an der Tür
));

-- 3) Audit-Trigger
alter table room_state_transitions drop constraint if exists room_state_transitions_field_check;
alter table room_state_transitions add constraint room_state_transitions_field_check
  check (field in ('guest_signal', 'checkout_pending', 'priority', 'clean_declined_on'));

create or replace function log_room_state_transitions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  src text := coalesce(new.last_update_source, 'unknown');
begin
  if tg_op = 'INSERT' then
    return new;  -- Initialzustand ist kein Wechsel
  end if;

  if new.guest_signal is distinct from old.guest_signal then
    insert into room_state_transitions (room_id, hotel_id, field, old_value, new_value, source, actor_id)
    values (new.room_id, new.hotel_id, 'guest_signal', old.guest_signal, new.guest_signal, src, new.last_updated_by);
  end if;

  if new.checkout_pending is distinct from old.checkout_pending then
    insert into room_state_transitions (room_id, hotel_id, field, old_value, new_value, source, actor_id)
    values (new.room_id, new.hotel_id, 'checkout_pending', old.checkout_pending::text, new.checkout_pending::text, src, new.last_updated_by);
  end if;

  if new.priority is distinct from old.priority then
    insert into room_state_transitions (room_id, hotel_id, field, old_value, new_value, source, actor_id)
    values (new.room_id, new.hotel_id, 'priority', old.priority::text, new.priority::text, src, new.last_updated_by);
  end if;

  if new.clean_declined_on is distinct from old.clean_declined_on then
    insert into room_state_transitions (room_id, hotel_id, field, old_value, new_value, source, actor_id)
    values (new.room_id, new.hotel_id, 'clean_declined_on', old.clean_declined_on::text, new.clean_declined_on::text, src, new.last_updated_by);
  end if;

  return new;
end;
$$;
