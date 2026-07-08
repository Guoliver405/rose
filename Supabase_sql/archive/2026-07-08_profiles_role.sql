-- ============================================================================
-- Rollen für Management-Logins: admin vs. reception.
--
-- Revidiert die ursprüngliche Entscheidung „kein Rollen-System": Am
-- Admin-Konto hängen Konfiguration, Policies und künftig Zahlungsdaten —
-- das gehört nicht auf den Rezeptions-Tresen. Rezeptions-Accounts dürfen
-- das Tagesgeschäft (Check-in/-out, Prioritäten, Bestellungen, Handouts,
-- Karten-/Aushang-Druck), aber keine Struktur/Konfiguration.
--
-- `role` gilt nur für Management-Logins (username IS NULL).
-- Reinigungskräfte werden weiterhin über username IS NOT NULL erkannt;
-- ihr role-Wert ist bedeutungslos (Default 'admin' bleibt einfach stehen).
--
-- Bestehende Management-Logins werden durch den Default automatisch Admins.
-- ============================================================================

alter table profiles add column role text not null default 'admin'
  check (role in ('admin', 'reception'));
