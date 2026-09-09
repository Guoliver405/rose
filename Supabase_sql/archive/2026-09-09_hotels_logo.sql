-- ============================================================================
-- Hotel-Logo auf den gedruckten Blättern — 09.09.2026
--
-- Bauplan: Sessions/Druckblaetter-Plan-2026-09-09.md, Abschnitt 5.
--
-- Das Logo liegt in Supabase Storage, nicht in der Datenbank. Zwei Gründe:
--
--   1. In `hotels.policies` darf es nicht liegen — die Policies hängen im
--      ManagementContext und werden bei JEDEM Request mitgeladen. Ein 40-KB-
--      Bild dort wäre eine Latenzregression auf jeder Seite des Portals.
--   2. Eine eigene Base64-Spalte wäre möglich, aber ein öffentlicher
--      Storage-Pfad liefert das Bild über den CDN und ergibt eine echte URL —
--      die funktioniert später in der Mail, wo `data:` von Gmail blockiert
--      wird (beim QR-Bild schon aufgefallen).
--
-- Gespeichert wird nur der PFAD, nicht die volle URL: sonst wäre ein Wechsel
-- der Supabase-Instanz ein Datenbank-Update. Die URL baut `logoPublicUrl`.
--
-- Der Dateiname trägt einen Zufallsanteil (`logo-<8 hex>`), der alte
-- Gegenstand wird nach dem Upload gelöscht. Ein fester Name mit `upsert`
-- liefert über den CDN sonst tagelang das alte Bild aus.
--
-- ACHTUNG beim Löschen: Storage-Gegenstände haben KEINEN Fremdschlüssel auf
-- `hotels`. Die Kaskade räumt sie nicht ab — dieselbe Falle wie bei
-- `room_state_transitions` und `auth.users`. `purgeHotel` in
-- src/utils/deletion.ts entfernt den Ordner ausdrücklich, vor dem Löschen des
-- Hauses (danach ist die ID nicht mehr aus der Zeile zu lesen).
--
-- Additiv: Alt-Code kennt die Spalte nicht, Häuser ohne Logo drucken wie
-- bisher den Hausnamen.
-- ============================================================================

alter table hotels
  add column if not exists logo_path text;

comment on column hotels.logo_path is
  'Pfad des Hotel-Logos im Storage-Bucket hotel-logos (<hotel_id>/logo-<8 hex>.<ext>), nicht die URL. NULL = kein Logo, die Blätter drucken den Hausnamen.';

-- ── Bucket ──────────────────────────────────────────────────────────────────
-- Öffentlich lesbar: Die Blätter werden gedruckt und das Logo soll später auch
-- in der Mail erscheinen — beides ohne Sitzung. Der Inhalt ist ein Firmenlogo,
-- also ohnehin öffentlich.
--
-- Größe und Typen begrenzt Storage selbst — zweite Schranke hinter
-- `validateLogoUpload` (src/lib/logo.ts), die dieselben Werte prüft.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hotel-logos',
  'hotel-logos',
  true,
  1048576,
  array['image/png', 'image/jpeg', 'image/svg+xml']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── Rechte ──────────────────────────────────────────────────────────────────
-- BEWUSST KEINE Policies auf storage.objects:
--
--   Lesen  — läuft über die öffentliche Route /object/public/…, die bei einem
--            `public`-Bucket ohne RLS auskommt.
--   Schreiben — ausschließlich über den Secret Key (Admin-Client) nach
--            `getAdminContext`, wie jeder Schreibzugriff im Projekt.
--
-- Ohne Policy heißt für alle anderen Schlüssel: nichts. Genau das ist gewollt —
-- eine SELECT-Policy für `anon` würde zusätzlich das Auflisten des Buckets
-- erlauben und damit die Zahl der Kundenhäuser verraten.
