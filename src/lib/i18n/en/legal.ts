import type { Shape } from '../format'
import type { LegalMessages } from '../de/legal'

/**
 * Shared frame of the legal pages in English — only what appears outside them
 * (footer `LegalFooter`). The legal texts themselves stay German until the
 * lawyer's review; the footer says so.
 */
export const legalCommon = {
  homeLabel: 'RoSe – home',
  nav: {
    impressum: 'Legal notice (German)',
    datenschutz: 'Privacy policy (German)',
    agb: 'Terms (German)',
  },
  copyright: '© {year} {name}',
  version: 'As of: {version}',
  providerIncomplete:
    'This information is still incomplete — the fields marked […] will be added by the provider ({fields}).',
} satisfies Shape<LegalMessages['common']>
