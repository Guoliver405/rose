# Protokoll RoSe-Usability-Test

## Aufgabe A – Registrieren
Status: erledigt
Aktionen: 23 (Summe bisher: 23)

Reibung:
- [/] Startseite ist extrem lang (Landingpage inkl. Simulator, FAQ); „Kostenlos starten" kommt 4× vor – Link führte direkt zu /registrieren, gut. Per Text gelesen: sehr viel Lärm (Animationstexte, Zahlenkolonnen).
- [/registrieren] Das Einladungscode-Feld steht oben, ohne Hinweis im Seitentext (nur Screenshot zeigte Label „Einladungscode"); in der Textansicht sind Feldlabels ohne Werte/Zuordnung schwer lesbar.
- [/registrieren] Nach Klick auf „Konto anlegen" blieb der Button lange auf „Wird angelegt …" (ca. 5–10 s, unten Dev-Hinweis „Compiling"). Ich war unsicher, ob etwas passiert; erst nach Warten erfolgte die Weiterleitung.
- [/admin/abrechnung/zahlungsweg] Schritt „2 von 2 – Zahlungsweg": Zahlungsdaten waren überspringbar über „Später – weiter zum Zimmer-Setup". Seite verspricht „belastet wird nichts". Das Länder-Dropdown ist eine sehr lange Liste. Ich fand nirgends vorher „Schritt 1 von 2" – wirkt, als sei die Registrierung Schritt 1.
- Nach „Später" brauchte die Navigation wieder mehrere Sekunden (kein Ladeindikator erkennbar, erster Klick schien wirkungslos).

## Aufgabe B – Zimmer einrichten
Status: erledigt
Aktionen: 14 (Summe bisher: 37)

Reibung:
- [/h/pension-lindenhof/admin/zimmer?lotse=einrichtung] Nach der Registrierung landete ich direkt im Zimmer-Formular, mit einer Einrichtungs-Tour („Erste Einrichtung", 1/16) unten rechts. Gut, aber 16 Schritte; ich habe nur den ersten gelesen und den Rest ignoriert (Aktionsbudget).
- Formular „Etagen individuell" / „Etagen identisch", Feld „Gebäudeteil (optional)", Feld „Etage", „Zimmernummern – einzeln, Komma-Liste oder Bereich", Checkbox „Etagennummer voranstellen (Etage 2 + „05" → „205")". Wortlaut verwirrend: Die Checkbox ist aus; ich habe volle Nummern „101, 102, 103, 104" eingegeben. Das klappte. „Ein Gebäude" – Gebäudeteil habe ich leer gelassen (Pflicht war es nicht), unklar ob nötig.
- Nach „Anlegen" ändert sich der Button zu „Anlegen …" und es dauert mehrere Sekunden, dann Meldung „4 Zimmer angelegt." und Liste „Etage 2 / Etage 1" (Reihenfolge: Etage 2 oben, Etage 1 unten – überraschend). Das Etagenfeld sprang nach dem ersten Anlegen nicht von selbst weiter; ich musste „2" selbst setzen.
- Ich war kurz unsicher, ob der Klick wirkte, weil lange nichts passierte; ein Screenshot direkt danach zeigte noch das alte Formular.

## Aufgabe C – Regeln des Hauses
Status: mit Mühe erledigt
Aktionen: 28 (Summe bisher: 65)

Reibung:
- [/admin/einstellungen] Ich suchte zuerst über „Einstellungen" in der Menüleiste; die Seite zeigt 7 Kacheln. „Haus & Regeln" war richtig. Dass die Kacheln klickbar sind, sieht man als Text nicht (nur „generic").
- [/einstellungen/hotel] Die Seite ist sehr lang (Logo, Adresse, Währung, PIN-Länge, tägliche Reinigung, Zeitzone, …). Der Text enthält Hunderte Dropdown-Einträge (Währungen, Zeitzonen) – beim Textlesen sehr störend. Ich musste scrollen und Screenshots machen, um die Felder zu sehen.
- Positiv: Check-out bis 11:00, Check-in ab 15:00, Zeitzone Europe/Berlin und Währung Euro waren schon voreingestellt. Ich musste nur „Belegte Zimmer täglich reinigen" anhaken; danach erschien „täglich ab 10:00" (schon 10:00 voreingestellt). „Land: Deutschland" gibt es hier nicht – ich habe „Die Pension liegt in Deutschland" als Zeitzone Europe/Berlin gedeutet (unsicher, ob das gemeint ist). Das Land kam nur bei den Rechnungsdaten vor, die ich übersprungen habe.
- Beim Speichern („Ungespeicherte Änderungen · Haus & Regeln" → „Speichern") keine sichtbare Bestätigung; die Leiste verschwand nach ein paar Sekunden. Ich bin nicht 100 % sicher, ob gespeichert wurde, habe es nicht erneut geprüft.
- Standardmäßig war „Gäste dürfen die Reinigung aufschieben („frühestens ab")" an – nicht verlangt, nicht geändert. Text „aufschieben bis spätestens 11:00 Uhr" ist erklärungsbedürftig.
- „Gäste melden sich mit einem Code an": Ich fand das unter Einstellungen → „Gästezugang". Dort zwei Verfahren: „Fester QR-Code je Zimmer" (Vorgabe, mit PIN) und „Individueller Zugang je Aufenthalt" (ohne PIN). Ich blieb beim Vorgabe-Verfahren (PIN) und klickte „Verfahren bestätigen". Text: „Bestätigen Sie die Wahl einmal – auch wenn Sie dabei bleiben. Erst dann hält das Haus das Verfahren fest" – merkwürdig, dass man die Vorgabe extra bestätigen muss. Auch hier keine sichtbare Rückmeldung, der Button zeigte nur kurz einen Ladezustand; nicht verifiziert.
- Ich riet die URL …/einstellungen/personal → 404 „This page could not be found." (richtig: …/admin/personal; die Kachel „Personal" verlinkt dorthin, nicht unter /einstellungen).

## Aufgabe D – Personal
Status: erledigt
Aktionen: 11 (Summe bisher: 76)

Reibung:
- [/admin/personal] Seite „Personal – Reinigungskräfte", Formular „Anzeigename" + „Benutzername (Anmeldung)". Ich wählte Benutzername „anna" (musste ihn selbst erfinden).
- Ergebnis: „Anna Weber angelegt – die Zugangskarte kann jetzt gedruckt werden." Benutzername: anna, PIN (6 Ziffern): 308291. Anmeldeadresse steht nicht hier, sondern unter Einstellungen → Haus & Regeln: http://localhost:3000/h/pension-lindenhof/service/login (Haus-Adresse „pension-lindenhof"). Auf der Personal-Seite steht nur: „Mit dem Benutzernamen und der PIN meldet sich die Reinigungskraft an – nicht mit dem Anzeigenamen". Wo man ihr die Adresse nennt, ist daher nur über „Karte drucken" (nicht geöffnet) ableitbar.
- Die Seite bietet auch Rezeption- und Manager-Zugänge an („Ohne E-Mail anlegen (Testbetrieb)" / Einladung per E-Mail) – nicht benutzt.

## Aufgabe E – Zusatzleistung
Status: mit Mühe erledigt
Aktionen: 22 (Summe bisher: 98, inkl. Übersicht öffnen)

Reibung:
- Gesucht: Einstellungen → Kachel „Service-Baukasten" (die Kachel ist nicht als Link erkennbar; zwei verschiedene Menü-Pfade: Einstellungen/… vs. /admin/services).
- [/admin/services] Formular „Neuen Service anlegen" hat Name, Beschreibung, „Dringend", „Meldung ans Haus" – aber KEIN Preisfeld. Hinweis: „Optionen und Preise legen Sie nach dem Anlegen am Service fest." Ich legte „Frühstück aufs Zimmer" an und musste dann an der neuen Karte eine Option hinzufügen („Option" + „Preis in EUR (optional)"). Erwartet hätte ich ein Preisfeld direkt am Service. Der Text „Keine Optionen – der Gast wählt den Service als Ganzes" legt nahe, dass der Service allein ohne Preis bestellbar wäre – ein Preis geht nur über eine Option. Ich nannte die Option „Frühstück" (doppelt gemoppelt), Preis „14,50" → angezeigt „Frühstück 14,50 €".
- Die neue Karte erscheint ganz oben, mit Banner „1 Service ist noch nicht vollständig in Français übersetzt" (+ Español) und Badges „EN · fehlt / FR · fehlt / ES · fehlt". Nicht verlangt, wirkt wie ein Fehler/Pflicht; „Speichern geht trotzdem". Ich habe nicht übersetzt.
- Verwirrend: Schalter heißen „Dringend an" / „Dringend aus" bzw. „Meldung ans Haus an/aus" – ob das der aktuelle Zustand oder die Aktion ist, ist unklar (bei „Technischer Dienst" steht „Dringend aus", Badge „dringend" ist an → Beschriftung = Aktion).
- Meine Preis-Eingabe habe ich nicht per Formularfeld, sondern per Klick+Tippen gemacht, weil sich nach dem Anlegen die Referenzen änderten (Werkzeug-Eigenheit, nicht Software).

## Aufgabe F – Gäste einchecken
Status: erledigt
Aktionen: 20 (Summe bisher: 118)

Reibung:
- Wo einchecken? Ich öffnete „Übersicht" (Zimmer-Übersicht mit Kacheln); Klick auf eine Kachel öffnet ein Fenster „Zimmer 102 – Frei & bereit" mit „Abreise (optional): offen / 1 Nacht / 2 Nächte / 3 Nächte / Datum" und „Check-in". Intuitiv genug.
- Der erste Klick auf eine Kachel zeigte nach 1–3 s noch nichts (ein Screenshot direkt danach: nur Übersicht); erst später öffnete sich das Fenster. Ich war kurz unsicher, ob der Klick traf.
- 102: „2 Nächte" gewählt, „Check-in" → „Belegt · Abreise am Do., 22.10." (Heute ist Di 20.10.; 2 Nächte = Abreise Do – stimmig). Meldung „CHECK-IN ERFOLGREICH – GAST-PIN 797737 – Dem Gast mitteilen – er scannt den QR-Code im Zimmer und gibt die PIN ein." Dazu „Check-in-Blatt drucken" (nicht geöffnet; Mail-Option wurde hier nicht angeboten, da Verfahren „fester QR-Code"). Zusatz: „Keine kostenpflichtigen Zusatzleistungen – beim Check-out ist nichts zu kassieren."
- 203: „offen" (Standard) → Check-in → PIN 398118.
- Was ich dem Gast mitgäbe: Zimmernummer + PIN (102: 797737, 203: 398118) und den Hinweis auf den QR-Code im Zimmer. ACHTUNG: Die Software sagt „QR-Code im Zimmer", aber ich habe keinen QR-Code/Aushang gedruckt oder aufgehängt (Einstellungen → Gästezugang → „Aushänge ansehen und drucken"). Ohne Aushang hat der Gast keine Adresse. Gästeadresse (aus Haus & Regeln): http://localhost:3000/h/pension-lindenhof/guest. Die Check-in-Meldung nennt weder diese Adresse noch die Zimmernummer als Login-Teil.

## Aufgabe G – Als Gast
Status: erledigt
Aktionen: 21 (Summe bisher: 139)

Reibung:
- Gästeadresse: Ich kannte sie nur, weil sie in Einstellungen → Haus & Regeln steht („Gästeportal: http://localhost:3000/h/pension-lindenhof/guest"). Ein echter Gast fände sie nur über den QR-Code-Aushang im Zimmer (den ich nicht gedruckt hatte) oder das Check-in-Blatt. Auf dem Bildschirm beim Check-in stand die Adresse nicht.
- [/guest] Login: Felder „z. B. 101" (Zimmernummer) und „••••••" (PIN), Button „Anmelden". Zimmer 102 + PIN 797737 → direkt auf /guest/status. Klappte im ersten Versuch (ca. 5 s Wartezeit).
- Beobachtung: Die Seite sagt „Ab morgen reinigt unser Haus täglich ab 11:00 Uhr" – ich hatte „täglich ab 10:00" eingestellt (und gespeichert, glaubte ich). Entweder wurde die Einstellung nicht gespeichert, oder 11:00 wird wegen Check-out/„Abreisedatum offen" gezeigt. Nicht klar; Widerspruch zu Aufgabe C.
- Auf der Gästeseite: „Zimmer reinigen", „Frühestens ab …", „Heute keine Reinigung", „Bitte nicht stören", darunter „SERVICE BESTELLEN" mit „Frühstück aufs Zimmer". Die Knöpfe haben für die Browser-Werkzeuge keine Beschriftung (nur „button"), ich musste per Seitentext/Screenshot arbeiten.
- „Zimmer reinigen" → nach kurzer Wartezeit orange: „Die Reinigung ist vorgesehen. Das Reinigungsteam kommt heute vorbei." / „Wunsch ist aktiv – erneut tippen zum Zurücknehmen". Klar. Unmittelbar nach dem Tippen waren alle Kacheln ausgegraut, ohne Hinweis → unsicher, ob etwas passiert.
- Frühstück: Karte aufklappen → Kästchen „Frühstück 14,50 €" ankreuzen (muss man! Der Service wird nicht als Ganzes bestellt, obwohl die Optionsliste nur eine Option hat) → „Bestellen" → „Ihre Anfrage ist bei der Rezeption." Anmerkung optional. Das Bestellen-Button war zuerst grau (deaktiviert), erst nach Ankreuzen aktiv; kein Hinweis warum.

## Aufgabe H – Als Rezeption
Status: mit Mühe erledigt
Aktionen: 8 (Summe bisher: 147)

Reibung:
- Menüpunkt „Anfragen" (/admin/bestellungen) war die naheliegende Stelle; die Bestellung stand dort: „102 – Frühstück aufs Zimmer – Frühstück (14,50 €) – gerade eben – Erledigt". „1 offen" im Kopf.
- Der Knopf „Erledigt" ist als Beschriftung mehrdeutig (Aktion oder Status?). Ich klickte ihn; ca. 3 s danach stand weiter „1 offen", erst nach weiteren ~4 s „0 offen – Keine offenen Anfragen … Zuletzt abgeschlossen (1)". Dazwischen keine Rückmeldung; ich war unsicher, ob der Klick wirkte.
- Den Reinigungswunsch des Gastes habe ich nicht auf einer Seite nachgesehen (Übersicht/Kachel 102 hätte ihn gezeigt) – aus Aktionsmangel nicht geprüft.

## Aufgabe I – Als Reinigungskraft
Status: erledigt (mit Mühe)
Aktionen: 36 (Summe bisher: 183 inkl. J)  [Zweites Limit: 40 Aktionen, Zählung bei 0]

Reibung:
- [/service/login] Adresse aus den Einstellungen (Haus & Regeln) bekannt, Felder „anmeldename" / PIN. Login mit anna / 308291 klappte sofort (~5 s Wartezeit).
- Nach Login: „Nicht auf Schicht – Reinigungen lassen sich erst nach dem Schichtbeginn starten (Knopf „Status")". Der Hinweis ist gut. Der Knopf „Status" führt zu /service/status.
- „Schicht beginnen →" ist ein Wisch-Schieber, kein Knopf. Das steht nirgends; ein einfacher Klick tut nichts. Ich habe es per Ziehen (drag) gelöst. Nach dem Wisch „wird gespeichert …", dann (nach ~5 s) „Auf Schicht seit 21:03".
- Board: „Etage 2 fertig", „Etage 1 – Als Nächstes – 1 offen" → Etage antippen → Kachel 102 „Reinigung gewünscht" → Fenster mit Wisch-Schieber „Reinigung starten →" und Alternativen „In 30 Min / In 1 Std / Heute nicht". Klar erklärt.
- Starten und „Reinigung abschließen →" jeweils per Wisch; jeweils mehrere Sekunden Wartezeit, UI ausgegraut ohne Text. Danach „0 offen"; Status zeigt „Zimmer heute 1 / < 1 min".
- „Schicht beenden →" ebenfalls per Wisch, danach „Nicht auf Schicht", Arbeitszeit 1 min. Alles ohne Fehlermeldung.

## Aufgabe J – Auschecken
Status: abgebrochen (Limit)
Aktionen: 6 (in der Zählung oben)

Reibung:
- Rezeption → Übersicht → Kachel 203: Fenster zeigt PIN, „Abreise offen", „Keine kostenpflichtigen Zusatzleistungen – beim Check-out ist nichts zu kassieren." und „Check-out". Klick → „Check-out bestätigen? Der Zugang des Gastes wird sofort beendet. – Ja, auschecken / Abbrechen". Diese Rückfrage ist gut.
- Ich habe das 40-Aktionen-Limit erreicht (nach Zählung 42, 2 zu viel, weil ich Wartezeiten als Aktion zählte und zuletzt noch ein Textlesen machte) und „Ja, auschecken" NICHT mehr geklickt. Weder 203 noch 102 sind ausgecheckt; was der Gast aus 102 noch zahlen müsste, ist unbeantwortet. Hinweis aus dem Fenster zu 203: „Keine kostenpflichtigen Zusatzleistungen"; bei 102 war die Frühstücksbestellung (14,50 €) erledigt – ob sie dort als zu kassieren erscheint, ist ungeprüft.

## Zusammenfassung
Aktionen gesamt: 189 (147 im ersten Lauf + 42 im Nachlauf für I/J; jeder Browser-Werkzeugaufruf, auch fehlgeschlagene, zählt 1; Batch-Teilaktionen einzeln gezählt)
Abgebrochen wegen Limit: ja (J nicht abgeschlossen; I erledigt)
Die fünf größten Hürden:
1. Langsame Rückmeldung: Fast jede Aktion (Registrieren, Anlegen, Speichern, Erledigt, Kachel öffnen) brauchte 3–10 s ohne klaren Ladeindikator/Bestätigung; ich musste ständig warten und nachsehen – das kostete die meisten Aktionen.
2. Keine sichtbare Bestätigung beim Speichern (Haus & Regeln, Gästezugang „Verfahren bestätigen"); Widerspruch: Gästeportal zeigt „täglich ab 11:00" obwohl 10:00 eingestellt.
3. Gästeadresse/Login-Daten: Check-in-Meldung nennt nur die PIN, nicht die Adresse oder dass die Zimmernummer mit eingegeben wird; die Adresse steht nur in den Einstellungen; QR-Aushänge mussten gedruckt werden. Für Anna Weber steht die Anmeldeadresse ebenfalls nicht auf der Personal-Seite.
4. Einstellungsseiten sehr lang, verstreut (Kacheln nicht als Links erkennbar, „Land Deutschland" nur als Zeitzone/Rechnungsdaten, tägliche Reinigung über Checkbox versteckt).
5. Service mit Preis: Preis nur über „Option" anlegbar; Gast muss die Option ankreuzen; Übersetzungs-Warnbanner „1 Service ist noch nicht vollständig in Français übersetzt" verunsichert.
Was gut funktioniert hat: Registrierung mit Einladungscode, Zahlung überspringbar; Voreinstellungen (11:00/15:00/Berlin/Euro/10:00) trafen den Auftrag; Zimmer-Eingabe per Komma-Liste; Check-in mit einem Klick; Gästeportal klar; Bestellung kam sofort bei der Rezeption an.
Würde ich als Pensionsinhaber weitermachen? Vermutlich ja – die Grundidee (Check-in → PIN → Gast bestellt → Rezeption sieht es) funktionierte ohne Anleitung. Aber ich würde mir klarere Rückmeldungen („Gespeichert ✓") und die Gästeadresse direkt beim Check-in wünschen; ob Reinigung und Check-out zuverlässig laufen, konnte ich wegen des Limits nicht prüfen.

Neue Hürden aus I/J: Wisch-Schieber statt Knöpfe (nicht erkennbar, per Klick wirkungslos); 3–6 s Wartezeit nach jedem Wisch ohne Fortschrittstext außer „wird gespeichert …"; Rezeption: Check-out braucht Kachel → Fenster → Check-out → Bestätigung (3 Klicks).
