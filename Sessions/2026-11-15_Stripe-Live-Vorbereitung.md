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

## 🔖 Wiederaufnahme

Warten auf Bernd (Abschnitt 2, Punkt 1). Prüfen, ob es so weit ist:
`GET /v1/account/capabilities` mit dem Live-Schlüssel —
`sepa_debit_payments` und `sepa_bank_transfer_payments` müssen ohne
`currently_due` dastehen. Dann Abschnitt 3.
