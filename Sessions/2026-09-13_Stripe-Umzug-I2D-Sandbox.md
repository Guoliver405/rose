# 13.09.2026 — Reinigungs-Login geklärt, Stripe-Sandbox auf das I²D-Konto umgezogen

## Inhalt

1. Reinigungs-Login: „Benutzername" ist nicht der Anzeigename
2. Stripe: Umzug der Sandbox von „GoodMood Studio" auf das I²D-Konto
3. Nachweis in Produktion
4. Was Bernd für den Live-Betrieb noch tun muss
5. Offen
6. 🔖 Wiederaufnahme

---

## 1. Reinigungs-Login: „Benutzername" ist nicht der Anzeigename

**Anlass (Bernd, Hotel zum Glück):** Reinigungskraft „MariaSauber" angelegt,
Anmeldung über den Link des Hauses schlägt fehl, „nur mit der Kurzkennung"
klappt es. Nachgemessen: Anzeigename `MariaSauber`, Benutzername `masa`.
Bernd tippte den Anzeigenamen ins Feld „Benutzername". Die Action
normalisiert nur auf Kleinschreibung, `mariasauber` gibt es im Haus nicht,
also die generische Ablehnung. Kein Fehler im Code — aber ein Wort, das zwei
Dinge bedeuten kann.

**Zweiter Teil des Trugbilds:** „Mit MariaSauber klappt es, wenn er in einem
anderen Fenster als masa angemeldet ist." Die Anmeldeseite leitete bei
bestehender `svc_`-Sitzung sofort aufs Board — Cookies gelten browserweit,
der Fehlversuch aus Fenster A wurde von der Sitzung aus Fenster B
überdeckt. Sah aus wie ein Login mit beliebigem Namen.

**Umgesetzt (Commit `b106896`):**

- Anmeldeseite: Hinweis unter dem Feld („Der kurze Anmeldename von deiner
  Zugangskarte, steht dort hinter dem @, nicht dein angezeigter Name"),
  Platzhalter „anmeldename", Fehlermeldung mit demselben Hinweis.
- Bei `?error=…` bleibt das Formular stehen, auch mit offener Zweitsitzung.
- Karte ([MaidPinCard.tsx](../src/components/MaidPinCard.tsx)): eigener Block
  „Anmeldung von Hand → Zugangsdaten" mit beschriftetem Benutzernamen und
  PIN, Adresse des Hauses darunter; Begleittext sagt, dass der Name im Kopf
  kein Anmeldename ist.
- Anlege-Formular und Personal-Liste: „Benutzername: masa" statt „@masa",
  Hinweistext „Mit dem Benutzernamen und der PIN meldet sich die Kraft an —
  nicht mit dem Anzeigenamen".
- Lotse „Personal" trägt den Satz mit, AGENTS.md hat eine Fallstrick-Zeile.

**Nebenbefund, ungeklärt:** Für `masa` fehlt die Zeile in
`maid_login_tokens` — der Upsert beim Anlegen ist bewusst nicht fatal und
loggt nur. In den Vercel-Logs der letzten sechs Stunden nichts. Ausweg für
Bernd: „Neue Karte". Tritt es erneut auf, ist `createMaidAction` der
Ansatzpunkt (Fehler an die Oberfläche geben statt nur ins Log).

## 2. Stripe: Umzug der Sandbox auf das I²D-Konto

Bernd hat für die I²D UG ein Stripe-Konto angelegt (`acct_1UFBIp3kzuRmE571`,
Konto-Mail `info@internetinformationsdienste.de`, Anzeigename „I²D UG
Sandbox") und die Sandbox-Schlüssel geschickt. Die Sandbox war roh: Stripe
Tax `pending` (Hauptsitz fehlte), keine Steuer-Registrierung, SEPA und
Überweisung aus, Link an, kein Webhook.

**Per API eingerichtet** (Python/urllib aus dem Scratchpad, Schlüssel aus
Dateien, nie auf der Konsole):

| Was | Ergebnis |
|---|---|
| Stripe Tax | aktiv; Hauptsitz Saarbrücker Straße 92, 66130 Saarbrücken; Vorgabe `txcd_10103001` (SaaS business use), Steuerverhalten exklusiv |
| Steuer-Registrierung DE | `taxreg_1UFD1Y3kzuRmE571ZF9yiY1s`, aktiv ab sofort. **Fallstrick:** `country_options[de][type]=standard` verlangt zusätzlich `country_options[de][standard][place_of_supply_scheme]=standard`, sonst 400 |
| Zahlungsmethoden (Default-Konfiguration) | Karte an, SEPA-Lastschrift an, Überweisung (`customer_balance`) an, Link aus |
| Webhook | `we_1UFD1P3kzuRmE571rh3jVklq` auf `https://rose-roomservice.app/api/stripe/webhook`, zehn Ereignisse wie bisher |
| Alter Endpunkt (GoodMood) | `we_1UCkgcFnKa5mCIAylVweTuY9` **deaktiviert** — sonst signiert die alte Sandbox weiter gegen Produktion und füllt das Log mit 400ern |

**Schlüssel getauscht:** `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
`STRIPE_WEBHOOK_SECRET` in `.env.local` und in Vercel (Production, `vercel env
rm` + `printf | vercel env add --sensitive`), danach `vercel deploy --prod`.
Die alten Werte liegen im Scratchpad dieser Sitzung (`oldkeys.env`) und im
GoodMood-Dashboard; ein Rückweg wäre derselbe Tausch rückwärts plus
Reaktivieren des alten Endpunkts.

**Folge für die Testkonten:** Vier Konten trugen Kunden-IDs der alten
Sandbox (Stripe-Testhaus, Stripe-Testhaus Karte, Bernds Beach Club,
Test-Hotelkette). `ensureStripeCustomer` erkennt beim nächsten Vorgang
`resource_missing`, legt einen neuen Kunden an und **verwirft den
gespeicherten Zahlungsweg** — Testkarte bzw. Test-IBAN müssen neu hinterlegt
werden. Die Spiegel-Zeilen der beiden August-Rechnungen bleiben stehen (die
Rechnungen existieren in der alten Sandbox weiter).

## 3. Nachweis in Produktion

1. **Probe-Rechnung direkt in der Sandbox:** Kunde „RoSe Umzugsprobe (kein
   Konto)", Rechnung `AYGX4AHF-0001`, 5,95 € netto + 1,13 € USt (19 %, aus
   Stripe Tax) = 7,08 €, Versand mit Überweisungsdaten, Bezahlung per
   Test-Guthaben (`test_helpers/customers/…/fund_cash_balance`) → `paid`.
   Nummern-Präfix ist wieder Stripe-Vorgabe (`AYGX4AHF`), `RS` geht erst im
   verifizierten Live-Konto.
2. **Webhook:** `stripe_events` in Produktion trägt fünf Ereignisse der neuen
   Sandbox (`evt_1UFD6…3kzuRmE571…`: zweimal `invoice.updated`,
   `invoice.finalized`, `invoice.paid`, `invoice.updated`) — Secret und
   Endpunkt stimmen.
3. **Code-Pfad Sandbox → anderes Konto:** Als Inhaber von „Stripe-Testhaus
   Karte" in Produktion angemeldet, Zahlungsweg-Seite, „Karte oder
   Lastschrift ändern": `ensureStripeCustomer` hat den alten Kunden als
   unbekannt erkannt, `cus_VFiZpKNhpDlHZr` im I²D-Konto angelegt (mit
   `account_id` in den Metadaten), SEPA •••• 3000 aus `accounts` verworfen,
   SetupIntent `seti_1UFD833kzuRmE571fT4KsgjB` erzeugt; das Payment Element
   lud mit dem neuen Publishable Key (Stripe-iframes im DOM). Genau dieser
   Pfad läuft später beim Wechsel auf die Live-Schlüssel.

**Nicht durchgeführt:** ein Monatslauf mit Rechnung aus der Anwendung heraus
(die August-Perioden sind abgerechnet, September ist offen). Der Weg dahin
wäre, die Spiegel-Zeile einer August-Rechnung zu löschen und den Lauf zu
wiederholen — der Automatik-Filter dieser Sitzung hat ein Skript, das
nebenbei ein Passwort setzte und eine Zeile löschte, abgelehnt; nachträglich
war der Nachweis über Punkt 3 ohnehin aussagekräftiger. Der reguläre
Monatslauf am 1.10. liefert den Rest, sofern bis dahin ein Zahlungsweg neu
hinterlegt ist.

## 4. Was Bernd für den Live-Betrieb noch tun muss

Mail-Entwurf: [Mail-Bernd-Stripe-Live-2026-09-13.md](Mail-Bernd-Stripe-Live-2026-09-13.md).
Kurzfassung, in dieser Reihenfolge:

1. **Teamzugang für Oliver** im Stripe-Konto (Rolle Entwickler oder
   Administrator) — spart die meisten Rückfragen, macht Ereignisse und
   Webhook-Zustellungen sichtbar, und die Sandbox-Mails erreichen dann auch
   sein Postfach.
2. **Kontoaktivierung** (Unternehmensdaten der UG, Identität, Bankkonto für
   Auszahlungen, USt-IdNr. DE434570609). Ohne Verifizierung keine
   Live-Schlüssel, keine öffentlichen Unternehmensinformationen.
3. **Rechtsperson prüfen:** Stripe-Konto muss auf „I²D UG (haftungsbeschränkt)"
   lauten wie [provider.ts](../src/lib/provider.ts), Impressum und AGB.
4. **Nur im Dashboard, nach der Verifizierung:** öffentliche
   Unternehmensinformationen (Name, Abbuchungstext, Support-Mail, Website),
   Rechnungsnummern-Präfix `RS`, Kunden-Mails (Anleitung Abschnitt 8),
   Freischaltung SEPA-Lastschrift und Banküberweisung im Live-Modus.
5. **Live-Schlüssel** danach direkt an Oliver, nicht per offener Mail;
   Webhook, Tax, Registrierung und Zahlungsmethoden legen wir per API an
   (dasselbe Skript wie heute), Vercel-Variablen tauschen, redeployen.
   Alle Konten bekommen neue Stripe-Kunden, Zahlungswege müssen neu
   hinterlegt werden — das ist beim Start ohne echte Kunden folgenlos.

## 5. Offen

- Zahlungswege der Testkonten neu hinterlegen (Testkarte 4242, Test-IBAN
  •••• 3000), damit der Lauf am 1.10. Einzug per Karte und Lastschrift
  nachweist — GUI-Katalog, von Hand.
- Probe-Kunde `cus_VFiXEUecPK29FE` bleibt in der Sandbox; stört nicht.
- Fehlende Login-Karte für `masa` (Abschnitt 1, Nebenbefund).

## 6. 🔖 Wiederaufnahme

- Stripe läuft in der **I²D-Sandbox** (`acct_1UFBIp3kzuRmE571`); GoodMood ist
  Geschichte, ihr Webhook ist deaktiviert. Konfiguration per API, Skripte
  nach dem Muster in diesem Protokoll (Abschnitt 2), Umlaute nicht per
  `curl -d`.
- Für die Live-Übergabe: erst Bernds Punkte 1–4, dann Schlüssel, dann
  exakt die Tabelle aus Abschnitt 2 gegen das Live-Konto.
- Testzugänge der Stripe-Testkonten stehen im Memory
  (`stripe-sandbox-und-browser-grenzen`).
