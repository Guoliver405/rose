# 11.10.2026 – Anmelde-Adresse selbst ändern

Anlass: Beim Gegenlesen der Hilfe fragte der User, ob Inhaber ihre Anmelde-Adresse ändern können. Es gab keinen Weg – die Hilfe sagte das auch so. Wunsch: Self-Service, aber risikoarm (keine Kontoübernahme, Zahlungs-Identität stabil, kein Freimonat-Missbrauch). Gebaut in einer Nebensitzung auf Branch `claude/email-aendern-1e88a5`, nicht gepusht.

## 1. Ablauf

1. **„Mein Zugang“** (`…/admin/einstellungen/zugang`), neuer Abschnitt „Anmelde-Adresse ändern“ für Inhaber, Manager, Rezeption: neue Adresse + **aktuelles Passwort** (wie beim Passwortwechsel – eine offen stehende Sitzung genügt nicht).
2. Link an die **neue** Adresse über den gemeinsamen Mail-Weg (`dispatch`, Zweck `email_change`): Drossel 60 s je Person, Zustellstatus, Sperrliste mit „Adresse freigeben und erneut senden“. Bis zum Klick bleibt die alte Adresse gültig; die Seite zeigt die offene Änderung mit Ablaufzeit und „Änderung abbrechen“.
3. **Bestätigungsseite** `/auth/email-bestaetigen?token=…`: zeigt die neue Adresse (Name vor dem @ ausgeblendet) und einen Knopf. Erst der Knopf stellt um – Virenscanner mancher Mail-Anbieter öffnen Links vorab, ein Link, der beim Öffnen umstellt, wäre dann verbraucht. Keine Anmeldung nötig (Handy, auf dem die Mail gelesen wird).
4. Nach der Umstellung **Hinweis an die alte Adresse** (`email_changed`): neue Adresse, „Waren Sie das nicht? → Inhaber, beim Inhaberzugang Impressum“.
5. Beim **Inhaber**: `syncOwnerStripeEmail` setzt die E-Mail aller seiner Stripe-Kunden (an diese Adresse gehen die Rechnungen). Kunden-ID, Zahlungsweg, Rechnungsdaten bleiben. Fehler dort brechen nichts ab (protokolliert).

## 2. Entscheidung: nicht Supabases `email_change`

Nachgemessen am 11.10. mit einem Wegwerf-Nutzer: `generateLink({ type: 'email_change_new' })` liefert einen gültigen Schlüssel, `verifyOtp` nimmt ihn an – **ohne Fehler und ohne Umstellung**. Im Projekt ist „Secure email change“ aktiv, es fehlt die zweite Bestätigung an der alten Adresse.

Gründe gegen beide Wege mit Supabase:

- **Mit** dem Schalter bräuchte es einen Klick an der alten Adresse. Das sperrt genau die aus, deren alte Adresse nicht mehr erreichbar ist (Postfach beim früheren Arbeitgeber, aufgegebener Anbieter) – der häufigste Grund für eine Änderung.
- **Ohne** den Schalter hinge der Ablauf an einer Einstellung im Dashboard, die der Code nicht sieht: Würde sie umgelegt, bräche die Umstellung still ab (oder geschähe – beim Vorab-Verbrauch des zweiten Schlüssels – ohne Bestätigung).

Stattdessen eigener Schlüssel (Tabelle `email_change_requests`, nur SHA-256 gespeichert, 24 h) und `admin.updateUserById({ email, email_confirm: true })`. Die Sicherung tragen: aktuelles Passwort + Klick an der neuen Adresse + Hinweis an die alte. Supabases Schalter bleibt, wie er ist – er betrifft nur `updateUser({ email })` aus dem Client, das RoSe nirgends benutzt.

## 3. Prüfpunkte aus dem Auftrag

- **Vergebene Adresse, ohne zu verraten, ob es ein Konto gibt:** Die Anfrage prüft das nicht; der Link geht in jedem Fall raus. Erst die Umstellung scheitert (`email_exists` der Admin-API) mit „Zu dieser Adresse gibt es bereits einen Zugang“ – das sieht nur, wer das Postfach der Adresse hat. Die eigene Adresse wird sofort abgewiesen (das verrät nichts).
- **Fallstrick Kollision:** `updateUserById` meldet eine schon vergebene Adresse nicht als `email_exists`, sondern als leeren 500er (`{}`) – im Integrationstest gefunden. Im Fehlerfall fragt `addressTaken` deshalb über `generateLink({ type: 'email_change_new' })` nach, das ausdrücklich `email_exists` liefert (ohne Versand).
- **Drossel:** `MAIL_COOLDOWN_SECONDS` je Person und Zweck, wie bei allen Mails. Gedrosselt oder gesperrt → es wird nichts abgelegt, eine vorher offene Änderung bleibt gültig.
- **`mail_log`:** zwei neue Zwecke, Migration `Supabase_sql/2026-10-11_email_aendern.sql` (additiv: Tabelle + CHECK). **Erst einspielen, dann pushen.**
- **Simulator-Konten** (`sim_accounts`) hängen an der Nutzer-ID und bleiben gültig. (Reine Simulator-Konten haben „Mein Zugang“ nicht; dort gibt es noch keinen Weg – siehe offene Punkte.)
- **Freimonat:** hängt an `accounts.created_at` (Registrierungsmonat + Folgemonat), nicht an der Adresse. Eine neue Adresse öffnet keinen zweiten Freimonat – kein Missbrauchsweg. Ein neues Konto mit neuer Adresse war schon immer möglich und ist eine andere Frage.
- **Reinigungskräfte:** ausgeschlossen (Anmeldung hängt an der aus dem Benutzernamen gebauten Adresse); serverseitig über `profiles.username` geprüft, nicht nur über die Rolle.
- **Sitzungen:** bleiben offen; die nächste Anmeldung braucht die neue Adresse.

## 4. Dateien

- `src/lib/email-change.ts` (+ Test): Normalisieren, Prüfen, Schlüssel/Hash/Ablauf, Maskieren.
- `src/utils/email-change.ts`: `requestEmailChange`, `confirmEmailChange`, `peekEmailChange`, `pendingEmailChange`, `cancelEmailChange`; Mails und Stripe als `EmailChangeEffects` einspritzbar.
- `src/lib/mail-templates.ts`: `emailChangeConfirmMail`, `emailChangedNoticeMail` (Texte als Parameter). `src/utils/mail.ts`: `sendEmailChangeConfirmMail`, `sendEmailChangedNoticeMail`.
- `src/utils/stripe.ts`: `syncOwnerStripeEmail`.
- Oberfläche: `ZugangForm.tsx`, `zugang/page.tsx`, Actions `requestEmailChangeAction`/`cancelEmailChangeAction`; `src/app/auth/email-bestaetigen/`.
- Texte nur in `admin.settings.myAccess` (`email`, `confirm`, `mails`) und im Hilfe-Thema `zugang` – die übrigen Sprachdateien lagen parallel in der Lese-Runde. Die Mail- und Bestätigungstexte gehören fachlich nach `mail.ts`/`auth.ts`; nach der Lese-Runde umziehen, wenn gewünscht.
- `tests/integration/email-change.test.ts`.

## 5. Nachweis

- Migration am 11.10. vom User eingespielt.
- `npm run verify` grün, `tests/integration/email-change.test.ts` grün (7 Fälle: falsches Passwort, eigene Adresse, Reinigungskraft, Drossel legt nichts ab, Umstellung mit ersetztem Link und Hinweis, vergebene Adresse, Ablauf und Abbruch).
- Browser lokal (Dev-Server, eigenes Testhaus, danach gelöscht): falsches Passwort → Meldung am Abschnitt; richtiges Passwort an eine nicht zustellbare Testadresse → offene Änderung mit Ablaufzeit, Hinweis „verschickt“, Statuszeile mit dem Bounce des Empfänger-Servers; Bestätigungsseite mit maskierter Adresse → Knopf → „Erledigt“, „Mein Zugang“ zeigt die neue Adresse, derselbe Link danach „ungültig“; `mail_log` zeigt `email_change` und `email_changed`.

## 6. Offene Punkte

- Versand an eine echte Adresse einmal von Hand (Mail an die neue Adresse, Klick, Hinweis an die alte; beim Inhaber in Stripe die Kunden-E-Mail prüfen).
- Simulator-Konten ohne Hotelzugang können ihre Adresse noch nicht ändern (`/simulator/konto`) – derselbe Ablauf ließe sich dort einhängen.
- Inhaber, die ihr Passwort UND die alte Adresse verloren haben, bleiben ein Support-Fall.
