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

## 🔖 Wiederaufnahme

Gespräch mit Bernd am 18.11. Für ihn offen, ohne Eile: Tippfehler in der
Support-Mail, Testrechnung `AYGX4AHF-0001` stornieren, Leerzeichen im
Kontonamen, Zeitzone Berlin.

1. Warten, bis Stripe die zwei Prüfungen abschließt (Frist 01.12.).
   Nachmessen: `GET /v1/accounts/acct_1UFBIU3gxzXGCjFv/capabilities/sepa_debit_payments`
   mit dem Live-Schlüssel aus `.env.live` — `active` und
   `pending_verification` leer.
2. Banküberweisung unter den Zahlungsmethoden aktivieren (Dashboard). Dann
   erscheint unter „Kontostatus“ eine neue Aufgabe für Bernd:
   Gründungsdatum 28.10.2015 und die Steuer-IDs beider Personen.
3. Wenn beide Zahlungsarten `active` sind: Abschnitt 3.
