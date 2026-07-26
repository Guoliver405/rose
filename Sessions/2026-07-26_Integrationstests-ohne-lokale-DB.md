# Integrationstests ohne lokale Datenbank (26.07.2026)

> Korrigiert die Testinfrastruktur vom selben Tag
> ([Übergabe-Dokument](2026-07-26_Testinfrastruktur-und-Uebergabe.md)). Docker,
> WSL und die Supabase-CLI werden für dieses Projekt **nicht mehr gebraucht**.

## Der Auslöser

Rückfrage des Users, sinngemäß: *Unsere komplette Supabase-DB ist ausschließlich
Fake- und Test-Hotels und jederzeit löschbar. Weshalb brauchen wir jetzt ein
Paralleluniversum aus Linux, Docker und CLI?*

Die Frage war berechtigt. Die Antwort stand in einer einzigen Funktion.

## Die eigentliche Ursache

`resetDatabase()` in `tests/integration/helpers/world.ts` tat beim Aufbau der
Testwelt Folgendes:

```
alle accounts holen → alle löschen
alle hotels holen   → alle löschen
alle auth-user auflisten (bis 1000) → alle löschen
```

Verbrannte Erde, bei **jedem** Lauf. Gegen die gemeinsame Instanz gerichtet
hätte der erste `npm run test:integration` sämtliche Testhotels, alle
Inhaber-Logins und beide `@maria` gelöscht. Deshalb der localhost-Riegel in
`setup.ts` — und deshalb, und **nur** deshalb, eine eigene lokale Instanz mit
Docker Desktop, WSL 2 und Supabase-CLI.

Die Begründung war zirkulär: *lokale DB, weil die Tests alles löschen* — *Tests
dürfen alles löschen, weil die DB lokal ist.* Der Kreis lässt sich an der
anderen Stelle aufschneiden.

## Was jetzt gilt

Eine Regel, drei Schichten:

> **Angefasst wird ausschließlich, was der Lauf selbst erzeugt hat.**

1. **Lauf-Kennung in jedem Namen.** `randomBytes(3)` → z. B. `itest-3f9a12`;
   die Marke steckt in Kontoname, Hotel-Slug, Hotelname, Management-E-Mail und
   Maid-Benutzername. Zwei Läufe kollidieren nie, auch lokal gegen CI nicht.
2. **`destroyWorld()` löscht nur über eingesammelte IDs** (`createdAccountIds`,
   `createdUserIds`) — nie über Aufzählen, nie über Muster. Erst die Konten
   (Kaskade nimmt Häuser, Zimmer, Aufenthalte, Zustände, Services, Bestellungen
   mit), dann die Auth-Nutzer (Kaskade nimmt `profiles`, `account_members`,
   `hotel_members` mit).
3. **Riegel vor jedem Löschen.** `assertOwnedByRun()` liest die Zeile und prüft
   die Kennung. Fehlt sie, **wirft** die Routine, statt zu löschen. Ein Fehler
   im Aufräumen kostet einen roten Test, keine Daten.

Dazu `sweepStaleRuns()`: Reste abgestürzter Läufe (Muster `itest-<6 hex>`,
älter als zwei Stunden) werden zu Beginn aufgekehrt. Die Altersgrenze schützt
einen parallel laufenden zweiten Lauf.

`setup.ts` liest die Verbindungsdaten jetzt aus bereits gesetzten
Umgebungsvariablen, sonst aus `.env.local` (eigener Mini-Parser, keine neue
Abhängigkeit). Der localhost-Riegel ist weg — an seine Stelle tritt die Regel
oben.

## Verifiziert

```
npm run test:integration   → 2 Dateien, 32 Tests, alle grün, 20 s
npm run verify             → typecheck, lint, 100 Unit-Tests grün
```

Danach die Kontrolle, auf die es ankam — Datenbank direkt abgefragt:

| Prüfung | Ergebnis |
|---|---|
| Rückstände mit `itest-<hex>` in accounts / hotels / profiles / auth.users | **keine** |
| Konten | Mein Hotel, Pension Alpenblick, Stadthotel Krone — unverändert |
| Hotels | mein-hotel, pension-alpenblick, stadthotel-krone, strandhaus-nord |
| Auth-Nutzer / Profile | 10 / 10, inkl. der beabsichtigten Kollision `@maria` in zwei Häusern |

## Entfernt

| Weg | Grund |
|---|---|
| `scripts/sync-migrations.mjs` | spiegelte nur nach `supabase/migrations/` für `db reset` |
| `supabase/` (config.toml, .gitignore, migrations) | Artefakte von `supabase init` |
| `db:start` / `db:stop` / `db:reset` in package.json | brauchten die CLI |
| `@source not ".../supabase/migrations/*.sql"` in globals.css | Ziel existiert nicht mehr |

## Was der Verzicht kostet

Ehrlich bilanziert, es ist wenig:

- **Migrations-Test.** `supabase db reset` spielte `Supabase_sql/archive/` von
  Null ein und bewies, dass die Migrationen sauber durchlaufen. Jetzt wird das
  Schema geprüft, *wie es ist*, nicht *wie die Dateien es beschreiben*. Kein
  echter Verlust: Migrationen werden laut Konvention ohnehin von Hand im
  SQL-Editor eingespielt, und `supabase/migrations/` war ein generiertes,
  gitignoriertes Artefakt.
- **Offline testen.** Geht nicht mehr.
- **Ein Service-Key mit Löschrechten**, sobald die Tests in CI laufen. Die
  ID-gebundene Löschung plus Riegel ist die Antwort darauf.

## Lokale Umgebung — Rückbau durchgeführt

Am selben Tag zurückgebaut, weil nichts mehr daran hängt:

| Schritt | Ergebnis |
|---|---|
| `wsl --unregister Ubuntu`, `wsl --uninstall` | ✅ `wsl --status` meldet „nicht installiert" |
| Docker Desktop deinstalliert | ✅ keine Prozesse, keine Dienste, nicht mehr in der Programmliste |
| Restordner `AppData\Local\Docker`, `.docker`, `AppData\Local\Programs\DockerDesktop`, `AppData\Roaming\Docker` | ✅ gelöscht, ~1,7 GB frei |
| Autostart-Eintrag `HKCU\…\Run\Docker Desktop` | ✅ entfernt |
| Windows-Feature *Windows-Subsystem für Linux* | Haken abwählen, Neustart — braucht Administratorrechte |
| Windows-Feature *Plattform für virtuelle Computer* | **bewusst gelassen** |

**Zwei Fallen, beide real aufgetreten:**

1. **`HKCU` in einer Administrator-Shell ist nicht dein Profil.** `reg delete`
   und `Remove-ItemProperty` meldeten „nicht vorhanden", während der Wert
   nachweislich existierte — sie liefen gegen die Registry-Hälfte des
   Administratorkontos. Belegt über den Änderungszeitstempel des Schlüssels: der
   blieb über beide Versuche hinweg unverändert. Dasselbe gilt für
   `$env:LOCALAPPDATA` und `$env:APPDATA`. **Benutzerprofil-Kram gehört in ein
   normales Fenster**, nur die Windows-Features brauchen Administratorrechte.
2. **Der Docker-Deinstallierer lässt den Autostart-Eintrag stehen** — er zeigte
   danach auf eine gelöschte Datei, die Windows bei jeder Anmeldung erfolglos zu
   starten versuchte.

> **Weiterhin nicht tun:** `bcdedit /set hypervisorlaunchtype off`. Das nimmt
> Memory Integrity mit, ein echter Sicherheitsverlust. VBS war auf diesem
> Rechner schon vor der WSL-Installation aktiv — der Hypervisor läuft also
> ohnehin. Genau deshalb bringt auch das Abschalten von *Plattform für virtuelle
> Computer* nichts und bleibt stehen.

## Integrationstests in CI

Zweiter Job `integration` in [ci.yml](../.github/workflows/ci.yml), `needs:
verify` — Integrationstests auf Code zu fahren, der nicht typecheckt, schreibt
nur sinnlos in die gemeinsame Datenbank.

Die drei Schlüssel kommen als GitHub-Secrets aus der Job-Umgebung;
`setup.ts` liest die Umgebung vor `.env.local`, derselbe Testcode läuft also
unverändert lokal und in CI. Eine Vorprüfung bricht mit klarer Meldung ab, wenn
ein Secret fehlt — sonst äußert sich das als Stapel unverständlicher
Supabase-Fehler tief im Testlauf. Fork-Pull-Requests überspringen den Job, weil
GitHub dorthin keine Secrets reicht.

Bewusst **keine** `concurrency`-Gruppe: die lauf-gebundenen Fixtures vertragen
parallele Läufe, ein Abbruch mitten im Aufräumen dagegen hinterlässt Reste.

## 🔖 Wiederaufnahme

**Stand:** Integrationstests laufen ohne jede lokale Infrastruktur, 32 grün.
Arbeitsbaum committet.

**Offen, in Reihenfolge:**

1. **Login-Actions abdecken** — `guestLoginAction`, `maidLoginAction` (leiten
   per `redirect()` um). Wertvollster Einzeltest: *fünf Fehlversuche sperren nur
   den eigenen Aufenthalt im eigenen Haus* (Befund A aus Phase 6c).
3. **Phase 6b — Self-Service-Registrierung.**
4. Ketten-Themen, Resend, Testplan D–G, IP-Rate-Limit — siehe Abschnitt 4 des
   Übergabe-Dokuments.

**Nebenbefund, ungeprüft:** `.env.local` enthält Klartext-Passwörter der
Testzugänge in Kommentarzeilen. Für eine Stage mit Fake-Hotels vertretbar; vor
echten Kunden gehört das dort raus.
