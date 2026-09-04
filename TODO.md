# Offene Punkte

Stand 04.09.2026. Herkunft in Klammern; Erledigtes wird gestrichen, nicht
gelöscht, damit erkennbar bleibt, was einmal offen war.

## Vor den ersten echten Kunden

- [ ] **Login-Actions testen** — `guestLoginAction` und `maidLoginAction` sind
      die einzigen ungetesteten Auth-Pfade (sie leiten per `redirect()` um und
      brauchen etwas Gerüst). Wertvollster Einzeltest: *fünf Fehlversuche
      sperren nur den eigenen Aufenthalt im eigenen Haus* — Rate-Limit über
      Mandantengrenzen. (Übergabe 26.07.)
- [ ] **IP-Rate-Limit für die Gast-Anmeldung** — bisher limitiert nur der
      Aufenthalt selbst (`stays.pin_attempts`). (Übergabe 26.07.)
- [ ] **Testplan D–G** durchlaufen. (Übergabe 26.07.)

## Produktentscheidungen

- [ ] **Pricing-Form**: zimmergenau oder Staffeln. Die Messgröße steht seit
      03.09. fest (`billing_snapshots`), die Rechnungsseite nicht.
      (6d-Plan, Abschnitt 14)
- [ ] **Zwei Zimmer-Zustände?** Aktuell gibt es einen (`deactivated_at`). Ob
      „Renovierung" von „abbestellt" getrennt gehört, ist eine reine
      Preisfrage — am Datenmodell ändert sie nichts. (6d-Plan, Abschnitt 14)
- [ ] **Hotel zwischen Konten verschieben** (Betreiberwechsel) — bisher außen
      vor. (6d-Plan, Abschnitt 14)

## Komfort für Mehrhaus-Kunden (Ketten)

- [ ] **Konto-weite Service-Vorschlagsliste**
- [ ] **Kontoweite Policy-Vorgaben** mit Abweichung je Haus — **Achtung:** Das
      Gast-Zugangsverfahren (`guestAccessMode`) gehört ausdrücklich zu denen,
      die je Haus abweichen dürfen. Es hängt an der baulichen Situation
      (Aushänge im Zimmer möglich oder nicht), nicht am Konto.
- [ ] **Konsolidierte Auswertung** über alle Häuser

(alle drei: 6d-Plan, Abschnitt 13)

## Kleinkram und Beobachtungen

- [ ] **Test-Szenario ausbauen**, wenn es nicht mehr gebraucht wird — samt
      `purgeTestDataAction`. Rückbau-Hinweis steht in `test-actions.ts`.
- [ ] **Testzugänge ohne Mailversand ausbauen** (gehört zum selben Rückbau):
      `ALLOW_TEST_ACCOUNTS`, [test-accounts.ts](src/lib/test-accounts.ts), der
      `ohneMail`-Zweig in `ladeEin` und das Häkchen in `PersonalManager`.
      **In Produktion darf `ALLOW_TEST_ACCOUNTS` nie gesetzt werden** — sonst
      wären vorgelesene Passwörter zurück, die im Juli bewusst abgeschafft
      wurden.
- [ ] **Gmail-Zustellbarkeit**: Einladungen landen im Werbung-Ordner. Kein
      Fehler, sondern fehlende Sendereputation — hilft nur regelmäßiger
      Versand über Tage. Praktische Relevanz vermutlich begrenzt, weil Hotels
      eigene Mail-Domains nutzen. (Übergabe 26.07.)
      **04.09.: auch die Gast-Mail landet bei Yahoo im Spam**, schon beim
      ersten Versuch. Im Code erledigt: `text/plain`-Teil (fehlte) und
      Spam-Hinweis auf dem Handout. Was nur außerhalb des Codes geht, in
      dieser Reihenfolge:
      1. ~~`Authentication-Results` prüfen~~ — 04.09. geprüft: dreimal
         `pass`. Es ist reine Reputation.
      2. Resend → **Domains** → `send.rose-roomservice.app` → **Click- und
         Open-Tracking aus** (bei neuen Domains standardmäßig aus; der Dialog
         „New tracking subdomain" unter Settings ist etwas anderes und legt
         eine eigene Tracking-Domain an — dort nichts anlegen). Tracking schreibt jeden Link auf eine
         Resend-Domain um; Link-Domain ≠ Absender-Domain ist ein starkes
         Spam-Signal, und ausgerechnet der Link ist hier der Inhalt.
      3. DMARC schärfen: bisher nur `_dmarc.rose-roomservice.app` mit
         `p=none` (vererbt). Eigener Eintrag `_dmarc.send.rose-roomservice.app`
         mit `v=DMARC1; p=quarantine; rua=mailto:…` — Yahoo und Gmail werten
         eine durchgesetzte Policy positiv.
      4. Bei Yahoo (Sender Hub, Complaint Feedback Loop) und Google
         (Postmaster Tools) die Domain registrieren — Sichtbarkeit, kein
         Freifahrtschein.
      5. Warm-up: über Tage kleine Mengen an Adressen, die die Mail öffnen
         und aus dem Spam holen. Das ist das Einzige, was Reputation wirklich
         baut.
      Nicht sinnvoll: `List-Unsubscribe` (transaktional), Resend-eigene
      IP (Volumen viel zu klein).
- [ ] Optional: **E-Mail-Bestätigung bei der Registrierung** einschalten (dann
      echtes `signUp()` statt Admin-API mit `email_confirm`).
- [ ] **Dev-Log zeigt Passwörter**: Next.js protokolliert Server-Action-
      Argumente im Development-Modus, inklusive `loginAction(...)`. Laut Doku
      Dev-only, Produktion nicht betroffen. Abschaltbar mit
      `logging: { serverFunctions: false }` — kostet aber ein nützliches
      Werkzeug. Bewusst nicht geändert. (03.09.)
- [ ] **Supabase-Rate-Limit in den Integrationstests**: Dicht aufeinander
      folgende Läufe reißen das Anmelde-Limit („Request rate limit reached").
      Transient, aber in CI möglich. Falls es stört: Anmeldungen je Testdatei
      bündeln statt je Test. (03.09.)

## Erledigt

- [x] ~~Mailversand in Produktion einmal ansehen~~ — 04.09. echte Mail aus
      Produktion verschickt und zugestellt (Yahoo: Spam-Ordner, siehe
      Zustellbarkeit oben)

- [x] ~~Abrechnungs-Snapshot~~ — `billing_snapshots`, geschrieben vor jeder
      Zimmerlöschung (03.09.)
- [x] ~~Löschbegehren~~ — `deletion.ts` räumt auch das ab, woran keine Kaskade
      hängt: Verlauf, Abrechnungsbelege und die Anmeldekonten (03.09.)
- [x] ~~Drei Modelle beim Personal vereinheitlichen~~ (03.09.)
- [x] ~~Zimmer/Etagen/Gebäudeteile bearbeiten und löschen~~ (03.09.)
