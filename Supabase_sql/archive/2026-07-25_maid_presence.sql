-- ============================================================================
-- MAID_PRESENCE — Etagen-Verortung der Reinigungskräfte (25.07.2026)
-- ============================================================================
-- Das Reinigungsboard bekommt eine Etagen-Zwischenebene: die Kraft "bucht
-- sich" auf eine Etage ein. Die Verortung ist live für Kolleginnen (Etagen-
-- Übersicht) und die Rezeption (Etagen-Header der Zimmer-Übersicht) sichtbar.
--
-- Eine Zeile pro Kraft (PK = profile_id, UPSERT beim Etagenwechsel).
-- Gelöscht wird beim Schichtende und beim "Zurück"-Button; vergessene
-- Zeilen werden im Loader über entered_at ignoriert (Stale-Guard, 16 h).
--
-- Additiv — alter Code läuft unverändert. Reihenfolge: erst einspielen,
-- dann den zugehörigen Code-Push deployen lassen.
-- ============================================================================

create table if not exists maid_presence (
  profile_id  uuid primary key references profiles(id) on delete cascade,
  hotel_id    uuid not null references hotels(id) on delete cascade,
  building    text,
  floor       int not null,
  entered_at  timestamptz not null default now()
);

create index if not exists idx_maid_presence_hotel on maid_presence(hotel_id);

alter table maid_presence enable row level security;

-- Lesen dürfen alle Hotel-Mitglieder (Board + Rezeption); Schreiben läuft
-- wie überall ausschließlich serverseitig über den Secret-Key-Client.
drop policy if exists "maid_presence_select_member" on maid_presence;
create policy "maid_presence_select_member" on maid_presence
  for select using (is_hotel_member(hotel_id));

-- Realtime: beide Portale hören auf Verortungs-Änderungen.
do $$
begin
  begin
    alter publication supabase_realtime add table maid_presence;
  exception when duplicate_object then null;
  end;
end $$;
