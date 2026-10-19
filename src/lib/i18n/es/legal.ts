import type { Shape } from '../format'
import type { LegalMessages } from '../de/legal'

/**
 * Marco común de las páginas legales en español: solo lo que aparece fuera de
 * ellas (pie de página `LegalFooter`). Los textos legales siguen en alemán; el
 * pie de página lo indica.
 */
export const legalCommon = {
  homeLabel: 'RoSe – inicio',
  nav: {
    impressum: 'Aviso legal (en alemán)',
    datenschutz: 'Política de privacidad (en alemán)',
    agb: 'Condiciones generales (en alemán)',
  },
  copyright: '© {year} {name}',
  version: 'Versión: {version}',
  providerIncomplete:
    'Estos datos aún están incompletos: el proveedor completará los campos marcados con […] ({fields}).',
} satisfies Shape<LegalMessages['common']>
