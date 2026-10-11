import type { LegalPage } from './blocks'

/**
 * Allgemeine Geschäftsbedingungen (`/agb`). Preise über `{pricePerRoom}` und
 * `{minMonthly}` aus `pricing.ts`, Anbieter über Platzhalter aus `provider.ts`.
 * Entwurf, anwaltliche Prüfung offen — Wortlaut nur mit Absicht ändern.
 */
export const agb: LegalPage = {
  meta: {
    title: 'AGB – RoSe',
    description: 'Allgemeine Geschäftsbedingungen für die Nutzung von RoSe – RoomService.',
  },
  title: 'Allgemeine Geschäftsbedingungen',
  sub: 'Für die Nutzung von RoSe – RoomService durch Beherbergungsbetriebe.',
  sections: [
    {
      title: '§ 1 Geltungsbereich, Anbieter',
      blocks: [
        '(1) Diese Bedingungen gelten für alle Verträge über die Nutzung des Software-Dienstes „RoSe – RoomService“ (nachfolgend „RoSe“ oder „der Dienst“) zwischen {name}, vertreten durch den Geschäftsführer {representative}, {street}, {zipCity} (nachfolgend „Anbieter“) und dem Kunden.',
        '(2) Der Dienst richtet sich ausschließlich an Unternehmer im Sinne von § 14 BGB, insbesondere Beherbergungsbetriebe. Mit Verbrauchern wird kein Vertrag geschlossen.',
        '(3) Abweichende oder ergänzende Bedingungen des Kunden werden nicht Vertragsbestandteil, auch wenn der Anbieter ihnen nicht ausdrücklich widerspricht.',
      ],
    },
    {
      title: '§ 2 Leistungsgegenstand',
      blocks: [
        '(1) RoSe ist ein über das Internet bereitgestellter Dienst (Software as a Service) mit drei Oberflächen: ein Verwaltungsportal für Rezeption und Management (Check-in und Check-out, Zimmerstatus, Prioritäten, Service-Anfragen, Auswertung), ein Reinigungsboard für das Housekeeping und ein Gästeportal, über das Gäste Reinigungswünsche, „Bitte nicht stören“ und Service-Bestellungen absetzen. Der aktuelle Funktionsumfang ergibt sich aus der Beschreibung auf der Website des Dienstes.',
        '(2) RoSe ist kein Buchungs-, Kassen- oder Hotelverwaltungssystem (PMS) und übernimmt keine Zahlungsabwicklung gegenüber Gästen. Preise, die der Kunde im Service-Baukasten hinterlegt, sind reine Anzeigeinformation; die Abrechnung gegenüber dem Gast obliegt allein dem Kunden.',
        '(3) Der Anbieter entwickelt den Dienst fortlaufend weiter und darf Funktionen ändern, ergänzen oder entfernen, soweit der Kern der Leistung nach Absatz 1 erhalten bleibt und die Änderung für den Kunden zumutbar ist. Über wesentliche Änderungen informiert der Anbieter in Textform.',
      ],
    },
    {
      title: '§ 3 Vertragsschluss, Konto',
      blocks: [
        '(1) Der Vertrag kommt mit Abschluss der Registrierung zustande, mit der der Kunde ein Konto und sein erstes Haus anlegt. Während der Testphase kann die Registrierung einen Einladungscode voraussetzen; ein Anspruch auf einen Code besteht nicht.',
        '(2) Der Kunde stellt sicher, dass die bei der Registrierung gemachten Angaben richtig sind und hält sie aktuell. Die Person, die das Konto anlegt, versichert, zum Vertragsschluss für den Kunden berechtigt zu sein.',
        '(3) Der Kunde kann innerhalb seines Kontos weitere Häuser anlegen sowie Zugänge für Manager, Rezeption und Reinigungskräfte einrichten. Er ist für alle Handlungen verantwortlich, die über Zugänge seines Kontos vorgenommen werden, und hält Zugangsdaten geheim. Bei Verdacht auf Missbrauch beendet er die betroffenen Zugänge unverzüglich (Funktion „Zugang beenden“).',
      ],
    },
    {
      title: '§ 4 Verfügbarkeit, Wartung, Support',
      blocks: [
        '(1) Der Anbieter bemüht sich um eine ununterbrochene Verfügbarkeit des Dienstes, schuldet jedoch keine bestimmte Verfügbarkeitsquote. Wartungsarbeiten kündigt der Anbieter nach Möglichkeit vorab an und legt sie in verkehrsarme Zeiten.',
        '(2) Ausfälle, die auf Umständen außerhalb des Einflussbereichs des Anbieters beruhen (insbesondere Störungen des Internets, höhere Gewalt, Ausfälle der eingesetzten Rechenzentrums- oder E-Mail-Dienstleister), hat der Anbieter nicht zu vertreten.',
        '(3) Support erfolgt per E-Mail an {email} zu üblichen Geschäftszeiten. Eine Reaktionszeit wird nicht zugesichert.',
      ],
    },
    {
      title: '§ 5 Pflichten des Kunden',
      blocks: [
        '(1) Der Kunde nutzt den Dienst nur im Rahmen der Gesetze und dieser Bedingungen. Insbesondere',
        {
          list: [
            'trägt er keine rechtswidrigen Inhalte ein und verwendet den Dienst nicht, um Dritte zu belästigen oder zu täuschen;',
            'informiert er seine Mitarbeitenden und Gäste in geeigneter Weise über die Verarbeitung ihrer Daten in RoSe (siehe § 8) und stellt die dafür nötigen Hinweise bereit, etwa auf dem Check-in-Blatt;',
            'legt er keine personenbezogenen Daten an Stellen ab, die dafür nicht vorgesehen sind (z. B. Namen oder Ausweisdaten in Zimmer- oder Service-Bezeichnungen);',
            'greift er nicht auf Daten anderer Kunden zu und unternimmt keine Versuche, Zugangsbeschränkungen oder Drosselungen zu umgehen;',
            'unterlässt er automatisierte Massenzugriffe, die den Betrieb beeinträchtigen.',
          ],
        },
        '(2) Der Kunde sichert Daten, die er über den Dienst hinaus benötigt (etwa Auswertungen für die Lohnabrechnung), rechtzeitig durch Export oder Ausdruck. Nach Vertragsende stehen sie nicht mehr zur Verfügung (§ 7 Abs. 4).',
        '(3) Bei schwerwiegenden oder wiederholten Verstößen darf der Anbieter das Konto nach vorheriger Abmahnung sperren, bei Gefahr im Verzug auch ohne. Das Recht zur außerordentlichen Kündigung bleibt unberührt.',
      ],
    },
    {
      title: '§ 6 Preise, Abrechnung, Zahlung',
      blocks: [
        '(1) Die Vergütung beträgt <b>{pricePerRoom} je Zimmer und Kalendermonat</b>, mindestens jedoch <b>{minMonthly} je Konto und Kalendermonat</b>, sobald mindestens ein Zimmer abrechenbar ist. Alle Preise verstehen sich netto zuzüglich der gesetzlichen Umsatzsteuer.',
        '(2) Abrechenbar ist jedes Zimmer, das im Kalendermonat – auch nur vorübergehend – in Betrieb war. Ein Zimmer, das den gesamten Monat über außer Betrieb war oder erst nach Monatsende angelegt wurde, zählt nicht. Maßgeblich ist die Zählung des Dienstes, die der Kunde jederzeit in seinem Konto einsehen kann; für abgeschlossene Monate wird sie festgeschrieben.',
        '(3) Der Kalendermonat, in dem das Konto angelegt wird, ist kostenfrei. Wird das Konto nicht am Monatsersten angelegt, ist auch der darauf folgende Kalendermonat kostenfrei – mindestens also ein voller Kalendermonat. Die Berechnung beginnt mit dem ersten Kalendermonat nach dem kostenfreien Zeitraum.',
        '(4) Die Abrechnung erfolgt monatlich nachträglich: Am ersten Tag des Folgemonats stellt der Anbieter über seinen Zahlungsdienstleister (Stripe Payments Europe, Ltd.) die Rechnung für den abgelaufenen Kalendermonat und stellt sie elektronisch bereit – per E-Mail mit PDF und Zahlungsseite sowie im Konto unter „Plan & Abrechnung“. Der Kunde hinterlegt dafür im Konto seine Rechnungsdaten (Rechnungsempfänger, Anschrift, Land und, für Unternehmen in der EU außerhalb Deutschlands, die USt-IdNr.); die Umsatzsteuer richtet sich nach diesen Angaben.',
        '(4a) Hat der Kunde eine Karte oder ein SEPA-Lastschriftmandat hinterlegt, wird der Rechnungsbetrag mit Rechnungsstellung eingezogen, bei Lastschrift nach Vorabankündigung durch den Zahlungsdienstleister. Andernfalls ist die Rechnung innerhalb von 14 Tagen ohne Abzug zu begleichen – per Überweisung auf die in der Rechnung genannte Bankverbindung des Zahlungsdienstleisters oder über die Zahlungsseite. Schlägt ein Einzug fehl, informiert der Zahlungsdienstleister den Kunden und wiederholt den Einzug; Kosten einer vom Kunden zu vertretenden Rücklastschrift trägt der Kunde.',
        '(5) Der Anbieter darf die Preise mit einer Ankündigungsfrist von sechs Wochen zum Monatsende ändern. Der Kunde kann in diesem Fall bis zum Wirksamwerden der Änderung außerordentlich zum Änderungszeitpunkt kündigen; hierauf weist der Anbieter in der Ankündigung hin.',
        '(6) Bei Zahlungsverzug von mehr als 30 Tagen darf der Anbieter den Zugang nach Mahnung mit angemessener Frist sperren; die Vergütung bleibt geschuldet.',
      ],
    },
    {
      title: '§ 7 Laufzeit, Kündigung, Vertragsende',
      blocks: [
        '(1) Der Vertrag läuft auf unbestimmte Zeit und kann von beiden Seiten jederzeit zum Ende eines Kalendermonats gekündigt werden. Der Kunde kündigt, indem er sein Konto im Verwaltungsportal löscht (Bereich „Daten löschen“) oder in Textform gegenüber dem Anbieter; der Anbieter kündigt in Textform.',
        '(2) Für den Monat, in dem das Konto gelöscht wird, bleibt die Vergütung nach § 6 geschuldet.',
        '(3) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.',
        '(4) Mit der Löschung des Kontos werden alle Daten des Kunden gelöscht – einschließlich der Aufzeichnungen, die der Dienst sonst als Nachweis erhält (Zimmer-Verlauf, Tätigkeitsnachweise, Abrechnungsbelege) – sowie die Anmeldekonten der zugehörigen Personen, soweit sie nicht in einem anderen Konto benötigt werden. Rechnungsdaten bewahrt der Anbieter im Rahmen der gesetzlichen Fristen auf.',
      ],
    },
    {
      title: '§ 8 Datenschutz, Auftragsverarbeitung',
      blocks: [
        '(1) Soweit der Kunde über den Dienst personenbezogene Daten verarbeitet (Gäste-Aufenthalte, Service-Anfragen, Personal, Tätigkeitsnachweise), ist er Verantwortlicher im Sinne der DSGVO und der Anbieter sein Auftragsverarbeiter. Die Parteien schließen hierzu einen Auftragsverarbeitungsvertrag nach Art. 28 DSGVO, der Bestandteil dieses Vertrags ist und vom Anbieter bereitgestellt wird.',
        '(2) Der Anbieter setzt als Unterauftragsverarbeiter Dienstleister für Datenbank und Anmeldung (Supabase), Hosting (Vercel) und E-Mail-Versand (Resend) ein; Einzelheiten und Speicherorte nennt die <datenschutz>Datenschutzerklärung</datenschutz>. Über Wechsel informiert der Anbieter vorab; der Kunde kann aus wichtigem Grund widersprechen.',
        '(3) Der Dienst ist so gestaltet, dass Gäste anonym bleiben (kein Name, keine Kontaktdaten). Der Kunde ist dafür verantwortlich, diese Gestaltung nicht durch eigene Eintragungen zu unterlaufen.',
      ],
    },
    {
      title: '§ 9 Nutzungsrechte',
      blocks: [
        '(1) Der Kunde erhält für die Vertragslaufzeit das einfache, nicht übertragbare Recht, den Dienst für den eigenen Betrieb zu nutzen und seinen Mitarbeitenden und Gästen im vorgesehenen Umfang zugänglich zu machen.',
        '(2) Eine darüber hinausgehende Nutzung, insbesondere die Weitergabe an Dritte gegen Entgelt, das Kopieren oder Nachbauen des Dienstes oder das Entfernen von Kennzeichnungen, ist nicht gestattet.',
        '(3) An Daten, die der Kunde in den Dienst einträgt, erwirbt der Anbieter keine Rechte; er darf sie nur verarbeiten, soweit es für die Leistungserbringung erforderlich ist.',
      ],
    },
    {
      title: '§ 10 Gewährleistung, Haftung',
      blocks: [
        '(1) Der Anbieter stellt den Dienst in dem Zustand bereit, in dem er sich zum Zeitpunkt der Nutzung befindet, und behebt gemeldete Fehler in angemessener Zeit. Der Kunde meldet Mängel unverzüglich in Textform mit einer nachvollziehbaren Beschreibung.',
        '(2) Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit, nach dem Produkthaftungsgesetz sowie im Umfang einer übernommenen Garantie.',
        '(3) Bei leicht fahrlässiger Verletzung einer wesentlichen Vertragspflicht (einer Pflicht, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags überhaupt erst ermöglicht und auf deren Einhaltung der Kunde regelmäßig vertrauen darf) ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt, höchstens jedoch auf die vom Kunden in den zwölf Monaten vor dem schädigenden Ereignis gezahlte Vergütung. Im Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen.',
        '(4) Für den Verlust von Daten haftet der Anbieter nach den vorstehenden Absätzen nur bis zu dem Betrag, der bei ordnungsgemäßer und regelmäßiger Sicherung durch den Kunden (§ 5 Abs. 2) zur Wiederherstellung erforderlich gewesen wäre.',
        '(5) Die verschuldensunabhängige Haftung des Anbieters für anfängliche Mängel nach § 536a Abs. 1 BGB ist ausgeschlossen.',
      ],
    },
    {
      title: '§ 11 Änderungen dieser Bedingungen',
      blocks: [
        'Der Anbieter kann diese Bedingungen mit Wirkung für die Zukunft ändern, wenn dies aus sachlichen Gründen (etwa Änderungen der Rechtslage oder des Dienstes) erforderlich ist und den Kunden nicht unangemessen benachteiligt. Änderungen werden mindestens sechs Wochen vor Wirksamwerden in Textform mitgeteilt. Widerspricht der Kunde nicht bis zum Wirksamwerden, gelten die geänderten Bedingungen als angenommen; auf diese Folge weist der Anbieter in der Mitteilung hin. Widerspricht der Kunde, kann jede Seite den Vertrag zum Wirksamwerden der Änderung kündigen.',
      ],
    },
    {
      title: '§ 12 Schlussbestimmungen',
      blocks: [
        '(1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.',
        '(2) Ausschließlicher Gerichtsstand für alle Streitigkeiten aus diesem Vertrag ist der Sitz des Anbieters, sofern der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist.',
        '(3) Der Anbieter darf diesen Vertrag mit allen Rechten und Pflichten auf ein anderes Unternehmen übertragen, das den Dienst unverändert fortführt, etwa auf einen Rechtsnachfolger oder ein mit dem Anbieter verbundenes Unternehmen. Der Auftragsverarbeitungsvertrag nach § 8 geht dabei mit über; die Daten des Kunden werden nicht zu anderen Zwecken verwendet als bisher. Der Anbieter teilt die Übertragung mindestens sechs Wochen vor Wirksamwerden in Textform mit und nennt dabei das übernehmende Unternehmen. Der Kunde kann den Vertrag in diesem Fall zum Zeitpunkt des Übergangs kündigen; kündigt er nicht, wird das übernehmende Unternehmen mit dem Übergang sein Vertragspartner und der bisherige Anbieter frei.',
        '(4) Erklärungen, für die diese Bedingungen Textform vorsehen, können per E-Mail abgegeben werden.',
        '(5) Sollte eine Bestimmung dieser Bedingungen unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.',
      ],
    },
  ],
}
