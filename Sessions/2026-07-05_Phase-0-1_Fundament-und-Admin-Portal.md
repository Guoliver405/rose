# Session 2026-07-05 — Phase 0 + 1 + 2: Fundament, Admin-Portal, Gastportal

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

## Phase 2 — Gastportal

Neue Dateien:

- [src/utils/guest.ts](../src/utils/guest.ts) — `getGuestContext()`: Cookie
  `rose_guest` (= `stays.session_token`) → aktiver Stay → Zimmer/Signal/
  Hotelname. Anonym, alles über Admin-Client serverseitig.
- [src/app/guest/actions.ts](../src/app/guest/actions.ts) —
  `guestLoginAction` (Zimmer via QR-Token ODER Nummer; **generische
  Fehlermeldung** verrät nie, ob Zimmer existiert/belegt ist; Rate-Limit
  5 Fehlversuche → 15 min Sperre auf dem Stay; Erfolg setzt httpOnly-Cookie
  + Reset der Zähler), `setGuestSignalAction` (none/please_clean/dnd,
  Audit-Source 'guest'), `guestLogoutAction`.
- [src/app/guest/layout.tsx](../src/app/guest/layout.tsx) — Gastportal ist
  designgewollt **immer dark** via `data-theme="dark"`-Wrapper (CSS-Vars
  kaskadieren, HotCord-Pattern), mobile Spalte max-w-md.
- [src/app/guest/page.tsx](../src/app/guest/page.tsx) — Baseline-Einstieg:
  Zimmernummer + PIN. Bei gültigem Cookie → redirect `/guest/status`.
- [src/app/guest/r/[token]/page.tsx](../src/app/guest/r/%5Btoken%5D/page.tsx)
  — QR-Deep-Link: Token → Zimmer vorbestimmt, nur PIN-Eingabe; ungültiger
  Token zeigt Fehler-Card mit Verweis auf die Baseline.
- [src/app/guest/status/](../src/app/guest/status/) — Status-Seite mit zwei
  großen Toggle-Buttons (Reinigen amber / DND rose, aktive Option nochmal
  tippen = zurücknehmen), „Reinigung läuft"-Banner bei `cleaning_by`,
  Abmelden-Link. **15-s-Polling statt Realtime** — Gäste haben kein
  Auth-Token, RLS würde Realtime-Events blocken.

Verifikation (Browser, End-to-End): Check-in 102 → PIN 7802 abgelesen →
falsche PIN generisch abgewiesen → richtige PIN → Status-Seite →
„Zimmer reinigen" → Admin-KPI „1 zu reinigen" + Kachel amber → DND ersetzt
please_clean (ein Signal-Feld) → Check-out im Admin → `/guest/status`
redirectet sofort zur Anmeldung → alte PIN tot → ungültiger Deep-Link zeigt
Fehler-Card. Keine Console-Errors, Build grün.

Bewusst: `room_guest_tokens` wird erst mit den QR-Druckseiten (Phase 5)
befüllt — die Route existiert und handhabt fehlende Tokens sauber.

## Offen / bewusst nicht

- Passwort-ändern-Funktion für Management (bei Bedarf).
- `hotels.name`-Bearbeitung (kommt mit Policies-UI, Phase 5).
- Zimmer bearbeiten (nur Anlegen/Löschen — reicht für MVP).

## Endstand

tsc clean, 0 Lint-Warnings, Build grün, alle Flows (Phase 1 + 2) im Browser
end-to-end verifiziert. Phasen 0–2 committed und gepusht.

---

## Phase 3 — Reinigungsboard (Session 2026-07-06)

Neue Dateien:

- [src/lib/maid.ts](../src/lib/maid.ts) — `buildMaidEmail`
  (`<username>@<hotelId>.rose.svc`), `normalizeUsername`.
- [src/lib/board.ts](../src/lib/board.ts) — geteilte Board-Ableitung:
  `isRoomActive`, `roomScore` (3×prio + 2×checkout + 1×wunsch),
  `isCleaningFresh` + `clampStaleMinutes` (Stale-Timeout, Default 90 min,
  reine Loader-Ableitung — kein Cron). Auch vom Admin-Board genutzt.
- [src/lib/shift.ts](../src/lib/shift.ts) — `deriveShiftState`: Schicht/Pause
  aus den jüngsten staff_log-Stichen, kein eigener Zustands-Speicher.
- [src/utils/maid-auth.ts](../src/utils/maid-auth.ts) — `getMaidContext()`:
  svc_-Session → Profil (username NOT NULL) + Hotel/Policies +
  `accessToken` (für Realtime-RLS im Browser).
- [src/app/admin/personal/](../src/app/admin/personal/) — Maid-Verwaltung:
  Anlegen (Auth-User + Profil + Karte, Rollback bei Profil-Fehler),
  PIN-Anzeige in der Liste, „Neue Karte" (PIN + Token als Einheit ersetzt,
  UPSERT auf PK), Löschen (blockiert während laufender Reinigung; CASCADE
  nimmt staff_log-Historie mit — Dialog sagt das ehrlich).
- [karte/[profileId]/page.tsx](../src/app/admin/personal/karte/%5BprofileId%5D/page.tsx)
  + [MaidPinCard.tsx](../src/components/MaidPinCard.tsx) — Standalone-
  Druckseite (Admin-Header ist jetzt `print:hidden`), QR via `qrcode`-Paket
  (neue Dependency) auf `/service/auto/<token>`, PIN + Klartext-Link.
- [src/app/service/auto/[token]/route.ts](../src/app/service/auto/%5Btoken%5D/route.ts)
  — QR-Auto-Login: Token-Lookup → `signInWithPassword` über svc_-Client.
- [src/app/service/login/](../src/app/service/login/) — Username + PIN
  (Single-Property: Hotel wird serverseitig über den Username aufgelöst),
  generische Fehlermeldung, Logout-Action.
- [src/app/service/page.tsx](../src/app/service/page.tsx) — Board-Loader über
  Admin-Client (Maid-RLS sieht weder fremde profiles noch stays): Etagen
  nach Score sortiert, Stale-Ableitung, eigener Reinigungs-Slot.
- [src/app/service/ServiceBoard.tsx](../src/app/service/ServiceBoard.tsx) —
  Schicht-Panel (Slider Schichtbeginn/-ende, Pause-Toggle, „Sonstige
  Reinigung" nur geloggt), Etagen-Sections mit Score-Badge, Zimmer-Dialog
  mit Slidern; 60-s-Fallback-Poll (Realtime-Token läuft nach ~1 h ab).
- [src/app/service/actions.ts](../src/app/service/actions.ts) — Slider-Logik:
  Schicht rahmt ein, ein Zimmer zur Zeit, `startCleaningAction` mit
  race-sicherem Claiming (bedingtes UPDATE auf gelesenen `cleaning_by`),
  `finishCleaningAction` (löscht checkout/priority/please_clean, DND bleibt),
  `abortCleaningAction` (`clean_aborted`), Schichtende schließt offene Pause
  implizit. Audit-Trio mit source `'maid'`.
- [src/components/SlideAction.tsx](../src/components/SlideAction.tsx) —
  1:1-Port aus HotCord, Farbfamilien auf RoSe-Semantik gemappt.
- [src/proxy.ts](../src/proxy.ts) — refresht jetzt auch svc_-Sessions
  (`/service/:path*`, Präfix-Mapping im Cookie-Adapter).
- [RealtimeListener](../src/components/RealtimeListener.tsx) — optionaler
  `token`-Prop → `realtime.setAuth()` (HotCord-Pattern; ohne ihn blockt RLS
  die postgres_changes fürs Service-Portal).

Keine Migration nötig — Schema v1 deckte maid_login_tokens/staff_log ab.

**Verifikation (Browser, End-to-End):** Maid „Maria K." (@maria) angelegt →
PIN 046055 in Liste sichtbar → Karten-Seite rendert QR + PIN →
Auto-Login-URL direkt aufgerufen → Board als Maria → Schicht-Slider →
Reinigung 102 gestartet (Kachel „Du bist hier", Schichtende gesperrt) →
Admin parallel „1 in Arbeit" (Cookie-Trennung: beide Sessions koexistieren)
→ abgeschlossen (0 offen, Etagen neu sortiert) → Pause an/aus → „Sonstige
Reinigung geloggt" → Schichtende (schließt Pause mit) → Logout → falsche
PIN generisch abgewiesen → Login Username+PIN → Admin-Check-in/-out 103 →
Board zeigt „Ausgecheckt", Etage 1 Score 2 zuerst. tsc/lint/build grün.

**Stolpersteine:** (1) Der dokumentierte `button[type=submit]`-Selektor-Fall
hat wieder zugeschlagen (Logout im Header) — Formular-spezifische Selektoren
verwenden. (2) React-Batching bricht synchron gefeuerte
PointerEvent-Sequenzen: `dragging`-State aus `pointerdown` ist beim direkt
folgenden `pointermove` noch nicht da — Events in getrennten Ticks
dispatchen. (3) Lint `react-hooks/immutability`: keine Reassignments aus
`.map`-Callbacks in Server Components.

---

## Phase 4 — Service-Baukasten (Session 2026-07-06)

Neue Dateien:

- [src/lib/money.ts](../src/lib/money.ts) — `parseEuroToCents` („4,50" →
  450, leer → null = ohne Preis), `formatCents` (Intl de-DE).
- [src/app/admin/services/](../src/app/admin/services/) — Konfigurator:
  Service anlegen (Name, Beschreibung, urgent-Flag), Optionen mit optionalem
  Preis hinzufügen, urgent togglen, **Archivieren statt Löschen** (Service
  und Option; FK `on delete restrict` — alte Orders referenzieren die
  Definition weiter).
- [src/app/guest/status/GuestServicesPanel.tsx](../src/app/guest/status/GuestServicesPanel.tsx)
  — Akkordeon pro Service, Options-Auswahl (Multi-Select, Pflicht ≥1 wenn
  Optionen existieren; Service ohne Optionen ist als Ganzes bestellbar),
  Notiz-Feld, Erfolgs-Feedback; darunter „Deine Bestellungen" mit
  open/done-Status (übers 15-s-Polling der Status-Seite aktuell).
- `placeOrderAction` in [guest/actions.ts](../src/app/guest/actions.ts) —
  validiert Service (Hotel, nicht archiviert) + Optionen serverseitig,
  schreibt `items_snapshot` (Label + Preis eingefroren — spätere
  Baukasten-Änderungen verfälschen alte Bestellungen nicht).
- [src/app/admin/bestellungen/](../src/app/admin/bestellungen/) — Orders-Tab:
  offene Bestellungen FIFO (älteste oben), urgent = rote Blink-Kachel +
  Badge, Items mit Preisen, Notiz, Alter; „Erledigt" mit Race-Guard
  (`.eq('status','open')` + betroffene Zeilen prüfen — Doppelklick meldet
  „bereits erledigt"); einklappbare „Zuletzt erledigt"-Liste (20, mit
  done_by-Name). Nav-Badge mit offener Anzahl im Admin-Layout
  (Realtime + `revalidatePath('/admin','layout')` halten ihn frisch).

Keine Migration nötig — Schema v1 deckte den Baukasten komplett ab.

**Verifikation (Browser, End-to-End):** Service „Extra Handtücher"
(Optionen: Handtuch groß 4,50 € / Handtuch klein ohne Preis) + „Problem
melden" (urgent, ohne Optionen) angelegt → Check-in 101 (PIN 5319) →
Gast-Login → beide Services sichtbar → Bestellung mit Option + Notiz
„Bitte vor 18 Uhr" → urgent-Bestellung „Dusche tropft" → Rezeption:
Nav-Badge „2", urgent blinkt rot, Preise/Notizen korrekt → „Erledigt" →
Badge weg, „Zuletzt erledigt (2)" mit Bearbeiter-Name → Gast sieht beide
als „erledigt". Keine Console-Errors, tsc/lint/build grün.

**Stolperstein:** Während der offenen Seite editierte Dateien → Fast
Refresh macht Server-Action-Referenzen stale; der Klick läuft dann gegen
eine tote Action-ID (RSC-Antwort enthält das 404-Template), die Transition
hängt und `pending` bleibt true. Reines Dev-Artefakt — nach Reload sauber.
Beim Browser-Testen nach Code-Edits: erst neu laden, dann klicken.

---

## 🔖 Wiederaufnahme — Stand 06.07. Abend

**Was steht:** Alle drei Portale komplett funktional gegen die
Live-Supabase-DB. Phasen 0–4 ✅: Rezeption (Zimmer, Check-in/-out + PIN,
Priorisieren, Personal mit QR-Karten, Service-Konfigurator, Orders-Tab mit
Nav-Badge), Gastportal (PIN-Login, Reinigen/DND, Service-Bestellung mit
Snapshot), Reinigungsboard (QR-/PIN-Login, Etagen-Score, Schicht/Pause,
Slider, Stale-Timeout).

**Nächster Schritt: Phase 5 — Politur** (letzte geplante Phase):

1. **QR-Druckseiten**: Zimmer-Aushang (erzeugt + befüllt endlich
   `room_guest_tokens` — die Route `/guest/r/<token>` wartet darauf;
   Erzeugen-Button + Druckseite pro Zimmer oder als Bogen) und
   Check-in-Handout (Zimmernummer + PIN + QR nach dem Check-in-Klick).
2. **Policies-UI**: Hotelname, pinLength (4–8), cleaningStaleMinutes,
   stayoverAutoClean + Uhrzeit editierbar (hotels.policies JSONB).
3. **Stayover-Automatik**: `stayoverAutoClean` — belegte Zimmer ohne DND
   bekommen zur konfigurierten Uhrzeit ein Reinigungs-Signal (Ableitung
   im Loader oder leichter Trigger — designen, kein Cron nötig machen).
4. **Etagenscore-Feintuning** + Kleinkram (Passwort ändern fürs
   Management, hotels.name-Anzeige).

**Testzugänge:** rezeption@rose.local / F51DeP17ed1w. Maid: maria /
PIN 046055 (Karte unter /admin/personal). Zimmer 101–105 (Etage 1),
201–203 (Etage 2). Test-Reste: 101 belegt (PIN 5319), 103 checkout_pending.
2 Services angelegt, 2 erledigte Bestellungen. Dev: `npm run dev`,
http://localhost:3000.

**Erinnerungen:** Neue Migrationen nach `Supabase_sql/`, nach Einspielen
`git mv` ins `archive/`. Browser-Test-Fallen: Formular-spezifische
Submit-Selektoren (Logout-Button matcht auch), PointerEvents in getrennten
Ticks, nach Code-Edits erst reloaden (stale Action-IDs).
