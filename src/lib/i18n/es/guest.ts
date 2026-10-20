import type { Shape } from '../format'
import type { GuestMessages } from '../de/guest'

/**
 * Portal de huéspedes — español (19.10.2026). Estructura y contexto de cada
 * texto: `de/guest.ts` y `de/guest.context.ts`. Se trata al huésped de usted;
 * el establecimiento habla en primera persona del plural. Los botones también
 * aparecen en la hoja impresa: deben ser cortos.
 */
export const guest = {
  brand: {
    portal: 'Portal de huéspedes',
    signIn: 'Portal de huéspedes: acceso',
  },

  login: {
    room: 'Habitación {number}',
    roomNumber: 'Número de habitación',
    roomNumberPlaceholder: 'p. ej., 101',
    pin: 'PIN',
    submit: 'Entrar',
    submitting: 'Entrando…',
    pinHint: 'Recibirá el PIN en recepción al hacer el check-in.',
    linkModeHint:
      'Trabajamos con accesos personales: escanee el código QR de la hoja que recibió en el check-in o abra el enlace de su correo electrónico. El formulario de abajo solo sirve si recibió un PIN en el check-in.',
    invalidLink: 'Este enlace no es válido.',
    invalidLinkHint: 'Diríjase a recepción, por favor.',
  },

  entry: {
    scanTitle: 'Escanee el código QR de su habitación, por favor.',
    scanText:
      'También puede usar la dirección web del establecimiento, que figura en la hoja que recibió en el check-in. En recepción le ayudarán con gusto.',
    expiredTitle: 'Este acceso ya no es válido.',
    expiredText:
      'El acceso era válido para una estancia y caducó con el check-out. Para una nueva estancia, recepción le dará un acceso nuevo y le ayudará con gusto.',
  },

  status: {
    room: 'Habitación {number}',
    signOut: 'Cerrar sesión',
    inProgress: {
      title: 'Estamos limpiando su habitación ahora mismo.',
      text: 'El equipo de limpieza está en la habitación.',
    },
    scheduled: {
      title: 'La limpieza está prevista.',
      text: 'El equipo de limpieza pasará hoy.',
    },
    scheduledFrom: {
      title: 'Limpieza hoy a partir de las {time}.',
      guest: 'Hemos recibido su petición: antes no vendrá nadie.',
      door: 'Como acordamos en la puerta, antes no vendrá nadie.',
      daily: 'Limpiamos a diario. Si hoy no necesita limpieza, pulse «Hoy sin limpieza».',
    },
    dnd: {
      title: 'Sin limpieza: no desea que le molesten.',
      text: 'Desactive «No molestar» si al final quiere que limpiemos su habitación.',
    },
    done: {
      title: 'Su habitación se limpió hoy a las {time}.',
      text: '¿Quiere que volvamos a limpiar? Pulse «Limpiar mi habitación».',
    },
    declined: {
      title: 'Hoy sin limpieza.',
      text: 'Gracias, así ahorramos agua y detergente. ¿Ha cambiado de idea? Pulse «Limpiar mi habitación».',
    },
    departure: {
      title: 'Hoy es su día de salida.',
      text: 'La habitación se limpiará después del check-out. Si quiere que limpiemos antes, pulse «Limpiar mi habitación».',
    },
    none: {
      title: 'Hoy no hay limpieza prevista.',
      firstDay: 'A partir de mañana limpiamos a diario desde las {time}. ¿Quiere limpieza ya hoy? Pulse «Limpiar mi habitación».',
      firstDayDeparture: 'Mañana es su día de salida: la habitación se limpiará después del check-out. ¿Quiere limpieza ya hoy? Pulse «Limpiar mi habitación».',
      onRequest: 'Limpiamos bajo petición: pulse «Limpiar mi habitación» cuando lo desee.',
    },
  },

  signal: {
    clean: {
      label: 'Limpiar mi habitación',
      active: 'Petición activa: pulse de nuevo para cancelarla',
      activeFrom: 'Petición activa, no antes de las {time}. Pulse de nuevo para cancelarla',
      blocked: 'No es posible en este momento',
      idle: 'Avisaremos al equipo de limpieza',
      idleFrom: 'El equipo de limpieza vendrá no antes de las {time}',
    },
    defer: {
      title: 'No antes de',
      now: 'ahora',
      onlyNow: 'Por hoy solo queda «ahora».',
      limit:
        'Puede aplazar la limpieza hasta las <b>{limit}</b> como máximo: antes no vendrá nadie. Este límite nos permite limpiar su habitación el mismo día.',
    },
    window:
      'Aceptamos peticiones de limpieza a diario entre las <b>{start}</b> y las <b>{end}</b>. En ese horario, pulse de nuevo «Limpiar mi habitación» o diríjase a recepción.',
    skip: {
      label: 'Hoy sin limpieza',
      active: '¡Gracias! Solo para hoy: pulse de nuevo para cancelarlo',
      idle: 'Los servicios siguen llegando. Mañana se vuelve a limpiar.',
    },
    dnd: {
      label: 'No molestar',
      active: 'Activado: pulse de nuevo para desactivarlo',
      idle: 'Nadie llama a la puerta, tampoco para servicios.',
    },
  },

  services: {
    heading: 'Solicitar un servicio',
    links: 'Enlaces útiles',
    opensExternally: '{host} · se abre en una ventana nueva',
    orders: 'Sus solicitudes',
    notePlaceholder: 'Observación (opcional)',
    order: 'Pedir',
    report: 'Avisar',
    sending: 'Enviando…',
    sent: 'Recepción ha recibido su solicitud.',
    fallbackName: 'Servicio',
    orderStatus: {
      open: 'pendiente',
      done: 'hecho',
      cancelled: 'anulado',
    },
  },

  review: {
    hint: '¿Le ha gustado su estancia?',
    button: {
      google: 'Valórenos en Google',
      tripadvisor: 'Valórenos en Tripadvisor',
      booking: 'Valórenos en Booking.com',
      holidaycheck: 'Valórenos en HolidayCheck',
      other: 'Escribir una opinión',
    },
  },

  thanks: {
    title: '¡Gracias por su estancia!',
    text: 'Su estancia ha terminado y el acceso al portal de huéspedes ha caducado.',
    review: 'Nos encantaría recibir su opinión: ayuda a otros huéspedes a elegir.',
    signInAgain: '¿Nueva estancia? Volver a entrar',
  },

  errors: {
    loginFailed: 'No se ha podido entrar: el número de habitación o el PIN no son correctos.',
    pinFormat: 'Introduzca el PIN (solo cifras).',
    tooManyAttempts: 'Demasiados intentos fallidos: vuelva a intentarlo dentro de {minutes} min.',
    tooManyFromNetwork: 'Demasiados intentos fallidos: vuelva a intentarlo dentro de {minutes} min o diríjase a recepción.',
    sessionExpired: 'Su sesión ha caducado: vuelva a entrar, por favor.',
    invalidSignal: 'Selección no válida.',
    outsideWindow: 'Las peticiones de limpieza solo son posibles entre las {start} y las {end}.',
    deferNotAllowed: 'Nuestro establecimiento no ofrece aplazar la limpieza.',
    deferPast: 'La hora elegida ya ha pasado.',
    deferTooLate: 'Solo se puede aplazar hasta las {time}.',
    saveFailed: 'No se ha podido guardar: vuelva a intentarlo.',
    serviceUnavailable: 'Este servicio ya no está disponible.',
    serviceIsLink: 'Esta entrada es un enlace y no admite solicitudes.',
    pickOption: 'Elija al menos una opción.',
    sendFailed: 'No se ha podido enviar la solicitud: vuelva a intentarlo.',
    onRequestOnly: 'Nuestro establecimiento solo limpia bajo petición.',
  },
} satisfies Shape<GuestMessages>
