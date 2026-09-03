# 03.09.2026 — Zimmer löschen, bearbeiten und Testdaten abräumen

**Auslöser:** Rückmeldung eines Testers. Er hatte sich beim Einrichten vertan und
wollte das korrigieren — fand aber weder ein Löschen für Zimmer, Etagen oder
Gebäudeteile noch eine Möglichkeit, eine falsche Nummer zu ändern. Nur
„Deaktivierung". Das empfand er als irreführend.

## Inhaltsübersicht

1. [Was der Tester tatsächlich vorfand](#1-was-der-tester-tatsächlich-vorfand)
2. [Die Falle im Test-Szenario](#2-die-falle-im-test-szenario)
3. [Was gegen hartes Löschen spricht — nachgemessen](#3-was-gegen-hartes-löschen-spricht--nachgemessen)
4. [Umgesetzt](#4-umgesetzt)
5. [Verifikation](#5-verifikation)
6. [Nebenbefund: Passwörter im Dev-Log](#6-nebenbefund-passwörter-im-dev-log)
7. [Offen](#7-offen)
8. [🔖 Wiederaufnahme](#-wiederaufnahme)

---

## 1. Was der Tester tatsächlich vorfand

Seine Wahrnehmung war berechtigt, aber der Grund war ein anderer als vermutet.
Löschen war nicht verboten — es war **unsichtbar**:

| Ebene | Zustand vorher |
|---|---|
| Zimmer | Löschen erlaubt, aber der Papierkorb erschien **erst an einem bereits außer Betrieb genommenen Zimmer**. Man musste also die Aktion ausführen, die wie eine Sackgasse aussieht, um die gesuchte Aktion zu finden. |
| Etage | Nur „außer Betrieb", kein Löschen. |
| Gebäudeteil | Gar keine Aktion — der Gebäudeteil war in der Setup-Liste nicht einmal eine eigene Ebene, nur ein Präfix in der Etagen-Überschrift. |
| Nummer/Etage ändern | Gab es überhaupt nicht. |

Die letzte Zeile war der eigentliche Punkt: „Ich habe mich beim Einrichten
vertan" heißt meist *falsche Nummer, falsche Etage, Gebäudeteil vergessen* —
dafür ist Löschen und Neuanlegen ohnehin nur ein Umweg.

## 2. Die Falle im Test-Szenario

Der Tester hatte vorher ein **Demo-Szenario** laufen lassen. Genau das machte
sein Problem endgültig:

- `seedTestScenarioAction` legt für **jedes belegte Zimmer** einen `stays`-Eintrag
  an und schreibt `room_states` um, was den Audit-Trigger auslöst und
  `room_state_transitions` erzeugt.
- `resetTestScenarioAction` („Alles zurücksetzen") räumt das **nicht** weg: es
  checkt nur aus und löscht offene Bestellungen. Aufenthalte und Verlauf bleiben.

Ergebnis: **Ein einziger Szenario-Lauf machte dauerhaft jedes Zimmer des Hauses
historienbehaftet** — und damit unlöschbar. Kein Bedienfehler, ein Einwegventil.

## 3. Was gegen hartes Löschen spricht — nachgemessen

Die Fremdschlüssel im Schema und eine Probe gegen die echte Datenbank
(Wegwerf-Zimmer anlegen, löschen, zählen):

| Tabelle | Verhalten | gemessen |
|---|---|---|
| `stays`, `room_states`, `room_guest_tokens`, `service_orders` | `on delete cascade` | gehen mit |
| `staff_log` | **`on delete set null`** | **bleibt** — nur der Zimmerbezug fällt weg |
| `room_state_transitions` | **kein Fremdschlüssel** | bleibt ohne expliziten Delete als Waise stehen |

Damit fällt das Hauptargument der bisherigen Begründung weg: **der
Arbeitsnachweis der Reinigungskräfte überlebt das Löschen.** Arbeits-, Pausen-
und Reinigungszeiten rechnen aus `staff_log`, und der bleibt vollständig.

Was übrig bleibt und ehrlich benannt gehört:

1. **Abrechnung.** `countBillableRooms` leitet live aus `created_at` /
   `deactivated_at` ab — ein gelöschtes Zimmer fehlt rückwirkend auch in bereits
   abgerechneten Perioden. Heute folgenlos (es wird nichts abgerechnet), später
   nicht. Die richtige Antwort darauf ist ein **Perioden-Snapshot**, kein
   Löschverbot; ein Verbot ist nur der Workaround für die fehlende
   Abrechnungszeile.
2. **Service-Belege.** Erledigte Bestellungen mit Preisen belegen die Position
   gegenüber dem Gast. Relevant, sobald etwas exportiert wird.
3. **Irreversibilität.** Das stärkste Argument — aber ein Bedienungsproblem,
   kein Architekturproblem.

Keiner der Punkte trägt ein generelles Verbot. **Entscheidung: Löschen wird ein
regulärer Vorgang mit Reibung statt einer Wand.**

## 4. Umgesetzt

### Ein Bereichsbegriff für drei Ebenen

`RoomScope` in [zimmer/actions.ts](../src/app/h/[slug]/admin/zimmer/actions.ts) —
`{kind:'room'|'floor'|'building'}`. `setScopeActiveAction`, `editScopeAction`,
`getDeletionImpactAction` und `deleteScopeAction` arbeiten auf allen drei Ebenen
gleich; `resolveScope` löst sie auf Zimmer-IDs, ein Label und eine
Bestätigungsformel auf. Die alten `setRoomActiveAction`,
`setFloorRoomsActiveAction` und `deleteRoomAction` sind darin aufgegangen.

Der Grund für die Zusammenlegung ist nicht Sparsamkeit: Sobald die Ebenen
getrennte Aktionen haben, driften ihre Prüfungen und Meldungen auseinander — und
genau daraus entsteht der Eindruck, auf einer Ebene sei etwas „nicht vorgesehen".

### Ein Dialog für alle drei Ebenen

In der Oberfläche öffnet **jede** Ebene denselben Dialog mit denselben drei
Aktionen (Bearbeiten · Außer Betrieb nehmen · Endgültig löschen), jeweils mit
ausgeschriebenem Namen und Erklärsatz statt eines nackten Icons. Die
Gebäude-Ebene erscheint nur, wenn sie etwas unterscheidet — bei einem einzigen
namenlosen Gebäudeteil wäre „Gebäudeteil löschen" gleichbedeutend mit „alle
Zimmer des Hauses löschen", ohne Nutzen und mit dem größtmöglichen Fehlklick.

### Löschen mit bezifferten Folgen

Der Dialog zeigt vor dem Bestätigen, was mitgeht: Aufenthalte, offene und
erledigte Service-Anfragen (samt Summe), Einträge im Zimmer-Verlauf, ungültig
werdende QR-Aushänge — und ausdrücklich, dass die Reinigungs-Stiche **erhalten
bleiben**. Ohne Historie steht dort stattdessen „Noch nie benutzt".

Zwei Riegel: belegte Zimmer sind hart gesperrt, und ein Bereich mit Historie
verlangt die **abgetippte Bezeichnung**. Die Formulierung gibt der Server vor
(`confirmPhrase`), damit Anzeige und Prüfung nicht auseinanderlaufen; geprüft
wird serverseitig, nicht nur im Knopf. Daneben steht immer der Ausweg „Lieber
außer Betrieb nehmen — Belege bleiben erhalten".

`room_state_transitions` wird ausdrücklich mitgelöscht (keine Kaskade, s. o.).

### Bearbeiten

Nummer, Etage und Gebäudeteil sind änderbar — je Zimmer, für eine ganze Etage
(verschieben) oder einen ganzen Gebäudeteil (umbenennen). Historienverträglich,
weil alles an `rooms.id` hängt; auch der QR-Token bleibt gültig. Ein Hinweis
erscheint, sobald Nummer oder Gebäudeteil geändert werden: gedruckte Aushänge
tragen dann die alte Beschriftung.

Die Eindeutigkeit wird **von Hand** geprüft, statt sie in den Unique-Index laufen
zu lassen — sonst wäre bei einer Etagen-Umbenennung schon die Hälfte der Zimmer
verschoben, wenn das erste kollidiert.

### „Testdaten vollständig entfernen"

`purgeTestDataAction` im Test-Szenario räumt ab, was ein Testlauf hinterlässt:
Aufenthalte, Service-Anfragen, Zimmer-Verlauf, Reinigungs-Stiche und die
Verortung der Kräfte. Zimmer und Personal bleiben.

**Reihenfolge beachten:** erst `room_states` neutralisieren, **dann** den Verlauf
löschen. Andersherum schreibt der Audit-Trigger den Verlauf sofort wieder voll —
im Test praktisch bestätigt (siehe unten, zwei statt einem Eintrag).

## 5. Verifikation

`npm run verify` grün (100 Unit-Tests), Produktions-Build grün. Durchgespielt im
Browser gegen die echte Datenbank, ausschließlich mit selbst angelegten Zimmern
(Gebäudeteil „ZZ-Prüfung"), Haus `test-hotelkette`:

| Geprüft | Ergebnis |
|---|---|
| Gebäude-Ebene erscheint dynamisch | ab dem zweiten Gebäudeteil sichtbar, danach wieder verschwunden ✅ |
| Zimmer-Dialog | drei Aktionen mit Namen und Erklärsatz ✅ |
| Löschen ohne Historie | „Noch nie benutzt", kein Abtippfeld, gelöscht ✅ |
| Bearbeiten | ZZ02 → ZZ09 samt Etagenwechsel 99 → 97, Liste sortiert sich neu ✅ |
| Nummernkollision | „Zimmernummer ZZ03 ist im Gebäudeteil „ZZ-Prüfung" bereits vergeben (Etage 99)." ✅ |
| QR-Hinweis | erscheint genau bei Nummern-/Gebäudeteil-Änderung ✅ |
| Belegtes Zimmer | kein Löschknopf, „bitte zuerst auschecken" ✅ |
| Löschen mit Historie | Zahlen korrekt, Knopf gesperrt bis Bezeichnung stimmt (Kleinschreibung reicht nicht) ✅ |
| Leere Etage | verschwindet nach dem Löschen des letzten Zimmers ✅ |
| Gebäudeteil löschen | „ZZ-Prüfung gelöscht (1 Zimmer)." ✅ |
| **Purge → wieder löschbar** | nach „Testdaten vollständig entfernen" meldet derselbe Dialog wieder „Noch nie benutzt" ✅ |
| Etage mit Historie (Marcus-Hotel) | 15 Zimmer, 9 Aufenthalte, 8 Verlaufs-Einträge, gesperrt wegen 9 belegter Zimmer — **nichts verändert** ✅ |

Das Testhaus steht danach wieder exakt im Ausgangszustand (81 Zimmer, 0
Aufenthalte, 0 Verlauf, 0 Stiche).

Zwei Dinge fielen dabei auf und wurden gleich behoben: „1 Aufenthalte" (Plural
ohne Singularform) im Löschdialog und in der Purge-Meldung.

**Werkzeug-Notiz:** Klicks über Element-Referenzen gingen in dieser Sitzung
daneben (Windows-Skalierung, `devicePixelRatio` 1.5), und die
Screenshot-Erfassung lief mehrfach in CDP-Timeouts. Verifiziert wurde deshalb
über Seitentext und ausgelöste Klicks. Außerdem: **`npm run build` nicht parallel
zum laufenden Dev-Server** — beide schreiben nach `.next/`, danach sind die
Client-Handler tot (der bekannte Fallstrick, hier live erlebt; `.next/` löschen
und Dev-Server neu).

## 6. Nebenbefund: Passwörter im Dev-Log

Der Dev-Server protokolliert Server-Action-Aufrufe **mitsamt Argumenten**:

```
POST /login 303 in 2.0s
  └─ ƒ loginAction("mail@example.com", "<passwort im klartext>") in 1061ms src/app/login/actions.ts
```

Laut Next.js-Doku (`logging`) ist das ausdrücklich auf den **Development-Modus**
beschränkt — in Produktion und damit in den Vercel-Logs landet nichts davon.
Abschaltbar wäre es mit `logging: { serverFunctions: false }` in
`next.config.ts`; das kostet aber ein nützliches Dev-Werkzeug. **Nicht geändert,
bewusst offen gelassen.**

## 7. Offen

- **Abrechnungs-Snapshot.** Solange `countBillableRooms` live ableitet, ändert
  ein gelöschtes Zimmer rückwirkend abgerechnete Perioden. Vor der ersten echten
  Rechnung zu klären.
- **Test-Szenario bleibt vorübergehend.** `purgeTestDataAction` gehört mit
  ausgebaut, wenn der Bereich verschwindet (Rückbau-Hinweis steht in
  `test-actions.ts`).
- **Personal-Ebene ungeprüft.** Bei Reinigungskräften gilt dieselbe Logik
  („Deaktivieren statt Löschen", Papierkorb hinter „Deaktiviert" versteckt). Der
  Tester hat davon nichts gesagt — die Frage, ob dort dieselbe Irreführung
  steckt, ist damit aber nicht beantwortet.

---

## 🔖 Wiederaufnahme

**Stand:** Zimmer, Etagen und Gebäudeteile lassen sich bearbeiten, außer Betrieb
nehmen und löschen — alle drei Ebenen über denselben Dialog. Löschen ist ein
regulärer Vorgang mit bezifferter Folgenanzeige, Belegt-Sperre und
Abtipp-Bestätigung bei Historie. Das Test-Szenario kann seine Spuren restlos
entfernen. Alles verifiziert, `verify` und Build grün.

**Wenn hier weitergearbeitet wird:**

- Die Mechanik liegt in `RoomScope` / `resolveScope`
  ([zimmer/actions.ts](../src/app/h/[slug]/admin/zimmer/actions.ts)). Neue
  Bereichs-Vorgänge dort anhängen, nicht daneben — das war der ganze Punkt.
- Beim Löschen **immer** `room_state_transitions` mitnehmen: kein Fremdschlüssel,
  keine Kaskade.
- Beim Abräumen von Zimmerstatus gilt: erst `room_states` schreiben, dann den
  Verlauf löschen — sonst füllt der Audit-Trigger ihn sofort wieder.
- Nächster inhaltlicher Schritt wäre der **Abrechnungs-Snapshot** (Abschnitt 7),
  weil er die einzige verbliebene echte Nebenwirkung des Löschens beseitigt.
