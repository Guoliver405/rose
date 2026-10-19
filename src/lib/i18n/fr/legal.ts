import type { Shape } from '../format'
import type { LegalMessages } from '../de/legal'

/**
 * Cadre commun des pages juridiques en français — uniquement ce qui apparaît
 * en dehors d’elles (pied de page `LegalFooter`). Les textes juridiques restent
 * en allemand ; le pied de page l’indique.
 */
export const legalCommon = {
  homeLabel: 'RoSe – accueil',
  nav: {
    impressum: 'Mentions légales (en allemand)',
    datenschutz: 'Politique de confidentialité (en allemand)',
    agb: 'Conditions générales (en allemand)',
  },
  copyright: '© {year} {name}',
  version: 'Version : {version}',
  providerIncomplete:
    'Ces informations sont encore incomplètes — les champs marqués […] seront complétés par le prestataire ({fields}).',
} satisfies Shape<LegalMessages['common']>
