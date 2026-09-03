# 03.09.2026 — Zwei Gast-Zugangsverfahren

**Auftrag:** RoSe soll zwei Wege ins Gäste-Portal anbieten — den festen
Zimmer-QR mit PIN (Standard) und einen individuellen QR/Link je Aufenthalt ohne
PIN. Die Wahl gehört in die Einstellungen, ausführlich erläutert, und für beide
Fälle braucht der Check-in einen Druck- und Mail-Weg.

## 1. Die drei Entscheidungen vorab

Vor dem Bauen standen drei Fragen, die keine Fleißarbeit waren.

**Gast-E-Mail → flüchtig.** `stays` ist bewusst anonym: kein Name, keine
Adresse. Eine gespeicherte E-Mail hätte aus jedem Aufenthalt einen Datensatz mit
Personenbezug gemacht. Entscheidung: Die Adresse wird eingegeben, verwendet und
**nicht gespeichert**. Preis: kein erneutes Senden ohne erneute Eingabe.

**Verfahren am Aufenthalt, nicht an der Einstellung.** Mein erster Vorschlag
band das Verfahren an die Policy und musste deshalb Sonderfälle für laufende
Aufenthalte klären. Der Einwand aus der Abstimmung war besser: Das Verfahren
wird beim Check-in **am Aufenthalt festgehalten** (`stays.access_mode`). Damit
ist ein Wechsel folgenlos — ausgegebene Zugänge gelten bis zum Check-out, erst
der nächste Check-in folgt dem neuen Verfahren. Kein Stichtag, keine
Bestandsmigration, keine Sonderbehandlung.

**Keine PIN als Rückfall.** Ich hatte vorgeschlagen, beim individuellen
Verfahren die PIN trotzdem zu drucken — für den Fall, dass ein Gast den
Wandaushang scannt. Zurückgewiesen, und zu Recht: Wer auf individuell umstellt,
nimmt die Aushänge ab, den Fall gibt es also nicht. Ein zweiter Zugangsweg, den
niemand erfährt, wäre nur Angriffsfläche. `stays.pin` ist deshalb jetzt
**nullable**.

**Nachtrag aus der Abstimmung:** Die Wahl muss je Haus möglich sein — ein
Inhaber kann Häuser mit unterschiedlichen Verfahren haben. Das war strukturell
bereits erfüllt, weil alle Regeln in `hotels.policies` liegen; vermerkt ist es
trotzdem in [TODO.md](../TODO.md), damit spätere kontoweite Vorgaben es nicht
versehentlich vereinheitlichen.

## 2. Gebaut

- **Migration** `stays.access_mode` (`pin` | `link`), `stays.guest_token`,
  `pin` nullable. Ein CHECK sichert, dass jeder Aufenthalt genau seinen
  Zugangsweg hat — sonst entstünde ein Aufenthalt, auf den niemand zugreifen
  kann, und das fiele erst dem Gast auf.
- **Route `/guest/s/<token>`** — meldet ohne Eingabe an, mandantenfrei wie der
  Zimmer-QR (der Token trägt den Mandanten selbst), erlischt über
  `checked_out_at` von allein. Kein Aufräumen, kein Ablaufdatum.
- **`guestLoginAction`** nimmt nur noch Aufenthalte mit `access_mode = 'pin'`
  als Kandidaten. Ohne das liefe die Rate-Limit-Zählung auf Aufenthalten, die
  per PIN gar nicht zu öffnen sind.
- **Einstellungsseite** `…/einstellungen/gastzugang` mit der Gegenüberstellung:
  Ablauf, Dafür, Dagegen und „Passt zu Ihnen, wenn …" je Verfahren, dazu ein
  Kasten, was beim Umstellen passiert. Der fehlende zweite Faktor beim
  individuellen Verfahren steht dort offen — nicht als Fußnote.
- **Handout** trägt je nach Verfahren QR + PIN oder nur den QR, mit dem Hinweis,
  den Zettel wie einen Zimmerschlüssel zu behandeln. Darunter der Mail-Versand.
- **Mail** über einen `fetch` gegen die Resend-API, ohne neues Paket. Fehlen
  `RESEND_API_KEY` oder `GUEST_MAIL_FROM`, bietet die Oberfläche den Versand gar
  nicht erst an. **In die Mail kommt kein QR-Bild, sondern der Link** — Gmail
  blockiert `data:`-URIs, der Code wäre ausgerechnet dort unsichtbar. QR braucht
  nur Papier.
- **Zwei Sackgassen geschlossen:** Der Rezeptions-Dialog zeigt bei `link` statt
  der PIN den Hinweis auf den auszuhändigenden Zugang, und `/h/<slug>/guest`
  erklärt in `link`-Häusern, dass der QR vom Check-in-Beleg gemeint ist — das
  Formular bleibt aber stehen, weil Aufenthalte aus der Zeit davor es brauchen.

## 3. Verifikation

`npm run verify` grün (114 Unit-Tests, davon 6 neue für
`parseGuestAccessMode` und die Adress-Bildung). Im Browser durchgespielt:

| Schritt | Ergebnis |
|---|---|
| Check-in im PIN-Verfahren | PIN 665850, Anzeige unverändert ✅ |
| Einstellungsseite | beide Karten vollständig, „derzeit aktiv", Warnung bei `link` ✅ |
| Umstellung auf `link` | Meldung samt Hinweis, die Aushänge abzunehmen ✅ |
| Check-in **nach** der Umstellung | „ZUGANG AUSHÄNDIGEN", keine PIN ✅ |
| **Aufenthalt von vorher** | zeigt weiter „GAST-PIN 665850" ✅ ← der Kernbeweis |
| Handout (`link`) | QR ohne PIN, Sicherheitshinweis, Mail-Bereich degradiert sauber ✅ |
| Link aufrufen | landet ohne Eingabe im Portal von Zimmer 102 ✅ |
| Check-out → Link erneut | abgewiesen, Weiterleitung auf die Hinweisseite ✅ |
| `/h/<slug>/guest` im `link`-Modus | erklärender Hinweis, Formular bleibt erreichbar ✅ |

Danach zurückgestellt auf `pin`, Testdaten über „Testdaten vollständig
entfernen" abgeräumt (2 Aufenthalte, 2 Verlaufs-Einträge).

## 4. Offen

- **Mail-Versand ist ungetestet in freier Wildbahn** — lokal fehlen
  `RESEND_API_KEY` und `GUEST_MAIL_FROM`, die Oberfläche zeigt korrekt den
  Hinweis. Sobald die Variablen gesetzt sind, gehört ein echter Versand geprüft.
- Ein ausgecheckter Gast, der seinen alten Link scannt, landet auf der
  **mandantenfreien** Hinweisseite (`/guest?error=link`), nicht auf der seines
  Hotels. Bewusst so: Die Route kennt den Mandanten nur über einen gültigen
  Aufenthalt. Der Text dort trägt den Fall, ist aber allgemein gehalten.

---

## 🔖 Wiederaufnahme

**Stand:** Beide Verfahren stehen und sind end-to-end durchgespielt. Der Kern
ist `stays.access_mode` — wer daran arbeitet, sollte wissen, dass das Verfahren
**am Aufenthalt** hängt und nicht an der Hotel-Einstellung. Jede Stelle, die
fragt „wie kommt dieser Gast rein?", liest den Aufenthalt, nie die Policy; die
Policy gilt ausschließlich beim Check-in.

**Wenn hier weitergearbeitet wird:**

- Neue Zugangswege gehören in `src/lib/guest-access.ts` (I/O-frei, getestet) —
  dort liegen auch die Adress-Builder für QR und Link.
- Beim `link`-Verfahren entsteht **keine** PIN. Wer eine Stelle baut, die
  `stays.pin` liest, muss mit `null` rechnen.
- Der Mail-Weg ist bewusst der einzige Ort mit eigenem Versand-Code
  ([mail.ts](../src/utils/mail.ts)). Alles andere läuft weiter über Supabase
  Auth.
