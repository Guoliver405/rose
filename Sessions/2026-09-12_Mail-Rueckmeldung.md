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

## 🔖 Wiederaufnahme

**Stand:** Code fertig, Tests grün, committet. Vor dem Push fehlen drei
Handgriffe des Users:

1. Migration `Supabase_sql/2026-09-12_mail_log.sql` im SQL-Editor einspielen
   (additiv — erst einspielen, dann pushen; danach per `git mv` nach
   `archive/`).
2. Im Resend-Dashboard unter **Webhooks** einen Endpunkt anlegen:
   `https://rose-roomservice.app/api/resend/webhook`, Ereignisse `email.sent`,
   `email.delivered`, `email.delivery_delayed`, `email.bounced`,
   `email.complained`, `email.failed`. Signing Secret (`whsec_…`) als
   `RESEND_WEBHOOK_SECRET` in Vercel (Production) setzen — Git-Bash-`printf`-
   Muster, dann redeployen.
3. Produktionslauf: Rezeption mit echter Adresse einladen → Statuszeile
   „zugestellt"; dieselbe Adresse mit Tippfehler in der Domain → „abgewiesen"
   mit Grund; „Erneut senden" innerhalb der Minute → Countdown am Knopf;
   Gast-Mail vom Handout; Passwort vergessen mit Countdown. Und: den nächsten
   Freenet-Bounce mit Grund lesen — dann wissen wir, warum.

**Danach:** Supabase-Mail-Vorlagen können bleiben (unbenutzt), Custom-SMTP in
Supabase kann bleiben (nur noch für Mails, die Supabase von sich aus schickt —
aktuell keine).
