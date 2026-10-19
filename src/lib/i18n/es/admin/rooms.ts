import type { Shape } from '../../format'
import type { rooms as de } from '../../de/admin/rooms'

/** Recepción — configuración de habitaciones: crear, editar y eliminar habitaciones, plantas y edificios. Español. */
export const rooms = {
  page: {
    title: 'Gestionar habitaciones',
  },

  create: {
    heading: 'Añadir habitaciones',
    modeAria: 'Modo de creación',
    modeIndividual: 'Plantas una a una',
    modeIdentical: 'Plantas idénticas',
    modeIndividualHint: 'Los números de habitación se aplican a la planta indicada.',
    modeIdenticalHint: 'Se crea el mismo rango de números en cada planta indicada.',
    buildingLabel: 'Edificio (opcional)',
    buildingPlaceholder: 'p. ej. Edificio principal',
    floorLabel: 'Planta',
    floorsLabel: 'Plantas: lista separada por comas o rango',
    floorsPlaceholder: 'p. ej. 1-3',
    numbersLabelIndividual: 'Números de habitación: uno solo, lista o rango',
    numbersLabelIdentical: 'Números de habitación por planta: uno solo, lista o rango',
    numbersPlaceholderIndividual: 'p. ej. 101-110 o 201, 202, 205',
    numbersPlaceholderIdentical: 'p. ej. 01-10',
    prefixFloor: 'Anteponer el número de planta (planta 2 + «05» → «205»)',
    collisionWarning:
      'Sin anteponer la planta, un mismo número no puede existir en varias plantas: los números de habitación son únicos por edificio. Solo se crearía la primera planta.',
    planned: {
      one: 'Se creará {count} habitación: {list}',
      other: 'Se crearán {count} habitaciones: {list}',
    },
    plannedMore: '{list}… (+{more})',
    submit: 'Crear',
    submitting: 'Creando…',
    created: {
      one: '{count} habitación creada.',
      other: '{count} habitaciones creadas.',
    },
    createdSkipped: {
      one: '{count} habitación creada, {skipped} omitida(s) (el número ya existía).',
      other: '{count} habitaciones creadas, {skipped} omitida(s) (el número ya existía).',
    },
    errors: {
      invalidFloors: 'Indique una o varias plantas válidas.',
    },
  },

  list: {
    empty: 'Todavía no hay habitaciones.',
    intro:
      'Haga clic en una habitación, una planta o un edificio para <b>editar</b>, <b>poner fuera de servicio</b> o <b>eliminar</b> el elemento. ¿Una errata? Al editar se cambian número, planta y edificio sin perder nada.',
    noBuilding: 'Sin edificio',
    floor: 'Planta {floor}',
    room: 'Habitación {number}',
    roomCount: {
      one: '{count} habitación',
      other: '{count} habitaciones',
    },
    buildingSubtitle: {
      one: '{rooms} habitaciones en {count} planta',
      other: '{rooms} habitaciones en {count} plantas',
    },
    separator: ' · ',
    deactivatedCount: '{count} fuera de servicio',
    occupiedCount: '{count} ocupada(s)',
    deactivatedTitle: 'Fuera de servicio',
    occupiedAria: 'ocupada',
    deactivatedAria: 'fuera de servicio',
  },

  dialog: {
    editHintRoom: 'Corregir número, planta o edificio; no se pierde nada',
    editHintFloor: 'Mover la planta o cambiar el edificio; no se pierde nada',
    editHintBuilding: 'Renombrar el edificio; no se pierde nada',
    deactivate: 'Poner fuera de servicio',
    deactivateHint: 'Desaparece de los paneles y carteles, el historial se conserva completo',
    reactivate: 'Volver a poner en servicio',
    reactivateHint: {
      one: 'Recuperar {count} habitación',
      other: 'Recuperar {count} habitaciones',
    },
    deleteForever: 'Eliminar definitivamente',
    deleteHint: 'Con todas las estancias y registros; no se puede deshacer',
    deleting: 'Eliminando…',

    roomNumber: 'Número de habitación',
    floor: 'Planta',
    buildingOrNone: 'Edificio (vacío = ninguno)',
    buildingPlaceholder: 'p. ej. Edificio principal',
    appliesToAll: {
      one: 'Se aplica a {count} habitación de esta zona.',
      other: 'Se aplica a las {count} habitaciones de esta zona.',
    },
    reprintWarning:
      'Los códigos QR siguen siendo válidos: pertenecen a la habitación, no al número. Sin embargo, los carteles de habitación y hojas de check-in ya <b>impresos</b> muestran la denominación anterior y conviene volver a imprimirlos.',

    checkingImpact: 'Comprobando las consecuencias…',
    occupiedBlocks: {
      one: 'La habitación está ocupada y no se puede eliminar. Haga primero el check-out.',
      other: '{count} habitaciones están ocupadas y no se pueden eliminar. Haga primero el check-out.',
    },
    confirmLabel: 'Escriba «{phrase}» para confirmar',
    deactivateInstead: 'Mejor poner fuera de servicio: el historial se conserva',

    reactivated: {
      one: '{count} habitación de nuevo en servicio.',
      other: '{count} habitaciones de nuevo en servicio.',
    },
    deactivated: {
      one: '{count} habitación fuera de servicio; el historial se conserva.',
      other: '{count} habitaciones fuera de servicio; el historial se conserva.',
    },
    deactivatedSkipped: {
      one: '{count} habitación fuera de servicio, {skipped} ocupada(s) omitida(s); el historial se conserva.',
      other: '{count} habitaciones fuera de servicio, {skipped} ocupada(s) omitida(s); el historial se conserva.',
    },
    noChange: 'Sin cambios: todo estaba ya así.',
    edited: {
      one: '{count} habitación modificada.',
      other: '{count} habitaciones modificadas.',
    },
    deleted: {
      one: 'Se ha eliminado: {label} ({count} habitación).',
      other: 'Se ha eliminado: {label} ({count} habitaciones).',
    },
    errors: {
      invalidFloor: 'Indique una planta válida.',
    },
  },

  impact: {
    rooms: {
      one: '{count} habitación',
      other: '{count} habitaciones',
    },
    stays: {
      one: '{count} estancia',
      other: '{count} estancias',
    },
    ordersOpen: {
      one: '{count} solicitud de servicio abierta',
      other: '{count} solicitudes de servicio abiertas',
    },
    ordersDone: {
      one: '{count} solicitud de servicio completada',
      other: '{count} solicitudes de servicio completadas',
    },
    ordersDoneAmount: {
      one: '{count} solicitud de servicio completada ({amount})',
      other: '{count} solicitudes de servicio completadas ({amount})',
    },
    transitions: {
      one: '{count} entrada del historial de la habitación',
      other: '{count} entradas del historial de la habitación',
    },
    qrPosters: {
      one: '{count} código QR: los carteles de habitación impresos dejarán de funcionar',
      other: '{count} códigos QR: los carteles de habitación impresos dejarán de funcionar',
    },
    neverUsed: 'Nunca usada: al eliminarla no se pierde ningún dato.',
    willBeDeleted: 'También se eliminará definitivamente:',
    cleaningLogsKept: {
      one: '{count} registro de limpieza se <b>conserva</b>: los tiempos de trabajo en las estadísticas solo pierden la referencia a la habitación.',
      other: '{count} registros de limpieza se <b>conservan</b>: los tiempos de trabajo en las estadísticas solo pierden la referencia a la habitación.',
    },
  },

  scope: {
    room: 'Habitación {number}',
    floor: 'Planta {floor}',
    floorInBuilding: '{building} · Planta {floor}',
    unnamedBuilding: 'Habitaciones sin edificio',
    confirmFloor: 'Planta {floor}',
    confirmUnnamedBuilding: 'ELIMINAR',
  },

  errors: {
    noRoomNumbers: 'No se han indicado números de habitación.',
    invalidFloor: 'Planta no válida.',
    tooMany: 'Máximo {max} habitaciones por operación.',
    createFailed: 'Error al crear: {message}',
    roomStatesFailed: 'Error al crear el estado de las habitaciones: {message}',
    loadFailed: 'Error al cargar: {message}',
    roomOccupied: 'La habitación está ocupada. Haga primero el check-out.',
    roomsOccupied: {
      one: '{count} habitación está ocupada. Haga primero el check-out.',
      other: '{count} habitaciones están ocupadas. Haga primero el check-out.',
    },
    noRoomsFound: '{label}: no se han encontrado habitaciones.',
    numberEmpty: 'El número de habitación no puede estar vacío.',
    numberTooLong: 'El número de habitación es demasiado largo (máximo {max} caracteres).',
    numberSingleOnly: 'Un número de habitación solo se puede asignar de forma individual.',
    buildingTooLong: 'El nombre del edificio es demasiado largo (máximo {max} caracteres).',
    nothingToChange: 'No hay nada que cambiar.',
    numberTakenInBuilding: 'El número de habitación {number} ya está asignado en el edificio «{building}» (planta {floor}).',
    numberTakenNoBuilding: 'El número de habitación {number} ya está asignado sin edificio (planta {floor}).',
    numberDuplicate: 'El número de habitación {number} aparecería dos veces: los números son únicos por edificio.',
    editFailed: 'Error al modificar: {message}',
    noRoomsInScope: 'No hay habitaciones en esta zona.',
    confirmMismatch: 'Escriba «{phrase}» para confirmar.',
    snapshotFailed: 'No se ha podido guardar el registro de facturación: {message}',
    historyDeleteFailed: 'Error al eliminar el historial: {message}',
    deleteFailed: 'Error al eliminar: {message}',
  },
} satisfies Shape<typeof de>
