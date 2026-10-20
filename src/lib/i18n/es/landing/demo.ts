import type { Shape } from '../../format'
import type { LandingMessages } from '../../de/landing'

/** Vista previa interactiva del producto (`LiveDemo`) en español, con los textos de los portales reales. */
export const demo = {
  hotel: 'Hotel Vista Alpina',
  maid: 'Maria',

  services: {
    towels: { name: 'Toallas adicionales', meta: 'gratis' },
    breakfast: { name: 'Desayuno en la habitación', meta: '14,50 €' },
    repair: { name: 'Servicio técnico', meta: 'urgente' },
  },

  events: {
    initial: 'Situación inicial: la habitación 202 está libre y lista.',
    checkin: 'Check-in habitación {nr}: estancia creada, PIN {pin}.',
    checkout: 'Check-out habitación {nr}: acceso caducado, limpieza tras la salida pendiente.',
    signal: 'Huésped de la {nr}: {label}.',
    signalClean: 'limpieza solicitada',
    signalDnd: 'No molestar',
    signalNone: 'petición retirada',
    order: 'El huésped de la {nr} solicita «{name}».',
    report: 'El huésped de la {nr} avisa de «{name}», urgente.',
    orderDone: 'Recepción: solicitud de la {nr} resuelta.',
    priorityOn: 'Recepción: habitación {nr} prioritaria.',
    priorityOff: 'Recepción: la habitación {nr} ya no es prioritaria.',
    start: '{maid} empieza la limpieza de la {nr}.',
    finish: '{maid} ha terminado la {nr}: habitación lista.',
  },

  tone: {
    priority: 'prioritaria',
    checkedOut: 'salida',
    wants: 'limpieza solicitada',
    dnd: 'No molestar',
    occupied: 'ocupada',
    ready: 'lista',
  },

  story: {
    checkin: {
      who: 'Recepción',
      title: 'Check-in con un clic',
      text: 'Un clic en la habitación {nr}: RoSe crea la estancia anónima y muestra el PIN.',
    },
    access: {
      who: 'Huésped',
      title: 'El acceso en la mano',
      text: 'PIN en la hoja de check-in, cartel en la habitación o enlace por correo electrónico: sin cuenta, sin app.',
    },
    tap: {
      who: 'Huésped',
      title: 'Una pulsación en la habitación',
      text: '«Limpiar mi habitación», no hace falta más.',
    },
    visible: {
      who: 'Recepción',
      title: 'Visible al instante',
      text: 'La casilla pasa a ámbar; una solicitud trae la campana y el contador.',
    },
    board: {
      who: 'Limpieza',
      title: 'Dirigido y coordinado',
      text: '{maid} empieza con un deslizamiento y termina: recepción ve verde.',
    },
  },

  head: {
    step: 'Paso {step} de {total} · {who}',
    ended: 'Listo: ahora pruébelo usted.',
    tryIt: 'Pruébelo.',
    hint: 'Pulse en el portal de huéspedes, haga clic en recepción, deslice en el panel.',
    free: 'Probar por mi cuenta',
    play: 'Reproducir la historia',
    reset: 'Restablecer',
  },

  reception: {
    title: 'Recepción – vista general',
    badge: 'Solicitudes {count}',
    floor: 'Planta 2',
    counts: '{open} por hacer · {inWork} en curso',
    checkin: 'Check-in {nr}',
    checkout: 'Check-out {nr}',
    priority: 'Prio {nr}',
    stay: 'Estancia {nr}',
    pin: 'PIN {pin}',
    done: 'Resuelta',
  },

  guest: {
    frame: 'Portal de huéspedes – móvil',
    room: 'Habitación {nr}',
    noStay: 'Aún no hay estancia: el acceso se crea con el check-in en recepción.',
    checkin: 'Hacer el check-in en recepción',
    sheet: 'Hoja de check-in: QR + PIN {pin}',
    clean: 'Limpiar mi habitación',
    dnd: 'No molestar',
    services: 'Servicios',
    order: 'Pedir',
    report: 'Avisar',
    openRequests: { one: '{count} solicitud abierta', other: '{count} solicitudes abiertas' },
  },

  board: {
    title: 'Panel de limpieza',
    floor: 'Planta 2',
    next: 'Siguiente · {count} por hacer',
    inWork: '{count} en curso',
    allDone: 'todo hecho',
    empty: 'No hay limpiezas pendientes en esta planta.',
    room: 'Habitación {nr}',
    maidIn: '{maid} en la {nr}',
    finish: 'Terminar limpieza',
    start: 'Empezar limpieza',
  },

  tile: {
    cleaning: 'en limpieza',
    request: 'Solicitud de servicio',
  },
} satisfies Shape<LandingMessages['demo']>
