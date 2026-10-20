# Sitzung 20.10.2026: Review der Übersetzungen eingespielt

Der Reviewer hat die Liste aller Sprachen (`scripts/translation-review.py export`, Stand 19.10.) mit ausgefüllten Korrekturspalten zurückgeschickt. Abgelegt ist sie als Vergleichsstand für das nächste Review: [Uebersetzungen-Review-gegengelesen-2026-10-20.xlsx](Uebersetzungen-Review-gegengelesen-2026-10-20.xlsx).

## Ergebnis des Reviews

Rund 3.200 Zeilen, **7 Korrekturen**: 6 Französisch, 1 Englisch, Spanisch ohne Beanstandung. Keine Anmerkungen.

| Schlüssel | Sprache | vorher | Review |
|---|---|---|---|
| `guest:login.pinHint` | fr | Vous recevez votre code PIN au check-in, à la réception. | Vous recevrez votre code PIN à la réception lors de votre arrivée. |
| `service:brand.board` / `boardOf` | fr | Tableau du ménage | Tableau de suivi du ménage |
| `service:board.onOther` | fr | Autre nettoyage | Autres tâches de nettoyage |
| `service:board.abort` | en | Cancel cleaning (room stays open) | Stop cleaning (room remains pending) |
| `service:board.deferredUntil` | fr | Ménage pas avant {time} — la chambre se libère ensuite d’elle-même. | Ménage à partir de {time} — la chambre réapparaît ensuite automatiquement dans la liste. |
| `print:accessCard.title` | fr | Carte d’accès ménage | Carte d’accès du personnel d’étage |

Eingespielt mit `translation-review.py apply` (erst `--dry-run`), alle sieben Zeilen über den Schlüssel gefunden, keine von Hand.

## Was wir daraus gemacht haben

Der Reviewer korrigiert einzelne Zeilen, er sieht nicht, wo derselbe Begriff sonst noch steht. Deshalb zwei Folgeschritte, mit dem User abgestimmt („passt so, du weißt mehr vom System als der Reviewer“):

1. **Neue Begriffe überall einheitlich** (Französisch):
   - „tableau de suivi du ménage“ in allen Texten (rund 30 Stellen, auch Hilfe, Einstellungen, Simulator, Landing-Demo).
   - „autres tâches de nettoyage“ in allen Texten (rund 20 Stellen: Statusseite, Auswertung, Hilfe-Legende, Lotsen). Die Satzbauten sind angepasst („Commencer d’autres tâches de nettoyage“, „Finir les autres tâches de nettoyage“, „Les autres tâches … se terminent“).
2. **Zwei Korrekturen nur zum Teil übernommen**, weil sie einen festen Begriff aufgebrochen hätten:
   - en: „Stop“ übernommen (Cancel klingt wie das Schließen eines Dialogs), „pending“ nicht – das Board sagt überall „open“. Jetzt **„Stop cleaning (room stays open)“**; die vier Meldungen mit „finish or cancel“ heißen „finish or stop“.
   - fr: Der zweite Satzteil ist übernommen, „à partir de“ nicht – „pas avant“ ist der feste Begriff für „frühestens ab“ (rund 20 Stellen, Knopf im Gästeportal) und gibt die Entscheidung „Einschränkung, kein Termin“ wieder. Der gleichlautende Satz `service:guest.guestDeferred` hat dieselbe Fassung bekommen. „à partir de“ bleibt dort, wo es schon stand: in den Kachel-Zuständen („Reinigung ab HH:MM“).

Commits `72d1263` (Review) und `fde71f1` (Einheitlichkeit). `npm run verify`: 764 Tests bestanden. Integrationstests nicht gelaufen, sie prüfen nur deutsche Meldungen.

## Vom Review nicht aufgegriffen

Die offenen Punkte aus dem Protokoll vom 19.10. hat der Reviewer nicht kommentiert. Damit gelten die Fassungen als angenommen:

- Spanisch „Bleibezimmer“ auf Landing Page und im Simulator unterschiedlich – weiter offen, bei Gelegenheit vereinheitlichen.
- Vereinzelt „housekeeping“ auf der spanischen Landing Page.
- Festgelegte Begriffe wie „ticket“/„incidencia“, „À suivre“/„Siguiente“, „recouche“, „sans coordination“.

## Wiederaufnahme

- Für das nächste Review dient die abgelegte Tabelle als Vergleichsstand. `translation-review.py` hat noch keinen Differenz-Modus (anders als `translation-sheet.py --since`). Wenn das nächste Review ansteht, diesen Modus nachrüsten, damit der Reviewer nur Neues und Geändertes liest.
- Neue Texte gehören gleich in alle vier Sprachen.
- Korrekturen von außen erst gegen die Begriffe im System prüfen und dann überall einheitlich nachziehen.
