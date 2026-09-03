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

- **Mail-Versand: lokal geprüft, in Produktion noch nicht eingerichtet.** Nach
  dem Setzen von `RESEND_API_KEY` und `GUEST_MAIL_FROM` wurde eine echte Mail
  verschickt und kam an. Der Absender trägt seither den **Hotelnamen** als
  Anzeigenamen — der Gast hat bei einem Hotel eingecheckt, nicht bei einer
  Software; die Adresse bleibt fest, weil nur ihre Domain verifiziert ist. Der
  Hotelname wird vor dem Einsetzen bereinigt (ein Zeilenumbruch darin wäre eine
  Header-Injection). Beide Variablen sind inzwischen auch in Vercel gesetzt und
  deployt; ein Blick aufs Handout in Produktion steht noch aus (siehe
  [TODO.md](../TODO.md)).
- Der Link in der Mail zeigt lokal auf `localhost:3000`, weil er aus
  `NEXT_PUBLIC_SITE_URL` kommt. In Produktion steht dort die echte Adresse —
  derselbe Fall wie bei der Reset-Mail, in den Fallstricken vermerkt.
- Ein ausgecheckter Gast, der seinen alten Link scannt, landet auf der
  **mandantenfreien** Hinweisseite (`/guest?error=link`), nicht auf der seines
  Hotels. Bewusst so: Die Route kennt den Mandanten nur über einen gültigen
  Aufenthalt. Der Text dort trägt den Fall, ist aber allgemein gehalten.

## 5. Nachtrag: Testzugänge ohne Mailversand

Direkt im Anschluss beauftragt: Im Testbetrieb sollen sich Rezeptions- und
Manager-Zugänge anlegen lassen, ohne dass jeder Tester ein echtes Postfach
beisteuert — die sind quantitativ begrenzt.

Umgesetzt als Häkchen „Ohne E-Mail anlegen (Testbetrieb)" in beiden
Anlege-Formularen. Statt einer Einladung entsteht der Zugang direkt
(`createUser` mit `email_confirm: true`), das Passwort wird **genau einmal**
angezeigt. Weil kein Bestätigungslauf stattfindet, sind auch nicht zustellbare
Adressen wie `zz-test1@rose.local` brauchbar — an denen scheitert sonst jeder
Mailversand.

**Der Riegel ist bewusst nicht das Häkchen, sondern die Umgebungsvariable**
`ALLOW_TEST_ACCOUNTS=1` ([test-accounts.ts](../src/lib/test-accounts.ts)).
Einladungen haben im Juli die vorgelesenen Passwörter abgelöst, damit kein
Passwort je außerhalb des Kopfes seiner Person existiert; ein Häkchen, das jeder
Kunde anklicken kann, holte genau das zurück. Geprüft wird zusätzlich
serverseitig in `ladeEin`, weil ein Formularfeld manipulierbar ist. Fehlt die
Variable, erscheint das Häkchen nicht und der Weg existiert nicht — dasselbe
Muster wie bei `SIGNUP_INVITE_CODE`.

Nebenbei kam heraus, dass `'use server'`-Dateien **nur async Funktionen
exportieren dürfen** — die synchrone Prüffunktion musste deshalb in eine eigene
Datei unter `src/lib/`.

Verifiziert: Häkchen erscheint in beiden Formularen, Zugang mit
`…@rose.local` angelegt, Passwort einmal angezeigt, keine Mail verschickt. Der
Datenbestand stimmt (Auth-Konto mit bestätigter Adresse, Profil,
Rezeptions-Rolle) — der Zugang ist also wirklich anmeldefähig, nicht nur
angelegt. Testzugang danach über die Oberfläche wieder entfernt.

Der Rückbau gehört zum Test-Szenario und steht in [TODO.md](../TODO.md).

---

## 🔖 Wiederaufnahme

**Stand am Ende des 03.09.2026:** Beide Verfahren stehen und sind end-to-end
durchgespielt, der Mailversand ist mit einer echten Mail geprüft, und im
Testbetrieb lassen sich Zugänge ohne Postfach anlegen. Alles committet und
gepusht, Arbeitsverzeichnis sauber, `verify` grün (114 Unit-, 39
Integrationstests). Zwei Migrationen des Tages sind eingespielt und archiviert.

Der Kern dieses Themas ist `stays.access_mode` — wer daran arbeitet, sollte
wissen, dass das Verfahren **am Aufenthalt** hängt und nicht an der
Hotel-Einstellung. Jede Stelle, die fragt „wie kommt dieser Gast rein?", liest
den Aufenthalt, nie die Policy; die Policy gilt ausschließlich beim Check-in.

**Womit es weitergeht:** Die offenen Punkte stehen gesammelt in
[TODO.md](../TODO.md). Das Naheliegendste zuerst — ein Blick aufs Handout in
Produktion (greifen dort `RESEND_API_KEY` und `GUEST_MAIL_FROM`?), danach die
ungetesteten Login-Actions samt Rate-Limit über Mandantengrenzen.

Der ganze Tag im Überblick: das
[Zimmer- und Personal-Protokoll](2026-09-03_Zimmer-loeschen-bearbeiten-und-Testdaten.md)
trägt den ersten Teil (Löschen und Bearbeiten, Abrechnungs-Snapshot,
Löschbegehren), dieses hier den zweiten.

**Wenn hier weitergearbeitet wird:**

- Neue Zugangswege gehören in `src/lib/guest-access.ts` (I/O-frei, getestet) —
  dort liegen auch die Adress-Builder für QR und Link.
- Beim `link`-Verfahren entsteht **keine** PIN. Wer eine Stelle baut, die
  `stays.pin` liest, muss mit `null` rechnen.
- Der Mail-Weg ist bewusst der einzige Ort mit eigenem Versand-Code
  ([mail.ts](../src/utils/mail.ts)). Alles andere läuft weiter über Supabase
  Auth.
