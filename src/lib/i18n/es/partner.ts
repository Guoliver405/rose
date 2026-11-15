import type { Shape } from '../format'
import type { PartnerMessages } from '../de/partner'

/** Programa de socios: español europeo, neutro, de usted. Lectores: propietarios, gerentes, recepción, cuentas del simulador. */
export const partner = {
  metaTitle: 'Programa de socios – RoSe',

  header: {
    title: 'Programa de socios',
    backHouses: 'Establecimientos',
    backHouse: 'Al resumen',
    backSimulator: 'Simulador',
    signOut: 'Cerrar sesión',
  },

  entry: {
    title: 'Programa de socios',
    text: 'Recomiende RoSe y reciba una parte de cada factura pagada.',
    open: 'Abrir',
  },

  join: {
    title: 'Recomiende RoSe y gane con ello',
    intro: 'Recomiende RoSe a los establecimientos que conoce. Por cada establecimiento que se registre a través de su enlace, recibirá el {rate} de cada factura pagada, de forma permanente, mientras el establecimiento siga siendo cliente.',
    points: [
      'Su enlace personal y un código QR para compartir',
      'Comisión por cada factura pagada, sin límite de tiempo',
      'Un resumen de las cuentas recomendadas y de su comisión',
    ],
    payoutNote: 'Los pagos llegarán en un paso posterior. Su comisión se acumula desde el primer día.',
    terms: 'He leído las <terms>condiciones del programa de socios</terms> y las acepto.',
    submit: 'Hacerse socio',
    submitting: 'Creando …',
  },

  link: {
    title: 'Su enlace',
    text: 'Quien se registre a través de este enlace quedará asignado a usted. El código también puede introducirse a mano en «Recomendado por» durante el registro.',
    linkLabel: 'Enlace',
    codeLabel: 'Código',
    copy: 'Copiar',
    copied: 'Copiado',
    qrAlt: 'Código QR con su enlace de socio',
    qrHint: 'Para imprimir o compartir: clic derecho o pulsación larga sobre el código QR y, después, guardar.',
  },

  notApproved: {
    title: 'Aún sin aprobar',
    text: 'Por ahora, el registro solo está abierto con invitación. Su enlace ya asigna los registros, pero solo abre el registro cuando le hayamos aprobado. Para ello, escríbanos a {email}.',
  },

  stats: {
    title: 'Sus cifras',
    accounts: 'Cuentas recomendadas',
    accountsPaying: 'de ellas, {count} con una factura pagada',
    rooms: 'Habitaciones',
    roomsHint: 'facturadas para {month}',
    roomsNone: 'aún sin facturación',
    pending: 'Pendiente',
    pendingHint: 'se libera {days} días después del pago',
    available: 'Disponible',
    availableHint: 'los pagos llegarán más adelante',
    reversed: 'Anulado',
    reversedHint: 'tras un reembolso o una devolución',
    privacy: 'Usted ve cifras, no los nombres de los establecimientos recomendados.',
  },

  months: {
    title: 'Comisión por mes',
    month: 'Mes de servicio',
    amount: 'Comisión',
    pending: 'de ello, pendiente',
    reversed: 'anulado',
    empty: 'Aún no hay comisión. Se genera en cuanto un establecimiento recomendado haya pagado su primera factura.',
  },

  errors: {
    signInAgain: 'Vuelva a iniciar sesión.',
    notEligible: 'Con esta cuenta no puede hacerse socio.',
    termsMissing: 'Acepte las condiciones del programa de socios.',
    failed: 'No ha funcionado. Inténtelo de nuevo.',
  },
} satisfies Shape<PartnerMessages>
