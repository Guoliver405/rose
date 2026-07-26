# Mehrere Hotels je Konto — Problem, Zielmodell und Umbauplan

> **Status: geplant, noch nicht umgesetzt.** Arbeitsgrundlage, entstanden am
> 26.07.2026 aus der Frage „Warum bleibt `/admin` ohne Slug-Präfix?".
> Voraussetzung ist [Phase 6c](2026-07-26_Phase-6c_Mandantenfaehigkeit.md)
> (Mandant in der URL) — die ist umgesetzt.
>
> **Gehört vor Phase 6b (Self-Service-Registrierung).** Beim Signup wird die
> Beziehung Konto ↔ Hotel ↔ Rechte zum ersten Mal in echte Kundendaten
> geschrieben; danach ist die Korrektur ungleich teurer. Gleiches Argument wie
> bei 6c.

## 1. Warum `/admin` heute zu Recht ohne Slug auskommt

Die drei Kennungen unterscheiden sich in der Reichweite ihrer Eindeutigkeit:

| Kennung | Eindeutig | Folge |
|---|---|---|
| Zimmernummer | nur je Hotel (`unique (hotel_id, number)`) | ohne Mandant mehrdeutig → Slug nötig |
| Maid-Benutzername | nur je Hotel (`unique (hotel_id, username)`) | ohne Mandant mehrdeutig → Slug nötig |
| Management-E-Mail | **global** (`auth.users`) | trifft genau ein Konto, egal bei wie vielen Mandanten |

Hunderte oder tausende Management-Konten sind deshalb kein Problem:
Eindeutigkeit liefert Supabase Auth, die feste Hotel-Zuordnung liefert
`profiles.hotel_id`. Nach dem Login ist der Mandant bekannt.

Ein Slug in der Admin-URL wäre **heute sogar schädlich**: er wäre dekorativ,
entscheiden würde weiterhin die Session. Ein dekorativer Mandanten-Parameter
muss auf jeder Seite gegen Manipulation abgesichert werden (die
`ctx.hotelId !== hotel.id`-Prüfung aus 6c). Wird sie einmal vergessen, lügt
die URL darüber, welches Haus man sieht.

## 2. Was das Zielbild daran ändert

Geplant ist: Kunden registrieren sich auf der Landing-Page, vereinbaren je
nach Pricing einen Plan und sind dann **Admin für ein oder mehrere Hotels**.
Sie legen Zimmer und operative Nutzer an; diese arbeiten im System.

Damit fällt die Begründung aus Abschnitt 1 für den Kontoinhaber weg — und
zwar strukturell:

```sql
create table profiles (
  id       uuid primary key references auth.users(id),  -- eine Zeile je Login
  hotel_id uuid not null references hotels(id),         -- genau EIN Hotel
  ...
```

Ein Login = eine Zeile = ein Hotel. Sobald ein Konto mehrere Häuser trägt, ist
der Mandant **nicht mehr aus der Identität ableitbar**, sondern eine
*Auswahl*. Eine Auswahl gehört in die URL:

- zwei Häuser gleichzeitig in zwei Tabs (mit einem „aktuelles Hotel"-Cookie
  unmöglich — der letzte Wechsel würde den anderen Tab umschalten),
- Lesezeichen und Deep-Links aus Reports zeigen auf das richtige Haus,
- der Guard wird überall derselbe: Slug auflösen → „darf dieser Nutzer hier?".

## 3. Entscheidungen (26.07.2026)

1. **Mehrfach-Zuordnung nur für den Kontoinhaber.** Rezeption und Reinigung
   bleiben je einem Haus zugeordnet. Das hält `profiles` unverändert und
   spart eine Mitgliedschaftstabelle je Hotel.
2. **Alles unter `/h/<slug>/`**, auch das Rezeptions-Portal. `/admin` wird zur
   Haus-Auswahl; bei genau einem Haus wird direkt durchgeleitet.
3. Erst dieses Dokument, dann der Umbau.

## 4. Zielmodell

Neu sind zwei Tabellen und eine Spalte — **rein additiv**, `profiles` bleibt
unangetastet:

```sql
-- Der zahlende Kunde. Plan und Kontingente hängen hier, nicht am Hotel.
accounts (
  id, name, plan, max_hotels, created_at
)

-- Wer gehört zum Konto. Heute nur 'owner'; Platz für 'billing' o. ä.
account_members (
  account_id, user_id, role, display_name,
  primary key (account_id, user_id)
)

-- Jedes Hotel gehört genau einem Konto.
hotels (
  ..., account_id not null references accounts(id)
)
```

**Rechte-Auflösung** — zwei Wege, beide führen auf eine Rolle je Haus:

```
darfInHotel(user, hotel) =
    account_members(hotel.account_id, user, 'owner')   → Rolle 'admin'
 ODER profiles(user).hotel_id = hotel.id               → profiles.role
```

Damit bleiben beide Welten nebeneinander gültig: der Kontoinhaber ist Admin in
**allen** Häusern seines Kontos, und ein einzelnes Haus kann weiterhin eigene
Management-Zugänge haben (`profiles.role` = `admin` | `reception`) — etwa ein
Hausleiter, der genau ein Haus verwaltet.

### Der wichtigste Befund für den Aufwand

Alle **14 RLS-Policies** (13 im Schema v1, eine in der `maid_presence`-
Migration) laufen über genau **zwei Funktionen**:

```sql
is_hotel_member(h)      -- profiles.id = auth.uid() and profiles.hotel_id = h
is_hotel_management(h)  -- ... zusätzlich username is null
```

Der Owner-Zweig muss also nur in diese beiden Funktionen — die Policies selbst
bleiben unverändert. Und weil der Zweig nur **hinzufügt**, verliert niemand
Zugriff; die Reinigungs-RLS wird nicht weiter, weil Reinigungskräfte nie
`account_members` sind.

### Wo lebt der Anzeigename des Inhabers?

`profiles.hotel_id` ist `not null` — ein Inhaber ohne festes Haus kann dort
keine Zeile haben. Deshalb trägt `account_members.display_name` den Namen.
`getManagementContext` liest ihn künftig aus beiden Quellen (Inhaber →
`account_members`, Hausleitung/Rezeption → `profiles`).

## 5. Umbauschritte (in dieser Reihenfolge)

**Schritt 1 — Migration, additiv.**
`accounts` + `account_members` anlegen, `hotels.account_id` zunächst nullable.
Backfill: je bestehendem Hotel ein Konto; Inhaber wird der vorhandene
`profiles`-Eintrag mit `role='admin'`; danach `account_id` auf `not null`.
Kein Bruch für laufenden Code — die Spalten werden noch nicht gelesen.

**Schritt 2 — RLS-Funktionen erweitern.**
Owner-Zweig in `is_hotel_member` und `is_hotel_management`. Additiv, alle 14
Policies profitieren ohne eigene Änderung.

**Schritt 3 — Kontext slug-parametrisiert.**
`getManagementContext(slug)` / `getAdminContext(slug)` lösen das Hotel aus dem
Slug auf und prüfen die Berechtigung über beide Wege. **Der Parameter wird
Pflicht** — dann findet der Type-Check alle **25 Aufrufstellen**, statt dass
eine übersehen wird.

**Schritt 4 — Routing.**
`/admin/**` wandert nach `/h/<slug>/admin/**`. `/admin` wird zur Haus-Auswahl:
Liste der Häuser, auf die der Nutzer Zugriff hat; bei genau einem Haus
Weiterleitung ohne Zwischenseite (der heutige Einzelhaus-Kunde merkt nichts).

**Fallstrick:** Ein Layout schützt **keine Server-Actions**. Der Guard im
Layout deckt die Seiten ab, jede Action muss den Slug selbst entgegennehmen
und erneut prüfen. Der Slug darf dabei ruhig vom Client kommen — er wird ja
gegen die Berechtigung geprüft, genau wie beim Gast-Login aus 6c.

**Schritt 5 — Anlage-Wege.**
`create-tenant.mjs` erzeugt künftig Konto + Hotel + Inhaber.
`/admin/personal` schreibt `hotel_id` des **ausgewählten** Hauses, nicht „das
Hotel des Anlegenden". Druckseiten (Aushang, Handout, Zugangskarte) bauen ihre
URLs aus dem Slug des ausgewählten Hauses.

**Schritt 6 — Plan und Kontingente.**
`accounts.plan` / `max_hotels` beim Anlegen eines Hotels durchsetzen. Der Rest
(Preise, Zahlungsanbieter) gehört zu Phase 6b.

## 6. Was sich NICHT ändert

- **Gast- und Reinigungs-Portal** bleiben wie in 6c gebaut — sie sind bereits
  slug-basiert und kennen keine Konten.
- **Token-Routen** (`/guest/r/<token>`, `/service/auto/<token>`) bleiben
  mandantenfrei. Gedruckte QR-Codes bleiben gültig.
- **`profiles`** bleibt unverändert: operative Nutzer gehören genau einem Haus.
- **Slug bleibt global eindeutig** — er ist der URL-Schlüssel, nicht je Konto
  eindeutig. Zwei Kunden können nicht beide `krone` haben.

## 7. Risiken

- **25 Aufrufstellen** von `getManagementContext`/`getAdminContext`. Wird eine
  übersehen, arbeitet sie auf dem falschen oder auf keinem Haus. Gegenmittel:
  Pflicht-Parameter (Schritt 3), der Compiler zeigt jede Stelle.
- **Server-Actions ohne Layout-Schutz** — siehe Fallstrick oben. Jede
  schreibende Action braucht ihren eigenen Guard.
- **RLS-Erweiterung ist die riskanteste Änderung**, weil 14 Policies daran
  hängen. Sie ist zwar additiv, aber ein Fehler in `is_hotel_member` öffnet
  Türen in fremde Häuser. Vor dem Umbau der Anwendung separat prüfen: mit
  einem Testkonto über zwei Hotels und einem Nachbar-Konto gegenchecken.
- **Kein destruktiver Schritt nötig.** Der gesamte Umbau ist additiv, die
  Migration kann also vor dem Code eingespielt werden — kein enges
  Deploy-Fenster wie bei Constraint-Wechseln.

## 8. Abnahmekriterien

1. Inhaber mit zwei Häusern sieht beide auf `/admin` und kann sie **gleichzeitig
   in zwei Tabs** offen haben, jeweils mit den Daten des richtigen Hauses.
2. Inhaber, der den Slug eines Hauses aus einem **fremden Konto** einträgt,
   bekommt 404 bzw. eine Abweisung.
3. Rezeptions-Zugang von Haus A kommt nicht in Haus B — auch nicht, wenn
   beide Häuser demselben Konto gehören.
4. Reinigungs-RLS unverändert: eine Reinigungskraft sieht exakt das, was sie
   vorher sah (Regressionsprüfung gegen Abschnitt C des Testplans).
5. Bestandskunde mit genau einem Haus wird von `/admin` ohne sichtbare
   Zwischenseite durchgeleitet.
6. Anlegen eines Hotels über das Kontingent des Plans hinaus wird abgewiesen.
7. Gedruckte QR-Codes (Zimmer-Aushang, Zugangskarte) funktionieren unverändert.

## 9. Offene Entscheidungen

1. **Anlegen neuer Häuser**: direkt aus der Haus-Auswahl (`/admin`) oder in
   einem eigenen Konto-Bereich?
2. **Konto-Verwaltung** (Plan, Rechnungsdaten, weitere Inhaber): eigener
   Bereich außerhalb von `/h/<slug>/` — z. B. `/konto`?
3. **Hausleiter-Rolle**: bleibt `profiles.role='admin'` je Haus bestehen, oder
   soll „Admin" künftig ausschließlich der Kontoinhaber sein? Abschnitt 4 hält
   beides offen; Vereinfachung wäre möglich.
4. **Hotel zwischen Konten verschieben** (Betreiberwechsel) — vorerst außen
   vor, oder gleich mitdenken?
5. **Anzeigename des Inhabers je Haus** — ein Name fürs ganze Konto (so wie in
   Abschnitt 4 vorgesehen) oder pro Haus unterschiedlich?
