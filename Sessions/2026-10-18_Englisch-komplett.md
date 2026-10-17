# Englisch komplett (17.–18.10.2026)

Die ganze Anwendung spricht jetzt Deutsch und amerikanisches Englisch. Ausnahmen mit Absicht: die Rechtstexte (bis zur anwaltlichen Prüfung) und das Vorschaubild für geteilte Links (Crawler schicken keine Sprache). Einzelheiten zu jedem Bereich stehen in `AGENTS.md` unter den Punkten „… auf Englisch“.

## 1. Was gebaut wurde

| Bereich | Sprachdatei | Sprache folgt |
|---|---|---|
| Gästeportal | `en/guest.ts` | `getGuestLocale`: eigene Wahl → Gerät → Rückfallsprache des Hauses → Deutsch |
| Reinigungsboard | `en/service.ts` | `getServiceLocale`: wie Gast (Gerät, nicht Haus) |
| Rezeption, Mails, Druckseiten | `en/admin/`, `en/mail.ts`, `en/print.ts` | `getAdminLocale`: eigene Wahl („Mein Zugang“) → Gerät → Deutsch |
| Hilfe und Lotsen, Zimmer-Symbole | `en/help/`, `en/symbols.ts` | `getAdminLocale` |
| Konto und Abrechnung | `en/account/` | `getAdminLocale`; Stripe-Eingabefeld in der Sprache der Seite |
| Anmeldung, Registrierung, Passwort | `en/auth.ts` | `getAdminLocale`; Passwort-Mail in der Sprache der Seite |
| Simulator samt Tagesbild | `en/simulator/`, `en/landing/day.ts` | `getAdminLocale` |
| Landing Page | `en/landing/` | `getAdminLocale`; Preise im Format der Sprache |
| Fußzeile der Rechtstexte | `en/legal.ts` (`common`) | `getAdminLocale`, Links mit „(German)“ |
| Rechnungen | `account.billing.invoice` | **Land der Rechnungsanschrift** (`invoiceLocale`): DE, AT, CH, LI Deutsch, sonst Englisch |

Dazu am 17.10.: Heimat- und Rückfallsprache je Haus, mehrsprachiger Service-Baukasten (Self-Service, keine automatische Übersetzung), Währung je Haus, Bewertungslink im Gästeportal.

## 2. Entscheidungen des Users

- **Amerikanisches Englisch**, Komma vor dem letzten Glied, Punkt und Komma innerhalb der Anführungszeichen (außer bei wörtlichen Werten). Wächter `en-style.test.ts`.
- **Vorschläge des Gegenlesers kritisch prüfen**, nur Verbesserungen übernehmen. Er kennt das Projekt nicht: verrutschte Zeilen, Kürzungen mit Inhaltsverlust, „schedule“ für „frühestens ab“ (verspricht einen Termin).
- **Gegenlesen nur als Differenz:** `translation-sheet.py all en <aus> --since <gegengelesene Datei>`. Schlussrunde am 18.10. ohne Beanstandung; Stand für künftige Differenzen `Sessions/Uebersetzung-en-gegengelesen-2026-10-18.xlsx` (3104 Texte).
- **Rechnungssprache nach Land der Rechnungsanschrift** (18.10.), keine eigene Einstellung.
- **Werbe-Einwilligung des Simulators je Sprache eine eigene Fassung** (`MARKETING_TEXT_VERSIONS`, englisch `2026-10-18-en`).
- **Erst Englisch testen, dann weitere Sprachen** (18.10.).

## 3. Kleinigkeiten vom 18.10.

- Sprachauswahl im Dark Mode war weiß auf weiß (native Liste ohne eigene Farben) — `select` und `option` tragen jetzt `bg-surface-elevated text-ink`.
- Verweis-Vorlagen im Service-Baukasten füllen Name und Beschreibung in der **Heimatsprache des Hauses** vor (sie werden zum Grundtext), Regionen und Hinweise in der Sprache der Oberfläche.
- Simulierte Reinigungskräfte heißen „Housekeeper A“, Pronomen neutral.
- Produktname englisch „Housekeeping Simulator“ (ohne Bindestrich), Rechtstexte behalten den deutschen Namen.

## 4. Offen

- Rechtstexte englisch erst nach der anwaltlichen Prüfung.
- Weitere Sprachen im Gästeportal (die Blätter können schon es/fr) — **erst nach dem Test des Sprachwechsels mit Englisch**.

## 🔖 Wiederaufnahme

Nächster Schritt ist ein **Test des Sprachwechsels mit Englisch durch den User** (alle drei Portale, Umschalter, Mails, Druckblätter, Rechnung bei einer Anschrift außerhalb des deutschsprachigen Raums). Danach weitere Sprachen: neue Sprache in `GUEST_LOCALES`/`ADMIN_LOCALES`/`SERVICE_LOCALES` (`src/lib/i18n/locales.ts`), Dateien unter `src/lib/i18n/<sprache>/` mit `satisfies Shape<…>`, Wächter-Tests nach dem Muster der `*-en.test.ts`, Gegenlese-Tabelle mit `translation-sheet.py all <sprache>`.
