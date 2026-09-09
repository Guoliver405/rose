# Check-out-Aufstellung — 09.09.2026

Die Rezeption soll beim Check-out sehen, ob noch etwas zu kassieren ist. Kein
Rechnungswesen, kein Zimmerpreis, kein „bezahlt"-Haken: **eine Zahl vor der
Bestätigung und ein druckbares Blatt dahinter.**

## Ausgangslage

Der User hat die Anforderung in zwei Fällen formuliert:

- **a)** Leistungen in Anspruch genommen ⇒ Gesamtsumme + Knopf „Details" auf
  eine druckbare Liste (Zimmer, Aufenthaltszeitraum, Posten mit den Zeitpunkten
  der Statuswechsel — kein Gastname, den kennt RoSe nicht). Bestellte, aber
  nicht erbrachte Leistungen werden gekennzeichnet und zählen nicht mit;
  Wartung erscheint gar nicht.
- **b)** nichts in Anspruch genommen ⇒ nur ein Hinweis, keine Summe, kein Knopf.

Die Durchsicht des Bestands ergab: **Die Daten waren schon da.**
`service_orders` trägt seit Schema v1 `stay_id` (die Zuordnung stimmt also auch
bei zwei Aufenthalten am selben Tag) und `items_snapshot` friert Bezeichnung und
Preis zum Bestellzeitpunkt ein. Der Gast sieht die Preise bereits bei der
Bestellung — die Summe am Tresen ist für ihn keine Überraschung. Gefehlt haben
drei Dinge, und zwei davon waren echte Lücken.

## Drei Entscheidungen des Users

1. **Wartung wird abgeleitet, nicht konfiguriert.** „Alles ohne Preis kann
   wegfallen." Damit braucht es kein Kennzeichen am Service: Der technische
   Dienst hat keine bepreisten Optionen, also gibt es nichts zu prüfen. Die
   Regel steht in [stay-bill.ts](../src/lib/stay-bill.ts) und deckt zugleich
   Optionen ohne Preisangabe und Anfragen ab, die insgesamt bei 0,00 € landen.
2. **Offene Anfragen werden beim Check-out geschlossen**, mit Hinweis auf
   mögliche Diskussionen.
3. **Die Summe steht vor der Bestätigung** und deutlich hervorgehoben. „Der
   Rest ist dann aber Verantwortung der Rezeption."

## Was gebaut wurde

### Der dritte Zustand (Migration)

`service_orders.status` war `open → done`. Was bestellt, aber nicht erbracht
wurde, ließ sich nicht ausdrücken — auf der Aufstellung muss es aber
gekennzeichnet und aus der Summe heraus sein.
[2026-09-09_service_orders_abrechnung.sql](../Supabase_sql/2026-09-09_service_orders_abrechnung.sql)
erweitert den CHECK um `'cancelled'` und legt `service_name` als Snapshot an.

Bewusst **kein zweites Spaltenpaar** für den Abbruch: `done_at`/`done_by`
bedeuten „abgeschlossen am/durch", `status` sagt, in welche Richtung. Zwei
parallel gepflegte Zeitstempel laufen auseinander.

Der Servicename war der einzige Teil der Bestellung, der **nicht** eingefroren
war (die Optionen sind es seit v1). Eine Umbenennung im Baukasten hätte alte
Aufstellungen rückwirkend geändert — auf einem gedruckten Blatt fällt genau das
auf. Der Code liest bevorzugt den Snapshot und fällt für Alt-Zeilen auf den
Join zurück.

### Die Rechenregel (I/O-frei, getestet)

[stay-bill.ts](../src/lib/stay-bill.ts) — `buildStayBill(orders)`:

- Optionen ohne Preisangabe fallen weg; eine Anfrage, die danach bei 0,00 €
  landet, fällt ganz weg (**das ist die Wartungsregel**).
- Nur `done` zählt in die Summe. Offene und als nicht erbracht geschlossene
  Anfragen bleiben **sichtbar** — sonst verschwände eine Diskussion mit dem Gast
  einfach vom Blatt —, gehen aber nicht ein.
- Preise ausschließlich aus dem Snapshot, nie aus dem aktuellen Baukasten.

Neun Fälle in [stay-bill.test.ts](../src/lib/stay-bill.test.ts), darunter die
0-Cent-Anfrage und die gemischte Anfrage aus bepreister und unbepreister Option.
Das I/O liegt getrennt in [utils/stay-bill.ts](../src/utils/stay-bill.ts).

### Check-out

[checkOutAction](../src/app/h/[slug]/admin/actions.ts) schließt offene Anfragen
**dieses Aufenthalts** als `cancelled` und gibt die `stayId` zurück. Das
Schließen ist kein Beiwerk: Eine Anfrage gehört zum Aufenthalt, nicht zum
Zimmer. Bliebe sie offen, läge sie morgen auf dem Board eines längst leeren
Zimmers, und niemand könnte sie noch klären. Diese Lücke gab es vorher schon —
die Aufstellung hat sie nur sichtbar gemacht.

### Der Zimmer-Dialog

- Ein hervorgehobener Kasten **über** dem Check-out-Knopf: „Zu kassieren" mit
  der Summe, „Details" auf das Blatt.
- Offene kostenpflichtige Anfragen stehen einzeln darunter, mit Betrag und
  einem Knopf **„erbracht"** — der Hinweis wäre sonst eine Sackgasse. Genau hier
  liegt der teure Fehler: Wäsche geliefert, Haken vergessen, Summe zu niedrig.
- Die Bestätigung wiederholt Summe und die Zahl der Anfragen, die als „nicht
  erbracht" geschlossen werden.
- **Nach** dem Check-out bleibt der Dialog stehen und zeigt einen eigenen
  Bildschirm mit dem Betrag. Der reguläre Inhalt böte „Check-in" an — das Zimmer
  ist ja frei —, während am Tresen noch die Zahl gebraucht wird.
- Später erreichbar über den **Verlauf**: Der Eintrag „Check-out" trägt einen
  Link auf die Aufstellung. Nach dem Check-out kennt das Zimmer den Aufenthalt
  nicht mehr; der Verlauf ist der einzige Weg zurück.

### Das Blatt

`/h/<slug>/admin/aufstellung/<stayId>` — Kopf mit Zimmer und Haus, Anreise/
Abreise/Erstellzeitpunkt in der **Zeitzone des Hauses**, Tabelle mit Leistung,
Optionen samt Einzelpreis, Bestell- und Erbringungszeitpunkt, Betrag; nicht
gezählte Posten durchgestrichen und beschriftet. Fußzeile: *„keine Rechnung und
kein Steuerbeleg"*.

Print-Fallstrick vom Handout übernommen: Die Kopfzeile trägt eine farbige
**Linie**, keine gefüllte Fläche — Browser drucken Hintergründe standardmäßig
nicht.

### Warum ausdrücklich keine Rechnung

Der Wunsch des Users deckt sich mit dem, was hier ohnehin richtig ist: Sobald
RoSe Zahlungen quittiert (Rechnungsnummer, Steuerausweis, „bezahlt"), ist es der
Sache nach eine Kassenaufzeichnung — GoBD/KassenSichV-Nähe, und das für ein
Produkt, das keine Zimmerpreise kennt. Das Blatt sagt deshalb auf dem Papier,
was es ist, und verweist auf die Abrechnung im System des Hauses.

### Aus zwei Fällen wurden drei

- **a)** kostenpflichtige Leistungen ⇒ Summe + Details.
- **b)** nichts bestellt ⇒ Hinweis.
- **c)** nur Kostenfreies oder Wartung bestellt ⇒ verhält sich wie b), aber der
  Text lügt nicht: „Keine **kostenpflichtigen** Zusatzleistungen." Sonst
  widerspräche das Blatt dem Verlauf, in dem die Anfrage steht.

### Lotsen

Der Lotse „Zusatzleistungen" sagte wörtlich das Gegenteil des neuen Verhaltens
(*„Preise sind Anzeige, keine Abrechnung … RoSe rechnet damit nicht ab"*). Der
Schritt ist umgeschrieben und damit zum Motivationshebel geworden: Preise zu
pflegen lohnt sich, weil beim Check-out die Summe steht. Dazu ein neuer
(ankerloser) Schritt in „Die Zimmer-Übersicht" und ein geschärfter in
„Service-Anfragen": *Der Haken entscheidet über den Betrag.* Bewusst **kein
eigener Lotse** — er hätte drei Schritte und hinge an einem Zimmerzustand, den es
beim Durchlauf meistens nicht gibt.

## Zwei Funde aus dem Durchlauf (09.09., lokal gegen die Produktions-DB)

1. **Die Schreib-Seite des Namens-Snapshots fehlte.** Die erste Bestellung lief
   über das echte Gastportal und landete mit `service_name = null` in der
   Datenbank: Migration und Lese-Seite waren da, `placeOrderAction` schrieb den
   Namen aber nicht. Der Join-Rückfall verdeckte das in der Anzeige — der
   Snapshot wäre erst beim ersten Umbenennen aufgefallen, also genau dann, wenn
   er hätte helfen sollen. Jetzt schreiben Gast-Bestellung und Test-Szenario ihn
   mit.
2. **Der Check-out schließt auch die kostenfreien Anfragen.** Das folgt aus der
   Entscheidung „offene Anfragen werden geschlossen", stand aber nirgends —
   und es ist der unangenehmere Fall: Ein gemeldeter Defekt hört nicht auf zu
   existieren, weil der Gast abreist. Er verschwände nur vom Board, und der
   nächste Gast zöge in ein kaputtes Zimmer. `openFreeCount` zählt sie deshalb
   getrennt (auf die Aufstellung gehören sie nicht, sie kosten nichts), und
   Bestätigung wie Abschluss-Bildschirm sagen es. **Offen für den User:** ob
   Defekte beim Check-out überhaupt geschlossen werden sollen — sie gehören
   eher zum Zimmer als zum Aufenthalt.

## Durchlauf

Zimmer 101 des Stripe-Testhauses, drei Anfragen: Wäsche klein (12,00 €) über
das echte Gastportal, Wäsche groß (20,00 €) und technischer Dienst (ohne Preis).
Abgehakt wurde die 12,00 € **im Check-out-Kasten selbst**, die Summe sprang
sofort. Bestätigung nannte Summe, die offene 20,00-€-Anfrage und die kostenfreie.
Nach dem Klick: Abschluss-Bildschirm mit 12,00 €, beide Hinweise, Link auf das
Blatt. In der Datenbank danach `done` / `cancelled` / `cancelled`, jeweils mit
Zeitpunkt und Person. Das Blatt zeigt die 20,00 € durchgestrichen mit
Kennzeichen, der technische Dienst steht nirgends, Gesamtsumme 12,00 €. Verlauf:
„Service nicht erbracht: …" und am Check-out der Link „Aufstellung". Fall b) auf
Zimmer 102 gegengeprüft: Hinweis statt Summe, kein Details-Knopf.

## Nachtrag: Instandhaltung ist eine eigene Art von Service

Aus dem zweiten Fund wurde eine Entscheidung des Users: **Meldungen bleiben
offen, und dafür braucht der Baukasten ein ausdrückliches Kennzeichen.** Das ist
die richtige Korrektur an meinem ersten Vorschlag — der Preis kann diese Grenze
nicht ziehen. Kostenfreie Extra-Handtücher gehören zum Aufenthalt, ein
kostenpflichtiger Handwerker-Einsatz gehört zum Zimmer. Für die *Aufstellung*
war die Preisregel tragfähig (was nichts kostet, muss niemand prüfen); für den
*Lebenszyklus* ist sie es nicht.

`service_definitions.maintenance` (Migration
[2026-09-09_service_definitions_maintenance.sql](../Supabase_sql/2026-09-09_service_definitions_maintenance.sql),
Häkchen „Meldung ans Haus" im Baukasten) bedeutet deshalb **ein** Ding —
*gehört zum Zimmer, nicht zum Aufenthalt* — mit drei Folgen:

1. **Bleibt beim Check-out offen.** `checkOutAction` liest die offenen Anfragen
   des Aufenthalts, nimmt die Meldungen heraus und schließt nur den Rest. Zwei
   Schritte statt eines Filters auf der eingebetteten Spalte, damit der Update
   über eine gelesene ID-Liste läuft und nie mehr trifft als beabsichtigt.
2. **Steht auf keiner Aufstellung** — auch mit Preis. Eine Meldung ist keine
   Leistung an den Gast.
3. **Warnt beim nächsten Check-in.** Sonst wäre „bleibt offen" folgenlos: Die
   Anfrage stünde am freien Zimmer, und der nächste Gast zöge trotzdem ein. Der
   Grund erscheint in der bestehenden Warnung neben „nicht gereinigt", mit
   demselben Override. Die Abfrage läuft im vorhandenen `Promise.all` mit,
   kostet also keinen zusätzlichen Roundtrip in Reihe.

Zwei bewusste Nicht-Entscheidungen: Das Kennzeichen wird **nicht** in die
Bestellung eingefroren (anders als `service_name`) — es steuert Verhalten, nicht
den Inhalt eines alten Belegs; und es ist **unabhängig von `urgent`**, weil die
beiden verschiedene Fragen beantworten: wie laut die Anfrage ist gegen wem sie
gehört.

Der Bestand wird eng begrenzt nachgezogen: `name = 'Technischer Dienst'` stammt
ausnahmslos aus der Seed-Vorlage und ist genau dieser Fall. Alles andere wäre
geraten.

### Durchlauf der Instandhaltung (09.09., Zimmer 103)

Baukasten: Beide Haken stehen im Anlege-Formular, „Technischer Dienst" trug nach
der Migration sofort das Abzeichen „Meldung ans Haus" (Backfill), der Schalter
„Keine Meldung" / „Als Meldung" wechselt es je Service.

Zimmer 103 mit zwei offenen Anfragen ausgecheckt — einer bepreisten (20,00 €)
und einer Meldung. Der Kasten zeigte nur die bepreiste; die Bestätigung sagte
beides an („wird als nicht erbracht geschlossen" gegen „bleibt offen — gehört
zum Zimmer"). Danach in der Datenbank: Meldung `open`, Rest `cancelled`. Der
nächste Check-in auf 103 warnte mit **„Offene Meldung ans Haus: Technischer
Dienst."** neben „noch nicht gereinigt", mit Override. Abgehakt wird die Meldung
ganz normal auf dem Services-Board.

## Reihenfolge beim Einspielen

Beide Migrationen sind **additiv** (Alt-Code schreibt nie `'cancelled'` und
kennt weder `service_name` noch `maintenance`) und müssen **vor** dem
Deployment eingespielt werden: Der neue Code fragt beide Spalten ab.

## 🔖 Wiederaufnahme

- **Erledigt:** Der Durchlauf (Bestellung → erledigt → Check-out → Blatt) ist
  gefahren, siehe oben. Offen bleibt die **Druckprobe auf Papier** — die
  Bildschirmfassung sagt nichts über den Seitenumbruch bei vielen Posten.
- **Entschieden (09.09.):** Meldungen ans Haus bleiben offen, erkennbar am
  neuen Häkchen im Baukasten. Kostenfreie *Gast*-Anfragen (Extra-Handtücher)
  werden weiterhin geschlossen — sie gehören zum Aufenthalt.
- **Bewusst nicht gebaut:** Zahlungsstatus, Rechnungsnummer, Sammelaufstellung
  über mehrere Zimmer, Export.
- **Denkbar als Nächstes:** ein Halbsatz im gedruckten Handout, dass
  kostenpflichtige Leistungen beim Check-out aufgestellt werden. Kostet vier
  Sprachen und Platz auf einem Blatt, das gerade erst auf 230 mm gerechnet
  wurde — deshalb offen gelassen.
