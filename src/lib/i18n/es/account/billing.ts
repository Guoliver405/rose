import type { Shape } from '../../format'
import type { billing as de } from '../../de/account/billing'

/**
 * Cuenta — plan y facturación, método de pago, datos de facturación,
 * facturas. Español. Los textos de la factura de Stripe (`invoice`) se dirigen
 * a clientes de habla hispana (`invoiceLocale` en `lib/invoice.ts`).
 */
export const billing = {
  kinds: {
    card: 'Tarjeta',
    sepa_debit: 'Domiciliación SEPA',
    bank_transfer: 'Factura (transferencia)',
  },

  page: {
    title: 'Plan y facturación',
    backToHouses: 'Establecimientos',
    notice: {
      testTitle: 'Modo de prueba: no se cobra nada.',
      testText:
        'Las facturas se emiten mensualmente el día 1 por el mes anterior, pero por ahora a través del entorno de prueba de nuestro proveedor de pagos: son facturas de prueba, y no se realiza ningún cargo en las tarjetas y cuentas guardadas. Se le informará por escrito antes del paso al funcionamiento real.',
      noneTitle: 'Por ahora no se cobra nada.',
      noneText:
        'La facturación y los métodos de pago aún no están configurados. Los importes de esta página muestran lo que costaría la cuenta según el modelo de precios. Antes del primer cargo se le informará por escrito y podrá añadir un método de pago; hasta entonces, no hay costes.',
    },
    free: {
      label: 'gratis',
      title: 'Mes gratuito: el mes natural del registro y el primer mes completo siguiente.',
    },
    insteadOf: 'en lugar de {amount}',
    plusVat: 'más IVA',
    plan: {
      title: 'Su plan',
      perRoom: 'por habitación y mes, más IVA',
      minimum: 'Importe mínimo de <b>{amount}</b> por cuenta y mes: un precio fijo hasta {rooms} habitaciones.',
      text:
        'Un único precio para establecimientos de cualquier tamaño, con todas las funciones incluidas. No hay paquetes ni nada a lo que tenga que pasarse más adelante. Su cuenta existe desde el {registered} y es gratuita hasta el final de {freeUntil}: el mes del registro y el primer mes natural completo siguiente no cuestan nada.',
    },
    current: {
      title: 'Mes en curso: {month}',
      colHouse: 'Establecimiento',
      colRooms: 'Habitaciones facturables',
      total: 'Total',
      expected: 'Importe estimado:',
      note:
        'Cuenta toda habitación que haya estado en servicio durante el mes, aunque sea brevemente: una habitación retirada del servicio hoy sigue contando para este mes, igual que una creada hoy. La cifra solo es definitiva al final del mes.',
    },
    closed: {
      title: 'Meses cerrados',
      empty: 'Aún no hay ningún mes cerrado; el primero aparecerá aquí a partir del día 1 del mes siguiente.',
      colMonth: 'Mes',
      colRooms: 'Habitaciones',
      colAmount: 'Importe',
      colStatus: 'Estado',
      fixed: 'registrado',
      fixedTitle: 'Registrado antes de eliminar habitaciones: esta cifra ya no cambia.',
      notCharged: 'no cobrado',
      note:
        'Los meses cerrados se registran en cuanto se eliminan habitaciones; de lo contrario, una habitación eliminada desaparecería retroactivamente de periodos ya facturados. Mientras no se elimine nada, el recuento a partir de las propias habitaciones es igual de vinculante.',
    },
    paymentMethod: {
      title: 'Método de pago',
      unavailable:
        'Aún no hay método de pago, y por ahora no se puede elegir ninguno. En cuanto la facturación esté configurada, podrá añadir uno aquí. Se le informará por escrito con antelación.',
      none: 'Aún no hay método de pago.',
      invoiceTo: 'Factura a <b>{name}</b>, {postalCode} {city}, {country}',
      vatId: ' · NIF-IVA {vatId}',
      detailsMissing: 'Aún faltan los datos de facturación.',
      change: 'Cambiar método de pago y datos de facturación',
      add: 'Añadir método de pago',
    },
    invoices: {
      title: 'Facturas',
      emptyStripe:
        'Aún no hay ninguna factura. La primera se emite el día 1 del mes siguiente al mes gratuito: mensualmente a mes vencido, en formato electrónico, pagadera en 14 días sin descuento.',
      emptyNone:
        'Aún no hay facturas. Aparecerán aquí en cuanto la facturación esté configurada: mensualmente a mes vencido, en formato electrónico, pagaderas en 14 días sin descuento.',
      net: '{amount} sin IVA',
      due: 'vence el {date}',
      pdf: 'PDF',
      view: 'Ver',
      viewPay: 'Ver / pagar',
    },
    status: {
      draft: 'en preparación',
      open: 'pendiente',
      paid: 'pagada',
      uncollectible: 'incobrable',
      void: 'anulada',
      overdue: 'vencida',
    },
    terms: {
      title: 'Condiciones de facturación',
      interval:
        '<b>Periodo de facturación:</b> mes natural, mensualmente a mes vencido; la factura llega por correo electrónico el día 1 del mes siguiente y aparece aquí.',
      payment:
        '<b>Pago:</b> con una tarjeta o domiciliación guardada, el cobro se realiza al emitir la factura (la domiciliación, tras notificación previa); en otro caso, en un plazo de 14 días por transferencia o a través de la página de pago.',
      minimum: '<b>Importe mínimo por cuenta,</b> no por establecimiento: varios establecimientos pagan la suma de sus habitaciones.',
      inactive: '<b>Las habitaciones fuera de servicio</b> (reformas, temporada) no cuentan mientras estén fuera de servicio durante todo el mes.',
      cancel:
        '<b>Sin permanencia mínima:</b> se puede dar de baja cada mes a final de mes. Eliminar la cuenta en «Eliminar datos» también cuenta como baja.',
      net: '<b>Todos los precios son netos,</b> más el IVA legal.',
      details: 'Detalles en las <link>condiciones generales</link>, §§ 6 y 7.',
    },
  },

  paymentPage: {
    backToBilling: 'Plan y facturación',
    title: 'Método de pago y datos de facturación',
    step: {
      title: 'Paso 2 de 2: método de pago',
      text:
        'Su cuenta y su establecimiento ya están creados. Añada ahora los datos de facturación y un método de pago: no se cobra nada; el mes del registro y el primer mes completo siguiente son gratuitos. También puede completar este paso más adelante en la página «Plan y facturación».',
      later: 'Más tarde: continuar con la configuración de habitaciones',
    },
    saveFailed: 'No se ha podido guardar la tarjeta o la cuenta: {error}',
    confirmCancelled: 'Se ha interrumpido la confirmación de la tarjeta o la cuenta. Inténtelo de nuevo.',
  },

  details: {
    title: 'Datos de facturación',
    intro:
      'Figuran en cada factura. La dirección determina el IVA: Alemania, 19 %; empresas de la UE con NIF-IVA, sin IVA alemán (inversión del sujeto pasivo); fuera de la UE, sin IVA alemán. El idioma de la factura también depende del país: alemán, francés o español para los países que los hablan; inglés en los demás.',
    name: 'Destinatario de la factura (empresa)',
    line1: 'Calle y número',
    line2: 'Información adicional de dirección (opcional)',
    postalCode: 'Código postal',
    city: 'Localidad',
    country: 'País',
    vatId: 'NIF-IVA {suffix}',
    vatRequired: '(obligatorio)',
    vatOptional: '(opcional)',
    vatNotApplicable: '(no procede)',
    vatStatus: 'Estado: {status}',
    vatStatusText: {
      pending: 'en comprobación',
      verified: 'verificado',
      unverified: 'no se ha podido verificar; compruebe el número',
      unavailable: 'servicio de verificación no disponible, se volverá a intentar',
    },
    vatHint:
      'Las empresas de la UE fuera de Alemania necesitan un NIF-IVA: solo así puede emitirse la factura sin IVA alemán.',
    submit: 'Guardar datos de facturación',
    submitting: 'Guardando…',
    saved: 'Guardado',
  },

  panel: {
    title: 'Método de pago',
    remove: 'Quitar',
    none:
      'Aún no hay método de pago. Hay tres opciones, todas a través de nuestro proveedor de pagos Stripe: la tarjeta o la domiciliación SEPA se guardan aquí y se cobran mensualmente; con factura y transferencia no se guarda nada, y cada factura indica los datos bancarios con una referencia de pago.',
    detailsFirst:
      'Guarde primero los datos de facturación de arriba: figuran en la factura y determinan el IVA.',
    change: 'Cambiar tarjeta o domiciliación',
    add: 'Añadir tarjeta o domiciliación SEPA',
    bankTransfer: 'Factura (transferencia)',
    bankTransferChosen: 'Factura (transferencia) seleccionada.',
    saved: '{label} guardado.',
    stripeUnreachable: 'Stripe no está disponible.',
    notes:
      'Transferencia: la factura indica los datos bancarios de nuestro proveedor de pagos con una referencia de pago; los pagos recibidos se concilian automáticamente, plazo de pago de 14 días. Domiciliación: se cobra al emitir la factura, tras notificación previa. Tarjeta: se carga al emitir la factura.',
    next: 'Continuar con la configuración de habitaciones',
    form: {
      confirmFailed: 'No se ha podido confirmar.',
      notConfirmed: 'Tarjeta o cuenta aún sin confirmar ({status}).',
      unknownStatus: 'desconocido',
      submit: 'Guardar tarjeta o cuenta',
      submitting: 'Guardando…',
      cancel: 'Cancelar',
      preferTransfer:
        '¿Prefiere no guardar ninguna tarjeta ni cuenta? <link>Elija factura (transferencia)</link>: cada factura indicará entonces los datos bancarios y una referencia de pago, con un plazo de pago de 14 días.',
      noCharge:
        'No se cobra nada. La tarjeta o la cuenta se guarda en Stripe y se usa para las facturas mensuales; RoSe nunca ve los datos de la tarjeta o de la cuenta.',
    },
  },

  labels: {
    card: '{brand} •••• {last4}',
    sepaDebit: 'Domiciliación SEPA •••• {last4}',
    bankTransfer: 'Factura (transferencia)',
  },

  invoice: {
    rooms: { one: '{count} habitación', other: '{count} habitaciones' },
    line: 'RoSe (uso en {month}): {rooms} × {price}',
    lineMinimum: 'RoSe (uso en {month}): {rooms} (importe mínimo de {minimum} al mes)',
    memo: 'Periodo de prestación del servicio: {range}. Se factura toda habitación que haya estado en servicio durante el mes, aunque sea brevemente.',
    periodField: 'Periodo de prestación',
    managingDirector: 'Administrador: {name}',
    vatId: 'NIF-IVA: {vatId}',
    due: 'Pagadera en un plazo de {days} días, sin descuento.',
  },

  errors: {
    noPermission: 'Sin autorización.',
    notReady: 'Los métodos de pago aún no están configurados.',
    stripeUnreachable: 'Stripe no está disponible.',
    invalidId: 'Identificador no válido.',
    vat: {
      nameMissing: 'Indique el destinatario de la factura.',
      countryMissing: 'Seleccione un país.',
      line1Missing: 'Indique la calle y el número.',
      postalCodeMissing: 'Indique el código postal.',
      cityMissing: 'Indique la localidad.',
      outsideEu: 'El NIF-IVA solo existe para empresas de la UE. Deje el campo vacío.',
      format: 'El NIF-IVA no tiene el formato de {country} (prefijo {prefix}).',
      required:
        'Las empresas de la UE fuera de Alemania deben indicar un NIF-IVA; de lo contrario, tendríamos que aplicar el IVA alemán.',
    },
    stripe: {
      notConfigured: 'Stripe no está configurado.',
      accountNotFound: 'Cuenta no encontrada.',
      unreachable: 'Stripe no está disponible.',
      customerFailed: 'No se ha podido crear el cliente de Stripe.',
      detailsFailed: 'No se han podido transmitir los datos de facturación.',
      noCustomer: 'No hay ningún cliente de Stripe para esta cuenta.',
      wrongAccount: 'Los datos de pago no pertenecen a esta cuenta de RoSe.',
      notConfirmed: 'Tarjeta o cuenta aún sin confirmar ({status}).',
      missingOnIntent: 'Falta la tarjeta o la cuenta en la confirmación.',
      unsupported: 'El método de pago {type} no es compatible.',
      saveFailed: 'No se ha podido guardar la tarjeta o la cuenta.',
      detachFailed: 'No se ha podido quitar la tarjeta o la cuenta.',
    },
    invoicing: {
      noCustomer: 'No hay cliente de Stripe: abra la página «Método de pago».',
      detailsMissing: 'Faltan los datos de facturación.',
    },
  },
} satisfies Shape<typeof de>
