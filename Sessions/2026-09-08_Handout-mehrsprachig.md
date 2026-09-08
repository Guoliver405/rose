# Gast-Handout: DIN A4, vier Sprachen, Nachhaltigkeit (08.09.2026)

> **Auftrag des Users:** Die Anleitung für Gäste soll auf dem Zugangs-Handout
> **neben** den QR-Bereich — in mindestens vier Sprachen (de, en, es, fr), weil
> auf DIN A4 Platz ist, während der QR-Bereich klein bleibt. Das Handout soll
> erklären, wofür das Portal da ist und wie es funktioniert, und dabei das
> Nachhaltigkeits-Argument bringen: Verzicht auf tägliche Zimmerreinigung.

## 1. Vier Sprachen aus einer Vorlage

[guest-guide.ts](../src/lib/guest-guide.ts) war schon die eine Quelle für
Handout und Mail; jetzt trägt sie vier Sprachen. Aufbau: eine `Vorlage` je
Sprache mit den festen Sätzen und **Funktionen** für die Sätze, in denen
Uhrzeiten des Hauses stecken (`cleaningRoutine(due)`, `window(start, end)`,
`defer(limit)`). `buildGuestGuide(policies, opts, lang)` setzt sie zusammen,
`buildGuestGuides(…)` liefert alle vier in Druckreihenfolge.

Die Signatur ist rückwärtskompatibel — `lang` hat den Vorgabewert `de`, also
laufen Mail und die beiden Aufrufe in `actions.ts` unverändert weiter.

**Der teuerste Fehler bei Übersetzungen ist die vergessene Zeile.** Drei Tests
schließen ihn aus: kein Feld darf in einer Sprache leer sein, jede Sprache
muss alle Uhrzeiten des Hauses enthalten, und die drei Zugangs-Sätze (Link ·
QR+PIN · Adresse+PIN) müssen sich auch übersetzt voneinander unterscheiden.

## 2. Nachhaltigkeit — ehrlich verzweigt

Neuer Punkt `sustainability`, und er hängt an derselben Policy wie der
Reinigungs-Satz:

- **Reinigung nur auf Wunsch** (Vorgabe): „Weniger Reinigung, weniger
  Verbrauch: Jede Reinigung, die nicht nötig ist, spart Wasser, Waschmittel
  und Energie. Deshalb kommen wir nur, wenn Sie es möchten."
- **Routine läuft**: „Sie brauchen heute keine Reinigung? Ein Tipp auf „Bitte
  nicht stören" spart Wasser, Waschmittel und Energie — und Ihnen die
  Störung."

Zum Verzicht aufrufen, während das Haus ohnehin täglich reinigt, wäre eine
Lüge auf Papier. Der Hebel ist dann ein anderer, und der Text nennt ihn.

## 3. Der Umbruch ist gerechnet, nicht geraten

Erster Entwurf: links Zugang, rechts vier Sprachblöcke untereinander. Im
Browser bei 186 mm Blattbreite nachgemessen — **280 mm hoch**, also eine
zweite Seite. Ursache war nicht die Textmenge, sondern die Verteilung: Die
Zugangs-Spalte ist nur 122 mm hoch, darunter blieben 130 mm leer.

Jetzt zwei Zeilen:

```
┌─ farbige Linie ────────────────────────────────┐
│ Willkommen · Welcome · Bienvenido · Bienvenue  │
│ Zimmer · Room · Habitación · Chambre  101      │
├───────────────┬────────────────────────────────┤
│ QR            │ DEUTSCH  …                     │
│ PIN           │ ENGLISH  …                     │
│ Adresse       │                                │
├───────────────┴────────────────────────────────┤
│ ESPAÑOL  …          │ FRANÇAIS  …              │
└────────────────────────────────────────────────┘
```

Nachgemessen: **230 mm**. Passt auf A4 auch mit großzügigen Rändern.

## 4. Print-Fallstrick, der beinahe durchgerutscht wäre

Die alte Kopfzeile war eine farbig **gefüllte** Fläche mit weißer Schrift.
Browser drucken Hintergrundflächen standardmäßig nicht — auf Papier wäre ein
weißer Balken mit weißer Schrift herausgekommen. Beim kleinen Zettel fiel das
nicht auf, weil unter der Fläche noch dunkler Text stand; bei einem Blatt, das
mit der Zimmernummer beginnt, wäre es der halbe Kopf gewesen.

Deshalb trägt die Farbe jetzt eine **Linie** (Rahmen drucken immer) und der
Text bleibt dunkel. Aus demselben Grund strukturieren Linien die Sprachblöcke,
keine Flächen. Das spart nebenbei Toner.

## 5. Mail

Die Mail bleibt **deutsch** — viermal derselbe Text wäre als Mail unlesbar.
Sie bekommt aber den Nachhaltigkeits-Satz mit. Dabei ein Detail, das leicht
auseinanderläuft: Die HTML-Fassung zählte die Punkte einzeln mit fest
verdrahteten Beschriftungen auf, die Reintext-Fassung nimmt `guideLines()`.
Ein neuer Punkt wäre also nur im Reintext gelandet. Jetzt nimmt auch das HTML
die Beschriftungen aus `guide.labels`.

## 6. Verifiziert

`npm run verify` grün (264 Tests). Im Browser am Testhaus: Blatt in Hell und
Dunkel, alle vier Sprachblöcke an ihrem Platz (ES und FR nebeneinander in der
zweiten Zeile, nachgemessen an den Rechtecken), Höhe 230 mm bei 186 mm Breite.

**Offen:** Ob die Mail eine Sprachwahl bekommt — und ob das Gastportal selbst
irgendwann mehrsprachig wird; heute ist es komplett deutsch, und ein Gast, der
den Zettel auf Spanisch liest, landet danach in einer deutschen Oberfläche.
Das ist die eigentliche Lücke, die dieser Zettel sichtbar macht. Steht in
[TODO.md](../TODO.md).
