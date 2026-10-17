-- ============================================================================
-- Währung je Haus für Service-Preise (17.10.2026)
--
-- Service-Preise waren fest Euro. Häuser außerhalb der Eurozone (Thailand,
-- Schweiz, Japan …) wählen jetzt ihre Währung unter „Haus & Regeln“
-- (`hotels.policies.currency`, ISO 4217, Vorgabe EUR). Preise bleiben in der
-- kleinsten Einheit gespeichert (`price_cents`); wie viele Nachkommastellen
-- eine Währung hat, sagt `Intl` (Yen: keine, Euro: zwei).
--
-- Jede Anfrage friert ihre Währung ein — wie Name und Preis. Sonst zeigten
-- alte Anfragen und Aufstellungen nach einem Wechsel die neue Währung an
-- (aus 12,00 € würden 12,00 CHF). Bestand: EUR.
--
-- Additiv mit Vorgabe: Alt-Code kennt die Spalte nicht, neue Zeilen bekommen
-- EUR. Vor dem Push einspielen.
-- ============================================================================

alter table service_orders
  add column if not exists currency text not null default 'EUR';

alter table service_orders
  drop constraint if exists service_orders_currency_iso;
alter table service_orders
  add constraint service_orders_currency_iso
  check (currency ~ '^[A-Z]{3}$');

comment on column service_orders.currency is
  'Währung der Preise in items_snapshot (ISO 4217), eingefroren bei der Anfrage aus hotels.policies.currency.';
