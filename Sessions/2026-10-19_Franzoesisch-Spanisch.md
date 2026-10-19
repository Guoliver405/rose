# 19.10.2026 (Nachmittag) — Französisch und Spanisch

## Entscheidungen des Users

- Französisch und Spanisch kommen dazu, Thai ist zurückgestellt.
- **Keine Etappen:** Alles wird in einem Durchgang übersetzt. Gegengelesen wird später, gesammelt in **einer Liste**: eine Zeile je Text, Kontext, alle Sprachen nebeneinander, eine Korrekturspalte je Sprache. „Alles Weitere, wenn es auf den Launch zugeht.“
- Französisch: Frankreich, durchgehend *vous*, « … » mit geschützten Leerzeichen.
- Spanisch: europäisch mit neutralem Wortschatz („ustedes“, kein „vosotros“). Gast und Verwaltung werden gesiezt (*usted*), die Reinigungskräfte geduzt (*tú*).

## Was gebaut ist

- `src/lib/i18n/fr/` und `es/`: alle Bereiche wie im Englischen (Gästeportal, Reinigungsboard, Rezeption, Mails, Druck, Anmeldung, Konto, Simulator, Hilfe und Lotsen, Symbole, Landing Page). Die Rechtstexte bleiben deutsch.
- Glossar: [Glossar-fr-es-2026-10-19.md](Glossar-fr-es-2026-10-19.md). Übersetzt haben sieben Agenten parallel nach dem Glossar; danach lief ein Abgleich der Begriffe und zitierten Knöpfe über alle Bereiche.
- `scripts/fr-typo.mjs` setzt die geschützten Leerzeichen im Französischen. Es muss nach jeder Änderung an `fr/` laufen, der Test prüft das.
- `src/lib/i18n/fr-es.test.ts` prüft für beide Sprachen und alle Bereiche:
  - Schlüssel und Datenfelder wie im Deutschen, dazu die Platzhalter
  - keine deutschen Reste
  - Typografie und Anrede, keine „(e)“-Formen
  - Knöpfe wortgleich zitiert, Blatt und Portal mit denselben Beschriftungen
- **Review-Liste:** `python scripts/translation-review.py export <xlsx>` schreibt die Liste, `… apply <xlsx>` spielt die Korrekturen zurück. Der Abgleich läuft über den Schlüssel, bei mehrdeutigen Texten über Datei und letzten Schlüsselteil; was sich nicht eindeutig zuordnen lässt, wird gemeldet. Stand: [Uebersetzungen-Review-en-fr-es-2026-10-19.xlsx](Uebersetzungen-Review-en-fr-es-2026-10-19.xlsx) mit 3.208 Texten.
- Mitgezogen:
  - Rechnungssprache: FR, MC und LU französisch, spanischsprachige Länder spanisch (`invoiceLocale`).
  - Simulator-Name und Fassung der Werbe-Einwilligung je Sprache.
  - Beispiel-Services in allen vier Sprachen, auch in `create-tenant.mjs`.
  - Stripe-Eingabefeld in der Sprache der Seite.
  - Gedruckte Blätter: Die Legende zeigt jetzt in jeder Sprache ihre eigenen Knöpfe, der Klammerzusatz hinter dem Verzicht-Knopf ist entfallen.
  - Mails auf den Blättern beginnen nach der Anrede mit einem Großbuchstaben.

## Prüfung

- `npm run verify`: 764 Unit-Tests bestanden.
- `npm run test:integration`: 84 Tests bestanden.
- In Produktion stichprobenartig angesehen: Landing Page auf Spanisch, Simulator auf Französisch.

## Für das Review offen

- Spanisch „Bleibezimmer“: Auf der Landing Page steht „habitación con estancia en curso“, im Simulator „habitación ocupada“. Eine Fassung wählen.
- Spanische Landing Page: vereinzelt „housekeeping“.
- Von den Agenten festgelegte Begriffe, die über das Glossar hinausgehen, zum Beispiel:
  - Support-Meldung: „ticket“ bzw. „incidencia“, damit sie sich von der Meldung ans Haus („signalement“, „aviso“) unterscheidet.
  - „Als Nächstes“: „À suivre“ bzw. „Siguiente“.
  - Bleibe: „recouche“.
  - „Ohne Steuerung“: „sans coordination“ bzw. „sin coordinación“.
- Lange französische Knöpfe, etwa „Annuler les modifications“.

## Wiederaufnahme

Der nächste Schritt ist das Review des Users. Er schickt die Liste mit ausgefüllten Korrekturspalten zurück, dann:

1. `python scripts/translation-review.py apply <datei> --dry-run` als Probe, danach ohne `--dry-run`.
2. Gemeldete Zeilen von Hand eintragen.
3. `npm run verify` und `npm run test:integration`.
4. Commit.

Neue Texte gehören ab jetzt gleich in alle vier Sprachen.
