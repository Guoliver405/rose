# Mandantenfähigkeit — Problem, Plan und Fixes

> **Status: UMGESETZT am 26.07.2026.** Alle sechs Schritte sind gebaut und
> verifiziert — Ergebnis, Entscheidungen und Abnahme stehen im
> [Session-Protokoll](2026-07-26_Phase-6c_Mandantenfaehigkeit.md). Dieses
> Dokument bleibt als Analyse und Begründung erhalten; die offenen
> Entscheidungen in Abschnitt 7 sind dort beantwortet.
>
> Analyse und Teilfixes: 25.07.2026, Commits `87915b5` (Zwischenlösung
> Maid-Login, inzwischen wieder entfernt) und `9d669ef` (Härtung
> Admin-Client).

## 1. Warum das jetzt kommt

RoSe soll eine **SaaS-Lösung für hunderte Hotels mit tausenden Nutzern**
werden. Damit sind Namensdopplungen nicht der Ausnahme-, sondern der
Normalfall: Zimmer „101" gibt es in jedem Haus, Reinigungskräfte heißen
vielfach „maria" oder „anna".

Der Code ist an mehreren Stellen noch als Single-Property-Anwendung gedacht
(entsprechende Kommentare stehen wörtlich im Quelltext). Das Schema ist
dagegen schon multi-tenant: `hotel_id` steckt überall, und die
Eindeutigkeiten sind korrekt **je Hotel** gesetzt:

```sql
unique (hotel_id, username)   -- profiles
unique (hotel_id, number)     -- rooms
```

Genau daraus folgt das Problem: Zimmernummer und Benutzername sind **nicht
global eindeutig** — werden aber an zwei Stellen benutzt, als wären sie es.

## 2. Das Kernproblem in einem Satz

**In den beiden öffentlichen Formular-Logins (Gast per Zimmernummer,
Reinigungskraft per Benutzername) fehlt der Mandant.** Es gibt keinen
Hotel-Kontext in der URL, im Formular oder in der Session — also muss der
Code raten, und er rät über alle Mandanten hinweg.

Alles andere ist eine Folge davon.

## 3. Befunde im Detail

Grundlage: systematische Durchsicht aller 22 Dateien, die per
`createAdminClient()` die Row-Level-Security umgehen (25.07.2026).

### 3.1 Kritisch — offen

**(A) Gast-Login über Zimmernummer** — `src/app/guest/actions.ts`,
`guestLoginAction`

```ts
.from('rooms').select('id').ilike('number', input.roomNumber.trim()).limit(10)
```

Kein `hotel_id`-Filter. Drei Auswirkungen bei vielen Mandanten:

1. **Funktional kaputt.** Bei 300 Hotels existiert „101" ggf. 250-mal; die
   zehn geladenen Zeilen enthalten das richtige Zimmer fast nie. Der
   legitime Gast kommt nicht mehr hinein.
2. **Mandantengrenze durchlässig.** Die PIN entscheidet allein, welcher
   Aufenthalt gewinnt. Bei Treffer wandert dessen `session_token` ins
   Cookie — der Gast landet im Zimmerportal eines fremden Hauses.
3. **Fremdsperrung (anonym auslösbar).** Die Fehlversuchs-Schleife schreibt
   `pin_attempts` / `pin_locked_until` auf **alle** Kandidaten. Fünf
   Fehleingaben sperren Gäste in bis zu zehn fremden Hotels für 15 Minuten.

**(B) Reinigungs-Login über Benutzername** — `src/app/service/login/actions.ts`,
`maidLoginAction`

Kandidatensuche `.eq('username', …)` ohne `hotel_id`. Am 25.07. wurde eine
**Zwischenlösung** eingebaut (Kandidaten über die Karten-PIN vorsortieren,
dann der Reihe nach anmelden). Die repariert den akuten Ausfall, skaliert
aber nicht:

- bis zu N Auth-Aufrufe pro Anmeldung (N = Anzahl gleichnamiger Kräfte),
- die Klartext-PIN-Abfrage wirkt als **PIN-Orakel** über Mandantengrenzen,
- bei Kollision von Benutzername **und** PIN Anmeldung im fremden Haus,
- Aufzählung existierender Benutzernamen über alle Mandanten möglich.

→ **Die Zwischenlösung muss mit dem Umbau wieder verschwinden.**

**(C) Branding-Leak auf der Reinigungs-Anmeldung** —
`src/app/service/login/page.tsx`

```ts
createAdminClient().from('hotels').select('name').limit(1).maybeSingle()
```

Zeigt jedem Besucher den Namen eines **beliebigen fremden Hotels**.

### 3.2 Behoben am 25.07.2026 (Commit `9d669ef`)

| Stelle | Was war | Fix |
|---|---|---|
| `admin/actions.ts` · `checkInAction` | suchte Zimmer gleicher Nummer über alle Mandanten und las daraus **Klartext-Gast-PINs fremder Hotels** (Kollisionsvermeidung) | `.eq('hotel_id', ctx.hotelId)` |
| `admin/actions.ts` · `checkOutAction`, `checkInAction` | `room_states`-UPDATE nur per `room_id` | zusätzlich `.eq('hotel_id', …)` |
| `admin/actions.ts` · `markCleanedAction` | las `guest_signal` einer vom Client übergebenen `room_id` ohne Hotel-Filter | `.eq('hotel_id', …)` |
| `einstellungen/test-actions.ts` | gleiche PIN-Kollisionsabfrage wie oben | `.eq('hotel_id', …)` |

### 3.3 Geprüft und in Ordnung

- **Alle Token-Wege** grenzen über global eindeutige Token ein und sind
  mandantensicher: Zimmer-QR (`room_guest_tokens.token`), Maid-Karte
  (`maid_login_tokens.token`), Gast-Session (`stays.session_token`).
- **Synthetische Maid-E-Mail** enthält bereits die Hotel-ID
  (`maria@<hotel-uuid>.rose.svc`) → global eindeutig.
- **Management-Login** über E-Mail (global eindeutig), Hotel kommt danach
  aus dem Profil.
- **Alle authentifizierten Admin-Aktionen** filtern auf `ctx.hotelId` oder
  prüfen die Zugehörigkeit vorab.

## 4. Der Plan: Mandant in die URL

### 4.1 Entscheidung

Ein **`hotels.slug`** und ein **Pfad-Präfix** für die beiden Formular-
Eingänge:

```
/h/<slug>/guest           statt  /guest
/h/<slug>/service/login   statt  /service/login
```

Warum Pfad statt Subdomain: funktioniert sofort auf Vercel, ohne Wildcard-
DNS und -Zertifikat. Der Slug existiert danach ohnehin — ein späterer
Wechsel auf `<slug>.rose.app` oder Kundendomains ist dann ein reiner
Routing-Schritt, ohne Datenmodell-Änderung.

### 4.2 Was sich NICHT ändert (wichtig!)

- **Token-Routen bleiben global:** `/guest/r/<token>` und
  `/service/auto/<token>`. Der Token trägt den Mandanten bereits.
  → **Bereits gedruckte Zimmer-Aushänge und Zugangskarten bleiben gültig.**
- **`/admin` bleibt ohne Präfix.** E-Mail-Login ist global eindeutig, das
  Hotel kommt aus dem Profil.

### 4.3 Umzusetzende Schritte (in dieser Reihenfolge)

**Schritt 1 — Migration `hotels.slug`** (additiv, vor dem Code einspielen)

- Spalte `slug text` hinzufügen, für die drei Bestandshotels befüllen
  (z. B. `mein-hotel`, `pension-alpenblick`, `stadthotel-krone`),
  danach `not null` + `unique` setzen.
- Slug-Regeln: `[a-z0-9-]`, aus dem Hotelnamen erzeugt, bei Kollision
  Zähler-Suffix. Helfer nach `src/lib/` (wird in Phase 6b beim Signup
  wiederverwendet).

**Schritt 2 — Routing und Slug-Auflösung**

- Neue Segmente `src/app/h/[slug]/guest/**` und
  `src/app/h/[slug]/service/**`; Slug → `hotel_id` serverseitig auflösen,
  unbekannter Slug ⇒ 404.
- Alte Formular-Routen `/guest` und `/service/login` liefern eine
  Hinweisseite („Bitte QR-Code im Zimmer scannen oder die Adresse deines
  Hotels verwenden"). **Kein öffentliches Hotel-Verzeichnis** — das wäre
  wieder ein Info-Leak.

**Schritt 3 — Gast-Login mandantenscoped**

- `guestLoginAction` bekommt die `hotelId` und filtert `rooms` darauf.
- Damit greift auch das Rate-Limit nur noch im eigenen Haus (Fremdsperrung
  erledigt sich).

**Schritt 4 — Reinigungs-Login mandantenscoped**

- `maidLoginAction` bekommt die `hotelId` → genau ein Kandidat → **ein**
  Auth-Aufruf.
- **Zwischenlösung vom 25.07. entfernen** (PIN-Vorsortierung + Schleife).
- Branding der Anmeldeseite aus dem Slug statt `limit(1)`.

**Schritt 5 — Gedruckte Materialien und URLs**

- QR-/Handout-/Karten-URLs werden aus `NEXT_PUBLIC_SITE_URL` gebaut
  (`admin/zimmer/aushang/page.tsx`, `admin/handout/[roomId]/page.tsx`,
  `admin/personal/karte/[profileId]/page.tsx`). Die **Fallback-Adresse** im
  Handout muss künftig `/h/<slug>/guest` lauten; die QR-Ziele selbst
  bleiben unverändert.
- Perspektive: Basis-URL je Hotel statt einer globalen Variable, sobald
  Kundendomains dazukommen.

**Schritt 6 — Nacharbeiten**

- PIN-Länge: Default von 4 auf **6** anheben (Policy existiert bereits).
- Prüfen, ob ein Helfer sinnvoll ist, der `hotel_id` bei Admin-Client-
  Queries automatisch setzt — der Gürtel wird sonst irgendwann wieder
  vergessen. Alternativ eine Review-Checkliste in AGENTS.md.
- Überlegen: Rate-Limit zusätzlich pro IP (aktuell nur je Aufenthalt).

## 5. Risiken und Fallstricke

- **Deploy-Reihenfolge.** Auto-Deploy ist aktiv: additive Migration
  (Slug-Spalte nullable) zuerst einspielen, dann Code pushen, erst danach
  `not null` setzen. Siehe Migrations-Konvention in AGENTS.md.
- **Bestehende Links.** Alles, was heute auf `/guest` zeigt (Aushänge mit
  Fallback-Text, Lesezeichen, evtl. Aushänge im Haus), muss weiter zu einer
  verständlichen Seite führen — deshalb die Hinweisseite in Schritt 2.
- **Kein Hotel-Verzeichnis exponieren.** Weder Auswahl-Dropdown über alle
  Mandanten noch Slug-Enumeration mit Namensausgabe.
- **Test-Szenario-Panel** (`/admin/einstellungen/test`) schreibt echte
  Stays; nach dem Umbau erneut prüfen.

## 6. Wie morgen getestet wird

Die Stage hat bereits drei Mandanten mit passenden Kollisionen — ideal:

| Hotel | Besonderheit |
|---|---|
| Mein Hotel | Zimmer 101–105, 201–203; Kraft `@maria` (PIN 046055) |
| Pension Alpenblick | großes Haus (Haupthaus 1–9, Nebengebäude 1–3); Kraft `@maria` (PIN 420725) |
| Stadthotel Krone | Kräfte `@bm`, `@fm` |

Abnahmekriterien:

1. `@maria` mit PIN 046055 landet in „Mein Hotel", mit 420725 in „Pension
   Alpenblick" — jeweils über die **eigene** Hotel-URL, und **nur** dort.
2. Ein Gast mit Zimmer 101 + PIN kommt nur im eigenen Haus hinein; dieselbe
   Kombination führt in einem anderen Haus zu einer generischen Abweisung.
3. Fünf Fehlversuche sperren **ausschließlich** den betroffenen Aufenthalt
   im betroffenen Hotel.
4. Gedruckte QR-Codes (Zimmer-Aushang, Zugangskarte) funktionieren
   unverändert weiter.
5. Die Reinigungs-Anmeldung zeigt den Namen des **richtigen** Hotels.

Danach: [Testplan-Walkthrough](Testplan-Walkthrough.md) für die betroffenen
Abschnitte B (Gastportal) und C (Reinigungsboard) wiederholen.

## 7. Entscheidungen, die noch offen sind

1. **Slug-Format:** aus dem Hotelnamen erzeugt (`stadthotel-krone`) oder
   kurzer Code (`krone`)? Der Slug steht künftig auf jedem Aushang.
2. **Pfad oder Subdomain** als Endziel — Pfad ist der Start, Subdomain wäre
   das SaaS-übliche Ziel.
3. **PIN-Länge 6 als neuer Default** für Neukunden — ja/nein?
4. **Gast-Baseline ohne QR:** Reicht „Hotel-URL + Zimmernummer + PIN", oder
   soll zusätzlich ein kurzer Hotel-Code eingebbar sein, falls jemand nur
   die generische Adresse kennt?

## 8. Reihenfolge im Phasen-Plan

Dieser Umbau gehört **vor Phase 6b (Self-Service-Registrierung)**. Sobald
sich Hotels selbst registrieren, wandern die Single-Property-Annahmen in
echte Kundendaten — und die Korrektur wird ungleich teurer.
