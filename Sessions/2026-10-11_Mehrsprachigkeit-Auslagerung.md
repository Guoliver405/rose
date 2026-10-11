# Mehrsprachigkeit vorbereiten: Begriffe entscheiden, Texte auslagern (03.–11.10.2026)

## Inhalt

1. Bestand und Glossar
2. Begriffs-Entscheidungen im Dialog
3. Auslagerung: Bauweise
4. Auslagerung: Bereiche und Commits
5. Was dabei nebenbei behoben wurde
6. Offen
7. Wiederaufnahme
8. Nachtrag: Fließtexte (Hilfe, Lotsen, Landing, Rechtstexte)

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

- Rollennamen „Rezeption“/„Manager“ in der Einladungs-Mail; Stripe-Werte `locale: 'de'`/`preferred_locales`;
  Seed-Daten `service-templates.json`.
- Sprachwahl des Gastes in `getLocale()` und erste Übersetzung (Englisch) des Gästeportals; Liste zum
  Gegenlesen aus den Sprachdateien erzeugen (`flattenMessages`).
- Rechtstexte: anwaltliche Prüfung steht weiter aus; eine Übersetzung erst danach.
- Nebenbefund: Das Stripe-Testkonto zeigt „No such customer“ (Kunde aus der alten Sandbox vor dem 13.09.).

## 7. Wiederaufnahme

**Stand:** Die ganze Oberfläche steht in deutschen Sprachdateien (`src/lib/i18n/de/**`), die erklärenden Texte
sind gegengelesen (Abschnitt 9), alles gepusht. Übersetzt ist noch nichts – die einzige Ausnahme sind die
gedruckten Blätter (`src/lib/i18n/{en,es,fr}/sheet.ts`), die schon vorher viersprachig waren.

**Nächster Schritt – frische Sitzung: erste Übersetzung.** Vorschlag zum Einstieg, mit dem User zu klären:

1. **Reihenfolge:** Gästeportal auf Englisch zuerst (`en/guest.ts` mit `satisfies Shape<GuestMessages>`,
   Eintrag in `MESSAGES` und `LOCALES` in `src/lib/i18n/index.ts`, `intlLocale` ergänzen). Es ist die Fläche
   mit den meisten Sprachen und braucht als einzige eine Sprachwahl je Gast.
2. **Sprachwahl des Gastes** in `getLocale()` (`src/utils/locale.ts`): eigene Wahl im Portal (Cookie) vor
   `Accept-Language`, unabhängig von der Sprache des Hauses. Offen: Wo steht der Umschalter (Kopf des Portals?),
   gilt er auch für Anmeldeseite und Hinweisseiten, bleibt er nach dem Check-out erhalten?
3. **Zusammenspiel mit den Blättern:** Die Legende des Check-in-Blatts liest die Knopf-Namen aus der Portal-
   Sprache (`portalLocale` in `sheets.ts`, heute fest Deutsch). Sobald das Portal Englisch kann, muss
   entschieden werden, welche Portal-Sprache die Legende zeigt.
4. **Wer übersetzt, wer prüft:** Claude entwirft, der User (oder Muttersprachler) liest gegen. Liste zum
   Gegenlesen aus `flattenMessages` erzeugen (de neben en).
5. Danach Reinigungsboard (Kräfte sprechen oft andere Sprachen), dann Verwaltung; Rechtstexte erst nach der
   anwaltlichen Prüfung der deutschen Fassung.

**Arbeitsweise:** pro Schritt lokal committen, am Ende der Runde einmal pushen – vorher `npm run verify` **und**
`npm run test:integration` (Integrationstests prüfen teils Meldungstexte). Wächter-Tests in
`src/lib/i18n/*.test.ts` gelten für Deutsch; für weitere Sprachen eigene Regeln (Typografie der Sprache)
festlegen. Lokale Prüfung mit dem Testkonto `zz-stripe-test@rose.local` (Haus „stripe-testhaus“).

## 8. Nachtrag 11.10.: Fließtexte

Fortsetzung am selben Tag, Aufteilung: Hilfe und Lotsen selbst, Nachbauten, Landing Page und Rechtstexte
je ein Helfer, danach gemeinsam geprüft.

- **Hilfe und Lotsen** (`de/help/`): Die beiden Kataloge per Skript getrennt – `lotsen.ts` und `hilfe.ts`
  tragen nur noch Rahmen (Pfade, Anker, Szenen, Rollen, Reihenfolge), die Texte stehen in
  `topics.ts`/`lotsen.ts` der Sprachdatei. Schritt-Texte hängen am Anker, eigener `key` nur bei fünf
  Schritten (ohne Anker oder mit fremdem). Tests halten beide Richtungen fest (jeder Schritt hat Text, kein
  Text ohne Schritt; keine Themen-Texte ohne Thema). Einrichtungs-Checkliste und -Band bekommen ihre Texte
  als `SetupTexts`. Knopf, Leiste und Karte lesen über `HelpMessagesProvider` aus dem Rahmen.
  Begriffe: 355 Fundstellen, gut 270 mechanisch (Strich, Anführungszeichen, Gästeportal, Check-in-Blatt,
  Zugangskarte, Schieber, Eintrag, E-Mail), der Rest von Hand (Routine, Kraft, Kollegin, Bestellung, Login).
  Themen „Anfragen“ und „Service-Baukasten“ (vorher „Service-Anfragen“, „Zusatzleistungen“). Veralteter
  Hinweis im Hub korrigiert: Esc beendet den Lotsen seit 26.09. nicht mehr.
- **Nachbauten** (`de/help/sim.ts`): Knöpfe, Statuszeilen und Schieber kommen wortgleich aus
  `service`/`guest` – der Nachbau kann nicht mehr anders sprechen als das Original. Beispielhaus heißt
  „Haus Alpenblick“, der Technische Dienst zeigt „Melden“.
- **Zimmer-Symbole**: `room-symbols.ts` trägt nur noch Farbklassen; die Worte liest allein die
  Hilfe-Legende aus der Sprache der Anfrage. Damit ist der Punkt aus Abschnitt 6 erledigt.
- **Landing Page** (`de/landing/`): `page`, `demo`, `roi`, `day` (Tagesbild, auch im Simulator).
  Wächter `landing.test.ts` mit den Abweichungen für die Landing („Hotel“, „Housekeeping“, „Zettel“ für
  Papiernotizen).
- **Rechtstexte** (`de/legal/`): Entscheidung des Users im Dialog – trotz ausstehender Prüfung auslagern.
  Gliederung als Daten, `LegalView` zeichnet; Wortabgleich gegen den alten Stand ohne Verlust. Geändert nur
  Typografie und Namen von Oberflächenelementen; „Bestellung“ (Vorgang) und „Zahlungsmittel“ bleiben.
  Produktname in `provider.ts` und im Seitentitel mit Halbgeviertstrich.
- **Lint-Fallstrick** in `LotsePilot`: Textauflösung per Funktionsaufruf mit `lotse` brach die
  Memoisierung des React Compilers; jetzt Nachschlagen per Schlüssel (siehe AGENTS).

Geprüft: `npm run verify` (494 Unit-Tests), Build, lokal im Browser Hub, Leiste, Lotsen-Karte,
Einrichtungs-Band, Nachbau Reinigung, Themenseiten (Haus und Konto), Landing samt Tagesbild, alle vier
Rechtsseiten (HTTP 200, Gliederung).

## 9. Nachtrag 11.10. abends: Lese-Runde der erklärenden Texte

Vor der ersten Übersetzung gemeinsam mit dem User gegengelesen – nicht alle Texte, sondern die, die erklären
oder eine Einstellung verdeutlichen, in 29 Blöcken: Gästeportal, Check-in-Blatt und Zugangs-E-Mail (de, en,
es, fr), Haus & Regeln, Gästezugang, Lösch-Dialoge, Service-Baukasten, Zimmer-Dialog, Personal, Auswertung,
Reinigungsboard, alle Hilfe-Themen und alle Lotsen. Vorgehen: Claude zeigt nur auffällige Stellen mit
Vorschlag, der User entscheidet je Block.

- **Sachliche Fehler korrigiert:** Rechnungen bleiben bei Kontolöschung erhalten (der Löschtext sagte das
  Gegenteil); Aushänge erst nach dem Check-out der laufenden Gäste abnehmen (vorher sofort); „Nur als Team“
  ist zurückstellbar, nur die Anonymisierung nicht; Spam-Hinweis steht nicht auf dem Check-in-Blatt; kein
  Aus- und Einchecken als Ausweg bei gesperrter PIN; „Einladungslink anzeigen“ nur nach gescheiterter
  Zustellung; Manager ernennen keine Manager; „ab der zweiten Nacht“ → „ab dem Tag nach der Anreise“.
- **Begriffe nachgezogen:** „Abschluss vergessen?“ statt „verwaist“, „entfallen“/„offen“ im Gästeportal,
  „Nützliche Links“, „Trinkgeld fürs Reinigungsteam“, „Stattdessen …“ in Lösch-Dialogen, Themen „Anfragen“
  und „Service-Baukasten“, Aushang neutral „im Zimmer“ (Aufsteller ist in Deutschland typisch, nicht die
  Wand), keine Entwickler-Sprache (UTC, Cookie, Bounce, Bezug, Schicht-Schlüssel, ereignisgetrieben).
- **Wächter:** „-Mail“ in Zusammensetzungen wird jetzt erkannt; ein Integrationstest prüfte den alten Wortlaut
  der IP-Sperre (deshalb waren mehrere CI-Läufe rot – seither vor dem Push auch `test:integration`).
- **Zwei Funktionen aus der Runde heraus** (je eigene Sitzung, gemergt): Anmelde-Adresse selbst ändern
  ([2026-10-11_Email-aendern.md](2026-10-11_Email-aendern.md)), Schlussrechnung beim Löschen des Kontos
  ([2026-10-11_Schlussrechnung-Kontoloeschung.md](2026-10-11_Schlussrechnung-Kontoloeschung.md)).

**Nächster Schritt** unverändert: Sprachwahl des Gastes und erste Übersetzung des Gästeportals (Abschnitt 7).
