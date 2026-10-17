import type { LooseContext } from '../../format'
import type { AdminMessages } from './index'

/**
 * Erläuterungen zur Rezeption für Übersetzer (17.10.2026). Abschnitte
 * vererben ihre Erläuterung an alle Texte darunter (`LooseContext`); einzelne
 * Texte haben eine eigene, wo Platzhalter oder Sonderfälle es verlangen.
 *
 * Für alle Texte gilt: Leser sind Rezeption, Inhaber und Manager eines
 * Hauses, am Rechner oder Tablet. Sie werden gesiezt (Deutsch), sachlich und
 * freundlich. „Haus“ statt „Hotel“ (auch Pensionen nutzen RoSe). Begriffe wie
 * in den Portalen: „Gästeportal“, „Reinigungsboard“, „Zugangskarte“,
 * „Check-in-Blatt“, „Aushang“, „Bitte nicht stören“, „Heute keine
 * Reinigung“. Platzhalter `{…}` und Auszeichnungen `<b>`, `<link>`, `<code>`,
 * `<time>` bleiben stehen; `{count}` steht in Formen für eins (`one`) und
 * mehr (`other`).
 */
export const adminContext = {
  common: { where: 'Überall in der Rezeption: Knöpfe und kurze Meldungen', note: 'Allgemeine Wörter, so kurz wie möglich.' },

  overview: {
    nav: { where: 'Kopfzeile der Rezeption (Navigation)', note: 'Ein bis zwei Wörter je Punkt; „Anfragen“ = Service-Anfragen der Gäste, „Häuser“ = alle Häuser des Kontos.' },
    page: {
      _: { where: 'Übersicht → Kopf mit Kennzahlen', note: '{count} = Anzahl Zimmer. Kurz, stehen nebeneinander als Kennzahlen.' },
      noRoomsHint: { where: 'Übersicht ohne Zimmer', note: '<link>…</link> wird zum Link auf die Zimmer-Verwaltung.' },
    },
    setup: { where: 'Übersicht → Einrichtungs-Band oben, solange die Einrichtung nicht fertig ist', note: '{count}/{total} = Schritte; {todo} = nächster Schritt (Handlungsform); {hint} = kurzer Zusatz.' },
    grid: { where: 'Übersicht → Zimmer-Kacheln, gruppiert nach Etagen', note: '{floor} = Etage, {count} = Zimmerzahl.' },
    status: { where: 'Übersicht → Zustand eines Zimmers (Tooltip der Kachel, Kopf des Dialogs)', note: 'Teile werden mit „ · “ verbunden; kurz. {date}/{time} = Datum/Uhrzeit, {count} = Anzahl.' },
    departure: { where: 'Zimmer-Dialog → Auswahl des Abreisedatums', note: '„offen“ = kein Datum bekannt; {count} = Nächte, {date} = Datum.' },
    dialog: {
      _: { where: 'Übersicht → Zimmer-Dialog (Check-in, Check-out, Priorisieren)', note: 'Wird am Tresen gelesen, während der Gast wartet: klar und knapp.' },
      bill: { where: 'Zimmer-Dialog → Kasten mit den kostenpflichtigen Zusatzleistungen vor dem Check-out', note: '„Meldung ans Haus“ = Defekt, gehört zum Zimmer, bleibt offen. {count} = Anzahl.' },
      history: { where: 'Zimmer-Dialog → Verlauf der letzten 30 Tage', note: 'Kurze Beschriftungen.' },
    },
    checkedOut: { where: 'Bildschirm nach dem Check-out — der Betrag bleibt stehen, bis die Rezeption schließt', note: '{number} = Zimmer, {count} = Anzahl. „nicht erbracht“ = Anfrage beim Check-out geschlossen, ohne dass sie erledigt wurde.' },
    history: { where: 'Zimmer-Verlauf → Einträge (wer hat wann was getan)', note: 'Kurz, wie Logbucheinträge. {name} = Service bzw. Reinigungskraft. „actors“ = wer gehandelt hat.' },
    orders: { where: 'Seite „Anfragen“ (Service-Anfragen der Gäste)', note: '{count} = Anzahl bzw. Minuten/Stunden; „Min.“/„Std.“ abgekürzt.' },
    checkInWarnings: { where: 'Zimmer-Dialog → Warnung vor dem Check-in mit „Trotzdem einchecken“', note: '{name} = Service der offenen Meldung.' },
    unsaved: { where: 'Leiste „Ungespeicherte Änderungen“ unten auf langen Einstellungsseiten', note: 'Sehr kurz.' },
    errors: { where: 'Fehlermeldungen im Zimmer-Dialog', note: '{message} = technische Fehlermeldung, unübersetzt.' },
  },

  staff: {
    personal: {
      _: { where: 'Einstellungen → Personal (Reinigung, Rezeption, Manager)', note: '„Zugang beenden“ = Anmeldung sperren, Daten bleiben; „Löschen“ = endgültig. „Kraft/Kräfte“ nur in Köpfen und Zählern, sonst „Reinigungskraft“. {name} = Person, {count} = Anzahl.' },
      deletePanel: { where: 'Personal → Löschdialog mit Liste dessen, was verloren geht', note: '{period} wird durch periodOne/periodRange ersetzt; {list} = aufgezählte Posten; {phrase} = abzutippender Name.' },
      notices: { where: 'Personal → Rückmeldung nach einem Vorgang (grüner Kasten)', note: '{name}/{username} = Person; {count} = übrige Häuser.' },
    },
    report: {
      _: { where: 'Auswertung (Arbeitszeiten und Reinigungen der Reinigung)', note: 'Kennzahlen und Tabellenköpfe kurz. {count}, {duration} (z. B. 2:15 h), {name}.' },
      demand: { where: 'Auswertung → Nachfrage: wann Gäste Reinigung wünschen', note: '{from}/{to} = Stunden (24-Stunden-Format), {pct} = Prozent, {staff} = Durchschnitt, {wishes}/{checkouts}/{dnd} = Anzahl. „weekdays“ = Abkürzungen Montag bis Sonntag.' },
      kinds: { where: 'Auswertung → Tagesprotokoll einer Reinigungskraft', note: 'Arten von Einträgen, wie Logbuch.' },
    },
    errors: { where: 'Personal → Fehlermeldungen', note: '{message} = technische Fehlermeldung; {username}, {room}, {phrase} siehe Text.' },
  },

  rooms: {
    _: { where: 'Einstellungen → Zimmer verwalten (anlegen, bearbeiten, außer Betrieb nehmen, löschen)', note: '„außer Betrieb“ = Zimmer vorübergehend nicht nutzbar, Historie bleibt. {count}, {floor}, {number}, {building}, {label} (Bereich), {list} (Zimmernummern), {max}, {more}, {skipped}, {rooms}, {phrase}, {amount}, {message}.' },
    scope: { where: 'Zimmer → Bezeichnung eines Bereichs (auch die abzutippende Bestätigung beim Löschen)', note: 'confirmUnnamedBuilding ist ein Wort in Großbuchstaben, das zum Löschen abgetippt wird.' },
  },

  services: {
    _: { where: 'Einstellungen → Service-Baukasten', note: '„Verweis“ = Kachel mit Link nach außen; „Meldung ans Haus“ = Defekt, gehört zum Zimmer. {count}, {name}, {label}, {currency} (ISO-Code), {min}, {example} (Beispielpreis).' },
    languages: { where: 'Service-Baukasten → Sprachen eines Service', note: '{lang}/{home} = Name einer Sprache; {text} = Grundtext; {count} = Anzahl Services.' },
    linkTemplates: { where: 'Service-Baukasten → Vorlagen für Verweise (Trinkgeld-App, Lieferdienste)', note: '{brand} = Markenname, nicht übersetzen. Regionen: Länder bzw. Weltregionen.' },
  },

  settings: {
    _: { where: 'Einstellungen', note: '„Haus & Regeln“, „Gästezugang“, „Mein Zugang“ sind Seitennamen. {message} = technische Fehlermeldung.' },
    house: { where: 'Einstellungen → Haus & Regeln', note: '<time></time> wird zum Uhrzeit-Feld (Formulierung um das Feld herum). {max}.' },
    guestAccess: { where: 'Einstellungen → Gästezugang (zwei Verfahren im Vergleich)', note: 'Listen mit Vor- und Nachteilen; der Satzbau darf sich frei anpassen.' },
    languages: { where: 'Gästezugang → Sprachen des Hauses', note: '„Heimatsprache“ = darin legt das Haus Inhalte an; „Rückfallsprache“ = gilt, wenn das Gerät eine Sprache hat, die nicht angeboten wird.' },
    logo: { where: 'Haus & Regeln → Logo', note: '{kb}, {width}, {min} = Zahlen.' },
    myAccess: { where: 'Einstellungen → Mein Zugang (eigene Anmeldung)', note: '{email}, {hours}, {until}, {imprint} (Link). Die Texte unter „mails“ und „confirm“ erscheinen in E-Mails bzw. auf der Bestätigungsseite; die E-Mails beginnen nach einer Anrede klein.' },
    testScenario: { where: 'Einstellungen → Test-Szenario (vorübergehend, nur Testbetrieb)', note: 'Wird bald entfernt; schlicht übersetzen. {seed}, {count}, {total}, {stays} usw.' },
  },
} satisfies LooseContext<AdminMessages>
