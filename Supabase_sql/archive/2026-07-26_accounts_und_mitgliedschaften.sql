-- ============================================================================
-- Phase 6d: Mehrere Hotels je Konto (Zielgruppe Hotelketten)
--
-- Vier Rollen, zwei davon hausübergreifend:
--   Admin      = Kontoinhaber, zahlender Kunde → alle Häuser seines Kontos
--   Manager    = Teilmenge der Häuser          → dort alles außer Konto/Plan
--   Rezeption  = hausintern
--   Reinigung  = hausintern (bleibt in profiles)
--
-- REIN ADDITIV: keine Spalte wird gelöscht, keine Zeile entfernt. Der Code
-- liest die neuen Tabellen erst nach dem Deploy — die Migration kann also
-- gefahrlos vorher eingespielt werden.
--
-- Plan: Sessions/Mehrere-Hotels-je-Konto-Plan.md
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) ACCOUNTS — der zahlende Kunde. Plan und Abrechnung hängen hier,
--    nicht am einzelnen Hotel.
-- ----------------------------------------------------------------------------
create table if not exists accounts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  plan        text not null default 'trial',
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2) ACCOUNT_MEMBERS — wer gehört zum Konto.
--    Heute nur 'owner'; die Rolle ist als Spalte angelegt, damit später
--    z. B. 'billing' dazukommen kann, ohne die Tabelle zu ändern.
--    display_name hier, weil ein Inhaber kein festes Haus hat.
-- ----------------------------------------------------------------------------
create table if not exists account_members (
  account_id    uuid not null references accounts(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null default 'owner' check (role in ('owner')),
  display_name  text not null,
  created_at    timestamptz not null default now(),
  primary key (account_id, user_id)
);

create index if not exists idx_account_members_user on account_members(user_id);

-- ----------------------------------------------------------------------------
-- 3) HOTELS.ACCOUNT_ID — jedes Hotel gehört genau einem Konto.
--    Erst nullable, damit der Backfill laufen kann.
-- ----------------------------------------------------------------------------
alter table hotels add column if not exists account_id uuid references accounts(id) on delete cascade;

-- ----------------------------------------------------------------------------
-- 4) HOTEL_MEMBERS — hausbezogene Management-Zuordnung.
--    Der Manager bekommt eine Zeile je Haus, das er verwalten darf —
--    daher die „Teilmenge der Häuser".
--    Reinigungskräfte stehen hier NICHT (die bleiben in profiles).
-- ----------------------------------------------------------------------------
create table if not exists hotel_members (
  hotel_id      uuid not null references hotels(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null check (role in ('manager', 'reception')),
  display_name  text not null,
  created_at    timestamptz not null default now(),
  primary key (hotel_id, user_id)
);

create index if not exists idx_hotel_members_user on hotel_members(user_id);

-- ----------------------------------------------------------------------------
-- 5) BACKFILL
--    Heute gilt: ein Login = ein Hotel. Also entsteht je Bestandshotel genau
--    ein Konto, benannt nach dem Hotel. Der vorhandene role='admin' wird
--    Inhaber, vorhandene role='reception' werden hotel_members.
-- ----------------------------------------------------------------------------
insert into accounts (id, name)
select gen_random_uuid(), h.name
from hotels h
where h.account_id is null;

-- Zuordnung über den Namen — eindeutig, weil oben genau ein Konto je Hotel
-- angelegt wurde und Bestandshotels unterschiedliche Namen tragen.
update hotels h
set account_id = a.id
from accounts a
where h.account_id is null
  and a.name = h.name;

-- Inhaber = bisheriges Management mit role 'admin'
insert into account_members (account_id, user_id, role, display_name)
select h.account_id, p.id, 'owner', p.display_name
from profiles p
join hotels h on h.id = p.hotel_id
where p.username is null
  and coalesce(p.role, 'admin') = 'admin'
  and h.account_id is not null
on conflict (account_id, user_id) do nothing;

-- Rezeptions-Zugänge wandern in die hausbezogene Zuordnung
insert into hotel_members (hotel_id, user_id, role, display_name)
select p.hotel_id, p.id, 'reception', p.display_name
from profiles p
where p.username is null
  and p.role = 'reception'
on conflict (hotel_id, user_id) do nothing;

alter table hotels alter column account_id set not null;

-- ----------------------------------------------------------------------------
-- 6) RLS
--    Die 14 bestehenden Policies laufen alle über diese zwei Funktionen —
--    sie selbst bleiben unverändert.
--
--    WICHTIG: Der profiles-Zweig wird auf Reinigungskräfte eingeschränkt
--    (`username is not null`). Sonst würde der ENTZUG von Manager- oder
--    Rezeptionsrechten nicht greifen: die alte profiles-Zeile gewährte
--    weiterhin Zugang.
-- ----------------------------------------------------------------------------
create or replace function is_hotel_member(h uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    -- Reinigungskraft im Haus
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.hotel_id = h and p.username is not null
    )
    -- Manager oder Rezeption für dieses Haus
    or exists (
      select 1 from hotel_members m
      where m.user_id = auth.uid() and m.hotel_id = h
    )
    -- Kontoinhaber: alle Häuser seines Kontos
    or exists (
      select 1
      from account_members am
      join hotels ho on ho.account_id = am.account_id
      where am.user_id = auth.uid() and ho.id = h
    );
$$;

create or replace function is_hotel_management(h uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (
      select 1 from hotel_members m
      where m.user_id = auth.uid() and m.hotel_id = h
    )
    or exists (
      select 1
      from account_members am
      join hotels ho on ho.account_id = am.account_id
      where am.user_id = auth.uid() and ho.id = h
    );
$$;

-- ----------------------------------------------------------------------------
-- 7) RLS für die neuen Tabellen
--    Lesend über den Session-Client; geschrieben wird ausschließlich über den
--    Admin-Client nach manueller Prüfung (Projekt-Faustregel).
-- ----------------------------------------------------------------------------
alter table accounts        enable row level security;
alter table account_members enable row level security;
alter table hotel_members   enable row level security;

drop policy if exists "accounts_select_member" on accounts;
create policy "accounts_select_member" on accounts
  for select using (
    exists (
      select 1 from account_members am
      where am.account_id = accounts.id and am.user_id = auth.uid()
    )
  );

drop policy if exists "account_members_select_own" on account_members;
create policy "account_members_select_own" on account_members
  for select using (user_id = auth.uid());

-- Eigene Zuordnungen sehen, und Management sieht die des eigenen Hauses.
drop policy if exists "hotel_members_select" on hotel_members;
create policy "hotel_members_select" on hotel_members
  for select using (
    user_id = auth.uid() or is_hotel_management(hotel_id)
  );
