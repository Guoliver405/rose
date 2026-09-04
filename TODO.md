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

## Produkt-Ausbau (Wunschliste 04.09.2026)

Mittelfristig umzusetzen; Reihenfolge noch offen. Die Punkte zur
Veröffentlichung (Pricing, Impressum, Datenschutz, Zahlungsprovider) hängen
zusammen und gehören vor den ersten zahlenden Kunden.

- [x] ~~**„Auswertung" aus den Einstellungen ins Hauptmenü**~~ — 04.09.
      erledigt: eigener Nav-Punkt „Auswertung" für Inhaber und Manager, Kachel
      im Hub und Rücklink der Seite entfallen. Offen bleibt die Idee, den
      Zimmer-Verlauf (heute nur im Zimmer-Dialog) dort mit anzubinden.
- [ ] **Coach Marks für die Ersteinrichtung** — beim ersten Aufruf nach der
      Registrierung führt eine Folge von Hinweisen durch Zimmer-Setup, Personal,
      Service-Baukasten, Gast-Zugang und Aushänge. Muss über die Einstellungen
      **reaktivierbar** sein („Einführung erneut anzeigen"). Zwei Teilaufgaben:
      Texte formulieren und Ankerpunkte im UI festlegen; Gesehen-Zustand je
      Person speichern (nicht nur im Browser, sonst kommt die Tour auf jedem
      Gerät wieder).
- [ ] **Konto-Seite „Plan & Abrechnung"** für den Inhaber — Zahlungsplan,
      Zahlungsverfahren, Abrechnungsmodalitäten und -intervall, Rechnungen,
      Upgrades. Zunächst als Platzhalter-Struktur, gefüllt, sobald
      Zahlungsprovider und Pricing stehen. Die Zimmerzahlen je Periode liefert
      bereits `getBillingOverview` (`billing_snapshots`).
- [ ] **Landing-Page aufmöbeln** (`/`):
      - a) **Bildmaterial**: klare Screenshots der drei Oberflächen statt
        Platzhalter; dazu Medien, die den **Nutzen** zeigen — etwa ein Comic
        mit den Kernschritten (Gast checkt ein → bekommt Zugang → löst im Zimmer
        einen Service aus → Rezeption reagiert direkt → Reinigung sieht den
        Wunsch auf dem Board).
      - b) **Erklärvideo** oder Animation, eventuell mit ComfyUI und Voicebox
        (lokal installiert) erzeugt.
      - c) **Pricing erstellen und veröffentlichen** — setzt die Entscheidung
        „Pricing-Form" oben voraus; der Platzhalter-Abschnitt auf `/` wird
        dann ersetzt.
      - d) **Impressum und Datenschutzerklärung** veröffentlichen — Pflicht
        vor dem ersten echten Kunden. Die Datenschutzerklärung muss Supabase
        (DB, Auth), Vercel (Hosting) und Resend (Mail) als Auftragsverarbeiter
        nennen und die bewusste Anonymität der Gastdaten (`stays` ohne
        Personenbezug, Mail-Adresse wird nicht gespeichert) beschreiben.
- [ ] **Zahlungsprovider einbinden** — Anmeldung beim Provider als Teil der
      Registrierung, auch wenn der erste Monat frei ist (Zahlungsmittel liegt
      dann schon vor). Kandidat: **PayPal** (All-in-one mit mehreren
      Zahlverfahren, Abwicklung und Haftung gegen Gebühr vollständig beim
      Provider). Vorher Alternativen (Stripe, Paddle als Merchant of Record
      inkl. Steuerabführung) gegenüberstellen. Betrifft `/registrieren`, die
      Konto-Seite oben und die Abrechnung aus `billing_snapshots`.
- [ ] **Mehrsprachigkeit**: en, es, fr, de. Betrifft alle drei Portale, die
      Landing-Page, Mails und Druckseiten (Aushänge, Handouts, Karten). Die
      Gast-Sprache muss unabhängig von der Hotel-Sprache wählbar sein — das
      Gastportal ist die Fläche mit den meisten Sprachen. i18n-Ansatz für den
      App Router festlegen (Next.js-16-Doku in `node_modules/next/dist/docs/`
      lesen, bevor eine Bibliothek gewählt wird).
- [ ] **Thailändisch als Belastungsprobe** — probehalber implementieren, um zu
      sehen, wie weit das Sprach-System trägt: nicht-lateinische Schrift,
      andere Zeilenumbruch-Regeln (keine Leerzeichen zwischen Wörtern),
      Schriftart-Einbindung, Längen in Buttons und Slidern, Druckseiten.
- [ ] **Performance ergründen** — die App reagiert im Browser teils erst nach
      1–2 s auf einen Klick. Verdächtige zuerst prüfen: Server Actions, die
      per `revalidatePath` ganze Layouts neu rendern; Board-Loader, die je
      Aufruf mehrere Supabase-Roundtrips machen (`reapStaleCleanings`,
      Verlauf); fehlende `useTransition`/optimistische Zustände bei
      Klick-Aktionen (Check-in, Priorität, Slider); Cold-Starts auf Vercel.
      Erst messen (Vercel Speed Insights, Network-Tab), dann gezielt
      optimieren.

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
      2. ~~Click-/Open-Tracking in Resend aus~~ — 04.09. geprüft: Tracking
         läuft in Resend nur über eine eigene Tracking-Subdomain, und es ist
         keine angelegt. Also nicht aktiv, Links zeigen direkt auf
         `rose-roomservice.app`. **Keine anlegen** — der Dialog „New tracking
         subdomain" hinter „Configure" würde es erst einschalten.
      3. ~~DMARC schärfen~~ — 04.09. gesetzt und per DNS bestätigt:
         `_dmarc.send.rose-roomservice.app TXT "v=DMARC1; p=quarantine;"`
         (ohne `rua`, bewusst keine Berichte). Auf der Hauptdomain bleibt
         `p=none`.
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
