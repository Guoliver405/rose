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
   - **Baseline**: Hotel-Adresse → `/h/<slug>/guest` → Zimmernummer + PIN eingeben (steht auf dem Check-in-Handout).
   - **Komfort**: statischer Zimmer-QR (einmal gedruckt, klebt im Zimmer) → `/guest/r/<token>` → nur PIN eingeben.
   Nach PIN-Erfolg: Session-Cookie (`stays.session_token`), keine erneute Eingabe.
3. **Während des Aufenthalts**: Gast wählt „Zimmer reinigen" / „DND", bestellt Services aus dem Baukasten.
4. **Check-out** = ein Klick → beendet den Stay (PIN + Cookie sofort tot), setzt `checkout_pending` am Zimmer.
5. **Reinigungsboard** (gemeinsam für alle Kräfte, keine individuelle Anleitung): Etagen mit Zimmern, **drei aktive Status**: Reinigung gewünscht / ausgecheckt / priorisiert. Unbelegt, DND oder ohne Wunsch = ausgegraut, aber sichtbar. Reinigungskräfte taggen nur Start + Abschluss; „Kollegin in Zimmer X" ist live sichtbar. Etagenscore als leichte Priorisierungshilfe.

### Entschiedene Design-Punkte (Diskussion 2026-07-05)

- **Zimmerstatus ist event-getrieben, nicht abgeleitet** — der Check-in-/Check-out-Klick IST die Wahrheit. Keine `deriveCleanState`-Logik wie in HotCord.
- **Sicherheit**: statischer Zimmer-Token (unguessbar) + Aufenthalts-PIN (4 Ziffern, Default; per Policy konfigurierbar) + Rate-Limit (5 Fehlversuche → 15 min Sperre, `stays.pin_attempts`/`pin_locked_until`). PIN im Plaintext in `stays.pin` — bewusst (Rezeption muss ablesen können, Schadenspotenzial minimal, Lebensdauer = Aufenthalt).
- **Stayover-Routine-Reinigung**: Hotel-Policy (`policies.stayoverAutoClean` + Uhrzeit), Default aus.
- **Reinigungs-Zeitfenster** (25.07.2026): Hotel-Policy (`cleaningWindowEnabled` + `cleaningWindowStart`/`cleaningWindowEnd`, Default aus) begrenzt, wann Gäste den Reinigungswunsch absetzen dürfen. Betrifft **nur** `please_clean` — DND und das Zurücknehmen eines aktiven Wunsches bleiben jederzeit möglich; bereits gesetzte Wünsche laufen weiter (kein Auto-Reset). Gesperrt wird doppelt: Button im Gastportal deaktiviert + Hinweis mit den Zeiten, dazu ein Riegel in `setGuestSignalAction`. `isWithinCleaningWindow` in [board.ts](src/lib/board.ts) liest Start > Ende als über Mitternacht laufendes Fenster.
- **Priorisierung**: manueller Rezeptions-Eingriff (Beschwerden, Sonderfälle) — kein Automatismus.
- **Maid-Identität**: echte Accounts + QR-Login-Karten (Pattern 1:1 aus HotCord, `maid_login_tokens`), weil Reiniger-Tracking ein echtes Zusatzfeature ist. Vereinfachtes Logging in `staff_log` (shift/break/other_cleaning/clean_start/clean_done).
- **Slider-Logik aus HotCord**: „Reinigung starten" erlaubt danach nur „Reinigung abschließen"; Schichtbeginn/-ende rahmen ein; Pause und sonstige Reinigung laufen als Zeiträume innerhalb der Schicht und dürfen sich mit nichts überschneiden (Pausenbeginn und Zimmerreinigung beenden eine laufende sonstige Reinigung implizit, das Schichtende schließt beide).
- **SlideAction** (25.07.2026 gehärtet): Der Zug muss AM GRIFF beginnen und die Bahn zu 97 % zurücklegen. Vorher sprang der Griff zum Berührungspunkt und löste ab 85 % aus — ein Wackeln am rechten Bahnende genügte. Entscheidungen (Position, Schwelle) laufen über eine Ref, nicht über State: Zeiger-Ereignisse können schneller kommen, als React rendert. `size="compact"` (40 px statt 56 px) und `direction="rtl"` (von rechts nach links, passend für Zurück-Wege) für Nebenwege wie „Etage verlassen". Intern zählt `travel` die zurückgelegte Strecke ab Ruhepunkt statt der Position auf der Bahn — dadurch ist die Laufrichtung nur ein Vorzeichen plus die verankerte Kante. Die Bahnlänge wird in den Zeiger-Handlern IMMER frisch aus dem DOM gemessen; ein State-Wert wäre beim ersten Zug nach dem Mount womöglich noch 0 und der Griff bliebe kleben.
- **Vergessener Abschluss**: nach `policies.cleaningStaleMinutes` (Default 90) automatisch zurück auf offen; manuell übersteuerbar.
- **Check-in auf ungereinigtes Zimmer**: Warnung mit Override (`force`-Pattern aus HotCord).
- **Rechte** (revidiert 26.07.2026 mit Phase 6d, ursprünglich „kein Rollen-System"): vier Rollen. **Admin** = Kontoinhaber und zahlender Kunde (`account_members`) — alle Häuser seines Kontos plus den Konto-Teil von `/admin`. **Manager** (`hotel_members`, role `manager`) = eine Teilmenge der Häuser, dort dieselben Rechte wie der Inhaber, aber kein Konto-Zugriff. **Rezeption** (`hotel_members`, role `reception`) = Tagesgeschäft eines Hauses (Check-in/-out, Prioritäten, Bestellungen, Handouts, Karten-/Aushang-Druck, eigenes Passwort) — ohne Einstellungen, Zimmer-Setup, Services, Personal-Verwaltung, „Code erneuern". **Reinigung** = `profiles.username IS NOT NULL`, ein Haus. Guards: `getManagementContext(slug)` (jede Rolle), `getAdminContext(slug)` (Inhaber + Manager), `getAccountContext()` (nur Inhaber, für den Konto-Teil von `/admin`). **Alle drei Personal-Arten liegen an einer Stelle** — `/h/<slug>/admin/personal`: Reinigung und Rezeption legt jede verwaltende Rolle an, Manager nur der Inhaber.
- **Admin-Navigation** (25.07.2026): Nav = Übersicht | Services | Einstellungen. „Services" ist das Anfragen-Board (Route `/h/<slug>/admin/bestellungen`); der Konfigurator heißt im Einstellungen-Hub „Service-Baukasten". `…/admin/einstellungen` ist ein rollenabhängiger Kachel-Hub: Inhaber und Manager sehen Hotel & Regeln, Zimmer, Personal, Service-Baukasten, QR-Aushänge, Passwort und (temporär) Test-Szenario; Rezeption nur Aushänge, Personal-Karten, Passwort. Alle Setup-Routen liegen seit 6d ebenfalls unter dem Slug. Zimmer-Kacheln der Übersicht tragen bei offenen Service-Anfragen eine Glocke neben der Nummer (blinkt rot via `.blink-icon`, wenn mindestens eine Anfrage einen dringenden Service betrifft). Der Hub führt zusätzlich auf `…/admin/auswertung` (Inhaber + Manager). **Rechts in der Kopfzeile genau ein Weg aus dem Haus heraus** (26.07.2026): „Häuser" (→ `/admin`), **immer sichtbar** für Inhaber und Manager, auch bei genau einem Haus — die Rezeption sieht ihn nicht. Vorher hing der Konto-Bereich an einer Seite, die bei einem Haus übersprungen wurde: Einzelhaus-Inhaber kamen so nie an ihr Konto und konnten kein zweites Haus anlegen, keinen Manager und keinen Plan sehen. Ab Phase 6b wäre das der Zustand **jedes** neu registrierten Kunden gewesen. **Manager werden hausbezogen verwaltet** — Abschnitt „Personal — Manager" auf `…/admin/personal`, neben Reinigung und Rezeption, nur für `ctx.isOwner` (ein Manager, der Mit-Manager ernennt, wäre Rechteausweitung). Wer jemanden über mehrere Häuser einsetzt, trägt ihn je Haus ein; ab dem zweiten Mal per Auswahl aus den vorhandenen Managern des Kontos, ohne neuen Zugang. Entfernen wirkt nur auf **dieses** Haus.
- **Farbsprache der Boards** (25.07.2026): Violett (`accent`) = priorisierte Reinigung (Balken, Flag-Icon, `.blink-ring-priority`, SlideAction-Variante `priority`); Rot + Blinken (`critical`, `.blink-ring-overdue`/`.blink-icon`) = dringende Service-Anfrage (Kachel-Ring, Glocke, Nav-Badge); Rosé (`blocked`) = DND mit `Ban`-Icon (nicht mehr Mond); Amber = Gast-Wunsch/Routine; Orange (`caution`) = ausgecheckt; Grün = bereit; Blau (`fresh`) = belegt. Eine laufende Reinigung zeigt in der Admin-Übersicht NUR den Spinner (Balken behält die Grundfarbe bis zum Abschluss); auf dem Reinigungsboard bleibt der grüne „in Arbeit"-Balken (dort gibt es kein grünes „bereit", keine Verwechslungsgefahr). Bei Prio + dringendem Service gleichzeitig gewinnt Rot am Ring, die Prio bleibt über Balken + Flagge sichtbar.
- **Standard-Services**: [service-templates.json](src/lib/service-templates.json) („Technischer Dienst" kostenfrei/dringend, „Wäscheservice" mit Preis-Optionen) wird bei `create-tenant.mjs` automatisch geseedet; im leeren Service-Konfigurator gibt es zusätzlich „Beispiel-Services anlegen" (skippt vorhandene Namen). Ganz normale Services — Hotels können sie archivieren.
- **Deaktivieren statt Löschen** (25.07.2026): Ausgeschiedene Reinigungskräfte bekommen `profiles.deactivated_at` — Login wird an allen drei Stellen abgewiesen (`getMaidContext` wirft auch bestehende Sessions raus, `maidLoginAction`, QR-Auto-Login-Route), `maid_presence` wird geräumt, die Login-Karte bleibt gespeichert (wirkungslos, ermöglicht nahtlose Reaktivierung). Hartes Löschen bleibt als Notausgang für Fehlanlagen, ist aber im UI hinter „Deaktiviert" versteckt — die FK-Kaskade nimmt sonst den `staff_log` mit und zerstört den Arbeitsnachweis. **Fallstrick:** Die Login-Seite darf NICHT auf die rohe Session prüfen (`if (session) redirect('/service')`) — eine deaktivierte Kraft behält ihr Cookie, Board und Login schöben sich sonst gegenseitig im Kreis. Maßgeblich ist `getMaidContext()`; liegt eine Session ohne Kontext vor, erklärt die Login-Seite den gesperrten Zugang.
- **Auswertung Reinigung** (25.07.2026): `/admin/auswertung` (Admin-only, Kachel im Einstellungen-Hub) rechnet aus `staff_log` Arbeits-/Pausen-/Reinigungszeiten — Hausbilanz, Tabelle je Kraft (inkl. deaktivierter) und Tagesprotokoll je Kraft. Zeitraum über GET-Parameter `from`/`to`/`maid`, damit Stände teil- und druckbar bleiben. Rechenlogik ohne I/O in [worklog.ts](src/lib/worklog.ts): Paarbildung der Stiche, Klammerung an den Zeitraum (Schichten über Mitternacht), Reinigungen ohne Abschluss oder länger als `cleaningStaleMinutes` sowie Schichten über `MAX_SHIFT_HOURS` (16 h, vergessenes Schichtende) und Pausen über `MAX_BREAK_HOURS` (4 h) gelten als unplausibel und bleiben aus den Summen draußen (separat als „Auffällig" ausgewiesen) — ohne diese Regel schleppt eine offene Schicht tagelang weiter und macht die Arbeitszeit unbrauchbar. „Sonstige Reinigung" läuft seit 25.07.2026 als Zeitraum (`other_start`/`other_end`) und wird als eigene Position ausgewiesen; „Übrige Zeit" = Netto − Zimmerreinigung − sonstige Reinigung (Wege, Rüstzeit). Alt-Stiche `other_cleaning` (ohne Ende) bleiben gültig und werden separat als „Alt-Stiche ohne Dauer" gezählt.
- **Multi-Tenant** (Umbau 26.07.2026): `hotel_id` überall im Schema; Eindeutigkeiten bewusst NUR je Hotel (`unique (hotel_id, username)`, `unique (hotel_id, number)`). Zimmernummer und Benutzername sind also **nicht global eindeutig** — jede Auflösung einer solchen Kennung MUSS auf ein Hotel eingegrenzt sein. Dafür trägt `hotels.slug` den Mandanten in die URL: die beiden öffentlichen Formular-Logins liegen unter `/h/<slug>/guest` und `/h/<slug>/service/login`, der Slug wird serverseitig über `requireHotelBySlug` in [hotel.ts](src/utils/hotel.ts) aufgelöst (unbekannt ⇒ 404, **kein** öffentliches Hotel-Verzeichnis). **Token-Routen bleiben mandantenfrei** (`/guest/r/<token>`, `/service/auto/<token>`) — der Token ist global eindeutig und trägt den Mandanten selbst, gedruckte QR-Codes überleben damit jeden Routing-Umbau. Weil alle Mandanten denselben Origin teilen, gilt das Sitzungs-Cookie auch unter fremden Slugs: **jede Portalseite gleicht `ctx.hotelId` gegen das Hotel aus der URL ab** und schickt bei Abweichung auf die dortige Anmeldung.
- **Checkliste Mandanten-Filter** — gilt seit Phase 6d für **beide** Clients: jede Query trägt `.eq('hotel_id', …)`, außer sie grenzt über einen global eindeutigen Token oder eine UUID ein.
  - `createAdminClient()` umgeht RLS: hier fällt kein Fehler an, sondern nur die Mandantengrenze. Bei Schreibzugriffen zusätzlich prüfen, ob die Zeile dem eigenen Haus gehört (`row.hotel_id !== ctx.hotelId → Abbruch`), bevor per `id` geschrieben wird.
  - **`createClient()` (RLS) reicht NICHT mehr als Mandantengrenze.** Bis 6c gab RLS genau ein Hotel frei, seither sieht ein Kontoinhaber alle Häuser seines Kontos — ohne expliziten Filter mischen sich Nachbarhäuser in Übersicht, Badges und Listen. Beim Umbau betraf das u. a. Layout-Badge, Zimmer-Übersicht, Bestellungen, Personal, Services und Aushänge.
  - Bewusste Ausnahme: die Slug-Eindeutigkeitsprüfung fragt global — der Slug IST global eindeutig.
- **Rollen** (6d): `admin` = Kontoinhaber (alle Häuser des Kontos + Konto-Teil von `/admin`) · `manager` = Teilmenge der Häuser, im Haus dieselben Rechte wie der Inhaber, aber kein Konto-Zugriff · `reception` = Tagesgeschäft, hausintern · Reinigung über `profiles.username`. `getManagementContext(slug)` liefert jede Rolle, `getAdminContext(slug)` nur Inhaber und Manager, `getAccountContext()` nur den Inhaber. **Der Slug ist Pflicht-Parameter** — so zeigt der Type-Check jede Aufrufstelle, statt dass eine stillschweigend auf dem falschen Haus arbeitet.
- **`profiles` ist der Identitäts-Anker, nicht die Berechtigung** (6d): `stays.created_by` und `service_orders.done_by` zeigen mit `on delete set null` darauf — Management-Zeilen dürfen dort deshalb NICHT gelöscht werden, sonst reißt es die Attribution aus Zimmer-Verlauf und Bestell-Historie. `profiles.hotel_id` bedeutet für Management nur noch „Stammhaus". Genau deshalb ist der `profiles`-Zweig in `is_hotel_member` auf `username is not null` eingeschränkt: sonst würde der **Entzug** von Manager- oder Rezeptionsrechten nicht greifen.
- **Service-Baukasten abgespeckt**: nur urgent-Flag, Lifecycle nur `open → done`, Preise optional (Anzeige-Info).

---

## Befehle

```bash
npm run dev        # Dev-Server (Turbopack)
npm run build      # Produktions-Build
npm run verify     # typecheck + lint + test — vor jedem Commit
npm run typecheck  # tsc --noEmit
npm run lint       # ESLint
npm run test       # Vitest (einmalig)
npm run test:watch # Vitest im Watch-Modus
```

## Tests

**Unit (Vitest, `src/lib/*.test.ts`)** — die reine Rechenlogik, kein I/O, keine
DB, kein React. Das Projekt hält diese Logik bewusst I/O-frei (`board.ts`,
`worklog.ts`, `shift.ts`, `slug.ts`, `rooms.ts`, `ids.ts`, `maid.ts`,
`money.ts`); genau das macht sie testbar. Schwerpunkt liegt auf den Randfällen,
die im UI unsichtbar falsch sein können: Zeitfenster über Mitternacht,
Stayover-Fälligkeit, Stale-Timeout, Schicht-Paarbildung mit Klammerung und
Plausibilitätsgrenzen, Abrechnungsregel je Zimmer.

**Integration (`tests/integration/`) gegen die Supabase-Instanz des Projekts** —
hier liegt das größte Risiko, denn beide ernsten Funde vom 26.07.2026 waren
Isolationslücken. Zwei Ebenen:

- `rls.test.ts` — die Grenzen **an der Quelle**: was geben `is_hotel_member` /
  `is_hotel_management` tatsächlich frei? Inklusive der Probe, dass ein
  **Rechte-Entzug sofort wirkt** (die `profiles`-Zeile darf keine Hintertür
  offenhalten).
- `guards.test.ts` — was die App daraus macht: `getManagementContext(slug)`,
  `getAdminContext`, `listAccessibleHotels`, `getAccountContext`. `next/headers`
  ist ersetzt, der Cookie-Speicher enthält eine **echte** Supabase-Session.

Die Testwelt (`tests/integration/helpers/world.ts`) baut zwei Konten mit genau
den Kollisionen, die uns eingeholt haben: dieselbe Zimmernummer in zwei Häusern,
derselbe Maid-Benutzername in zwei Häusern.

```bash
npm run test:integration
```

**Kein Docker, kein WSL, keine Supabase-CLI.** Die Tests laufen neben den echten
Daten in derselben Instanz; möglich macht das eine einzige, strikt
durchgehaltene Regel: *angefasst wird ausschließlich, was der Lauf selbst
erzeugt hat.* Drei Schichten setzen sie um — (1) jeder Lauf zieht eine zufällige
Kennung und schreibt sie in **jeden** Namen (`itest-<lauf>-…`: Konto, Slug,
E-Mail, Benutzername), (2) `destroyWorld()` löscht nur über eingesammelte IDs,
nie über Aufzählen oder Muster, (3) vor jedem Löschen wird die Zeile gelesen und
auf die Kennung geprüft — fehlt sie, bricht der Lauf ab, statt zu löschen. Ein
Fehler in der Aufräumroutine kostet damit einen roten Test, keine Daten. Reste
abgestürzter Läufe kehrt `sweepStaleRuns()` nach zwei Stunden auf.

Der ursprüngliche Entwurf löschte beim Aufbau schlicht **alle** Konten und
Auth-Nutzer der Datenbank. Genau das — und nur das — erzwang eine eigene lokale
Instanz samt Docker und WSL. Die Regel oben ersetzt den ganzen Unterbau. Preis:
`supabase db reset` fällt weg, die Migrationen werden also nicht mehr gegen eine
leere DB nachgespielt. Das war ohnehin kein echter Verlust, weil Migrationen
laut Konvention von Hand im SQL-Editor eingespielt werden.

Verbindungsdaten liest `tests/integration/setup.ts` aus bereits gesetzten
Umgebungsvariablen, sonst aus `.env.local` — nichts ist hartkodiert. Genau diese
Reihenfolge lässt denselben Testcode in CI laufen, wo die drei Schlüssel als
GitHub-Secrets aus der Job-Umgebung kommen.

**Noch nicht abgedeckt:** die Login-Actions selbst (`guestLoginAction`,
`maidLoginAction`) — sie leiten per `redirect()` um und brauchen etwas mehr
Gerüst. Der Gast-Rate-Limit-Test („fünf Fehlversuche sperren nur das eigene
Haus") wäre der nächste sinnvolle Schritt.

**Manuell bleibt** ohnehin: Druck-Layouts, Farbsprache, Bedien-Eindruck — siehe
[Testplan-Walkthrough.md](Sessions/Testplan-Walkthrough.md).

CI läuft über [.github/workflows/ci.yml](.github/workflows/ci.yml) bei Push auf
`main` und bei Pull Requests, in zwei Jobs:

- `verify` — typecheck, lint, Unit-Tests, Build (Build mit Platzhalter-Keys,
  ohne DB-Zugriff).
- `integration` — `npm run test:integration` gegen die echte Instanz, `needs:
  verify`. Die drei Schlüssel liegen als **GitHub-Secrets**
  (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  `SUPABASE_SECRET_KEY`); eine Vorprüfung bricht mit klarer Meldung ab, wenn
  eines fehlt. Aus Fork-Pull-Requests wird der Job übersprungen, weil GitHub
  dorthin keine Secrets reicht. Bewusst **keine** `concurrency`-Gruppe: die
  lauf-gebundenen Fixtures vertragen parallele Läufe, ein Abbruch mitten im
  Aufräumen dagegen hinterlässt Reste.

**Achtung:** Vercel deployt bei Push auf `main` unabhängig davon — ein rotes CI
bremst das Deployment nicht. Wer es blocken will, arbeitet über Pull Requests
und macht die Jobs zu Required Checks.

Alias `@/` zeigt auf `src/`.

## Tech-Stack

Next.js 16 App Router · TypeScript · Tailwind CSS 4 · Supabase (PostgreSQL + RLS + Realtime)

`params` in Next.js 16 ist ein Promise: `const { id } = await params`.

## Drei Portale

| Route | Nutzer | Auth |
|---|---|---|
| `/admin` | Inhaber + Manager | **Häuser und Konto auf einem Bildschirm**: Konto-Kasten (Plan, Zimmerzahlen, Abrechnung) für den Inhaber, darunter alle erreichbaren Häuser mit Lagebild, dazu „Haus anlegen". **Leitet nie weiter** — der Einstieg entscheidet die Login-Seite. Zweite Auth-Fläche außerhalb von `/h/<slug>/`, eigener Guard (`getAccountContext` für den Konto-Teil) |
| `/h/<slug>/admin` | Rezeption/Management | Supabase Auth (E-Mail); Rolle je Haus aus `account_members` (Inhaber) oder `hotel_members` (Manager/Rezeption) |
| `/h/<slug>/service` | Reinigungskräfte | Eigener Cookie-Namespace `svc_` (`createServicePortalClient`) |
| `/h/<slug>/guest` | Gäste | Anonym: Zimmernummer + Stay-PIN → Session-Cookie |
| `/guest/r/<token>` · `/service/auto/<token>` | QR-Einstiege | Token global eindeutig → mandantenfrei, leitet auf die Slug-Route weiter |
| `/guest` · `/service/login` | — | Hinweisseiten ohne Mandant („QR scannen bzw. Hotel-Adresse nutzen"), bewusst ohne Hotel-Auswahl |
| `/registrieren` | neue Kunden | Self-Service-Registrierung mit Einladungscode (Phase 6b); Angemeldete werden wie auf `/login` weitergeleitet |
| `/passwort-vergessen` · `/auth/callback` · `/passwort-neu` | Management | Passwort zurücksetzen. Der Versand ist **Supabase-Sache** (`resetPasswordForEmail`) — kein Resend-Code in der Anwendung, nur die SMTP-Einstellung im Projekt. `/auth/callback` tauscht den Code gegen eine Sitzung (**PKCE: derselbe Browser**, in dem angefordert wurde) und leitet auf `/passwort-neu` |

**Cookie-Trennung:** Admin- und Reinigungs-Portal teilen denselben Browser-Origin. Das Reinigungs-Portal nutzt [service-portal.ts](src/utils/supabase/service-portal.ts) mit Präfix `svc_` — nie `createClient()` aus `server.ts` in `/service`-Routen verwenden.

## Supabase-Client-Muster

```typescript
createClient()              // src/utils/supabase/server.ts — RLS aktiv, lesend
createAdminClient()         // src/utils/supabase/service.ts — Secret Key, RLS umgangen
createServicePortalClient() // src/utils/supabase/service-portal.ts — svc_-Cookies
createClient() [client.ts]  // Browser — nur Realtime-Subscriptions
```

**Faustregel (aus HotCord):** Alle Server-Actions, die schreiben oder löschen, verwenden `createAdminClient()` nach manueller Auth-Prüfung — Supabase gibt bei RLS-blockierten `DELETE`/`UPDATE` keinen Fehler zurück (`{ data: [], error: null }`).

Env-Vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`, `SIGNUP_INVITE_CODE` (Registrierung; **leer oder fehlend = Registrierung geschlossen**).

## Datenmodell (Schema v1)

Siehe [supabase_schema_v1.sql](Supabase_sql/supabase_schema_v1.sql). Kern:

- `hotels` — Mandant + `slug` (unique, `[a-z0-9-]`, = Mandanten-Kennung in der URL) + `policies` JSONB (stayoverAutoClean, pinLength — Default **6** seit 26.07.2026, cleaningStaleMinutes, cleaningWindow*)
- `profiles` — Personal; Discriminator: `username IS NOT NULL` = Reinigungskraft; Management-Logins tragen `role` (`admin` | `reception`); `deactivated_at` = ausgeschieden (siehe unten)
- `rooms` — Nummer + Etage + optional Gebäude, keine Geometrie; `deactivated_at` = **außer Betrieb** (26.07.2026). Deaktivierte Zimmer verschwinden von Reinigungsboard, QR-Aushang und den Betriebs-KPIs, nehmen keinen Check-in an und behalten ihre komplette Historie. **Gelöscht wird nicht mehr** — `deleteRoomAction` verweigert, sobald Aufenthalte, Service-Anfragen, Reinigungs-Stiche oder Status-Änderungen existieren (Notausgang für Fehlanlagen, im UI hinter „außer Betrieb" versteckt). Grund: die Kaskade nähme `stays`, `service_orders`, `room_states` und `room_guest_tokens` mit — und damit die Belege der Abrechnung. Die Zimmernummer bleibt belegt (`unique (hotel_id, building, number)` gilt weiter).
- `room_guest_tokens` — statischer QR-Token pro Zimmer (PK = room_id)
- `stays` — anonymer Aufenthalt: PIN, session_token, Rate-Limit-Felder; Partial-Unique `room_id WHERE checked_out_at IS NULL` verhindert Doppel-Check-in strukturell
- `room_states` — event-getriebener Status: `guest_signal` (none/please_clean/dnd), `checkout_pending`, `priority`, `cleaning_by`/`cleaning_started_at`; `last_updated_at` wird von jeder statusrelevanten Action getoucht (Realtime-Kick)
- `room_state_transitions` — Audit via `AFTER UPDATE`-Trigger (SECURITY DEFINER), eine Zeile pro geändertem Feld, `IS DISTINCT FROM` filtert reine Touches; Attribution über `last_update_source`/`last_updated_by` im Payload. Sichtbar gemacht im **Zimmer-Verlauf** (25.07.2026): `getRoomHistoryAction` in [history-actions.ts](src/app/admin/history-actions.ts) führt Transitions + `staff_log` + `stays` + `service_orders` zu einer Zeitleiste zusammen (30 Tage), die der Zimmer-Dialog der Übersicht beim Öffnen nachlädt — für Arbeitsnachweis und Beschwerde-Aufklärung, auch für die Rezeption. `checkout_pending`-Transitions werden übersprungen (immer Dublette zu Check-out bzw. `clean_done`); Gast-Ereignisse tragen nie eine Identität, nur „Gast".
- `maid_login_tokens` — QR-Login-Karten (PK = profile_id, UPSERT invalidiert alte Karte)
- `maid_presence` — Etagen-Verortung der Reinigungskräfte (PK = profile_id, UPSERT beim Etagenwechsel; gelöscht bei Schichtende/„Zurück"; Stale-Guard 16 h via `isPresenceFresh`). Das Reinigungsboard hat eine Etagen-Zwischenebene: nach Schichtbeginn erst Etagen-Zeilen (feste Reihenfolge wie Admin-Übersicht, KEINE Score-Sortierung mehr), Genau eine Etagen-Zeile trägt das Abzeichen „Als Nächstes" (Zielscheibe, Aktionsfarbe): empfohlen wird die höchste **noch offene** Dringlichkeit (Summe der `roomScore` der aktiven, nicht gerade gereinigten Zimmer) geteilt durch `Kräfte vor Ort + 1`; Etagen ohne offene Arbeit fallen raus, bei Gleichstand gewinnt die untere Etage (kein Springen). Die Zielscheibe blinkt nur, wenn die Zeile nicht ohnehin schon wegen offener Priorität blinkt — bewusst KEINE Grün-Rot-Skala über die Etagen, weil Grün auf der Zeile bereits „fertig" und Rot projektweit „dringende Service-Anfrage" bedeutet. Etage wählen = einbuchen, dann nur die Zimmer dieser Etage; das Verlassen läuft über einen kompakten Slider in einer eigenen Zeile zwischen Statusleiste und Zimmern (Fehltipper sollen nicht aus der Etage werfen), die violette Prio-Warnlampe in der Statusleiste ist reine Anzeige ohne Klickfunktion. Das Board trägt nur eine **kompakte Statusleiste** (aktueller Zustand + „X offen"/„Y in Arbeit" + Knopf „Status"); sämtliche Zustandswechsel (Schicht, Pause, sonstige Reinigung) liegen auf `/service/status` — eigene Route statt Overlay, damit die Zurück-Taste am Handy greift. Die Seite zeigt zusätzlich eine Tagesbilanz der Kraft. Verortung ist live für Kolleginnen und in den Etagen-Headern der Rezeptions-Übersicht sichtbar.
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
- **Reihenfolge beachten (Push = Auto-Deploy!):** Additive Migrationen (neue Spalte mit Default) zuerst einspielen, dann pushen — kein Bruch. Bei Migrationen, die alten Code brechen (z. B. Constraint-Wechsel, auf den `onConflict` zeigt), Code erst committen, NICHT pushen, Migration einspielen lassen, dann sofort pushen — das Fenster, in dem Live-Code gegen das neue Schema läuft, klein halten.

## Theming

3-Schichten-Token-System in [globals.css](src/app/globals.css), 1:1 aus HotCord portiert (Präfix `--rs-`): Primitives → Semantic → `@theme inline`. Komponenten nutzen **nur** semantische Utilities (`bg-positive`, `text-ink-muted`, `border-edge`, `bg-action`, `text-action-foreground`, …) — nie Tailwind-Roh-Farben. Dark/Auto-Theme, Density (compact/standard/comfortable), High-Contrast, Color-Blind-Modi und Print-Light sind fertig verdrahtet über `data-*`-Attribute auf `<html>`.

Auf saturierten Buttons per-Family-Foreground verwenden (`bg-attention text-attention-foreground`), nie `text-ink-inverse` (theme-flippt).

## Bekannte Fallstricke (aus HotCord geerbt, gelten hier genauso)

| Problem | Lösung |
|---|---|
| DELETE/UPDATE löscht nichts, kein Fehler | RLS blockiert lautlos → Admin-Client + manuelle Auth-Prüfung |
| 404 auf existierende Route im Dev | `.next/` löschen + Dev-Server neu (Turbopack-Type-Cache korrupt) |
| Client-Komponente reagiert im Dev gar nicht mehr (Handler tot), obwohl der Code stimmt | Konsole prüfen: hängt der Client-Bundle auf einem alten Stand (`Export … doesn't exist`, `useEffect […] changed size between renders`), hilft nur `.next/` löschen + Dev-Server neu. Beim Messen im Browser außerdem beachten: React aktualisiert das DOM erst NACH dem Event-Handler — direkt nach einem synthetischen `pointermove` gelesene Stile sind immer noch die alten; am fachlichen Ergebnis prüfen |
| Tailwind scannt Markdown/SQL | `@source not`-Einträge in globals.css pflegen |
| Floating-Modal in Button-Größe | Vorfahre mit `transform`/`translate` erzeugt Containing-Block → `createPortal(document.body)` |
| `revalidatePath('/admin')` invalidiert keine Unterseiten | `revalidatePath('/admin', 'layout')` |
| Login auf Vercel scheitert mit `TypeError: Cannot convert argument to a ByteString` | Env-Var-Wert enthält Unicode-Müll (PowerShell-Pipe in `vercel env add`) → Werte aus Git Bash mit `printf '%s' '…' \| vercel env add` setzen, danach redeployen |
| User anlegen/löschen scheitert mit `invalid JWT: … unrecognized JWT kid <nil> for algorithm ES256` (nur auf Vercel, lokal ok) | `SUPABASE_SECRET_KEY` in Vercel war noch der Legacy-`service_role`-JWT: PostgREST akzeptiert ihn weiter, aber die Auth-Admin-API verifiziert gegen die neuen ES256-Signatur-Schlüssel → Env-Var auf den `sb_secret_…`-Wert aus `.env.local` setzen (Git-Bash-`printf`-Muster!), redeployen (behoben 25.07.2026) |
| Maid-Login mit korrekter PIN wird abgewiesen, QR-Login funktioniert | Derselbe `username` existiert in mehreren Hotels (`unique (hotel_id, username)` ist nur je Hotel eindeutig). Strukturell gelöst seit 26.07.2026: der Slug in der URL grenzt auf genau einen Kandidaten ein. Die Zwischenlösung vom 25.07. (PIN-Vorsortierung + Anmeldeschleife) ist entfernt — sie war ein PIN-Orakel über Mandantengrenzen |
| Gast/Reinigungskraft sieht Portal unter fremdem Hotelnamen | Sitzungs-Cookies gelten originweit, also auch unter fremden Slugs. Jede Portalseite muss `ctx.hotelId` gegen `requireHotelBySlug(slug)` prüfen — fehlt der Abgleich, rendert das eigene Zimmer/Board unter falschem Branding |
| Realtime-Updates kommen im Portal nie an (keine Console-Fehler, Board bleibt eingefroren) | `RealtimeListener` ohne `token` gerendert: der Browser-Client verbindet nur mit dem Publishable Key, RLS filtert alle `postgres_changes` weg — auch wenn die Session in den Default-Cookies liegt. Access-Token der Session übergeben (`realtime.setAuth`) + `pollMs`-Fallback gegen Token-Ablauf (~1 h) |
| Passwort-Reset an einen Testzugang scheitert mit „Email address … is invalid" | Supabase weist **nicht routbare Endungen wie `.local` grundsätzlich ab**, noch vor jedem Versandversuch. Alle Testzugänge des Projekts (`@rose.local`) sind davon betroffen — der Reset ist mit ihnen **nicht** testbar, dafür braucht es einen Zugang mit echter Adresse. Kein Fehler der Anwendung |
| Reset-Link führt auf „Link ist nicht mehr gültig", obwohl er frisch ist | PKCE: `resetPasswordForEmail` legt den `code_verifier` als Cookie ab, `exchangeCodeForSession` braucht ihn. Der Link muss in **demselben Browser** geöffnet werden, in dem er angefordert wurde — aus dem Mail-Client eines anderen Geräts heraus schlägt der Tausch zwangsläufig fehl |
| Reset-Mail enthält einen `localhost`-Link | Kein Fehler: das Ziel kommt aus `NEXT_PUBLIC_SITE_URL`, und lokal steht dort `http://localhost:3000`. Wer auf dem Dev-Server anfordert, bekommt einen Localhost-Link — brauchbar nur auf demselben Rechner. Für einen belastbaren Test auf der Produktionsadresse anfordern. Zusätzlich in Supabase die **Site URL** auf die Produktionsadresse setzen; sie ist die Rückfallebene für Mails ohne eigenes `redirectTo` |
| `resetPasswordForEmail` scheitert mit `AuthRetryableFetchError`, status 500, `message: '{}'` | Der SMTP-Versand ist **in Supabase** gescheitert, nicht bei uns — GoTrue liefert dafür einen leeren 500er. Ursache steht in **Resend → Logs** (kein Eintrag ⇒ Supabase hat Resend nie erreicht, also Host/Port/Schlüssel prüfen; Eintrag mit Ablehnung ⇒ Verkabelung stimmt, Empfänger unzulässig) und in **Supabase → Authentication → Audit Logs**. Häufigster Fall: Absender `onboarding@resend.dev` ohne verifizierte Domain — Resend stellt dann **nur an die Adresse des eigenen Kontos** zu |

## Phasen-Plan

- **Phase 0** — Scaffold, Theming-Port, Supabase-Clients, Schema v1 ✅
- **Phase 1** — Admin: Login, Zimmer-Setup, Zimmer-Übersicht, Check-in/-out mit PIN-Anzeige, Priorisieren ✅
- **Phase 2** — Gastportal: `/guest` + `/guest/r/<token>`, PIN-Eingabe + Rate-Limit, Reinigen/DND, Session-Cookie ✅
- **Phase 3** — Reinigungsboard: Maid-Login (QR-Karten), Etagen-Board, Slider (Start/Abschluss), staff_log, Stale-Timeout ✅
- **Phase 4** — Service-Baukasten: Konfigurator, Gast-Bestellung, Orders-Tab Rezeption ✅
- **Phase 5** — Politur: Etagenscore-Feintuning, Policies-UI, QR-Druckseiten (Zimmer-Aushang + Check-in-Handout), Stayover-Automatik ✅
- **Phase 6a** — Marketing-Landing auf `/` (Hero, Portale, Ablauf, Features, Use-Cases, Platzhalter-Pricing, FAQ); Signup-CTA verweist auf „Registrierung öffnet in Kürze" ✅
- **Phase 6c (vorgezogen)** — **Mandantenfähigkeit**: Mandant in die URL (`hotels.slug`), Gast- und Reinigungs-Login pro Hotel auflösen ✅ (26.07.2026, siehe [Mandantenfaehigkeit-Plan.md](Sessions/Mandantenfaehigkeit-Plan.md))
- **Phase 6d (vorgezogen)** — **Mehrere Hotels je Konto**, Zielgruppe Hotelketten: `accounts` + `account_members` + `hotel_members`, vier Rollen (Admin = zahlender Kunde über alle Häuser · Manager = Teilmenge der Häuser · Rezeption/Reinigung hausintern), Rezeptions-Portal unter `/h/<slug>/admin`, `/admin` trägt Häuser **und** Konto ✅ (26.07.2026)
- **Zimmer weich deaktivieren** ✅ (26.07.2026) — `rooms.deactivated_at` statt hartem Löschen. Abrechnung je Zimmer nach der Regel „in der Periode auch nur vorübergehend aktiv = zählt"; Messgröße in [rooms.ts](src/lib/rooms.ts) (`isBillable`, `countBillableRooms`) — reine Ableitung aus `created_at`/`deactivated_at`, kein Snapshot, kein Cron.
- **Phase 6b** — **Self-Service-Registrierung** auf `/registrieren`: ein Formular (Einladungscode, Hotelname, Name, E-Mail, Passwort) erzeugt Auth-Zugang, Konto, erstes Haus, Profil, Inhaberschaft und die Beispiel-Services, meldet an und führt ins Zimmer-Setup ✅ (26.07.2026). **Zwei bewusste Entscheidungen:** (1) Einladungscode aus `SIGNUP_INVITE_CODE` statt offener Registrierung — die Stage-URL ist öffentlich; **fehlt die Variable, ist die Registrierung zu** (ein vergessenes Env-Var darf das Tor nicht öffnen). (2) Kein Bestätigungslauf: der Zugang entsteht über die Admin-API mit `email_confirm: true`, der Ablauf hängt also **nicht** an der Projekt-Einstellung „Confirm email" und braucht keine Mail. Solange kein Absender existiert, gibt es folglich **kein Passwort-Zurücksetzen** — das ist der Preis und der Grund, Resend als Nächstes zu nehmen. Das Zimmer-Setup wird bewusst nicht als Wizard nachgebaut; `…/admin/zimmer` kann Etagenbereiche, Nummernlisten und Präfixe bereits.

Kernphasen 0–5 sind umgesetzt. Nach jeder Phase: Review mit dem User (enger Dialog vereinbart).

### Stayover-Automatik (Phase 5) — Funktionsweise

Reine Loader-Ableitung, kein Cron, kein persistentes Flag: Ein belegtes Zimmer ist „routine-fällig", wenn `policies.stayoverAutoClean` an ist, die konfigurierte Uhrzeit erreicht ist, der Check-in vor heute liegt (ab der zweiten Nacht), kein DND anliegt und heute noch kein `staff_log.clean_done` für das Zimmer existiert. Deshalb schreibt **auch `markCleanedAction` (Rezeption) einen `clean_done`-Stich** — sonst würde die Rezeptions-Korrektur die Routine nicht befriedigen. Siehe `isStayoverDue` in [src/lib/board.ts](src/lib/board.ts).

## Deployment (Test-Stage)

Vercel-Projekt `guoliver405s-projects/rose`, Produktions-URL **https://rose-sand-one.vercel.app** — läuft gegen dieselbe Supabase-DB wie lokal. **Auto-Deploy aktiv:** jeder Push auf `main` baut und deployt Production (verifiziert 08.07.). Manuell geht weiterhin `vercel deploy --prod --yes` aus dem Projektordner.

Env-Vars liegen in Vercel (Production): die drei Supabase-Keys + `NEXT_PUBLIC_SITE_URL=https://rose-sand-one.vercel.app` (Basis der QR-Links). Bei Domain-Wechsel `NEXT_PUBLIC_SITE_URL` anpassen und redeployen, sonst zeigen Aushänge/Handouts/Maid-Karten auf die alte URL.

Solange es keine Self-Service-Registrierung gibt (Phase 6b), werden Mandanten manuell angelegt: `node scripts/create-tenant.mjs "Hotelname" mail@rose.local [passwort]` erzeugt Hotel + Slug + Auth-User + Management-Profil und gibt die beiden Portal-Adressen aus (Zugangsdaten im Session-Protokoll). Der Slug ist danach unter Einstellungen → Hotel & Regeln änderbar.

## Session-Protokolle

Wie in HotCord: Protokolle unter `Sessions/` ablegen, aktuellsten Stand hier verlinken.

- [Sessions/2026-07-26_Integrationstests-ohne-lokale-DB.md](Sessions/2026-07-26_Integrationstests-ohne-lokale-DB.md) — **HIER STARTEN.** Die Integrationstests laufen ohne lokale Datenbank direkt gegen die Projekt-Instanz (32 Tests grün); Docker, WSL und Supabase-CLI sind für das Projekt entbehrlich geworden. Enthält die Isolationsregel, die das trägt, die Verifikation, den gefahrlosen Rückbau der lokalen Umgebung und den Wiederaufnahme-Block.
- [Sessions/2026-07-26_Testinfrastruktur-und-Uebergabe.md](Sessions/2026-07-26_Testinfrastruktur-und-Uebergabe.md) — Übergabe-Dokument, **Abschnitte 2 und 4 überholt** (siehe oben). Weiterhin gültig: Abschnitt 3 (was an der lokalen Windows-Umgebung installiert wurde und wie man es rückgängig macht) und Abschnitt 5 (Testzugänge der Stage).
- [Sessions/2026-07-26_Phase-6d_Konten-und-Manager.md](Sessions/2026-07-26_Phase-6d_Konten-und-Manager.md) — **Fachlich aktueller Stand.** Ein Konto trägt beliebig viele Häuser (Zielgruppe Hotelketten), neue Manager-Rolle über eine Teilmenge der Häuser, Rezeptions-Portal unter `/h/<slug>/admin`, Haus-Auswahl auf `/admin`, Konto-Bereich `/konto`. Acht Abnahmekriterien verifiziert. **Für Wiederaufnahme: „🔖 Wiederaufnahme"-Block am Ende des Protokolls lesen.**
- [Sessions/2026-07-26_Phase-6c_Mandantenfaehigkeit.md](Sessions/2026-07-26_Phase-6c_Mandantenfaehigkeit.md) — Mandant in die URL (`/h/<slug>/guest`, `/h/<slug>/service/login`), beide Formular-Logins hotel-scoped, Zwischenlösung vom 25.07. entfernt, Branding-Leak geschlossen, PIN-Default 6, Slug im Einstellungsdialog. Fünf Abnahmekriterien end-to-end verifiziert. **Für Wiederaufnahme: „🔖 Wiederaufnahme"-Block am Ende des Protokolls lesen.**
- [Sessions/2026-07-05_Phase-0-1_Fundament-und-Admin-Portal.md](Sessions/2026-07-05_Phase-0-1_Fundament-und-Admin-Portal.md) — Alle Phasen 0–5 umgesetzt und end-to-end verifiziert: Rezeptions-Portal (Zimmer, Check-in/-out + PIN, Priorisieren, Personal mit QR-Karten, Service-Konfigurator, Orders-Tab, Einstellungen mit Policies + Passwort, QR-Aushänge + Gast-Handout), Gastportal (Zimmernummer/QR-Deep-Link + PIN mit Rate-Limit, Reinigen/DND, Service-Bestellung), Reinigungsboard (QR-/PIN-Login, Etagen-Score, Schicht/Pause, Slider, Stale-Timeout, Stayover-Routine). **Für Wiederaufnahme: „🔖 Wiederaufnahme"-Block am Ende des Protokolls lesen.**
- [Sessions/Mandantenfaehigkeit-Plan.md](Sessions/Mandantenfaehigkeit-Plan.md) — Analyse und Begründung des Umbaus (25.07.2026), **umgesetzt am 26.07.** Bleibt als Nachschlagewerk: warum die Eindeutigkeiten je Hotel liegen, welche Stellen betroffen waren, was bewusst mandantenfrei bleibt.
- [Sessions/Mehrere-Hotels-je-Konto-Plan.md](Sessions/Mehrere-Hotels-je-Konto-Plan.md) — Analyse und Zielmodell zu Phase 6d, **umgesetzt am 26.07.** Enthält weiterhin die Reihenfolge für danach (Abschnitt 13: Service-Vorschlagsliste, Policy-Vorgaben, konsolidierte Auswertung, Resend). Zielgruppe Hotelketten: ein Konto trägt mehrere Hotels, `profiles` kann das strukturell nicht (PK = Auth-User, genau ein `hotel_id`). Enthält Zielmodell (accounts/account_members/hotel_members), Rollen, Umbauschritte, RLS-Hebel (14 Policies über 2 Funktionen), Zimmer-Abrechnungsregel mit Frist, was Ketten darüber hinaus brauchen, Risiken, Abnahmekriterien und fünf offene Entscheidungen.
- [Sessions/Testplan-Walkthrough.md](Sessions/Testplan-Walkthrough.md) — Schritt-für-Schritt-Test aller Portale; **komplett durchlaufen am 25.07.2026**, Befunde und Haken dort dokumentiert.
