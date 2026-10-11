/**
 * Lotsen – Texte der geführten Rundgänge. Pfade, Anker, Szenen und die
 * Reihenfolge stehen in `lotsen.ts`; hier nur, was die Karte sagt.
 * Verwaltung wird gesiezt, Begriffe nach `Sessions/Begriffe-Entscheidungen.md`.
 */
import type { LotseStepText } from '@/lib/lotsen'

export const lotsen = {
  /** Name und Untertitel je Lotse (Hilfe-Hub, Karte, Leiste). */
  tours: {
    einrichtung: {
      title: 'Erste Einrichtung',
      subtitle: 'Der geführte Weg vom leeren Haus bis zum ersten Check-in',
    },
    uebersicht: {
      title: 'Die Zimmer-Übersicht',
      subtitle: 'Der Bildschirm der Rezeption: Farben lesen, Check-in, Check-out, Prioritäten',
    },
    anfragen: {
      title: 'Anfragen',
      subtitle: 'Das Board der Rezeption: was Gäste bestellt haben und wie es abgehakt wird',
    },
    zimmer: {
      title: 'Zimmer & Etagen',
      subtitle: 'Ganze Etagen auf einmal anlegen, Nummern korrigieren, Zimmer außer Betrieb nehmen',
    },
    regeln: {
      title: 'Haus & Regeln',
      subtitle: 'Zeitzone, tägliche Reinigung, Check-out-Frist, PIN-Länge – die Regeln des Hauses',
    },
    gastzugang: {
      title: 'Gästezugang',
      subtitle: 'Fester Zimmer-QR mit PIN oder individueller Zugang je Aufenthalt – samt Aushängen',
    },
    aushang: {
      title: 'Aushänge & Check-in-Blätter',
      subtitle: 'Was gedruckt wird: Zimmer-Aushang, Check-in-Blatt, Zugangskarte – und wie lange es gilt',
    },
    personal: {
      title: 'Personal',
      subtitle: 'Reinigung, Rezeption und Manager – anlegen, Zugang beenden, Zugangskarten drucken',
    },
    services: {
      title: 'Service-Baukasten',
      subtitle: 'Der Service-Baukasten: was Gäste im Portal bestellen können',
    },
    reinigung: {
      title: 'Das Reinigungsboard',
      subtitle: 'Nachgebaut: Anmeldung, Schicht, Etagen, Schieber – was die Reinigungskraft am Handy sieht',
    },
    gast: {
      title: 'Was der Gast sieht',
      subtitle: 'Nachgebaut: das Gästeportal am Handy – Reinigung, „frühestens ab“, Verzicht, Bitte nicht stören, Services',
    },
    auswertung: {
      title: 'Auswertung',
      subtitle: 'Arbeitszeiten aus den Einträgen, Auffälligkeiten und wann Gäste Reinigung wünschen',
    },
    konto: {
      title: 'Plan & Abrechnung',
      subtitle: 'Was das Konto kostet, wie gezählt wird und wo Zahlungsweg und Rechnungen liegen',
    },
  },

  /** Text je Schritt, Schlüssel aus `lotsen.ts` (`key`, sonst der Anker). */
  steps: {
    'einrichtung.start': {
      title: 'Willkommen bei RoSe',
      body: 'In den nächsten Minuten richten wir Ihr Haus ein: Zimmer, die Regeln des Hauses, der Weg Ihrer Gäste ins Portal, das Personal und die Services. Sie können jederzeit abbrechen und später weitermachen – der Fortschritt ergibt sich aus dem, was tatsächlich angelegt ist, nicht aus Häkchen.',
      tun: 'Weiter geht es mit dem Knopf „Weiter“ unten rechts. Unterbrechen können Sie jederzeit – auf der Übersicht zeigt ein Band, was noch fehlt, und führt zurück in die Einrichtung.',
    },
    'zimmer.anlegen': {
      title: 'Alles beginnt mit den Zimmern',
      body: 'Ohne Zimmer gibt es keinen Check-in, kein Reinigungsboard und keine Aushänge. Hier legen Sie ganze Etagen auf einmal an – einzeln eintippen müssen Sie nichts.',
    },
    'zimmer.modus': {
      title: 'Zwei Wege, viele Zimmer anzulegen',
      body: '„Etagen individuell“ legt die eingegebenen Nummern auf genau einer Etage an – richtig, wenn jede Etage anders aussieht. „Etagen identisch“ wiederholt denselben Nummernkreis auf mehreren Etagen.',
    },
    'zimmer.nummern': {
      title: 'Nummern als Liste oder als Bereich',
      body: '„101-110“ legt zehn Zimmer an, „201, 202, 205“ genau drei. Führende Nullen bleiben erhalten – aus „01-10“ wird 01 bis 10, nicht 1 bis 10.',
      tun: 'Tippen Sie einen Bereich ein: Unter dem Feld steht sofort, welche Zimmer daraus entstehen.',
    },
    'zimmer.bestand': {
      title: 'Verschrieben? Kein Problem',
      body: 'Zimmer, Etage und Gebäudeteil lassen sich anklicken – der Dialog bietet überall dasselbe: bearbeiten, außer Betrieb nehmen, löschen. Bearbeiten ändert Nummer, Etage und Gebäudeteil, ohne dass Verlauf oder Arbeitsnachweise verloren gehen; „außer Betrieb“ ist der schonende Weg für Renovierungen. Gelöscht wird erst nach einer bezifferten Warnung.',
    },
    'regeln.zeitzone': {
      title: 'Zeitzone zuerst',
      body: 'Alle Uhrzeiten dieser Seite gelten in dieser Zeitzone. Steht hier die falsche, wird die tägliche Reinigung zur falschen Stunde fällig, und auch die Tagesgrenzen der Auswertung liegen daneben.',
    },
    'regeln.routine': {
      title: 'Reinigung nur auf Wunsch – oder täglich',
      body: 'Ab Werk ist die tägliche Reinigung aus: Gereinigt wird, wenn der Gast es wünscht oder das Zimmer ausgecheckt ist. Das spart Wasser, Waschmittel und Arbeitszeit. Schalten Sie sie ein, erscheinen belegte Zimmer ab dem Tag nach der Anreise zur gewählten Uhrzeit von selbst auf dem Reinigungsboard.',
    },
    'regeln.checkout': {
      title: '„Check-out bis“ ist die Untergrenze der täglichen Reinigung',
      body: 'Solange RoSe nicht weiß, ob der Gast heute abreist, wird die tägliche Reinigung nicht vor dieser Uhrzeit fällig. So wird kein Abreisezimmer vor dem Check-out gereinigt und danach noch einmal. Ist beim Aufenthalt ein Abreisedatum eingetragen, gilt an den Tagen davor die normale Uhrzeit, und am Abreisetag entfällt die tägliche Reinigung.',
    },
    'regeln.speichern': {
      title: 'Speichern nicht vergessen',
      body: 'Die Regeln gelten ab dem Speichern für alles Weitere. Laufende Aufenthalte und bereits gesetzte Wünsche laufen unverändert weiter. Sobald Sie etwas ändern, erscheint unten am Bildschirm zusätzlich eine Leiste mit Speichern und Verwerfen – Sie müssen dafür nicht bis hierher scrollen.',
      tun: 'Auch wenn Sie nichts ändern: einmal speichern. Erst damit hält das Haus die Zeitzone fest, und der Punkt gilt in der Einrichtung als geprüft.',
    },
    'gastzugang.wahl': {
      title: 'Zwei Wege ins Gästeportal',
      body: 'Beim festen Zimmer-QR steht ein einmal gedruckter Code im Zimmer, und jeder Aufenthalt bekommt seine eigene PIN – zwei Faktoren. Beim individuellen Zugang entsteht je Aufenthalt ein eigener Link ohne PIN, der mit dem Check-out erlischt: bequemer, aber wer das Blatt sieht, ist drin.',
    },
    'gastzugang.speichern': {
      title: 'Ein Wechsel ist folgenlos für laufende Aufenthalte',
      body: 'Das Verfahren wird beim Check-in am Aufenthalt festgehalten, nicht bei jedem Zugriff neu gelesen. Ausgegebene Zugänge funktionieren deshalb bis zum Check-out weiter; erst der nächste Check-in folgt dem neuen Verfahren. Es gibt keinen Wechseltermin und keine Umstellung von Bestandsdaten.',
      tun: 'Bestätigen Sie Ihre Wahl mit diesem Knopf – auch wenn Sie bei der Vorgabe bleiben. Erst dann gilt der Punkt in der Einrichtung als erledigt.',
    },
    'personal.reinigung': {
      title: 'Reinigungskräfte brauchen keine E-Mail',
      body: 'Eine Reinigungskraft bekommt Benutzernamen und PIN – mehr nicht. Der Anzeigename steht auf Board und Karte, angemeldet wird mit dem Benutzernamen: Wer bei der Anmeldung den Anzeigenamen eintippt, wird abgewiesen. Beides gilt nur in diesem Haus – derselbe Benutzername darf in einem anderen Haus noch einmal vorkommen.',
    },
    'personal.liste': {
      title: 'Zugang beenden statt löschen',
      body: 'Scheidet jemand aus, beenden Sie den Zugang: Die Anmeldung ist sofort gesperrt, auch eine offene Sitzung endet, und der Arbeitsnachweis bleibt vollständig. Kommt die Person zurück, wird der Zugang wieder aktiviert – die Zugangskarte gilt weiter. Endgültiges Löschen gibt es auch, aber es nimmt bei der Reinigung die Einträge mit; der Dialog beziffert vorher, was verschwindet.',
    },
    'services.anlegen': {
      title: 'Ein Service ist ein Baukasten',
      body: 'Oben steht der Service – „Wäscheservice“, „Technischer Dienst“ –, darunter hängen die Optionen, die der Gast auswählt. Zwei Haken entscheiden über den Ablauf: „dringend“ lässt die Glocke auf der Zimmer-Kachel und die Zahl in der Navigation rot blinken. „Meldung ans Haus“ ist für Defekte – solche Anfragen gehören zum Zimmer, nicht zum Aufenthalt, und bleiben deshalb über den Check-out hinaus offen.',
      tun: 'Setzen Sie „Meldung ans Haus“ bei allem, was kaputtgehen kann – der technische Dienst ist der Standardfall.',
    },
    'services.liste': {
      title: 'Preise landen beim Check-out auf der Aufstellung',
      body: 'Optionen dürfen einen Preis tragen; der Gast sieht ihn bei der Anfrage. Beim Check-out zeigt der Zimmer-Dialog die Summe der erbrachten Leistungen – deshalb lohnt es sich, die Preise gleich hier zu pflegen. Ohne Preis steht eine Anfrage auf keiner Aufstellung, und Meldungen ans Haus stehen dort auch mit Preis nicht: Sie sind keine Leistung an den Gast. RoSe bucht und kassiert nichts, es rechnet nur zusammen.',
      tun: 'Tragen Sie bei einer Option einen Preis ein – ab der nächsten Anfrage steht sie damit beim Check-out auf der Aufstellung.',
    },
    'einrichtung.ende': {
      title: 'Geschafft – und hier geht es weiter',
      body: 'Ihr Haus ist eingerichtet. Unter „Hilfe“ finden Sie jederzeit alle Lotsen wieder, dazu eine Übersicht, was noch fehlt. Jeder Lotse lässt sich einzeln starten, so oft Sie wollen.',
    },
    'uebersicht.kpi': {
      title: 'Das Lagebild in einer Zeile',
      body: 'Die Zahlen oben sind der Stand des Hauses auf einen Blick – belegt, bereit, zu reinigen, „Bitte nicht stören“, gerade in Arbeit. Sie aktualisieren sich von selbst, sobald ein Gast oder eine Reinigungskraft etwas ändert.',
    },
    'uebersicht.etage': {
      title: 'Nach Etagen sortiert',
      body: 'Jede Etage ist ein Block, oberste zuerst. Ist eine Reinigungskraft gerade auf der Etage eingebucht, steht ihr Name im Kopf der Zeile – so sehen Sie, wo gearbeitet wird, ohne zu fragen.',
    },
    'uebersicht.kachel': {
      title: 'Die Farbe ist der Zustand',
      body: 'Der Balken über der Nummer sagt alles: Grün = bereit, Blau = belegt, Amber = Reinigung gewünscht oder tägliche Reinigung fällig, Orange = ausgecheckt, Rosé = „Bitte nicht stören“. Violett und eine Flagge bedeuten priorisiert, ein rot blinkender Ring eine dringende Service-Anfrage. Die kleinen Symbole darunter nennen den Grund.',
      tun: 'Fahren Sie mit der Maus über eine Kachel – der Tooltip nennt den Zustand im Klartext.',
    },
    'uebersicht.dialog': {
      title: 'Ein Klick öffnet das Zimmer',
      body: 'Im Dialog liegen Check-in und Check-out, die Gast-PIN zum Vorlesen, das Check-in-Blatt zum Drucken, das Abreisedatum, die Priorität und der Verlauf der letzten 30 Tage. Der Check-in ist ein Klick; das Abreisedatum ist freiwillig und lässt sich jederzeit nachtragen.',
      tun: 'Klicken Sie ruhig ein Zimmer an – der Lotse bleibt offen.',
    },
    'uebersicht.checkout': {
      title: 'Beim Check-out steht der Betrag',
      body: 'Hat der Gast kostenpflichtige Leistungen bestellt, zeigt der Dialog schon vor der Bestätigung hervorgehoben, was zu kassieren ist – mit „Details“ als druckbare Aufstellung: Zimmer, Zeitraum, Posten mit Zeitpunkten, Summe. Kein Gastname, keine Rechnung. Wurde nichts Kostenpflichtiges bestellt, steht dort nur ein Hinweis, und Sie checken aus wie bisher.',
      tun: 'Offene Anfragen schließt der Check-out als „nicht erbracht“ – was tatsächlich erbracht wurde, haken Sie vorher im selben Kasten ab. Später kommen Sie über den Verlauf des Zimmers wieder an die Aufstellung: Der Eintrag „Check-out“ trägt den Link.',
    },
    'anfragen.zaehler': {
      title: 'Alles, was Gäste bestellt haben',
      body: 'Hier laufen die Anfragen aus dem Gästeportal auf. Dieselbe Zahl steht als Abzeichen an „Anfragen“ in der Navigation – sie blinkt rot, sobald mindestens eine Anfrage einen dringenden Service betrifft, und die betroffene Zimmer-Kachel bekommt eine Glocke.',
    },
    'anfragen.liste': {
      title: 'Was eine Anfrage mitbringt',
      body: 'Zimmernummer, Service, die gewählten Optionen samt Preis, eine freie Anmerkung des Gastes und das Alter der Anfrage. Neue Anfragen erscheinen von selbst – die Seite wird über dieselbe Live-Verbindung aktualisiert wie die Boards.',
    },
    'anfragen.erledigt': {
      title: 'Der Haken entscheidet über den Betrag',
      body: 'Eine Anfrage ist offen oder abgeschlossen; es gibt kein „in Bearbeitung“ und keine Zuweisung. Beim Abschluss zählt der Unterschied: „Erledigt“ heißt erbracht – und erscheint mit Betrag auf der Aufstellung beim Check-out. Was bis dahin offen bleibt, schließt RoSe als „nicht erbracht“: gekennzeichnet, aber nicht berechnet. Ausgenommen sind Meldungen ans Haus: Ein Defekt bleibt offen, bis ihn jemand abhakt – auch über den Check-out hinaus, und der nächste Check-in warnt davor.',
      tun: 'Haken Sie eine erledigte Anfrage gleich ab – sonst fehlt sie am Ende in der Summe.',
    },
    'anfragen.verlauf': {
      title: 'Abgeschlossenes bleibt nachvollziehbar',
      body: 'Abgeschlossene Anfragen rutschen in die eingeklappte Liste darunter, mit Zeitpunkt und Namen; nicht erbrachte tragen dort ein Kennzeichen. Sie tauchen außerdem im Verlauf des Zimmers auf – praktisch, wenn ein Gast später nachfragt, ob sein Wunsch angekommen ist.',
    },
    'zimmer.bereich': {
      title: 'Gebäudeteil und Etage',
      body: 'Der Gebäudeteil ist freiwillig und nur für Häuser gedacht, die wirklich getrennte Trakte haben. Er wirkt aber auf die Eindeutigkeit: Zimmernummern müssen nur je Gebäudeteil eindeutig sein – die „101“ darf es im Haupthaus und im Nebenhaus geben.',
    },
    'zimmer.praefix': {
      title: 'Etagennummer voranstellen',
      body: 'Wer auf jeder Etage denselben Nummernkreis nutzt, braucht dieses Häkchen: Aus Etage 2 und „05“ wird „205“. Ohne das Häkchen kollidieren die Nummern, und nur die erste Etage entstünde – die Seite warnt vorher.',
    },
    'zimmer.absenden': {
      title: 'Erst die Vorschau, dann der Klick',
      body: 'Über dem Knopf steht, wie viele Zimmer entstehen und wie sie heißen werden. Geschrieben wird erst beim Klick – Sie können vorher beliebig ausprobieren.',
    },
    'regeln.logo': {
      title: 'Ihr Logo auf den Ausdrucken',
      body: 'Zimmer-Aushang und Check-in-Blatt tragen oben links Ihr Logo; ohne eines steht dort der Name des Hauses. PNG, JPG oder SVG, höchstens 1 MB. Zwei Fallen: Ein zu kleines Bild wird auf 55 mm unscharf, und ein helles Logo für dunkle Hintergründe ist auf weißem Papier unsichtbar – die Vorschau zeigt es deshalb auf Weiß.',
    },
    'regeln.checkin': {
      title: '„Check-in ab“ treibt die Abreisen an',
      body: 'Bis dahin sollen die Abreisezimmer bezugsfertig sein. Das Reinigungsboard rechnet mit dieser Zeit: Je mehr Abreisen noch offen sind und je näher der Check-in rückt, desto stärker zieht es Reinigungskräfte auf die Etagen mit Abreisen – an ruhigen Tagen kaum, an vollen deutlich. Eine Priorität der Rezeption geht trotzdem immer vor.',
    },
    'regeln.aufschub': {
      title: '„Frühestens ab“ – der Gast schiebt auf',
      body: 'Der Gast wünscht Reinigung, aber nicht vor einer Uhrzeit, weil er ausschlafen will. Bis dahin gilt das Zimmer auf dem Board als nicht offen. Wählen Sie die Grenze so, dass die Reinigung danach noch in die Schicht fällt: Housekeeping bis 15:00 heißt 13:00.',
    },
    'regeln.personenbezug': {
      title: 'Je Kraft oder nur als Team',
      body: 'Darf oder soll die Arbeit einzelner Reinigungskräfte bei Ihnen nicht gemessen werden, wählen Sie „Nur als Team“: Die Auswertung zeigt dann nur die Hausbilanz, im Zimmer-Verlauf steht „Reinigungsteam“, und die Einträge verlieren beim Schichtende ihre Person – beim Umstellen auch alle bisherigen. Zurückstellen geht, die Namen anonymisierter Einträge kommen aber nicht zurück. Bei einer einzigen Reinigungskraft im Dienst ist der Schutz ohnehin nur formal.',
    },
    'regeln.fenster': {
      title: 'Reinigungswunsch nur zu festen Zeiten',
      body: 'Außerhalb des Fensters kann der Gast keinen Wunsch mehr absetzen und sieht stattdessen Ihre Reinigungszeiten. „Bitte nicht stören“ und das Zurücknehmen eines Wunsches bleiben immer möglich – sonst säße jemand mit einem Wunsch fest, den er nicht mehr los wird.',
    },
    'regeln.pin': {
      title: 'PIN-Länge und vergessene Abschlüsse',
      body: 'Die PIN-Länge gilt für neu erzeugte Gast-PINs; laufende Aufenthalte behalten ihre. Der zweite Wert räumt vergessene Abschlüsse auf: Wird eine gestartete Reinigung nicht abgeschlossen, geht das Zimmer nach dieser Zeit von selbst wieder auf offen – und der Verlauf hält fest, dass das Zeitlimit gerissen ist.',
    },
    'regeln.adresse': {
      title: 'Die Adresse Ihres Hauses',
      body: 'Unter dieser Adresse melden sich Gäste und Reinigungskräfte an. Sie steht in beiden Anmeldungen, weil Zimmernummern und Benutzernamen nur innerhalb des Hauses eindeutig sind. Gedruckte QR-Codes bleiben bei einer Änderung gültig – nur abgetippte Adressen auf älteren Check-in-Blätter stimmen dann nicht mehr.',
    },
    'gastzugang.sprachen': {
      title: 'Piktogramme statt Sprachliste',
      body: 'Die gedruckten Blätter erklären das Portal mit Bildern seiner Knöpfe – daneben steht Text in einer Hauptsprache und wahlweise einer zweiten. Mehr Sprachen aufs Papier zu drucken hilft weniger, als es an Platz kostet: Wer weder Ihre Landessprache noch Englisch liest, kommt über die Bilder und den QR-Code weiter und übersetzt im Portal mit dem Handy.',
      tun: 'Die erste Sprache ist zugleich die der Zugangs-E-Mail – die zweite steht nur auf dem Ausdruck.',
    },
    'gastzugang.aushang': {
      title: 'Die Aushänge für die Zimmer',
      body: 'Im PIN-Verfahren braucht jedes Zimmer seinen Aushang: DIN A4 für Rahmen, Aufsteller oder Mappe, oder vier kompakte Karten je Seite zum Auseinanderschneiden. Einmal gedruckt, dauerhaft gültig. Im Verfahren mit individuellem Zugang sind die Aushänge ausgeblendet: Sie führten auf eine PIN-Eingabe, die dort niemand bedienen kann.',
    },
    'aushang.karte': {
      title: 'Ein Aushang je Zimmer',
      body: 'Der Aushang kommt ins Zimmer – in einen Aufsteller, einen Rahmen oder die Mappe: QR-Code, Zimmernummer, Hausname. Der Gast scannt sie und tippt nur noch seine PIN. Der Code gehört zum Zimmer, nicht zum Aufenthalt – er bleibt über alle Gäste hinweg gültig und wird genau einmal gedruckt.',
    },
    'aushang.knopf': {
      title: 'Erst erzeugen, dann drucken',
      body: 'Zimmer ohne Code sammeln sich hier: Der Knopf erzeugt die fehlenden auf einmal. Sind alle da, wird er zum Druck-Knopf – eine Seite je Zimmer, damit sich jeder Aushang einzeln verwenden lässt. Neu angelegte Zimmer brauchen also einen zweiten Durchgang.',
    },
    'aushang.erneuern': {
      title: 'Erneuern macht den alten Aushang ungültig',
      body: 'Kommt eine Karte abhanden oder soll ein Code aus anderem Grund weg, erzeugt „Code erneuern“ einen neuen – und der alte Aushang funktioniert ab dann nicht mehr. Deshalb liegt das nur bei Inhaber und Manager, und deshalb betrifft es immer nur ein Zimmer.',
    },
    'aushang.hinweis': {
      title: 'Nur im Verfahren mit festem Zimmer-QR',
      body: 'Nutzt Ihr Haus individuelle Zugänge je Aufenthalt, führen diese Aushänge auf eine PIN-Eingabe, die neue Gäste gar nicht bedienen können – dann gehören sie nicht ins Zimmer. Die Seite sagt das oben ausdrücklich, statt sich einfach zu sperren.',
    },
    'aushang.blatt': {
      title: 'Das Check-in-Blatt entsteht beim Check-in',
      body: 'Anders als der Aushang gehört es zu genau einem Aufenthalt. Sie finden es im Zimmer-Dialog, sobald eingecheckt ist: ein Blatt mit PIN, QR-Code und einer Kurzanleitung, die sich nach den Regeln Ihres Hauses richtet – reinigt das Haus belegte Zimmer täglich, sagt der Text das, sonst bittet er darum, die Reinigung im Portal anzufordern. Wahlweise geht dasselbe als E-Mail; die Adresse wird dabei nicht gespeichert.',
      tun: 'Klicken Sie ein belegtes Zimmer an – der Weg zum Check-in-Blatt liegt im Dialog.',
    },
    'aushang.login': {
      title: 'Zugangskarten für die Reinigung',
      body: 'Die dritte Drucksache: eine Karte je Reinigungskraft, mit der sie sich ohne Tippen am Board anmeldet. Eine neu ausgegebene Karte macht die alte ungültig – genau der Weg, wenn eine verloren geht. Die Karte überlebt ein „Zugang beenden“ und gilt nach einer Reaktivierung wieder.',
    },
    'personal.karte': {
      title: 'Zugangskarten mit QR',
      body: 'Statt PIN-Eingabe kann sich die Reinigung über eine gedruckte Karte anmelden – einmal scannen, drin. Eine neu ausgegebene Karte macht die alte ungültig; genau das ist der Weg, wenn eine Karte abhandenkommt.',
    },
    'personal.rezeption': {
      title: 'Rezeptions-Zugänge',
      body: 'Die Rezeption macht das Tagesgeschäft: Check-in und Check-out, Prioritäten, Anfragen, Check-in-Blätter und Karten drucken. Einstellungen, Zimmer-Setup, Services und Personalverwaltung bleiben ihr verschlossen.',
    },
    'personal.manager': {
      title: 'Manager – nur der Kontoinhaber',
      body: 'Ein Manager hat im Haus dieselben Rechte wie Sie, aber keinen Zugriff auf Konto und Abrechnung. Wer über mehrere Häuser eingesetzt wird, wird je Haus eingetragen – ab dem zweiten Mal ohne neuen Zugang. Entfernen wirkt immer nur auf dieses eine Haus.',
    },
    'services.beispiele': {
      title: 'Mit Beispielen anfangen',
      body: 'Solange noch kein Service angelegt ist, können Sie zwei fertige übernehmen und anpassen. Das sind ganz normale Services – umbenennen, ergänzen oder archivieren ist jederzeit möglich.',
    },
    'reinigung.login': {
      title: 'Anmeldung ohne E-Mail',
      body: 'Eine Reinigungskraft hat Benutzernamen und PIN – oder scannt ihre gedruckte Zugangskarte und ist sofort angemeldet. Beides gilt nur in diesem Haus; dieselbe Namensvetterin darf es anderswo noch einmal geben.',
    },
    'reinigung.schicht': {
      title: 'Erst Schichtbeginn, dann Arbeit',
      body: 'Ohne begonnene Schicht lässt sich keine Reinigung starten. Der Schichtbeginn ist zugleich der erste Eintrag im Arbeitsnachweis – aus diesen Einträgen rechnet die Auswertung später Arbeits-, Pausen- und Reinigungszeiten.',
      tun: 'Ziehen Sie den Schieber ganz durch – er löst erst bei 97 % der Bahn aus.',
    },
    'reinigung.etagen': {
      title: 'Etagen statt einer langen Liste',
      body: 'Nach dem Schichtbeginn kommt zuerst die Etagen-Ebene, in fester Reihenfolge wie in der Rezeption. Jede Zeile sagt, wie viel dort offen ist, ob eine Priorität wartet und wer schon vor Ort arbeitet.',
    },
    'reinigung.naechstes': {
      title: '„Als Nächstes“ ist eine Empfehlung, keine Zuweisung',
      body: 'Genau eine Etage trägt das Abzeichen. Ist irgendwo ein priorisiertes Zimmer offen, ist es diese Etage – eine Entscheidung der Rezeption geht vor. Sonst die höchste noch offene Dringlichkeit, geteilt durch die Zahl der Reinigungskräfte vor Ort plus eins; Abreisen wiegen dabei mehr, je näher der Check-in rückt. Wo schon jemand arbeitet, lohnt der Weg weniger. Etagen ohne offene Arbeit fallen heraus, bei Gleichstand gewinnt die untere – damit die Empfehlung nicht hin und her springt.',
    },
    'reinigung.kacheln': {
      title: 'Eine Etage wählen heißt einbuchen',
      body: 'Wer sich einbucht, steht ab jetzt sichtbar auf dieser Etage – in der Rezeptions-Übersicht und für das ganze Team. Ausgegraute Zimmer sind nicht gesperrt, sondern nur ohne Auftrag: unbelegt, „Bitte nicht stören“, heute keine Reinigung gewünscht, oder eine Reinigung, die erst später gilt.',
    },
    'reinigung.starten': {
      title: 'Starten per Schieber, nicht per Knopf',
      body: 'Ein Tipp auf die Kachel öffnet das Zimmer. Gestartet wird mit einem Zug, der am Griff beginnen und die Bahn fast ganz zurücklegen muss – ein Handy in der Schürzentasche soll keine Reinigung auslösen.',
    },
    'reinigung.tuer': {
      title: 'Gast ist da und möchte gerade nicht?',
      body: 'Dafür muss niemand starten: „In 30 Min“ oder „In 1 Std“ nimmt das Zimmer bis dahin vom Board – für das ganze Team, niemand klopft zwischendurch noch einmal; danach ist es von selbst wieder offen. „Heute nicht“ erledigt es für heute. Wünscht der Gast doch noch Reinigung, tippt er im Portal. Als Reinigung gezählt wird beides nicht, im Zimmer-Verlauf steht es trotzdem.',
      tun: 'Probieren Sie einen der drei Knöpfe – die Kachel zeigt danach, was passiert ist.',
    },
    'reinigung.abschliessen': {
      title: 'Abschließen – und was passiert, wenn es jemand vergisst',
      body: 'Zwischen Start und Abschluss steht das Zimmer für alle als „in Arbeit“. Wird der Abschluss vergessen, geht das Zimmer nach der eingestellten Zeit von selbst wieder auf offen, und der Verlauf hält fest, dass das Zeitlimit gerissen ist – statt dass ein halber Vorgang für immer stehen bleibt.',
    },
    'reinigung.status': {
      title: 'Pause, sonstige Reinigung, Schichtende',
      body: 'Alle Zustandswechsel liegen auf einer eigenen Seite, nicht auf dem Board – am Handy greift so die Zurück-Taste. Pause und sonstige Reinigung sind Zeiträume innerhalb der Schicht und dürfen sich mit nichts überschneiden; das Schichtende beendet beides. Darunter steht die Tagesbilanz der Reinigungskraft.',
    },
    'reinigung.verlassen': {
      title: 'Die Etage verlässt man bewusst',
      body: 'Auch der Rückweg ist ein Schieber, und zwar von rechts nach links. Ein Fehltipper soll niemanden aus der Etage werfen – das würde die Verortung für das Team falsch machen.',
    },
    'gast.zugang': {
      title: 'Kein Konto, keine App',
      body: 'Der Gast scannt den Aushang im Zimmer und gibt die PIN vom Check-in-Blatt ein – oder er öffnet den individuellen Link, den er beim Check-in bekommen hat, und ist ohne PIN drin. Welcher der beiden Wege gilt, entscheidet das Haus unter „Gästezugang“.',
    },
    'gast.portal': {
      title: 'Ein Bildschirm, mehr nicht',
      body: 'Nach der Anmeldung merkt sich ein Cookie den Aufenthalt – die PIN wird kein zweites Mal verlangt. Das Portal nennt Haus und Zimmer, damit niemand versehentlich für das Nachbarzimmer bestellt.',
    },
    'gast.reinigen': {
      title: 'Ein Tipp genügt',
      body: '„Zimmer reinigen“ setzt den Wunsch, und das Zimmer erscheint sofort auf dem Reinigungsboard und in der Rezeptions-Übersicht. Erneut tippen nimmt ihn zurück. Nichts davon ist ein Termin – das Housekeeping kommt, wenn es in die Runde passt.',
      tun: 'Tippen Sie ruhig darauf; der Nachbau reagiert wie das echte Portal.',
    },
    'gast.aufschub': {
      title: '„Frühestens ab“ – für Ausschläfer',
      body: 'Der Gast wünscht Reinigung, aber nicht vor einer Uhrzeit. Bis dahin gilt das Zimmer auf dem Board als nicht offen, die Kachel zeigt eine Uhr. Wie weit aufgeschoben werden darf, gibt das Haus vor – und das Portal sagt dazu, dass die Grenze vom Haus stammt.',
    },
    'gast.aktiv': {
      title: 'Der Gast sieht, was er ausgelöst hat',
      body: 'Ein aktiver Wunsch bleibt sichtbar, samt der gewählten Uhrzeit, und die Statuskarte darüber sagt, woran der Gast ist – vorgesehen, ab einer Uhrzeit, gerade in Arbeit, heute schon gereinigt. Wann genau jemand kommt, sagt das Portal bewusst nicht: Dieses Versprechen könnte RoSe ohne Zuweisungslogik nicht halten.',
    },
    'gast.verzicht': {
      title: '„Heute keine Reinigung“ – nur bei täglicher Reinigung',
      body: 'Reinigt das Haus täglich, verzichtet der Gast mit einem Tipp für heute. Das ist nicht dasselbe wie „Bitte nicht stören“: Der Verzicht gilt nur bis Mitternacht, Services und Rezeption bleiben erreichbar, morgen wird wieder gereinigt. Auf dem Board wird das Zimmer grau mit einem Blatt. Reinigt das Haus nur auf Wunsch, fehlt der Knopf – dort ist Nicht-Anfordern schon der Verzicht.',
    },
    'gast.dnd': {
      title: '„Bitte nicht stören“ schlägt alles',
      body: 'Solange es aktiv ist, klopft niemand – auch nicht für einen Service –, und die tägliche Reinigung setzt aus. Es gilt, bis der Gast es zurücknimmt, auch über Nacht. Zurücknehmen geht jederzeit – anders als der Reinigungswunsch ist „Bitte nicht stören“ nie durch ein Zeitfenster gesperrt, sonst säße jemand damit fest.',
    },
    'gast.services': {
      title: 'Services aus dem Baukasten',
      body: 'Der Gast sieht genau die Services, die das Haus angelegt hat, mit den Preisen als Anzeige. Bestellt wird mit einem Tipp; die Anfrage landet bei der Rezeption unter „Anfragen“. Abgerechnet wird in RoSe nichts.',
    },
    'gast.bestellt': {
      title: 'Und dann ist Schluss',
      body: 'Offene Anfragen bleiben für den Gast sichtbar, bis die Rezeption sie erledigt. Mit dem Check-out erlöschen PIN, Link und Cookie sofort – der Aufenthalt bleibt anonym, es war nie ein Name im Spiel.',
    },
    'auswertung.zeitraum': {
      title: 'Der Zeitraum steht in der Adresse',
      body: 'Von–bis als ganz normales Formular, das den Zeitraum in die URL schreibt. Dadurch lässt sich ein Stand verlinken, weiterschicken und drucken – und beim Drucken fällt das Formular selbst weg.',
    },
    'auswertung.kennzahlen': {
      title: 'Alles gerechnet, nichts gespeichert',
      body: 'Die Zahlen entstehen aus den Einträgen der Reinigungskräfte: Schichtbeginn und -ende, Pause, sonstige Reinigung, Start und Abschluss je Zimmer. „Netto-Arbeitszeit“ ist die Schicht ohne Pause, „Übrige Zeit“ das, was weder Zimmer- noch sonstige Reinigung war – Wege und Rüstzeit.',
    },
    'auswertung.auffaellig': {
      title: 'Unplausibles zählt nicht in den Summen',
      body: 'Eine Schicht über 16 Stunden ist ein vergessenes Schichtende, eine Pause über vier Stunden dasselbe, und eine Reinigung ohne Abschluss zählt nicht als geleistete Arbeit. Solche Fälle werden hier gezählt statt eingerechnet – sonst schleppte eine offene Schicht die Arbeitszeit tagelang mit und machte die ganze Auswertung unbrauchbar.',
    },
    'auswertung.tabelle': {
      title: 'Je Kraft – auch ausgeschiedene',
      body: 'Wer den Zugang beendet hat, bleibt in der Auswertung sichtbar; der Arbeitsnachweis überlebt das Ausscheiden. Ein Klick auf den Namen öffnet das Tagesprotokoll mit den einzelnen Einträgen.',
    },
    'auswertung.nachfrage': {
      title: 'Wann die Arbeit anfällt',
      body: 'Der zweite Teil beantwortet eine Planungsfrage: Zu welchen Stunden wünschen Gäste Reinigung, wann wird ausgecheckt – und wie viele Reinigungskräfte waren dann im Dienst? Die Kennzahl „Wünsche ohne Kraft im Dienst“ ist der eigentliche Hinweis. Deshalb fragt RoSe Gäste auch nicht nach Wunschzeiten: Die Daten liegen schon vor.',
    },
    'konto.plan': {
      title: 'Ein Preis, keine Pakete',
      body: 'Abgerechnet wird je Zimmer und Kalendermonat, mit einem Mindestbetrag je Konto – nicht je Haus. Eine Kette zahlt also die Summe ihrer Zimmer und nicht dreimal das Minimum. Alle Funktionen sind enthalten; es gibt nichts, worauf Sie später hochstufen müssten.',
    },
    'konto.laufend': {
      title: 'Gezählt wird großzügig, aber eindeutig',
      body: 'Ein Zimmer zählt für den Monat, sobald es darin auch nur vorübergehend in Betrieb war – heute außer Betrieb genommen zählt noch mit, heute angelegt ebenfalls. Die Zahl steht deshalb erst mit dem Monatsende fest, und der laufende Monat ist immer eine Vorschau.',
    },
    'konto.monate': {
      title: 'Abgeschlossene Monate liegen fest',
      body: 'Sobald ein Monat vorbei ist, ändert sich sein Betrag nicht mehr – auch dann nicht, wenn Sie später Zimmer löschen: Vor jeder Löschung wird die Zimmerzahl der betroffenen Monate festgeschrieben. Solange nichts gelöscht wird, entsteht dafür keine einzige Zeile.',
    },
    'konto.zahlungsweg': {
      title: 'Zahlungsweg und Rechnungsdaten',
      body: 'Karte oder SEPA-Lastschrift werden ohne Belastung hinterlegt und beim Monatslauf eingezogen; wer auf Rechnung zahlen will, bekommt eine Überweisung mit eigener Bankverbindung. Rechnungsempfänger, Anschrift und – außerhalb Deutschlands innerhalb der EU – die USt-IdNr. sind Pflicht, weil sonst die Steuer nicht richtig gerechnet werden kann.',
    },
    'konto.rechnungen': {
      title: 'Rechnungen kommen am Monatsersten',
      body: 'Für den Vormonat, elektronisch, zahlbar innerhalb von 14 Tagen. Jede Rechnung ist hier als PDF und als Ansichtsseite hinterlegt und bleibt es auch dann, wenn Sie das Konto später löschen – Belege müssen aufbewahrt werden.',
    },
  } satisfies Record<string, LotseStepText>,

  /**
   * Einrichtungs-Checkliste (Hilfe-Hub) und Band auf der Übersicht: Zustand
   * (`label`), Handlungsform (`todo`), Hinweis bei erledigt bzw. offen.
   */
  setup: {
    zimmer: {
      label: 'Zimmer angelegt',
      todo: 'Zimmer anlegen',
      done: { one: '{count} Zimmer in Betrieb', other: '{count} Zimmer in Betrieb' },
      open: 'Ohne Zimmer gibt es keinen Check-in und kein Reinigungsboard',
    },
    regeln: {
      label: 'Regeln des Hauses geprüft',
      todo: 'Regeln des Hauses prüfen',
      done: 'Zeitzone gesetzt – tägliche Reinigung, Check-out-Frist und Auswertung rechnen richtig',
      open: 'Vor allem die Zeitzone – einmal prüfen und speichern, auch ohne Änderung',
    },
    gastzugang: {
      label: 'Gästezugang gewählt',
      todo: 'Gästezugang wählen',
      done: 'Das Verfahren steht – jeder Check-in hält es am Aufenthalt fest',
      open: 'Fester Zimmer-QR mit PIN oder individueller Zugang je Aufenthalt – die Wahl einmal bestätigen, auch die Vorgabe',
    },
    personal: {
      label: 'Reinigungskraft angelegt',
      todo: 'Reinigungskraft anlegen',
      done: { one: 'Ein Zugang für die Reinigung', other: '{count} Zugänge für die Reinigung' },
      open: 'Ohne Zugang kommt niemand auf das Reinigungsboard',
    },
    services: {
      label: 'Services eingerichtet',
      todo: 'Services einrichten',
      done: { one: 'Ein Service im Baukasten', other: '{count} Services im Baukasten' },
      open: 'Freiwillig – ohne Services zeigt das Gästeportal nur Reinigung und „Bitte nicht stören“',
    },
    checkin: {
      label: 'Erster Check-in',
      todo: 'Ersten Check-in ausprobieren',
      done: 'Der Ablauf ist einmal durchlaufen',
      open: 'Ein Klick auf ein Zimmer, dann „Check-in“ – die PIN steht sofort am Bildschirm',
    },
    zahlungsweg: {
      label: 'Zahlungsweg hinterlegt',
      todo: 'Zahlungsweg hinterlegen',
      done: 'Rechnungsdaten und Zahlungsweg stehen',
      open: 'Der erste Monat ist frei – hinterlegen können Sie den Weg jederzeit',
    },
  },
}
