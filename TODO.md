# Offene Punkte

Stand 05.09.2026. Herkunft in Klammern; Erledigtes wird gestrichen, nicht
gelöscht, damit erkennbar bleibt, was einmal offen war.

## Vor den ersten echten Kunden

- [x] ~~**Login-Actions testen**~~ — 05.09. erledigt:
      [login.test.ts](tests/integration/login.test.ts) fährt beide Actions
      gegen die Testwelt, inklusive *fünf Fehlversuche sperren nur den eigenen
      Aufenthalt* und der IP-Drossel. (Übergabe 26.07.)
- [x] ~~**IP-Rate-Limit für die Gast-Anmeldung**~~ — 05.09. erledigt:
      gleitendes Fenster je Absender-IP über alle Häuser (30 Fehlversuche /
      15 min), Tabelle `guest_login_failures`, Migration
      `2026-09-05_guest_login_failures.sql`. (Übergabe 26.07.)
- [x] ~~**Testplan D–G** durchlaufen.~~ — war seit dem 25.07. erledigt
      ([Testplan-Walkthrough.md](Sessions/Testplan-Walkthrough.md), Abschnitte
      D–G alle abgehakt), der Eintrag stammte aus der Übergabe vom 26.07. und
      wurde nie gestrichen. Was tatsächlich noch aussteht, sind die Fälle des
      [GUI-Testkatalogs](Sessions/GUI-Testkatalog.md), die den Menschen
      brauchen (**M** und **C+M**: zweite Management-Sitzung, Manager in zwei
      Häusern, Konto löschen, Druck) — bewusst zurückgestellt (05.09.).

## Produktentscheidungen

- [x] ~~**Pricing-Form**: zimmergenau oder Staffeln.~~ — 05.09. entschieden:
      **zimmergenau, 0,50 € je Zimmer und Monat, Mindestbetrag 5 € je Konto,
      erster Kalendermonat frei**, keine Pakete. Rechenlogik in
      [pricing.ts](src/lib/pricing.ts), veröffentlicht auf `/` und in den AGB.
      Die Rechnungsseite selbst (Zahlungsprovider, Rechnungen) bleibt offen,
      siehe „Konto-Seite" und „Zahlungsprovider" unten.
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
      - a) ~~**Bildmaterial**: klare Screenshots der drei Oberflächen~~ —
        05.09. anders gelöst: keine Screenshots (veralten mit jedem
        Feinschliff), sondern CSS-Miniaturen, seit demselben Tag als
        interaktive `LiveDemo`. Der Comic mit den Kernschritten lebt als
        Ablauf-Strip und als Bildergeschichte der Demo weiter; die
        gezeichneten Panels kommen mit f).
      - b) **Erklärvideo** oder Animation, eventuell mit ComfyUI und Voicebox
        (lokal installiert) erzeugt.
      - c) ~~**Pricing erstellen und veröffentlichen**~~ — 05.09. erledigt,
        Abschnitt „Ein Preis. Keine Pakete." mit Beispieltabelle aus
        `pricing.ts`.
      - d) ~~**Impressum und Datenschutzerklärung** veröffentlichen~~ — 05.09.
        erledigt: `/impressum`, `/datenschutz`, `/agb` (Route-Gruppe
        `(legal)`), Pflichtlinks auf allen öffentlichen Seiten und in der
        Gast-Shell. **Noch offen, bevor es trägt:**
        1. **Anbieter-Daten nachtragen** in [provider.ts](src/lib/provider.ts)
           — Anschrift, Telefon, E-Mail, USt-IdNr. von I²D. Das Impressum auf
           internetinformationsdienste.de trägt dieselben Platzhalter; solange
           sie stehen, zeigen die Rechtsseiten einen gelben Hinweis.
        2. **Rechtstexte prüfen lassen** (AGB, Datenschutz) — Entwürfe von
           Claude, kein Rechtsrat. Besonders Haftungsklauseln (§ 10 AGB) und
           die Drittland-Passage (Abschnitt 7 Datenschutz); Anschriften von
           Supabase/Vercel/Resend gegen deren aktuelle DPA-Dokumente prüfen.
        3. **Auftragsverarbeitungsvertrag (AVV)** als Dokument — § 8 AGB
           verweist darauf, er existiert noch nicht. Muster: Art. 28 Abs. 3
           DSGVO, Unterauftragsverarbeiter Supabase, Vercel, Resend.
        4. ~~Neu ab 05.09.: Landing-Page-Punkt e) **OG-Bild**~~ — am selben
           Tag erledigt: `opengraph-image.tsx` (ImageResponse) mit der
           Rezeptions-Miniatur; wird auf eine Illustration umgestellt,
           sobald der Stil steht.
      - e) **Nutzenrechner und Live-Demo** — 05.09. umgesetzt
        ([Landing-Konzept-2026-09-05.md](Sessions/Landing-Konzept-2026-09-05.md)):
        `roi.ts` mit ausgewiesenen Annahmen und Quellen, `RoiCalculator`,
        `LiveDemo` (eine verbundene Szene, Bildergeschichte beim ersten
        Sichtbarwerden). **Offen:** eine deutsche Quelle zum
        Verzichtsverhalten (DEHOGA?) für Annahme A2.
      - f) **Illustrationen** (Oliver, Flux/ComfyUI) nach der Stilvorgabe im
        Konzept, Abschnitt 2: Charakter-Sheet, Hero, fünf Ablauf-Panels,
        vier Use-Case-Bilder, OG-Hintergrund. Danach Einbau und Umstellung
        des OG-Bilds.
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
- [ ] **Performance** — die App reagiert im Browser teils erst nach 1–2 s auf
      einen Klick. **04.09. erster Schnitt im Code** (siehe AGENTS.md
      „Roundtrips sind die Latenz"): `getClaims()` statt `getUser()`, Guards
      in `cache()`, serielle Abfragen parallelisiert bzw. per FK-Einbettung
      zusammengelegt, Check-in mit einem statt vier Reads. Noch offen:
      1. ~~**Vercel-Region gegen Supabase-Region prüfen**~~ — 04.09.: Funktionen
         liefen in `iad1` (Washington), die DB liegt in Irland. `vercel.json`
         mit `regions: ["dub1"]` legt sie daneben.
      2. ~~In Produktion nachmessen~~ — 04.09. vom User bestätigt: „vieles
         reagiert deutlich schneller", auch der Check-in. Kein akuter Bedarf
         mehr.
      3. Falls es später wieder spürbar wird: Seiten-Render aus der
         Action-Antwort nehmen (PIN sofort zeigen, Übersicht per
         `router.refresh()` nachziehen), optimistische Zustände in
         `RoomDialog`/`ServiceBoard` (`useOptimistic`), doppeltes Rendern nach
         Actions (`revalidatePath` + eigenes Realtime-Ereignis) entkoppeln.

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
