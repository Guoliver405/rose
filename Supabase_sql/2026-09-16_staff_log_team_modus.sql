-- ============================================================================
-- Team-Modus: Tätigkeiten ohne Personenbezug — 16.09.2026
--
-- In manchen Ländern und Betrieben darf oder soll die Arbeit einzelner
-- Kräfte nicht nachvollziehbar sein (Leistungsmessung, Betriebsrat,
-- Datenschutz). Das Haus soll trotzdem wissen, WANN welches Zimmer gereinigt
-- wurde und wie viel das Team leistet — nur nicht, WER es war.
--
-- Die Stiche in `staff_log` hängen aber an Zustandsmaschinen je Person:
-- Schicht → Pause → Zimmer; „Reinigung starten" erlaubt danach nur
-- „abschließen"; der Stale-Reaper braucht die Kraft. Deshalb wird beim
-- Schreiben NICHTS weggelassen — die Zuordnung wird gelöscht, sobald sie
-- nicht mehr gebraucht wird: beim Schichtende die Stiche der Schicht, und
-- mit jedem Schichtbeginn alles, was älter als 24 h ist (Stale-Reaper,
-- vergessene Schichtenden, Rezeptions-Stiche).
--
-- Damit die Auswertung danach noch Zeiträume bilden kann (Schicht, Pause,
-- Zimmer), trägt jeder Stich einen Zufallsschlüssel je Schicht: `session_id`.
-- Er paart Anfang und Ende einer Schicht, verkettet aber keine Tage — aus
-- der Session lässt sich keine Person ableiten. Ein Schlüssel je Schicht,
-- nicht je Kraft.
--
-- `profile_id` wird dafür nullable. Die Kaskade `on delete cascade` bleibt
-- für noch zugeordnete Zeilen (laufende Schicht) bestehen; anonymisierte
-- Zeilen überleben das Löschen der Kraft von selbst.
--
-- Additiv: Alt-Code schreibt weiter `profile_id`, liest `session_id` nicht.
-- Bestandszeilen ohne `session_id` lassen sich nach der Anonymisierung nicht
-- mehr paaren — die Auswertung weist sie als „ohne Zuordnung" aus.
-- ============================================================================

alter table staff_log
  alter column profile_id drop not null;

alter table staff_log
  add column if not exists session_id uuid;

create index if not exists idx_staff_log_session on staff_log(session_id, at);

comment on column staff_log.session_id is
  'Zufallsschlüssel je Schicht (gesetzt beim Schichtbeginn, an jedem Stich der Schicht). Paart Zeiträume auch nach der Anonymisierung im Team-Modus; verkettet keine Tage.';
comment on column staff_log.profile_id is
  'Kraft, die gestochen hat. NULL im Team-Modus nach dem Schichtende bzw. nach 24 h (policies.staffTracking = team) — der Stich bleibt, die Person nicht.';
