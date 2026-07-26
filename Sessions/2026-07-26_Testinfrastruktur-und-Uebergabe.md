# Testinfrastruktur, lokale Umgebung und Übergabe (26.07.2026)

> ⚠️ **Teilweise überholt.** Abschnitt 2 („Steht bereit, ist aber NIE
> GELAUFEN") und Abschnitt 4 („Sofort nach dem Neustart") sind hinfällig: die
> Integrationstests laufen seit demselben Tag **ohne lokale Datenbank** direkt
> gegen die Projekt-Instanz, 32 Tests grün. Docker, WSL und Supabase-CLI werden
> nicht mehr gebraucht. Siehe
> [Integrationstests ohne lokale DB](2026-07-26_Integrationstests-ohne-lokale-DB.md).
> **Abschnitt 3 (Rückbau der lokalen Umgebung) und Abschnitt 5 (Testzugänge)
> gelten weiter.**

> **Übergabe an die nächste Session.** Dieses Dokument ist so geschrieben, dass
> man ohne Vorwissen einsteigen kann. Es deckt drei Dinge ab:
> 1. was an Tests und CI entstanden ist (Abschnitt 1–2),
> 2. was auf dem **Windows-Rechner** installiert wurde und **wie man es
>    vollständig rückgängig macht** (Abschnitt 3),
> 3. die offenen Schritte in der Reihenfolge, in der sie anstehen (Abschnitt 4).
>
> Arbeitsbaum war beim Schreiben sauber, alles gepusht (Stand `1aa6346`).

## 1. Was an diesem Tag entstanden ist

Zwölf Commits, in dieser Reihenfolge:

| Commit | Inhalt |
|---|---|
| `1e9711a` | **Phase 6c** — Mandant in die URL (`hotels.slug`), beide Formular-Logins hotel-scoped |
| `c1a09f1` | Testplan B + C mit den neuen Adressen wiederholt |
| `6962966`, `566857a` | Plan für Phase 6d (Konten, Manager, Ketten als Zielgruppe) |
| `b71002b`, `e966d2d` | **Phase 6d** — `accounts`/`account_members`/`hotel_members`, Admin-Portal unter `/h/<slug>/admin`, Haus-Auswahl, `/konto`; acht Abnahmekriterien verifiziert |
| `d65f16b` | Zimmer weich deaktivieren statt löschen (Voraussetzung der Abrechnung je Zimmer) |
| `81e10dc`, `55ca967` | Testplan-Befund 2: Präfix-Option, Vorbelegung hängt jetzt am Modus |
| `e6117f6` | Testplan Abschnitt A wiederholt |
| `32042b5` | **Unit-Tests (Vitest) + CI-Pipeline** |
| `1aa6346` | **Integrationstests** gegen lokale Supabase-Instanz — *noch nie ausgeführt* |

Fachliche Details stehen in
[Phase 6c](2026-07-26_Phase-6c_Mandantenfaehigkeit.md) und
[Phase 6d](2026-07-26_Phase-6d_Konten-und-Manager.md).

## 2. Teststand

### Läuft (lokal und in CI)

```bash
npm run verify   # typecheck + lint + test
```

100 Unit-Tests über 8 Module unter `src/lib/*.test.ts` — reine Rechenlogik,
keine Datenbank. Die Suite wurde per **Mutation gegengeprüft**: Umdrehen der
Abrechnungsregel ließ zwei Tests fallen, Zurücksetzen machte sie wieder grün.

CI: [.github/workflows/ci.yml](../.github/workflows/ci.yml) — typecheck, lint,
test, build bei Push auf `main` und bei Pull Requests. **Achtung:** Vercel
deployt bei Push unabhängig davon, ein rotes CI bremst nichts.

### Steht bereit, ist aber NIE GELAUFEN

`tests/integration/` — zwei Ebenen:

- `rls.test.ts` — Mandanten- und Rollengrenzen **an der Quelle**: was geben
  `is_hotel_member` / `is_hotel_management` frei? Inklusive der Probe, dass ein
  **Rechte-Entzug sofort wirkt**.
- `guards.test.ts` — `getManagementContext(slug)`, `getAdminContext`,
  `listAccessibleHotels`, `getAccountContext`. `next/headers` ist ersetzt, der
  Cookie-Speicher enthält eine **echte** Supabase-Session.

Testwelt: `tests/integration/helpers/world.ts`, zwei Konten mit den
Kollisionen aus der Praxis (gleiche Zimmernummer in zwei Häusern, gleicher
Maid-Benutzername in zwei Häusern).

```bash
npm run db:start          # braucht Docker
npm run db:reset          # sync-migrations + supabase db reset
npm run test:integration
```

`supabase/migrations/` wird aus `Supabase_sql/archive/` **erzeugt**
(`scripts/sync-migrations.mjs`, läuft in `db:reset`) und ist gitignored.

**Bekannte Risiken für den ersten Lauf** — nichts davon ist geprüft:

1. `findHotelBySlug` ist mit Reacts `cache()` umwickelt. Außerhalb eines
   Request-Kontexts sollte das durchlaufen; falls nicht, den Cache-Wrapper in
   der Testumgebung umgehen.
2. Die Feldnamen aus `supabase status -o json` variieren je CLI-Version —
   `tests/integration/setup.ts` fängt mehrere Schreibweisen ab, aber nicht
   zwingend alle.
3. Die Form des gefälschten Cookie-Speichers (`get`/`getAll`/`set`) muss zu
   dem passen, was `next/headers` in Next 16 liefert.

## 3. Lokale Umgebung — was installiert wurde und wie man es zurücknimmt

### Ausgangslage (gemessen, nicht vermutet)

| Prüfung | Ergebnis |
|---|---|
| VBS / Memory Integrity | **war schon vor der WSL-Installation aktiv** |
| Anti-Cheat auf dem System | EasyAntiCheat (EOS) und BattlEye, beide manuell/gestoppt |
| Docker Desktop | 4.83.0, Benutzer-Installation unter `%LOCALAPPDATA%\Programs\DockerDesktop` |
| `docker.exe` | `%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin\docker.exe` — **nicht im PATH** der Agent-Shell |

**Der wichtigste Punkt:** Memory Integrity setzt den Hyper-V-Unterbau voraus —
der Hypervisor lief also bereits, bevor WSL installiert wurde. `wsl --install`
hat ihn **nicht neu eingeführt**. EasyAntiCheat und BattlEye stören sich nicht
an einem Hypervisor auf dem Host; sie blockieren das Spielen *innerhalb* einer
VM. Das Risiko für die Spiele ist danach gering.

### Installiert wurde

```
wsl --install        (als Administrator)
  → WSL 2.7.11
  → Ubuntu als Distribution   ← mehr als nötig, siehe unten
```

Docker Desktop braucht Ubuntu **nicht** — es bringt seine eigenen
Distributionen (`docker-desktop`) mit. Nötig gewesen wäre nur
`wsl --install --no-distribution`.

### Rückbau, gestuft

**Stufe 1 — nur Ubuntu weg, Docker bleibt lauffähig:**

```
wsl --unregister Ubuntu
```

**Stufe 2 — WSL ganz weg (Docker Desktop funktioniert danach nicht mehr):**

```
wsl --uninstall
```
Danach in „Windows-Features" abschalten: *Windows-Subsystem für Linux* und —
falls nichts anderes es braucht — *Plattform für virtuelle Computer*.

**Stufe 3 — Docker Desktop entfernen:** über Einstellungen → Apps.

> **Nicht tun:** `bcdedit /set hypervisorlaunchtype off`. Das schaltet den
> Hypervisor ab und damit auch **Memory Integrity** — ein echter
> Sicherheitsverlust. Wenn ein Spiel Probleme macht, lieber WSL entfernen und
> auf den CI-Weg wechseln (Abschnitt 4, Variante B).

### Im Repository

`supabase/config.toml` und `supabase/.gitignore` sind eingecheckt (von
`supabase init`). `supabase/migrations/` ist gitignored und wird erzeugt.
**Beim Rückbau der lokalen Umgebung muss im Repo nichts gelöscht werden** — die
Testdateien bleiben gültig, sie laufen dann eben nur in CI.

## 4. Offene Schritte

### Sofort nach dem Neustart

**Variante A — lokal (WSL bleibt):**

1. Docker Desktop starten, warten bis die Engine läuft.
2. `npm run db:start` — zieht beim ersten Mal einige hundert MB Container-Images.
3. `npm run db:reset`
4. `npm run test:integration` — erster Lauf überhaupt, mit den drei Risiken aus
   Abschnitt 2. Fehlschläge sind hier erwartbar und normal.
5. Ergebnis committen; danach entscheiden, ob die Integrationstests
   zusätzlich in CI laufen sollen.

**Variante B — CI-only (WSL wird wieder entfernt):**

1. Rückbau nach Abschnitt 3.
2. In [ci.yml](../.github/workflows/ci.yml) einen zweiten Job ergänzen:
   `supabase/setup-cli`, dann `node scripts/sync-migrations.mjs`,
   `supabase start`, `npm run test:integration`. GitHub-Runner sind Linux mit
   vorinstalliertem Docker — dort läuft der Stack nativ.
3. Die Testdateien selbst bleiben unverändert; nur die Herkunft der
   Verbindungsdaten in `tests/integration/setup.ts` ist zu prüfen (dort wird
   `supabase status` gelesen, das im Runner genauso funktioniert).

### Danach — Produkt-Backlog, nach Priorität

1. **Integrationstests um die Login-Actions erweitern.** Nicht abgedeckt sind
   `guestLoginAction` und `maidLoginAction` (sie leiten per `redirect()` um).
   Der wertvollste Einzeltest: **fünf Fehlversuche sperren nur den eigenen
   Aufenthalt im eigenen Haus** — das war Befund (A) aus Phase 6c.
2. **Phase 6b — Self-Service-Registrierung.** Jetzt gefahrlos, weil Konto-,
   Hotel- und Rechte-Beziehung stehen: Signup erzeugt `accounts` + `hotels` +
   `account_members`, Slug über `slugify`/`uniqueSlug`.
3. **Ketten-Themen** (siehe [Plan](Mehrere-Hotels-je-Konto-Plan.md), Abschnitt 13) —
   ohne sie ist „mehrere Hotels" für die Zielgruppe eher Ankündigung als
   Angebot:
   - konto-weite **Service-Vorschlagsliste** (Admin pflegt, Admin und Manager
     passen je Haus an — so entschieden am 26.07.)
   - kontoweite **Policy-Vorgaben** mit Abweichung je Haus
   - **konsolidierte Auswertung** über alle Häuser
4. **Resend anbinden** — Einladungs-Mails für Manager- und Rezeptions-Zugänge
   statt direkt vergebener Passwörter; danach Gast-Handout und Maid-Karte
   wahlweise drucken **oder** mailen.
5. **Testplan D, E, F, G** nachziehen (Service-Baukasten, Einstellungen,
   Druck, Robustheit). A, B und C sind am 26.07. wiederholt worden.
6. **IP-Rate-Limit** für die Gast-Anmeldung — offen seit Phase 6c, bewusst
   vertagt (6-stellige PIN plus 5 Versuche je Aufenthalt tragen bis auf
   Weiteres).

### Offene Entscheidungen

- **Zimmer-Zustände**: aktuell **ein** Zustand (`deactivated_at`). Ob „außer
  Betrieb" (Renovierung) getrennt von „abbestellt" gebraucht wird, ist eine
  Preisentscheidung; die Abrechnungs-Messgröße ändert sich dadurch nicht.
- **Pricing-Form**: zimmergenau oder Staffeln.
- **Hotel zwischen Konten verschieben** (Betreiberwechsel) — vorerst außen vor.

## 5. Testzugänge (Stage)

| Konto | Häuser | Zugänge |
|---|---|---|
| Mein Hotel | `mein-hotel` (8 Zimmer), `strandhaus-nord` (6 Zimmer, 301–303/306–308) | Inhaber `rezeption@rose.local`; Manager `nina@rose.local` / `ManagerTest123` — **nur** Strandhaus Nord |
| Pension Alpenblick | `pension-alpenblick` | Inhaber `alpenblick@rose.local` |
| Stadthotel Krone | `stadthotel-krone` | Inhaber `krone@rose.local`; Rezeption `frontdesk-krone@rose.local` |

Passwörter der Inhaber stehen in `.env.local` (nicht im Repo). Reinigungskraft
`@maria` existiert in „Mein Hotel" **und** „Pension Alpenblick" — die
absichtliche Namenskollision für Mandanten-Tests.
