import type { Shape } from '../format'
import type { SymbolsMessages } from '../de/symbols'

/** Símbolos de las fichas de habitación: etiquetas y textos de leyenda para la ayuda. Español. */
export const symbols = {
  symbols: {
    deactivated: {
      label: 'Fuera de servicio',
      text: 'En esta habitación no se puede hacer check-in y no aparece en ningún panel de limpieza. Su historial se conserva; puede volver a ponerla en servicio en Habitaciones y plantas.',
    },
    occupied: {
      label: 'Ocupada',
      text: 'Hay una estancia en curso. El huésped tiene un PIN o un enlace y, en el portal, puede solicitar la limpieza, activar «No molestar» y solicitar servicios.',
    },
    departure: {
      label: 'Salida hoy',
      text: 'La fecha de salida indicada en el check-in o más tarde es hoy. Ese día no hay limpieza diaria: la habitación se limpia después del check-out.',
    },
    dnd: {
      label: 'No molestar',
      text: 'El huésped lo ha activado en el portal. Nadie llama a la puerta, no hay limpieza diaria y la habitación aparece en gris en el panel de limpieza. Solo el huésped puede desactivarlo.',
    },
    clean: {
      label: 'El huésped solicita limpieza',
      text: 'Un toque en el portal hace que la habitación aparezca como abierta en el panel de limpieza, sin cita. El equipo de limpieza la limpia cuando encaja en su ronda.',
    },
    deferred: {
      label: 'Limpieza a partir de HH:MM',
      text: 'El huésped eligió una hora en la solicitud de limpieza o pidió en la puerta a la persona de limpieza que volviera más tarde. Hasta entonces, la habitación no está abierta para nadie del equipo. Se abre sola a la hora indicada.',
    },
    declined: {
      label: 'Hoy sin limpieza',
      text: 'El huésped renuncia a la limpieza de hoy, con el botón del portal o diciéndolo en la puerta a la persona de limpieza. La limpieza diaria de hoy no se hace y no cuenta como limpieza realizada; mañana se reanuda. Si el huésped pulsa después «Limpiar mi habitación», la habitación se abre de inmediato.',
    },
    routine: {
      label: 'Limpieza diaria pendiente',
      text: 'Solo si el establecimiento limpia a diario las habitaciones ocupadas (en Establecimiento y normas): la limpieza se abre a partir de la segunda noche, a la hora configurada. Sin fecha de salida, no antes de la hora límite del check-out. Solo si la habitación no se ha limpiado hoy y «No molestar» no está activado.',
    },
    checkout: {
      label: 'Check-out hecho: limpieza pendiente',
      text: 'El huésped ha hecho el check-out y la habitación aún no se ha limpiado. Sigue abierta hasta que una persona de limpieza termine o la recepción marque la limpieza como hecha.',
    },
    priority: {
      label: 'Prioritaria',
      text: 'La recepción la marca a mano en caso de reclamaciones o casos especiales. La habitación sube en el panel de limpieza y la planta muestra un indicador violeta. Nunca es automático.',
    },
    cleaning: {
      label: 'Limpieza en curso',
      text: 'Una persona de limpieza ha deslizado el control de inicio y su nombre aparece en la habitación. Si olvida terminar, la habitación vuelve a abrirse sola al superarse el tiempo límite.',
    },
    orders: {
      label: 'Solicitud de servicio abierta',
      text: 'El huésped ha hecho una solicitud que aún no se ha marcado como hecha. Las solicitudes están en «Solicitudes» en la navegación; márquelas como hechas allí o en el diálogo de la habitación.',
    },
    urgent: {
      label: 'Solicitud de servicio urgente',
      text: 'Al menos una solicitud abierta corresponde a un servicio marcado como «urgente» en el catálogo de servicios. La campana, el anillo y el contador de la navegación parpadean en rojo hasta que la solicitud se marca como hecha.',
    },
  },
  bars: {
    priority: {
      label: 'Prioritaria',
      text: 'Se impone a todos los demás estados. Mientras la prioridad esté activa, la barra sigue en violeta, incluso después del check-out.',
    },
    working: {
      label: 'En curso',
      text: 'Solo en el panel de limpieza: alguien del equipo está en la habitación. En la pantalla de recepción solo lo indica el icono giratorio; la barra conserva su color.',
    },
    checkout: {
      label: 'Check-out hecho',
      text: 'Limpieza tras el check-out pendiente.',
    },
    wanted: {
      label: 'Limpieza solicitada o limpieza diaria pendiente',
      text: 'El huésped ha solicitado limpieza o toca la limpieza diaria del establecimiento. Una solicitud aplazada («a partir de HH:MM») solo cambia el color de la barra a la hora indicada.',
    },
    dnd: {
      label: '«No molestar»',
      text: 'Ocupada, y el huésped no quiere que le molesten.',
    },
    occupied: {
      label: 'Ocupada',
      text: 'Estancia en curso, nada que hacer.',
    },
    ready: {
      label: 'Libre y lista',
      text: 'Libre y limpia: el check-in es un clic.',
    },
    neutral: {
      label: 'Sin tarea',
      text: 'Solo en el panel de limpieza: libre, ocupada sin solicitud, «No molestar» o solicitud prevista para más tarde. La habitación sigue visible pero en gris; no está bloqueada.',
    },
    deactivated: {
      label: 'Fuera de servicio',
      text: 'Borde discontinuo, ficha atenuada. No se puede hacer check-in.',
    },
  },
  rings: {
    urgent: {
      label: 'Borde rojo parpadeante',
      text: 'Solicitud de servicio urgente. Se impone al anillo violeta; la prioridad sigue visible por la barra y la bandera.',
    },
    priority: {
      label: 'Borde violeta parpadeante',
      text: 'Limpieza prioritaria, mientras no haya una solicitud urgente.',
    },
  },
} satisfies Shape<SymbolsMessages>
