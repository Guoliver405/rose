# 05.09.2026 — Login-Actions getestet, IP-Drossel für die Gast-Anmeldung

Die beiden Punkte aus „Vor den ersten echten Kunden" in [TODO.md](../TODO.md),
beide seit der Übergabe vom 26.07. offen.

## 1. IP-Drossel

**Lücke:** Das Rate-Limit lag allein am Aufenthalt (`stays.pin_attempts`, fünf
Fehlversuche → 15 Minuten). Das schützt die PIN eines Zimmers. Wer von außen
die Zimmernummern eines Hauses durchprobiert, sperrt mit fünf Versuchen je
Zimmer nacheinander jeden echten Gast aus — und die generische Meldung kommt
zwar überall gleich, aber die Sperrmeldung nach fünf Versuchen verrät, dass
das Zimmer belegt ist.

**Lösung:** Zweite Schranke je Absender-IP über alle Häuser, gleitendes Fenster.

| Baustein | Datei |
|---|---|
| Rechenregeln, Schwelle, IP aus Headern, Hash | [src/lib/login-throttle.ts](../src/lib/login-throttle.ts) (I/O-frei, 11 Unit-Tests) |
| Lesen/Schreiben `guest_login_failures` | [src/utils/login-throttle.ts](../src/utils/login-throttle.ts) |
| Einbau in `guestLoginAction` | [src/app/guest/actions.ts](../src/app/guest/actions.ts) |
| Migration (additiv) | [Supabase_sql/2026-09-05_guest_login_failures.sql](../Supabase_sql/2026-09-05_guest_login_failures.sql) |

Entscheidungen:

- **30 Fehlversuche in 15 Minuten**, nicht fünf. Alle Gäste eines Hauses
  teilen sich hinter dem Hotel-WLAN meist eine öffentliche IP; fünf je IP
  würden am Anreisetag das ganze Haus aussperren. Dreißig kommen im Betrieb
  nicht zusammen, begrenzen einen Angreifer aber auf sechs Zimmer je
  Viertelstunde statt auf alle.
- **Prüfung vor der Zimmerauflösung.** Eine gesperrte IP erfährt nicht einmal
  mehr, ob eine Nummer existiert. Kostet einen Roundtrip je Anmeldung.
- **Jeder generische Rückweg zählt** — Slug unbekannt, Zimmer unbekannt, kein
  PIN-Aufenthalt, Aufenthalt gesperrt, PIN falsch. Erfolge zählen nicht.
- **Protokoll statt Zähler:** eine Zeile je Fehlversuch. Kein
  Lese-Schreib-Rennen bei gleichzeitigen Versuchen, das Fenster gleitet
  wirklich. Klein bleibt die Tabelle, weil jeder Fehlversuch zugleich alle
  Zeilen außerhalb des Fensters löscht — kein Cron.
- **Nur der Hash der IP** (SHA-256, 32 Hex). Eine IP ist personenbezogen; die
  Zeilen leben Minuten.
- Fehlt jeder IP-Header, gilt der Ersatzschlüssel `unknown` — die Drossel
  bleibt an, statt sich still abzuschalten.
- Vor der Migration läuft der Code weiter: die Abfrage liefert dann keine
  Zeilen (nicht gesperrt), das Schreiben scheitert still. Deshalb Reihenfolge
  **erst einspielen, dann pushen**.
- Die Reinigungs-Anmeldung bekommt keine eigene Drossel — sie läuft über
  `signInWithPassword` und damit über das IP-Limit von Supabase Auth.

## 2. Login-Actions im Integrationstest

[tests/integration/login.test.ts](../tests/integration/login.test.ts), 14 Fälle:

- **Gast über Zimmernummer + Slug:** richtige PIN setzt das Cookie mit dem
  `session_token` und leitet ins eigene Haus · PIN aus A1 öffnet die 101 in
  B1 nicht, der Fehlversuch landet am angesprochenen Aufenthalt · unbekannter
  Slug und unbekanntes Zimmer geben dieselbe Meldung · Link-Aufenthalt ist
  kein Kandidat, sein Zähler bleibt 0.
- **Rate-Limit je Aufenthalt:** fünf Fehlversuche sperren A1/101 auch für die
  richtige PIN; A1/102 und B1/101 melden weiter an.
- **Zimmer-Token:** richtige PIN leitet in das Haus des Aufenthalts;
  unbekannter Token generisch.
- **IP-Drossel:** 28 Fehlversuche vorgelegt, zwei echte durch die Action
  (gezählt: 30), dann weist die richtige PIN mit der Netz-Meldung ab und der
  Aufenthalts-Zähler bleibt unberührt; eine andere IP kommt durch, ihr
  Erfolg hinterlässt keine Zeile.
- **Reinigung:** eigenes Haus → `svc_`-Cookies, Ziel `/h/<slug>/service` ·
  Namensvetterin unter dem falschen Slug → `error=invalid` · unter ihrem Slug
  mit ihrer PIN → Erfolg · beendeter Zugang → `error=invalid` · unbekannter
  Slug → `/service/login` · fehlendes Feld → `error=missing`.

Gerüst: `next/headers` liefert Cookie-Speicher und eine steuerbare
Absender-IP, `next/navigation.redirect` wirft ein Signal, das der Test
auffängt, `next/cache` ist ein Leerlauf. Die Testwelt gibt den beiden
Reinigungskräften jetzt **verschiedene** PINs — mit derselben wäre „PIN aus
A1 unter dem Slug von B1" nicht von einem Erfolg zu unterscheiden. Test-IPs
kommen aus einem zufälligen `10.x.y`-Netz je Lauf; die Fehlversuchs-Zeilen
räumt der Lauf über seine eigenen IP-Hashes ab.

## Offen am Ende der Sitzung

- ~~Migration einspielen~~ — vom User im SQL-Editor eingespielt, Datei nach
  `archive/` verschoben. (Die Chrome-Erweiterung war in dieser Sitzung nicht
  erreichbar, obwohl Chrome lief — das Claude-Seitenpanel muss offen und
  angemeldet sein.)
- ~~Integrationstests in CI~~ — Commit `5c11fd8`, CI grün: `login.test.ts`
  14/14 (46 s), alle vier Integrationsdateien bestanden, Vercel-Deployment
  erfolgreich.
- ~~Drossel in Produktion~~ — auf `test-hotelkette` per Skript in der
  Browser-Ansicht Zimmer 901 mit falscher PIN durchprobiert (kein Aufenthalt
  berührt); ab der Schwelle kam „Zu viele Fehlversuche aus diesem Netz —
  bitte in 8 Min. erneut versuchen." Nebenwirkung: die IP des Entwickler-
  rechners war danach für die Gast-Anmeldung acht Minuten gesperrt.
  Werkzeug-Notiz: ein **versteckter** Browser-Tab drosselt `setTimeout` nach
  fünf Minuten auf einmal pro Minute — Skripte dort über `MessageChannel`
  takten, nicht über Timer.
- Optional: Fall „IP-Drossel" in den [GUI-Testkatalog](GUI-Testkatalog.md)
  aufnehmen (30 Fehlversuche von einem Gerät, dann richtige PIN).
