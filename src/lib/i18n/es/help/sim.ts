import type { Shape } from '../../format'
import type { SimMessages } from '../../de/help/sim'

/**
 * Ayuda: simulaciones del panel de limpieza y del portal de huéspedes. Los botones
 * y las líneas de estado vienen de `service.ts` y `guest.ts`; aquí solo lo que los
 * portales reales no tienen: cabecera de página, explicaciones, valores de ejemplo. Español.
 */
export const sim = {
  house: 'Casa Vista Alpina',

  frame: {
    badge: 'Simulación',
  },

  reinigung: {
    page: {
      title: 'El panel de limpieza',
      intro:
        'Este es el panel que su personal de limpieza usa en el móvil. Es una simulación con habitaciones de ejemplo; no se guarda nada y no se avisa a nadie. Pruébelo todo con tranquilidad. La guía restablece la vista adecuada en cada paso.',
      why:
        '¿Por qué una simulación y no un recorrido por el panel real? El panel de limpieza tiene su propio inicio de sesión y su propia sesión, por lo que no es accesible desde la recepción. Para ver el panel real, inicie sesión en <code>{path}</code> con la cuenta de una persona de limpieza.',
    },
    frame: {
      login: 'Limpieza: inicio de sesión',
      status: 'Limpieza: mi estado',
    },
    scanCard: 'Escanear la tarjeta de acceso',
    or: 'o',
    withinShift: 'Las pausas y la otra limpieza tienen lugar dentro del turno.',
    nothingToDo: 'nada que hacer',
    noTask: 'No hay ninguna limpieza abierta para esta habitación: no está bloqueada, simplemente ahora no hay nada que hacer.',
  },

  gast: {
    page: {
      title: 'Lo que ve el huésped',
      intro:
        'Así se ve el portal de huéspedes en el móvil de un huésped. Es una simulación con datos de ejemplo; el establecimiento, la habitación y los servicios no proceden de sus datos, de modo que la pantalla muestra algo incluso antes de terminar la configuración. No se guarda nada.',
      differs:
        'En su caso hay dos diferencias: los servicios que aparecen se configuran en el catálogo de servicios, y si se ofrece «No antes de» (con su hora límite) se ajusta en Establecimiento y normas.',
    },
    frame: {
      portal: 'Portal de huéspedes: móvil',
    },
    scanned: 'Cartel de habitación escaneado: ahora solo falta el PIN de la hoja de check-in.',
    otherMode: 'Con el otro método, este paso no existe: el enlace personal abre directamente el portal de huéspedes.',
    onlyDaily: 'Este botón solo existe en establecimientos con limpieza diaria.',
    services: {
      towels: { name: 'Toallas adicionales', meta: 'gratuito' },
      breakfast: { name: 'Desayuno en la habitación', meta: '14,50 €' },
      technician: { name: 'Servicio técnico', meta: 'urgente' },
    },
    requested: 'solicitado',
    openRequests: {
      one: 'Hay una solicitud abierta; la recepción se está ocupando.',
      other: 'Hay {count} solicitudes abiertas; la recepción se está ocupando.',
    },
    noRequests: 'No hay solicitudes abiertas. El acceso caduca por sí solo con el check-out.',
  },
} satisfies Shape<SimMessages>
