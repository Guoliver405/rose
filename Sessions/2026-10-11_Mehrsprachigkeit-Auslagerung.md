# Mehrsprachigkeit vorbereiten: Begriffe entscheiden, Texte auslagern (03.–11.10.2026)

## Inhalt

1. Bestand und Glossar
2. Begriffs-Entscheidungen im Dialog
3. Auslagerung: Bauweise
4. Auslagerung: Bereiche und Commits
5. Was dabei nebenbei behoben wurde
6. Offen
7. Wiederaufnahme

## 1. Bestand und Glossar (03.10.)

Maschinelle Erhebung aller Oberflächentexte aus `src/` (TypeScript-Compiler-API, Skript lag im Scratchpad):
rund **3.800 Textstellen, 31.000 Wörter, 578 zerstückelte Sätze** (JSX-Sätze, die durch `<strong>`, Links oder
Werte geteilt sind). Gut die Hälfte der Wörter steckt in Fließtexten (Hilfe, Lotsen, Landing, Rechtstexte).
Daraus [Glossar-Oberflaeche-2026-10-03.xlsx](Glossar-Oberflaeche-2026-10-03.xlsx): 98 Kernbegriffe mit
Schreibweisen, Häufigkeit, Fundstellen.

## 2. Begriffs-Entscheidungen (10.10.)

Das Excel-Blatt war dem User zu umständlich („in der Liste fehlt mir der Dialog“). Stattdessen: rund 60
unkritische Begriffe vorab aussortiert, die übrigen in **13 Punkten nacheinander besprochen**, je mit Bestand,
Vorschlag und Rückfrage. Ergebnis in [Begriffe-Entscheidungen.md](Begriffe-Entscheidungen.md) — dort auch,
welcher Bereich wann umgesetzt wurde. Spätere Ergänzungen des Users (11.10.): Navigation heißt **„Anfragen“**
(wie die Seite dahinter), „Tägl. Reinigung“ als Achsenbeschriftung, „liefern direkt zu uns ins Haus“, „Je Kraft“,
„Bitte nicht stören: 0“ als Kennzahl, „Die **Registrierung** als Hotel …“ statt „Anmeldung als Hotel“.

## 3. Bauweise

Siehe AGENTS.md „Texte in Sprachdateien — Mehrsprachigkeit“. Kurz:

- **Keine Bibliothek**, Muster der Next.js-Doku: je Sprache typisierte Objekte unter `src/lib/i18n/<sprache>/`,
  `format()` für `{platzhalter}`, `plural()` über `Intl.PluralRules`, `<Rich>` für Sätze mit `<b>`/`<link>`.
- Sprache der Anfrage an **einer** Stelle: `getLocale()` in `src/utils/locale.ts` (heute immer `de`).
- Server-Seiten holen `getMessages(locale).<bereich>` und geben Ausschnitte als Prop `m` an Client-Komponenten;
  Server-Actions über eine Funktion `messages()`.
- **Client-Komponenten importieren nie Werte aus `@/lib/i18n`** (zöge alle Sprachdateien ins Bundle) — nur
  `@/lib/i18n/format`, `@/lib/i18n/langs` und Typen. Für zwei überall verwendete Widgets (Mail-Statuszeile,
  Leiste „Ungespeicherte Änderungen“) reicht das Root-Layout einen kleinen Ausschnitt über `MessagesProvider`.
- I/O-freie Rechenlogik (`cleaning-sim`, `sim-log`, `vat`, `logo`, `service-link-templates`, `demand`) bekommt
  Texte als Parameter oder liefert Schlüssel; der Simulator-Worker bekommt sie im Feld `texts`.
- **Gedruckte Blätter haben eigene Sprachen** (de/en/es/fr, `sheets.ts`), die Legende liest die Knopf-Namen
  aus der Sprachdatei des Gästeportals.
- **Wächter-Tests** halten die Entscheidungen fest: `guest.test.ts`, `service.test.ts`, `print-mail.test.ts`,
  `admin.test.ts` (Rezeption, Anmeldung, Konto, Simulator, Zimmer-Symbole).

## 4. Bereiche und Commits

| Bereich | Sprachdatei | Commit |
|---|---|---|
| Gästeportal | `de/guest.ts` | `deac7e0` |
| Reinigungsboard | `de/service.ts` | `9dac7fe` |
| Druckblätter, Mails | `<sprache>/sheet.ts`, `de/print.ts`, `de/mail.ts` | `1897979` |
| Rezeption, Zimmer-Symbole | `de/admin/*`, `de/symbols.ts` | `84297a9` |
| Anmeldung, Registrierung, Passwort | `de/auth.ts` | `803b3e3` |
| Konto | `de/account/*` | `3aea9ae` |
| Simulator | `de/simulator/*` | `95694a9` |

Rezeption, Konto und Simulator wurden von parallelen Helfern umgestellt (je eigene Sprachdatei, gemeinsame
Arbeitsanweisung), danach zusammen geprüft: verify, Integrationstests (66 grün), Wächter-Test, Build, Browser
lokal (Stripe-Testkonto `zz-stripe-test@rose.local`, Test-Reinigungskraft und Test-Aufenthalt in „Hotel zum
Glück“). Stand am Ende: 477 Unit-Tests grün.

## 5. Nebenbei behoben

- Gast-Zugangs-Mail: Betreff, Anrede, Knopf jetzt in der Sprache des Hauses (vorher fest Deutsch über einer
  englischen Anleitung).
- Veraltete Hinweise: Registrierung behauptete, Passwort-Zurücksetzen sei nicht eingerichtet; Linkfehler
  verlangten „denselben Browser“ (beides seit 12.09. falsch).
- Du-Ausreißer in Verwaltung und Gästeportal (Passwortwechsel, „Neues Passwort“).
- Einzahl/Mehrzahl („1 Zimmer sind belegt“, „auf 1 Etagen“), Aufzählungen über `Intl.ListFormat`.
- Gast-Knopf „Melden“ statt „Bestellen“ bei einer Meldung ans Haus.
- Sprachwahl der Blätter zog alle Sprachdateien ins Browser-Bundle (`i18n/langs.ts`).

## 6. Offen

- **Fließtexte**: Hilfe (`hilfe.ts`), Lotsen (`lotsen.ts`, auch die Texte des Einrichtungs-Bands), Landing Page
  (inkl. `landing/CleaningSimulation.tsx` mit Legende/Spaltentiteln des Tagesbilds — dort noch „Kollegin“ und
  „Nicht stören“ —, `RoiCalculator`/`roi.ts`), Rechtstexte. Mit ihnen verschwinden die alten Seitennamen
  („Hotel & Regeln“, „Gäste-Zugang“, „Services-Board“), die in Hilfe und Lotsen noch stehen.
- **Frage an den User**: Rechtstexte vorerst nur Deutsch lassen (Übersetzung braucht juristische Prüfung) oder
  trotzdem auslagern?
- Zimmer-Symbole (`room-symbols.ts`) lesen `de/symbols.ts` noch fest — Umstellung auf die Sprache der Anfrage mit
  der Hilfe.
- Rollennamen „Rezeption“/„Manager“ in der Einladungs-Mail; Stripe-Werte `locale: 'de'`/`preferred_locales`;
  Seed-Daten `service-templates.json`.
- Danach: Sprachwahl des Gastes in `getLocale()` und erste Übersetzung (Englisch) des Gästeportals;
  Liste zum Gegenlesen aus den Sprachdateien erzeugen (`flattenMessages`).
- Nebenbefund: Das Stripe-Testkonto zeigt „No such customer“ (Kunde aus der alten Sandbox vor dem 13.09.).

## 7. Wiederaufnahme

Nächster Schritt: **Fließtexte** auslagern, Reihenfolge Hilfe + Lotsen (gemeinsamer Katalog, Anker-Test
`lotsen.anchors.test.ts` beachten) → Landing Page (mit Tagesbild-Komponente) → Rechtstexte (Entscheidung des
Users abwarten). Die Arbeitsanweisung für Helfer lag im Scratchpad der Sitzung vom 10./11.10. und ist
verloren; die Regeln stehen vollständig in AGENTS.md und in diesem Protokoll (Abschnitt 3), die Begriffe in
`Begriffe-Entscheidungen.md`. Vor dem Start `npm run verify` und einen Blick auf `src/lib/i18n/index.ts`.
