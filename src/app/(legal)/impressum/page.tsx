import type { Metadata } from 'next'
import { PROVIDER, providerAddressLines } from '@/lib/provider'
import { Address, List, P, ProviderNotice, Section, Title } from '../ui'

export const metadata: Metadata = {
  title: 'Impressum — RoSe',
  description: 'Anbieterkennzeichnung für RoSe — RoomService.',
}

/**
 * Impressum nach § 5 DDG und § 18 Abs. 2 MStV.
 *
 * Vorlage war das Impressum des Anbieters auf internetinformationsdienste.de —
 * mit drei Korrekturen: Dort steht noch „§ 5 TMG" (das Telemediengesetz ist
 * seit Mai 2024 durch das Digitale-Dienste-Gesetz abgelöst), „§ 55 Abs. 2
 * RStV" (der Rundfunkstaatsvertrag ging im November 2020 im
 * Medienstaatsvertrag auf) und ein Link auf die EU-Plattform zur
 * Online-Streitbeilegung, die am 20.07.2025 abgeschaltet wurde. Der
 * Hinweis zur Verbraucherschlichtung (§ 36 VSBG) bleibt, obwohl RoSe sich
 * nur an Unternehmen richtet — er schadet nicht und deckt den Fall ab, dass
 * doch einmal ein Verbraucher die Seite liest.
 */
export default function ImpressumPage() {
  return (
    <>
      <Title>Impressum</Title>
      <ProviderNotice />

      <Section title="Angaben gemäß § 5 DDG">
        <Address lines={providerAddressLines()} />
        <P>Vertreten durch den Geschäftsführer {PROVIDER.representative}.</P>
      </Section>

      <Section title="Registereintrag">
        <P>
          Eingetragen im Handelsregister des {PROVIDER.registerCourt}, {PROVIDER.register}.
        </P>
      </Section>

      <Section title="Kontakt">
        <List
          items={[
            ...(PROVIDER.phone ? [<>Telefon: {PROVIDER.phone}</>] : []),
            <>E-Mail: {PROVIDER.email}</>,
            <>Website: <a href={PROVIDER.website} className="text-action-strong hover:underline" rel="noopener">{PROVIDER.website.replace(/^https?:\/\//, '')}</a></>,
          ]}
        />
      </Section>

      {PROVIDER.vatId && (
        <Section title="Umsatzsteuer-ID">
          <P>
            Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:{' '}
            {PROVIDER.vatId}
          </P>
        </Section>
      )}

      <Section title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
        <Address lines={[PROVIDER.representative, PROVIDER.street, PROVIDER.zipCity]} />
      </Section>

      <Section title="Dienst">
        <P>
          {PROVIDER.product} wird unter <span className="font-semibold text-ink">{PROVIDER.domain}</span>{' '}
          betrieben. Der Dienst richtet sich ausschließlich an Unternehmen
          (Beherbergungsbetriebe); es gelten die{' '}
          <a href="/agb" className="text-action-strong hover:underline">Allgemeinen Geschäftsbedingungen</a>{' '}
          und die <a href="/datenschutz" className="text-action-strong hover:underline">Datenschutzerklärung</a>.
        </P>
      </Section>

      <Section title="Verbraucherstreitbeilegung">
        <P>
          Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren
          vor einer Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG).
        </P>
      </Section>

      <Section title="Haftung für Inhalte">
        <P>
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf
          diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Wir sind jedoch
          nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
          überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
          Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der
          Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon
          unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt
          der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden
          entsprechender Rechtsverletzungen werden wir diese Inhalte umgehend
          entfernen.
        </P>
      </Section>

      <Section title="Haftung für Links">
        <P>
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte
          wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte
          auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist
          stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die
          verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche
          Rechtsverstöße überprüft; rechtswidrige Inhalte waren zu diesem Zeitpunkt
          nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten
          Seiten ist ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht
          zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige
          Links umgehend entfernen.
        </P>
      </Section>

      <Section title="Urheberrecht">
        <P>
          Die durch den Anbieter erstellten Inhalte und Werke auf diesen Seiten
          unterliegen dem deutschen Urheberrecht. Vervielfältigung, Bearbeitung,
          Verbreitung und jede Art der Verwertung außerhalb der Grenzen des
          Urheberrechts bedürfen der schriftlichen Zustimmung des jeweiligen Autors
          bzw. Erstellers. Soweit Inhalte auf dieser Seite nicht vom Anbieter
          erstellt wurden, werden die Urheberrechte Dritter beachtet und Inhalte
          Dritter als solche gekennzeichnet. Sollten Sie dennoch auf eine
          Urheberrechtsverletzung aufmerksam werden, bitten wir um einen Hinweis.
        </P>
      </Section>
    </>
  )
}
