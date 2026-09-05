# Zahlungsprovider für RoSe — Gegenüberstellung und Empfehlung

Stand 05.09.2026. Entscheidungsvorlage, noch keine Entscheidung. Preise sind
die öffentlich genannten Standardkonditionen vom 05.09.2026 (Quellen am Ende);
alle Provider verhandeln ab höherem Volumen, das spielt für RoSe auf Jahre
keine Rolle.

## 1. Was RoSe vom Zahlungsweg braucht

Die Anforderungen ergeben sich aus dem Preismodell in `pricing.ts` und den AGB,
nicht aus dem Provider:

- **Nur B2B**, überwiegend Deutschland. Verträge nur mit Unternehmern (§ 1
  Abs. 2 AGB). Für EU-Kunden außerhalb Deutschlands gilt Reverse Charge, dafür
  braucht es die USt-IdNr. des Kunden.
- **Kleine, variable Beträge, monatlich nachträglich.** 0,50 € je Zimmer,
  mindestens 5 €: ein 10-Zimmer-Haus zahlt 5 € netto, ein 200-Zimmer-Haus
  100 €. Die Höhe steht erst am Monatsende fest und **wird von RoSe
  berechnet** (`billingLine`, `billing_snapshots`) — der Provider soll den
  Betrag einziehen, nicht ermitteln. Ein klassisches „Abonnement mit
  Festpreis" passt nicht; nötig ist ein gespeichertes Zahlungsmittel, das
  monatlich mit einem von uns genannten Betrag belastet wird.
- **SEPA-Lastschrift ist das natürliche B2B-Verfahren in Deutschland.** Hotels
  zahlen Lieferanten per Lastschrift oder Überweisung; eine Kreditkarte hat
  nicht jede Rezeption zur Hand. Karte als zweiter Weg, nicht als einziger.
- **Zahlungsmittel bei der Registrierung**, auch wenn der erste Monat frei ist
  (TODO vom 04.09.). Das heißt: Mandat bzw. Karte hinterlegen **ohne
  Belastung**, erste Abbuchung frühestens Anfang des zweiten Monats.
- **Rechnung nach § 14 UStG** mit fortlaufender Nummer, USt-IdNr. des
  Anbieters, Steuerausweis bzw. Reverse-Charge-Hinweis. Und: **ab dem
  01.01.2028 muss die I²D UG an deutsche Geschäftskunden E-Rechnungen
  ausstellen** (EN 16931, also XRechnung oder ZUGFeRD); bis Ende 2027 gilt die
  Übergangsregel für Unternehmen bis 800.000 € Vorjahresumsatz. Eine PDF
  aus dem Provider genügt danach nicht mehr.
- **Datenschutz:** Der Provider wird Auftragsverarbeiter bzw. eigener
  Verantwortlicher für Zahlungsdaten und muss in Abschnitt 7 der
  Datenschutzerklärung und im AVV genannt werden. EU-Sitz und EU-Verarbeitung
  vereinfachen das.

**Folgerung, bevor überhaupt ein Name fällt:** Rechnung und Zahlungseinzug
sind zwei Dinge. Die Rechnung erzeugt RoSe ohnehin selbst (Zahlen aus
`billingLine`, E-Rechnungs-Pflicht ab 2028, eigene Nummernkreise), der
Provider braucht also **keine** Rechnungs- oder Steuer-Suite, sondern genau
drei Fähigkeiten: Zahlungsmittel ohne Belastung speichern, später mit
beliebigem Betrag belasten, Ergebnis per Webhook melden.

## 2. Kandidaten

| | **Stripe** | **Mollie** | **PayPal** | **Paddle** (Merchant of Record) |
|---|---|---|---|---|
| Sitz / Vertragspartner | Stripe Payments Europe, Dublin | Mollie B.V., Amsterdam | PayPal (Europe) S.à r.l., Luxemburg | Paddle.com Market Ltd, London |
| Rolle | Zahlungsdienstleister, RoSe bleibt Verkäufer | wie Stripe | wie Stripe | **Paddle ist der Verkäufer**, RoSe liefert Paddle die Software |
| SEPA-Lastschrift | 0,35 € je Einzug | 0,35 € je Einzug | 0,35 € (Standard) / 0,40 € (sofort) | im Checkout, keine eigene Gebühr |
| Karte (EWR-Verbraucherkarte) | 1,5 % + 0,25 € | 1,8 % + 0,25 € | 2,49 % + 0,39 € (Standard) · 2,99 % bei Advanced Card Payments | im Pauschalpreis |
| Firmen- / Premiumkarte EWR | 2,8 % + 0,25 € | 2,9 % + 0,25 € | wie oben | im Pauschalpreis |
| Pauschale je Vorgang | — | — | — | **5 % + 0,50 $** (Standard); Produkte unter 10 $ „auf Anfrage" |
| Zahlungsmittel ohne Belastung speichern | ja (SetupIntent, SEPA-Mandat oder Karte) | Mandat per „first payment" (0,01 €-Verifikation oder erster Betrag) | Billing Agreement / Reference Transactions — **Freischaltung durch PayPal nötig** | nur als Abo mit Testphase, Betrag muss vorher im Katalog stehen |
| Variabler Betrag je Monat | ja (PaymentIntent off-session; alternativ Stripe Billing 0,7 % oder Invoicing 0,4 %) | ja (Payments API `sequenceType: recurring`, Betrag frei) | ja, über Reference Transactions | nur über nutzungsbasierte Preise im Paddle-Katalog |
| Rechnung | eigene, optional Stripe Invoicing (0,4 %); **keine E-Rechnung** (Partner-App oder eigene EN-16931-Erzeugung) | eigene | eigene (PayPal-Rechnungen möglich, keine E-Rechnung) | **stellt Paddle aus**, in Paddles Namen |
| Umsatzsteuer | selbst (DE 19 %, EU Reverse Charge nach USt-IdNr.-Prüfung); Stripe Tax 0,5 % optional, nicht nötig | selbst | selbst | Paddle führt ab; Kunde erhält Rechnung von Paddle (UK) mit Reverse Charge |
| Rückbuchung | Festgebühr je Rücklastschrift bzw. Chargeback (Preisseite, nicht einzeln geprüft) | Festgebühr je Fall (nicht einzeln geprüft) | 16 € je Chargeback | trägt Paddle |
| Auszahlung | EUR, täglich bis wöchentlich | EUR, wählbar bis täglich | PayPal-Guthaben, Abruf aufs Konto | monatlich, EUR möglich |
| Anbindung an Next.js | ausgereifteste SDKs, Webhooks, Test-Modus, viele Beispiele | gute REST-API, weniger Beispiele | REST-API, SDK-Landschaft uneinheitlich (Braintree, Checkout, Subscriptions) | Paddle.js + Webhooks, schlank |
| Konto-Freischaltung | Standard-Prüfung, SEPA-Lastschrift sofort | Standard-Prüfung, SEPA sofort | Reference Transactions: Antrag beim Support | Produkt-Prüfung durch Paddle, Software unter 10 $ Sonderfall |

**Was die Tabelle nicht zeigt, aber entscheidet:**

- **Paddle** löst die Steuerfrage, indem es den Vertrag übernimmt — der Kunde
  kauft bei Paddle, nicht bei der I²D UG. Das widerspricht § 1 der AGB und
  passt nicht zu einem deutschen B2B-Verhältnis, in dem der Hotelier eine
  Rechnung seines Dienstleisters erwartet, nicht eine aus London. Dazu kommt
  der Preis: 5 % + 0,50 $ macht beim Mindestbetrag über 12 % aus, und Paddle
  verweist Produkte unter 10 $ ausdrücklich auf Sonderkonditionen. Dasselbe
  gilt für Lemon Squeezy (seit 2024 zu Stripe, 5 % + 0,50 $) und Polar
  (4 % + 0,40 $). Merchant of Record lohnt für weltweiten B2C-Verkauf mit
  Steuerpflicht in vielen Ländern; RoSe verkauft an deutsche Hotels.
- **PayPal** ist als Wallet stark, aber als Einzugsinfrastruktur die
  umständlichste Wahl: variable Abbuchungen laufen über Reference
  Transactions, die PayPal je Konto freischalten muss; die Kartengebühr ist
  die höchste; Rückbuchung 16 €. Die Annahme aus dem TODO vom 04.09.
  („Abwicklung und Haftung vollständig beim Provider") trifft so nicht zu —
  Käuferschutz und Chargebacks treffen auch hier den Händler, nur Paddle
  trägt sie wirklich. PayPal als **zusätzliches** Zahlungsmittel bleibt
  sinnvoll und ist über Stripe wie über Mollie einbindbar.
- **Mollie** ist der europäische Gegenentwurf zu Stripe: gleiches Modell,
  Sitz und Verarbeitung in der EU, SEPA-Lastschrift zum gleichen Preis,
  Karten etwas teurer. Schwächen: kleineres Ökosystem, keine
  Setup-ohne-Zahlung wie Stripes SetupIntent (Mandat entsteht über eine
  erste Zahlung, notfalls 0,01 €), weniger Beispiele für Next.js.
- **Stripe** hat alles, was Abschnitt 1 verlangt, als Standardweg:
  SetupIntent für Mandat oder Karte ohne Belastung, PaymentIntent
  off-session mit beliebigem Betrag, Webhooks, Test-Modus, gute
  Dokumentation. Vertragspartner ist Stripe Payments Europe in Dublin — für
  die Datenschutzerklärung dieselbe Lage wie bei Supabase und Vercel. Was
  Stripe **nicht** liefert, ist die E-Rechnung; das müsste ohnehin RoSe.

## 3. Was es kostet

Beispiel-Rechnungen brutto (netto + 19 % USt.), Gebühr je Einzug in Euro und
in Prozent der Bruttosumme. Stripe/Mollie/PayPal ohne Zusatzmodule, Paddle
mit 0,50 $ ≈ 0,45 €.

| Haus | Rechnung brutto | Stripe SEPA | Stripe Karte | Mollie SEPA | Mollie Karte | PayPal | Paddle |
|---|---|---|---|---|---|---|---|
| 10 Zimmer (Mindestbetrag) | 5,95 € | 0,35 € (5,9 %) | 0,34 € (5,7 %) | 0,35 € (5,9 %) | 0,36 € (6,0 %) | 0,54 € (9,0 %) | 0,75 € (12,6 %) |
| 50 Zimmer | 29,75 € | 0,35 € (1,2 %) | 0,70 € (2,3 %) | 0,35 € (1,2 %) | 0,79 € (2,6 %) | 1,13 € (3,8 %) | 1,94 € (6,5 %) |
| 200 Zimmer | 119,00 € | 0,35 € (0,3 %) | 2,04 € (1,7 %) | 0,35 € (0,3 %) | 2,39 € (2,0 %) | 3,35 € (2,8 %) | 6,40 € (5,4 %) |

Lesart: Bei RoSe-typischen Beträgen ist **SEPA-Lastschrift mit Festgebühr**
die einzige Form, bei der die Gebühr nicht mit dem Umsatz skaliert. Über
Stripe und Mollie kostet sie dasselbe. Mit Stripe Billing (0,7 %) oder
Invoicing (0,4 %) käme ein Prozentanteil dazu — beides braucht RoSe nicht,
weil Betrag und Rechnung aus eigener Logik kommen.

## 4. Empfehlung

**Stripe, mit SEPA-Lastschrift als Hauptweg und Karte als Nebenweg. Rechnung
aus RoSe, nicht aus Stripe.**

Warum nicht Mollie, obwohl gleich teuer und europäischer: Der Unterschied
liegt im ersten Schritt. RoSe will das Zahlungsmittel **bei der Registrierung**
aufnehmen, während der erste Monat frei ist. Stripes SetupIntent macht genau
das — Mandat oder Karte werden bestätigt, nichts wird abgebucht. Bei Mollie
entsteht das Mandat über eine erste Zahlung; eine 0,01-€-Verifikation auf der
Registrierungsseite eines Dienstes, der „erster Monat frei" verspricht, ist
erklärungsbedürftig. Dazu die deutlich breitere Dokumentation für genau den
Stack, den RoSe hat. Sollte der EU-Sitz des Vertragspartners später
ausschlaggebend werden (etwa in der anwaltlichen Prüfung), ist Mollie die
saubere zweite Wahl mit demselben Bauplan — die Integration ist in beiden
Fällen ein dünner Adapter um „Mandat speichern, Betrag einziehen, Webhook".

Nicht empfohlen: Paddle (Vertragsübernahme, Preis, Sonderfall unter 10 $),
PayPal als einziger Weg (Freischaltung, Gebühren, Aufwand). PayPal als
Zusatzmethode lässt sich über Stripe nachrüsten, wenn Kunden danach fragen.

**Ergänzung nach Rückfrage (Abschnitt 7):** Die Empfehlung bleibt, die
Gewichtung ändert sich. Weil RoSe weltweit verfügbar sein soll, ist die
**Karte der Hauptweg** und die SEPA-Lastschrift der Komfortweg für den
Euroraum; dazu kommt die **Überweisung auf Rechnung mit virtueller IBAN** als
Weg ohne Rückbuchung. Stripe Tax wird nicht verworfen, sondern als späterer
Schalter geführt.

## 5. Bauplan, falls Stripe

Reihenfolge so, dass jeder Schritt für sich in Produktion gehen kann:

1. **Stripe-Konto der I²D UG** anlegen, SEPA-Lastschrift und Karten
   aktivieren, Gläubiger-ID für Lastschriften beantragen (Bundesbank, kostenlos,
   wenige Tage). Ohne Gläubiger-ID kein SEPA-Mandat.
2. **`stripe_customer_id` an `accounts`**, ein Kunde je Konto. Anlage bei
   der Registrierung (Admin-API, Name = Kontoname, E-Mail des Inhabers).
3. **Zahlungsmittel hinterlegen:** SetupIntent mit `sepa_debit` und `card`,
   Stripe Elements auf einer eigenen Seite im Registrierungsfluss und auf
   `/admin/abrechnung` (die Karte „Zahlungsverfahren" wird damit gefüllt).
   Mandatstext für SEPA zeigt Stripe; Standard-Mandat genügt. Als dritte
   Option „Überweisung auf Rechnung": Stripe legt je Kunde eine virtuelle
   IBAN an, die auf der Rechnung steht; der Eingang wird automatisch
   zugeordnet. Kein gespeichertes Zahlungsmittel, dafür keine Rückbuchung.
4. **Monatslauf:** Am 1. je Konto `billingLine` für den Vormonat, Rechnung
   erzeugen (eigene Nummer, PDF; von Anfang an als **ZUGFeRD** anlegen, damit
   2028 nichts umgebaut wird — z. B. mit einer EN-16931-Bibliothek), dann
   PaymentIntent off-session mit dem Bruttobetrag gegen das gespeicherte
   Zahlungsmittel. Bei 0 € keine Rechnung, bei freiem Monat eine Rechnung über
   0 € oder keine (Entscheidung offen, Empfehlung: keine).
   Auslöser: Vercel Cron oder ein Aufruf beim ersten Zugriff im neuen Monat,
   nach dem Muster von `ensureBillingSnapshots` — idempotent je Konto und
   Periode, damit ein doppelter Lauf nie doppelt abbucht.
5. **Webhooks:** `payment_intent.succeeded` → Rechnung bezahlt;
   `payment_intent.payment_failed` → Mahnlauf nach § 6 Abs. 6 AGB;
   `mandate.updated`/`payment_method.detached` → Hinweis auf
   `/admin/abrechnung`. Tabelle `invoices` (Konto, Periode, Betrag netto/
   brutto, Steuer, Status, Stripe-IDs, PDF-Pfad).
6. **Karte „Rechnungen"** auf `/admin/abrechnung` mit Download der PDFs;
   `/admin` zeigt den Zahlungsstatus im Kurz-Kasten.
7. **Rechtstexte:** Datenschutz Abschnitt 7 um Stripe Payments Europe
   ergänzen (Zahlungsdaten, Mandat, IBAN-Teilanzeige), AVV-Liste der
   Unterauftragsverarbeiter, AGB § 6 Abs. 4 an die tatsächliche Fälligkeit
   anpassen (Lastschrift zieht am Fälligkeitstag, Vorabankündigung/Pre-
   Notification mindestens einen Tag vorher — Stripe verschickt sie).

Aufwand grob: Schritte 1–3 ein Tag, 4–6 zwei Tage, 7 ein halber Tag mit
anwaltlicher Rückkopplung. Stripe Tax wird **zunächst nicht** gebraucht:
Deutschland 19 %, EU-Ausland Reverse Charge nach VIES-Prüfung der USt-IdNr.,
Drittland ohne deutsche Steuer — das kann RoSe selbst, weil Land und
Unternehmereigenschaft aus der Registrierung bekannt sind. Der Schalter kommt
später, siehe Abschnitt 7.

## 6. Offene Entscheidungen für den User

1. **Zahlungsmittel bei der Registrierung Pflicht** oder erst vor dem ersten
   kostenpflichtigen Monat? Empfehlung: Pflicht, wie im TODO vorgesehen —
   sonst endet der freie Monat in einer Sperre statt in einer Rechnung. Wer
   ohne Zahlungsmittel testen soll, bekommt weiterhin den Einladungscode.
   Wer „Überweisung auf Rechnung" wählt, hinterlegt nichts; die Pflicht
   heißt dann: einen der drei Wege gewählt zu haben.
2. ~~Karte zulassen oder nur Lastschrift?~~ — mit der weltweiten Ausrichtung
   entschieden: Karte ist der Hauptweg, Lastschrift der Komfortweg im
   Euroraum, Überweisung der dritte Weg.
3. **Welche Länder zuerst?** Weltweit heißt für Steuer und Rechtstexte:
   Deutschland (19 %), EU-B2B (Reverse Charge, USt-IdNr. Pflichtfeld mit
   VIES-Prüfung), Drittland (ohne deutsche Steuer, Landesregeln beim Kunden).
   Empfehlung: die Registrierung von Anfang an mit Land und USt-IdNr.
   (Pflicht in der EU, optional sonst), aber die Freigabe je Land bewusst
   steuern, bis AGB, Datenschutz und Sprache dafür stehen.
4. **Stripe oder Mollie** — mit „weltweit" ist Mollie keine gleichwertige
   Zweitwahl mehr (Abschnitt 7). Bleibt Stripe.
5. **Preisdarstellung:** Euro für alle, oder Anzeige in Landeswährung mit
   Abrechnung in Euro? Empfehlung: Euro überall, keine Kursrisiken, keine
   Umrechnungsgebühr; Landeswährung höchstens als Hinweis.

## 7. Nachtrag: Rückbuchung, weltweite Verfügbarkeit, weitere Zahlungsarten

Rückfrage des Users am 05.09.: SEPA-Lastschriften lassen sich rückwirkend
stornieren; der Dienst soll weltweit verfügbar sein, nicht nur in der EU;
sind weitere Zahlungsarten sinnvoll? Antwort in drei Teilen.

### 7.1 Rückbuchung der Lastschrift

Der Einwand trifft. Bei der **SEPA-Basislastschrift** kann der Zahler acht
Wochen lang ohne Angabe von Gründen zurückbuchen, bei fehlendem oder
ungültigem Mandat 13 Monate. Die **SEPA-Firmenlastschrift** (B2B-Verfahren)
kennt kein Widerspruchsrecht, verlangt aber, dass der Kunde das Mandat bei
seiner eigenen Bank hinterlegt — und keiner der vier Provider bietet dieses
Verfahren nach unserem Stand an. Es bleibt also bei der Basislastschrift.

Drei Dinge halten das Risiko klein:

- **Der Hebel liegt bei RoSe.** Nach einer Rücklastschrift wird der Zugang
  gesperrt (§ 6 Abs. 6 AGB). Ein Hotel, das den Dienst weiter nutzen will,
  zahlt. Der Schaden ist auf einen Monatsbetrag plus Rücklastschriftgebühr
  begrenzt, und der Kunde ist kein Anonymus, sondern ein registrierter
  Betrieb.
- **Karten sind nicht besser.** Ein Chargeback ist bis zu 120 Tage möglich.
  Endgültig ist nur Geld, das der Kunde selbst überweist.
- **Dafür gibt es die Überweisung auf Rechnung.** Stripe legt je Kunde eine
  virtuelle IBAN an; sie steht auf der Rechnung, der Eingang wird
  automatisch dem Konto zugeordnet, es gibt keine Rückbuchung, und
  Hotelbuchhaltungen bevorzugen diesen Weg ohnehin. Nachteil: kein
  automatischer Einzug, der Kunde muss handeln — deshalb Mahnstufen
  (Erinnerung, Sperre) und ein Zahlungsziel von 14 Tagen wie in § 6 Abs. 4
  AGB.

Folge für den Bauplan: Lastschrift bleibt der bequeme Standardweg im
Euroraum, Überweisung wird der sichere dritte Weg, und beides steht dem
Kunden auf `/admin/abrechnung` zur Wahl.

### 7.2 Weltweite Verfügbarkeit

Beim Zahlungsweg ist Stripe von den vieren am stärksten: Ein deutsches
Stripe-Konto nimmt Karten aus aller Welt an und blendet lokale Verfahren je
nach Land des Kunden ein (ACH-Lastschrift in den USA, Bacs in Großbritannien,
iDEAL in den Niederlanden, PayPal im EWR). Mollie ist auf europäische
Händler und Verfahren ausgerichtet, PayPal ist weltweit ein Wallet, aber
kein Einzugsverfahren, Paddle ist weltweit, aber aus den Gründen in
Abschnitt 2 keine Option. Mit „weltweit" fällt Mollie damit als
gleichwertige Zweitwahl weg.

Kosten: Karten außerhalb des EWR kosten bei Stripe rund 3,25 % + 0,25 €,
Abrechnung in Fremdwährung 1 % Umrechnung obendrauf. Ein 200-Zimmer-Haus in
den USA kostet RoSe damit etwa 4 € Gebühr auf 100 € — verkraftbar, und der
Grund, Karte statt Lastschrift zum Hauptweg zu machen: Die Lastschrift
existiert nur im Euroraum, die Karte überall.

**Der eigentliche Punkt ist die Steuer, nicht der Zahlungsweg.** Für
Geschäftskunden gilt fast überall das Empfängerortprinzip (§ 3a Abs. 2
UStG): Ein Hotel in Norwegen oder Japan bekommt eine Nettorechnung ohne
deutsche Umsatzsteuer und versteuert selbst. Solange RoSe nur an Unternehmen
verkauft, ist das weltweite Steuerrisiko klein. Es wächst, sobald einzelne
Länder auch bei B2B eine Registrierung des ausländischen Anbieters
verlangen — und genau das ist der Fall, in dem ein Merchant of Record seinen
Preis wert wäre. Gestaffelt:

1. **Jetzt:** Stripe, eigene Rechnung, Steuerlogik selbst — Deutschland
   19 %, EU-B2B Reverse Charge nach VIES-Prüfung, Drittland ohne deutsche
   Steuer. Land und USt-IdNr. werden bei der Registrierung erhoben.
2. **Später:** Stripe Tax (0,5 % je Transaktion) dazuschalten, sobald
   nennenswert Umsatz außerhalb der EU entsteht — es überwacht, in welchen
   Ländern Schwellen und Registrierungspflichten erreicht werden, und rechnet
   die Steuer dort. Das ist ein Schalter im Stripe-Konto, kein Umbau.
3. **Nur falls je an Verbraucher verkauft wird** oder die Länderliste
   unübersichtlich wird: Merchant of Record prüfen. Das Argument gegen Paddle
   bleibt auch dann bestehen — der Kunde bekäme eine Rechnung von Paddle,
   nicht von I²D.

Was „weltweit" außerdem nach sich zieht, unabhängig vom Provider: Preis in
Euro belassen (keine Kursrisiken, keine Umrechnungsgebühr, Landeswährung
höchstens als Hinweis), AGB mit Gerichtsstand und Vertragssprache,
Datenschutz mit Drittlandpassage, Rechnungen zweisprachig, und die
Mehrsprachigkeit aus dem TODO rückt nach vorn. Das sind Folgen der
Entscheidung, keine Gründe dagegen.

### 7.3 Weitere Zahlungsarten

Ja — mit einer Einschränkung: Jede Methode kostet Zuordnung, Fehlerfälle und
Support. Für monatlich variable Abbuchungen **ohne Zutun des Kunden** taugen
nur Verfahren, die Stripe als wiederverwendbar speichert. Das ist die
sinnvolle Startmenge, von Stripe je nach Land des Kunden automatisch
angeboten:

| Verfahren | Region | Speicherbar für monatlichen Einzug | Rückbuchung |
|---|---|---|---|
| Karte (Visa, Mastercard, Amex, Apple/Google Pay) | weltweit | ja | Chargeback bis 120 Tage |
| SEPA-Lastschrift | Euroraum | ja | 8 Wochen |
| ACH-Lastschrift | USA | ja | 60 Tage |
| Bacs-Lastschrift | Großbritannien | ja | unbegrenzt (Direct Debit Guarantee) |
| PayPal (über Stripe) | EWR | ja | Käuferschutz |
| Überweisung auf Rechnung (virtuelle IBAN) | weltweit, SEPA-Raum am einfachsten | nein — Kunde überweist | keine |

Weglassen: Verfahren ohne Speicherung (Sofortüberweisung, Klarna, iDEAL als
Einmalzahlung), weil dann jeden Monat ein Klick des Kunden nötig wäre; Krypto.
Verfahren werden im Stripe-Konto je Land freigeschaltet, die Oberfläche
(Payment Element) zeigt automatisch die passenden — es entsteht also kein
Code je Verfahren, nur eine Entscheidung je Verfahren.

**Fazit:** Empfehlung Stripe bleibt. Drei Ergänzungen: Karte weltweit als
Hauptweg statt Lastschrift, Überweisung mit virtueller IBAN als
rückbuchungssicherer Weg, Stripe Tax als späterer Schalter statt Verzicht.

## Quellen (abgerufen 05.09.2026)

- Stripe Preise Deutschland: https://stripe.com/de/pricing — Karten 1,5 % + 0,25 € (EWR-Standard), 2,8 % + 0,25 € (EWR-Premium), SEPA 0,35 €, Billing 0,7 %, Invoicing 0,4 %, Tax 0,5 %
- Stripe zu E-Rechnung in Deutschland: https://stripe.com/resources/more/zugferd-x-invoice-germany — Stripe Invoicing erzeugt keine EN-16931-Datei, Partner-App oder eigene Erzeugung
- Mollie Preise: https://www.mollie.com/de/pricing — Karten 1,8 % + 0,25 € (EU-Verbraucher), 2,9 % + 0,25 € (Firmenkarten), SEPA-Lastschrift 0,35 €, keine Grundgebühr
- Mollie Recurring: https://docs.mollie.com/docs/recurring-payments — Mandat über erste Zahlung, Folgezahlungen mit freiem Betrag
- PayPal Händlergebühren Deutschland (Stand 15.07.2026): https://www.paypal.com/de/business/paypal-business-fees — 2,49 % + Festgebühr (0,35/0,39 €), Advanced Card Payments 2,99 %, SEPA 0,35/0,40 €, Chargeback 16 €
- PayPal Reference Transactions: https://developer.paypal.com/api/nvp-soap/paypal-payments-pro/integration-guide/reference-transactions — Freischaltung durch PayPal-Support nötig
- Paddle Preise: https://www.paddle.com/pricing — 5 % + 0,50 $, Produkte unter 10 $ auf Anfrage
- Paddle Zahlungsarten: https://www.paddle.com/help/start/intro-to-paddle/which-payment-methods-do-you-support
- Paddle-Gebühren im Detail: https://dodopayments.com/blogs/paddle-fees-explained — Wirkung der Festgebühr bei kleinen Beträgen, Umrechnungsaufschlag
- Stripe Überweisungen mit virtueller IBAN (Bank Transfers, Customer Balance): https://docs.stripe.com/payments/bank-transfers — automatische Zuordnung, keine Rückbuchung
- Stripe Zahlungsarten nach Land und Wiederverwendbarkeit: https://docs.stripe.com/payments/payment-methods/overview
- SEPA-Rückgabefristen (8 Wochen autorisiert, 13 Monate ohne Mandat): https://www.bundesbank.de/de/aufgaben/unbarer-zahlungsverkehr/serviceangebot/sepa
- E-Rechnungspflicht: https://www.frankfurt-main.ihk.de/recht/uebersicht-alle-rechtsthemen/steuerrecht/umsatzsteuer-national/e-rechnungspflicht-ab-2025-6055774 und https://www.claribill.com/blog/e-rechnung-2027-800000-euro-grenze-pdf-papier — Ausstellungspflicht ab 01.01.2027 über 800.000 € Vorjahresumsatz, ab 01.01.2028 für alle
