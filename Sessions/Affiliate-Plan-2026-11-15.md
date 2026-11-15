# Bauplan: Partnerprogramm, erster Bauabschnitt (15.11.2026)

Grundlage sind die [Notizen vom 26.10.2026](Affiliate-Notizen-2026-10-26.md):
20 % dauerhaft auf den bezahlten Nettobetrag, Zuordnung ohne Cookie,
Provisionsbuch in RoSe. **Stand: Plan, nichts gebaut.**

Der erste Abschnitt baut alles, was an keiner offenen Frage hängt:
**Zuordnung**, **Provisionsbuch** und **Partnerbereich mit Link und Zahlen**.
Ausgezahlt wird noch nichts – das Buch sammelt aber vom ersten Tag an richtig,
sodass die Auszahlung später nur noch liest.

---

## 0. Abgrenzung

| Im ersten Abschnitt | Später |
|---|---|
| Partner werden (Bedingungen annehmen), Code und Link | Auszahlung, auch als Guthaben |
| Zuordnung bei Registrierung und Umwandlung | Flyer aus den Druckblättern |
| Provision je bezahlter Rechnung, Rücknahme bei Erstattung | Teilbares Simulator-Szenario mit Partner-Link |
| Partnerbereich: Link, QR-Code, Zahlen | Hinweis auf das Programm im Reinigungsboard |
| Freischaltung: Partner-Code öffnet die Registrierung | Freischalten über `/support` statt per SQL |
| Löschung, Tests, Texte in vier Sprachen | Abgleich des Zahlungsmittels, Bonus, Staffel |

**Schalter:** `AFFILIATE_ENABLED=1`. Ohne die Variable gibt es weder
Partnerbereich noch das Feld „Empfohlen von“ – das Programm geht erst auf,
wenn die Partnerbedingungen geprüft sind. Das Muster ist `stripeReady()`.

## 1. Datenmodell – Migration `2026-11-15_affiliate.sql`

Rein additiv, also zuerst einspielen, dann pushen.

**`affiliates`** – eine Zeile je Partner.

| Spalte | Bedeutung |
|---|---|
| `id` uuid PK | Kennung im Buch und an den Konten |
| `user_id` uuid unique, FK `auth.users`, Kaskade | der Partner ist ein Anmeldekonto |
| `code` text unique | 8 Zeichen, ohne verwechselbare Zeichen (kein 0/O, 1/I/l) |
| `rate_bps` int, Vorgabe 2000 | Satz; je Partner abweichend setzbar (per SQL) |
| `terms_version`, `accepted_at` | welchen Bedingungen zugestimmt wurde (Muster `marketing_text_version`) |
| `approved_at` timestamptz, nullable | **Freischaltung** durch uns (per SQL, später über `/support`). Nur ein freigeschalteter Code öffnet die geschlossene Registrierung |
| `created_at` | |

RLS: SELECT nur die eigene Zeile, Schreiben nur über den Admin-Client.

**`accounts.referred_by`** uuid, FK `affiliates(id)` `on delete set null`, dazu
`referred_at`. Wird **nur beim Anlegen** gesetzt und danach nie geändert
(Korrekturen per SQL durch uns).

**`sim_accounts.referred_by`** uuid, ohne FK. Zwischen Simulator-Registrierung
und Umwandlung liegen Tage; die URL ist dann längst weg.

**`invoices.affiliate_id`** uuid, ohne FK. **Der Partner wird an der Rechnung
eingefroren**, wenn die Spiegel-Zeile entsteht. Grund: Die Schlussrechnung wird
bezahlt, nachdem das Konto gelöscht ist – `accounts.referred_by` gibt es dann
nicht mehr, und die Provision ginge verloren.

**`affiliate_commissions`** – das Provisionsbuch. **Ohne Fremdschlüssel** wie
`invoices`: ein Beleg, den die Löschung mitnimmt, ist keiner.

| Spalte | Bedeutung |
|---|---|
| `id` uuid PK | |
| `affiliate_id`, `account_id`, `invoice_id` | Bezug, nackte UUIDs |
| `kind` | `commission` oder `reversal` (später `payout`) |
| `source` text **unique** | Schlüssel des Auslösers: `in_…:paid`, `re_…`, `dp_…` – macht jede Buchung idempotent |
| `period_start` date | Leistungsmonat der Rechnung |
| `base_cents`, `rate_bps`, `amount_cents` | Netto, eingefrorener Satz, Provision (bei `reversal` negativ) |
| `available_at` timestamptz | Ende der Haltefrist |
| `created_at` | |

**Buchungen statt Status:** Eine Rücknahme ist eine eigene, negative Zeile.
Ein Statusfeld könnte eine Erstattung nach der Auszahlung nicht ausdrücken und
eine Teilerstattung auch nicht. Der Stand eines Partners ist immer die Summe.

RLS: SELECT, wenn `affiliate_id` zum eigenen `affiliates`-Eintrag gehört.

## 2. Rechenlogik – `src/lib/affiliate.ts` (I/O-frei, getestet)

- `commissionCents(netCents, rateBps)` – kaufmännisch gerundet. Mindestbetrag
  5 € ⇒ 1 €, Freimonat 0 € ⇒ keine Buchung.
- `newPartnerCode()` und `normalizePartnerCode()` (Leerzeichen, Groß-/Kleinschreibung).
- `HOLD_DAYS = 60` – SEPA-Rückgaben sind bis acht Wochen möglich.
- `summarize(rows, now)` – vorgemerkt (in der Haltefrist), verfügbar,
  zurückgenommen, je Monat. Dieselbe Funktion rechnet später die Auszahlung,
  damit Anzeige und Auszahlung nie auseinanderlaufen (Muster `billingLine`).
- `isSelfReferral(...)` – siehe Abschnitt 6.

## 3. Zuordnung – ohne Cookie

Der Code reist **in der URL**, bis er in der Datenbank steht.

1. **Landing Page:** `/?ref=CODE` – die Seite liest den Parameter serverseitig
   und hängt ihn an ihre eigenen Links nach `/registrieren` und `/simulator`.
   Kein Cookie, kein `localStorage`.
2. **`/registrieren?ref=CODE`:** füllt das Feld **„Empfohlen von“** vor. Das
   Feld ist sichtbar und von Hand ausfüllbar (Code vom Flyer). Es zählt, was
   beim Absenden drinsteht. Ein unbekannter Code ist ein Formularfehler, damit
   ein Tippfehler nicht still die Zuordnung kostet; leer ist erlaubt.
3. **`createHotelAccount({ …, referredBy })`** schreibt `accounts.referred_by`
   – die eine Stelle für Registrierung und Umwandlung.
4. **`/simulator/registrieren?ref=CODE`:** `registerSimAccount` legt den
   Partner in `sim_accounts.referred_by` ab, `convertSimAccount` reicht ihn an
   `createHotelAccount` weiter.

**Einladungscode:** `checkInviteCode` bekommt den Partner-Code dazu. Ist die
Registrierung geschlossen, genügt der Einladungscode **oder** der Code eines
freigeschalteten Partners (`approved_at` gesetzt); das Feld für den
Einladungscode ist dann nicht mehr Pflicht. Der Code eines nicht
freigeschalteten Partners ordnet zu, öffnet aber nichts. Dasselbe gilt für die
Umwandlung aus dem Simulator. Die Prüfung sitzt an der einen Stelle, die beide
Wege schon benutzen.

„Haus anlegen“ in einem bestehenden Konto ändert nichts: Die Zuordnung hängt
am Konto, weitere Häuser zählen von selbst mit.

## 4. Provisionsbuch

Eine Funktion **`recordCommissionForInvoice(invoiceId)`** in
`src/utils/affiliate.ts`, aufgerufen an zwei Stellen:

- im Stripe-Webhook bei `invoice.paid`,
- in `reconcileOpenInvoices`, wenn der Abgleich eine Rechnung auf `paid` setzt
  (Netz für verpasste Webhooks, wie beim Rechnungsstatus selbst).

Sie liest `invoices.affiliate_id`, rechnet 20 % vom **Nettobetrag der
bezahlten Rechnung** und schreibt eine Zeile mit `source = '<Stripe-ID>:paid'`.
Der Unique-Schlüssel macht den zweiten Aufruf zum No-op.

`ensureInvoiceForPeriod` friert beim Anlegen der Spiegel-Zeile
`affiliate_id` aus `accounts.referred_by` ein – damit gilt es für Monatslauf
und Schlussrechnung zugleich.

**Rücknahme:** neue Webhook-Ereignisse `charge.refunded`,
`charge.dispute.funds_withdrawn` und `charge.dispute.funds_reinstated`. Jedes
schreibt eine `reversal`-Zeile, anteilig zum erstatteten Betrag (bei
`funds_reinstated` mit umgekehrtem Vorzeichen). Der Endpunkt in der
I²D-Sandbox bekommt die drei Ereignisse per API dazu.

> **Beim Bauen nachmessen:** der Weg von der Zahlung zur Rechnung. In der
> verwendeten Stripe-API-Version hängt die Rechnung nicht mehr direkt an der
> Zahlung; der Bezug läuft über die Zahlungen der Rechnung. Erst in der
> Sandbox mit einer echten Erstattung prüfen, dann festschreiben.

Das Gateway bleibt hinter `InvoiceGateway`, damit der Integrationstest ohne
Stripe läuft.

## 5. Partnerbereich – `/partner`

Eigene Fläche außerhalb von `/h/<slug>/` und `/admin`, weil ein Partner kein
Haus haben muss (Simulator-Konto, Creator). In den Proxy-Matcher aufnehmen, in
`robots.ts` sperren.

**Guard `getPartnerContext()`** (in `cache()` gewickelt): Sitzung in den
Default-Cookies **und** Inhaber, Manager, Rezeption oder bestätigtes
Simulator-Konto – oder ein vorhandener `affiliates`-Eintrag.

**Wer noch kein Partner ist,** sieht eine Seite mit dem Angebot in drei Sätzen
und einem Knopf „Partner werden“ samt Häkchen für die Partnerbedingungen. Erst
der Knopf legt die Zeile an.

**Wer Partner, aber noch nicht freigeschaltet ist,** sieht Link und Code
bereits, dazu den Hinweis, dass die Registrierung derzeit nur mit Einladung
offen ist und sein Link sie erst nach der Freischaltung öffnet. Die Seite sagt,
wie er sie bekommt (Nachricht an uns). Reinigungskräfte kommen über ein
Simulator-Konto hierher (Entscheidung 1).

**Wer Partner ist,** sieht:

- **Link und Code** mit Kopier-Knopf, darunter der **QR-Code** (`QrImage`,
  zum Speichern und Drucken).
- **Zahlen:** geworbene Konten (gesamt, davon mit bezahlter Rechnung), Zimmer
  im letzten abgerechneten Monat, Provision **vorgemerkt / verfügbar /
  zurückgenommen**, Liste je Monat.
- **Hinweis zur Auszahlung:** „Auszahlungen folgen. Ihre Provision wird ab
  heute gesammelt.“ Die Seite behauptet nie mehr, als es gibt.

**Keine Hausnamen.** Bei wenigen geworbenen Konten lässt sich aus den
Monatszahlen trotzdem auf ein einzelnes Haus schließen (Zimmerzahl). Das ist
nicht vermeidbar und steht in den Partnerbedingungen und im Datenschutz.

**Wege dorthin:** Karte auf `/admin` (Inhaber, Manager), Zeile unter „Mein
Zugang“ (auch Rezeption), Zeile auf `/simulator/konto`. `landingRoute` schickt
einen Nutzer ohne Haus und ohne Simulator-Konto, aber mit Partner-Eintrag,
nach `/partner`.

## 6. Missbrauch – was der erste Abschnitt abdeckt

- **Keine Selbstwerbung:** `isSelfReferral` greift zweimal. Bei der Zuordnung:
  Der Partner ist derselbe Auth-Nutzer wie der, der das Konto anlegt
  (praktisch die Umwandlung aus dem Simulator mit dem eigenen Code) – dann
  wird still nicht zugeordnet. Beim Buchen: Der Partner ist inzwischen
  Inhaber oder Mitglied des geworbenen Kontos – dann keine Provision.
- **Haltefrist** steht an jeder Buchung (`available_at`).
- **Später, mit der Auszahlung:** Abgleich des Zahlungsmittels,
  Mindestbetrag, Sperren eines Partners.

## 7. Löschen

- **Geworbenes Konto wird gelöscht:** Das Buch bleibt (kein FK). Die
  Schlussrechnung bringt noch Provision, weil der Partner an der Rechnung
  steht.
- **Partner löscht sein Anmeldekonto:** `affiliates` geht mit,
  `accounts.referred_by` wird leer, das Buch bleibt als Beleg ohne Person.
  Nicht ausgezahlte Provision verfällt – die Löschseiten nennen den Betrag
  vorher (`deleteSimAccount`, Kontolöschung).
- **Haus eines Partners wird gelöscht** (Rezeption, Manager): `nochGebraucht`
  in `deletion.ts` zählt einen Partner-Eintrag mit. Das Anmeldekonto bleibt
  und führt nach `/partner`.

## 8. Texte und Rechtliches

- Neue Sprachdatei `partner.ts` in **de, en, fr, es** (die Wächter verlangen
  gleiche Schlüssel), dazu „Empfohlen von“ in `auth` und `simulator.account`.
  Französisch durch `fr-typo.mjs`, danach Export für das Gegenlesen.
- **Partnerbedingungen** als neue Rechtsseite `/partnerbedingungen`
  (Entwurf, deutsch): Satz und Grundlage, Haltefrist, Rücknahme, keine
  Selbstwerbung, Kennzeichnung von Werbung, Verfall bei Löschung, Kündigung.
- **Datenschutz:** neuer Abschnitt Partnerprogramm (Partner-Eintrag, Zuordnung
  am Konto, was der Partner über geworbene Konten sieht).
- **AGB:** ein Satz, dass ein Konto einem Partner zugeordnet sein kann und
  dieser Kennzahlen ohne Namen sieht.

## 9. Tests

**Unit** (`affiliate.test.ts`): Rundung (5 € ⇒ 1 €, 0 € ⇒ nichts, krumme
Beträge), Code-Format und Normalisierung, `summarize` (Haltefrist,
Rücknahme vor und nach der Frist), Selbstwerbung.

**Integration** (`tests/integration/affiliate.test.ts`, gegen die Testwelt,
Fake hinter `InvoiceGateway`):

- Registrierung mit Code ordnet zu; unbekannter Code wird abgewiesen.
- Geschlossene Registrierung: der Code eines freigeschalteten Partners
  öffnet, der eines nicht freigeschalteten nicht.
- Umwandlung aus dem Simulator trägt den Partner mit.
- Eigener Code bei der Umwandlung ordnet nicht zu.
- Bezahlte Rechnung ⇒ genau eine Buchung, auch beim zweiten Lauf.
- Erstattung ⇒ negative Buchung, Summe stimmt.
- **Partner B sieht nichts von Partner A** (RLS).
- Konto gelöscht ⇒ Buch bleibt, Schlussrechnung bringt Provision.

Die Testwelt bekommt dafür einen Partner je Konto; aufgeräumt wird wie überall
nur über eingesammelte IDs.

## 10. Reihenfolge

Jeder Schritt ist für sich lauffähig und wird einzeln committet; gepusht wird
am Ende nach `verify` und Integrationstests.

1. Migration, `lib/affiliate.ts`, Unit-Tests.
2. Zuordnung: Registrierung, Simulator-Registrierung, Umwandlung, Landing-Links.
3. Provisionsbuch: Einfrieren an der Rechnung, Webhook, Abgleich, Rücknahme.
4. Partnerbereich mit Guard, Wegen und `landingRoute`.
5. Löschen, Texte in vier Sprachen, Rechtstexte als Entwurf.
6. Integrationstests, Nachweis in der Sandbox (Rechnung bezahlen, erstatten),
   Doku in AGENTS.md und Protokoll.

### Stand (15.11.2026)

- **Schritt 1–3 gebaut**, lokal committet (`2d9a772`, `4d45db8`, `aa2f0f7`),
  **nicht gepusht**. Migration `2026-11-15_affiliate.sql` ist eingespielt
  (noch nicht nach `archive/` verschoben). `AFFILIATE_ENABLED=1` steht nur in
  `.env.local`, nicht in Vercel.
- **Über den Plan hinaus:** Der Abgleich bucht bezahlte Rechnungen der letzten
  90 Tage nach, die einen Partner, aber keine Buchung haben
  (`bookMissingCommissions`) – sonst ginge eine Provision nach einem
  verpassten Webhook still verloren.
- **Weg Zahlung → Rechnung nachgemessen** (Sandbox, nur lesend):
  `invoicePayments.list({ payment: { type: 'payment_intent', … } })` führt zur
  Rechnung zurück. Geprüft an der einen bezahlten Rechnung dort (Überweisung);
  Karte und Lastschrift stehen aus.
- **Webhook-Endpunkt der I²D-Sandbox** (`we_1UFD1P3kzuRmE571rh3jVklq`) meldet
  seit 15.11. zusätzlich `charge.refunded`, `charge.dispute.funds_withdrawn`
  und `charge.dispute.funds_reinstated`. **Beim Wechsel auf das Live-Konto
  braucht der dortige Endpunkt dieselben drei Ereignisse.**
- **Offen:** Schritt 4–6. Eine echte Erstattung von Stripe bis ins Buch lässt
  sich erst nach dem Deploy prüfen (der Webhook zeigt auf Produktion).

## 11. Entschieden (User, 15.11.2026)

1. **Reinigungskräfte werden Partner über ein Simulator-Konto** mit eigener
   Adresse – kein Einstieg aus dem Reinigungsboard. Ihr Anmeldekonto dort ist
   aus dem Benutzernamen gebaut (`…@rose.local`), hängt am Haus und
   verschwindet beim Arbeitgeberwechsel; gerade dann soll die Partnerschaft
   weiterlaufen. Das Simulator-Konto gehört der Person. Im ersten Abschnitt
   geht das ohne Sonderweg; ein Hinweis mit Link auf „Mein Status“ kann später
   dazukommen.
2. **Haltefrist 60 Tage, einheitlich für alle Zahlungswege.** Deckt die
   SEPA-Rückgabe (acht Wochen) ganz ab und ist in einem Satz erklärt. Spätere
   Kartenreklamationen fängt die Gegenbuchung auf, verrechnet mit der nächsten
   Provision. Verworfen: 30 Tage (SEPA-Rückgaben träfen Ausgezahltes) und eine
   Frist je Zahlungsweg (für den Partner nicht nachvollziehbar).
3. **Ein gültiger Partner-Code ersetzt den Einladungscode – mit
   Freischaltung.** Solange `SIGNUP_INVITE_CODE` die Registrierung schließt,
   kommt herein, wer den Einladungscode **oder** den Code eines
   freigeschalteten Partners mitbringt. Die ersten Kunden kommen so über
   Partner, die wir kennen, ohne dass die Registrierung öffentlich aufgeht.
   Ohne Freischaltung wäre jedes Simulator-Konto ein Einladungscode für alle.
   Öffnet die Registrierung später ganz, fällt die Regel ohne Umbau weg.
   Umsetzung in den Abschnitten 1, 3 und 5.
4. **Keine nachträgliche Zuordnung in der Oberfläche.** Einzelfälle setzen wir
   per SQL nach Rückfrage beim Kunden. Ein Feld zum Nachtragen wäre eine
   Einladung, bestehende Kunden zum Eintragen zu überreden. Der verlorene Link
   ist durch das von Hand ausfüllbare „Empfohlen von“ abgefangen; zeigt der
   Betrieb, dass Kunden den Code regelmäßig vergessen, lässt sich ein
   Nachtragen mit kurzer Frist nachrüsten.

## 12. Offen aus den Notizen (hängt nicht am ersten Abschnitt)

Zugang zur Private Preview von Stripe Global Payouts, Steuerfragen
(Gutschrift, Reverse Charge, private Partner), Mindestauszahlung, Bonus oder
Staffel.
