import type { HilfeThemaText } from '@/lib/hilfe'

/**
 * Ayuda contextual: textos de los temas (el «?» de cada página). Español.
 * Estructura, símbolos de la leyenda y destinos de los enlaces idénticos a
 * `de/help/topics.ts`; solo se traducen los textos.
 */
export const topics = {
  uebersicht: {
    title: 'La vista general de habitaciones',
    subtitle: 'Colores y símbolos de las fichas, check-in y check-out, prioridad, historial',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'La vista general es la pantalla de la recepción. Muestra todas las habitaciones agrupadas por planta, con el estado de cada una de un vistazo. Al hacer clic en una habitación se abre una ventana con check-in, check-out, PIN, hoja de check-in, fecha de salida, prioridad e historial.',
          'Se actualiza sola en cuanto un huésped pulsa un botón, una persona de limpieza empieza o alguien cambia algo en otra pantalla. Nunca hace falta recargar.',
        ],
      },
      {
        art: 'legende',
        titel: 'La barra sobre el número',
        hinweis: 'Si se dan varios estados, prevalece el que aparece más arriba.',
        eintraege: [
          { zeichen: { art: 'balken', id: 'priority' } },
          { zeichen: { art: 'balken', id: 'checkout' } },
          { zeichen: { art: 'balken', id: 'wanted' } },
          { zeichen: { art: 'balken', id: 'dnd' } },
          { zeichen: { art: 'balken', id: 'occupied' } },
          { zeichen: { art: 'balken', id: 'ready' } },
          { zeichen: { art: 'balken', id: 'deactivated' } },
        ],
      },
      {
        art: 'legende',
        titel: 'Los símbolos de la ficha',
        hinweis: 'Varios símbolos a la vez es normal: por ejemplo, ocupada, limpieza solicitada y una solicitud abierta. La información emergente de la ficha lo dice todo con palabras.',
        eintraege: [
          { zeichen: { art: 'symbol', id: 'occupied' } },
          { zeichen: { art: 'symbol', id: 'departure' } },
          { zeichen: { art: 'symbol', id: 'dnd' } },
          { zeichen: { art: 'symbol', id: 'clean' } },
          { zeichen: { art: 'symbol', id: 'deferred' } },
          { zeichen: { art: 'symbol', id: 'declined' } },
          { zeichen: { art: 'symbol', id: 'routine' } },
          { zeichen: { art: 'symbol', id: 'checkout' } },
          { zeichen: { art: 'symbol', id: 'priority' } },
          { zeichen: { art: 'symbol', id: 'cleaning' } },
          { zeichen: { art: 'symbol', id: 'orders' } },
          { zeichen: { art: 'symbol', id: 'urgent' } },
          { zeichen: { art: 'symbol', id: 'deactivated' } },
        ],
      },
      {
        art: 'legende',
        titel: 'Borde y cabecera de planta',
        eintraege: [
          { zeichen: { art: 'ring', id: 'urgent' } },
          { zeichen: { art: 'ring', id: 'priority' } },
          {
            zeichen: { art: 'icon', id: 'users', ton: 'neutral' },
            label: 'Nombre en la cabecera de planta',
            text: 'Una persona de limpieza se ha registrado en esta planta. Usted ve dónde se está trabajando sin tener que preguntar.',
          },
          {
            zeichen: { art: 'pille', text: '3', ton: 'attention' },
            label: 'Número en «Solicitudes» de la navegación',
            text: 'Esa cantidad de solicitudes está abierta. Parpadea en rojo en cuanto una de ellas se refiere a un servicio urgente.',
          },
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: '¿Por qué una habitación está en naranja tras el check-out en lugar de pasar directamente a verde?',
            antwort: 'RoSe solo muestra lo que realmente se ha comunicado: el check-out dice «limpieza pendiente», y solo el fin de la limpieza por parte de una persona de limpieza (o su «Marcar limpieza como hecha» en la ventana) dice «lista». RoSe no adivina si alguien ha pasado entretanto.',
          },
          {
            frage: 'Tengo que hacer el check-in de un huésped, pero la habitación no está lista. ¿Es posible?',
            antwort: 'Sí. La ventana le avisa y aun así le permite hacer el check-in. El mismo aviso aparece si hay un aviso abierto (por ejemplo, una avería comunicada): al menos lo sabe antes de que el huésped esté en la habitación.',
          },
          {
            frage: '¿Dónde está el PIN y qué le digo al huésped?',
            antwort: 'Tras el check-in, el PIN aparece en grande en la ventana. Basta con leérselo, junto con la hoja de check-in para imprimir o enviar por correo electrónico. Si su establecimiento usa acceso personal por estancia, no hay PIN: el huésped recibe su propio código QR o enlace, que caduca con el check-out.',
          },
          {
            frage: '¿Tengo que indicar una fecha de salida en el check-in?',
            antwort: 'No. El valor por defecto es «abierta», así que el check-in sigue siendo un solo clic. Si la indica, la limpieza diaria se suspende el día de salida y la ficha muestra la maleta. Puede añadirla o prolongarla en cualquier momento en la ventana. Una fecha pasada (ayer) se considera desconocida, para que un olvido no desactive la limpieza diaria de forma permanente.',
          },
          {
            frage: '¿Cuándo debo fijar una prioridad?',
            antwort: 'Para quejas y casos especiales, fije una prioridad manualmente; nunca se fija de forma automática. La habitación sube en el panel de limpieza y la planta se marca con un piloto violeta. La prioridad desaparece sola cuando se termina la limpieza.',
          },
          {
            frage: '¿Qué ocurre exactamente en el check-out?',
            antwort: 'El PIN, el enlace y la sesión del huésped dejan de funcionar de inmediato, y la habitación pasa a «limpieza pendiente». Las solicitudes de servicio abiertas de esta estancia se cierran como «no realizadas»: marque antes, en el mismo recuadro, lo que realmente se prestó. Los avisos (averías) siguen abiertos. Si el huésped pidió algo de pago, el total aparece en la ventana antes de que usted confirme.',
          },
          {
            frage: '¿Dónde encuentro el resumen más tarde?',
            antwort: 'En el historial de la habitación, la entrada «Check-out» enlaza con el resumen. No es una factura: no contiene nombre del huésped, número de factura ni desglose de impuestos. Indica el importe que hay que cobrar.',
          },
          {
            frage: '¿Qué contiene el historial?',
            antwort: 'Los últimos 30 días de la habitación: pulsaciones del huésped (siempre solo «Huésped», nunca una identidad), limpiezas con nombres, check-in y check-out con la persona de recepción, solicitudes de servicio. También aparece «Limpieza no terminada (tiempo límite)»: el historial es el registro del trabajo y la herramienta ante las quejas.',
          },
          {
            frage: '¿Por qué la ficha muestra «Limpieza desde las 11:00» y no aparece en el panel?',
            antwort: 'La limpieza pasa a estar disponible a esa hora. O bien el huésped eligió «no antes de» en el portal, o bien pidió en la puerta a la persona de limpieza que volviera más tarde. El historial de la habitación indica cuál de los dos. Hasta entonces, la habitación no está disponible para limpieza en ninguno de los dos paneles; se abre sola a la hora indicada. Hasta cuándo pueden aplazar los huéspedes en el portal se ajusta en Establecimiento y normas.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Solicitudes',
            hinweis: 'Qué hay detrás de la campana y del número',
            ziel: { art: 'thema', id: 'anfragen' },
          },
          {
            label: 'Carteles y hojas de check-in',
            hinweis: 'La hoja de check-in en el check-in',
            ziel: { art: 'thema', id: 'aushang' },
          },
          {
            label: 'Lo que ve el huésped',
            hinweis: 'La simulación del portal de huéspedes',
            ziel: { art: 'thema', id: 'gast' },
          },
        ],
      },
    ],
  },
  anfragen: {
    title: 'Solicitudes',
    subtitle: 'El panel de recepción: abiertas, realizadas, no realizadas, y lo que eso significa para el resumen',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Las solicitudes del portal de huéspedes llegan aquí, las más antiguas primero. Una solicitud está abierta o cerrada: no existe «en curso» ni asignación a una persona; el panel es el mismo para todo el personal de recepción.',
          'Las solicitudes nuevas aparecen solas, sin recargar.',
        ],
      },
      {
        art: 'legende',
        titel: 'Símbolos del panel',
        eintraege: [
          {
            zeichen: { art: 'pille', text: 'urgente', ton: 'critical', icon: 'siren' },
            label: 'Urgente',
            text: 'El servicio está marcado como «urgente» en el catálogo de servicios. La solicitud tiene un borde rojo intermitente, la ficha de la habitación una campana intermitente, y el número de la navegación parpadea.',
          },
          {
            zeichen: { art: 'pille', text: 'no realizada', ton: 'outline' },
            label: 'No realizada',
            text: 'La solicitud seguía abierta en el check-out y se cerró sin que nadie la atendiera. Sigue visible y figura sin importe en el resumen; de lo contrario desaparecería algo que el huésped quizá aún mencione.',
          },
          {
            zeichen: { art: 'pille', text: 'Realizada', ton: 'positive', icon: 'check' },
            label: 'Realizada',
            text: 'El servicio se prestó. Si la solicitud tiene precio, figura en el resumen del check-out. Se registran la hora y su nombre.',
          },
          {
            zeichen: { art: 'symbol', id: 'orders' },
            text: 'Así se ve una solicitud abierta en la ficha de la habitación de la vista general.',
          },
          { zeichen: { art: 'symbol', id: 'urgent' } },
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'He pulsado «Realizada» por error. ¿Puedo deshacerlo?',
            antwort: 'No, a propósito no hay vuelta atrás; la marca es un hecho con hora y nombre. La solicitud figura entonces con su importe en el resumen; aclare la partida con el huésped en el check-out.',
          },
          {
            frage: '¿Por qué ha desaparecido una solicitud tras el check-out?',
            antwort: 'No ha desaparecido: se ha cerrado como «no realizada» y aparece en «Cerradas recientemente». Las solicitudes pertenecen a la estancia, no a la habitación; de lo contrario, mañana el panel mostraría una solicitud para una habitación vacía.',
          },
          {
            frage: '¿Qué es un «Aviso» y por qué sigue abierto?',
            antwort: 'Una marca del servicio en el catálogo de servicios, pensada para averías: esas solicitudes pertenecen a la habitación, no a la estancia. Sobreviven al check-out, no figuran en ningún resumen (ni siquiera con precio) y el siguiente check-in avisa de ellas. Un grifo roto no deja de existir porque el huésped se vaya.',
          },
          {
            frage: '¿Puedo asignar una solicitud a alguien del equipo?',
            antwort: 'No, a propósito. RoSe no planifica al personal; quien esté en recepción ve el mismo panel. Quien atiende algo lo marca: un panel de recepción no necesita más coordinación.',
          },
          {
            frage: '¿Cuánto tiempo siguen visibles las solicitudes cerradas?',
            antwort: 'Las 20 más recientes aparecen plegadas debajo de las abiertas. Más allá, cada solicitud sigue disponible 30 días en el historial de la habitación y, si tenía precio, en el resumen de la estancia.',
          },
          {
            frage: 'El huésped dice que ha pedido algo, pero aquí no hay nada.',
            antwort: 'Compruebe en el historial de la habitación si llegó una solicitud. Las causas más habituales: el huésped canceló antes de enviar, o usó una ficha de «Enlaces útiles», como un servicio de comida a domicilio, que lleva a un sitio externo y no crea ninguna solicitud.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Catálogo de servicios',
            hinweis: 'El catálogo: precios, «urgente», «Aviso»',
            ziel: { art: 'thema', id: 'services' },
          },
          {
            label: 'Vista general de habitaciones',
            hinweis: 'Marcar también en la ventana de la habitación',
            ziel: { art: 'thema', id: 'uebersicht' },
          },
        ],
      },
    ],
  },
  zimmer: {
    title: 'Habitaciones y plantas',
    subtitle: 'Crear, corregir, poner fuera de servicio, eliminar, y lo que se va con ello cada vez',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Las habitaciones se crean planta por planta: números en lista («201, 202, 205») o en rango («101-110»), opcionalmente con el número de planta delante. Debajo del formulario ve de antemano lo que se va a crear; no se guarda nada hasta que haga clic.',
          'Habitaciones, plantas y edificios abren la misma ventana con las mismas tres opciones: editar, poner fuera de servicio, eliminar.',
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: '¿Para qué sirve el edificio?',
            antwort: 'Solo para establecimientos con alas realmente separadas. Afecta a la unicidad: los números de habitación deben ser únicos por edificio, así que «101» puede existir en el edificio principal y en el anexo. Sin alas, déjelo vacío.',
          },
          {
            frage: '¿Cuándo usar «Anteponer el número de planta»?',
            antwort: 'Cuando todas las plantas usan el mismo rango de números: la planta 2 y «05» dan «205». Sin la casilla, los números chocan a partir de la segunda planta; la página le avisa de antemano.',
          },
          {
            frage: 'Un número está mal. ¿Eliminar y volver a crear?',
            antwort: 'No: edítelo. Número, planta y edificio se pueden cambiar sin perder historial, estancias ni registros de trabajo; todo pertenece a la habitación, no a su número. Eliminar es para habitaciones creadas por error y sin historial.',
          },
          {
            frage: '¿Fuera de servicio o eliminar?',
            antwort: 'Para reformas o cierres temporales, recomendamos marcar la habitación como «Fuera de servicio»: no admite check-in, no aparece en el panel de limpieza ni en los carteles, y se conserva todo su historial. Un clic la vuelve a poner en servicio, y el número de habitación sigue reservado. Eliminar una habitación es definitivo y libera el número.',
          },
          {
            frage: '¿Qué se va con la eliminación?',
            antwort: 'La ventana lo indica en cifras de antemano: estancias, solicitudes de servicio con su total, entradas del historial, y los carteles de la habitación dejan de funcionar. Los registros de limpieza se conservan y solo pierden la referencia a la habitación: las estadísticas siguen completas. Una habitación ocupada no se puede eliminar; un área con historial exige escribir su nombre.',
          },
          {
            frage: '¿Cuenta para la facturación una habitación fuera de servicio?',
            antwort: 'En el mes en curso sí, si estuvo en servicio durante él, aunque fuera brevemente; a partir del primer mes completo fuera de servicio, ya no. Antes de cada eliminación se fija el número de habitaciones de los meses cerrados, así que una habitación eliminada nunca falta con efecto retroactivo en ninguna factura.',
          },
          {
            frage: '¿Habitaciones nuevas, pero sin cartel?',
            antwort: 'Solo con el código QR fijo por habitación: el cartel se crea por habitación. Tras crear habitaciones, abra una vez los carteles de habitación (al final de la página Acceso de huéspedes): el botón que hay allí crea de una vez los códigos que faltan.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Carteles y hojas de check-in',
            hinweis: 'Crear códigos para habitaciones nuevas',
            ziel: { art: 'thema', id: 'aushang' },
          },
          {
            label: 'Plan y facturación',
            hinweis: 'Cómo se cuentan las habitaciones',
            ziel: { art: 'thema', id: 'konto' },
          },
        ],
      },
    ],
  },
  regeln: {
    title: 'Establecimiento y normas',
    subtitle: 'Zona horaria, limpieza diaria, hora de check-out, aplazamiento, franja horaria, PIN, tiempo límite, dirección, logotipo, opinión, moneda',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Las normas se aplican a todo desde el momento en que guarda. Las estancias en curso, las solicitudes ya hechas y los PIN ya entregados siguen sin cambios: nada se convierte con efecto retroactivo.',
          'Nada se guarda automáticamente. En cuanto cambia algo, aparece en la parte inferior de la pantalla una barra «Cambios sin guardar» con Guardar y Descartar; si sale de la página antes de guardar, se le pedirá confirmación.',
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: '¿Por qué es tan importante la zona horaria?',
            antwort: 'Todas las horas de esta página se refieren a ella. Con una zona horaria equivocada, la limpieza diaria vence a la hora incorrecta, la franja horaria se desplaza, «limpiada hoy» se reinicia de noche a la hora incorrecta y los límites de día de las estadísticas son erróneos.',
          },
          {
            frage: '¿Limpiar a diario las habitaciones ocupadas, sí o no?',
            antwort: 'Desactivado por defecto: las habitaciones se limpian a petición del huésped y tras el check-out. Eso ahorra agua, detergente y tiempo de trabajo, y forma parte de la promesa de sostenibilidad. Si está activado, las habitaciones ocupadas aparecen solas en el panel a partir del día siguiente a la llegada, a la hora elegida, salvo con «No molestar», «Hoy sin limpieza», el día de salida y si la habitación ya se ha limpiado hoy. Si el huésped ha hecho una solicitud él mismo, vale su solicitud.',
          },
          {
            frage: '¿Para qué sirve «Check-out hasta»?',
            antwort: 'Mientras RoSe no sepa si el huésped se va hoy, la limpieza diaria no vence antes de esa hora. Así ninguna habitación de salida se limpia antes del check-out y luego otra vez. Si la estancia tiene fecha de salida, los días anteriores se aplica la hora normal, y el día de salida se suspende la limpieza diaria. La hoja de check-in indica la hora que se aplica sin fecha de salida.',
          },
          {
            frage: '¿Para qué sirve «Check-in a partir de»?',
            antwort: 'Las habitaciones de salida deben estar listas para entonces. El panel de limpieza compara el trabajo de las salidas pendientes con el tiempo que queda hasta el check-in y con las personas de limpieza en turno. Cuanto más justo vaya, más recomienda las plantas con salidas e incluso propone cambiar a mitad de una planta. Una prioridad fijada por recepción va siempre primero.',
          },
          {
            frage: '«No antes de»: ¿cómo elijo el límite?',
            antwort: 'El huésped quiere limpieza, pero no antes de cierta hora. Puede elegir horas en punto entre ahora y su límite. Fíjelo de modo que la limpieza aún caiga dentro del turno: limpieza hasta las 15:00 significa un límite a las 13:00. También puede desactivarlo; entonces el portal no ofrece ninguna hora y la solicitud vale de inmediato.',
          },
          {
            frage: '¿Por qué una franja horaria para las solicitudes de limpieza?',
            antwort: 'Fuera de la franja, el huésped no puede enviar una solicitud y ve su horario de limpieza. Solo afecta a la solicitud: «No molestar» y retirar la solicitud siguen siendo posibles en todo momento, y las solicitudes ya hechas siguen vigentes. Una franja que pasa de medianoche (22:00–06:00) se interpreta correctamente.',
          },
          {
            frage: '¿Qué pasa si se olvida terminar una limpieza?',
            antwort: 'Si una limpieza empezada no se termina, la habitación se vuelve a abrir sola tras el tiempo límite, y el historial muestra «Limpieza no terminada (tiempo límite, nombre)». El límite debe estar claramente por encima de la limpieza real más larga: 90 minutos por defecto.',
          },
          {
            frage: 'Cambiar la longitud del PIN: ¿qué pasa con las estancias en curso?',
            antwort: 'Nada. La longitud solo se aplica a los PIN nuevos; cada estancia en curso conserva el suyo. Por defecto son seis cifras; más corto es más cómodo, más largo más seguro, además del bloqueo tras cinco intentos fallidos.',
          },
          {
            frage: 'Nuestro establecimiento no cobra en euros: ¿es posible?',
            antwort: 'Sí. En «Moneda de los precios de servicios» elige la moneda en la que introduce los precios en el catálogo de servicios; huéspedes, recepción y resumen de check-out la muestran así. Cada solicitud guarda su moneda, de modo que las solicitudes antiguas siguen como estaban. Los precios existentes no se convierten al cambiar. Solo puede cambiarla mientras no haya ningún huésped con check-in.',
          },
          {
            frage: '¿Dónde ven los huéspedes el enlace para dejar una opinión?',
            antwort: 'En dos lugares: a partir del segundo día de la estancia, como una línea discreta al final del portal de huéspedes, y tras el check-out en una página de agradecimiento que aparece durante una semana si el huésped vuelve a abrir el portal. El botón nombra la plataforma si se deduce del enlace (Google, Tripadvisor, Booking.com, HolidayCheck). RoSe no pregunta antes, a propósito, por la satisfacción: Google prohíbe enviar a opinar solo a los huéspedes satisfechos.',
          },
          {
            frage: '¿Puedo cambiar la dirección del establecimiento?',
            antwort: 'Sí, el nombre corto de la dirección se puede cambiar. Los códigos QR impresos siguen siendo válidos porque llevan su propia clave. Solo quien escribió la dirección a mano o tiene una hoja de check-in antigua con la dirección escrita no llegará: las páginas de inicio de sesión para huéspedes y limpieza están bajo el nuevo nombre.',
          },
          {
            frage: '¿Qué cambia «Actividades de limpieza: solo como equipo»?',
            antwort: 'Las estadísticas muestran entonces solo el total del establecimiento (suma de los turnos), sin tabla «Por persona de limpieza» ni registro diario; el historial de la habitación muestra «Equipo de limpieza» en lugar de un nombre. Los registros pierden su persona al terminar el turno, a más tardar tras 24 horas; al cambiar el ajuste, también todos los existentes. El ajuste se puede revertir, pero los nombres de los registros anonimizados no se pueden recuperar. Lo que queda: cuándo se limpió cada habitación, cuántos turnos hubo y las indicaciones en directo para la coordinación (quién está en qué planta ahora mismo). Si solo hay una persona de limpieza en turno, la atribución es evidente de todos modos: ningún ajuste puede cambiar eso.',
          },
          {
            frage: '¿Qué requisitos tiene el logotipo?',
            antwort: 'PNG, JPG o SVG de hasta 1 MB. Aparece en el cartel de habitación y la hoja de check-in con 55 × 16 mm como máximo; por debajo de unos 400 px de ancho se ve borroso. La vista previa tiene fondo blanco; de lo contrario, un logotipo claro pensado para fondos oscuros sería invisible en papel. Sin logotipo, las hojas muestran el nombre del establecimiento.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Acceso de huéspedes',
            hinweis: 'PIN o enlace personal, idiomas de las hojas',
            ziel: { art: 'thema', id: 'gastzugang' },
          },
          {
            label: 'Lo que ve el huésped',
            hinweis: 'Cómo funcionan el aplazamiento y la franja horaria en el portal',
            ziel: { art: 'thema', id: 'gast' },
          },
        ],
      },
    ],
  },
  gastzugang: {
    title: 'Acceso de huéspedes',
    subtitle: 'Código QR fijo por habitación con PIN o acceso personal por estancia, idiomas de las hojas, carteles de habitación',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Hay dos formas de acceder al portal de huéspedes, a elegir por cada establecimiento. Con un código QR fijo por habitación, el código se imprime una vez y se coloca en la habitación, y cada estancia recibe su propio PIN. Con el acceso personal, cada estancia recibe su propio código o enlace, sin PIN; caduca con el check-out.',
          'El método y los idiomas solo surten efecto al guardar. Si ha cambiado algo, una barra «Cambios sin guardar» en la parte inferior de la pantalla guarda o descarta ambas secciones a la vez. Solo la confirmación del valor por defecto se hace con el botón situado bajo las dos tarjetas.',
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: '¿Qué método nos conviene?',
            antwort: 'Elija código QR fijo + PIN si puede colocar un cartel en cada habitación y quiere un acceso de dos factores (el código en la habitación y el PIN de recepción). Elija el acceso personal si los carteles no son prácticos o no se desean. Es más cómodo para los huéspedes, pero cualquiera que vea la hoja puede entrar en el portal de esa estancia. La página compara ambos en detalle.',
          },
          {
            frage: '¿Qué pasa con las estancias en curso si cambio?',
            antwort: 'Nada. El método se registra con la estancia en el check-in. Los PIN y enlaces ya entregados siguen funcionando hasta el check-out; solo el siguiente check-in sigue el nuevo método. No hay fecha de cambio ni nada que convertir.',
          },
          {
            frage: '¿Por qué no hay un PIN de reserva con el acceso personal?',
            antwort: 'Un PIN que nadie conoce sería una segunda entrada sin ninguna ventaja, y un punto de ataque más. La estancia tiene exactamente el acceso que el huésped tiene en la mano.',
          },
          {
            frage: 'El huésped quiere recibir el acceso por correo electrónico.',
            antwort: 'En la ventana de la habitación, la hoja de check-in se puede enviar por correo electrónico. La dirección no se guarda; la estancia sigue siendo anónima. El correo contiene el enlace, no una imagen QR, porque muchos programas de correo no muestran imágenes incrustadas. Debajo del botón ve si el correo se entregó o se rechazó, y por qué.',
          },
          {
            frage: '¿Por qué solo uno o dos idiomas en papel?',
            antwort: 'Las hojas explican el portal con imágenes de sus botones; el texto va en un idioma principal y, si se desea, en un segundo. Más idiomas ayudan poco: por cada uno que hay en la hoja faltan muchos otros, y la hoja se convierte en un formulario. Quien no lee ninguno de los dos entra en el portal mediante las imágenes y el código QR; allí ve su idioma si el portal lo ofrece, y si no, traduce con su teléfono. El primer idioma es el idioma de reserva del establecimiento (todo huésped cuyo idioma del teléfono no ofrezca el portal lo ve también en el portal de huéspedes) y también el idioma del correo de acceso.',
          },
          {
            frage: '¿Dónde están los carteles de habitación?',
            antwort: 'Al final de esta página, solo con el método de PIN. Con el acceso personal llevarían a una entrada de PIN que los huéspedes nuevos no pueden usar; con el método de PIN, la recepción llega a ellos mediante su ficha en los ajustes.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Carteles y hojas de check-in',
            hinweis: 'Formatos, validez, impresión',
            ziel: { art: 'thema', id: 'aushang' },
          },
          {
            label: 'Lo que ve el huésped',
            hinweis: 'La simulación del portal',
            ziel: { art: 'thema', id: 'gast' },
          },
        ],
      },
    ],
  },
  aushang: {
    title: 'Carteles y hojas de check-in',
    subtitle: 'Cartel de habitación, hoja de check-in, tarjeta de acceso: de dónde salen, cuánto tiempo valen, qué los invalida',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Tres tipos de impresos se crean en lugares distintos: un cartel por habitación (en Acceso de huéspedes o «Carteles de habitación»), una hoja de check-in por estancia (en la ventana de la habitación tras el check-in) y una tarjeta de acceso por persona de limpieza (en Personal).',
          'El cartel de habitación y la hoja de check-in son la misma hoja en dos formatos (A4 o cuatro tarjetas compactas por página) y solo se diferencian en el bloque de acceso: código fijo con «Recibirá su PIN en el check-in» frente al acceso de esta estancia.',
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: '¿A4 o compacto?',
            antwort: 'A4 para marcos, expositores y carpetas; compacto (92 × 130 mm, cuatro por página para recortar) para colgadores de puerta y el mostrador. La elección depende de la ocasión y no se guarda. El código QR se dimensiona según la distancia de lectura: 55 mm en A4, 42 mm en compacto.',
          },
          {
            frage: '¿Por qué no hay hora de limpieza en el cartel de habitación?',
            antwort: 'El cartel de habitación se queda colocado de forma permanente. Una norma impresa queda obsoleta sin que nadie lo note en cuanto el establecimiento cambia sus normas de limpieza, y entonces hay 200 carteles equivocados. La norma y las horas solo figuran en la hoja de check-in, que se crea de nuevo en cada check-in.',
          },
          {
            frage: 'La impresión sale sin colores.',
            antwort: 'Los navegadores no imprimen los colores de fondo por defecto. Las hojas están diseñadas para que el color aparezca solo en líneas y tonos claros con texto oscuro, así que siguen siendo legibles en escala de grises. Para imprimir en color, active «Gráficos de fondo» en el cuadro de diálogo de impresión.',
          },
          {
            frage: 'Ha desaparecido un cartel de habitación.',
            antwort: '«Renovar código» crea un código nuevo para esa habitación e invalida el cartel antiguo. Solo el titular de la cuenta y los gerentes pueden hacerlo, y solo afecta a una habitación. Imprima después el cartel nuevo.',
          },
          {
            frage: 'El correo de acceso acaba en la carpeta de spam del huésped.',
            antwort: 'Con algunos proveedores de correo, los remitentes nuevos acaban más a menudo en spam al principio; no es culpa del establecimiento. Pida al huésped que mire allí. Si se rechaza una dirección, el motivo aparece debajo del botón; lo más habitual es un error tipográfico en la dirección. Imprimir es siempre la salida.',
          },
          {
            frage: 'Se ha perdido una tarjeta de acceso.',
            antwort: 'Emita una nueva en Personal: nuevo PIN y nuevo código en un solo paso, y la tarjeta antigua deja de funcionar. La tarjeta sobrevive a «Finalizar acceso» y vuelve a funcionar tras la reactivación.',
          },
          {
            frage: '¿Por qué no encuentro los carteles de habitación?',
            antwort: 'Su establecimiento usa el acceso personal por estancia. En ese caso no hay código fijo por habitación, y el huésped recibe su hoja en el check-in desde la ventana de la habitación.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Acceso de huéspedes',
            hinweis: 'Método e idiomas de las hojas',
            ziel: { art: 'thema', id: 'gastzugang' },
          },
          {
            label: 'Personal',
            hinweis: 'Emitir tarjetas de acceso',
            ziel: { art: 'thema', id: 'personal' },
          },
        ],
      },
    ],
  },
  personal: {
    title: 'Personal',
    subtitle: 'Limpieza, recepción, gerentes: cuentas, invitaciones, tarjetas de acceso, finalizar y eliminar',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Tres tipos de personal en un solo lugar. Las personas de limpieza reciben un nombre de usuario y un PIN (sin correo electrónico) y una tarjeta de acceso; recepción y gerentes se invitan por correo electrónico y fijan su propia contraseña. Los tres siguen el mismo esquema: finalizar el acceso (reversible) o eliminar definitivamente (con las consecuencias indicadas en cifras).',
        ],
      },
      {
        art: 'legende',
        titel: 'Botones de la fila',
        eintraege: [
          {
            zeichen: { art: 'icon', id: 'printer', ton: 'neutral' },
            label: 'Imprimir tarjeta',
            text: 'La tarjeta de acceso de la persona de limpieza con código QR y credenciales: se escanea una vez y ya está la sesión iniciada.',
          },
          {
            zeichen: { art: 'icon', id: 'idcard', ton: 'neutral' },
            label: 'Nueva tarjeta',
            text: 'Nuevo PIN y nuevo código QR en un solo paso; la tarjeta antigua deja de funcionar de inmediato. La solución en caso de pérdida o de PIN olvidado.',
          },
          {
            zeichen: { art: 'icon', id: 'pencil', ton: 'neutral' },
            label: 'Editar',
            text: 'Nombre visible; en limpieza, también el nombre de usuario.',
          },
          {
            zeichen: { art: 'icon', id: 'userminus', ton: 'caution' },
            label: 'Finalizar acceso',
            text: 'El inicio de sesión se bloquea de inmediato y una sesión abierta también termina. No se pierde nada; «Reactivar» lo deshace.',
          },
          {
            zeichen: { art: 'icon', id: 'trash', ton: 'critical' },
            label: 'Eliminar definitivamente',
            text: 'La ventana indica de antemano lo que se va con ello. Para personas de limpieza con historial, hay que escribir el nombre de usuario.',
          },
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'La persona de limpieza es rechazada con el PIN correcto.',
            antwort: 'Casi siempre, en el campo «Nombre de usuario» está el nombre visible. El inicio de sesión usa el nombre de usuario corto que figura en la tarjeta de acceso, en «Credenciales». Segunda causa: el acceso se ha finalizado; en ese caso la página de inicio de sesión lo indica.',
          },
          {
            frage: '¿PIN olvidado?',
            antwort: 'Emita una nueva tarjeta de acceso: así se crean un nuevo PIN y un nuevo código QR en un solo paso; la tarjeta antigua deja de funcionar. No hay forma de «consultar» un PIN.',
          },
          {
            frage: 'La invitación no ha llegado.',
            antwort: 'Debajo del botón de envío ve el estado de entrega: entregado al servidor, recibido o rechazado, con el motivo del servidor destinatario. Lo más habitual es un error tipográfico en la dirección. Tras un rechazo, se puede desbloquear la dirección y volver a enviar el correo; y existe «Mostrar enlace de invitación» para entregar el enlace por mensajería o en papel. Entre dos correos a la misma persona hay que esperar un minuto.',
          },
          {
            frage: '¿Finalizar el acceso o eliminar?',
            antwort: 'Finalizar, casi siempre. El registro del trabajo sigue completo, las estadísticas siguen mostrando a la persona, y volver es un clic. En el caso de las personas de limpieza, eliminar se lleva los registros; por eso se pide escribir el nombre de usuario como salvaguarda. En recepción y gerentes, la cuenta de inicio de sesión se conserva en cuanto tiene operaciones vinculadas; la ventana lo indica de antemano.',
          },
          {
            frage: '¿Qué puede hacer recepción y qué puede hacer un gerente?',
            antwort: 'Recepción: check-in y check-out, prioridades, solicitudes, impresión de hojas de check-in, tarjetas y carteles, contraseña propia. No: ajustes, habitaciones, servicios, personal, «Renovar código». Gerente: los mismos derechos que el titular de la cuenta dentro del establecimiento, pero sin acceso a la cuenta ni a la facturación. Solo el titular de la cuenta nombra gerentes.',
          },
          {
            frage: 'Una persona debe ocuparse de varios establecimientos.',
            antwort: 'Añádala en cada establecimiento. A partir de la segunda vez, la elige entre los gerentes existentes de la cuenta, sin cuenta nueva. «Finalizar acceso» solo afecta al establecimiento en cuestión.',
          },
          {
            frage: '¿Por qué las personas de limpieza no necesitan dirección de correo electrónico?',
            antwort: 'Inician sesión con nombre de usuario y PIN o con su tarjeta; un buzón sería un obstáculo sin utilidad. El nombre de usuario solo es único en este establecimiento: el mismo puede existir en otro establecimiento.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'El panel de limpieza',
            hinweis: 'Lo que ve la persona de limpieza tras iniciar sesión',
            ziel: { art: 'thema', id: 'reinigung' },
          },
          {
            label: 'Estadísticas',
            hinweis: 'Tiempos de trabajo a partir de los registros',
            ziel: { art: 'thema', id: 'auswertung' },
          },
        ],
      },
    ],
  },
  services: {
    title: 'Catálogo de servicios',
    subtitle: 'El catálogo de servicios: servicios, opciones, precios, «urgente», «Aviso»',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Un servicio requiere pocos datos: un nombre («Desayuno en la habitación») y, opcionalmente, un precio, o bien opciones entre las que elige el huésped («Servicio de lavandería»: camisa, pantalón), cada una con su propio precio. Dos marcas controlan el proceso, nada más: ni categorías ni responsables.',
        ],
      },
      {
        art: 'legende',
        titel: 'Las dos marcas',
        eintraege: [
          {
            zeichen: { art: 'pille', text: 'urgente', ton: 'critical', icon: 'siren' },
            label: 'Urgente: cuánto se hace notar',
            text: 'Las solicitudes correspondientes parpadean en rojo: en la ficha de la habitación, en la página «Solicitudes» y como número en la navegación. Para todo lo que no puede esperar.',
          },
          {
            zeichen: { art: 'pille', text: 'Aviso', ton: 'neutral' },
            label: 'Aviso: a quién pertenece',
            text: 'La solicitud pertenece a la habitación, no a la estancia: sigue abierta tras el check-out, no figura en ningún resumen y el siguiente check-in avisa de ella. Para averías; el mantenimiento es el caso típico.',
          },
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: '¿Para qué sirve un precio?',
            antwort: 'El huésped lo ve al hacer la solicitud, y en el check-out el servicio prestado figura con él en el resumen. Un servicio sin opciones lleva su propio precio; si tiene opciones, se aplican los precios de estas. Sin precio, una solicitud no figura en ningún resumen: lo que no cuesta nada no hace falta revisarlo. RoSe no contabiliza ni cobra nada; suma.',
          },
          {
            frage: '¿Cómo reciben los huéspedes los servicios en su idioma?',
            antwort: 'Usted crea cada servicio en su idioma principal. Debajo del servicio, unas etiquetas de idioma muestran a qué idiomas del portal de huéspedes ya está traducido; al pulsar un idioma se abren los campos para nombre, descripción y opciones, con el texto original debajo de cada uno. Puede traducir con la herramienta que prefiera. Si falta una traducción, el huésped ve el texto original, nunca un campo vacío. Recepción ve siempre las solicitudes en el idioma principal. Los servicios de ejemplo ya están traducidos.',
          },
          {
            frage: 'Cambio el nombre de un servicio. ¿Afecta eso a las solicitudes antiguas?',
            antwort: 'No. Nombre, opciones y precios quedan fijados en el momento de la solicitud; las solicitudes y los resúmenes antiguos siguen como estaban. La marca «Aviso», en cambio, afecta también de inmediato a las solicitudes abiertas: decide un comportamiento, no el contenido de un justificante.',
          },
          {
            frage: '¿Archivar o eliminar?',
            antwort: 'Archivar. El servicio desaparece del portal y las solicitudes antiguas se conservan completas. Los servicios de ejemplo son servicios totalmente normales y se archivan igual.',
          },
          {
            frage: '¿Puede un servicio permitir varias opciones a la vez?',
            antwort: 'Sí: el huésped elige tantas opciones como quiera y puede añadir una nota. Una solicitud es un servicio con las opciones elegidas.',
          },
          {
            frage: '¿Ve el huésped también los servicios sin opciones?',
            antwort: 'Sí, entonces elige el servicio en su conjunto, pidiéndolo o avisando, por ejemplo en el mantenimiento, que no necesita opciones.',
          },
          {
            frage: '¿Qué es un «Enlace»?',
            antwort: 'Una ficha del portal de huéspedes que lleva a un sitio web externo, como una aplicación de propinas para el equipo de limpieza, un servicio de comida a domicilio o un servicio de taxi. Un enlace no crea ninguna solicitud, así que no aparece nada en la página Solicitudes ni en el resumen de la estancia. Las plantillas rellenan el formulario; ajuste la dirección a su cuenta o a su ciudad. El portal solo enlaza con el servicio externo; su contenido es responsabilidad del proveedor.',
          },
          {
            frage: '¿Puede el huésped dar una propina personalmente a la persona de limpieza?',
            antwort: 'No a través de RoSe. El portal de huéspedes no muestra nombres, y un enlace vale para todo el establecimiento: las aplicaciones de propinas reparten dentro del equipo. Que las propinas por una aplicación sigan exentas de impuestos depende del método de pago de la aplicación, no de RoSe.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Solicitudes',
            hinweis: 'Qué ocurre con las solicitudes',
            ziel: { art: 'thema', id: 'anfragen' },
          },
          {
            label: 'Lo que ve el huésped',
            hinweis: 'La solicitud desde el punto de vista del huésped',
            ziel: { art: 'thema', id: 'gast' },
          },
        ],
      },
    ],
  },
  reinigung: {
    title: 'El panel de limpieza',
    subtitle: 'Colores, estados, deslizadores, plantas: lo que ve la persona de limpieza en su teléfono y por qué',
    bloecke: [
      {
        art: 'legende',
        titel: 'La barra sobre el número',
        hinweis: 'En el panel de limpieza no hay verde «lista»: allí el verde significa «en curso».',
        eintraege: [
          { zeichen: { art: 'balken', id: 'priority' } },
          { zeichen: { art: 'balken', id: 'working' } },
          { zeichen: { art: 'balken', id: 'checkout' } },
          { zeichen: { art: 'balken', id: 'wanted' } },
          { zeichen: { art: 'balken', id: 'neutral' } },
        ],
      },
      {
        art: 'legende',
        titel: 'Los símbolos de la ficha',
        eintraege: [
          { zeichen: { art: 'symbol', id: 'occupied' } },
          { zeichen: { art: 'symbol', id: 'departure' } },
          { zeichen: { art: 'symbol', id: 'dnd' } },
          { zeichen: { art: 'symbol', id: 'clean' } },
          { zeichen: { art: 'symbol', id: 'deferred' } },
          { zeichen: { art: 'symbol', id: 'declined' } },
          { zeichen: { art: 'symbol', id: 'routine' } },
          { zeichen: { art: 'symbol', id: 'checkout' } },
          { zeichen: { art: 'symbol', id: 'priority' } },
          { zeichen: { art: 'symbol', id: 'cleaning' } },
        ],
      },
      {
        art: 'legende',
        titel: 'Barra de estado y plantas',
        eintraege: [
          {
            zeichen: { art: 'pille', text: 'En turno desde las 07:02', ton: 'positive' },
            label: 'En turno',
            text: 'El turno está en marcha; se pueden empezar limpiezas.',
          },
          {
            zeichen: { art: 'pille', text: 'Pausa', ton: 'caution' },
            label: 'Pausa',
            text: 'Un periodo dentro del turno; mientras tanto no se pueden hacer limpiezas. Al terminar la pausa, el turno continúa.',
          },
          {
            zeichen: { art: 'pille', text: 'Otra limpieza', ton: 'attention' },
            label: 'Otra limpieza',
            text: 'Pasillos, vestíbulo, sala de desayunos: trabajo sin habitación, como periodo. Empezar la limpieza de una habitación la termina automáticamente.',
          },
          {
            zeichen: { art: 'pille', text: 'Fuera de turno', ton: 'neutral' },
            label: 'Fuera de turno',
            text: 'Antes de empezar el turno y después de terminarlo. El panel no muestra nada que hacer.',
          },
          {
            zeichen: { art: 'pille', text: 'Siguiente', ton: 'action', icon: 'target', blink: true },
            label: 'Siguiente',
            text: 'Una recomendación, no una asignación: primero una planta con una prioridad abierta; si no, la planta con la mayor urgencia pendiente dividida entre el número de personas de limpieza que hay allí más uno. Las salidas pesan más a medida que se acerca el check-in. En caso de empate se propone la planta inferior, para que la recomendación no salte de un lado a otro.',
          },
          {
            zeichen: { art: 'pille', text: 'Prio', ton: 'accent', icon: 'flag' },
            label: 'Prio en la planta',
            text: 'Una limpieza prioritaria espera en la planta; la fila parpadea en violeta.',
          },
          {
            zeichen: { art: 'pille', text: 'Prioridad abierta', ton: 'accent', icon: 'siren', blink: true },
            label: 'Piloto en la barra de estado',
            text: 'Hay una prioridad abierta en otra planta. Solo es una indicación, no un botón: la planta se cambia con el deslizador.',
          },
          {
            zeichen: { art: 'icon', id: 'users', ton: 'neutral' },
            label: 'Nombres en la planta',
            text: 'Quién del equipo está registrado allí. El nombre aparece también en la vista general de recepción.',
          },
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'El deslizador no se activa.',
            antwort: 'El gesto tiene que empezar en el tirador y recorrer casi toda la pista (97 %). Un toque en cualquier punto de la pista o un tirón corto no hacen nada, a propósito: un teléfono en el bolsillo del delantal no debe empezar una limpieza. «Salir de la planta» va de derecha a izquierda.',
          },
          {
            frage: '¿Por qué una habitación aparece en gris?',
            antwort: 'No está bloqueada, simplemente no tiene tarea: libre, ocupada sin solicitud, «No molestar», sin limpieza deseada hoy (hoja) o una limpieza que solo vale más tarde («desde las 11:00»). Sigue visible para que la planta esté completa. A la hora fijada, una solicitud aplazada pasa sola a abierta.',
          },
          {
            frage: 'El huésped está en la habitación y no quiere limpieza ahora: ¿qué hace la persona de limpieza?',
            antwort: 'Tocar la habitación sin empezar: «En 30 min», «En 1 h» o «Hoy no». «En 30 min» y «En 1 h» retiran la habitación del panel hasta esa hora, para todo el equipo (nadie vuelve a llamar entretanto), y después vuelve a estar abierta sola. «Hoy no» resuelve la habitación por hoy sin contar como limpieza. Si el huésped aun así quiere limpieza, la pide en el portal; entonces vuelve a estar abierta.',
          },
          {
            frage: 'Se olvidó terminar.',
            antwort: 'Tras el tiempo límite fijado por el establecimiento (90 minutos por defecto), la habitación se vuelve a abrir sola; el historial muestra «Limpieza no terminada (tiempo límite, nombre)». La limpieza no cuenta entonces como hecha en las estadísticas, así que el deslizador de fin siempre merece la pena.',
          },
          {
            frage: '¿Qué significa «No molestar» retirado 9:40?',
            antwort: 'El huésped desactivó «No molestar» hoy a las 9:40, y la habitación no se ha limpiado desde entonces. Normalmente significa que acaba de salir. Por eso el panel cuenta la habitación como una solicitud de limpieza: la ocasión puede cerrarse de nuevo si el huésped vuelve y cuelga otra vez el cartel, por ejemplo después de comer.',
          },
          {
            frage: 'El panel propone cambiar de planta: ¿por qué?',
            antwort: 'Después de cada habitación, el panel vuelve a calcular. Propone cambiar de planta si hay en otro sitio una habitación con una prioridad abierta, o si la carga de otra planta es claramente mayor que la de la actual, normalmente porque allí esperan salidas y se acerca el check-in. En días tranquilos es poco frecuente. La persona de limpieza decide si cambia; el control de cambio es un deslizador, y quien se queda en la planta actual simplemente sigue trabajando.',
          },
          {
            frage: '¿Por qué elegir primero una planta?',
            antwort: 'Elegir una planta significa registrarse en ella: el equipo y recepción ven quién trabaja dónde, y la recomendación «Siguiente» lo tiene en cuenta. Un toque por error no debe sacar a nadie de la planta; por eso la salida es un deslizador.',
          },
          {
            frage: '¿Pueden coincidir una pausa y otra limpieza?',
            antwort: 'No: ambas son periodos dentro del turno y no pueden solaparse con nada. Empezar una pausa termina otra limpieza en curso, y terminar el turno termina ambas. Todos los cambios están en la página «Estado», no en el panel.',
          },
          {
            frage: 'Inicio de sesión rechazado aunque el PIN es correcto.',
            antwort: 'El campo contiene el nombre visible en lugar del nombre de usuario corto, que figura en la tarjeta de acceso en «Credenciales». O el acceso se ha finalizado; entonces la página lo indica. Escanear la tarjeta es el camino sin escribir.',
          },
          {
            frage: '¿Cómo sabe recepción qué trabajo se ha hecho?',
            antwort: 'Por los registros: inicio y fin de turno, pausas, otra limpieza, inicio y fin por habitación. A partir de ellos, las estadísticas calculan los tiempos de trabajo y de limpieza; el historial de la habitación muestra cada limpieza con un nombre (en modo equipo, «Equipo de limpieza»).',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Personal',
            hinweis: 'Cuentas, tarjetas de acceso, PIN',
            ziel: { art: 'thema', id: 'personal' },
          },
          {
            label: 'Estadísticas',
            hinweis: 'Qué se hace con los registros',
            ziel: { art: 'thema', id: 'auswertung' },
          },
          {
            label: 'Establecimiento y normas',
            hinweis: 'Limpieza diaria, límite de aplazamiento, tiempo límite',
            ziel: { art: 'thema', id: 'regeln' },
          },
        ],
      },
    ],
  },
  gast: {
    title: 'Lo que ve el huésped',
    subtitle: 'Acceso, bloqueo del PIN, limpieza y «no antes de», No molestar, solicitudes, check-out',
    bloecke: [
      {
        art: 'fragen',
        eintraege: [
          {
            frage: '¿Cómo entra el huésped en el portal?',
            antwort: 'Con el método de PIN, de dos formas equivalentes: escanear el código QR de la habitación e introducir el PIN, o abrir la dirección del establecimiento e introducir el número de habitación y el PIN (ambos figuran en la hoja de check-in). Con el acceso personal, abre su código QR o enlace y queda dentro sin PIN. Después sigue con la sesión iniciada en su dispositivo.',
          },
          {
            frage: 'El huésped se ha bloqueado.',
            antwort: 'Tras cinco PIN erróneos, la estancia se bloquea durante 15 minutos, incluso para el PIN correcto. Solo afecta a esta habitación, no al establecimiento. Después vuelve a funcionar; el PIN correcto está en la ventana de la habitación. Hacer check-out y volver a hacer check-in no es una buena salida: el check-out cierra las solicitudes abiertas y pone la habitación en «limpieza pendiente».',
          },
          {
            frage: '¿Qué hace «Limpiar mi habitación»?',
            antwort: 'La habitación aparece de inmediato como abierta en el panel de limpieza y en su vista general. No hay cita; el equipo de limpieza se ocupará en su ronda. Pulsar de nuevo retira la solicitud. Con «no antes de», el huésped elige una hora en punto, y la habitación no estará disponible para limpieza hasta entonces.',
          },
          {
            frage: '¿Qué dice la tarjeta de estado sobre los botones?',
            antwort: 'En qué punto está la limpieza para el huésped, con los mismos datos que sus paneles: «prevista» (solicitud, prioridad o limpieza diaria pendiente), «desde las HH:MM» (aplazamiento del huésped o limpieza diaria aún no pendiente), «limpiándose ahora», «limpiada hoy a las HH:MM» o «nada previsto hoy», con el motivo (día de llegada, día de salida, el establecimiento solo limpia bajo petición). «Limpiada» solo cuenta desde el check-in de este huésped; nunca aparece el nombre de una persona de limpieza. La tarjeta se actualiza cada 15 segundos.',
          },
          {
            frage: '¿Por qué el huésped no puede pedir limpieza ahora?',
            antwort: 'El establecimiento ha fijado una franja horaria; fuera de ella, el huésped ve el horario de limpieza en lugar del botón. «No molestar» y retirar la solicitud siguen siendo posibles siempre.',
          },
          {
            frage: '¿Qué hace «No molestar»?',
            antwort: 'Nadie llama a la puerta, la limpieza diaria se suspende y la habitación aparece en gris en el panel, hasta que el huésped lo desactive. Solo el huésped puede hacerlo; recepción lo ve, pero no lo anula.',
          },
          {
            frage: '¿Paga el huésped en el portal?',
            antwort: 'No. Ve los precios a título informativo y pide con un toque; la solicitud le llega a usted en «Solicitudes». En el check-out, RoSe muestra el total de lo prestado; el cobro se hace en recepción como siempre.',
          },
          {
            frage: '¿En qué idioma está el portal?',
            antwort: 'En el idioma del teléfono del huésped, si el portal lo ofrece (actualmente alemán e inglés); el huésped puede cambiarlo arriba a la derecha. Si falta su idioma, se aplica el idioma de reserva del establecimiento (Acceso de huéspedes → Idiomas). El portal muestra los servicios en la traducción que usted haya introducido en el catálogo de servicios; si no, en el texto original. Para todos los demás idiomas, las hojas impresas explican los botones con imágenes, y el huésped puede traducir la pantalla con su teléfono.',
          },
          {
            frage: '¿Qué sabe RoSe del huésped?',
            antwort: 'Nada. Una estancia es una habitación, un periodo, un PIN o un enlace: sin nombre, sin dirección. Una dirección introducida para el correo de acceso no se guarda. En el check-out caducan el PIN, el enlace y la sesión.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Acceso de huéspedes',
            hinweis: 'PIN o enlace personal',
            ziel: { art: 'thema', id: 'gastzugang' },
          },
          {
            label: 'Establecimiento y normas',
            hinweis: 'Franja horaria, límite de aplazamiento, longitud del PIN',
            ziel: { art: 'thema', id: 'regeln' },
          },
        ],
      },
    ],
  },
  auswertung: {
    title: 'Estadísticas',
    subtitle: 'Tiempos de trabajo, pausa y limpieza a partir de los registros, anomalías, demanda por hora',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Todo lo que hay aquí se calcula, no se almacena. La base son los registros de las personas de limpieza (inicio y fin de turno, pausas, otra limpieza e inicio y fin por habitación), además de las pulsaciones de los huéspedes y los check-out. El periodo elegido figura en la dirección web, así que puede compartir o imprimir un estado concreto.',
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: '¿Qué significan tiempo de trabajo neto y tiempo restante?',
            antwort: 'Tiempo de trabajo neto = tiempo de turno menos pausas. Tiempo restante = tiempo de trabajo neto menos limpieza de habitaciones y otra limpieza; es decir, tiempo de desplazamientos, preparación o espera. Un tiempo restante alto suele indicar desplazamientos largos o tiempos muertos entre solicitudes.',
          },
          {
            frage: '¿Qué cuenta como «anomalía»?',
            antwort: 'Turnos de más de 16 horas (fin de turno olvidado), pausas de más de cuatro horas, limpiezas sin fin o más largas que el tiempo límite del establecimiento. Se cuentan, pero no se incluyen; de lo contrario, un turno abierto arrastraría el tiempo de trabajo durante días.',
          },
          {
            frage: '¿Por qué siguen apareciendo en la tabla personas de limpieza que ya no están?',
            antwort: 'Porque los registros del trabajo se conservan tras una baja. Quien tiene el acceso finalizado sigue visible durante el periodo en que trabajó. Solo la eliminación definitiva borra sus registros, y por eso exige escribir el nombre.',
          },
          {
            frage: '¿Cuenta el «Marcar limpieza como hecha» de recepción?',
            antwort: 'Crea un registro de limpieza, de modo que la limpieza diaria cuenta como hecha. Sin embargo, la tabla «Por persona de limpieza» solo incluye a personas de limpieza. Si recepción marca limpiezas como hechas con regularidad, esas limpiezas no se atribuyen a ninguna persona de limpieza en las estadísticas.',
          },
          {
            frage: '¿Por qué falta la tabla «Por persona de limpieza»?',
            antwort: 'En Establecimiento y normas, el establecimiento ha elegido «Actividades de limpieza: solo como equipo». Las estadísticas muestran entonces solo el total del establecimiento sobre los turnos, y los registros dejan de estar vinculados a una persona al terminar el turno. Volver atrás solo vale de ahora en adelante; los registros anonimizados siguen siendo anónimos.',
          },
          {
            frage: '¿Para qué sirve la sección «Demanda»?',
            antwort: 'Muestra por hora y día de la semana cuándo quieren limpieza los huéspedes y cuándo hacen el check-out, y cuántas personas de limpieza estaban en turno en ese momento. «Solicitudes sin nadie de turno» es la pista para la planificación. Por eso RoSe no pide a los huéspedes horas preferidas: los datos ya existen.',
          },
          {
            frage: '¿En qué hora se calculan las horas?',
            antwort: 'En la zona horaria del establecimiento (Establecimiento y normas). Si es incorrecta, los límites de día y las horas se desplazan según la diferencia horaria.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'El panel de limpieza',
            hinweis: 'De dónde salen los registros',
            ziel: { art: 'thema', id: 'reinigung' },
          },
          {
            label: 'Personal',
            hinweis: 'Finalizar el acceso en lugar de eliminar',
            ziel: { art: 'thema', id: 'personal' },
          },
        ],
      },
    ],
  },
  zugang: {
    title: 'Mi cuenta',
    subtitle: 'Dirección de inicio de sesión, nombre visible y contraseña de la persona con sesión iniciada',
    bloecke: [
      {
        art: 'fragen',
        eintraege: [
          {
            frage: '¿Dónde aparece el nombre visible?',
            antwort: 'En la cabecera del portal, en el historial de la habitación en el check-in y el check-out, en las solicitudes atendidas y en la lista de personal. El cambio se aplica en todas partes a la vez.',
          },
          {
            frage: '¿Por qué cambiar la contraseña exige la actual?',
            antwort: 'Porque, de lo contrario, bastaría una sesión abierta y desatendida en recepción para dejar a alguien sin acceso.',
          },
          {
            frage: '¿Ha olvidado la contraseña?',
            antwort: 'Cierre la sesión y elija «¿Ha olvidado su contraseña?» en la página de inicio de sesión. El enlace llega por correo electrónico y se puede abrir en cualquier dispositivo. Si no llega ningún correo, el titular de la cuenta o un gerente puede volver a enviar el enlace en Personal; si la entrega falló, el enlace también se puede mostrar y entregar directamente.',
          },
          {
            frage: '¿Puedo cambiar mi dirección de correo electrónico?',
            antwort: 'Sí, aquí, en «Cambiar la dirección de inicio de sesión», para titulares de cuenta, gerentes y recepción. Introduce su contraseña actual y la nueva dirección; se envía un enlace de confirmación a la nueva dirección, y solo al pulsarlo se hace el cambio. Hasta entonces sigue iniciando sesión con la dirección antigua. Tras el cambio, la dirección antigua recibe un aviso.',
          },
          {
            frage: '¿Qué se mantiene con una nueva dirección de inicio de sesión?',
            antwort: 'Todo salvo la dirección de correo electrónico: contraseña, roles en todos los establecimientos, nombre visible e historial. Para el titular de la cuenta, las facturas irán a la nueva dirección; los datos de facturación, el método de pago y el plan no cambian.',
          },
          {
            frage: 'He recibido un aviso de cambio de dirección, pero no fui yo.',
            antwort: 'Entonces alguien ha usado su contraseña. Póngase en contacto de inmediato con el titular de la cuenta de su establecimiento: en el caso de recepción y gerentes, puede finalizar el acceso en Personal. Si la propia cuenta del titular está afectada, contacte con nosotros; la dirección de contacto figura en el aviso legal.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: '¿Ha olvidado su contraseña?',
            ziel: { art: 'url', href: '/passwort-vergessen' },
          },
          {
            label: 'Personal',
            hinweis: 'Crear y finalizar cuentas',
            ziel: { art: 'thema', id: 'personal' },
          },
        ],
      },
    ],
  },
  haeuser: {
    title: 'Establecimientos y cuenta',
    subtitle: 'La página de establecimientos: estado por establecimiento, añadir un establecimiento, recuadro de la cuenta, eliminar datos',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'La página de establecimientos es el punto de entrada para titulares de cuenta y gerentes: todos los establecimientos accesibles con su estado (limpiezas pendientes, solicitudes) y, debajo, para el titular de la cuenta, el recuadro de la cuenta y «Añadir establecimiento». Recepción nunca ve esta página: solo conoce un establecimiento.',
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'Solo tengo un establecimiento. ¿Por qué esta página?',
            antwort: 'Porque aquí está la cuenta: facturación, método de pago, un segundo establecimiento, eliminación de datos. El enlace «Establecimientos» de la cabecera del establecimiento lleva siempre aquí, incluso con un único establecimiento.',
          },
          {
            frage: '¿Qué ve aquí un gerente?',
            antwort: 'Solo los establecimientos a los que se le ha añadido. El recuadro de la cuenta, «Añadir establecimiento» y «Eliminar datos» no existen para él.',
          },
          {
            frage: '¿Qué significa «Eliminar datos»?',
            antwort: 'Eliminar por completo un establecimiento o toda la cuenta, con una vista previa en cifras y el nombre escrito para confirmar; no se puede deshacer. A diferencia del trabajo diario, en el que los justificantes se conservan a propósito, aquí se borra todo: historial, cuentas de inicio de sesión y también el logotipo. Solo quedan los justificantes de facturación, porque hay que conservarlos. Eliminar la cuenta es también la baja a final de mes: para el mes en curso se emite una factura final al eliminar, y la ventana muestra el importe de antemano (nada en el mes gratuito).',
          },
          {
            frage: '¿Qué ocurre si añado otro establecimiento?',
            antwort: 'Se crea con su propia dirección, habitaciones, personal y normas. La facturación es por habitación en todos los establecimientos de la cuenta; el importe mínimo se aplica por cuenta, no por establecimiento.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Plan y facturación',
            hinweis: 'Precios, recuento, método de pago, facturas',
            ziel: { art: 'thema', id: 'konto' },
          },
          {
            label: 'Condiciones generales',
            ziel: { art: 'url', href: '/agb' },
          },
        ],
      },
    ],
  },
  konto: {
    title: 'Plan y facturación',
    subtitle: 'Precio por habitación, mes gratuito, recuento, importe mínimo, método de pago, facturas',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Un solo precio, sin paquetes: por habitación y mes natural, con un importe mínimo por cuenta. Todas las funciones están incluidas. La vista y la factura siguen la misma regla.',
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: '¿Qué mes es gratuito?',
            antwort: 'El mes natural del registro y, si no se registró el día uno del mes, también el siguiente; así que siempre al menos un mes completo.',
          },
          {
            frage: '¿Cómo se cuenta una habitación?',
            antwort: 'Cuenta para el mes en cuanto estuvo en servicio durante él, aunque fuera brevemente: puesta fuera de servicio hoy, sigue contando; creada hoy, también. Por eso el mes en curso es siempre una previsión; los meses cerrados quedan fijados, aunque elimine habitaciones más adelante.',
          },
          {
            frage: '¿Por qué un importe mínimo por cuenta y no por establecimiento?',
            antwort: 'Una cadena paga la suma de sus habitaciones, no tres veces el mínimo. Una cuenta sin ninguna habitación facturable no paga nada.',
          },
          {
            frage: '¿Qué métodos de pago hay?',
            antwort: 'Tarjeta o adeudo directo SEPA, guardados sin cargo y cobrados en el proceso mensual, o transferencia contra factura a los datos bancarios que figuran en ella, pagadera en 14 días. Destinatario y dirección de la factura son obligatorios porque, si no, no se puede calcular el impuesto; dentro de la UE y fuera de Alemania, también el NIF-IVA.',
          },
          {
            frage: '¿Cuándo llega la factura y dónde la encuentro?',
            antwort: 'El día uno de cada mes, por el mes anterior, en PDF y como página de consulta en la tarjeta «Facturas». Con 0 € no se emite ninguna factura. El proveedor conserva los justificantes incluso después de eliminar una cuenta; descargue antes los PDF, porque después ya no podrá acceder a la página.',
          },
          {
            frage: '¿Qué significa «Modo de prueba: no se cobra nada»?',
            antwort: 'El procesamiento de pagos aún funciona en el modo de prueba del proveedor de pagos. Se emiten facturas, pero no se mueve dinero. El aviso desaparece con el paso al funcionamiento real.',
          },
          {
            frage: '¿Cómo me doy de baja?',
            antwort: 'A final de un mes natural: eliminando la cuenta en «Eliminar datos» en la página de establecimientos o por escrito, por ejemplo por correo electrónico al proveedor. El mes en curso se sigue facturando: al eliminar se emite de inmediato una factura final, que se cobra con el método de pago guardado; si después sigue pendiente (transferencia), la ventana muestra al final la página de pago. Si no se puede emitir (por ejemplo, porque faltan los datos de facturación), la cuenta no se elimina. La eliminación en sí surte efecto de inmediato: después, los datos ya no existen. Poner un establecimiento fuera de servicio no basta: las habitaciones fuera de servicio siguen contando en el mes en curso.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Establecimientos y cuenta',
            hinweis: 'Añadir establecimiento, eliminar datos',
            ziel: { art: 'thema', id: 'haeuser' },
          },
          {
            label: 'Condiciones generales',
            ziel: { art: 'url', href: '/agb' },
          },
        ],
      },
    ],
  },
} satisfies Record<string, HilfeThemaText>
