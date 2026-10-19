import type { Shape } from '../../format'
import type { services as de } from '../../de/admin/services'

/** Recepción — catálogo de servicios y enlaces. Español. */
export const services = {
  title: 'Catálogo de servicios',
  count: {
    one: '{count} servicio',
    other: '{count} servicios',
  },

  create: {
    heading: 'Añadir un servicio',
    kindAria: 'Tipo de servicio',
    kindOrder: 'Se puede pedir',
    kindLink: 'Enlace',
    templates: 'Plantillas:',
    name: 'Nombre',
    namePlaceholder: 'p. ej. Toallas adicionales',
    description: 'Descripción (opcional)',
    descriptionPlaceholder: 'Breve indicación para el huésped',
    linkUrl: 'Dirección (enlace)',
    urgent: 'Urgente',
    maintenance: 'Aviso',
    submit: 'Crear',
    linkExplanation:
      'Un <b>enlace</b> es un mosaico del portal de huéspedes que abre una web externa: una app de propinas para el equipo de limpieza, comida a domicilio, un taxi. No crea ninguna solicitud y no aparece ni en el panel de recepción ni en el resumen del check-out. El proveedor es responsable del contenido y la protección de datos del destino; el portal no integra nada, solo enlaza.',
    urgentExplanation:
      'Las solicitudes urgentes parpadean en rojo en recepción, en el mosaico de la habitación y en la navegación. Las opciones y los precios se definen en el servicio después de crearlo.',
    maintenanceExplanation:
      'Un <b>aviso</b> sirve para averías y reparaciones: afecta a la habitación, no a la estancia. Estas solicitudes siguen abiertas al hacer el check-out (una avería no desaparece con el huésped), no aparecen en ningún resumen y muestran una advertencia en el siguiente check-in.',
  },

  empty: {
    title: 'Todavía no hay servicios.',
    text: 'Los huéspedes ven los servicios en el portal de huéspedes y envían su solicitud con un toque.',
    examples: 'Crear servicios de ejemplo',
  },

  service: {
    urgentBadge: 'urgente',
    maintenanceBadge: 'Aviso',
    linkBadge: 'Enlace',
    urgentOff: 'Urgente: desactivar',
    urgentOn: 'Urgente: activar',
    maintenanceOff: 'Aviso: desactivar',
    maintenanceOn: 'Aviso: activar',
    archive: 'Archivar',
    archiveConfirm:
      '¿Archivar «{name}»? El servicio desaparece del portal de huéspedes; las solicitudes existentes se conservan.',
    archiveYes: 'Sí, archivar',
    address: 'Dirección',
    saveAddress: 'Guardar dirección',
    test: 'Probar',
    archiveOption: 'Archivar opción',
    archiveOptionAria: 'Archivar {label}',
    noOptions: 'Sin opciones: el huésped elige el servicio en su conjunto.',
    option: 'Opción',
    optionPlaceholder: 'p. ej. Toalla grande',
    price: 'Precio en {currency} (opcional)',
    addOption: 'Añadir',
  },

  languages: {
    label: 'Idiomas:',
    home: 'texto original',
    missing: 'falta',
    editTitle: 'Editar la traducción al {lang}',
    editorTitle: 'Traducción al {lang}',
    editorIntro:
      'Los huéspedes que ven el portal de huéspedes en {lang} reciben estos textos. Los campos vacíos se muestran en {home}. Puede traducir con la herramienta que prefiera y pegar aquí el resultado.',
    name: 'Nombre',
    description: 'Descripción',
    options: 'Opciones',
    original: 'Texto original: {text}',
    save: 'Guardar traducción',
    close: 'Cerrar',
    saved: 'Guardado.',
    banner: {
      one: '<b>{count} servicio</b> aún no está traducido por completo al {lang}.',
      other: '<b>{count} servicios</b> aún no están traducidos por completo al {lang}.',
    },
    bannerHint: 'Los huéspedes en {lang} ven allí los textos en {home}. Puede guardar igualmente y traducir cuando le convenga.',
    bannerJump: 'Ir al primero',
  },

  linkTemplates: {
    names: {
      tip: 'Propina para el equipo de limpieza',
      food: 'Pedir comida: {brand}',
    },
    descriptions: {
      tip: 'Dé las gracias sin efectivo: la propina es para el equipo de limpieza.',
      food: 'Los restaurantes cercanos entregan directamente en nuestro establecimiento.',
    },
    regions: {
      everywhere: 'en todas partes',
      germany: 'Alemania',
      germanyNordicsJapan: 'Alemania, norte de Europa, Japón',
      worldwide: 'en todo el mundo',
      southeastAsia: 'Sudeste Asiático',
      asia: 'Asia',
    },
    hints: {
      tip: 'Introduzca la dirección de su app de propinas (el código QR de la app contiene exactamente este enlace). Un solo enlace para todo el equipo: el portal de huéspedes no muestra nombres.',
      lieferando:
        'Mejor que la página de inicio: la dirección para su calle o código postal desde la búsqueda de {brand}, así el huésped ve enseguida los restaurantes que entregan en su zona.',
      wolt: 'Use la página de su ciudad en {brand} (p. ej. …/es/esp/madrid), así el huésped no llega a la selección de país.',
      ubereats: 'Use la dirección con su ciudad desde la búsqueda de {brand}.',
      grab: 'Use la página del país o de la ciudad en {brand}.',
      foodpanda: 'Use la página del país en {brand}.',
    },
  },

  errors: {
    invalidUrl: 'Dirección ilegible: debe empezar por «https://».',
    serviceNotFound: 'Servicio no encontrado.',
    notALink: 'Este servicio no es un enlace.',
    examplesExist: 'Los servicios de ejemplo ya existen (quizá archivados).',
    nameTooShort: 'El nombre debe tener al menos {min} caracteres.',
    labelMissing: 'Falta la denominación.',
    priceInvalid: 'Precio ilegible: p. ej. «{example}» o déjelo vacío.',
    unknownLanguage: 'Idioma desconocido.',
  },
} satisfies Shape<typeof de>
