# Offene Punkte

Stand 03.09.2026. Herkunft in Klammern; Erledigtes wird gestrichen, nicht
gelöscht, damit erkennbar bleibt, was einmal offen war.

## Vor den ersten echten Kunden

- [ ] **Mailversand in Produktion einmal ansehen** — Variablen sind gesetzt und
      deployt (03.09.). Der Blick aufs Handout eines belegten Zimmers unter
      `rose-roomservice.app` genügt: Erscheint das Adressfeld statt „Versand
      per E-Mail ist nicht eingerichtet", greifen beide Variablen. Ein echter
      Versand ist dafür nicht nötig, lokal ist er end-to-end geprüft.

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

- [x] ~~Abrechnungs-Snapshot~~ — `billing_snapshots`, geschrieben vor jeder
      Zimmerlöschung (03.09.)
- [x] ~~Löschbegehren~~ — `deletion.ts` räumt auch das ab, woran keine Kaskade
      hängt: Verlauf, Abrechnungsbelege und die Anmeldekonten (03.09.)
- [x] ~~Drei Modelle beim Personal vereinheitlichen~~ (03.09.)
- [x] ~~Zimmer/Etagen/Gebäudeteile bearbeiten und löschen~~ (03.09.)
