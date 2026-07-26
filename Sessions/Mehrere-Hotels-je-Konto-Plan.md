# Mehrere Hotels je Konto — Problem, Zielmodell und Umbauplan

> **Status: geplant, noch nicht umgesetzt.** Arbeitsgrundlage, entstanden am
> 26.07.2026 aus der Frage „Warum bleibt `/admin` ohne Slug-Präfix?" und im
> Dialog verfeinert. Voraussetzung ist
> [Phase 6c](2026-07-26_Phase-6c_Mandantenfaehigkeit.md) (Mandant in der URL) —
> die ist umgesetzt.
>
> **Gehört vor Phase 6b (Self-Service-Registrierung).** Beim Signup wird die
> Beziehung Konto ↔ Hotel ↔ Rechte zum ersten Mal in echte Kundendaten
> geschrieben; danach ist die Korrektur ungleich teurer. Gleiches Argument wie
> bei 6c.

## 1. Zielgruppe: Hotelketten

Der eigentliche Antrieb für dieses Vorhaben ist **nicht** das Einzelhaus mit
zwei Standorten, sondern die **Hotelkette** als Kundschaft. Daraus folgt mehr
als „ein Konto darf mehrere Hotels haben" — siehe Abschnitt 7, der die drei
Stellen benennt, an denen der Dienst für eine Kette sonst unbrauchbar bleibt.

Geschäftsmodell: der Admin ist der zahlende Kunde, zahlt **je Zimmer** und darf
beliebig viele Häuser anlegen. Kein Hotel-Kontingent.

## 2. Warum `/admin` heute zu Recht ohne Slug auskommt

Die drei Kennungen unterscheiden sich in der Reichweite ihrer Eindeutigkeit:

| Kennung | Eindeutig | Folge |
|---|---|---|
| Zimmernummer | nur je Hotel (`unique (hotel_id, number)`) | ohne Mandant mehrdeutig → Slug nötig |
| Maid-Benutzername | nur je Hotel (`unique (hotel_id, username)`) | ohne Mandant mehrdeutig → Slug nötig |
| Management-E-Mail | **global** (`auth.users`) | trifft genau ein Konto, egal bei wie vielen Mandanten |

Hunderte Management-Konten sind deshalb kein Problem: Eindeutigkeit liefert
Supabase Auth, die feste Hotel-Zuordnung liefert `profiles.hotel_id`.

Ein Slug in der Admin-URL wäre **heute sogar schädlich**: er wäre dekorativ,
entscheiden würde weiterhin die Session. Ein dekorativer Mandanten-Parameter
muss auf jeder Seite gegen Manipulation abgesichert werden (die
`ctx.hotelId !== hotel.id`-Prüfung aus 6c). Wird sie einmal vergessen, lügt
die URL darüber, welches Haus man sieht.

## 3. Was das Zielbild daran ändert

Sobald ein Konto mehrere Häuser trägt, ist der Mandant **nicht mehr aus der
Identität ableitbar**, sondern eine *Auswahl*. Und zwar strukturell:

```sql
create table profiles (
  id       uuid primary key references auth.users(id),  -- eine Zeile je Login
  hotel_id uuid not null references hotels(id),         -- genau EIN Hotel
  ...
```

Eine Auswahl gehört in die URL:

- zwei Häuser gleichzeitig in zwei Tabs (mit einem „aktuelles Hotel"-Cookie
  unmöglich — der letzte Wechsel würde den anderen Tab umschalten),
- Lesezeichen und Deep-Links aus Reports zeigen auf das richtige Haus,
- der Guard wird überall derselbe: Slug auflösen → „darf dieser Nutzer hier?".

## 4. Entscheidungen (26.07.2026)

1. **Alles unter `/h/<slug>/`**, auch das Rezeptions-Portal. `/admin` wird zur
   Haus-Auswahl; bei genau einem Haus wird direkt durchgeleitet.
2. **Vier Rollen**, zwei davon hausübergreifend:
   - **Admin** = Kontoinhaber, zahlender Kunde. Alle Häuser seines Kontos,
     plus Konto- und Plandaten.
   - **Manager** = darf eine **Teilmenge der Häuser** verwalten, dort aber
     alles außer Konto- und Plandaten. *Teilmenge der Häuser, nicht der
     Rechte* — bewusst kein Fähigkeitssystem (siehe Risiko 2).
   - **Rezeption** und **Reinigung** bleiben hausintern, unverändert.
3. **Abrechnung je Zimmer — vertagt**, aber die Definition steht:
   > Jedes Zimmer, das in der Abrechnungsperiode **auch nur vorübergehend
   > aktiv war**, zählt. Zimmer, die über die ganze Periode deaktiviert waren,
   > zählen nicht.

   Ob zimmergenau oder in Staffeln, ist offen. Konsequenzen in Abschnitt 6.
4. Kein Hotel-Kontingent (`max_hotels` aus der ersten Fassung entfällt).

## 5. Zielmodell

Rein additiv — `profiles` bleibt für die Reinigung unangetastet:

```sql
-- Der zahlende Kunde. Plan und Abrechnung hängen hier, nicht am Hotel.
accounts (
  id, name, plan, created_at
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

-- Hausbezogene Management-Zuordnung. Der Manager bekommt eine Zeile
-- je Haus, das er verwalten darf — daher die Teilmenge.
hotel_members (
  hotel_id, user_id, role, display_name,
  primary key (hotel_id, user_id)
)
```

**Rechte-Auflösung** — zwei Wege, beide führen auf eine Rolle je Haus:

```
rolleImHotel(user, hotel) =
    account_members(hotel.account_id, user, 'owner')  → 'admin'
 ODER hotel_members(hotel.id, user).role              → 'manager' | 'reception'
```

`profiles.role` (heute `admin` | `reception`) verliert damit seine
Zuständigkeit für den Zugriff: das heutige per-Haus-`admin` **ist** der
Manager, nur bisher auf ein Haus beschränkt.

### `profiles` bleibt der Identitäts-Anker — auch für Management

**Management-Zeilen dürfen NICHT aus `profiles` verschwinden.** Zwei
Fremdschlüssel zeigen darauf und sind `on delete set null`:

```sql
stays.created_by        uuid references profiles(id) on delete set null
service_orders.done_by  uuid references profiles(id) on delete set null
```

Ein Löschen risse also die Attribution im Zimmer-Verlauf („Check-in ·
Rezeption") und in der Bestell-Historie („Historie nennt Bearbeiter") weg —
dieselbe Klasse Fehler wie die Kaskade beim Personal-Löschen. `profiles`
bleibt daher der Datensatz **jeder Person** (Anzeigename + FK-Ziel);
`profiles.hotel_id` bedeutet für Management künftig nur noch „Stammhaus" und
ist **nicht mehr maßgeblich für den Zugriff**.

### Daraus folgt eine zwingende Einschränkung in der RLS

Bliebe der `profiles.hotel_id`-Zweig unverändert, würde der **Entzug** von
Manager-Rechten nicht greifen: die alte Zeile gewährte weiter Zugang. Der
Zweig muss deshalb auf Reinigungskräfte begrenzt werden:

```sql
is_hotel_member(h) =
     profiles(auth.uid()).hotel_id = h AND username IS NOT NULL   -- Reinigung
  OR hotel_members(h, auth.uid())                                 -- Manager/Rezeption
  OR account_members(hotels(h).account_id, auth.uid())            -- Inhaber

is_hotel_management(h) =
     hotel_members(h, auth.uid())
  OR account_members(hotels(h).account_id, auth.uid())
```

### Der wichtigste Befund für den Aufwand

Alle **14 RLS-Policies** (13 im Schema v1, eine in der `maid_presence`-
Migration) laufen über genau **zwei Funktionen**:

```sql
is_hotel_member(h)      -- profiles.id = auth.uid() and profiles.hotel_id = h
is_hotel_management(h)  -- ... zusätzlich username is null
```

Die neuen Zweige kommen nur dort hinein — die Policies selbst bleiben
unverändert. Weil die Zweige nur **hinzufügen**, verliert niemand Zugriff, und
die Reinigungs-RLS wird nicht weiter (Reinigungskräfte stehen nie in
`account_members` oder `hotel_members`).

## 6. Zimmer-Lebenszyklus — UMGESETZT am 26.07.2026

> Nachtrag: direkt nach dem 6d-Umbau umgesetzt, also deutlich vor der unten
> genannten Frist. Details im
> [Session-Protokoll](2026-07-26_Phase-6d_Konten-und-Manager.md), Abschnitt
> „Nachtrag: Zimmer weich deaktivieren". Der folgende Abschnitt beschreibt die
> Begründung und bleibt als solche stehen.

`rooms` hat heute **kein** `deactivated_at`; es gibt nur hartes Löschen, und
das kaskadiert auf `room_guest_tokens`, `stays`, `room_states` und
`service_orders`. (`staff_log.room_id` ist `on delete set null` — der
Arbeitsnachweis überlebt, verliert aber die Zimmer-Zuordnung.)

Die Abrechnungsdefinition aus Abschnitt 4 ist die **billigste denkbare**: sie
braucht weder Snapshots noch Cron, sondern genau eine Abfrage —

```sql
where created_at < periode_ende
  and (deactivated_at is null or deactivated_at > periode_start)
```

— das passt zur Projektlinie („reine Loader-Ableitung, kein Cron", wie bei der
Stayover-Automatik). **Voraussetzung ist aber, dass Zimmer nicht mehr hart
gelöscht werden.**

> **Frist:** Der Stichtag ist nicht „wenn wir die Abrechnung bauen", sondern
> **bevor der erste echte Kunde existiert**, also vor Phase 6b. Wird bis dahin
> hart gelöscht, ist die erste Abrechnungsperiode nicht rekonstruierbar. In
> der jetzigen Testphase mit fiktiven Hotels ist das folgenlos.

Das Muster kennt das Projekt bereits von den Reinigungskräften
(„Deaktivieren statt Löschen", `profiles.deactivated_at`), und der
[Testplan](Testplan-Walkthrough.md) hat es für Zimmer schon als Risiko notiert.
Offen bleibt, ob „außer Betrieb" (Renovierung) und „abbestellt" **zwei**
Zustände brauchen — sonst wird Renovierung zum Weg, die Zimmergebühr zu
umgehen. Das ist eine Preisentscheidung.

## 7. Was Ketten zusätzlich brauchen

Mehrere Häuser je Konto sind für eine Kette **notwendig, aber nicht
hinreichend**. Drei Dinge sind heute strikt hausgebunden und würden eine Kette
in stumpfe Fleißarbeit zwingen:

| Heute je Hotel | Erwartung einer Kette |
|---|---|
| Service-Baukasten (`service_definitions`, `service_items`) | ein Katalog fürs ganze Konto, je Haus abweichbar — sonst pflegt man „Wäscheservice" 30-mal |
| Policies (PIN-Länge, Reinigungsfenster, Stayover, Stale-Timeout) | Kettenvorgabe als Standard, Haus darf abweichen |
| Auswertung (`/admin/auswertung`) | ein Blick über alle Häuser statt 30 Einzelaufrufe |

Dazu die Haus-Auswahl selbst: für eine Kette ist sie kein Menü, sondern das
**Lagebild** — offene Reinigungen und dringende Service-Anfragen je Haus auf
einen Blick, mit Absprung ins Haus.

Das ist **nicht** Teil dieses Umbaus, gehört aber in die Reihenfolgeplanung:
ohne diese drei Punkte ist „mehrere Hotels" für die Zielgruppe eher eine
Ankündigung als ein Angebot. Vorschlag: Konto-weite Vorlagen für Services und
Policies direkt nach diesem Umbau, die konsolidierte Auswertung danach.

## 8. Umbauschritte (in dieser Reihenfolge)

**Schritt 1 — Migration, additiv.** `accounts`, `account_members`,
`hotel_members` anlegen, `hotels.account_id` zunächst nullable. Backfill: je
bestehendem Hotel ein Konto; Inhaber wird der vorhandene `profiles`-Eintrag mit
`role='admin'`; bestehende `role='reception'`-Profile werden zu
`hotel_members`-Zeilen; danach `account_id` auf `not null`. Kein Bruch — die
neuen Spalten werden noch nicht gelesen.

**Schritt 2 — RLS-Funktionen erweitern.** Owner- und `hotel_members`-Zweig in
`is_hotel_member` / `is_hotel_management`. Additiv, alle 14 Policies
profitieren ohne eigene Änderung.

**Schritt 3 — Kontext slug-parametrisiert.** `getManagementContext(slug)` /
`getAdminContext(slug)` lösen das Hotel aus dem Slug auf und prüfen die
Berechtigung über beide Wege. **Der Parameter wird Pflicht** — dann findet der
Type-Check alle **25 Aufrufstellen**, statt dass eine übersehen wird.

**Schritt 4 — Routing.** `/admin/**` wandert nach `/h/<slug>/admin/**`.
`/admin` wird zur Haus-Auswahl; bei genau einem Haus Weiterleitung ohne
Zwischenseite (der heutige Einzelhaus-Kunde merkt nichts).

**Fallstrick:** Ein Layout schützt **keine Server-Actions**. Der Guard im
Layout deckt die Seiten ab, jede Action muss den Slug selbst entgegennehmen und
erneut prüfen. Der Slug darf vom Client kommen — er wird ja gegen die
Berechtigung geprüft, genau wie beim Gast-Login aus 6c.

**Schritt 5 — Konto-Bereich.** Eigener Bereich außerhalb von `/h/<slug>/`
(z. B. `/konto`): Häuser anlegen, Manager einladen und Häusern zuordnen,
Zugangs- und Plandaten. Eigener Guard — siehe Risiko 3.

**Schritt 6 — Anlage-Wege.** `create-tenant.mjs` erzeugt künftig Konto + Hotel
+ Inhaber. `/admin/personal` schreibt in das **ausgewählte** Haus, nicht in
„das Hotel des Anlegenden". Druckseiten bauen ihre URLs aus dessen Slug.

## 9. Was sich NICHT ändert

- **Gast- und Reinigungs-Portal** bleiben wie in 6c gebaut.
- **Token-Routen** (`/guest/r/<token>`, `/service/auto/<token>`) bleiben
  mandantenfrei; gedruckte QR-Codes bleiben gültig.
- **`profiles`** bleibt für Reinigungskräfte: genau ein Haus.
- **Slug bleibt global eindeutig** — er ist der URL-Schlüssel, nicht je Konto
  eindeutig. Zwei Ketten können nicht beide `krone` haben.

## 10. Risiken

1. **25 Aufrufstellen** von `getManagementContext`/`getAdminContext`. Wird eine
   übersehen, arbeitet sie auf dem falschen oder auf keinem Haus. Gegenmittel:
   Pflicht-Parameter (Schritt 3), der Compiler zeigt jede Stelle.
2. **Rollen statt Fähigkeiten.** Der Manager bekommt eine Häuser-Teilmenge, im
   Haus aber alles. Wird später „darf Zimmer, aber nicht Personal" verlangt,
   wird aus jeder Rollenprüfung eine Fähigkeitsprüfung — an 25+ Stellen, mit
   dauerhafter Pflege. Bewusst vertagt; die Zuordnungstabelle steht dem nicht
   im Weg.
3. **Der Konto-Bereich ist eine zweite Auth-Fläche** außerhalb von
   `/h/<slug>/`, mit eigenem Guard. Dort liegen Plan- und Zugangsdaten — leicht
   zu vergessen, hoher Schaden.
4. **RLS-Erweiterung ist die riskanteste Änderung**, weil 14 Policies daran
   hängen. Additiv, aber ein Fehler in `is_hotel_member` öffnet Türen in fremde
   Häuser. Separat prüfen: Testkonto mit zwei Hotels plus ein Nachbar-Konto.
5. **Unbegrenztes Anlegen + Self-Service = Missbrauchsfläche.** Slugs sind
   global und werden nach „wer zuerst kommt" vergeben; ohne Bremse kann jemand
   Namen horten. Vor 6b bedenken.
6. **Hotel-Löschung muss weich werden**, sobald Rechnungen daran hängen —
   heute kaskadiert `hotels` auf schlicht alles.
7. **Altlast Diskriminator.** `username IS NOT NULL` trägt heute zwei
   Bedeutungen: „ist Reinigungskraft" *und* „ist kein Management". Mit Owner
   und Manager darüber wird das brüchig; beim Umzug sollte `profiles` sauber zu
   „operatives Personal des Hauses" werden.
8. **Kein destruktiver Schritt nötig.** Der Umbau ist additiv, die Migration
   kann vor dem Code eingespielt werden — kein enges Deploy-Fenster.

## 11. Abnahmekriterien

1. Inhaber mit zwei Häusern sieht beide auf `/admin` und kann sie **gleichzeitig
   in zwei Tabs** offen haben, jeweils mit den Daten des richtigen Hauses.
2. Manager mit Zugriff auf Haus A und C kommt in A und C, **nicht** in B —
   obwohl alle drei demselben Konto gehören.
3. Manager kommt **nicht** in den Konto-Bereich (Plan, Rechnungsdaten, weitere
   Häuser anlegen).
4. Inhaber, der den Slug eines Hauses aus einem **fremden Konto** einträgt,
   bekommt 404 bzw. eine Abweisung.
5. Rezeptions-Zugang von Haus A kommt nicht in Haus B, auch nicht im selben
   Konto.
6. Reinigungs-RLS unverändert: eine Reinigungskraft sieht exakt das, was sie
   vorher sah (Regressionsprüfung gegen Abschnitt C des Testplans).
7. Bestandskunde mit genau einem Haus wird von `/admin` ohne sichtbare
   Zwischenseite durchgeleitet.
8. Gedruckte QR-Codes (Zimmer-Aushang, Zugangskarte) funktionieren unverändert.

## 12. Entschieden am 26.07.2026

**Service-Vorlagen.** Der Admin darf die **Vorschlagsliste** des Kontos
erweitern (heute die statische [service-templates.json](../src/lib/service-templates.json)).
Admin **und** Manager dürfen den Katalog je Haus individuell anpassen. Also
kein vererbter Zwangskatalog, sondern kuratierte Vorschläge plus freie
Anpassung im Haus — deutlich billiger als echte Vererbung und für Ketten
ausreichend. Kommt als eigener Schritt direkt nach diesem Umbau.

**E-Mail-Versand (Resend), mittelfristig.** Ziel ist, sämtliche Konten-
Einladungen auf das E-Mail-Verfahren zu verlagern: Manager- und
Rezeptions-Zugänge per Einladung statt per direkt vergebenem Passwort.
Zusätzlich als **Alternative zum Ausdruck**: Gast-Handout und
Reinigungs-Zugangskarte per Mail versendbar. Keine Eile — bis dahin legt der
Admin Zugänge wie heute mit Passwort an. Siehe Abschnitt 13.

## 13. Später eingeplant

- **Konto-weite Service-Vorschlagsliste** (siehe oben) — direkt nach 6d.
- **Kontoweite Policy-Vorgaben** mit Abweichung je Haus (Abschnitt 7).
- **Konsolidierte Auswertung** über alle Häuser (Abschnitt 7).
- **Resend-Anbindung**: Einladungs-Mails für Manager- und Rezeptions-Zugänge;
  danach Gast-Handout und Maid-Karte wahlweise drucken **oder** mailen.
- **Zimmer weich deaktivieren** — Frist: vor dem ersten echten Kunden
  (Abschnitt 6).

## 14. Weiterhin offen

1. **Zimmer-Zustände**: umgesetzt ist **ein** Zustand (`deactivated_at`). Ob
   „außer Betrieb" (Renovierung) getrennt von „abbestellt" gebraucht wird,
   bleibt offen — reine Preisentscheidung, die Messgröße ändert sich dadurch
   nicht.
2. **Pricing-Form**: zimmergenau oder Staffeln. Beeinflusst nur die
   Rechnungsseite, nicht das Datenmodell — die Messgröße bleibt dieselbe.
3. **Hotel zwischen Konten verschieben** (Betreiberwechsel) — vorerst außen
   vor, oder gleich mitdenken?
