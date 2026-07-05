# Session 2026-07-05 — Phase 0 + 1: Fundament und Admin-Portal

## Kontext

Erste Session des Projekts. Konzept-Diskussion (siehe AGENTS.md „Entschiedene
Design-Punkte"), dann Phase 0 und Phase 1 in einem Rutsch.

## Phase 0 — Fundament

- `create-next-app` (Next.js 16.2.10, Tailwind 4, TS, src-dir, `@/`-Alias),
  Ordner nach `RoSe` umbenannt (npm verbietet Großbuchstaben im Projektnamen
  beim Scaffold — als `rose` erzeugt, dann `mv`).
- Theming-Token-System 1:1 aus HotCord portiert (`globals.css`, Präfix
  `--rs-`). Dabei **sieben in HotCord fehlende Primitive** entdeckt und hier
  korrekt definiert (emerald/rose/red-400, fuchsia-500, blue-100/300,
  violet-300) — HotCord-Fix als Task-Chip ausgekoppelt.
- Supabase-Client-Trio + Browser-Client. `service.ts` ohne den
  View-Clock-Schreibschutz-Proxy (Feature existiert in RoSe nicht).
- Schema v1 (12 Tabellen) geschrieben, vom User eingespielt, nach
  `Supabase_sql/archive/` verschoben.
- `scripts/bootstrap.mjs`: legt Hotel + ersten Management-Login an
  (bricht ab, wenn schon ein Hotel existiert). Ausgeführt:
  Hotel „Mein Hotel", Login rezeption@rose.local.

## Phase 1 — Admin-Portal

Neue Dateien:

- [src/proxy.ts](../src/proxy.ts) — **Next 16 heißt Middleware jetzt `proxy.ts`**
  (`export function proxy`, `middleware.ts` ist deprecated). Session-Refresh
  für `/admin` + `/login`; berührt nur Default-Cookies, `svc_` bleibt frei.
- [src/lib/ids.ts](../src/lib/ids.ts) — `generateToken` (base64url),
  `generatePin` (crypto-RNG), `clampPinLength` (4–8).
- [src/utils/auth.ts](../src/utils/auth.ts) — `getManagementContext()`:
  User + Profil (Management = `username IS NULL`) + Hotelname. Pages
  redirecten bei `null` auf `/login`, Actions returnen `{ error }`.
- [src/app/login/](../src/app/login/) — Login-Form + `loginAction`
  (weist Maid-Logins ab und beendet deren Session sofort) + `logoutAction`.
- [src/app/admin/layout.tsx](../src/app/admin/layout.tsx) — Guard, Header
  (Hotelname, Nav Übersicht/Zimmer, Abmelden), `RealtimeListener`.
- [src/app/admin/page.tsx](../src/app/admin/page.tsx) — Zimmer-Übersicht:
  KPI-Pills (Zimmer/belegt/frei/zu reinigen/DND/in Arbeit), Gruppierung
  Gebäude → Etage absteigend, Empty-State mit Deeplink zum Setup.
- [src/app/admin/RoomGrid.tsx](../src/app/admin/RoomGrid.tsx) — Kacheln mit
  Farb-Vorrang `priorisiert > in Arbeit > ausgecheckt > Wunsch > DND > belegt
  > frei`; Dialog pro Zimmer: Check-in (PIN groß nach Erfolg), Check-out mit
  Inline-Bestätigung, Priorisieren-Toggle, „Reinigung als erledigt markieren".
  Priorisierte Kacheln nutzen `blink-ring-overdue`.
- [src/app/admin/actions.ts](../src/app/admin/actions.ts) — `checkInAction`
  (force-Pattern: Warnung bei checkout_pending/priority/cleaning_by;
  PIN-Länge aus Policy; 23505 = paralleler Check-in), `checkOutAction`,
  `setPriorityAction`, `markCleanedAction` (löscht checkout_pending +
  priority + please_clean, DND bleibt). Alle mit Audit-Attribution-Trio.
- [src/app/admin/zimmer/](../src/app/admin/zimmer/) — Setup: Anlegen einzeln /
  Komma-Liste / Bereich („101-110", Client-Expansion, max 500), UPSERT mit
  `ignoreDuplicates` auf `(hotel_id,number)` + room_states-Miterzeugung;
  Löschen blockiert bei belegtem Zimmer.
- [src/components/RealtimeListener.tsx](../src/components/RealtimeListener.tsx)
  — room_states/stays/staff_log/service_orders, 200 ms-Debounce (HotCord-Pattern).

## Design-Entscheidungen

- **Kein `[hotelId]` in Admin-URLs** — single-property-UI, Hotel kommt aus dem
  Profil. Multi-Tenant-UI wäre ein additiver Umbau (Schema trägt hotel_id schon).
- **Check-in setzt `guest_signal='none'`** — stale Signale des Vorgängers
  sterben. `checkout_pending` bleibt bei Force-Check-in bewusst stehen
  (Zimmer gehört weiter aufs Reinigungsboard).
- **`markCleanedAction` lässt DND stehen** — DND ist ein aktives Gast-Signal,
  keine Reinigungs-Anforderung.

## Verifikation (Browser, End-to-End)

Login → 8 Zimmer angelegt (101–105 auf Etage 1, 201–203 auf Etage 2, via
Bereichs-Syntax) → Check-in 101 (PIN 4665 groß im Dialog, KPI live auf
„1 belegt") → Check-out (Kachel orange, „1 zu reinigen") → erneuter Check-in
zeigt Warnung „Zimmer nicht bereit" mit Trotzdem/Abbrechen → „als erledigt
markieren" räumt auf → Priorisieren (rote Blink-Kachel) → Aufheben. Keine
Console-Errors. tsc/lint/build grün.

## Stolpersteine

- **Next 16: `middleware.ts` → `proxy.ts`** mit `export function proxy` —
  in `node_modules/next/dist/docs/.../proxy.md` dokumentiert.
- Browser-Test: `button[type=submit]` matcht auch den **Abmelden-Button im
  Header** (Logout ist ein Form) — der vermeintliche Session-Verlust beim
  ersten Testlauf war ein selbst ausgelöster Logout.

## Offen / bewusst nicht

- Passwort-ändern-Funktion für Management (bei Bedarf).
- `hotels.name`-Bearbeitung (kommt mit Policies-UI, Phase 5).
- Zimmer bearbeiten (nur Anlegen/Löschen — reicht für MVP).

## Endstand

tsc clean, 0 Lint-Warnings, Build grün, alle Flows im Browser verifiziert.
Nächster Schritt: **Phase 2 — Gastportal** (QR-Landing, PIN + Rate-Limit,
Reinigen/DND, Session-Cookie).
