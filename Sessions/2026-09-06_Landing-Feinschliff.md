# 06.09.2026 — Landing-Feinschliff und Abreisetag-Logik der Stayover-Routine

Zwei Abschnitte: Textänderungen auf `/` aus einer Durchsicht des Users, und
danach ein fachliches Problem, das der User beim Nachhaltigkeits-Argument
erkannt hat — die Routine-Reinigung am Abreisetag. Vorheriger Stand:
[2026-09-05_Konto-Seite-und-Test-Buendelung.md](2026-09-05_Konto-Seite-und-Test-Buendelung.md).

## Abreisetag: keine Routine-Reinigung vor dem Check-out

**Problem (User):** Der Standard soll „Reinigung nur auf Wunsch" sein — ist
er (`stayoverAutoClean` Default aus). Wer die Stayover-Routine einschaltet,
bekam aber ein Loch: Am Abreisetag darf nicht gereinigt werden, bevor der
Gast ausgecheckt hat, sonst wird das Zimmer zweimal gemacht — und die Routine
war um 10:00 fällig, Check-out meist bis 11:00. Ursache darunter: RoSe kennt
bewusst kein Buchungssystem und damit **kein Abreisedatum**.

**Lösung, beide Wege zusammen:**

1. **Check-out-Frist als Untergrenze.** Neue Policy `checkoutUntil` (Default
   11:00, Feld „Check-out bis" unter Hotel & Regeln). `stayoverDueTime` nimmt
   das Spätere aus Routine-Zeit und Frist; `isStayoverDue` rechnet damit. Wer
   nach der Frist noch im Zimmer ist, bleibt per Definition. Handout und Mail
   nennen jetzt diese effektive Uhrzeit plus „am Abreisetag nach dem
   Check-out" (Test in `guest-guide.test.ts` angepasst: 9:30 mit Default-Frist
   ergibt 11:00).
2. **Optionales Abreisedatum am Aufenthalt.** `stays.expected_checkout date`
   (Migration `2026-09-06_stays_expected_checkout.sql`). Beim Check-in wählt
   die Rezeption „offen | 1 Nacht | 2 Nächte | 3 Nächte | Datum"; a) und b)
   sind zwei Eingabeformen für denselben Wert, gespeichert wird nur das Datum.
   **„offen" ist die Vorgabe**, damit der Check-in ein Klick bleibt — das ist
   zugleich die Antwort auf den Randfall c): kein Datum heißt Rückfall auf
   Weg 1, keine Markierung, und die Rezeption trägt das Datum nach, sobald es
   bekannt ist (`setExpectedCheckoutAction`, derselbe Block im Zimmer-Dialog
   dient der Verlängerung). Am Abreisetag setzt die Routine ganz aus; Kachel
   und Reinigungsboard zeigen „Abreise heute" mit Koffer-Icon in neutralem
   Grau — bewusst keine neue Farbe in der Farbsprache. Ein überfälliges Datum
   (gestern) gilt als unbekannt, damit ein vergessenes Nachziehen die Routine
   nicht dauerhaft abschaltet.

Richtung bei allem: **im Zweifel nicht reinigen.** Das passt zum
Nachhaltigkeits-Versprechen der Landing Page und kostet schlimmstenfalls
einen Tipp des Gastes im Portal.

Betroffene Stellen: `board.ts` (Policy, `stayoverDueTime`, `localDateKey`,
`dateKeyAfterNights`, `isDepartureToday`, `isStayoverDue`), beide
Board-Loader und der Claim in `service/actions.ts`, `checkInAction` mit
viertem Parameter, `RoomGrid` (Chooser, Status-Zeile, Icon),
`ServiceBoard` (Label, Icon), Einstellungen (Feld, Action, Seite),
`guest-guide.ts`. Neun neue Unit-Tests.

**Reihenfolge fürs Ausrollen:** Migration ist additiv (nullable), aber die
Loader selektieren die Spalte — also erst einspielen, dann pushen. So
geschehen: User hat die Migration eingespielt, danach Push.

**Verifikation lokal** (Dev-Server gegen die Produktions-DB, Wegwerf-Konto
`ZZ-Abreise-Test`, danach abgeräumt): Check-in mit „2 Nächte" ergibt
„Abreise am Di., 08.09." und `expected_checkout = 2026-09-08` in der DB;
Umstellen auf „1 Nacht" und Speichern ergibt 07.09.; Datum = heute ergibt
„Abreise heute" mit Koffer-Icon auf der Kachel. Routine ab 00:10 mit
Check-out-Frist 00:10, beide Check-ins auf gestern zurückdatiert: 101 (Abreise
heute) **ohne** Routine, 102 (ohne Datum) „Routine-Reinigung fällig". Das
Handout nennt „täglich ab 00:10 Uhr … am Abreisetag nach dem Check-out".
Werkzeug-Notiz: Im verborgenen Vorschau-Fenster kamen Tastatur und Klicks
nicht an; Login und Dialoge liefen über `javascript_tool` mit dem nativen
Value-Setter plus `input`-Event und `requestSubmit()`.

## Landing-Feinschliff — was sich geändert hat

Texte in [page.tsx](../src/app/page.tsx):

- Hero: „Reinigung steuern und Services anbieten — digital und effizient";
  Unterzeile „RoSe verbindet alle Bereiche in Echtzeit — in einem intuitiven
  System, ohne Schulung, Datenprobleme oder PMS-Projekt"; Knopf „Produkt
  Demo"; „in wenigen Minuten eingerichtet" (auch in der FAQ, vorher „unter
  einer Stunde").
- Portale: „Drei Portale, drei Benutzertypen, ein Zusammenwirken"; „vom
  Wäscheservice bis zum Frühstück aufs Zimmer"; „Dringende blinken rot" und
  „Dringendes blinkt rot" groß, weil substantiviert.
- Ablauf, Schritt 5: „Gezielt und gesteuert — Priorisiert und zuvorkommend,
  automatisch am Bedarf ausgerichtet und in Abstimmung der Mitarbeitenden"
  (der User schrieb „Gesteuert" groß; nach dem Bindestrich-Titel ist es ein
  Adjektiv, deshalb klein). Der Titel des fünften Demo-Schritts zieht mit.
- Features: „QR-Codes je nach Bedarf" (je Zimmer mit PIN oder je Aufenthalt,
  ein Klick), DND „lässt das Zimmer fürs Housekeeping verschwinden",
  Service-Baukasten „mit Optionen, Preisen und Priorisierung anlegen — Gäste
  bestellen digital und ohne Verzögerung", und die Kachel „Vergessenes
  verfällt nicht" (Stale-Timeout) ist durch **„Nachhaltig auf Wunsch"**
  ersetzt — der Stale-Timeout bleibt ein Feature, nur nicht mehr auf der
  Landing Page.

**Neuer Abschnitt „Nachhaltigkeit"** zwischen den Schmerzpunkten und der
Produktvorschau: grüner Kasten mit runder Plakette „Reinigung auf Wunsch",
Pille „Nachhaltig gastgeben", Überschrift „Reinigung nur, wenn der Gast sie
möchte", drei Karten (Wasser und Waschmittel · Energie und Wege · Gäste
entscheiden selbst). Bewusst **kein** Kostenargument — das übernimmt der
Nutzenrechner unten; hier geht es um Wasser und das Nachhaltigkeits-Image
des Hauses. Die einzige Zahl (70 % der Gäste brauchen keine tägliche
Reinigung) ist Quelle Q1 des Rechners (AHLA 2022). Der Schlusssatz stellt
klar, dass die Stayover-Routine als Option bleibt.

Demo in [LiveDemo.tsx](../src/components/landing/LiveDemo.tsx):

- Freier Modus: „Tipp im Gäste-Portal, Klick an der Rezeption, Wisch auf dem
  Board." — der Nachsatz „alles wirkt sofort auf die anderen beiden" ist weg,
  weil die Szene eine Demo ist und nicht so tun soll, als bediene man das
  echte System.
- Das Gäste-Handy hat jetzt dieselbe Kopfleiste wie Rezeption und Board
  („Gäste-Portal — Handy"), damit die Demo-Nutzer wissen, was sie sehen.
- Die Ereigniszeile unter der Szene („Check-in Zimmer 202: Aufenthalt
  angelegt, PIN 4827.") ist entfallen; `lastEvent` bleibt im Modell.

## Verifikation

`npm run verify` grün (157). Im Vorschau-Browser: Hero, Nachhaltigkeits-
Kasten (hell und dunkel) und die Kopfleiste am Gäste-Handy geprüft.
**Produktion** (Commit `19f42a2`, User in Chrome angemeldet, Claude fährt):
rose-roomservice.app zeigt alle geänderten Texte, den Nachhaltigkeits-Kasten
mit Plakette zwischen Schmerzpunkten und Demo, die Demo mit drei Kopfleisten
und ohne Ereigniszeile; Seitentext vollständig gegen die Liste abgeglichen.

## 🔖 Wiederaufnahme

Landing-Texte nach der Durchsicht des Users; nichts Fachliches geändert.
Offen bleibt aus dem Vortag: Antwort von Bernd (Stripe-Konto, Wortmarke),
anwaltliche Prüfung, AVV, Illustrationen. Nächster Baustein: Stripe nach dem
Bauplan in der Zahlungsprovider-Vorlage, sobald das Konto steht.
