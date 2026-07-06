<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## Was ist RoSe?

**RoSe (RoomService)** ist die kompakte Ableitung von HotCord (`F:\Coding_Projekte\HotCord`): drei Portale (Rezeption / Reinigung / Gast), aber **kein Buchungssystem**, keine Preise, kein PMS/iCal, keine Personalplanung, keine Reinigungs-Zustandsmaschine, kein Rollen-System. Greenfield-Projekt mit eigener Supabase-DB; aus HotCord werden nur bewährte Primitives portiert, kein Code-Fork.

### Kern-Prozess

1. **Check-in** = ein Klick der Rezeption auf ein Zimmer → erzeugt anonymen `stays`-Eintrag + 4-stellige Gast-PIN (sofort am Bildschirm ablesbar, nichts muss gedruckt werden).
2. **Gast** erreicht sein Portal über zwei gleichwertige Wege (beide immer aktiv):
   - **Baseline**: generische URL/QR → `/guest` → Zimmernummer + PIN eingeben.
   - **Komfort**: statischer Zimmer-QR (einmal gedruckt, klebt im Zimmer) → `/guest/r/<token>` → nur PIN eingeben.
   Nach PIN-Erfolg: Session-Cookie (`stays.session_token`), keine erneute Eingabe.
3. **Während des Aufenthalts**: Gast wählt „Zimmer reinigen" / „DND", bestellt Services aus dem Baukasten.
4. **Check-out** = ein Klick → beendet den Stay (PIN + Cookie sofort tot), setzt `checkout_pending` am Zimmer.
5. **Reinigungsboard** (gemeinsam für alle Kräfte, keine individuelle Anleitung): Etagen mit Zimmern, **drei aktive Status**: Reinigung gewünscht / ausgecheckt / priorisiert. Unbelegt, DND oder ohne Wunsch = ausgegraut, aber sichtbar. Reinigungskräfte taggen nur Start + Abschluss; „Kollegin in Zimmer X" ist live sichtbar. Etagenscore als leichte Priorisierungshilfe.

### Entschiedene Design-Punkte (Diskussion 2026-07-05)

- **Zimmerstatus ist event-getrieben, nicht abgeleitet** — der Check-in-/Check-out-Klick IST die Wahrheit. Keine `deriveCleanState`-Logik wie in HotCord.
- **Sicherheit**: statischer Zimmer-Token (unguessbar) + Aufenthalts-PIN (4 Ziffern, Default; per Policy konfigurierbar) + Rate-Limit (5 Fehlversuche → 15 min Sperre, `stays.pin_attempts`/`pin_locked_until`). PIN im Plaintext in `stays.pin` — bewusst (Rezeption muss ablesen können, Schadenspotenzial minimal, Lebensdauer = Aufenthalt).
- **Stayover-Routine-Reinigung**: Hotel-Policy (`policies.stayoverAutoClean` + Uhrzeit), Default aus.
- **Priorisierung**: manueller Rezeptions-Eingriff (Beschwerden, Sonderfälle) — kein Automatismus.
- **Maid-Identität**: echte Accounts + QR-Login-Karten (Pattern 1:1 aus HotCord, `maid_login_tokens`), weil Reiniger-Tracking ein echtes Zusatzfeature ist. Vereinfachtes Logging in `staff_log` (shift/break/other_cleaning/clean_start/clean_done).
- **Slider-Logik aus HotCord**: „Reinigung starten" erlaubt danach nur „Reinigung abschließen"; Schichtbeginn/-ende rahmen ein; Pause + sonstige Reinigung frei stechbar, werden nur geloggt.
- **Vergessener Abschluss**: nach `policies.cleaningStaleMinutes` (Default 90) automatisch zurück auf offen; manuell übersteuerbar.
- **Check-in auf ungereinigtes Zimmer**: Warnung mit Override (`force`-Pattern aus HotCord).
- **Rechte minimal**: Management (username NULL) vs. Reinigungskraft (username gesetzt) — sonst nichts. Kein Rollen-System.
- **Multi-Tenant**: `hotel_id` überall im Schema, UI zunächst single-property.
- **Service-Baukasten abgespeckt**: nur urgent-Flag, Lifecycle nur `open → done`, Preise optional (Anzeige-Info).

---

## Befehle

```bash
npm run dev        # Dev-Server (Turbopack)
npm run build      # Produktions-Build
npm run lint       # ESLint
npx tsc --noEmit   # Type-Check ohne Build
```

Alias `@/` zeigt auf `src/`.

## Tech-Stack

Next.js 16 App Router · TypeScript · Tailwind CSS 4 · Supabase (PostgreSQL + RLS + Realtime)

`params` in Next.js 16 ist ein Promise: `const { id } = await params`.

## Drei Portale

| Route | Nutzer | Auth |
|---|---|---|
| `/admin` | Rezeption/Management | Supabase Auth (E-Mail) |
| `/service` | Reinigungskräfte | Eigener Cookie-Namespace `svc_` (`createServicePortalClient`) |
| `/guest` | Gäste | Anonym: Zimmernummer/Zimmer-Token + Stay-PIN → Session-Cookie |

**Cookie-Trennung:** Admin- und Reinigungs-Portal teilen denselben Browser-Origin. Das Reinigungs-Portal nutzt [service-portal.ts](src/utils/supabase/service-portal.ts) mit Präfix `svc_` — nie `createClient()` aus `server.ts` in `/service`-Routen verwenden.

## Supabase-Client-Muster

```typescript
createClient()              // src/utils/supabase/server.ts — RLS aktiv, lesend
createAdminClient()         // src/utils/supabase/service.ts — Secret Key, RLS umgangen
createServicePortalClient() // src/utils/supabase/service-portal.ts — svc_-Cookies
createClient() [client.ts]  // Browser — nur Realtime-Subscriptions
```

**Faustregel (aus HotCord):** Alle Server-Actions, die schreiben oder löschen, verwenden `createAdminClient()` nach manueller Auth-Prüfung — Supabase gibt bei RLS-blockierten `DELETE`/`UPDATE` keinen Fehler zurück (`{ data: [], error: null }`).

Env-Vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`.

## Datenmodell (Schema v1)

Siehe [supabase_schema_v1.sql](Supabase_sql/supabase_schema_v1.sql). Kern:

- `hotels` — Mandant + `policies` JSONB (stayoverAutoClean, pinLength, cleaningStaleMinutes)
- `profiles` — Personal; Discriminator: `username IS NOT NULL` = Reinigungskraft
- `rooms` — Nummer + Etage + optional Gebäude, keine Geometrie
- `room_guest_tokens` — statischer QR-Token pro Zimmer (PK = room_id)
- `stays` — anonymer Aufenthalt: PIN, session_token, Rate-Limit-Felder; Partial-Unique `room_id WHERE checked_out_at IS NULL` verhindert Doppel-Check-in strukturell
- `room_states` — event-getriebener Status: `guest_signal` (none/please_clean/dnd), `checkout_pending`, `priority`, `cleaning_by`/`cleaning_started_at`; `last_updated_at` wird von jeder statusrelevanten Action getoucht (Realtime-Kick)
- `room_state_transitions` — Audit via `AFTER UPDATE`-Trigger (SECURITY DEFINER), eine Zeile pro geändertem Feld, `IS DISTINCT FROM` filtert reine Touches; Attribution über `last_update_source`/`last_updated_by` im Payload
- `maid_login_tokens` — QR-Login-Karten (PK = profile_id, UPSERT invalidiert alte Karte)
- `staff_log` — Tätigkeits-Stiche der Reinigungskräfte
- `service_definitions` / `service_items` / `service_orders` — Baukasten (open/done)

### Board-Ableitung (im Code, nicht in der DB)

```
aktiv      = checkout_pending || priority || guest_signal === 'please_clean'
in Arbeit  = cleaning_by !== null
ausgegraut = alles andere (frei, belegt ohne Wunsch, DND)
Etagenscore = gewichtete Summe der aktiven Zimmer pro Etage
```

## SQL-Migrationen — Ablage-Konvention (wie HotCord)

- `Supabase_sql/` — neue, noch nicht eingespielte Migrationen (manuell via Supabase-SQL-Editor).
- `Supabase_sql/archive/` — eingespielte Migrationen, per `git mv` verschoben.

## Theming

3-Schichten-Token-System in [globals.css](src/app/globals.css), 1:1 aus HotCord portiert (Präfix `--rs-`): Primitives → Semantic → `@theme inline`. Komponenten nutzen **nur** semantische Utilities (`bg-positive`, `text-ink-muted`, `border-edge`, `bg-action`, `text-action-foreground`, …) — nie Tailwind-Roh-Farben. Dark/Auto-Theme, Density (compact/standard/comfortable), High-Contrast, Color-Blind-Modi und Print-Light sind fertig verdrahtet über `data-*`-Attribute auf `<html>`.

Auf saturierten Buttons per-Family-Foreground verwenden (`bg-attention text-attention-foreground`), nie `text-ink-inverse` (theme-flippt).

## Bekannte Fallstricke (aus HotCord geerbt, gelten hier genauso)

| Problem | Lösung |
|---|---|
| DELETE/UPDATE löscht nichts, kein Fehler | RLS blockiert lautlos → Admin-Client + manuelle Auth-Prüfung |
| 404 auf existierende Route im Dev | `.next/` löschen + Dev-Server neu (Turbopack-Type-Cache korrupt) |
| Tailwind scannt Markdown/SQL | `@source not`-Einträge in globals.css pflegen |
| Floating-Modal in Button-Größe | Vorfahre mit `transform`/`translate` erzeugt Containing-Block → `createPortal(document.body)` |
| `revalidatePath('/admin')` invalidiert keine Unterseiten | `revalidatePath('/admin', 'layout')` |

## Phasen-Plan

- **Phase 0** — Scaffold, Theming-Port, Supabase-Clients, Schema v1 ✅
- **Phase 1** — Admin: Login, Zimmer-Setup, Zimmer-Übersicht, Check-in/-out mit PIN-Anzeige, Priorisieren ✅
- **Phase 2** — Gastportal: `/guest` + `/guest/r/<token>`, PIN-Eingabe + Rate-Limit, Reinigen/DND, Session-Cookie ✅
- **Phase 3** — Reinigungsboard: Maid-Login (QR-Karten), Etagen-Board, Slider (Start/Abschluss), staff_log, Stale-Timeout ✅
- **Phase 4** — Service-Baukasten: Konfigurator, Gast-Bestellung, Orders-Tab Rezeption ✅
- **Phase 5** — Politur: Etagenscore-Feintuning, Policies-UI, QR-Druckseiten (Zimmer-Aushang + Check-in-Handout), Stayover-Automatik

Nach jeder Phase: Review mit dem User (enger Dialog vereinbart).

## Session-Protokolle

Wie in HotCord: Protokolle unter `Sessions/` ablegen, aktuellsten Stand hier verlinken.

- [Sessions/2026-07-05_Phase-0-1_Fundament-und-Admin-Portal.md](Sessions/2026-07-05_Phase-0-1_Fundament-und-Admin-Portal.md) — **Aktueller Stand.** Phasen 0–4: Scaffold + Theming-Port + Schema v1 + Bootstrap, Rezeptions-Portal (Login, Zimmer-Setup, Übersicht mit Check-in/-out + PIN, Priorisieren, Personal-Verwaltung mit QR-Karten, Service-Konfigurator, Orders-Tab mit Nav-Badge), Gastportal (Zimmernummer/QR-Token + PIN mit Rate-Limit, Reinigen/DND, Service-Bestellung, Check-out-Kill), Reinigungsboard (QR-/PIN-Login, Etagen-Board mit Score, Schicht/Pause, Slider Start/Abschluss, Stale-Timeout). Alles im Browser end-to-end verifiziert. **Für Wiederaufnahme: „🔖 Wiederaufnahme"-Block am Ende des Protokolls lesen** — dort steht der Phase-5-Plan (Politur).
