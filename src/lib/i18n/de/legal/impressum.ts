import type { LegalPage } from './blocks'

/**
 * Impressum nach § 5 DDG und § 18 Abs. 2 MStV. Anbieter-Daten über
 * Platzhalter aus `provider.ts`. Warum § 5 DDG statt TMG usw.: siehe Kommentar
 * in `src/app/(legal)/impressum/page.tsx`.
 */
export const impressum: LegalPage = {
  meta: {
    title: 'Impressum – RoSe',
    description: 'Anbieterkennzeichnung für RoSe – RoomService.',
  },
  title: 'Impressum',
  sections: [
    {
      title: 'Angaben gemäß § 5 DDG',
      blocks: [
        { address: 'provider' },
        'Vertreten durch den Geschäftsführer {representative}.',
      ],
    },
    {
      title: 'Registereintrag',
      blocks: ['Eingetragen im Handelsregister des {registerCourt}, {register}.'],
    },
    {
      title: 'Kontakt',
      blocks: [
        {
          list: [
            { text: 'Telefon: {phone}', when: 'phone' },
            'E-Mail: {email}',
            'Website: <website>{websiteLabel}</website>',
          ],
        },
      ],
    },
    {
      title: 'Umsatzsteuer-ID',
      when: 'vatId',
      blocks: ['Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: {vatId}'],
    },
    {
      title: 'Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV',
      blocks: [{ address: 'responsible' }],
    },
    {
      title: 'Dienst',
      blocks: [
        '{product} wird unter <b>{domain}</b> betrieben. Der Dienst richtet sich ausschließlich an Unternehmen (Beherbergungsbetriebe); es gelten die <agb>Allgemeinen Geschäftsbedingungen</agb> und die <datenschutz>Datenschutzerklärung</datenschutz>.',
      ],
    },
    {
      title: 'Verbraucherstreitbeilegung',
      blocks: [
        'Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG).',
      ],
    },
    {
      title: 'Haftung für Inhalte',
      blocks: [
        'Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden entsprechender Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.',
      ],
    },
    {
      title: 'Haftung für Links',
      blocks: [
        'Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft; rechtswidrige Inhalte waren zu diesem Zeitpunkt nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.',
      ],
    },
    {
      title: 'Urheberrecht',
      blocks: [
        'Die durch den Anbieter erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Soweit Inhalte auf dieser Seite nicht vom Anbieter erstellt wurden, werden die Urheberrechte Dritter beachtet und Inhalte Dritter als solche gekennzeichnet. Sollten Sie dennoch auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen Hinweis.',
      ],
    },
  ],
}
