-- ============================================================================
-- RoSe (RoomService) — Schema v1
-- ============================================================================
-- Kompakte Ableitung aus HotCord: drei Portale (Rezeption / Reinigung / Gast),
-- KEIN Buchungssystem. Zimmerstatus ist event-getrieben (Check-in-/Check-out-
-- Klick + Gast-Signale), nicht aus Buchungen abgeleitet.
--
-- Einspielen über den Supabase-SQL-Editor. Idempotent geschrieben
-- (IF NOT EXISTS / OR REPLACE), kann gefahrlos erneut laufen.
--
-- Konvention (aus HotCord): neue Migrationen in Supabase_sql/,
-- nach dem Einspielen per `git mv` nach Supabase_sql/archive/.
-- ============================================================================


-- ============================================================================
-- 1) HOTELS — Mandant. UI ist zunächst single-property, Schema hält die Tür
--    für Multi-Tenant offen (hotel_id überall mitgeführt).
-- ============================================================================
create table if not exists hotels (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  -- policies: { "stayoverAutoClean": false, "stayoverAutoCleanTime": "10:00",
  --             "pinLength": 4, "cleaningStaleMinutes": 90 }
  policies    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- 2) PROFILES — Personal (Rezeption/Management + Reinigungskräfte).
--    Discriminator wie in HotCord: username IS NOT NULL  =>  Reinigungskraft.
--    Management-Logins haben username = NULL (E-Mail-Login).
-- ============================================================================
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  hotel_id      uuid not null references hotels(id) on delete cascade,
  display_name  text not null,
  username      text,                -- NULL = Management, sonst Maid-Login-Name
  created_at    timestamptz not null default now(),
  unique (hotel_id, username)
);

create index if not exists idx_profiles_hotel on profiles(hotel_id);

-- ============================================================================
-- 3) ROOMS — bewusst flach: Nummer + Etage + optionaler Gebäudeteil.
--    Keine Grundriss-Geometrie, keine Zimmertypen.
-- ============================================================================
create table if not exists rooms (
  id          uuid primary key default gen_random_uuid(),
  hotel_id    uuid not null references hotels(id) on delete cascade,
  number      text not null,
  floor       int  not null default 0,
  building    text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  unique (hotel_id, number)
);

create index if not exists idx_rooms_hotel on rooms(hotel_id);

-- ============================================================================
-- 4) ROOM_GUEST_TOKENS — statischer QR-Deep-Link pro Zimmer (optional).
--    Der Token ist unguessbar (32 Zeichen base64url) und identifiziert das
--    Zimmer auf /guest/r/<token>; der Gast tippt dann nur noch die PIN.
--    Baseline ohne QR: /guest mit Zimmernummer + PIN.
-- ============================================================================
create table if not exists room_guest_tokens (
  room_id     uuid primary key references rooms(id) on delete cascade,
  hotel_id    uuid not null references hotels(id) on delete cascade,
  token       text not null unique,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- 5) STAYS — anonymer Aufenthalt, erzeugt durch den Check-in-Klick.
--    Trägt die Gast-PIN (Plaintext — bewusst, wie maid_login_tokens.pin in
--    HotCord: die Rezeption muss die PIN jederzeit ablesen können, das
--    Schadenspotenzial ist minimal, die PIN lebt nur bis zum Check-out).
--    session_token wird nach erfolgreicher PIN-Eingabe als Gast-Cookie
--    gesetzt; Check-out beendet den Stay -> beide Wege sofort tot.
-- ============================================================================
create table if not exists stays (
  id                 uuid primary key default gen_random_uuid(),
  hotel_id           uuid not null references hotels(id) on delete cascade,
  room_id            uuid not null references rooms(id) on delete cascade,
  pin                text not null,
  session_token      text not null unique,
  checked_in_at      timestamptz not null default now(),
  checked_out_at     timestamptz,
  -- Rate-Limit gegen PIN-Raten (pro Zimmer/Stay):
  pin_attempts       int not null default 0,
  pin_locked_until   timestamptz,
  created_by         uuid references profiles(id) on delete set null
);

-- Genau EIN aktiver Aufenthalt pro Zimmer — Doppel-Check-in strukturell
-- unmöglich.
create unique index if not exists uq_stays_active_room
  on stays(room_id) where checked_out_at is null;

create index if not exists idx_stays_hotel on stays(hotel_id);

-- ============================================================================
-- 6) ROOM_STATES — der event-getriebene Zimmerstatus. Eine Zeile pro Zimmer
--    (wird bei Zimmer-Anlage miterzeugt). last_updated_at wird von JEDER
--    statusrelevanten Server-Action getoucht -> Realtime-Refresh der Portale.
--
--    Reinigungs-Anzeige-Logik (im Code, nicht in der DB):
--      aktiv      = checkout_pending OR priority OR guest_signal='please_clean'
--      ausgegraut = frei ohne checkout_pending, belegt ohne Signal, DND
--      in Arbeit  = cleaning_by IS NOT NULL
-- ============================================================================
create table if not exists room_states (
  room_id              uuid primary key references rooms(id) on delete cascade,
  hotel_id             uuid not null references hotels(id) on delete cascade,
  guest_signal         text not null default 'none'
                         check (guest_signal in ('none', 'please_clean', 'dnd')),
  checkout_pending     boolean not null default false,
  priority             boolean not null default false,
  cleaning_by          uuid references profiles(id) on delete set null,
  cleaning_started_at  timestamptz,
  last_updated_at      timestamptz not null default now(),
  -- Audit-Attribution (Pattern aus HotCord): Server-Action setzt beide
  -- Spalten im Payload, der Transition-Trigger liest sie.
  last_update_source   text,   -- 'guest' | 'maid' | 'admin' | 'system'
  last_updated_by      uuid
);

create index if not exists idx_room_states_hotel on room_states(hotel_id);

-- ============================================================================
-- 7) ROOM_STATE_TRANSITIONS — vereinfachtes Audit-Log (Beschwerde-Fälle:
--    "Wann war DND aktiv?", "Wann wurde priorisiert?"). Eine Zeile pro
--    geändertem Feld, automatisch per Trigger, append-only.
-- ============================================================================
create table if not exists room_state_transitions (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid not null,
  hotel_id     uuid not null,
  field        text not null check (field in ('guest_signal', 'checkout_pending', 'priority')),
  old_value    text,
  new_value    text,
  source       text not null default 'unknown',
  actor_id     uuid,
  occurred_at  timestamptz not null default now()
);

create index if not exists idx_rst_room on room_state_transitions(room_id, occurred_at desc);
create index if not exists idx_rst_hotel on room_state_transitions(hotel_id, occurred_at desc);

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

  return new;
end;
$$;

drop trigger if exists trg_room_state_transitions on room_states;
create trigger trg_room_state_transitions
  after update on room_states
  for each row execute function log_room_state_transitions();

-- ============================================================================
-- 8) MAID_LOGIN_TOKENS — druckbare QR-Login-Karten für Reinigungskräfte
--    (Pattern 1:1 aus HotCord). PK = profile_id: max. eine aktive Karte pro
--    Kraft, Re-Issue per UPSERT invalidiert die alte Karte als Einheit.
--    PIN im Plaintext, weil der Auto-Login-Endpunkt signInWithPassword
--    braucht — Risiko bei 6-Ziffern-PIN auf gedruckter Karte akzeptiert.
-- ============================================================================
create table if not exists maid_login_tokens (
  profile_id  uuid primary key references profiles(id) on delete cascade,
  hotel_id    uuid not null references hotels(id) on delete cascade,
  token       text not null unique,
  pin         text not null,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- 9) STAFF_LOG — vereinfachtes Tätigkeits-Logging der Reinigungskräfte.
--    Schichtbeginn/-ende rahmen den Tag, clean_start/clean_done bilden die
--    Zimmer-Reinigung ab (Paar-Bildung im Code), Pause und sonstige
--    Reinigung werden nur "gestochen" und mit nichts abgeglichen.
-- ============================================================================
create table if not exists staff_log (
  id          uuid primary key default gen_random_uuid(),
  hotel_id    uuid not null references hotels(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  room_id     uuid references rooms(id) on delete set null,
  kind        text not null check (kind in (
    'shift_start', 'shift_end',
    'break_start', 'break_end',
    'other_cleaning',
    'clean_start', 'clean_done', 'clean_aborted'
  )),
  at          timestamptz not null default now()
);

create index if not exists idx_staff_log_hotel on staff_log(hotel_id, at desc);
create index if not exists idx_staff_log_profile on staff_log(profile_id, at desc);

-- ============================================================================
-- 10) SERVICE-BAUKASTEN — abgespeckt aus HotCord:
--     kein Urgency-Enum (nur urgent-Flag), kein 5-Status-Lifecycle
--     (nur open/done), Preise optional als Anzeige-Info.
-- ============================================================================
create table if not exists service_definitions (
  id           uuid primary key default gen_random_uuid(),
  hotel_id     uuid not null references hotels(id) on delete cascade,
  name         text not null,
  description  text,
  urgent       boolean not null default false,
  sort_order   int not null default 0,
  archived_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_service_defs_hotel on service_definitions(hotel_id);

create table if not exists service_items (
  id           uuid primary key default gen_random_uuid(),
  service_id   uuid not null references service_definitions(id) on delete cascade,
  hotel_id     uuid not null references hotels(id) on delete cascade,
  label        text not null,
  price_cents  int,               -- NULL = ohne Preisangabe
  sort_order   int not null default 0,
  archived_at  timestamptz
);

create index if not exists idx_service_items_service on service_items(service_id);

create table if not exists service_orders (
  id              uuid primary key default gen_random_uuid(),
  hotel_id        uuid not null references hotels(id) on delete cascade,
  room_id         uuid not null references rooms(id) on delete cascade,
  stay_id         uuid references stays(id) on delete set null,
  service_id      uuid not null references service_definitions(id) on delete restrict,
  -- immutabler Snapshot der bestellten Items (Name/Preis zum Bestellzeitpunkt),
  -- damit spätere Baukasten-Änderungen alte Orders nicht verfälschen:
  items_snapshot  jsonb not null default '[]',
  note            text,
  status          text not null default 'open' check (status in ('open', 'done')),
  created_at      timestamptz not null default now(),
  done_at         timestamptz,
  done_by         uuid references profiles(id) on delete set null
);

create index if not exists idx_service_orders_hotel on service_orders(hotel_id, status, created_at desc);
create index if not exists idx_service_orders_room on service_orders(room_id);

-- ============================================================================
-- RLS — bewusst schlank:
--   * Lese-Policies für eingeloggtes Personal (Management + Reinigung).
--   * KEINE Schreib-Policies: alle Mutationen laufen serverseitig über den
--     Secret-Key-Client nach manueller Auth-Prüfung (HotCord-Faustregel,
--     weil RLS-blockierte UPDATE/DELETE lautlos scheitern).
--   * Gäste sind anonym und gehen ausschließlich über Server-Routen
--     (Secret-Key) — keine anon-Policies nötig.
--   * stays / room_guest_tokens / maid_login_tokens tragen Credentials und
--     sind NUR für Management lesbar.
-- ============================================================================

create or replace function is_hotel_member(h uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.hotel_id = h
  );
$$;

create or replace function is_hotel_management(h uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.hotel_id = h and p.username is null
  );
$$;

alter table hotels                 enable row level security;
alter table profiles               enable row level security;
alter table rooms                  enable row level security;
alter table room_guest_tokens      enable row level security;
alter table stays                  enable row level security;
alter table room_states            enable row level security;
alter table room_state_transitions enable row level security;
alter table maid_login_tokens      enable row level security;
alter table staff_log              enable row level security;
alter table service_definitions    enable row level security;
alter table service_items          enable row level security;
alter table service_orders         enable row level security;

-- Hotels: Mitglieder sehen ihr Hotel
drop policy if exists "hotels_select_member" on hotels;
create policy "hotels_select_member" on hotels
  for select using (is_hotel_member(id));

-- Profiles: eigenes Profil + Management sieht alle im Hotel
drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
  for select using (id = auth.uid());
drop policy if exists "profiles_select_mgmt" on profiles;
create policy "profiles_select_mgmt" on profiles
  for select using (is_hotel_management(hotel_id));

-- Rooms / Room-States / Transitions / Staff-Log / Service-Katalog + Orders:
-- alle Hotel-Mitglieder lesen (Reinigungsboard + Rezeption)
drop policy if exists "rooms_select_member" on rooms;
create policy "rooms_select_member" on rooms
  for select using (is_hotel_member(hotel_id));

drop policy if exists "room_states_select_member" on room_states;
create policy "room_states_select_member" on room_states
  for select using (is_hotel_member(hotel_id));

drop policy if exists "rst_select_member" on room_state_transitions;
create policy "rst_select_member" on room_state_transitions
  for select using (is_hotel_member(hotel_id));

drop policy if exists "staff_log_select_member" on staff_log;
create policy "staff_log_select_member" on staff_log
  for select using (is_hotel_member(hotel_id));

drop policy if exists "service_defs_select_member" on service_definitions;
create policy "service_defs_select_member" on service_definitions
  for select using (is_hotel_member(hotel_id));

drop policy if exists "service_items_select_member" on service_items;
create policy "service_items_select_member" on service_items
  for select using (is_hotel_member(hotel_id));

drop policy if exists "service_orders_select_member" on service_orders;
create policy "service_orders_select_member" on service_orders
  for select using (is_hotel_member(hotel_id));

-- Credentials-Tabellen: NUR Management
drop policy if exists "stays_select_mgmt" on stays;
create policy "stays_select_mgmt" on stays
  for select using (is_hotel_management(hotel_id));

drop policy if exists "room_guest_tokens_select_mgmt" on room_guest_tokens;
create policy "room_guest_tokens_select_mgmt" on room_guest_tokens
  for select using (is_hotel_management(hotel_id));

drop policy if exists "maid_login_tokens_select_mgmt" on maid_login_tokens;
create policy "maid_login_tokens_select_mgmt" on maid_login_tokens
  for select using (is_hotel_management(hotel_id));

-- ============================================================================
-- REALTIME — Tabellen in die Publication aufnehmen. Alle Portale hören auf
-- room_states (+ service_orders für den Orders-Tab, staff_log für das
-- "Kollegin aktiv"-Board, stays für die Zimmer-Übersicht).
-- ============================================================================
do $$
begin
  begin
    alter publication supabase_realtime add table room_states;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table service_orders;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table staff_log;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table stays;
  exception when duplicate_object then null;
  end;
end $$;

-- ============================================================================
-- BOOTSTRAP-HINWEIS (manuell, einmalig):
--
-- 1. Hotel anlegen:
--      insert into hotels (name) values ('Mein Hotel') returning id;
--
-- 2. Ersten Management-User im Supabase-Dashboard anlegen
--    (Authentication -> Users -> Add user, E-Mail + Passwort).
--
-- 3. Profil verknüpfen (IDs aus Schritt 1+2 einsetzen):
--      insert into profiles (id, hotel_id, display_name)
--      values ('<auth-user-uuid>', '<hotel-uuid>', 'Rezeption');
--
-- Zimmer, Reinigungskräfte und Services werden danach über die Admin-UI
-- angelegt (Phase 1+3).
-- ============================================================================
