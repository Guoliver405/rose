import type { Shape } from '../../format'
import type { houses as de } from '../../de/account/houses'

/** Cuenta — página `/admin` (establecimientos y recuadro de la cuenta), añadir establecimiento, nombre de la cuenta, eliminar datos, encabezado, comprobación del logotipo. Español. */
export const houses = {
  shell: {
    logout: 'Cerrar sesión',
  },

  account: {
    heading: 'Cuenta',
    billingLink: 'Plan y facturación',
    houseCount: { one: '{count} establecimiento', other: '{count} establecimientos' },
    roomsActive: '{count} habitaciones en servicio',
    roomsBillable: '{count} facturables en el mes en curso',
    expected: 'aprox. {amount}',
    expectedFree: 'aprox. {amount} (mes gratuito)',
    invoiceFailed: '<b>No se ha podido emitir una factura.</b> {reason} <link>Ir a facturación</link>',
    invoiceOverdue: '<b>La factura {number} está vencida.</b> Le rogamos que la abone; de lo contrario, el acceso puede suspenderse tras un recordatorio (§ 6, apartado 6, de las condiciones generales). <link>Ver factura</link>',
    noPaymentMethod: '<b>Aún no hay método de pago.</b> Tarjeta, domiciliación SEPA o transferencia: <link>añada uno ahora</link>. No se cobra nada hasta después del mes gratuito.',
    billingRule: 'Se factura por habitación y mes natural; cuenta toda habitación que haya estado en servicio durante el mes, <em>aunque sea brevemente</em>.',
    billingNotSetUp: 'La facturación y los métodos de pago aún no están configurados; por ahora no se cobra nada.',
    billingTestMode: 'Las facturas se emiten mensualmente el día 1; por ahora como facturas de prueba, sin ningún cargo.',
    billingLive: 'Las facturas se emiten mensualmente el día 1 por el mes anterior.',
  },

  list: {
    heading: 'Establecimientos',
    rooms: '{count} habitaciones',
    toClean: '{count} por limpiar',
    allReady: 'todo listo',
    manager: 'Gerente',
  },

  simulator: {
    text: 'Calcule su establecimiento con otras cifras (personal, horarios, ocupación) a lo largo de muchos días, sin coordinación y con RoSe.',
  },

  create: {
    button: 'Añadir establecimiento',
    name: 'Nombre del establecimiento',
    namePlaceholder: 'p. ej. Hostal La Corona',
    submit: 'Crear',
    hint: 'La dirección se genera a partir del nombre y puede cambiarse después en Ajustes → Establecimiento y normas. También se crean servicios de ejemplo.',
  },

  accountName: {
    rename: 'Cambiar nombre de la cuenta',
    save: 'Guardar',
    cancel: 'Cancelar',
    hint: 'El nombre de la cuenta es independiente de los nombres de los establecimientos: al crear la cuenta se tomó el nombre del primer establecimiento. Los establecimientos se renombran en Ajustes → Establecimiento y normas.',
  },

  deletion: {
    summary: 'Eliminar datos',
    summaryHint: 'Eliminar definitivamente un establecimiento o la cuenta',
    intro: 'Elimina <b>todo</b>: habitaciones, estancias, solicitudes, registros de limpieza, historial de habitaciones y las cuentas de acceso de las personas afectadas. No se puede deshacer ni restaurar: no existe copia de seguridad. <b>Solo se conservan las facturas</b>, porque existe la obligación de conservarlas.',
    singleHouse: 'Un establecimiento',
    delete: 'Eliminar',
    deleteAccount: 'Eliminar toda la cuenta',
    deleteAccountHint: 'Con todos los establecimientos y su propio acceso. Después ya no será posible iniciar sesión.',
    loadFailed: 'No se ha podido cargar.',
    houseRemoved: '{name} se ha eliminado por completo.',
    headingHouse: 'Eliminar {name}; esto desaparecerá definitivamente:',
    headingAccount: 'Eliminar la cuenta «{name}»; esto desaparecerá definitivamente:',
    houses: { one: '{count} establecimiento: {names}', other: '{count} establecimientos: {names}' },
    rooms: { one: '{count} habitación', other: '{count} habitaciones' },
    stays: { one: '{count} estancia', other: '{count} estancias' },
    orders: { one: '{count} solicitud', other: '{count} solicitudes' },
    staffLog: { one: '{count} registro de actividad', other: '{count} registros de actividad' },
    transitions: { one: '{count} entrada del historial de habitaciones', other: '{count} entradas del historial de habitaciones' },
    snapshots: { one: '{count} mes de facturación registrado', other: '{count} meses de facturación registrados' },
    authUsers: { one: '{count} cuenta de acceso con su dirección de correo', other: '{count} cuentas de acceso con sus direcciones de correo' },
    authUsersKept: {
      one: 'Se conserva {count} cuenta de acceso: esta persona sigue asignada a otros establecimientos.',
      other: 'Se conservan {count} cuentas de acceso: estas personas siguen asignadas a otros establecimientos.',
    },
    finalBill: 'Baja a final de mes: al eliminar se emite una factura final de <b>{amount}</b> más IVA por {month} ({rooms}), que se cobra mediante el método de pago guardado o, sin tarjeta ni domiciliación, con una página de pago que se mostrará aquí tras la eliminación.',
    finalBillFree: '{month} es su mes gratuito: al eliminar no se cobra nada más.',
    finalBillRooms: { one: '{count} habitación', other: '{count} habitaciones' },
    accountDeleted: 'La cuenta se ha eliminado.',
    openInvoicesHint: 'Todavía hay una factura pendiente. Abra la página de pago y descargue allí la factura: una vez que salga de esta página, ya no tendrá acceso a ella.',
    openInvoiceLink: 'Ver y pagar la factura {n}',
    toLogin: 'Ir al inicio de sesión',
    confirmLabel: 'Escriba «{phrase}» para confirmar',
    deleting: 'Eliminando…',
    confirm: 'Sí, eliminar definitivamente',
    cancel: 'Cancelar',
  },

  logo: {
    empty: 'El archivo está vacío.',
    tooLarge: 'El archivo es demasiado grande ({kb} KB). Máximo 1 MB.',
    wrongType: 'Solo PNG, JPG o SVG: el archivo no es ninguno de estos formatos.',
  },

  errors: {
    noPermission: 'Sin autorización.',
    accountNameTooShort: 'El nombre de la cuenta debe tener al menos 2 caracteres.',
    accountNameTooLong: 'El nombre de la cuenta puede tener como máximo 80 caracteres.',
    houseNameTooShort: 'El nombre del establecimiento debe tener al menos 2 caracteres.',
    createFailed: 'No se ha podido crear: {message}',
    ownerOnlyDelete: 'Solo el titular de la cuenta puede eliminar datos.',
    ownerOnlyDeleteAccount: 'Solo el titular de la cuenta puede eliminar la cuenta.',
    houseNotFound: 'Establecimiento no encontrado.',
    confirmPhrase: 'Escriba «{phrase}» para confirmar.',
    deleteFailed: 'No se ha podido eliminar: {message}',
    finalInvoiceFailed: 'No se ha podido crear la factura final del mes en curso ({message}). La cuenta no se ha eliminado: compruebe los datos de facturación en «Plan y facturación» e inténtelo de nuevo.',
  },
} satisfies Shape<typeof de>
