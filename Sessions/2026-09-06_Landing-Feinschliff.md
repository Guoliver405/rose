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

## „Frühestens ab" und die Zeitzone des Hauses

**Auftrag:** „Frühestens ab" im Gastportal bauen, mit einer Policy, bis wann
Gäste aufschieben dürfen (Vorschlag: Standard 11:00; wer bis 15:00 reinigt,
setzt etwa 13:00), Hinweis auf die Grenze im Portal — und die Frage, ob wir
bei dieser Gelegenheit Zeitzonen-Einstellungen brauchen.

**Zeitzone: ja, und nicht nur als Komfort.** Beim Lesen der Zeitregeln fiel
auf, dass *alle* in Server-Zeit rechneten (`getHours()`, `new Date(y, m, d)`)
— und die Server laufen in UTC. In Produktion war eine Routine „ab 10:00"
um 12:00 Ortszeit fällig, das Reinigungs-Zeitfenster, „heute gereinigt", der
Abreisetag und die Tagesgrenzen der Auswertung lagen um ein bis zwei Stunden
daneben. Neu: [tz.ts](../src/lib/tz.ts) (elf Tests, inkl. Sommerzeit-Wechsel)
und `policies.timeZone` (IANA, Default Europe/Berlin, Auswahl unter Hotel &
Regeln). Alle Regeln nehmen die Zeitzone entgegen; die Board-Tests bauen
Zeitpunkte über `zonedInstant('Europe/Berlin', …)`, damit sie auf dem
Berliner Rechner und in der UTC-CI dasselbe prüfen. `worklog.ts` bleibt
server-lokal (nur noch von seinen Tests benutzt).

**„Frühestens ab":** `room_states.clean_not_before` (Migration
`2026-09-06_room_states_clean_not_before.sql`), gesetzt über
`setGuestSignalAction(signal, notBefore)` mit Prüfung gegen die Haus-Grenze
in Ortszeit. Policy `cleanDeferEnabled` (Default an) / `cleanDeferUntil`
(Default 11:00) unter Hotel & Regeln, mit dem Hinweis „Housekeeping bis
15:00 ⇒ 13:00". Im Gastportal: Chips „jetzt | 09:00 | 10:00 | 11:00" (volle
Stunden zwischen jetzt und Grenze, `cleanDeferOptions`), darunter der Satz
„Du kannst die Reinigung bis spätestens 11:00 Uhr aufschieben — vorher kommt
niemand. Diese Grenze legt das Haus fest …"; nach der Grenze „Heute nur noch
sofort möglich". Boards: bis zur Uhrzeit nicht aktiv, „Reinigung ab HH:MM"
mit Uhr-Icon in Grau, kein Score; `startCleaningAction` weist einen Claim
vorher ab („Der Gast möchte die Reinigung erst ab …"). Die Routine setzt bei
jedem Gast-Signal aus. Handout nennt die Grenze. Reinigungsboard hat jetzt
den 60-s-Poll, weil der Zustand zur Uhrzeit ohne DB-Ereignis kippt.

Verify grün: 191 Tests (tz 11, board +7, guest-guide +1).

**Verifikation lokal** (Dev-Server gegen die Produktions-DB, Wegwerf-Konto
`ZZ-Defer-Test`, danach abgeräumt), nach Einspielen der Migration durch den
User: Einstellungen zeigen „Gäste dürfen aufschieben" (an, 11:00) und die
Zeitzonen-Auswahl (418 Zonen, Europe/Berlin), Speichern mit 13:00 grün.
Gast-Login mit Zimmer + PIN, Portal zeigt Chips „jetzt | 02:00 … 13:00" (es
war 01:xx) und den Satz mit der 13:00-Grenze; „10:00" gewählt und getippt →
„Wunsch ist aktiv — frühestens ab 10:00 Uhr", DB `clean_not_before =
08:00Z` (= 10:00 Berlin). Übersicht: Kachel „Belegt · Gast wünscht Reinigung
ab 10:00", Balken belegt-blau statt amber, Uhr-Icon. **Befund dabei:** der
KPI „zu reinigen" zählte den aufgeschobenen Wunsch mit — behoben, jetzt
„0 zu reinigen".

**Produktion** (Commits `0d80c6a`, `148f94d`, `5445548`; User in Chrome
angemeldet): Hotel & Regeln der Test-Hotelkette zeigt „Gäste dürfen
aufschieben" (an, 11:00), „Check-out bis 11:00" und die Zeitzonen-Auswahl
(418 Zonen, Europe/Berlin). Speichern mit 13:00 → „Gespeichert", danach auf
11:00 zurückgesetzt und nach Reload bestätigt. Werkzeug-Notiz: Ein
`requestSubmit()` vier Sekunden nach dem Navigieren traf die Seite vor der
Hydration und lief als nativer Submit (Reload ohne Hinweis); mit acht
Sekunden Wartezeit greift der React-Handler.

## Nachfrage-Auswertung statt Wunschzeiten

**Frage des Users:** Sollen Gäste im Portal eine Wunsch-Reinigungszeit
angeben, um Schichten des Housekeepings planen zu können?

**Antwort:** Nicht als Termin — ein Gast, der „14:00" eintippt, erwartet
einen Termin, den ein gemeinsames Board ohne Zuweisung nicht halten kann,
und Schichten enden meist am frühen Nachmittag. Die Planungsdaten gibt es
aber längst: der Zeitpunkt jedes Gast-Tipps im Verlauf, jeder Check-out,
jede Schicht. Gebaut wurde deshalb der **Abschnitt „Nachfrage"** oben auf
der Auswertung ([demand.ts](../src/lib/demand.ts), I/O-frei, neun Tests;
[DemandSection.tsx](../src/app/h/[slug]/admin/auswertung/DemandSection.tsx)):

- Stunden-Profil 0–23 Uhr mit drei Balken je Stunde (Wünsche amber, Abreisen
  orange, Nicht stören rosé) und darunter ein grüner Streifen „Ø Kräfte im
  Dienst" (Deckkraft = Anteil am Maximum). Marker „Check-out" und „Routine"
  an der Stundenachse.
- Kennzahlen: Wünsche, Abreisen, Spitzenstunde, **„Wünsche ohne Kraft im
  Dienst"** — der Anteil, der in Stunden ohne eine einzige Schicht fiel; ab
  20 % amber. Das ist der Planungshinweis, um den es ging.
- Wochentags-Tabelle für Wünsche, Abreisen, Nicht stören.
- Zeitraum wie der Rest der Seite über `from`/`to`.

Zeitzone: Stunden entstehen mit `Intl` in `Europe/Berlin`, nicht in
Server-Zeit (Vercel: UTC). Der übrige Teil der Auswertung rechnet weiter in
Server-Zeit — bekannte Unschärfe, in AGENTS.md festgehalten.

**Produktionsnachweis** (Commit `3925689`, CI grün, User in Chrome
angemeldet): Marcus-Hotel, 01.08.–06.09.: Abschnitt oben auf der Auswertung
mit Kennzahlen (1 Wunsch, 4 Abreisen, Spitzenstunde 23–24 Uhr, 0 % ohne
Kraft), Stunden-Profil mit Check-out-Marker bei 11 Uhr, grünem
Kräfte-Streifen und Wochentags-Tabelle. Die Zahlen sind klein, weil das
Test-Szenario Signale als Rezeption setzt (`source = 'admin'`), nicht als
Gast — echte Gast-Tipps zählen, Szenario-Tipps nicht; das ist gewollt.

Als späterer Mittelweg bleibt „frühestens ab" im Gastportal (drei feste
Chips, eine Einschränkung statt eines Termins) — nur, wenn Häuser danach
fragen. Feste Wunschzeiten nicht.

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

## Vertragsprüfung: Entwurf „Lizenz-, Nutzungs- und Vermarktungsvertrag"

Bernd hat einen Vertragsentwurf vorgelegt (`Verträge/RoSe
entwurf-Lizenzvertrag.docx`, nicht im Repo). Die Prüfung liegt daneben als
`Verträge/Pruefung-Lizenzvertrag-2026-09-06.md` — ebenfalls nicht im Repo,
weil der Ordner Vertragsunterlagen enthält und das Repo auf GitHub liegt
(`Verträge/` steht seit heute in `.gitignore`). Keine Rechtsberatung, sondern
eine kritische Lektüre aus Olivers Sicht als Urheber. Die drei stillen
Entscheidungen des Entwurfs, die vor allem anderen zu klären sind:

1. **Bernd wird hälftiger Rechteinhaber** (Präambel, § 1, § 15 50/50, § 28),
   ohne dass irgendwo steht, wer RoSe gebaut hat. Zwei gemeinsam verwertende
   Rechteinhaber sind zudem eine GbR mit persönlicher Haftung — Innenverhältnis
   ungeregelt.
2. **Kündigung und Zustimmungen nur gemeinschaftlich** — Oliver kann den
   Vertrag mit Bernds UG nie ohne Bernd beenden.
3. **Bernd auf beiden Seiten** (Lizenzgeber privat, Geschäftsführer der
   Lizenznehmerin): § 181 BGB, Befreiung im Registerauszug prüfen.

Dazu: 60 % Lizenz auf den Nettoerlös trägt die UG bei 0,50 € je Zimmer nicht
(100 Zimmer ⇒ 20 € für die UG bei ≈ 45 € Hosting); 14-Tage-Kündigung ohne
Pflicht-Auslauf kollidiert mit den AGB gegenüber den Hotels; der Betrieb
(Konten, Entwicklung, Auftragsverarbeitung, Oliver als
Unterauftragsverarbeiter) ist gar nicht geregelt; USt/Gutschriftverfahren,
vGA, § 69b UrhG (Arbeitsverhältnis) offen. Reihenfolge zur Klärung in
Abschnitt 7 der Prüfung.

**Werkzeug-Notiz:** Die Polling-Schleifen gegen die GitHub-API (60 Anfragen
pro Stunde ohne Token) haben am Abend das Limit gerissen — der letzte
CI-Stand, den ich sah, war grün für alle Code-Commits; der Lauf zu `03b9da9`
(nur Protokoll) blieb ungeprüft. Künftig seltener pollen oder `gh` mit Token.

## Vertragsgespräch (06.09., Vormittag/Mittag)

Wiederaufnahme wie vorgemerkt: die drei stillen Entscheidungen des Entwurfs
durchgesprochen. **Hintergrund des Users** dreht die Lesart der Prüfung:
Idee gemeinsam, Freunde, 50/50 gewollt; die I²D UG ist bewusst ein
bewegliches Vehikel (die Software soll nicht der Firma zugeschrieben
werden, Lizenz später ggf. an eine Auslandsgesellschaft); Hobby, keine
weitere Gesellschaft, alles in einem Vertrag; § 181-Befreiung liegt laut
Bernd vor. Damit fallen Mitinhaberschaft, schwache UG und gemeinschaftliche
Kündigung als Befunde weg. **Neu dafür:** 60 % Lizenz hälftig ergibt keine
50/50 — die übrigen 40 % bleiben in Bernds UG. Vier Entscheidungen:

1. Innenverhältnis als Abschnitt im Lizenzvertrag (Innengesellschaft,
   ausdrückliche Einräumung der Hälfte, Anwachsung mit 24-Monats-Earn-out
   bei Ausstieg und Tod). Sorge des Users, § 1 Abs. 1 könne wie
   Besserstellung wirken, mit der Begründung im Vertragstext selbst
   beantwortet: Ohne die Einräumung hätte Bernd rechtlich nichts, Ideen und
   Tests begründen kein Urheberrecht.
2. § 181: Registerauszug als Anlage, sonst nichts.
3. § 15 → Kette „Nettoerlöse − Betriebskosten − Pauschale, Rest hälftig",
   Verlustvortrag, getrennte Gutschriften, USt-Regel.
4. **AGB § 12 Abs. 3 Vertragsübergang** sofort umgesetzt und in Produktion
   (Commit `39fd86c`): Übertragung auf Rechtsnachfolger, sechs Wochen
   Ankündigung, Sonderkündigungsrecht, AVV geht mit — nötig, bevor der
   erste Kunde unterschreibt, sonst braucht ein Lizenzwechsel die
   Zustimmung jedes Hotels.

Ergebnis: **Entwurf 2** als Word-Datei in `Verträge/` (nicht im Repo),
17 Seiten, Deckblatt mit Änderungsübersicht und 12 offenen Punkten, gelbe
`[OFFEN: …]`-Marken, neuer § 15 Betrieb/Konten/Datenschutz (Oliver hält
alle Konten treuhänderisch, ist Unterauftragsverarbeiter der UG), vier
Anlagen (Softwarestand, Konten-Tabelle, Registerauszug, AVV). Dazu in
`Verträge/`: Gesprächsstand, Formulierungsvorschläge, Build-Skript.
Werkzeug-Notiz: kein LibreOffice/pdftoppm auf dem Rechner — Sichtprüfung
über Word-COM (PDF-Export) plus WinRT `Windows.Data.Pdf` (PNG je Seite) aus
PowerShell; der Schema-Validator stolpert über `w:highlightCs` von docx-js,
das Build-Skript entfernt es beim Packen.

## 🔖 Wiederaufnahme

**Vertrag:** Entwurf 2 liegt in `Verträge/` und ist an den User gegangen;
nächster Schritt ist Bernds Rückmeldung zu den 12 offenen Punkten auf dem
Deckblatt (Pauschale, Abrechnungsrhythmus, Konten-Übergabe, Wortmarke,
Registerauszug, AVV, Steuerberater, Anwalt). Änderungen am Entwurf über
`Verträge/build-entwurf-2.js`, nicht in Word.

Sechs Dinge an diesem Tag: Landing-Texte, Abreisetag-Logik der Routine,
Nachfrage-Auswertung, Zeitzone des Hauses, „Frühestens ab",
Vertragsprüfung. Offen bleibt aus dem Vortag: Antwort von Bernd (Stripe-Konto, Wortmarke),
anwaltliche Prüfung, AVV, Illustrationen. Nächster Baustein: Stripe nach dem
Bauplan in der Zahlungsprovider-Vorlage, sobald das Konto steht.
