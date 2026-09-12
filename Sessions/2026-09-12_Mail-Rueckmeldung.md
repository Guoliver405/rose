# 12.09.2026 — Mail-Versand mit Rückmeldung, Countdown, Testzugänge in Produktion

## Anlass

Rückmeldung des Users aus dem Testbetrieb, drei Punkte:

1. **Testzugänge ohne Mail** gab es scheinbar nur bei der Reinigung. Tatsächlich
   existierte das Häkchen für Rezeption und Manager seit dem 03.09., hing aber
   an `ALLOW_TEST_ACCOUNTS`, das nur lokal gesetzt war — getestet wird in
   Produktion, also war es dort nie zu sehen.
2. **Mails „werden ignoriert":** Innerhalb der 60-Sekunden-Sperre von Supabase
   schien nichts zu passieren. Im Code kam der Fehler sehr wohl zurück — aber
   auf der Personal-Seite stand die Fehlerzeile ganz oben über der
   Reinigungsliste, während „Erneut senden" weit unten bei Rezeption und
   Managern sitzt. Wer dort klickte, sah keine Reaktion. Dazu verschluckte der
   Text die Ursache („Der Link konnte nicht verschickt werden").
3. **Bounces bleiben unbemerkt:** Freenet wies Einladungen ab. Supabase-SMTP
   und Resend hatten die Mail angenommen, die Oberfläche sagte „verschickt",
   und der Grund stand allein im Resend-Log.

Wunsch: Rückkopplung, ob wirklich zugestellt wurde, und ein sichtbarer
60-Sekunden-Countdown an allen Sende-Knöpfen. Der User hat allen vier
Vorschlägen zugestimmt.

## Was gebaut wurde

### Ein Versandweg für alle Mails

`dispatch` in [utils/mail.ts](../src/utils/mail.ts): Zeile in `mail_log`
anlegen → an Resend übergeben (unsere Zeilen-ID reist als Tag `log` mit) →
Ergebnis eintragen. Darauf sitzen `sendGuestAccessMail` (wie bisher),
`sendInviteMail` und `sendRecoveryMail` (neu). **Einladung und Passwort-Link
laufen nicht mehr über Supabase-SMTP:** `generateLink` liefert nur den
`token_hash` (und legt bei `invite` den Auth-Nutzer an), die Mail baut
[lib/mail-templates.ts](../src/lib/mail-templates.ts). Der Link zeigt weiter auf
`/auth/confirm` — der Hash hängt am Konto, nicht am Browser, also auf jedem
Gerät zu öffnen. Die Mail-Vorlagen im Supabase-Dashboard sind damit unbenutzt.

Damit entfallen das Supabase-Auth-Limit (eine Mail je Adresse und Minute plus
Stundenlimit) und der Grund, warum `resendInvitationAction` über
`resetPasswordForEmail` gehen musste. „Erneut senden" erzeugt jetzt einen
`recovery`-Link mit `next=/passwort-neu?einladung=1`, damit die Zielseite die
Person weiter als Eingeladene begrüßt.

### Rückmeldung per Webhook

[api/resend/webhook](../src/app/api/resend/webhook/route.ts): Resend meldet
`email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`,
`email.complained`, `email.failed` — mit dem Grund des Empfänger-Servers. Die
Zeile wird über den Tag gefunden (hilfsweise über die Resend-Kennung), der
Status **geht nur nach vorn** (`advance` in
[lib/mail-status.ts](../src/lib/mail-status.ts)): der Webhook kann die eigene
„übergeben"-Schreibung überholen, und Resend liefert bei Zweifel doppelt —
beides ist damit ohne Ereignis-Tabelle idempotent. Signatur nach dem
Svix-Schema (`svix-id`, `svix-timestamp`, `svix-signature`, Geheimnis
`whsec_…`) in zwanzig Zeilen `node:crypto` nachgebaut und getestet, kein
Paket. Ohne `RESEND_WEBHOOK_SECRET` antwortet die Route 503.

### Oberfläche: Countdown und Statuszeile

[MailDispatch.tsx](../src/components/mail/MailDispatch.tsx): `useMailDispatch`
hält je Sendestelle einen Lauf (Zeilen-ID, Empfänger, Fehler, Startzeit),
zählt 60 s herunter und fragt `getMailStatusAction` alle 3 s nach, bis ein
Endzustand kommt oder 90 s um sind. `MailStatusLine` zeigt: übergeben (mit
Spinner) → zugestellt (grün) / verzögert (amber) / abgewiesen mit Grund (rot)
/ nach 90 s „übergeben, Zustellung unbestätigt" — sie behauptet nie mehr, als
sie weiß. `sendLabel` hängt den Countdown an den Knopf.

Eingebaut an fünf Stellen: Rezeption anlegen, Manager anlegen, „Erneut senden"
(Status **an der Zeile**, dafür `resendTarget`), Gast-Mail auf dem Handout,
Passwort vergessen. Drei Hook-Instanzen auf der Personal-Seite, damit das
Formular „Rezeption" nicht den Knopf in der Liste sperrt. Ein Fehler ohne
Protokollzeile (ungültige Adresse) startet **keinen** Countdown — man darf
sofort korrigieren.

**Ausnahme Passwort vergessen:** nur Countdown, kein Status. Die Seite ist
öffentlich; ein Status gäbe es nur für Adressen mit Konto und verriete dessen
Existenz. Die Drossel schluckt dort still (dieselbe Bestätigung, keine zweite
Mail), und `recoveryFlooded` (30 Passwort-Mails je Stunde über alle Konten)
ersetzt das IP-Limit, das Supabase gratis hatte.

### Drossel und Aufbewahrung

Eine Mail je Bezug und Minute, serverseitig aus `mail_log` abgeleitet
(`cooldown`), als `wait` an die Oberfläche zurückgegeben. Keine Adresse in der
Tabelle — Bezug sind `user_id` (FK `auth.users`, Kaskade) bzw. `stay_id` (FK,
Kaskade) und `hotel_id`; `stays` bleibt anonym. Bounce-Texte können die
Adresse enthalten, deshalb löscht jeder Versand Zeilen älter als 30 Tage.

### Testzugänge in Produktion

`ALLOW_TEST_ACCOUNTS=1` in Vercel gesetzt (User: Tester brauchen fiktives
Personal ohne Postfach). In [TODO.md](../TODO.md) als Rückbau-Punkt vor dem
ersten echten Kunden vermerkt.

## Dateien

- neu: `src/lib/mail-status.ts` (+ Test), `src/lib/mail-templates.ts`,
  `src/components/mail/MailDispatch.tsx`, `src/app/mail-actions.ts`,
  `src/app/api/resend/webhook/route.ts`, `Supabase_sql/2026-09-12_mail_log.sql`
- umgebaut: `src/utils/mail.ts`, `personal/actions.ts` (`ladeEin`,
  `resendInvitationAction`), `PersonalManager.tsx`, `admin/actions.ts`
  (`mailGuestAccessAction`, `GuestAccess.stayId`), `GuestHandoutCard.tsx`,
  `passwort-vergessen/actions.ts` + `ForgotForm.tsx`
- Doku: AGENTS.md („Mail-Versand mit Rückmeldung", Env-Vars, Datenmodell,
  Routen), TODO.md

`npm run verify` grün (317 Unit-Tests).

## Fallstricke

- Der Resend-API-Schlüssel des Projekts ist **send-only** — Webhooks lassen
  sich damit weder anlegen noch auflisten, das Mail-Log nicht lesen. Der
  Webhook muss im Dashboard angelegt werden; das Signing Secret kommt von dort.
- Der Tag-Wert muss ASCII (Buchstaben, Ziffern, `_`, `-`) sein — eine UUID
  erfüllt das.
- Lokal kommen keine Webhooks an (kein öffentlicher Endpunkt): Die Statuszeile
  bleibt bei „übergeben" und meldet nach 90 s „unbestätigt". Das ist korrekt,
  nicht kaputt.

## Produktionslauf (12.09.2026, abends, Claude fährt Chrome, Lotsen-Haus)

Migration eingespielt, Webhook im Resend-Dashboard angelegt, `RESEND_WEBHOOK_SECRET`
in Vercel, Push, Deploy. Die Route antwortet auf einen unsignierten Aufruf mit
400 „ungültige Signatur" (Secret gesetzt, Prüfung aktiv).

| Fall | Ergebnis |
|---|---|
| Testhäkchen „Ohne E-Mail anlegen" bei Rezeption und Manager | in Produktion sichtbar |
| Einladung an nicht existierende **Domain** (`…@dfki-gibt-es-nicht.de`) | „Übergeben", Countdown 60 s am Knopf; **kein** Bounce innerhalb des Fensters — Resend versucht bei DNS-Fehlern weiter, die Zeile bleibt `sent`, nach 90 s „Zustellung noch unbestätigt" |
| Einladung an nicht existierendes **Postfach** bei Gmail | nach ~10 s „Nicht angekommen" mit Gmails Hard-Bounce-Text (Permanent/General); zwei Webhook-Zustellungen, beide 200, Status idempotent |
| „Erneut senden" innerhalb der Minute | Meldung **an der Zeile**: „Gerade erst verschickt …", Knopf zählt herunter |
| „Erneut senden" nach Ablauf (Recovery-Link statt zweiter Einladung) | Mail übergeben — aber **kein** Webhook mehr: Resend unterdrückt Sendungen an Adressen, die hart gebounct haben, ohne Ereignis. Die Zeile bleibt `sent`, die Oberfläche sagt nach 90 s „unbestätigt". Richtig so — sie behauptet nichts, was sie nicht weiß |
| Gast-Mail vom Handout an eine echte Adresse | „Zugestellt an …" nach ~3 s, Knopf zählt herunter |
| Passwort vergessen | in Produktion nicht fahrbar, weil die Seite Angemeldete weiterleitet; Countdown lokal gesehen, Action-Pfad ist derselbe Code |

Ein Schönheitsfehler direkt behoben: Die Drossel-Meldung trug eine eingefrorene
Sekundenzahl neben dem laufenden Countdown (Commit `87eb79c`).

Aufgeräumt: beide Test-Zugänge endgültig gelöscht, Zimmer 101 ausgecheckt.

**Erkenntnis für den nächsten Freenet-Fall:** Ein harter Bounce erscheint mit
Grund in der Oberfläche (Gmail hat es vorgemacht). Hat eine Adresse einmal hart
gebounct, liefert Resend spätere Sendungen dorthin still nicht mehr aus — dann
hilft nur, die Adresse im Resend-Dashboard aus der Suppression-Liste zu nehmen
oder eine andere Adresse zu verwenden. Das steht so noch nicht in der
Oberfläche (offen, siehe TODO).

## Zweiter Schritt: Sperrliste selbst erkennen und lösen

Rückmeldung des Users auf den Produktionslauf: Die stille Sperre nach einem
Bounce ist kritisch. Vorgabe: **automatisch, ohne Pflege durch uns; die
Person am Bildschirm erkennt und löst es selbst, kein Support-Fall.**

Recherche vorab: Resend hat eine Sperrlisten-API (`GET/DELETE
/suppressions/<adresse>`, Antwort mit `origin` = bounce/complaint/manual und
`source_id` = Kennung der auslösenden Mail) und ein Ereignis
`email.suppressed`, das wir nicht abonniert hatten — deshalb kam beim zweiten
Versand nichts zurück. Die API verlangt einen Schlüssel mit **Vollzugriff**;
unser bisheriger ist send-only.

Gebaut:

- **Abfrage vor dem Senden** (`findBlock` in mail.ts): steht die Adresse auf
  der Liste, wird nicht gesendet; zurück kommt `blocked` mit Herkunft, Datum
  und dem Grund des Empfänger-Servers aus dem eigenen Protokoll (über
  `source_id`). Ist Resend nicht fragbar (Sende-Schlüssel, Störung), fällt
  die Prüfung auf `recipient_hash` im eigenen Protokoll zurück — dann ohne
  Freigabe.
- **Freigabe** (`releaseSuppression`): `DELETE`, dann derselbe Versand mit
  `release: true`. Bounct die Adresse wieder, sperrt Resend sie von selbst
  erneut und der neue Grund steht in der Statuszeile. Die Freigabe ist also
  folgenlos, wenn die Adresse wirklich falsch ist, und genau richtig, wenn
  der Fehler behoben wurde.
- **Einladungslink anzeigen** (`inviteLinkAction`): der Ausweg ohne Mail.
  Frischer Recovery-Link zum Kopieren, mit dem Hinweis, dass er das Passwort
  setzt, einmalig ist und ein Missbrauch auffällt. Wer den Zugang anlegen
  darf, darf ihn auch so übergeben. Beim Gast ist der Ausweg der Druck.
- **Provider-Muster** (`domainPattern`, getestet): zwei verschiedene
  Adressen einer Domain hart gebounct, seitdem keine Zustellung → Warnung
  unter der Statuszeile, Senden bleibt erlaubt, erlischt mit der nächsten
  Zustellung. Keine gepflegte Liste.
- Status `suppressed` (Ereignis `email.suppressed`), Spalten
  `recipient_hash`/`recipient_domain` (Migration
  `2026-09-12_mail_log_sperrliste.sql`), `MailStatusLine` nimmt die Auswege
  als `children`.

**Wer sieht was:** Jede Person, die an eine gesperrte Adresse senden will,
sieht die Sperre **vor** dem Senden, in jedem Haus, solange die Adresse bei
Resend gesperrt ist (kein 30-Tage-Limit, weil live gefragt wird). Nur die
Passwort-vergessen-Seite bleibt still — dort wäre jede Auskunft eine
Kontoauskunft; der Ausweg ist Inhaber oder Manager auf der Personal-Seite.

### Produktionslauf zweiter Schritt (Lotsen-Haus, Chrome)

Migration eingespielt, Vollzugriffs-Schlüssel („blocklist_management") in
Vercel und `.env.local`, `email.suppressed` am Webhook, Deploy.

| Fall | Ergebnis |
|---|---|
| Schlüssel-Probe per API | `GET /suppressions/<gmail>` → auf der Liste, `origin: bounce`, `source_id` = Resend-Kennung der gebouncten Mail; unbekannte Adresse → 404 |
| Einladung an die gesperrte Gmail-Adresse | **nicht gesendet**, Kasten „Nicht gesendet — Adresse gesperrt" mit Datum (12.09., 17:47) und beiden Auswegen. Der damalige Grund fehlte — die Protokollzeile war mit dem gelöschten Test-Zugang kaskadiert (FK `user_id`), korrekt |
| „Adresse freigeben und erneut senden" | Freigabe bei Resend, Versand, nach ~3 s neuer Hard-Bounce mit Gmails Text; Resend hat die Adresse von selbst wieder gesperrt (API: 200). Der Kreis schließt sich, ohne dass jemand ein Dashboard braucht |
| „Einladungslink anzeigen" | Link-Kasten mit `token_hash`-URL, „Link kopieren", Sicherheitshinweis. Nicht geöffnet — er würde in diesem Browser die Inhaber-Sitzung ersetzen |
| Provider-Muster | nicht in Produktion provoziert (bräuchte zweite gebouncte Gmail-Adresse und kostet Reputation); Regel in `domainPattern` getestet |

Schönheitsfehler direkt behoben: der Link-Kasten erschien zweimal (unter dem
Einladungskasten und an der Zeile). Test-Zugang gelöscht.

## 🔖 Wiederaufnahme

**Stand:** Beide Schritte in Produktion, beide Läufe bestanden. Offen: den
nächsten echten Freenet-Bounce mit Grund lesen und dann entscheiden
(dedizierte Resend-IP oder zweiter Versender für deutsche Provider);
`ALLOW_TEST_ACCOUNTS` vor dem ersten echten Kunden aus Vercel entfernen.
