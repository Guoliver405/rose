# Schlussrechnung beim Löschen des Kontos – 11.10.2026

Anlass: Beim Gegenlesen der Hilfe fiel auf, dass das Löschen eines Kontos den
angebrochenen Monat unberechnet ließ. § 7 AGB sagt, dass die Kündigung zum
Monatsende wirkt, auch durch Löschen des Kontos, und dass die Vergütung des
Löschmonats geschuldet bleibt (Abs. 2). `deleteAccountData` löschte aber Häuser,
Stripe-Kunden und `accounts` sofort. Der Monatslauf am Ersten fand danach kein
Konto mehr.

## Entscheidung (mit dem User)

| Variante | Ergebnis |
|---|---|
| (a) Schlussrechnung beim Löschen | **gewählt** |
| (b) Löschen zum Monatsende vormerken | verworfen: bricht „Daten sofort weg“, braucht einen zweiten Cron-Lauf |
| (c) nur den Text ändern | verworfen: § 7 Abs. 2 ist richtig, der Code hielt ihn nicht ein |

Zweite Frage: Was passiert mit dem Stripe-Kunden, wenn die Schlussrechnung
offen bleibt? Er **bleibt stehen**, bis die Rechnung erledigt ist.

## Umsetzung

- `settleAccountBeforeDeletion` ([invoicing.ts](../src/utils/invoicing.ts)) läuft
  als Erstes in `deleteAccountData`. Er stellt den Vormonat in Rechnung, falls der Cron noch
  nicht lief, und den laufenden Monat mit live gezählten Zimmern
  (`ensureInvoiceForPeriod(…, { rooms })`). Freimonat und Mindestbetrag regelt
  `billingLine`, 0 € ergibt keine Rechnung. Ohne Stripe-Schlüssel passiert nichts.
- **Scheitert die Rechnung, wird nicht gelöscht**, etwa wenn die Rechnungsdaten
  fehlen. Die Meldung führt zu „Plan & Abrechnung“. Eine Spiegel-Zeile des
  laufenden Monats ohne Stripe-ID wird wieder entfernt, sonst fröre sie dessen
  Zimmerzahl ein, falls das Konto bestehen bleibt.
- **Stripe-Kunde:** Er wird nur gelöscht, wenn keine Rechnung des Kontos mehr
  offen ist. Sonst entfernt ihn der Stripe-Webhook (`aufraeumenNachLoeschung`),
  sobald die letzte Rechnung bezahlt, storniert oder uneinbringlich ist und das
  Konto nicht mehr existiert.
- **Dialog** ([DatenLoeschen.tsx](../src/app/admin/DatenLoeschen.tsx)): Er nennt
  vorher Monat, Betrag und Zimmerzahl (`finalBillPreview`), im Freimonat steht
  stattdessen „nichts mehr berechnet“. Nach dem Löschen zeigt er bei offener
  Rechnung deren Zahlungsseiten an, statt sofort auf `/login` zu wechseln, denn
  danach gibt es keine Konto-Seite mehr.
- Texte: `account/houses.ts` (Hinweis, Fehlermeldung, Abschluss) und die Hilfe
  `haeuser` und `konto`.
- Test: [final-invoice.test.ts](../tests/integration/final-invoice.test.ts) mit
  Fake-Gateway und `vi.mock` für `deleteStripeCustomer`. Geprüft werden Freimonat,
  fehlende Rechnungsdaten (nicht gelöscht, keine Zeile für den laufenden Monat),
  Überweisung (zwei Rechnungen, Kunde bleibt, Zahlungsseiten zurückgegeben) und
  Karte (bezahlt, Kunde wird gelöscht).

## Nicht geprüft

- Der Dialog wurde nicht im Browser angesehen. Der Hinweis erscheint nur mit
  Stripe-Schlüsseln, und eine Probe-Löschung braucht ein Wegwerfkonto in
  Produktion (GUI-Katalog, C+M).
- Ob Stripe die Rechnung zusätzlich per E-Mail zustellt, hängt von den
  Dashboard-Einstellungen ab. Die Texte versprechen das deshalb nicht.

## Offen (Folgeaufgabe)

Beim Löschen eines einzelnen **Hauses** oder **Zimmers** fehlt dessen
laufender Monat weiterhin in der späteren Rechnung. `ensureBillingSnapshots`
schreibt nur abgeschlossene Monate fest, und die Hilfe zu Zimmern sagt bisher
nur „abgeschlossene Monate liegen fest“.
