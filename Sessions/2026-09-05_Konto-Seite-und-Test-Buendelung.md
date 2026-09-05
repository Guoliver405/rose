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
- **Produktionsnachweis** (User angemeldet, Claude fährt Chrome): Konto
  „Test-Hotelkette" auf rose-roomservice.app. `/admin` zeigt den
  Kurz-Kasten (2 Häuser, 222 in Betrieb, 223 abrechenbar, voraussichtlich
  111,50 €) mit Knopf „Plan & Abrechnung"; `/admin/abrechnung` den
  Hinweiskasten, September je Haus (Test-Hotelkette 88, Marcus-Hotel 135,
  gesamt 223 → 111,50 €), August 216 Zimmer 108,00 € „festgeschrieben /
  nicht berechnet", Juli 81 Zimmer 0,00 € „statt 40,50 €" mit „frei" (Konto
  vom 26.07.) — alle Beträge rechnerisch geprüft. Die zwei Snapshots
  stammen aus den Zimmerlöschungen der Tester-Rückmeldung vom 03.09.
- Werkzeug-Notiz: Im Vorschau-Browser sind Screenshots unterhalb des ersten
  Bildschirms leer, sobald die Fläche verborgen ist (`innerHeight` 0), und
  Klicks kommen nicht an. Für den unteren Seitenteil hilft `get_page_text`,
  fürs Aufräumen ein Skript.

## 4. Nachtrag am späteren Abend: Anbieter-Daten und Zahlungsprovider

- **Anbieter-Daten eingetragen** (Commit `8a30622`): Das Impressum auf
  internetinformationsdienste.de war aktualisiert — I²D UG (haftungsbeschränkt),
  Geschäftsführer Bernd Köhl, Saarbrücker Straße 92, 66130 Saarbrücken,
  HRB 102734 Amtsgericht Saarbrücken, USt-IdNr. DE434570609,
  info@internetinformationsdienste.de. `provider.ts` führt jetzt
  `representative`, `registerCourt` und `register` statt `owner`; das
  Impressum trägt „Vertreten durch" und „Registereintrag", AGB § 1 nennt die
  UG mit Geschäftsführer. **Keine Telefonnummer** — nach § 5 DDG nicht
  zwingend (EuGH C-298/07), `phone` ist `null` und die Zeile entfällt auf
  allen drei Seiten. Der gelbe Platzhalter-Hinweis ist damit aus Produktion
  verschwunden.
- **Zahlungsprovider-Gegenüberstellung** als Entscheidungsvorlage:
  [Zahlungsprovider-Gegenueberstellung-2026-09-05.md](Zahlungsprovider-Gegenueberstellung-2026-09-05.md).
  Kern: Rechnung und Einzug sind zwei Dinge — die Rechnung erzeugt RoSe
  ohnehin selbst (Betrag aus `billingLine`, E-Rechnungspflicht ab 2028),
  der Provider braucht nur „Zahlungsmittel ohne Belastung speichern, später
  mit beliebigem Betrag belasten, per Webhook melden". Bei 5–120 € brutto
  je Monat ist SEPA-Lastschrift mit 0,35 € Festgebühr die einzige Form, die
  nicht mit dem Umsatz skaliert. **Empfehlung Stripe**, Mollie als
  EU-Zweitwahl; Paddle und PayPal-als-einziger-Weg begründet verworfen.
  Die PayPal-Annahme aus dem TODO vom 04.09. („Haftung vollständig beim
  Provider") trifft nicht zu, das leistet nur ein Merchant of Record.

## 5. Offen

- ~~Produktionsnachweis der Konto-Seite mit einem echten Inhaber-Login~~ —
  erbracht (siehe Verifikation).
- Entscheidung Zahlungsprovider (Vorlage liegt vor, vier Fragen in deren
  Abschnitt 6), danach Einbindung nach dem Bauplan.
- Weiter offen aus dem Nachmittag: Anbieter-Daten, anwaltliche Prüfung, AVV,
  Illustrationen, DEHOGA-Quelle für Annahme A2.

## 🔖 Wiederaufnahme

**Stand am Ende des 05.09.2026 (Abend):** Zwei Commits nach `c5946e0` —
Konto-Seite (`1a9f3dc`) und Test-Bündelung mit Doku (`1ac5294`). CI-Lauf
33987777361 grün, `verify` und `integration` beide erfolgreich — der
Integrationsjob lief damit erstmals mit den gebündelten Anmeldungen durch.
Vercel hat deployt: `/admin/abrechnung` antwortet in Produktion unangemeldet
mit 307 auf `/admin` (der Riegel `getAccountContext`), von dort zur
Anmeldung. Angemeldeter Produktionsnachweis mit dem Konto „Test-Hotelkette"
erbracht, Beträge rechnerisch geprüft.

**Wenn hier weitergearbeitet wird:** Die vier Fragen aus Abschnitt 6 der
Zahlungsprovider-Vorlage mit dem User klären (Zahlungsmittel bei
Registrierung Pflicht? Karte zulassen? EU-Ausland? Stripe oder Mollie?),
dann nach dem Bauplan in Abschnitt 5 anfangen — Schritt 1 (Stripe-Konto,
Gläubiger-ID) kann nur der User. Die manuellen GUI-Fälle bleiben liegen,
bis der User sie aufruft.
