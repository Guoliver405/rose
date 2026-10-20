-- ============================================================================
-- Preis am Service selbst (20.10.2026)
--
-- Bisher trugen nur Optionen (`service_items.price_cents`) einen Preis. Wer
-- „Frühstück aufs Zimmer, 14,50 €“ wollte, musste eine Option anlegen, die
-- genauso heißt wie der Service, und der Gast musste sie ankreuzen — Fund aus
-- dem Blindtest vom 20.10.
--
-- Jetzt kann der Service als Ganzes einen Preis tragen. Er gilt nur, solange
-- der Service KEINE aktiven Optionen hat; dann friert die Anfrage ihn als
-- Position mit `whole: true` in `items_snapshot` ein, sodass Aufstellung,
-- Anfragen-Board und Löschvorschau ohne Sonderweg rechnen.
--
-- Kleinste Einheit der Währung des Hauses, wie `service_items.price_cents`.
-- Additiv und nullbar: Alt-Code kennt die Spalte nicht. Vor dem Push einspielen.
-- ============================================================================

alter table service_definitions
  add column if not exists price_cents integer
    check (price_cents is null or price_cents >= 0);
