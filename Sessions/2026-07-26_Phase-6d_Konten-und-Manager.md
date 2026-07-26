# Phase 6d — Mehrere Hotels je Konto, Manager-Rolle (26.07.2026)

> **Status: umgesetzt und end-to-end verifiziert.** Grundlage:
> [Mehrere-Hotels-je-Konto-Plan.md](Mehrere-Hotels-je-Konto-Plan.md).
> Voraussetzung war [Phase 6c](2026-07-26_Phase-6c_Mandantenfaehigkeit.md).

## Anlass

Die Frage „Warum bleibt `/admin` ohne Slug-Präfix?" — die Antwort galt nur für
das alte Modell: die Management-E-Mail ist global eindeutig und trug ihren
Mandanten über `profiles.hotel_id` selbst. Zielbild ist aber die
**Hotelkette**: ein zahlender Kunde mit beliebig vielen Häusern. `profiles`
kann das strukturell nicht (PK = Auth-User, genau ein `hotel_id`) — damit wird
der Mandant von einer Ableitung zu einer **Auswahl**, und eine Auswahl gehört
in die URL.

## Rollen

| Rolle | Reichweite | Quelle |
|---|---|---|
| **Admin** | alle Häuser seines Kontos + Konto/Plan | `account_members(account_id, user_id, 'owner')` |
| **Manager** | Teilmenge der Häuser, dort volle Rechte, **kein** Konto-Zugriff | `hotel_members(hotel_id, user_id, 'manager')` |
| **Rezeption** | ein Haus, Tagesgeschäft | `hotel_members(…, 'reception')` |
| **Reinigung** | ein Haus | `profiles.username IS NOT NULL` (unverändert) |

Innerhalb eines Hauses haben Inhaber und Manager dieselben Rechte — der
Unterschied liegt im Konto-Bereich und darin, welche Häuser sie sehen. Deshalb
gatet `getAdminContext(slug)` auf „nicht Rezeption" statt auf „Inhaber".

## Was gebaut wurde

- **Migration** [2026-07-26_accounts_und_mitgliedschaften.sql](../Supabase_sql/archive/2026-07-26_accounts_und_mitgliedschaften.sql):
  `accounts`, `account_members`, `hotel_members`, `hotels.account_id`. Rein
  additiv; Backfill erzeugte je Bestandshotel ein Konto, machte den bisherigen
  `role='admin'` zum Inhaber und verschob Rezeptions-Zugänge nach
  `hotel_members`.
- **Kontext** in [auth.ts](../src/utils/auth.ts): `getManagementContext(slug)`,
  `getAdminContext(slug)`, neu `listAccessibleHotels()` und
  `getAccountContext()`. Der Slug ist **Pflicht-Parameter** — so zeigte der
  Type-Check alle 25 Aufrufstellen, statt dass eine stillschweigend auf dem
  falschen Haus arbeitet.
- **Routing**: `/admin/**` → `/h/<slug>/admin/**` (33 Dateien). `/admin` ist
  die Haus-Auswahl mit Lagebild je Haus; bei genau einem Haus wird ohne
  Zwischenseite durchgeleitet.
- **Konto-Bereich** `/konto` (nur Inhaber): Häuser anlegen, Manager anlegen und
  Häusern zuordnen, Plan- und Zimmerzahl-Übersicht.
- **`create-tenant.mjs`** erzeugt jetzt Konto + Hotel + Inhaber.

## Zwei Befunde, die den Umbau geprägt haben

**1. RLS reicht als Mandantengrenze nicht mehr.** Bis 6c gab die
Row-Level-Security genau ein Hotel frei — viele Admin-Abfragen verzichteten
deshalb auf einen `hotel_id`-Filter. Seit ein Kontoinhaber mehrere Häuser hat,
gibt dieselbe RLS **alle Häuser des Kontos** frei: Nav-Badge, Zimmer-Übersicht,
Bestellungen, Personal, Services und QR-Aushänge hätten Nachbarhäuser
eingemischt. Die Übersicht trug zusätzlich ein `hotels … limit(1)` — dieselbe
Bauart wie der Branding-Leak, der in 6c geschlossen wurde. Alle Abfragen tragen
den Filter jetzt explizit; die Checkliste in [AGENTS.md](../AGENTS.md) gilt ab
sofort für **beide** Supabase-Clients.

**2. `profiles` ist der Identitäts-Anker, nicht die Berechtigung.**
`stays.created_by` und `service_orders.done_by` zeigen mit `on delete set null`
darauf — ein Löschen von Management-Zeilen risse die Attribution aus
Zimmer-Verlauf und Bestell-Historie (dieselbe Klasse Fehler wie die Kaskade
beim Personal-Löschen). Konsequenzen:

- Management behält seine `profiles`-Zeile; `hotel_id` heißt dort nur noch
  „Stammhaus" und ist nicht mehr maßgeblich für den Zugriff.
- Zugänge werden **entzogen** statt gelöscht. Hart gelöscht wird nur, wenn die
  Person nachweislich nichts hinterlassen hat (kein `stays.created_by`, kein
  `service_orders.done_by`, kein `staff_log`) — der Notausgang für
  Fehlanlagen, wie beim Personal.
- Zwingend daraus folgend: der `profiles`-Zweig in `is_hotel_member` wurde auf
  `username is not null` eingeschränkt. Ohne das hätte ein Rechte-Entzug nicht
  gegriffen — die alte `profiles`-Zeile hätte weiter Zugang gewährt.

Beide Funktionen bleiben der einzige RLS-Hebel: alle 14 Policies laufen über
`is_hotel_member` / `is_hotel_management`, keine Policy musste angefasst werden.

## Verifikation (26.07.2026, lokal gegen die Stage-DB)

Für den Test wurde im Konto „Mein Hotel" ein zweites Haus **Strandhaus Nord**
angelegt und **Nina Manager** ausschließlich diesem zugeordnet.

| # | Kriterium | Ergebnis |
|---|---|---|
| 1 | Inhaber sieht beide Häuser, gleichzeitig in zwei Tabs | ✅ `/admin` listet beide mit Lagebild („4 zu reinigen" vs. „alles bereit"); beide Tabs zeigten parallel eigenes Branding und eigene Daten |
| 2 | Manager kommt nur in seine Häuser | ✅ Nina landet direkt in Strandhaus Nord; `/h/mein-hotel/admin` (**gleiches Konto!**) wirft sie zurück |
| 3 | Manager kommt nicht in den Konto-Bereich | ✅ `/konto` leitet zurück auf ihr Haus |
| 4 | Fremdes Konto | ✅ Inhaber von „Mein Hotel" auf `/h/pension-alpenblick/admin` → zurück zur eigenen Haus-Auswahl |
| 5 | Rezeption bleibt hausintern | ✅ Krone-Rezeption abgewiesen; kein „Häuser"-Link im Kopf; verkürzter Einstellungen-Hub (Aushänge, Personal-Karten, Passwort) |
| 6 | Reinigungs-RLS unverändert | ✅ QR-Auto-Login → Board „Mein Hotel", gleiche Zählstände wie vor dem Umbau |
| 7 | Einzelhaus-Kunde ohne Zwischenseite | ✅ `/admin` → direkt `/h/mein-hotel/admin` |
| 8 | Gedruckte QR-Codes | ✅ Zimmer-QR → PIN → `/h/mein-hotel/guest/status` |

Konsole und Server-Log fehlerfrei; `npx tsc --noEmit`, `npm run lint` und
`npm run build` sauber.

## Stage-Zustand danach

| Konto | Häuser | Zugänge |
|---|---|---|
| Mein Hotel | Mein Hotel (`mein-hotel`), Strandhaus Nord (`strandhaus-nord`) | Inhaber `rezeption@rose.local`; Manager `nina@rose.local` / `ManagerTest123` (nur Strandhaus Nord) |
| Pension Alpenblick | Pension Alpenblick | Inhaber `alpenblick@rose.local` |
| Stadthotel Krone | Stadthotel Krone | Inhaber `krone@rose.local`; Rezeption `frontdesk-krone@rose.local` |

Strandhaus Nord und Nina bleiben bewusst stehen — sie sind die Testlage für den
Mehrhaus-Pfad (0 Zimmer, Beispiel-Services geseedet).

## 🔖 Wiederaufnahme

Umgesetzt sind Phasen 0–5, 6a, 6c und 6d. **Nächster Schritt bleibt Phase 6b
(Self-Service-Registrierung)** — jetzt gefahrlos, weil Konto-, Hotel- und
Rechte-Beziehung stehen: Signup erzeugt `accounts` + `hotels` + `account_members`,
Slug über `slugify`/`uniqueSlug`.

**Vorher zwingend** (siehe Plan, Abschnitt 6): **Zimmer weich deaktivieren**
(`rooms.deactivated_at` statt hartem Löschen). Abrechnung läuft je Zimmer nach
der Regel „in der Periode auch nur vorübergehend aktiv = zählt"; hartes Löschen
macht die erste Abrechnungsperiode unrekonstruierbar. In der Testphase
folgenlos, ab dem ersten echten Kunden nicht mehr.

Danach eingeplant (Plan, Abschnitt 13):

- **Konto-weite Service-Vorschlagsliste** — der Admin pflegt die Vorschläge,
  Admin und Manager passen je Haus an.
- **Kontoweite Policy-Vorgaben** mit Abweichung je Haus.
- **Konsolidierte Auswertung** über alle Häuser.
- **Resend-Anbindung**: Einladungs-Mails für Manager- und Rezeptions-Zugänge,
  danach Gast-Handout und Maid-Karte wahlweise drucken **oder** mailen.
- **IP-Rate-Limit** für die Gast-Anmeldung (offen seit 6c).
