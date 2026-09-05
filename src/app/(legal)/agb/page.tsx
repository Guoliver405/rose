import type { Metadata } from 'next'
import { formatCents } from '@/lib/money'
import { FREE_MONTHS, MIN_MONTHLY_CENTS, PRICE_PER_ROOM_CENTS } from '@/lib/pricing'
import { PROVIDER } from '@/lib/provider'
import { List, P, ProviderNotice, Section, Title } from '../ui'

export const metadata: Metadata = {
  title: 'AGB — RoSe',
  description: 'Allgemeine Geschäftsbedingungen für die Nutzung von RoSe — RoomService.',
}

/**
 * AGB für einen B2B-Software-Dienst mit monatlicher Laufzeit.
 *
 * Kein Vorbild vom Anbieter (die AGB-Seite auf internetinformationsdienste.de
 * liefert 404), deshalb von Grund auf für RoSe geschrieben. Die Preise kommen
 * aus `pricing.ts`, damit AGB und Landing Page nie auseinanderlaufen. Die
 * Zählregel („auch nur vorübergehend in Betrieb = zählt") ist dieselbe wie in
 * `countBillableRooms`; die Kündigungsregel folgt daraus: monatlich, zum
 * Monatsende, und das Löschen des Kontos ist zugleich die Kündigung.
 */
export default function AgbPage() {
  const preisZimmer = formatCents(PRICE_PER_ROOM_CENTS)
  const mindest = formatCents(MIN_MONTHLY_CENTS)

  return (
    <>
      <Title sub="Für die Nutzung von RoSe — RoomService durch Beherbergungsbetriebe.">
        Allgemeine Geschäftsbedingungen
      </Title>
      <ProviderNotice />

      <Section title="§ 1 Geltungsbereich, Anbieter">
        <P>
          (1) Diese Bedingungen gelten für alle Verträge über die Nutzung des Software-Dienstes
          „RoSe — RoomService“ (nachfolgend „RoSe“ oder „der Dienst“) zwischen{' '}
          {PROVIDER.name}, {PROVIDER.owner}, {PROVIDER.street}, {PROVIDER.zipCity}{' '}
          (nachfolgend „Anbieter“) und dem Kunden.
        </P>
        <P>
          (2) Der Dienst richtet sich ausschließlich an Unternehmer im Sinne von § 14 BGB,
          insbesondere Beherbergungsbetriebe. Mit Verbrauchern wird kein Vertrag geschlossen.
        </P>
        <P>
          (3) Abweichende oder ergänzende Bedingungen des Kunden werden nicht Vertragsbestandteil,
          auch wenn der Anbieter ihnen nicht ausdrücklich widerspricht.
        </P>
      </Section>

      <Section title="§ 2 Leistungsgegenstand">
        <P>
          (1) RoSe ist ein über das Internet bereitgestellter Dienst (Software as a Service) mit
          drei Oberflächen: ein Verwaltungsportal für Rezeption und Management (Check-in und
          Check-out, Zimmerstatus, Prioritäten, Service-Anfragen, Auswertung), ein Reinigungsboard
          für das Housekeeping und ein Gäste-Portal, über das Gäste Reinigungswünsche, „Bitte
          nicht stören“ und Service-Bestellungen absetzen. Der aktuelle Funktionsumfang ergibt
          sich aus der Beschreibung auf der Website des Dienstes.
        </P>
        <P>
          (2) RoSe ist kein Buchungs-, Kassen- oder Hotelverwaltungssystem (PMS) und übernimmt
          keine Zahlungsabwicklung gegenüber Gästen. Preise, die der Kunde im Service-Baukasten
          hinterlegt, sind reine Anzeigeinformation; die Abrechnung gegenüber dem Gast obliegt
          allein dem Kunden.
        </P>
        <P>
          (3) Der Anbieter entwickelt den Dienst fortlaufend weiter und darf Funktionen ändern,
          ergänzen oder entfernen, soweit der Kern der Leistung nach Absatz 1 erhalten bleibt und
          die Änderung für den Kunden zumutbar ist. Über wesentliche Änderungen informiert der
          Anbieter in Textform.
        </P>
      </Section>

      <Section title="§ 3 Vertragsschluss, Konto">
        <P>
          (1) Der Vertrag kommt mit Abschluss der Registrierung zustande, mit der der Kunde ein
          Konto und sein erstes Haus anlegt. Während der Testphase kann die Registrierung einen
          Einladungscode voraussetzen; ein Anspruch auf einen Code besteht nicht.
        </P>
        <P>
          (2) Der Kunde stellt sicher, dass die bei der Registrierung gemachten Angaben richtig
          sind und hält sie aktuell. Die Person, die das Konto anlegt, versichert, zum
          Vertragsschluss für den Kunden berechtigt zu sein.
        </P>
        <P>
          (3) Der Kunde kann innerhalb seines Kontos weitere Häuser anlegen sowie Zugänge für
          Manager, Rezeption und Reinigungskräfte einrichten. Er ist für alle Handlungen
          verantwortlich, die über Zugänge seines Kontos vorgenommen werden, und hält Zugangsdaten
          geheim. Bei Verdacht auf Missbrauch beendet er die betroffenen Zugänge unverzüglich
          (Funktion „Zugang beenden“).
        </P>
      </Section>

      <Section title="§ 4 Verfügbarkeit, Wartung, Support">
        <P>
          (1) Der Anbieter bemüht sich um eine ununterbrochene Verfügbarkeit des Dienstes, schuldet
          jedoch keine bestimmte Verfügbarkeitsquote. Wartungsarbeiten kündigt der Anbieter nach
          Möglichkeit vorab an und legt sie in verkehrsarme Zeiten.
        </P>
        <P>
          (2) Ausfälle, die auf Umständen außerhalb des Einflussbereichs des Anbieters beruhen
          (insbesondere Störungen des Internets, höhere Gewalt, Ausfälle der eingesetzten
          Rechenzentrums- oder Mail-Dienstleister), hat der Anbieter nicht zu vertreten.
        </P>
        <P>
          (3) Support erfolgt per E-Mail an {PROVIDER.email} zu üblichen Geschäftszeiten. Eine
          Reaktionszeit wird nicht zugesichert.
        </P>
      </Section>

      <Section title="§ 5 Pflichten des Kunden">
        <P>(1) Der Kunde nutzt den Dienst nur im Rahmen der Gesetze und dieser Bedingungen. Insbesondere</P>
        <List
          items={[
            'trägt er keine rechtswidrigen Inhalte ein und verwendet den Dienst nicht, um Dritte zu belästigen oder zu täuschen;',
            'informiert er seine Mitarbeitenden und Gäste in geeigneter Weise über die Verarbeitung ihrer Daten in RoSe (siehe § 8) und stellt die dafür nötigen Hinweise bereit, etwa auf dem Check-in-Handout;',
            'legt er keine personenbezogenen Daten an Stellen ab, die dafür nicht vorgesehen sind (z. B. Namen oder Ausweisdaten in Zimmer- oder Service-Bezeichnungen);',
            'greift er nicht auf Daten anderer Kunden zu und unternimmt keine Versuche, Zugangsbeschränkungen oder Drosselungen zu umgehen;',
            'unterlässt er automatisierte Massenzugriffe, die den Betrieb beeinträchtigen.',
          ]}
        />
        <P>
          (2) Der Kunde sichert Daten, die er über den Dienst hinaus benötigt (etwa Auswertungen
          für die Lohnabrechnung), rechtzeitig durch Export oder Ausdruck. Nach Vertragsende
          stehen sie nicht mehr zur Verfügung (§ 7 Abs. 4).
        </P>
        <P>
          (3) Bei schwerwiegenden oder wiederholten Verstößen darf der Anbieter das Konto nach
          vorheriger Abmahnung sperren, bei Gefahr im Verzug auch ohne. Das Recht zur
          außerordentlichen Kündigung bleibt unberührt.
        </P>
      </Section>

      <Section title="§ 6 Preise, Abrechnung, Zahlung">
        <P>
          (1) Die Vergütung beträgt <span className="font-semibold text-ink">{preisZimmer} je Zimmer und
          Kalendermonat</span>, mindestens jedoch <span className="font-semibold text-ink">{mindest} je Konto und
          Kalendermonat</span>, sobald mindestens ein Zimmer abrechenbar ist. Alle Preise verstehen
          sich netto zuzüglich der gesetzlichen Umsatzsteuer.
        </P>
        <P>
          (2) Abrechenbar ist jedes Zimmer, das im Kalendermonat — auch nur vorübergehend — in
          Betrieb war. Ein Zimmer, das den gesamten Monat über außer Betrieb war oder erst nach
          Monatsende angelegt wurde, zählt nicht. Maßgeblich ist die Zählung des Dienstes, die
          der Kunde jederzeit in seinem Konto einsehen kann; für abgeschlossene Monate wird sie
          festgeschrieben.
        </P>
        <P>
          (3) Der Kalendermonat, in dem das Konto angelegt wird, ist kostenfrei
          {FREE_MONTHS > 1 ? ` (insgesamt ${FREE_MONTHS} Kalendermonate)` : ''}. Die Berechnung
          beginnt mit dem darauf folgenden Kalendermonat.
        </P>
        <P>
          (4) Die Abrechnung erfolgt monatlich nachträglich. Rechnungen werden elektronisch
          bereitgestellt und sind innerhalb von 14 Tagen ohne Abzug fällig. Solange kein
          Zahlungsverfahren eingerichtet ist, stellt der Anbieter keine Rechnung; der Kunde
          wird vor der ersten Berechnung in Textform informiert.
        </P>
        <P>
          (5) Der Anbieter darf die Preise mit einer Ankündigungsfrist von sechs Wochen zum
          Monatsende ändern. Der Kunde kann in diesem Fall bis zum Wirksamwerden der Änderung
          außerordentlich zum Änderungszeitpunkt kündigen; hierauf weist der Anbieter in der
          Ankündigung hin.
        </P>
        <P>
          (6) Bei Zahlungsverzug von mehr als 30 Tagen darf der Anbieter den Zugang nach
          Mahnung mit angemessener Frist sperren; die Vergütung bleibt geschuldet.
        </P>
      </Section>

      <Section title="§ 7 Laufzeit, Kündigung, Vertragsende">
        <P>
          (1) Der Vertrag läuft auf unbestimmte Zeit und kann von beiden Seiten jederzeit zum
          Ende eines Kalendermonats gekündigt werden. Der Kunde kündigt, indem er sein Konto im
          Verwaltungsportal löscht (Bereich „Daten löschen“) oder in Textform gegenüber dem
          Anbieter; der Anbieter kündigt in Textform.
        </P>
        <P>
          (2) Für den Monat, in dem das Konto gelöscht wird, bleibt die Vergütung nach § 6
          geschuldet.
        </P>
        <P>
          (3) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
        </P>
        <P>
          (4) Mit der Löschung des Kontos werden alle Daten des Kunden gelöscht — einschließlich
          der Aufzeichnungen, die der Dienst sonst als Nachweis erhält (Zimmer-Verlauf,
          Tätigkeitsnachweise, Abrechnungsbelege) — sowie die Anmeldekonten der zugehörigen
          Personen, soweit sie nicht in einem anderen Konto benötigt werden. Rechnungsdaten
          bewahrt der Anbieter im Rahmen der gesetzlichen Fristen auf.
        </P>
      </Section>

      <Section title="§ 8 Datenschutz, Auftragsverarbeitung">
        <P>
          (1) Soweit der Kunde über den Dienst personenbezogene Daten verarbeitet (Gäste-Aufenthalte,
          Service-Anfragen, Personal, Tätigkeitsnachweise), ist er Verantwortlicher im Sinne der
          DSGVO und der Anbieter sein Auftragsverarbeiter. Die Parteien schließen hierzu einen
          Auftragsverarbeitungsvertrag nach Art. 28 DSGVO, der Bestandteil dieses Vertrags ist
          und vom Anbieter bereitgestellt wird.
        </P>
        <P>
          (2) Der Anbieter setzt als Unterauftragsverarbeiter Dienstleister für Datenbank und
          Anmeldung (Supabase), Hosting (Vercel) und E-Mail-Versand (Resend) ein; Einzelheiten
          und Speicherorte nennt die{' '}
          <a href="/datenschutz" className="text-action-strong hover:underline">Datenschutzerklärung</a>.
          Über Wechsel informiert der Anbieter vorab; der Kunde kann aus wichtigem Grund
          widersprechen.
        </P>
        <P>
          (3) Der Dienst ist so gestaltet, dass Gäste anonym bleiben (kein Name, keine
          Kontaktdaten). Der Kunde ist dafür verantwortlich, diese Gestaltung nicht durch eigene
          Eintragungen zu unterlaufen.
        </P>
      </Section>

      <Section title="§ 9 Nutzungsrechte">
        <P>
          (1) Der Kunde erhält für die Vertragslaufzeit das einfache, nicht übertragbare Recht,
          den Dienst für den eigenen Betrieb zu nutzen und seinen Mitarbeitenden und Gästen im
          vorgesehenen Umfang zugänglich zu machen.
        </P>
        <P>
          (2) Eine darüber hinausgehende Nutzung, insbesondere die Weitergabe an Dritte gegen
          Entgelt, das Kopieren oder Nachbauen des Dienstes oder das Entfernen von
          Kennzeichnungen, ist nicht gestattet.
        </P>
        <P>
          (3) An Daten, die der Kunde in den Dienst einträgt, erwirbt der Anbieter keine Rechte;
          er darf sie nur verarbeiten, soweit es für die Leistungserbringung erforderlich ist.
        </P>
      </Section>

      <Section title="§ 10 Gewährleistung, Haftung">
        <P>
          (1) Der Anbieter stellt den Dienst in dem Zustand bereit, in dem er sich zum Zeitpunkt
          der Nutzung befindet, und behebt gemeldete Fehler in angemessener Zeit. Der Kunde meldet
          Mängel unverzüglich in Textform mit einer nachvollziehbaren Beschreibung.
        </P>
        <P>
          (2) Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei
          Verletzung von Leben, Körper oder Gesundheit, nach dem Produkthaftungsgesetz sowie im
          Umfang einer übernommenen Garantie.
        </P>
        <P>
          (3) Bei leicht fahrlässiger Verletzung einer wesentlichen Vertragspflicht (einer Pflicht,
          deren Erfüllung die ordnungsgemäße Durchführung des Vertrags überhaupt erst ermöglicht
          und auf deren Einhaltung der Kunde regelmäßig vertrauen darf) ist die Haftung auf den
          vertragstypischen, vorhersehbaren Schaden begrenzt, höchstens jedoch auf die vom Kunden
          in den zwölf Monaten vor dem schädigenden Ereignis gezahlte Vergütung. Im Übrigen ist
          die Haftung für leichte Fahrlässigkeit ausgeschlossen.
        </P>
        <P>
          (4) Für den Verlust von Daten haftet der Anbieter nach den vorstehenden Absätzen nur
          bis zu dem Betrag, der bei ordnungsgemäßer und regelmäßiger Sicherung durch den Kunden
          (§ 5 Abs. 2) zur Wiederherstellung erforderlich gewesen wäre.
        </P>
        <P>
          (5) Die verschuldensunabhängige Haftung des Anbieters für anfängliche Mängel nach § 536a
          Abs. 1 BGB ist ausgeschlossen.
        </P>
      </Section>

      <Section title="§ 11 Änderungen dieser Bedingungen">
        <P>
          Der Anbieter kann diese Bedingungen mit Wirkung für die Zukunft ändern, wenn dies aus
          sachlichen Gründen (etwa Änderungen der Rechtslage oder des Dienstes) erforderlich ist
          und den Kunden nicht unangemessen benachteiligt. Änderungen werden mindestens sechs
          Wochen vor Wirksamwerden in Textform mitgeteilt. Widerspricht der Kunde nicht bis zum
          Wirksamwerden, gelten die geänderten Bedingungen als angenommen; auf diese Folge weist
          der Anbieter in der Mitteilung hin. Widerspricht der Kunde, kann jede Seite den Vertrag
          zum Wirksamwerden der Änderung kündigen.
        </P>
      </Section>

      <Section title="§ 12 Schlussbestimmungen">
        <P>
          (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
        </P>
        <P>
          (2) Ausschließlicher Gerichtsstand für alle Streitigkeiten aus diesem Vertrag ist der
          Sitz des Anbieters, sofern der Kunde Kaufmann, juristische Person des öffentlichen
          Rechts oder öffentlich-rechtliches Sondervermögen ist.
        </P>
        <P>
          (3) Erklärungen, für die diese Bedingungen Textform vorsehen, können per E-Mail
          abgegeben werden.
        </P>
        <P>
          (4) Sollte eine Bestimmung dieser Bedingungen unwirksam sein oder werden, bleibt die
          Wirksamkeit der übrigen Bestimmungen unberührt.
        </P>
      </Section>
    </>
  )
}
