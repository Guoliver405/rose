-- ----------------------------------------------------------------------------
-- Personal: ein Modell für alle drei Arten (03.09.2026)
--
-- Bisher gab es drei verschiedene Muster: Reinigungskräfte kannte man
-- „deaktiviert" (umkehrbar, Historie bleibt, in einer eigenen Liste sichtbar),
-- Rezeption und Manager dagegen nur „entfernt" — die `hotel_members`-Zeile
-- verschwand, die Person war weg, und ob ihr Auth-Konto dabei gelöscht wurde,
-- entschied die Anwendung still im Hintergrund.
--
-- Mit `deactivated_at` bekommt die Mitgliedschaft dieselbe Zwischenstufe wie
-- das Profil einer Reinigungskraft: Zugang beendet, Zeile bleibt, jederzeit
-- wieder aktivierbar.
--
-- ADDITIV — alter Code läuft unverändert weiter (Spalte ist nullable, und
-- solange niemand sie setzt, verhalten sich die Funktionen wie zuvor).
-- Reihenfolge: erst diese Migration einspielen, dann den Code pushen.
-- ----------------------------------------------------------------------------

alter table hotel_members
  add column if not exists deactivated_at timestamptz;

comment on column hotel_members.deactivated_at is
  'Gesetzt = Zugang für dieses Haus beendet. Zeile bleibt als Nachweis und für '
  'die Wieder-Aktivierung stehen; Rechte werden über is_hotel_member/'
  'is_hotel_management sofort entzogen.';

-- ----------------------------------------------------------------------------
-- RLS-Funktionen: beendete Zugänge geben nichts mehr frei.
--
-- Ohne diesen Teil wäre „Zugang beenden" reine Kosmetik — die Zeile bliebe
-- stehen und mit ihr der Zugriff. Beide Funktionen sind SECURITY DEFINER und
-- damit die eigentliche Mandantengrenze.
--
-- Zusätzlich wird der profiles-Zweig auf aktive Reinigungskräfte eingeschränkt:
-- bisher gab eine deaktivierte Kraft auf dieser Ebene weiterhin Zugriff frei.
-- Die Anwendung weist sie zwar an allen drei Login-Wegen ab, aber eine bereits
-- offene Sitzung war datenbankseitig noch berechtigt. Der Entzug soll überall
-- an der Quelle wirken, nicht erst in der Anwendung.
-- ----------------------------------------------------------------------------
create or replace function is_hotel_member(h uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    -- Aktive Reinigungskraft im Haus
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.hotel_id = h
        and p.username is not null
        and p.deactivated_at is null
    )
    -- Manager oder Rezeption für dieses Haus, Zugang nicht beendet
    or exists (
      select 1 from hotel_members m
      where m.user_id = auth.uid() and m.hotel_id = h
        and m.deactivated_at is null
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
        and m.deactivated_at is null
    )
    or exists (
      select 1
      from account_members am
      join hotels ho on ho.account_id = am.account_id
      where am.user_id = auth.uid() and ho.id = h
    );
$$;
