# Sprachen des Hauses und mehrsprachiger Service-Baukasten – Bauplan (17.10.2026)

Entschieden im Dialog mit dem User am 17.10.2026, **noch nicht gebaut**. Gehört zur ersten
Übersetzung (Englisch, Gästeportal) – siehe TODO „Mehrsprachigkeit“ und
[2026-10-11_Mehrsprachigkeit-Auslagerung.md](2026-10-11_Mehrsprachigkeit-Auslagerung.md), Abschnitt 7.

## 1. Zwei Einstellungen je Haus

| Einstellung | Bedeutung | Vorgabe |
|---|---|---|
| **Heimatsprache** (`policies.homeLanguage`) | Sprache, in der das Haus seine Inhalte anlegt – vor allem den Service-Baukasten. Gewählt von Inhaber oder Manager. | `de` |
| **Rückfallsprache** (`policies.fallbackLanguage`) | Sprache, auf die **alle Portale** zurückfallen, wenn die Sprache des Geräts nicht angeboten wird. | = Heimatsprache |

Bewusst zwei: Ein Haus in Thailand pflegt seine Services womöglich auf Thai, ein Gast mit
französischem Handy kommt aber mit Englisch als Rückfall weiter. Für die meisten Häuser sind beide
gleich; die zweite Einstellung fällt dann nicht auf. Beide werden aus den Sprachen gewählt, die das
Produkt anbietet (`LOCALES`) – heute nur Deutsch, die Auswahl wächst mit jeder Übersetzung.

**Sprachwahl eines Geräts** (`getLocale()` in `src/utils/locale.ts`): eigene Wahl (Cookie, wo es
einen Umschalter gibt) → `Accept-Language`, soweit angeboten → Rückfallsprache des Hauses →
`DEFAULT_LOCALE`. Die Rückfallsprache braucht dafür den Mandanten; Seiten ohne Mandant (Landing,
`/guest`, `/login`) fallen direkt auf `DEFAULT_LOCALE`.

## 2. Blatt-Sprache gekoppelt

Die **erste Sprache der gedruckten Blätter ist die Rückfallsprache** – keine eigene Einstellung
mehr (`policies.sheetLanguage` entfällt, beim Lesen weiterhin als Altwert berücksichtigen, bis das
Haus speichert). Die **zweite Blatt-Sprache bleibt wählbar**. Damit geht auch die Zugangs-Mail an
den Gast (heute `parseSheetLanguages(policies)[0]`) in der Rückfallsprache. Grund: sonst drei
Spracheinstellungen, die leise auseinanderlaufen.

Randfall: Die Blätter kennen de/en/es/fr (`GUIDE_LANGS`). Ist die Rückfallsprache dort nicht
vorhanden, fällt das Blatt auf Englisch zurück; die Einstellungsseite sagt das.

## 3. Service-Baukasten: Self-Service in mehreren Sprachen

Entscheidung des User **gegen** automatische Übersetzung: Der Baukasten ist Self-Service, das Haus
schreibt seine Texte selbst – wer ein Übersetzungswerkzeug benutzen will, tut das eigenhändig.
Vorteile: Jeder Wortlaut (Beschreibung, Preis-Option) stammt vom Haus, kein externer Dienst, kein
Vertrag, keine Kosten.

- **Anlegen in der Heimatsprache.** Die vorhandenen Spalten (`service_definitions.name`,
  `description`, `service_items.label`) tragen den Text der Heimatsprache; dazu je Zeile
  `lang` (Sprache dieser Spalten – ändert das Haus später die Heimatsprache, bleibt erkennbar, worin
  ein Bestand geschrieben ist) und `translations jsonb` (`{ en: { name, description } }` bzw.
  `{ en: { label } }`). Migration additiv.
- **Drängen, nicht sperren.** Speichern geht immer, auch nur in der Heimatsprache. Jeder Service
  zeigt Sprach-Chips (DE ✓ · EN fehlt) für **alle Sprachen, die das Gästeportal anbietet**; oben
  im Baukasten „2 Services noch ohne Englisch“ mit Sprung dorthin. Kommt eine Portalsprache dazu,
  fehlt sie überall – dieselbe Anzeige zeigt das von selbst. Optional später: Punkt in der
  Einrichtungs-Checkliste (freiwillig, zählt nicht gegen „fertig“).
- **Rückfall je Feld** im Gästeportal: Sprache des Gastes → Heimatsprache des Service. Ein halb
  übersetzter Service bleibt brauchbar, nie ein leeres Feld.
- **Die Rezeption sieht Anfragen in der Heimatsprache.** `service_name` und `items_snapshot`
  frieren den Text der Heimatsprache ein – Board und Aufstellung bleiben einsprachig.
- **Anmerkungen des Gastes** bleiben, wie sie geschrieben sind.
- **Vorlagen** (`service-templates.json`, Verweis-Vorlagen) bringen alle Produktsprachen mit;
  beim Anlegen wird die Heimatsprache in die Spalten geschrieben, der Rest in `translations`.

## 4. Noch offen (vor der ersten Übersetzung zu klären)

1. Umschalter im Gästeportal: Ort (Kopf des Portals?), gilt er auch auf Anmeldung und Danke-Seite?
2. Legende des Check-in-Blatts: Wortlaut der Knöpfe in welcher Portalsprache – naheliegend: in der
   jeweiligen Blatt-Sprache, soweit das Portal sie kann.
3. Wer liest die englische Fassung gegen?
