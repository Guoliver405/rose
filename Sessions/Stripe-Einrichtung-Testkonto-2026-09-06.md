# Stripe-Testkonto einrichten — Anleitung

Stand 06.09.2026, gegen die aktuelle Stripe-Dokumentation geprüft
(Sandboxes, API-Schlüssel, Tax, Banküberweisung, Rechnungseinstellungen,
Kunden-Mails, Webhooks). Menübezeichnungen sind die der deutschen
Dashboard-Oberfläche; die Links führen direkt auf die jeweilige Seite.
Stripe baut das Dashboard laufend um — wenn ein Menüpunkt anders heißt, hilft
das Suchfeld oben im Dashboard mit dem Begriff aus der Überschrift.

Zwei Dinge vorweg:

- **Sandbox statt „Testmodus".** Stripe hat den alten Testmodus-Schalter durch
  *Sandboxes* ersetzt: eine isolierte Testumgebung mit eigenen Schlüsseln
  (`sk_test_…`, `pk_test_…`) und eigenen Einstellungen. Alles Folgende passiert
  **in der Sandbox**, nicht im Live-Konto. Ein Banner oben im Dashboard zeigt
  an, dass man sich in einer Sandbox befindet.
- **Keine Firmendaten nötig.** Die Sandbox funktioniert ohne Verifizierung des
  Unternehmens. Verifizierung ist erst für den Live-Modus fällig und dann
  Sache der I²D UG.

---

## 1. Konto anlegen (5 Minuten)

1. https://dashboard.stripe.com/register — E-Mail, Name, Passwort, Land
   **Deutschland**. Ein eigenes Passwort nur für Stripe verwenden.
2. Bestätigungs-Mail anklicken.
3. Beim ersten Login fragt Stripe nach dem Unternehmen („Konto aktivieren").
   **Überspringen** — die Sandbox braucht das nicht. Gegebenenfalls „Später"
   oder direkt zum Dashboard.
4. Empfohlen: Zwei-Faktor-Authentifizierung einschalten (Profil oben rechts →
   **Nutzereinstellungen**), Passkey oder Authenticator-App.

## 2. Sandbox öffnen (2 Minuten)

1. Oben links auf die **Kontoauswahl** (Firmen- bzw. Kontoname) klicken →
   **Zu Sandbox wechseln**.
2. Gibt es schon eine Sandbox, diese **Öffnen**. Sonst **Sandbox erstellen**:
   Name `RoSe Test`, Option **Konto von Grund auf neu erstellen** (es gibt
   noch nichts zu kopieren) → **Sandbox erstellen**.
3. Prüfen: Oben steht ein Sandbox-Banner. Alles Weitere in dieser Sandbox.

## 3. API-Schlüssel holen und eintragen (5 Minuten)

1. In der Sandbox: https://dashboard.stripe.com/test/apikeys (oder Suchfeld:
   „API-Schlüssel"; liegt unter **Entwickler / Workbench → API-Schlüssel**).
2. **Veröffentlichbarer Schlüssel** `pk_test_…` — kopieren.
3. **Geheimschlüssel** `sk_test_…` — in der Sandbox jederzeit anzeigbar,
   **Anzeigen** → kopieren. (Stripe empfiehlt eingeschränkte Schlüssel; für
   die Sandbox genügt der Standard-Geheimschlüssel.)
4. In `.env.local` eintragen:

```
STRIPE_SECRET_KEY=sk_test_…
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…
```

5. In Vercel (Production) setzen — aus **Git Bash**, wie in AGENTS.md
   beschrieben, damit kein Unicode-Müll in den Wert gerät:

```bash
printf '%s' 'sk_test_…' | vercel env add STRIPE_SECRET_KEY production --sensitive
```

```bash
printf '%s' 'pk_test_…' | vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
```

Der Webhook-Secret (`STRIPE_WEBHOOK_SECRET`) kommt erst in Abschnitt 9.

## 4. Öffentliche Unternehmensinformationen (3 Minuten)

Diese Angaben stehen auf Rechnungen, Belegen und Mails. In der Sandbox sind es
Sandbox-Daten, im Live-Konto später die der UG.

1. https://dashboard.stripe.com/settings/public (Suchfeld: „Öffentliche
   Unternehmensinformationen").
2. **Unternehmensname**: `RoSe – RoomService` · **Support-E-Mail**:
   `info@internetinformationsdienste.de` · **Website**:
   `https://rose-roomservice.app` · **Zahlungsbeschreibung** (steht auf dem
   Kontoauszug des Kunden): `ROSE ROOMSERVICE`.
3. Speichern.

Optional **Branding**: https://dashboard.stripe.com/account/branding —
Symbol (quadratisch, PNG, ≥ 128 px), Markenfarbe. Gilt für Rechnungs-PDF,
Zahlungsseite und Mails.

## 5. Stripe Tax aktivieren (10 Minuten)

1. https://dashboard.stripe.com/settings/tax (Suchfeld: „Steuer") →
   **Jetzt starten**.
2. **Hauptsitz** prüfen/eintragen: `Saarbrücker Straße 92, 66130 Saarbrücken,
   Deutschland` (in der Sandbox frei eintragbar).
3. **Voreingestellter Produktsteuercode**: suchen nach
   **„Software as a service (SaaS) – business use"** (Code
   `txcd_10103001`). Das ist der Standard für alle Rechnungspositionen; ein
   eigenes Produkt in Stripe ist damit **nicht** nötig.
4. **Steuerverhalten** (Preise enthalten Steuern?): **Exklusive** — unsere
   Preise sind netto, Stripe schlägt die Steuer auf.
5. **Registrierung hinzufügen**: https://dashboard.stripe.com/tax/locations
   (Reiter **Standorte**) → **Registrierung hinzufügen** → Land
   **Deutschland** → Typ Umsatzsteuer (Standard) → gültig ab heute →
   speichern. In der Sandbox verlangt Stripe keinen Nachweis. Ohne diese
   Registrierung rechnet Stripe für deutsche Kunden **0 %** — das ist die
   häufigste Fehlerquelle.
6. Unter **Integrationen** (settings/tax/integrations) prüfen, dass
   „Rechnungsstellung" aktiv ist. RoSe setzt zusätzlich je Rechnung
   `automatic_tax.enabled = true`.

Reverse Charge für EU-Firmen und „nicht steuerbar" für Drittländer folgen
daraus automatisch, sobald der Kunde eine Adresse und (EU) eine gültige
USt-IdNr. hat — beides legt RoSe am Stripe-Kunden an.

## 6. Zahlungsmethoden (3 Minuten)

1. https://dashboard.stripe.com/settings/payment_methods (Suchfeld:
   „Zahlungsmethoden").
2. Einschalten: **Karten** (meist schon an), **SEPA-Lastschrift**,
   **Banküberweisung**. Alles andere kann aus bleiben.
3. Die Banküberweisung muss hier aktiv sein, sonst kann RoSe sie später nicht
   auf die Rechnung setzen (die Rechnungseinstellungen bieten sie als
   Standard nur für USD/GBP an; für Euro-Rechnungen setzt RoSe sie je
   Rechnung per API — das ist so vorgesehen).

## 7. Rechnungseinstellungen (10 Minuten)

https://dashboard.stripe.com/settings/billing/invoice (Suchfeld:
„Rechnungen" unter Einstellungen → Abrechnung).

1. **Rechnungsnummerierung**: **fortlaufend auf Kontoebene** (EU-Standard,
   sollte voreingestellt sein). **Präfix** auf `RS` setzen (1–12
   Großbuchstaben/Zahlen) → Nummern lauten `RS-0001`, `RS-0002`, …
   **Nächste Rechnungsnummer** auf `0001` lassen.
2. **Standard-Zahlungsbedingungen**: Zahlung fällig **14 Tage** nach
   Versand; Haken bei „Link zur Zahlungsseite in die Rechnungs-E-Mail
   aufnehmen".
3. **Standardfußzeile** (steht auf jedem PDF):
   `I²D UG (haftungsbeschränkt) · Geschäftsführer Bernd Köhl · Amtsgericht
   Saarbrücken HRB 102734 · USt-IdNr. DE434570609 · Zahlbar innerhalb von
   14 Tagen ohne Abzug.`
4. **Standardvermerk** (Memo, optional): `Vielen Dank für die Nutzung von
   RoSe. Fragen: info@internetinformationsdienste.de`
5. **Steuerinformationen für Rechnungen** (weiter unten auf derselben Seite,
   ggf. unter settings/billing/invoices/general): Steuer-ID hinzufügen, Typ
   **EU-USt-IdNr. (eu_vat)**, Wert `DE434570609`, als Standard markieren —
   damit steht die USt-IdNr. der UG im Rechnungskopf.
6. **Erweiterte Rechnungsfunktionen** (auf derselben Seite): Erinnerungen
   für **unbezahlte einmalige Rechnungen** einschalten, Zeitplan z. B.
   **3, 7 und 14 Tage nach Fälligkeit**. (Unsere Monatsrechnungen sind aus
   Stripe-Sicht einmalige Rechnungen, keine Abonnements.)
7. **Anpassungen und Abgleich**: „Teilweise Banküberweisungen automatisch
   abgleichen" **an**; „Rechnungen automatisch abschreiben" mit kleiner
   Schwelle (z. B. 0,50 €) **an**, damit eine Überweisung mit Cent-Abweichung
   die Rechnung schließt.

## 8. Kunden-Mails (5 Minuten)

1. https://dashboard.stripe.com/settings/billing/automatic (Einstellungen →
   Abrechnung → **Abonnements und E-Mails**):
   - **Fertige Rechnungen und Stornorechnungen an Kunden versenden**: an.
   - **E-Mails senden, wenn Kartenzahlungen fehlschlagen**: an.
   - **Smart Retries** / automatische Wiederholung fehlgeschlagener
     Einzüge: an, Standardzeitplan.
   - **E-Mails über ablaufende Karten senden**: an.
   - Zahlungsmethoden-Aktualisierung: **von Stripe gehostete Seite** (der
     Kunde kann seine Karte über den Link in der Mail selbst erneuern; RoSe
     bekommt das per Webhook mit).
2. https://dashboard.stripe.com/settings/emails (Einstellungen → Geschäft →
   **E-Mails an Kunden**): **Erfolgreiche Zahlungen** (Belege) an;
   **Zahlungsanweisungen für Banküberweisungen** an.
3. **Wichtig für den Test:** In einer Sandbox verschickt Stripe Kunden-Mails
   **nur an Adressen, die mit dem Stripe-Konto verknüpft sind**. Wer die
   Rechnungs-Mails sehen will, registriert das RoSe-Testkonto mit der Adresse
   des Stripe-Logins (oder fügt weitere Adressen im Stripe-Profil hinzu).
   Absender ist zunächst Stripe im Namen des Unternehmensnamens aus
   Abschnitt 4; eine eigene Absender-Domain (Einstellungen → E-Mail-Domain)
   braucht DNS-Einträge bei Porkbun und ist etwas fürs Live-Konto.

## 9. Webhook — erst wenn Schritt 2 des Bauplans deployt ist

1. https://dashboard.stripe.com/webhooks (Workbench → Reiter **Webhooks**) →
   **Ereignisziel erstellen**.
2. Ereignisse auswählen: `invoice.finalized`, `invoice.paid`,
   `invoice.payment_failed`, `invoice.marked_uncollectible`,
   `invoice.voided`, `setup_intent.succeeded`, `payment_method.detached`,
   `customer.tax_id.updated`, `cash_balance.funds_available`.
3. Zieltyp **Webhook-Endpoint**, URL
   `https://rose-roomservice.app/api/stripe/webhook`, API-Version: die
   Standardversion des Kontos.
4. Nach dem Anlegen: **Signaturgeheimnis** → **Zum Anzeigen klicken** →
   `whsec_…` → `.env.local` und Vercel als `STRIPE_WEBHOOK_SECRET`
   (Git-Bash-`printf`-Muster), danach Redeploy.
5. Zustellungen prüfen: Endpoint anklicken → Reiter **Übermittlungen von
   Events**. In der Sandbox versucht Stripe drei Zustellungen innerhalb
   weniger Stunden; **Erneut senden** geht bis 15 Tage.

## 10. Testdaten für den Durchlauf

| Was | Wert |
|---|---|
| Karte, Erfolg | `4242 4242 4242 4242`, beliebiges Datum in der Zukunft, CVC `123` |
| Karte, Einzug schlägt fehl | `4000 0000 0000 0341` (hinterlegen klappt, Abbuchung scheitert) |
| SEPA-Lastschrift, Erfolg | IBAN `DE89 3704 0044 0532 0130 00` |
| SEPA, Rücklastschrift | IBAN `DE62 3704 0044 0532 0130 00` |
| USt-IdNr. EU (Reverse Charge) | z. B. `ATU12345678` mit Land Österreich; Stripe simuliert die Prüfung |
| Banküberweisung simulieren | Stripe-Dashboard → **Kunden** → Kunde öffnen → **Zahlungsmethoden** → **Hinzufügen** → **Geld überweisen (nur Test)** → Betrag der offenen Rechnung |

## 11. Reihenfolge

Abschnitte 1–3 **vor** Schritt 1 des Bauplans (Kunde und Zahlungsweg).
Abschnitte 4–8 vor Schritt 2 (Monatslauf und Rechnungen). Abschnitt 9,
sobald der Webhook-Endpunkt deployt ist. Alles in einer Sitzung dauert etwa
eine Dreiviertelstunde.

Für den späteren Wechsel auf das UG-Konto wiederholt Bernd die Abschnitte
4–9 im **Live-Modus** seines Kontos, zusätzlich: Unternehmen verifizieren,
Bankkonto für Auszahlungen, Gläubiger-ID für SEPA (Stripe beantragt sie bei
Aktivierung der Lastschrift mit), Steuer-Registrierung mit echter USt-IdNr.
