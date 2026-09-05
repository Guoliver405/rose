# 05.09.2026 — Konto-Seite „Plan & Abrechnung", Anmeldungen in den Tests gebündelt

Dritter Abschnitt des Tages (davor: [IP-Drossel und Login-Tests](2026-09-05_Login-Tests-und-IP-Drossel.md),
[Landing, Pricing, Rechtsseiten](2026-09-05_Landing-Pricing-Rechtsseiten.md)).
Auftrag des Users auf die Frage „Was können wir heute noch erledigen?":
**Konto-Seite zuerst, dann die Test-Bündelung.**

## Inhalt

1. Konto-Seite „Plan & Abrechnung"
2. Anmeldungen in den Integrationstests gebündelt
3. Verifikation
4. Offen

## 1. Konto-Seite „Plan & Abrechnung"

Die Pricing-Entscheidung vom Nachmittag (0,50 € je Zimmer, mindestens 5 €
je Konto, Registrierungsmonat frei) stand auf der Landing Page und in den
AGB — aber nirgends dort, wo der Kunde sein eigenes Konto sieht. Der
Konto-Kasten auf `/admin` zeigte nur Zimmerzahlen und den Plan-Schlüssel
`trial`.

**Neu: `/admin/abrechnung`**, nur für den Kontoinhaber (Manager landen auf
`/admin`). Struktur nach dem TODO-Eintrag — Zahlungsplan, Zahlungsverfahren,
Modalitäten und Intervall, Rechnungen, Upgrades:

- **Hinweiskasten oben:** „Aktuell wird nichts berechnet." Rechnungsstellung
  und Zahlungsverfahren existieren nicht; die Seite zeigt, was das Konto
  kosten **würde**, und sagt zu, dass vor der ersten Berechnung in Textform
  informiert wird (deckungsgleich mit § 6 Abs. 4 AGB).
- **Ihr Plan:** Preis, Mindestbetrag, „bis 10 Zimmer ein Festpreis", keine
  Pakete, nichts zum Hochstufen (das ist der „Upgrades"-Punkt: es gibt keine),
  Registrierungsdatum und der freie Monat.
- **Laufender Monat:** Tabelle je Haus mit abrechenbaren Zimmern, Summe,
  voraussichtlicher Betrag, im freien Monat „frei" plus „statt …".
- **Abgeschlossene Monate:** bis zu zwölf, mit Zimmerzahl, Betrag und
  Status-Pillen „frei" / „festgeschrieben" / „nicht berechnet".
- **Zahlungsverfahren** und **Rechnungen:** Platzhalter-Karten ohne tote
  Knöpfe — sie sagen, was dort erscheinen wird und wann.
- **Abrechnungsmodalitäten:** sechs Regeln (Intervall, Mindestbetrag je Konto,
  Zimmer außer Betrieb, Kündigung = Konto löschen, netto, AGB § 6/§ 7).

Drei Dinge im Code, die bleiben sollen:

1. **Die Seite rechnet nichts selbst.** `billingLine(rooms, accountCreatedAt,
   periodStart)` in [pricing.ts](../src/lib/pricing.ts) liefert je Monat
   Zimmerzahl, geschuldeten Betrag, regulären Betrag und das Frei-Flag —
   getestet. Dieselbe Funktion soll später die Rechnung stellen, damit Anzeige
   und Rechnung nie auseinanderlaufen.
2. **`AccountContext` trägt jetzt `createdAt`** (aus `accounts.created_at`),
   weil der freie Monat daran hängt. `getBillingOverview` liefert zusätzlich
   die Zimmerzahl **je Haus für den laufenden Monat** — bewusst nur dort:
   Snapshots je Haus existieren ohne Löschung gar nicht, und eine Mischung aus
   festgeschriebenen und abgeleiteten Hauszahlen in einer Zeile bräuchte mehr
   Erklärung, als sie nützt. Abgerechnet wird ohnehin die Konto-Summe.
3. **`perioden.slice(-0)` ist `slice(0)`.** Beim Umbau des Konto-Kastens auf
   `/admin` (der nur noch die Kurzfassung zeigt und deshalb null abgeschlossene
   Monate anfordert) hätte das alle Perioden geliefert; `getBillingOverview`
   fängt `monate <= 0` jetzt ausdrücklich ab.

Die Kopfzeile beider Konto-Seiten liegt in `KontoShell.tsx` — als Komponente,
nicht als Layout, weil `/admin` selbst entscheidet, ob es rendert oder auf
`/login` umleitet.

## 2. Anmeldungen in den Integrationstests gebündelt

Der TODO-Eintrag vom 03.09.: dicht aufeinander folgende Läufe reißen das
Anmelde-Limit von Supabase Auth („Request rate limit reached", Standard 30
Passwort-Anmeldungen in fünf Minuten je IP). Nachgezählt: `rls.test.ts` und
`guards.test.ts` meldeten sich je **18-mal** an, `login.test.ts` 6-mal (dort
ist die Anmeldung der Prüfgegenstand) — **42 je Lauf**, zwei Läufe kurz
nacheinander lagen sicher über dem Limit.

**Lösung:** `sessionFor(user)` in [world.ts](../tests/integration/helpers/world.ts)
meldet je Nutzer und Testdatei genau einmal an und hält die Sitzung im
Modul (Vitest isoliert Testdateien, der Cache ist also je Datei wie die Welt
selbst). `clientAs` baut den Client aus dem gehaltenen Token; `signedInStore`
legt die Sitzung per `setSession` **ohne Netzverkehr** in einen frischen
Cookie-Speicher — jeder Aufruf bekommt einen eigenen, damit die App ihn beim
Erneuern beschreiben darf, ohne dass der nächste Test das erbt. Die sechs
echten Anmeldungen in `login.test.ts` bleiben.

**Ergebnis: 16 statt 42 Anmeldungen je Lauf** (rls 6 Nutzer, guards 4,
login 6). Und fachlich die schärfere Probe: RLS-Funktionen und Guards schauen
bei jedem Zugriff in die Tabellen, nicht ins Token — die „vorher/nachher"-Tests
zum Rechte-Entzug laufen jetzt mit **demselben** Token und belegen damit, dass
auch eine bereits offene Sitzung ihre Rechte verliert. Genau das behauptete
der Kommentar im Test schon vorher; jetzt stimmt er wörtlich.

## 3. Verifikation

- `npm run verify` grün (157 Unit-Tests, drei neue für `billingLine`).
- Konto-Seite lokal im Vorschau-Browser mit einem Wegwerf-Konto
  `ZZ-Konto-Test` geprüft, das per Skript auf den 15.06. zurückdatiert wurde:
  zwölf Zimmer, zwei davon am 10.08. außer Betrieb, ein Snapshot für Juli.
  Erwartung und Anzeige deckten sich — Juni 12 Zimmer „frei, statt 6,00 €",
  Juli 12 Zimmer 6,00 € „festgeschrieben", August 12 Zimmer 6,00 € (die zwei
  deaktivierten zählen im August noch), September 10 Zimmer 5,00 €
  (Mindestbetrag). Hell und dunkel ohne Befund. Das Wegwerf-Konto wurde
  danach wie in `deletion.ts` abgeräumt (Verlauf, Snapshots, Konto,
  Anmeldekonto).
- Integrationstests **zweimal direkt hintereinander**: 53 grün, 39 s und
  38 s. Vor der Bündelung wäre der zweite Lauf am Limit gescheitert.
- Werkzeug-Notiz: Im Vorschau-Browser sind Screenshots unterhalb des ersten
  Bildschirms leer, sobald die Fläche verborgen ist (`innerHeight` 0), und
  Klicks kommen nicht an. Für den unteren Seitenteil hilft `get_page_text`,
  fürs Aufräumen ein Skript.

## 4. Offen

- Produktionsnachweis der Konto-Seite mit einem echten Inhaber-Login (der
  User meldet sich selbst an; Claude fährt dann Chrome).
- Zahlungsprovider-Gegenüberstellung (Stripe, Paddle, PayPal) — füllt die
  beiden Platzhalter-Karten.
- Weiter offen aus dem Nachmittag: Anbieter-Daten, anwaltliche Prüfung, AVV,
  Illustrationen, DEHOGA-Quelle für Annahme A2.

## 🔖 Wiederaufnahme

**Stand am Ende des 05.09.2026 (Abend):** Zwei Commits nach `c5946e0` —
Konto-Seite (`1a9f3dc`) und Test-Bündelung mit Doku (`1ac5294`). CI-Lauf
33987777361 grün, `verify` und `integration` beide erfolgreich — der
Integrationsjob lief damit erstmals mit den gebündelten Anmeldungen durch.
Vercel hat deployt: `/admin/abrechnung` antwortet in Produktion unangemeldet
mit 307 auf `/admin` (der Riegel `getAccountContext`), von dort zur
Anmeldung. **Der angemeldete Produktionsnachweis steht noch aus** — Chrome
war in dieser Sitzung nicht verbunden; er ist der erste Schritt bei der
Wiederaufnahme.

**Wenn hier weitergearbeitet wird:** Als Inhaber auf rose-roomservice.app
anmelden und `/admin` → „Plan & Abrechnung" öffnen; der Kasten oben muss
„Aktuell wird nichts berechnet" zeigen, der laufende Monat die Häuser des
Kontos. Danach ist die Zahlungsprovider-Gegenüberstellung der nächste
Baustein zur Veröffentlichung — sie entscheidet, was in die beiden
Platzhalter-Karten kommt und ob die Registrierung ein Zahlungsmittel
verlangt. Die manuellen GUI-Fälle bleiben liegen, bis der User sie aufruft.
