import type { LegalPage } from './blocks'

/**
 * Nutzungsbedingungen des Housekeeping-Simulators (`/simulator-nutzung`).
 * `{simulatorName}` kommt aus `SIMULATOR_NAME` in `sim-account.ts`.
 */
export const simulatorUse: LegalPage = {
  meta: {
    title: 'Nutzungsbedingungen {simulatorName} – RoSe',
    description: 'Kostenlos, Modellrechnung ohne Zusicherung, keine Verfügbarkeitsgarantie.',
  },
  title: 'Nutzungsbedingungen {simulatorName}',
  sub: 'Für das kostenlose Konto des {simulatorName}.',
  sections: [
    {
      title: '1. Anbieter und Gegenstand',
      blocks: [
        'Den {simulatorName} stellt die {name} bereit (siehe <impressum>Impressum</impressum>). Er rechnet modellhaft nach, wie sich die Koordination der Zimmerreinigung auf ein Haus auswirkt – ohne Steuerung und mit RoSe.',
      ],
    },
    {
      title: '2. Kostenlos, ohne Verpflichtung',
      blocks: [
        {
          list: [
            'Das Konto und die Nutzung des Simulators sind kostenlos. Zahlungsdaten werden nicht erhoben.',
            'Aus dem Konto folgt kein Vertrag über RoSe. Wer RoSe für ein Hotel nutzen will, schließt dafür einen eigenen Vertrag nach den AGB.',
            'Sie können das Konto jederzeit unter „Mein Konto“ löschen.',
          ],
        },
      ],
    },
    {
      title: '3. Modellrechnung, keine Zusicherung',
      blocks: [
        'Die Ergebnisse sind eine <b>Modellrechnung</b> auf Grundlage Ihrer Eingaben und vereinfachender Annahmen, die auf der Seite genannt sind. Sie sind keine Zusicherung, Garantie oder Beschaffenheitsangabe von RoSe und ersetzen keine eigene Planung. Einsparungen an Arbeitszeit werden nur dann zu Geld, wenn die Einsatzplanung entsprechend angepasst wird.',
      ],
    },
    {
      title: '4. Verfügbarkeit und Änderungen',
      blocks: [
        'Wir stellen den Simulator ohne Verfügbarkeitsgarantie bereit und dürfen ihn ändern, einschränken oder einstellen. Gespeicherte Szenarien können sich bei einer Änderung des Rechenmodells anders ausrechnen als zuvor.',
      ],
    },
    {
      title: '5. Haftung',
      blocks: [
        'Da die Nutzung unentgeltlich ist, haften wir nur für Vorsatz und grobe Fahrlässigkeit sowie nach dem Produkthaftungsgesetz und für Schäden aus der Verletzung von Leben, Körper oder Gesundheit.',
      ],
    },
    {
      title: '6. Pflichten der Nutzer',
      blocks: [
        'Bitte registrieren Sie sich nur mit einer eigenen E-Mail-Adresse und nutzen Sie den Simulator nicht automatisiert oder in einer Weise, die den Betrieb stört. Wir dürfen Konten sperren oder löschen, die dagegen verstoßen.',
      ],
    },
    {
      title: '7. Datenschutz und Recht',
      blocks: [
        'Wie wir mit Ihren Daten umgehen, steht in der <simulatorDatenschutz>Datenschutzerklärung</simulatorDatenschutz>, Abschnitt 7. Es gilt deutsches Recht.',
      ],
    },
  ],
}
