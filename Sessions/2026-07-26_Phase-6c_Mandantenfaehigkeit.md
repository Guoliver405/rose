# Phase 6c — Mandantenfähigkeit (26.07.2026)

> **Status: umgesetzt und end-to-end verifiziert.** Grundlage war
> [Mandantenfaehigkeit-Plan.md](Mandantenfaehigkeit-Plan.md); alle sechs
> Schritte des Plans sind abgearbeitet.

## Ausgangslage

RoSe soll SaaS für hunderte Hotels werden. Das Schema war bereits multi-tenant
(`hotel_id` überall, Eindeutigkeiten je Hotel), der Code an zwei Stellen aber
noch Single-Property: **die beiden öffentlichen Formular-Logins kannten den
Mandanten nicht** und lösten Zimmernummer bzw. Benutzername über alle Häuser
hinweg auf.

Konkret behoben:

| Befund | Vorher | Jetzt |
|---|---|---|
| Gast-Login (`guestLoginAction`) | `rooms` per Nummer ohne `hotel_id` → bei vielen Häusern funktional kaputt, Anmeldung im fremden Haus möglich, fünf Fehlversuche sperrten Gäste in bis zu zehn fremden Hotels | `.eq('hotel_id', …)` aus dem Slug — Rate-Limit trifft nur noch den eigenen Aufenthalt |
| Maid-Login (`maidLoginAction`) | Zwischenlösung vom 25.07.: Kandidaten über die Karten-PIN vorsortieren und der Reihe nach anmelden — PIN-Orakel über Mandantengrenzen, Anmeldung im fremden Haus bei Doppelkollision | genau ein Kandidat, **ein** Auth-Aufruf; Zwischenlösung ersatzlos entfernt |
| Branding `/service/login` | `hotels … limit(1)` zeigte jedem Besucher den Namen eines **beliebigen fremden Hotels** | Hotelname kommt aus dem Slug |

## Entscheidungen dieser Session

Der Testbetrieb erlaubte radikale Änderungen ohne Rücksicht auf Bestand — das
hat drei der vier offenen Fragen aus Abschnitt 7 des Plans aufgelöst:

1. **Slug-Format:** aus dem Hotelnamen erzeugt (`stadthotel-krone`), zusätzlich
   im Hotel-Einstellungsdialog editierbar. Das Umbenennen war vorher der teure
   Teil (invalidiert gedruckte Handouts) — im Testbetrieb geschenkt.
2. **PIN-Länge:** Default von 4 auf **6** (`DEFAULT_PIN_LENGTH` in
   [ids.ts](../src/lib/ids.ts)). 10.000 Kombinationen tragen bei einem Haus,
   nicht bei tausenden gleichzeitigen Aufenthalten. Pro Hotel weiter über
   `policies.pinLength` einstellbar (4–8). Die Migration hat die drei
   Bestandshotels mitgezogen; laufende Aufenthalte behalten ihre alte PIN.
3. **Generische `/guest`:** reine Hinweisseite. **Kein** Hotel-Verzeichnis und
   **kein** Code-Eingabefeld — beides wäre ein Enumerations-Leak.
4. **Pfad statt Subdomain** (unverändert aus dem Plan): funktioniert sofort auf
   Vercel ohne Wildcard-DNS/-Zertifikat. Der Slug existiert danach ohnehin, ein
   späterer Wechsel auf `<slug>.rose.app` ist ein reiner Routing-Schritt.

## Was gebaut wurde

**Schritt 1 — Migration.** [2026-07-26_hotels_slug.sql](../Supabase_sql/archive/2026-07-26_hotels_slug.sql) (eingespielt 26.07., danach ins Archiv verschoben):
`hotels.slug` anlegen, per SQL-Funktion `rose_slugify` aus dem Namen befüllen,
`not null` + `unique` + Format-Check, danach die Hilfsfunktion wieder droppen.
Im Testbetrieb in einem Rutsch statt der sonst nötigen zwei Etappen. Maßgeblich
im Anwendungscode ist ab jetzt [slug.ts](../src/lib/slug.ts) (`slugify`,
`isValidSlug`, `uniqueSlug`).

**Schritt 2 — Routing.** Neue Segmente `src/app/h/[slug]/guest/**` und
`src/app/h/[slug]/service/**`; Auflösung über `requireHotelBySlug` in
[hotel.ts](../src/utils/hotel.ts) (React-`cache` dedupliziert Layout + Page,
unbekannter Slug ⇒ 404). `/guest` und `/service/login` sind Hinweisseiten.
`proxy.ts` erkennt den svc_-Namespace jetzt über eine Regex, weil das
Reinigungs-Portal unter zwei Pfadformen erreichbar ist.

**Token-Routen blieben bewusst mandantenfrei** (`/guest/r/<token>`,
`/service/auto/<token>`): der Token ist global eindeutig und trägt den Mandanten
selbst. Sie leiten nach erfolgreicher Anmeldung auf die Slug-Route weiter —
gedruckte Aushänge und Karten überleben damit jeden Routing-Umbau.

**Schritte 3 + 4 — Logins.** Beide bekommen den Mandanten aus der URL. Beim
Gast liefert die Formularseite den Slug mit; beim Token-Weg leitet die Action
den Ziel-Slug aus dem gefundenen Aufenthalt ab (in der URL steht dort keiner).

**Schritt 5 — Druck.** QR-Ziele unverändert. Neu ist auf beiden Karten die
**abtippbare Adresse**: Handout zeigt zusätzlich `…/h/<slug>/guest`, die
Zugangskarte `…/h/<slug>/service/login` — der Deep-Link-Token ist zum Abtippen
zu lang, und ohne Slug findet die Anmeldung von Hand nicht mehr statt.

**Schritt 6 — Nacharbeiten.** PIN-Default 6; Slug im Einstellungsdialog mit
Live-Vorschau beider Portal-URLs und Eindeutigkeitsprüfung; `create-tenant.mjs`
erzeugt den Slug und gibt beide Adressen aus; Review-Checkliste für
`createAdminClient()` in [AGENTS.md](../AGENTS.md).

## Zwei Dinge, die im Plan nicht standen

**Cookie-Abgleich auf jeder Portalseite.** Alle Mandanten teilen den Origin, das
Gast- bzw. `svc_`-Cookie gilt also auch unter fremden Slugs. Ohne Prüfung hätte
`/h/fremdes-hotel/guest/status` das eigene Zimmer unter falschem Hotelnamen
gerendert. Jede Portalseite gleicht jetzt `ctx.hotelId` gegen das Hotel aus der
URL ab und schickt bei Abweichung auf die dortige Anmeldung. Dafür tragen
`GuestContext`, `MaidContext` und `ManagementContext` zusätzlich `hotelSlug`.

**IP-Rate-Limit bewusst nicht gebaut** (Punkt 6 im Plan war „überlegen"). Mit
6-stelliger PIN und 5 Versuchen je Aufenthalt ist der Angriffspfad dünn, und es
gäbe dafür bisher keine Infrastruktur. Bleibt als eigener, sauber abgrenzbarer
Schritt offen.

## Verifikation (26.07.2026, lokal gegen die Stage-DB)

Testdaten der drei Mandanten waren ideal: **Zimmer 101 existiert in zwei
Häusern** (Mein Hotel PIN 9945, Pension Alpenblick PIN 0596), `@maria` ebenfalls
(PINs 046055 / 420725).

| # | Kriterium | Ergebnis |
|---|---|---|
| 1 | `@maria` landet über die eigene Hotel-URL im richtigen Haus, und nur dort | ✅ 420725 → Alpenblick (Maria Villalobos); 046055 auf der Alpenblick-URL → „Benutzername oder PIN ist falsch" |
| 2 | Gast mit Zimmer 101 + PIN nur im eigenen Haus; dieselbe Kombination anderswo generisch abgewiesen | ✅ 101/9945 → `/h/mein-hotel/guest/status`; dieselbe Eingabe unter `pension-alpenblick` → generische Abweisung |
| 3 | Fünf Fehlversuche sperren **ausschließlich** den betroffenen Aufenthalt im betroffenen Hotel | ✅ Alpenblick Zi.101 gesperrt, Mein Hotel Zi.101 danach `attempts=0, locked=-` — trotz identischer Nummer und identisch eingetippter PIN |
| 4 | Gedruckte QR-Codes funktionieren unverändert | ✅ `/guest/r/<token>` → PIN → `/h/mein-hotel/guest/status`; `/service/auto/<token>` → `/h/mein-hotel/service` |
| 5 | Reinigungs-Anmeldung zeigt den Namen des richtigen Hotels | ✅ je Slug korrekt (vorher ein beliebiges fremdes Haus) |

Zusätzlich geprüft: Mandanten-Riegel bei bestehender Sitzung (Gast **und**
Reinigungskraft werden unter fremdem Slug auf die dortige Anmeldung
umgeleitet), Abmelden führt auf die Anmeldung des eigenen Hauses, unbekannter
Slug ⇒ 404, beide Hinweisseiten, Slug-Eindeutigkeitsprüfung
(„Diese Adresse ist bereits vergeben.") und der Speicherpfad selbst, Handout
und Zugangskarte mit beiden Adressen. Konsole und Server-Log fehlerfrei;
`npx tsc --noEmit`, `npm run lint` und `npm run build` sauber.

## Portal-Adressen der Stage

| Hotel | Slug | Gast | Reinigung |
|---|---|---|---|
| Mein Hotel | `mein-hotel` | `/h/mein-hotel/guest` | `/h/mein-hotel/service/login` |
| Pension Alpenblick | `pension-alpenblick` | `/h/pension-alpenblick/guest` | `/h/pension-alpenblick/service/login` |
| Stadthotel Krone | `stadthotel-krone` | `/h/stadthotel-krone/guest` | `/h/stadthotel-krone/service/login` |

## 🔖 Wiederaufnahme

Kernphasen 0–5 sowie 6a und 6c sind umgesetzt. **Nächster Schritt ist Phase 6b
(Self-Service-Registrierung/Onboarding)** — jetzt gefahrlos möglich, weil die
Single-Property-Annahmen raus sind: Hotel + Management-Konto entstehen beim
Signup, Slug wird dabei über `slugify`/`uniqueSlug` aus dem Hotelnamen erzeugt
(die Helfer stehen bereit und werden schon von `create-tenant.mjs` genutzt),
Wizard für Hotelname/Zimmer, braucht Supabase-E-Mail-Bestätigung.

Offen aus dieser Session:

- **IP-Rate-Limit** für die Gast-Anmeldung (bewusst vertagt, siehe oben).
- **Alt-Sperre**: Mein Hotel Zi.203 trägt noch eine `pin_locked_until` vom
  25.07. (abgelaufen, harmlos).

**Erledigt am 26.07.:** Der [Testplan-Walkthrough](Testplan-Walkthrough.md) ist
für die Abschnitte B (Gastportal) und C (Reinigungsboard) mit den neuen
Adressen komplett wiederholt — alle Haken bestätigt, keine neuen Befunde.
Details im Abschnitt „Nachlauf B + C" dort. A, D, E, F und G sind vom Umbau
nicht berührt (`/admin` bleibt ohne Slug-Präfix).
