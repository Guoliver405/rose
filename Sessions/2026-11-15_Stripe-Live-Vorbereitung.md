# 15.11.2026 — Stripe-Live-Konto: Teamzugang, Bestandsaufnahme, erste Einrichtung

Oliver hat Teamzugang zum Stripe-Konto der I²D UG. Das Live-Konto ist
verifiziert (Zahlungen und Auszahlungen frei). **Produktion läuft weiter auf
der Sandbox** — umgeschaltet wird erst, wenn Banküberweisung und
SEPA-Lastschrift im Live-Konto verfügbar sind.

## 1. Stand des Live-Kontos (`acct_1UFBIU3gxzXGCjFv`)

Nicht zu verwechseln mit der Sandbox `acct_1UFBIp3kzuRmE571`.

| Punkt | Stand |
|---|---|
| Zahlungen / Auszahlungen | frei, Abbuchungstext `ROSE ROOM-SERVICE` |
| Stripe Tax | aktiv (Bernd), Hauptsitz Saarbrücken, `txcd_10103001`, exklusiv |
| Steuer-Registrierung DE | **heute angelegt:** `taxreg_1UcBQ03gxzXGCjFv0mxxAQsH` |
| Zahlungsarten (Default `pmc_1UFBJ53gxzXGCjFvyeu5id5v`) | **heute bereinigt:** an sind Karte, Apple Pay, SEPA-Lastschrift (Wunsch gesetzt, noch nicht verfügbar); 13 andere aus (Klarna, Link, Pix, Amazon Pay, BLIK …) |
| Banküberweisung, SEPA-Lastschrift | **gesperrt**, siehe Abschnitt 2 |
| Webhook | keiner — wird erst beim Umschalten angelegt, sonst scheitern Live-Ereignisse in Produktion an der Sandbox-Signatur |
| Support-Mail | leer |
| Rechnungsnummern-Präfix | `AYGX4AHF`, soll `RS` |
| Zeitzone | Europe/Paris, soll Berlin (nur Berichte) |

Live-Schlüssel liegen in `.env.live` (von Git ignoriert), **nicht** in
`.env.local` — der Dev-Server bleibt auf der Sandbox.

## 2. Was Bernd noch tun muss

Mail-Entwurf dazu: [Mail-Bernd-Stripe-Live-2026-11-15.md](Mail-Bernd-Stripe-Live-2026-11-15.md)
(Oliver verschickt sie am 15.11., Antwort frühestens am 16.11.).

1. **Verifizierungsseite** (Einstellungen → Unternehmen → Kontodetails):
   Gründungsdatum der Gesellschaft, seine persönliche Identifikationsnummer,
   Bestätigung der Geschäftsführer. Erst danach lassen sich Banküberweisung
   (`bank_transfer_payments`, `sepa_bank_transfer_payments`) und
   SEPA-Lastschrift freischalten.
2. **Firmenname klären:** Stripe führt „Internetinformationsdienste UG“,
   Impressum und AGB „I²D UG (haftungsbeschränkt)“.
3. **Offene Live-Rechnung** `AYGX4AHF-0001` über 5,00 € an den Kunden
   „Bernd KÖHL“ stornieren (sein Test vom 28.10.).
4. **Nicht bestätigen:** den Leitfaden-Schritt „Integrationsauswahl
   bestätigen“ — er schließt die Connect-Plattformvereinbarung, RoSe ist
   keine Plattform. Abonnements, Checkout, Kundenportal, Identity ebenfalls
   ignorieren; die zwei angelegten Produkte benutzt RoSe nicht.

## 3. Danach (Oliver und Claude)

1. Im Dashboard: Banküberweisung und SEPA-Lastschrift aktivieren,
   Support-Mail, Präfix `RS`, Zeitzone, Kunden-Mails.
2. Per API: Webhook auf `https://rose-roomservice.app/api/stripe/webhook`
   mit den zehn bisherigen Ereignissen **plus** `charge.refunded`,
   `charge.dispute.funds_withdrawn`, `charge.dispute.funds_reinstated`
   (Partnerprogramm).
3. Vercel: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
   `STRIPE_WEBHOOK_SECRET` tauschen, redeployen, Sandbox-Webhook
   deaktivieren.
4. Folge: alle Konten bekommen neue Stripe-Kunden, Zahlungswege neu
   hinterlegen.

## 4. Nachprüfung 17.11.2026

Bernd meldet „alles nachgetragen“. Per API nachgemessen — **noch nicht
vollständig**:

- **Angekommen:** Unterlagen zur Gesellschaft (Adresse, Name, Steuernummer,
  Dokument, Nachweis der wirtschaftlich Berechtigten) stehen bei Stripe auf
  „wird geprüft“. Support-Mail ist gesetzt.
- **Fehlt weiter:** Gründungsdatum der Gesellschaft
  (`company.registration_date`) und Bernds persönliche Identifikationsnummer
  (`person_….id_number`) — beide „überfällig“ für Banküberweisung.
- **Neu:** Weil die Steuernummer geändert wurde, verlangt Stripe die
  **erneute Zustimmung zu den Nutzungsbedingungen** (`tos_acceptance`) —
  das blockiert jetzt auch die SEPA-Lastschrift (`pending`). Das kann nur
  Bernd im Dashboard bestätigen.
- **Tippfehler in der Support-Mail:** `help@internetinformatonsdiense.de`
  statt `…internetinformationsdienste.de` — sie steht auf Rechnungen.
- Unverändert: Rechnung `AYGX4AHF-0001` offen, Firmenname
  „Internetinformationsdienste  UG“, Zeitzone Paris, kein Webhook.

### Stand am Abend des 17.11.

Bernd hat im Lauf des Tages nachgezogen (Dashboard-Screenshots von Oliver,
per API gegengeprüft):

- **Nutzungsbedingungen neu bestätigt**, Aufgabe „Angaben zu einem
  Kontovertreter (Bernd Köhl)“ erledigt und aus der Liste verschwunden.
- Unter Einstellungen → Unternehmen → **Kontostatus** stehen nur noch zwei
  Aufgaben, beide „Wird überprüft“: „Eigentumsrechte an Ihrem Unternehmen
  überprüfen“ und „Firmenadresse angeben“. **Frist 01.12.2026** — sonst
  pausiert Stripe Zahlungen und Auszahlungen.
- **SEPA-Lastschrift:** `pending`, `currently_due` leer — hängt nur noch an
  Stripes Prüfung.
- **Banküberweisung** (`bank_transfer_payments`,
  `sepa_bank_transfer_payments`): weiter `unrequested`. Dafür fehlen
  Gründungsdatum und die persönliche Identifikationsnummer von **zwei**
  Personen (`person_1UFDia…` = Bernd, `person_1UcsTh…` = neu eingetragen,
  vermutlich wirtschaftlich Berechtigter). **Dafür gibt es im Dashboard
  noch keine Aufgabe** — sie erscheint erst, wenn die Banküberweisung
  beantragt ist. Bernd kann das heute nirgends eintragen.
- **Gründungsdatum der Gesellschaft: 28.10.2015** (von Oliver).
- Kontoname im Dashboard: „I²D UG(haftungsbeschränkt)“ — Leerzeichen vor
  der Klammer fehlt. Zeitzone weiter Paris. Beides auf „Kontodetails“.

**Zwei Lehren für die Arbeit am Stripe-Konto:**

- Firmendaten des eigenen Kontos lassen sich **nicht per API** ändern
  (`POST /v1/accounts/<id>`: „only on connected accounts“) — nur im
  Dashboard.
- Die API sagt, *was* fehlt, nicht *wo* es im Dashboard steht. Klickwege
  für Bernd nicht raten, sondern am Screenshot ablesen; Anforderungen
  einer nicht beantragten Zahlungsart haben gar keinen Ort.

## 5. Nachtrag 20.11.2026

**Mail von Stripe an Bernd:** „Wir konnten Ihre Domäne
internetinformationsdienste.de nicht verifizieren“. Kein Fehler an Website
oder Postfach und kein Hindernis für den Live-Start: Unter Einstellungen →
Kunden-E-Mails ist die Domain als **eigene Absender-Domain** eingetragen,
die dafür nötigen DNS-Einträge wurden aber nie angelegt. Nachgemessen
(Nameserver bei united-domains, `ns.udag.*`): im DNS stehen nur SPF und
eine Google-Verifizierung, kein `stripe-verification`-TXT, kein
`bounce`-CNAME. Empfehlung an Bernd (Antwort-Mail von Oliver): Domain bei
Stripe wieder entfernen — Rechnungen kommen dann von einer Stripe-Adresse
mit dem Firmennamen als Absender, wie in der Sandbox. Die eigene
Absender-Domain ist Kosmetik und jederzeit nachholbar.

**Stand des Kontos, per API nachgemessen:**

- **SEPA-Lastschrift ist `active`**, Zahlungen und Auszahlungen frei —
  **aber die Prüfung ist nicht bestanden**, siehe „Korrektur“ unten.
- **Banküberweisung** weiter nicht beantragt (`customer_balance` in der
  Zahlungsmethoden-Konfiguration `off`, nicht verfügbar) — das ist jetzt
  der nächste Schritt.
- Unverändert offen: Tippfehler in der Support-Mail
  (`help@internetinformatonsdiense.de`), Rechnung `AYGX4AHF-0001`,
  Kontoname ohne Leerzeichen, Zeitzone Paris, kein Webhook.

**Banküberweisung per API (20.11.):** In der Zahlungsmethoden-Konfiguration
`pmc_1UFBJ53gxzXGCjFvyeu5id5v` steht `customer_balance` jetzt auf `on` —
verfügbar ist sie damit nicht (`available: false`), und die Capabilities
`bank_transfer_payments`/`sepa_bank_transfer_payments` bleiben
`unrequested`. Beantragen lässt sich eine Capability des eigenen Kontos
**nicht per API** („only on connected accounts“) — nur im Dashboard unter
Einstellungen → Zahlungsmethoden. Fehlend laut API: Gründungsdatum und die
Identifikationsnummern beider Personen (überfällig), dazu Firmenname,
Steuernummer und Dokument der Gesellschaft.

**Korrektur am selben Tag — Stripes Prüfung ist gescheitert, nicht
abgeschlossen.** Ich hatte „keine offenen Anforderungen, keine Frist“
gemeldet; das war falsch gelesen: `GET /v1/accounts/<id>` liefert für das
eigene Konto **gar kein** `requirements`-Feld, leer hieß „nicht geliefert“.
Maßgeblich sind die Capability-Endpunkte
(`…/capabilities/card_payments`) und der Kontostatus im Dashboard. Dort
(Screenshot von Oliver) stehen zwei aktive Aufgaben, **Frist 01.12.2026,
sonst pausieren Zahlungen und Auszahlungen**:

- „Eigentumsrechte an Ihrem Unternehmen überprüfen“ — das hochgeladene
  Dokument zu den wirtschaftlich Berechtigten ist **kein akzeptierter
  Dokumenttyp** (`verification_document_type_not_supported`).
- „Nachweis über Ihr Unternehmen vorlegen“ — zur **Steuernummer** findet
  Stripe nichts (`verification_failed_other`), und das Firmendokument
  **passt nicht zur angegebenen Nummer**
  (`verification_failed_id_number_match`). Fällig: `company.name`,
  `company.tax_id`, `company.verification.document`.

Stripe bietet als Alternative zu Name + Steuernummer an: Name, Adresse und
ein Nachweis der wirtschaftlich Berechtigten. Naheliegende Ursache (nicht
belegt): Firmenname „Internetinformationsdienste  UG“ gegen die
Registerschreibweise, und Steuernummer statt Handelsregisternummer
(HRB 102734, Amtsgericht Saarbrücken) im Feld. Das Formular „Banküberweisungen
aktivieren“ (Zahlungsmethoden → Banküberweisungen → … → Aktivieren) fragt
genau diese Firmendaten ab: Firmenname laut Register, HRB-Nummer,
Amtsgericht, Registrierungsdatum, danach Identitätsprüfung mit Ausweis und
Selfie. Oliver hat es nicht ausgefüllt — Bernds Daten.

Mail an Bernd dazu: [Mail-Bernd-Stripe-Live-2026-11-20.md](Mail-Bernd-Stripe-Live-2026-11-20.md).
Die Antwort an ihn zur Absender-Domain ging getrennt heraus. **Stand: Warten
auf Bernds Rückmeldung.**

## 6. Nachprüfung 24.11.2026

Per API nachgemessen (Capability-Endpunkte):

- **Bernd hat neu eingereicht:** Die Fehler vom 20.11. sind weg (`errors`
  leer, `currently_due` für Karte leer). Firmenname, Steuernummer,
  Firmendokument, Adresse und Nachweis der wirtschaftlich Berechtigten
  stehen auf **„wird geprüft“** — entschieden hat Stripe noch nicht, die
  **Frist 01.12.** steht weiter im Konto.
- **Neu fällig:** Eine dritte Person ist eingetragen
  (`person_1UfNpP…`), für sie fehlt die **Identitätsprüfung mit Selfie**
  (`verification.proof_of_liveness`) — bereits für die SEPA-Lastschrift
  fällig.
- **Erledigt:** Support-Mail ohne Tippfehler
  (`help@internetinformationsdienste.de`), Firmenname „I² D Internet
  Informationsdienste UG (haftungsbeschränkt)“.
- **Banküberweisung weiter nicht beantragt** (`unrequested`). Fehlend:
  Gründungsdatum, Identifikationsnummern von jetzt **drei** Personen,
  Selfie-Prüfung der dritten.
- Unverändert: Rechnung `AYGX4AHF-0001` offen, Zeitzone Paris, kein
  Webhook.

### Am Abend des 24.11. — Personen bereinigt, Banküberweisung beantragt

- Die dritte Person war **Oliver**: Bernd hatte ihn am 24.11. als
  Kontovertreter eingetragen. Zurückgestellt (mit Bernds Okay, von Oliver
  im Dashboard): **Bernd ist Kontovertreter und Inhaber**, sein doppelter
  Inhaber-Eintrag vom 17.11. ist entfernt, das Land seiner Adresse steht
  auf Frankreich (vorher „Sarreguemines DE“). Oliver bleibt als Person
  **ohne Rolle** gelistet — ein Entfernen-Knopf fehlt, Stripe verlangt für
  ihn nichts; er soll die Rolle später übernehmen („Ändern“).
- **Banküberweisung beantragt:** Gründungsdatum von Oliver eingetragen,
  Steuer-ID von Bernd selbst. `sepa_bank_transfer_payments` ist
  `requested`, Status **`pending`**, nichts mehr fällig; `customer_balance`
  in der Zahlungsmethoden-Konfiguration `available: true`.
  `bank_transfer_payments` (ohne SEPA) bleibt `unrequested` — RoSe nutzt
  `eu_bank_transfer`.
- Alles hängt jetzt an **Stripes Prüfung der Firmenunterlagen**
  (`pending_verification`, Frist 01.12.).
- **Testrechnung `AYGX4AHF-0001` storniert** (per API, `void`).
- **Lehre:** „Personen“ in der API sind die Personen der Gesellschaft
  (Einstellungen → Unternehmen → Kontodetails → „Management und
  Eigentum“), nicht die Teammitglieder unter „Personal und Sicherheit“.
  Auslesen geht per `GET /v1/accounts/<id>/persons`.

## 🔖 Wiederaufnahme

**Stand 24.11. abends:** Bernds Teil ist erledigt. Warten auf Stripes
Prüfung; nachmessen, ob `pending_verification` leer und
`sepa_bank_transfer_payments` `active` ist — dann Abschnitt 3. Die Punkte
1 und 2 unten sind damit überholt.

Gespräch mit Bernd am 18.11. Für ihn offen, ohne Eile: Tippfehler in der
Support-Mail, Testrechnung `AYGX4AHF-0001` stornieren, Leerzeichen im
Kontonamen, Zeitzone Berlin.

1. **Bernd, bis 01.12.:** die zwei Aufgaben unter „Kontostatus“ (Abschnitt 5,
   „Korrektur“) — Firmenname laut Register, HRB 102734, akzeptierte
   Dokumente. Nachmessen über `…/capabilities/card_payments`:
   `currently_due` und `errors` leer.
2. Banküberweisung unter den Zahlungsmethoden aktivieren — **nur im
   Dashboard**, per API geht es nicht (Abschnitt 5). Dann
   erscheint unter „Kontostatus“ eine neue Aufgabe für Bernd:
   Gründungsdatum 28.10.2015 und die Steuer-IDs beider Personen.
3. Wenn beide Zahlungsarten `active` sind: Abschnitt 3.
