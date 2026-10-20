import type { Shape } from '../../format'
import type { LandingMessages } from '../../de/landing'

/**
 * Página de inicio (`/`) en español. «Hotel» para el sector,
 * «establecimiento» para la casa concreta, «limpieza» como departamento; «Housekeeping» solo en el nombre del simulador.
 * Precios y cifras llegan de `pricing.ts` como variables.
 */
export const page = {
  meta: {
    title: 'RoSe – RoomService para hoteles de cualquier tamaño',
    description:
      'Las peticiones de limpieza, «No molestar» y las solicitudes de servicio de los huéspedes llegan en directo a recepción y al equipo de limpieza, sin app para huéspedes ni proyecto PMS. {price} por habitación y mes, al menos un mes completo gratis.',
    ogDescription:
      'Check-in con un clic, huéspedes por código QR, limpieza coordinada. Tres portales para recepción, limpieza y huéspedes.',
    ogLocale: 'es_ES',
    siteName: 'RoSe – RoomService',
  },

  header: {
    homeAria: 'RoSe – inicio',
    nav: { product: 'Producto', flow: 'Cómo funciona', pricing: 'Precios', faq: 'Preguntas' },
    signIn: 'Iniciar sesión',
    start: 'Empezar gratis',
  },

  hero: {
    badge: 'De la casa rural a la cadena hotelera',
    title: 'Gestionar la limpieza y ofrecer servicios: <hl>digital y eficiente</hl>',
    text: 'El huésped pulsa «Limpiar mi habitación», recepción lo ve al instante y el equipo de limpieza lo resuelve desde el panel. RoSe conecta todas las áreas en tiempo real, en un sistema intuitivo, sin formación, sin problemas de datos y sin proyecto PMS.',
    start: 'Empezar gratis',
    demo: 'Demo del producto',
  },

  painPoints: [
    {
      pain: '«¿La 204 no había dicho que no quería limpieza?»',
      fix: 'Los huéspedes piden limpieza o «No molestar» por sí mismos y el panel lo muestra en directo, sin gritos por el pasillo y sin colgadores en la puerta.',
    },
    {
      pain: '«¿Quién está ahora en qué habitación?»',
      fix: 'El personal de limpieza confirma el inicio y el final con un deslizamiento: recepción y el equipo ven al instante dónde se está trabajando.',
    },
    {
      pain: '«Otro sistema, otra formación…»',
      fix: 'Tres portales ordenados, cada uno muestra solo lo que necesita su función. El personal de limpieza inicia sesión con una tarjeta de acceso; los huéspedes no necesitan ninguna cuenta.',
    },
  ],

  formula: {
    heading: 'La fórmula RoSe',
    terms: {
      portal: { means: 'Portal de huéspedes móvil', effect: 'mejor calidad de servicio' },
      cleaning: { means: 'Limpieza de habitaciones gestionada', effect: 'ahorra costes, cuida el medio ambiente' },
      flow: { means: 'Flujo de información digital', effect: 'visión general y trazabilidad' },
    },
    footnote: 'Sin proyecto PMS, sin formación, listo en pocos minutos: {price} por habitación y mes, un mes de prueba gratis.',
  },

  sustainability: {
    sealTop: 'Limpieza',
    sealBottom: 'bajo petición',
    badge: 'Hospitalidad sostenible',
    heading: 'Limpieza solo cuando el huésped la desea',
    text: 'La limpieza diaria de la habitación es una costumbre, no un deseo: el 70 % de los huéspedes no la necesita cada día. Con RoSe, la «limpieza bajo petición» se convierte en el estándar de su establecimiento: los huéspedes pulsan cuando quieren algo y lo demás no se toca. Así se ahorra agua, detergente y energía, y obtiene un argumento de sostenibilidad que puede hacer visible ante huéspedes y plataformas de reserva.',
    wins: {
      water: {
        title: 'Agua y detergente',
        text: 'Cada limpieza que se omite durante una estancia ahorra una carga de ropa de cama y toallas, y los productos químicos correspondientes.',
      },
      energy: {
        title: 'Energía y desplazamientos',
        text: 'Ni aspiradora, ni carro por el pasillo, ni viaje a la lavandería para una habitación que nadie quería limpiar.',
      },
      guests: {
        title: 'Los huéspedes deciden',
        text: 'Una pulsación en el portal de huéspedes en lugar de un colgador en la puerta. Quien quiere limpieza la obtiene; quien no, no es molestado.',
      },
    },
    footnote: 'La limpieza diaria a partir de la segunda noche sigue disponible como opción: decide el establecimiento, no el software.',
  },

  product: {
    heading: 'Tres portales, tres tipos de usuario, un trabajo en equipo',
    intro: 'Cada función recibe exactamente la interfaz que necesita, conectada en tiempo real. Véalo aquí en directo: una pulsación y todos lo ven.',
    portals: {
      reception: {
        title: 'Recepción',
        lead: 'Un clic para el check-in, un clic para el check-out.',
        points: [
          'El check-in crea al instante el acceso del huésped: PIN en pantalla, hoja de check-in para imprimir o por correo electrónico',
          'Vista general de habitaciones con estado en directo; prioridades para quejas y casos especiales',
          'Solicitudes de servicio como lista de tareas; las urgentes parpadean en rojo',
        ],
      },
      guests: {
        title: 'Huéspedes',
        lead: 'Escanear el código QR y listo. Sin app, sin cuenta.',
        points: [
          'Código QR de la habitación más PIN, o un enlace personal por estancia: elige el establecimiento',
          '«Limpiar mi habitación» o «No molestar» con una pulsación',
          'Solicitar servicios, desde la lavandería hasta el desayuno en la habitación',
        ],
      },
      housekeeping: {
        title: 'Limpieza',
        lead: 'Un panel para todo el equipo.',
        points: [
          'Vista por plantas: peticiones, salidas, prioridades, con una recomendación de por dónde conviene empezar',
          'Inicio y final con un deslizamiento; todo el equipo ve en directo quién está en qué habitación',
          'Inicio de sesión con tarjeta de acceso, turno y pausa con dos toques, estadísticas incluidas',
        ],
      },
    },
  },

  flow: {
    heading: 'Cómo funciona',
    intro: 'Del check-in a la limpieza terminada: cinco pasos, sin gritos y sin notas en papel.',
    panels: {
      checkin: {
        who: 'Recepción',
        title: 'Check-in con un clic',
        text: 'Un clic en la habitación: RoSe crea la estancia anónima y genera el acceso.',
      },
      access: {
        who: 'Huésped',
        title: 'El acceso en la mano',
        text: 'PIN en la hoja de check-in, cartel en la habitación o enlace por correo electrónico: sin cuenta, sin app.',
      },
      tap: {
        who: 'Huésped',
        title: 'Una pulsación en la habitación',
        text: '«Limpiar mi habitación», «No molestar» o una solicitud del catálogo de servicios.',
      },
      visible: {
        who: 'Recepción',
        title: 'Visible al instante',
        text: 'La campana en la casilla de la habitación, la solicitud en la lista; lo urgente parpadea en rojo.',
      },
      board: {
        who: 'Limpieza',
        title: 'Dirigido y coordinado',
        text: 'Con prioridades y atento: ajustado automáticamente a la demanda y coordinado entre el equipo.',
      },
    },
    checkout: 'El check-out vuelve a ser un clic: el acceso caduca al instante y la habitación pasa al panel como «salida».',
  },

  comparison: {
    heading: 'El mismo día, con y sin RoSe',
    intro: '100 habitaciones, los mismos huéspedes, el mismo personal de limpieza. La única diferencia es lo que saben y cómo eligen la siguiente habitación, tanto si su establecimiento limpia a diario como si solo lo hace bajo petición.',
    simulatorTitle: 'Calcular con las cifras de su establecimiento',
    simulatorText: 'Configure plantas, habitaciones, personal, horarios y comportamiento de los huéspedes: el Simulador Housekeeping calcula muchos días. Gratis, con una dirección de correo electrónico y sin datos de pago.',
    simulatorLink: 'Ir al simulador',
  },

  features: {
    heading: 'Pensado hasta el último detalle',
    items: {
      qr: {
        title: 'Códigos QR según sus necesidades',
        text: 'Accesos de huéspedes por habitación con PIN, o generados individualmente por estancia. Todo con un clic.',
      },
      secure: {
        title: 'Seguro sin cuentas',
        text: 'Códigos de habitación imposibles de adivinar, PIN por estancia, bloqueo tras intentos fallidos, también frente a pruebas en serie desde internet.',
      },
      dnd: {
        title: '«No molestar» se respeta',
        text: '«No molestar» retira la habitación del panel de limpieza: nadie llama a la puerta en vano.',
      },
      daily: {
        title: 'Limpieza diaria',
        text: 'Opcional: a partir de la segunda noche, RoSe coloca la limpieza diaria en el panel a la hora que usted elija, también dentro de una franja horaria.',
      },
      services: {
        title: 'Catálogo de servicios',
        text: 'Cree sus propios servicios con opciones, precios y prioridad; los huéspedes los solicitan en línea y sin demora.',
      },
      print: {
        title: 'Listo para imprimir',
        text: 'Hoja de check-in para el huésped, carteles de habitación y tarjetas de acceso para el equipo: todo desde el navegador, o por correo electrónico.',
      },
      green: {
        title: 'Sostenible bajo petición',
        text: 'Limpieza solo cuando el huésped la desea: menos agua, detergente y desplazamientos, y un argumento visible para su perfil de sostenibilidad.',
      },
      proof: {
        title: 'Datos en lugar de intuición',
        text: 'Historial de habitaciones y estadísticas de tiempo de trabajo por persona de limpieza: para quejas, nóminas y planificación de personal.',
      },
    },
  },

  useCases: {
    heading: 'Hecho para establecimientos de cualquier tamaño',
    intro: 'De la empresa familiar a la cadena: RoSe crece con usted, sin que haga falta un departamento de informática en ningún sitio.',
    items: {
      small: {
        title: 'Pensión, casa rural y apartamentos turísticos',
        text: 'La recepción suele ser también cocina, servicio y limpieza. RoSe mantiene la visión general: quién se va, dónde se pide limpieza, qué se ha pedido, sin montones de papeles. Desde {min} al mes.',
      },
      boutique: {
        title: 'Hotel boutique y aparthotel',
        text: 'Estancias más largas, personal de limpieza que cambia: tarjetas de acceso en lugar del caos de contraseñas, la limpieza diaria aparece sola a partir de la segunda noche, y los huéspedes gestionan ellos mismos «No molestar» y sus peticiones.',
      },
      city: {
        title: 'Hotel urbano con varias plantas',
        text: 'Equipo de limpieza propio o externo: el panel de plantas recomienda por dónde conviene empezar y recepción ve en directo quién trabaja dónde. Las estadísticas ofrecen tiempos de trabajo y de limpieza por persona de limpieza.',
      },
      chain: {
        title: 'Cadena hotelera y resort',
        text: 'Una cuenta, tantos establecimientos como quiera; los gerentes ven sus establecimientos, la recepción solo el suyo. Las prioridades redirigen al instante ante una queja, las limpiezas que nadie cerró caducan automáticamente, sin límite de habitaciones.',
      },
    },
  },

  pricing: {
    heading: 'Un solo precio. Sin paquetes.',
    intro: 'RoSe se paga por habitación, no por función. Todo está siempre incluido, tanto si tiene ocho habitaciones como ochocientas.',
    badge: 'Al menos un mes completo gratis',
    perRoom: 'por habitación y mes, más IVA',
    minimum: 'Importe mínimo <b>{min}</b> al mes: hasta {rooms} habitaciones paga, por tanto, una tarifa fija.',
    included: [
      'Los tres portales: recepción, limpieza, huéspedes',
      'Establecimientos, accesos y personal de limpieza ilimitados',
      'Catálogo de servicios, limpieza diaria, franjas horarias',
      'Carteles de habitación, hojas de check-in, tarjetas de acceso, correo electrónico a huéspedes',
      'Historial de habitaciones y estadísticas de tiempo de trabajo',
      'Claro, oscuro, accesible, en cualquier dispositivo',
    ],
    whatCounts: '<b>¿Qué cuenta como habitación?</b> Toda habitación que haya estado en servicio durante el mes, aunque sea temporalmente. Las habitaciones fuera de servicio (reformas, temporada baja) no cuentan.',
    terms: '<b>Sin permanencia.</b> Se puede cancelar cada mes; facturación a mes vencido por mes natural. El importe mínimo se aplica por cuenta, no por establecimiento. Detalles en las <link>condiciones generales</link> (en alemán).',
    start: 'Empezar gratis',
  },

  faq: {
    heading: 'Preguntas frecuentes',
    items: [
      {
        q: '¿Necesitan los huéspedes una app o una cuenta?',
        a: 'No. Los huéspedes escanean el código QR de la habitación e introducen el PIN del check-in, o abren su enlace personal desde la hoja de check-in o el correo electrónico. Todo funciona en el navegador.',
      },
      {
        q: '¿Sustituye RoSe nuestro sistema de reservas o PMS?',
        a: 'A propósito, no. RoSe se ocupa de la estancia en el establecimiento: limpieza, peticiones, servicios. Reservas, tarifas y facturación siguen donde están. No hay nada que integrar.',
      },
      {
        q: '¿Qué datos guarda RoSe sobre los huéspedes?',
        a: 'Ningún nombre, ningún dato de contacto. Una estancia es anónima: habitación, periodo, acceso. Con el check-out, el acceso caduca al instante. Tampoco se guarda la dirección de correo electrónico para el enlace de acceso.',
      },
      {
        q: '¿Dónde se guardan los datos?',
        a: 'La base de datos y las funciones del servidor funcionan en la UE (Irlanda). Los accesos están separados por establecimiento y las conexiones, cifradas. Los detalles figuran en la política de privacidad (en alemán).',
      },
      {
        q: '¿Qué necesita el personal de limpieza?',
        a: 'Cualquier smartphone o tableta. Inicio de sesión con una tarjeta de acceso impresa o con nombre de usuario y PIN, sin direcciones de correo electrónico.',
      },
      {
        q: '¿Cuánto cuesta RoSe exactamente?',
        a: '{price} por habitación y mes, como mínimo {min} al mes, más IVA. El mes natural del registro y el primer mes completo posterior son gratis, es decir, al menos un mes completo. Sin paquetes, sin límite de habitaciones, se puede cancelar cada mes.',
      },
      {
        q: '¿Cuánto se tarda en configurarlo?',
        a: 'Crear las habitaciones (también como rango, por ejemplo «301–310»), imprimir los carteles de habitación, imprimir las tarjetas de acceso: siendo realistas, unos minutos. Ya hay servicios de ejemplo. No hay nada que instalar.',
      },
      {
        q: '¿Puedo probar RoSe ya?',
        a: 'Sí. En la fase de prueba, el registro sigue limitado a establecimientos invitados: con un código de invitación, su cuenta queda creada en un minuto y al menos el primer mes completo es gratis.',
      },
    ],
  },

  signup: {
    heading: 'Cree su establecimiento en un minuto',
    text: 'Cuenta, establecimiento y servicios de ejemplo se crean de una vez; después solo queda añadir las habitaciones. Al menos el primer mes completo es gratis; en la fase de prueba necesita un código de invitación.',
    start: 'Empezar gratis',
    haveAccess: 'Ya tengo un acceso',
  },

  footer: {
    tagline: '– RoomService, ligero.',
    reception: 'Recepción',
    housekeeping: 'Limpieza',
    guests: 'Portal de huéspedes',
    imprint: 'Aviso legal (en alemán)',
    privacy: 'Privacidad (en alemán)',
    terms: 'Condiciones (en alemán)',
  },

  og: {
    alt: 'RoSe – limpieza, peticiones y servicios al mismo ritmo',
    claim: 'Limpieza, peticiones y servicios, al mismo ritmo',
    sub: 'Tres portales para recepción, limpieza y huéspedes. Sin app para huéspedes, sin proyecto PMS.',
    price: '{price} por habitación y mes · primer mes completo gratis',
    floor: 'Planta 2',
    counts: '2 pendientes · 1 en curso',
    tiles: {
      occupied: 'ocupada',
      ready: 'lista',
      wants: 'limpieza',
      checkedOut: 'salida',
      priority: 'prioritaria',
      dnd: 'No molestar',
    },
    checkin: 'Check-in 207',
    pin: 'PIN 4827',
  },
} satisfies Shape<LandingMessages['page']>
