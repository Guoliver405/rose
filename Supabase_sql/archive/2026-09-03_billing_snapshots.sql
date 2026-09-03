-- ----------------------------------------------------------------------------
-- Abrechnungs-Snapshot je Haus und Monat (03.09.2026)
--
-- Bisher wurde die Zimmerzahl einer Periode **live** aus `rooms.created_at` /
-- `rooms.deactivated_at` abgeleitet. Das war ausdrücklich an eine Bedingung
-- geknüpft (Planungsdokument zu Phase 6d): *„Voraussetzung ist aber, dass
-- Zimmer nicht mehr hart gelöscht werden."*
--
-- Genau diese Bedingung ist seit dem 03.09.2026 nicht mehr erfüllt — Löschen
-- ist ein regulärer Vorgang geworden. Ein gelöschtes Zimmer verschwand damit
-- rückwirkend auch aus längst abgeschlossenen Perioden.
--
-- Deshalb: Sobald ein Monat vorbei ist, wird seine Zimmerzahl **festgeschrieben**
-- und nicht mehr neu berechnet. Der laufende Monat bleibt eine Ableitung, weil
-- er sich ohnehin noch ändert.
--
-- KEINE FREMDSCHLÜSSEL — bewusst, wie bei `room_state_transitions`: Ein Beleg,
-- den die Löschung des belegten Gegenstands mitnimmt, ist kein Beleg. Die
-- Zeilen überleben Zimmer, Haus und Konto.
--
-- ADDITIV — alter Code läuft unverändert weiter.
-- Reihenfolge: erst einspielen, dann den Code pushen.
-- ----------------------------------------------------------------------------

create table if not exists billing_snapshots (
  hotel_id      uuid not null,
  account_id    uuid not null,
  -- Erster Tag des Monats, lokal gebildet (siehe periodKey in src/lib/rooms.ts).
  period_start  date not null,
  -- Zimmer, die in dieser Periode auch nur vorübergehend in Betrieb waren.
  rooms         int  not null check (rooms >= 0),
  -- Wann festgeschrieben — nicht wann die Periode lief.
  created_at    timestamptz not null default now(),
  primary key (hotel_id, period_start)
);

comment on table billing_snapshots is
  'Festgeschriebene Zimmerzahl je Haus und abgeschlossenem Monat. Ohne '
  'Fremdschlüssel, damit die Belege das Löschen von Zimmer, Haus oder Konto '
  'überleben. Geschrieben wird nur nachträglich und nur einmal je Periode.';

create index if not exists idx_billing_snapshots_account
  on billing_snapshots(account_id, period_start desc);

-- ----------------------------------------------------------------------------
-- RLS: Der Kontoinhaber sieht die Belege seines Kontos. Geschrieben wird
-- ausschließlich über den Admin-Client (wie überall im Projekt).
-- ----------------------------------------------------------------------------
alter table billing_snapshots enable row level security;

drop policy if exists billing_snapshots_select on billing_snapshots;
create policy billing_snapshots_select on billing_snapshots
  for select using (
    exists (
      select 1 from account_members am
      where am.user_id = auth.uid()
        and am.account_id = billing_snapshots.account_id
    )
  );
