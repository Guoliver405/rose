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

**Erster Lauf verifiziert**
([30208848551](https://github.com/Guoliver405/rose/actions/runs/30208848551)):
`verify` grün in 55 s, `integration` grün in 54 s, davon 36 s im Schritt
„Integrationstests" — also tatsächlich ausgeführt, nicht übersprungen. Die
Datenbank danach erneut geprüft: keine `itest`-Rückstände, alle vier Hotels und
zehn Nutzer unverändert. Damit hat erstmals ein fremder Runner Konten und Häuser
in der gemeinsamen Instanz angelegt und wieder abgeräumt, ohne fremde Zeilen zu
berühren.

## Nachgelagerter Fund: Sackgasse für Einzelhaus-Konten

Beim Durchklicken mit den Testzugängen aufgefallen (Frage des Users: *„Wie soll
der Admin unter diesen Voraussetzungen ein weiteres Haus anlegen?"*).

**Der Fehler:** Der einzige Link auf `/konto` im gesamten Code stand in
`src/app/admin/page.tsx` — auf der Haus-Auswahl. Die leitet bei genau einem Haus
schon vorher weiter (`if (hotels.length === 1) redirect(...)`), der Link wurde
also nie gerendert. Ein Kontoinhaber mit einem Haus kam damit über die
Oberfläche **nicht an sein Konto**: kein zweites Haus, kein Manager, kein Plan.
Die Route selbst war intakt, nur unerreichbar — `/konto` von Hand eingetippt
funktionierte.

Tragweite: nicht der Randfall, sondern der Normalfall. Ab Phase 6b
(Self-Service-Registrierung) landet **jeder neue Kunde** genau dort — ein Haus,
kein Weg zu wachsen.

**Behoben** in `src/app/h/[slug]/admin/layout.tsx`: beide Wege aus dem Haus
heraus hängen jetzt in der Kopfzeile des Hauses.

- „Häuser" → `/admin`, sichtbar erst ab dem **zweiten** erreichbaren Haus
  (`listAccessibleHotels()`). Vorher hing die Sichtbarkeit nur an der Rolle,
  weshalb Einzelhaus-Inhaber einen Knopf sahen, der sie dorthin zurückwarf, wo
  sie herkamen — genau der Eindruck, der die Frage ausgelöst hat.
- „Konto" → `/konto`, sichtbar bei `ctx.isOwner`, also unter derselben
  Bedingung, die `getAccountContext()` durchlässt.

Für die Rezeption wird `listAccessibleHotels()` gar nicht erst aufgerufen — sie
sieht ohnehin keinen der beiden Wege.

**Verifiziert im Browser, alle vier Rollen:**

| Zugang | Rolle | „Häuser" | „Konto" |
|---|---|---|---|
| `alpenblick@rose.local` | Inhaber, 1 Haus | nein | **ja** ← war die Sackgasse |
| `rezeption@rose.local` | Inhaber, 2 Häuser | ja | ja |
| `nina@rose.local` | Manager, 1 Haus | nein | nein |
| `frontdesk-krone@rose.local` | Rezeption | nein | nein |

`/konto` als Alpenblick geöffnet: „Haus anlegen" und „Manager anlegen"
vorhanden. Keine Konsolenfehler, `npm run verify` grün.

### Zweiter Anlauf: die Trennung war das Problem, nicht die Sichtbarkeit

Der erste Fix machte „Häuser" ab dem zweiten Haus sichtbar und stellte „Konto"
daneben. Einwand des Users, zu Recht: *unnötig kompliziert und inkonsistent,
wenn man von einem Haus auf mehrere erweitert.* Zwei Knöpfe, deren Sichtbarkeit
sich unterschiedlich verhält, sind schwerer zu erklären als einer, der immer da
ist. Also nicht die Sichtbarkeit reparieren, sondern die Trennung aufheben:

- **`/admin` trägt jetzt Häuser UND Konto.** Konto-Kasten (Plan, Zimmerzahlen,
  Abrechnungsregel) oben — nur für den Inhaber —, darunter alle erreichbaren
  Häuser mit Lagebild, dazu „Haus anlegen". Auch bei genau einem Haus.
- **`/admin` leitet nie mehr weiter.** Wohin man nach dem Anmelden kommt, ist
  eine Frage des Einstiegs und liegt jetzt auf der Login-Seite: Inhaber und
  Manager landen auf der Häuser-Seite, die Rezeption direkt im Haus (für sie
  gibt es dort nichts).
- **`/konto` ist entfallen** — Ordner gelöscht, Matcher in `proxy.ts` bereinigt.
  Das ungenutzte `renameHotelSlugAction` ging mit; die Slug-Änderung läuft über
  `updateSettingsAction` im Einstellungs-Hub.
- **„Häuser" in der Kopfzeile ist immer sichtbar** (außer für die Rezeption).

### Manager sind Personal, kein Konto-Thema

Ebenfalls auf Zuruf des Users: die Manager-Verwaltung gehört zu den anderen
Personenarten. Neuer Abschnitt „Personal — Manager" auf `…/admin/personal`,
neben Reinigung und Rezeption.

Hausbezogen wie die anderen beiden: die Seite von Haus X zeigt und ändert
ausschließlich die Manager VON Haus X. Wer jemanden über mehrere Häuser
einsetzt, trägt ihn je Haus ein — ab dem zweiten Mal über „Vorhandenen Manager
hinzufügen" aus den Managern des Kontos, ohne neuen Zugang. Entfernen wirkt nur
auf dieses Haus; ein Abzeichen „betreut N Häuser" und der Bestätigungstext
machen das vorher sichtbar.

Der Riegel ist hier **strenger** als bei Reinigung und Rezeption: nicht
`getAdminContext` (das ließe Manager durch), sondern `isOwner`. Ein Manager, der
Mit-Manager ernennt, wäre eine Rechteausweitung.

### Verifiziert im Browser

| Fall | Ergebnis |
|---|---|
| Inhaber, 1 Haus (Alpenblick) | Konto-Kasten, Haus, „Haus anlegen" ✅ |
| Inhaber, 2 Häuser | dito, beide Häuser mit Lagebild ✅ |
| Manager (Nina) | nur Häuser-Liste, **kein** Konto-Kasten, **kein** „Haus anlegen" ✅ |
| Manager sieht „Personal — Manager" | **nein** ✅ (Rechteausweitung verhindert) |
| Manager anlegen → 2. Haus zuordnen | Auswahl bietet ihn an, danach „betreut 2 Häuser" ✅ |
| Aus einem Haus entfernen | anderes Haus unberührt, er kehrt in die Auswahl zurück ✅ |
| Aus dem letzten Haus entfernen | Zugang gelöscht (keine Historie), Datenbank rückstandsfrei ✅ |

Keine Konsolenfehler, `npm run verify` grün. Beim Testen fiel ein Sprachfehler
auf („die übrigen 1 Haus bleibt") — behoben über einen kleinen Helfer, der den
Singular richtig bildet.

**Fallstrick unterwegs:** Nach dem Löschen von `src/app/konto/` scheiterte
`tsc` an `.next/types/validator.ts`, das die entfernte Route noch importierte.
`.next/` löschen und den Dev-Server neu starten — steht so in der
Fallstrick-Tabelle und galt hier wörtlich.

### Datenkorrektur: Inhaber hießen „Rezeption"

Aufgefallen, weil die Kopfzeile bei allen drei Kontoinhabern „Rezeption"
anzeigte. Kein Code-Fehler — der Anzeigename kommt aus
`account_members.display_name`, und die Phase-6d-Migration hat ihn aus den
Alt-Profilen übernommen:

```sql
insert into account_members (account_id, user_id, role, display_name)
select h.account_id, p.id, 'owner', p.display_name from profiles p ...
```

Diese Profile stammen aus der Zeit vor dem Rollen-Modell, als es genau einen
Management-Login gab — und der hieß „Rezeption". Auf die Rechte hatte das nie
Einfluss (die hängen an `role = 'owner'`), es las sich nur falsch.

Die drei Zeilen sind einmalig auf „Inhaber" gesetzt; `hotel_members` blieb
unberührt (geprüft: „Front Desk Test", „Nina Manager" unverändert).
`scripts/create-tenant.mjs` schreibt ohnehin schon `'Inhaber'`, neue Mandanten
waren nie betroffen.

**Bewusst nicht angefasst:** `profiles.display_name` derselben Nutzer. Das ist
die Attribution im Zimmer-Verlauf — dort ist „Rezeption" für einen Check-in am
Empfang die zutreffendere Beschriftung, nicht „Inhaber".

Richtig gelöst wird das mit **Phase 6b**: Der Anzeigename gehört bearbeitbar,
zusammen mit dem Passwort auf einer Seite „Mein Zugang" (heute nur
`…/admin/einstellungen/passwort`). Bei Self-Service-Registrierung ist das
ohnehin Pflicht.

## Phase 6b — Self-Service-Registrierung

Vorfrage des Users: *Brauchen wir dafür schon Resend?* **Nein.** Supabase Auth
bringt Registrierung mit; der eingebaute Mail-Sender ist aber ausdrücklich für
Entwicklung gedacht (streng rate-limitiert, geteilte Absenderdomain). Statt sich
darauf zu stützen, umgeht der Ablauf die Bestätigung ganz.

**`/registrieren`** — ein Formular, fünf Felder (Einladungscode, Hotelname, Ihr
Name, E-Mail, Passwort). Daraus entstehen in einem Zug: Auth-Zugang, Konto,
erstes Haus mit Slug, Profil, Inhaber-Mitgliedschaft und die Beispiel-Services.
Danach Anmeldung und Sprung ins vorhandene Zimmer-Setup.

**Drei Entscheidungen und ihr Grund:**

1. **Einladungscode statt offener Registrierung.** Die Stage-URL ist öffentlich;
   ohne Riegel könnte jeder Mandanten anlegen. Der Code steht in
   `SIGNUP_INVITE_CODE`. **Fehlt die Variable, ist die Registrierung ZU** —
   ein vergessenes Env-Var darf das Tor nicht öffnen, deshalb ist „geschlossen"
   der Standard und nicht „offen".
2. **Kein Bestätigungslauf.** Der Zugang entsteht über die Admin-API mit
   `email_confirm: true` und wird sofort angemeldet. Damit hängt der Ablauf
   **nicht** an der Projekt-Einstellung „Confirm email" und braucht keine Mail.
3. **Kein Wizard fürs Zimmer-Setup.** `…/admin/zimmer` beherrscht Etagenbereiche,
   Nummernlisten und Präfixe bereits — nachbauen hieße, zwei Oberflächen zu
   pflegen, die auseinanderlaufen.

**Reihenfolge und Rücknahme.** Der Auth-Zugang entsteht **zuerst**: „E-Mail schon
vergeben" ist der häufigste Abbruch, und davor gibt es nichts zurückzurollen.
Scheitert später ein Schritt, löscht `rollback()` das Konto (die Kaskade nimmt
Haus, Zimmer und Services mit) und den Auth-Zugang. Einzige Ausnahme: schlägt am
Ende nur die Anmeldung fehl, bleibt das Konto stehen — es wäre absurd, eine
gelungene Registrierung wegen einer Nebensache zu verwerfen.

**Verifiziert im Browser:**

| Fall | Ergebnis |
|---|---|
| Falscher Einladungscode | abgewiesen, **nichts** angelegt ✅ |
| Gültige Registrierung | Slug `testhaus-registrierung`, Landung im Zimmer-Setup ✅ |
| Angelegt (DB geprüft) | Konto (Plan trial), Haus (`pinLength: 6`), Inhaber-Mitgliedschaft, Profil mit `username = null`, korrektes Stammhaus, beide Beispiel-Services samt 2 Positionen ✅ |
| Kopfzeile | zeigt den eingegebenen Namen, nicht „Rezeption" ✅ |
| Zweite Registrierung, gleiche E-Mail | klare Fehlermeldung, **kein** Waisen-Mandant ✅ |
| Bereits angemeldet ruft `/registrieren` | Weiterleitung wie auf `/login` ✅ |

Testmandant danach restlos entfernt. Keine Konsolenfehler, `npm run verify` grün.

**Startseite** angepasst: der Platzhalter „Registrierung öffnet in Kürze" führt
jetzt auf `/registrieren`, FAQ-Antwort entsprechend. Anmelde- und
Registrierungsseite verlinken sich gegenseitig.

**Vor dem Deployen:** `SIGNUP_INVITE_CODE` in Vercel setzen — sonst ist die
Registrierung dort geschlossen (gewollter Standard, aber man muss es wissen).

## Passwort zurücksetzen (Resend, Teil 1)

Frage des Users: *Lass uns Resend einbauen.* Dabei zeigte sich, dass „Resend
einbauen" zwei verschiedene Dinge meint:

1. **Custom SMTP in Supabase** — Supabase verschickt seine eigenen Mails
   (Bestätigung, Reset, Einladung) über Resend. Reine **Dashboard-Einstellung**,
   kein Anwendungscode.
2. **Resend-API aus der Anwendung** — für eigene Mails: Einladungen,
   Gast-Handout, Maid-Karte. Braucht Paket und API-Key.

Der akute Mangel — kein Passwort-Zurücksetzen — hängt an (1). Deshalb steht in
diesem Schritt **keine Zeile Resend-Code** in der Anwendung; gebaut wurde nur,
was Supabase nicht mitbringt: die Oberfläche.

**Der Weg, drei Teile:**

- `/passwort-vergessen` → `resetPasswordForEmail` mit
  `redirectTo = <site>/auth/callback?next=/passwort-neu`.
- `/auth/callback` (Route Handler, weil Cookies geschrieben werden) → tauscht
  `?code=` gegen eine Sitzung, leitet weiter.
- `/passwort-neu` → `updateUser({ password })`, danach direkt angemeldet.

**Zwei Riegel, die leicht zu übersehen sind:**

- **Offener Weiterleiter.** `next` kommt aus der URL. Ohne Prüfung auf relative
  Ziele (`/…`, aber nicht `//…`) wäre `/auth/callback` ein Sprungbrett auf
  fremde Seiten unter unserer Domain.
- **PKCE bindet an den Browser.** `resetPasswordForEmail` legt den
  `code_verifier` als Cookie ab; `exchangeCodeForSession` braucht ihn. Wer den
  Link auf einem anderen Gerät öffnet, scheitert zwangsläufig. Das ist kein
  Fehler, sondern die Bauart — deshalb sagen alle drei Seiten es ausdrücklich.

**Befund beim Testen:** Ein Reset für `alpenblick@rose.local` scheitert mit
`Email address "alpenblick@rose.local" is invalid`. Supabase weist nicht
routbare Endungen wie `.local` **grundsätzlich** ab, noch vor jedem
Versandversuch. **Sämtliche Testzugänge des Projekts sind davon betroffen** —
der Reset lässt sich mit ihnen nicht end-to-end prüfen, dafür braucht es einen
Zugang mit echter Adresse. Die Fehlermeldung unterscheidet diesen Fall jetzt von
einer Störung („nicht zustellbar" statt „später erneut versuchen").

**Nebenbei aufgeräumt:** Die Regel „wohin nach dem Anmelden" stand nach der
Registrierung an zwei, mit dem Reset an drei Stellen. Jetzt einmal als
`landingRoute()` in [auth.ts](../src/utils/auth.ts).

**Verifiziert, soweit ohne SMTP möglich:**

| Fall | Ergebnis |
|---|---|
| `/passwort-neu` ohne Sitzung | erklärt den Grund, bietet neuen Link an ✅ |
| `/auth/callback` ohne Code | leitet auf `/passwort-vergessen?fehler=link` ✅ |
| Reset für `.local`-Adresse | „nicht zustellbar", Ursache im Server-Log ✅ |

Was **nicht** geprüft ist: der vollständige Durchlauf mit echter Mail. Dafür
fehlen die SMTP-Einstellung und ein Zugang mit echter Adresse — siehe unten.

### Einrichtung, die nur im Dashboard geht

1. **Resend** → Domain verifizieren. Der User hat bereits ein Konto für einen
   anderen Dienst; eine dort verifizierte Domain darf unter *jeder* Adresse
   dieser Domain senden, RoSe braucht also keine eigene (z. B.
   `rose@vorhandene-domain`). API-Key erzeugen.
2. **Supabase** → Project Settings → Authentication → SMTP Settings:
   Host `smtp.resend.com`, Port `465`, Benutzer `resend`, Passwort = der
   Resend-API-Key, Absender = die verifizierte Adresse.
3. **Supabase** → Authentication → URL Configuration → Redirect URLs:
   `https://rose-sand-one.vercel.app/auth/callback` **und**
   `http://localhost:3000/auth/callback`. Fehlt der Eintrag, verweigert
   Supabase die Weiterleitung und der Link läuft ins Leere.
4. Zum Testen einen Zugang mit **echter** Adresse anlegen — die
   `@rose.local`-Konten können das nicht.

## 🔖 Wiederaufnahme

**Stand:** Integrationstests laufen ohne jede lokale Infrastruktur, 32 grün.
Arbeitsbaum committet.

**Offen, in Reihenfolge:**

1. **SMTP einrichten und den Reset end-to-end prüfen** — die vier Schritte im
   Abschnitt „Einrichtung, die nur im Dashboard geht". Die Anwendungsseite ist
   fertig; ohne SMTP und einen Zugang mit echter Adresse lässt sie sich nur
   bis zur Versandgrenze testen.
2. **Resend-API für eigene Mails** (Teil 2): Einladungen für Manager- und
   Rezeptions-Zugänge statt vorgelesener Passwörter — betrifft beide
   Anlege-Wege im Personal-Menü. Danach optional E-Mail-Bestätigung bei der
   Registrierung einschalten (dann echtes `signUp()` statt Admin-API).
3. **Seite „Mein Zugang"** — Anzeigename und Passwort selbst bearbeitbar (siehe
   Datenkorrektur oben); heute gibt es nur `…/admin/einstellungen/passwort`.
3. **Login-Actions abdecken** — `guestLoginAction`, `maidLoginAction` (leiten
   per `redirect()` um). Wertvollster Einzeltest: *fünf Fehlversuche sperren nur
   den eigenen Aufenthalt im eigenen Haus* (Befund A aus Phase 6c).
3. **Phase 6b — Self-Service-Registrierung.**
4. Ketten-Themen, Resend, Testplan D–G, IP-Rate-Limit — siehe Abschnitt 4 des
   Übergabe-Dokuments.

**Nebenbefund, ungeprüft:** `.env.local` enthält Klartext-Passwörter der
Testzugänge in Kommentarzeilen. Für eine Stage mit Fake-Hotels vertretbar; vor
echten Kunden gehört das dort raus.
