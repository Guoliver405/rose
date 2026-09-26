import type { Metadata } from 'next'
import Link from 'next/link'
import { PROVIDER } from '@/lib/provider'
import { SIMULATOR_NAME } from '@/lib/sim-account'
import { List, P, ProviderNotice, Section, Title } from '../ui'

export const metadata: Metadata = {
  title: `Nutzungsbedingungen ${SIMULATOR_NAME} — RoSe`,
  description: 'Kostenlos, Modellrechnung ohne Zusicherung, keine Verfügbarkeitsgarantie.',
}

/**
 * Kurze Nutzungsbedingungen des Housekeeping-Simulators (26.09.2026, Bauplan
 * Abschnitt 4 „Rechtstexte"). Bewusst getrennt von den AGB: Die AGB regeln
 * einen entgeltlichen B2B-Vertrag über den Dienst, der Simulator ist ein
 * kostenloses Werkzeug ohne Leistungsversprechen. Entwurf — die anwaltliche
 * Prüfung steht wie bei den AGB aus.
 */
export default function SimulatorNutzungPage() {
  return (
    <>
      <Title sub={`Für das kostenlose Konto des ${SIMULATOR_NAME}.`}>Nutzungsbedingungen {SIMULATOR_NAME}</Title>
      <ProviderNotice />

      <Section title="1. Anbieter und Gegenstand">
        <P>
          Den {SIMULATOR_NAME} stellt die {PROVIDER.name} bereit (siehe{' '}
          <Link href="/impressum" className="font-semibold text-action-strong hover:underline">Impressum</Link>). Er rechnet
          modellhaft nach, wie sich die Koordination der Zimmerreinigung auf ein Haus auswirkt — ohne
          Steuerung und mit RoSe.
        </P>
      </Section>

      <Section title="2. Kostenlos, ohne Verpflichtung">
        <List
          items={[
            'Das Konto und die Nutzung des Simulators sind kostenlos. Zahlungsdaten werden nicht erhoben.',
            'Aus dem Konto folgt kein Vertrag über RoSe. Wer RoSe für ein Hotel nutzen will, schließt dafür einen eigenen Vertrag nach den AGB.',
            'Sie können das Konto jederzeit unter „Mein Konto“ löschen.',
          ]}
        />
      </Section>

      <Section title="3. Modellrechnung, keine Zusicherung">
        <P>
          Die Ergebnisse sind eine <span className="font-semibold text-ink">Modellrechnung</span> auf Grundlage Ihrer Eingaben
          und vereinfachender Annahmen, die auf der Seite genannt sind. Sie sind keine Zusicherung,
          Garantie oder Beschaffenheitsangabe von RoSe und ersetzen keine eigene Planung. Einsparungen
          an Arbeitszeit werden nur dann zu Geld, wenn die Einsatzplanung entsprechend angepasst wird.
        </P>
      </Section>

      <Section title="4. Verfügbarkeit und Änderungen">
        <P>
          Wir stellen den Simulator ohne Verfügbarkeitsgarantie bereit und dürfen ihn ändern,
          einschränken oder einstellen. Gespeicherte Szenarien können sich bei einer Änderung des
          Rechenmodells anders ausrechnen als zuvor.
        </P>
      </Section>

      <Section title="5. Haftung">
        <P>
          Da die Nutzung unentgeltlich ist, haften wir nur für Vorsatz und grobe Fahrlässigkeit sowie
          nach dem Produkthaftungsgesetz und für Schäden aus der Verletzung von Leben, Körper oder
          Gesundheit.
        </P>
      </Section>

      <Section title="6. Pflichten der Nutzer">
        <P>
          Bitte registrieren Sie sich nur mit einer eigenen E-Mail-Adresse und nutzen Sie den
          Simulator nicht automatisiert oder in einer Weise, die den Betrieb stört. Wir dürfen Konten
          sperren oder löschen, die dagegen verstoßen.
        </P>
      </Section>

      <Section title="7. Datenschutz und Recht">
        <P>
          Wie wir mit Ihren Daten umgehen, steht in der{' '}
          <Link href="/datenschutz#simulator" className="font-semibold text-action-strong hover:underline">Datenschutzerklärung</Link>,
          Abschnitt 7. Es gilt deutsches Recht.
        </P>
      </Section>
    </>
  )
}
