import type { LegalPage } from './blocks'

/**
 * Partnerbedingungen (`/partnerbedingungen`, Partnerprogramm, 15.11.2026).
 * ENTWURF — die anwaltliche Prüfung steht wie bei den AGB aus; die
 * Auszahlung (Weg, Mindestbetrag, steuerliche Abwicklung) ist noch nicht
 * geregelt und steht deshalb ausdrücklich als offen im Text.
 *
 * `{partnerRate}` und `{holdDays}` kommen aus `lib/affiliate.ts`. Wer den
 * Wortlaut ändert, zählt `PARTNER_TERMS_VERSION` dort hoch — die Fassung
 * steht an jeder Zustimmung.
 */
export const partnerTerms: LegalPage = {
  meta: {
    title: 'Partnerbedingungen – RoSe',
    description: 'Bedingungen des Partnerprogramms: Zuordnung, Provision, Haltefrist, Pflichten.',
  },
  title: 'Partnerbedingungen',
  sub: 'Für die Teilnahme am Partnerprogramm von RoSe.',
  sections: [
    {
      title: '1. Anbieter und Gegenstand',
      blocks: [
        'Das Partnerprogramm betreibt die {name} (siehe <impressum>Impressum</impressum>). Wer teilnimmt („Partner“), empfiehlt RoSe an Beherbergungsbetriebe und erhält für Kunden, die sich über seine Empfehlung registrieren, eine Provision nach diesen Bedingungen.',
      ],
    },
    {
      title: '2. Teilnahme und Freischaltung',
      blocks: [
        {
          list: [
            'Teilnehmen kann, wer einen Zugang zu RoSe oder ein bestätigtes Konto des {simulatorName} hat. Die Teilnahme beginnt mit der Zustimmung zu diesen Bedingungen im Partnerbereich; ein Anspruch auf Aufnahme besteht nicht.',
            'Solange die Registrierung für RoSe nur auf Einladung offen ist, öffnet der Link eines Partners sie erst, nachdem wir den Partner freigeschaltet haben. Über die Freischaltung entscheiden wir nach eigenem Ermessen.',
            'Der Partner handelt selbständig und in eigenem Namen. Er ist weder Arbeitnehmer noch Vertreter des Anbieters und darf in dessen Namen keine Erklärungen abgeben oder Zusagen machen.',
          ],
        },
      ],
    },
    {
      title: '3. Zuordnung',
      blocks: [
        'Ein Kunde wird dem Partner zugeordnet, wenn bei der Registrierung des Kundenkontos der Code des Partners eingetragen ist – über den Link des Partners oder von Hand. Maßgeblich ist, was bei der Registrierung eingetragen ist; eine nachträgliche Zuordnung findet nicht statt. Der Code wird im Link übertragen; ein Cookie wird dafür nicht gesetzt.',
      ],
    },
    {
      title: '4. Provision',
      blocks: [
        {
          list: [
            'Die Provision beträgt <b>{partnerRate} des Nettobetrags jeder Rechnung</b>, die ein zugeordneter Kunde für RoSe tatsächlich bezahlt hat – solange der Kunde Kunde bleibt und der Partner am Programm teilnimmt.',
            'Für kostenlose Zeiträume und für unbezahlte Rechnungen entsteht keine Provision.',
            'Wird eine Zahlung ganz oder teilweise erstattet oder zurückgebucht, entfällt die Provision im selben Verhältnis. Ist sie bereits gutgeschrieben, wird sie mit späteren Provisionen verrechnet.',
          ],
        },
      ],
    },
    {
      title: '5. Haltefrist und Auszahlung',
      blocks: [
        'Eine Provision ist {holdDays} Tage nach der Zahlung des Kunden vorgemerkt und wird danach verfügbar. Die Frist deckt den Zeitraum ab, in dem Zahlungen zurückgegeben werden können.',
        '<b>Auszahlungen werden derzeit noch nicht durchgeführt.</b> Die Provision wird vom ersten Tag an gesammelt und im Partnerbereich ausgewiesen. Auszahlungsweg, Mindestbetrag und die steuerliche Abwicklung (insbesondere Abrechnung per Gutschrift und Umsatzsteuer) legen wir fest, bevor die erste Auszahlung erfolgt, und teilen sie den Partnern per E-Mail mit. Bis dahin besteht kein Anspruch auf Auszahlung zu einem bestimmten Zeitpunkt.',
        'Für die Versteuerung seiner Provision ist der Partner selbst verantwortlich.',
      ],
    },
    {
      title: '6. Keine Selbstwerbung, kein Missbrauch',
      blocks: [
        {
          list: [
            'Für ein Kundenkonto, das dem Partner selbst gehört oder dem er als Inhaber, Manager oder Mitarbeitender angehört, entsteht keine Provision.',
            'Unzulässig sind insbesondere unverlangte Werbung per E-Mail oder Nachricht, irreführende Aussagen über RoSe, seine Preise oder seinen Leistungsumfang sowie das Vortäuschen von Empfehlungen.',
            'Bei einem Verstoß entfällt die Provision aus den betroffenen Konten; wir dürfen den Partner sperren und die Teilnahme beenden.',
          ],
        },
      ],
    },
    {
      title: '7. Werbung kennzeichnen',
      blocks: [
        'Wer RoSe öffentlich empfiehlt – etwa in sozialen Medien, Videos oder auf einer Website – und dafür eine Provision erhalten kann, kennzeichnet die Empfehlung deutlich als Werbung und hält die dafür geltenden gesetzlichen Vorschriften ein. Aussagen über RoSe beschränken sich auf das, was die Website von RoSe selbst beschreibt.',
      ],
    },
    {
      title: '8. Was der Partner sieht',
      blocks: [
        'Der Partnerbereich zeigt Zahlen: zugeordnete Konten, Zimmerzahl und Provision je Monat – keine Namen der Häuser und keine Inhalte der Konten. Bei wenigen zugeordneten Konten lassen diese Zahlen Rückschlüsse auf ein einzelnes Haus zu. Der Partner behandelt sie vertraulich und nutzt sie nur zur Prüfung seiner Provision.',
      ],
    },
    {
      title: '9. Ende der Teilnahme',
      blocks: [
        {
          list: [
            'Der Partner kann die Teilnahme jederzeit beenden, indem er seinen Zugang löscht oder uns dies mitteilt.',
            'Wir können die Teilnahme mit einer Frist von 30 Tagen beenden, bei einem Verstoß gegen diese Bedingungen auch sofort.',
            'Löscht der Partner seinen Zugang, endet die Teilnahme sofort, und noch nicht ausgezahlte Provision verfällt; der Löschdialog nennt den Betrag vorher.',
            'Beenden wir die Teilnahme ohne Verstoß des Partners, bleibt die bis dahin entstandene Provision bestehen.',
          ],
        },
      ],
    },
    {
      title: '10. Haftung',
      blocks: [
        'Wir haften für Vorsatz und grobe Fahrlässigkeit sowie nach dem Produkthaftungsgesetz und für Schäden aus der Verletzung von Leben, Körper oder Gesundheit. Im Übrigen haften wir nur bei der Verletzung wesentlicher Pflichten und begrenzt auf den vorhersehbaren, typischen Schaden. Für Aussagen und Werbemaßnahmen des Partners haftet dieser selbst.',
      ],
    },
    {
      title: '11. Änderungen, Datenschutz, Recht',
      blocks: [
        'Änderungen dieser Bedingungen kündigen wir mindestens 30 Tage vorher per E-Mail an. Wer nicht einverstanden ist, kann die Teilnahme beenden; die bis dahin entstandene Provision bleibt bestehen.',
        'Wie wir im Partnerprogramm mit Daten umgehen, steht in der <partnerDatenschutz>Datenschutzerklärung</partnerDatenschutz>, Abschnitt 7a. Es gilt deutsches Recht.',
      ],
    },
  ],
}
