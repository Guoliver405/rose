import type { Shape } from '../format'
import type { SheetMessages } from '../de/sheet'

/** Hojas impresas y correo de acceso para huéspedes — español. Estructura: `de/sheet.ts`. */
export const sheet = {
  langLabel: 'Español',
  heading: 'Cómo funciona',
  sheet: {
    welcome: 'Bienvenido',
    room: 'Habitación',
    scan: 'Escanee el código QR',
    pin: 'Su PIN',
    pinFromReception: 'Recibirá su PIN al hacer el check-in.',
    qrAlt: 'Código QR al portal de huéspedes',
    withoutQr: 'Sin código QR',
    keep: 'Conserve esta hoja: es su acceso.',
  },
  buttonHints: {
    clean: 'Pulse cuando desee que limpiemos su habitación.',
    dnd: 'Nadie llama a la puerta, tampoco para servicios.',
    services: 'Toallas, reparaciones y más: recepción lo ve al instante.',
  },
  sustainabilityNeutral:
    'Cada limpieza que no hace falta ahorra agua, detergente y energía: usted decide en el portal.',
  footer: 'Todos los datos y los horarios actuales están en el portal.',
  labels: {
    cleaning: 'Limpieza',
    sustainability: 'Sostenibilidad',
    dnd: 'Tranquilidad',
    services: 'Servicios',
    access: 'Acceso',
  },
  purpose:
    'El portal de huéspedes le conecta con recepción desde su propia habitación, las 24 horas y sin llamar por teléfono.',
  dnd: '«No molestar» en el portal mantiene al personal fuera de su habitación hasta que usted lo desactive.',
  services:
    'Pida toallas limpias, comunique una avería o solicite otros servicios directamente en el portal: recepción ve su solicitud al instante.',
  cleaningRoutine:
    'Su habitación se limpia a diario a partir de las {due}; el día de salida, después del check-out. No tiene que solicitar nada. ¿Desea una limpieza adicional? Solicítela en el portal.',
  cleaningOnRequest:
    'Su habitación se limpia cuando usted lo pide: solicite la limpieza en el portal cuando le venga bien — sin solicitud, no entramos en la habitación.',
  window: ' El portal admite solicitudes de limpieza a diario de {start} a {end}.',
  defer: ' También puede aplazar la limpieza hasta las {limit} como máximo: antes no vendrá nadie.',
  sustainabilityRoutine:
    '¿Hoy no necesita limpieza? Un toque en «{skip}» (hoy sin limpieza) en el portal ahorra agua, detergente y energía; mañana se vuelve a limpiar.',
  sustainabilityOnRequest:
    'Menos limpieza, menos consumo: cada limpieza que no hace falta ahorra agua, detergente y energía. Por eso solo vamos cuando usted lo desea.',
  access: {
    link: 'Este acceso es personal y no necesita PIN; por favor, no lo comparta. Solo es válido para esta estancia y caduca con el check-out.',
    pinDeep: 'Escanee el código QR e introduzca el PIN; después permanecerá conectado. El PIN es válido hasta el check-out.',
    pinManual: 'Abra la dirección, introduzca el número de habitación y el PIN; después permanecerá conectado. El PIN es válido hasta el check-out.',
  },
  mail: {
    subject: 'Su acceso al portal de huéspedes: {hotel}, habitación {room}',
    greeting: 'Hola:',
    intro: 'aquí tiene su acceso al portal de huéspedes de <b>{hotel}</b>, habitación <b>{room}</b>.',
    open: 'Abrir el portal de huéspedes',
    pin: 'Su PIN:',
    fallback: 'Si el botón no funciona, abra esta dirección:',
    howTo: 'Cómo funciona el portal',
  },
} satisfies Shape<SheetMessages>
