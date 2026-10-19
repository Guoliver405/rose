import type { Shape } from '../format'
import type { PrintMessages } from '../de/print'

/**
 * Páginas de impresión de recepción — español: controles de la hoja de
 * check-in, los carteles de habitación y la tarjeta de acceso, y el resumen
 * del check-out. La hoja para huéspedes en sí está en `sheet.ts`.
 */
export const print = {
  backToOverview: 'Volver a la vista general',

  checkinSheet: {
    notOccupied: 'La habitación {number} no está ocupada en este momento. Haga primero el check-in y después imprima la hoja de check-in.',
    formatA4: 'A4: carpeta, expositor, marco',
    formatCompact: 'Compacto: para entregar',
    printA4: 'Imprimir hoja de check-in (A4)',
    printCompact: 'Imprimir hoja de check-in (compacta)',
    mailTitle: 'Enviar por correo electrónico',
    mailPlaceholder: 'direccion@ejemplo.es',
    send: 'Enviar',
    mailHint:
      'La dirección <b>no se guarda</b>: solo se usa para este correo. El correo se envía en el primer idioma del establecimiento; los pictogramas y el segundo idioma solo aparecen en la versión impresa.',
    release: 'Desbloquear dirección y volver a enviar',
    orPrint: 'O bien: imprima la hoja de check-in, que contiene el mismo acceso.',
    mailNotConfigured:
      'El envío por correo electrónico no está configurado: requiere <code>RESEND_API_KEY</code> y <code>GUEST_MAIL_FROM</code> en las variables de entorno.',
  },

  roomSigns: {
    backToGuestAccess: 'Volver al acceso de huéspedes',
    backToSettings: 'Volver a los ajustes',
    linkModeWarning:
      'Este establecimiento usa un acceso personal por estancia. Los carteles de habitación llevan a una introducción de PIN que los nuevos huéspedes no pueden usar; no deben estar en las habitaciones mientras se aplique este método.',
    title: 'Carteles de habitación',
    createMissing: {
      one: 'Crear el código QR que falta',
      other: 'Crear los {count} códigos QR que faltan',
    },
    formatA4: 'A4: una página por habitación',
    formatCompact: 'Compacto: cuatro por página',
    printAll: {
      one: 'Imprimir todo (1 página)',
      other: 'Imprimir todo ({count} páginas)',
    },
    hint:
      'Se imprimen una vez y se colocan en la habitación, se cuelgan o se guardan en la carpeta: el huésped escanea y solo introduce el PIN que recibe en el check-in. El formato compacto se puede recortar. Un código nuevo deja sin efecto el cartel anterior de la habitación.',
    noRooms: 'Todavía no hay habitaciones configuradas.',
    allHaveCodes: 'Todas las habitaciones tienen ya un código QR.',
    created: {
      one: 'Se ha creado un código QR.',
      other: 'Se han creado {count} códigos QR.',
    },
    renewed: 'Nuevo código QR para la habitación {number}: el cartel anterior ya no funciona.',
    noCode: 'Habitación {number}: aún no tiene código QR; créelo arriba.',
    renew: 'Renovar código',
    errors: {
      notSignedIn: 'No ha iniciado sesión.',
      noPermission: 'Sin autorización.',
      roomNotFound: 'Habitación no encontrada.',
    },
  },

  accessCard: {
    back: 'Volver al personal',
    title: 'Tarjeta de acceso de limpieza',
    scan: 'Escanear código QR → sesión iniciada automáticamente',
    qrAlt: 'Código QR al panel de limpieza',
    manual: 'Inicio de sesión manual → credenciales',
    username: 'Nombre de usuario',
    pin: 'PIN',
    address: 'Dirección: {url}',
    help:
      'Escanee el código QR con la tableta o introduzca el nombre de usuario y el PIN en la dirección indicada arriba. El nombre de usuario es <code>{username}</code>, no el nombre que aparece en la parte superior de la tarjeta. Guarde esta tarjeta de forma confidencial: abre el panel de limpieza sin más confirmación.',
    target: 'Destino del código QR: {url}',
    print: 'Imprimir tarjeta',
  },

  statement: {
    title: 'Resumen de servicios adicionales',
    room: 'Habitación',
    arrival: 'Llegada',
    departure: 'Salida',
    stayRunning: 'Estancia en curso',
    created: 'Emitido',
    none: 'Durante esta estancia no se ha utilizado ningún servicio adicional de pago.',
    service: 'Servicio',
    ordered: 'Solicitado',
    done: 'Realizado',
    amount: 'Importe',
    openNotCharged: 'pendiente: no se cobra',
    notProvidedNotCharged: 'no realizado: no se cobra',
    total: 'Total',
    excludedNote: 'Los servicios no realizados o aún pendientes están marcados y no se incluyen en el total.',
    footer:
      'Este resumen <b>no es una factura</b> ni un documento fiscal. Solo recoge los servicios adicionales de esta habitación solicitados a través del portal de huéspedes; el alojamiento, otros conceptos y la facturación se gestionan en el sistema propio del establecimiento.',
    print: 'Imprimir resumen',
  },
} satisfies Shape<PrintMessages>
