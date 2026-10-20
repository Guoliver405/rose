import type { Shape } from '../../format'
import type { lotsen as de } from '../../de/help/lotsen'

/** Guías: textos de los recorridos guiados. Rutas, anclas, escenas y orden están en `lotsen.ts`. Español. */
export const lotsen = {
  tours: {
    einrichtung: {
      title: 'Primera configuración',
      subtitle: 'El camino guiado desde un establecimiento vacío hasta el primer check-in',
    },
    uebersicht: {
      title: 'La vista general de habitaciones',
      subtitle: 'La pantalla de recepción: leer los colores, check-in, check-out, prioridades',
    },
    anfragen: {
      title: 'Solicitudes',
      subtitle: 'El panel de recepción: lo que han pedido los huéspedes y cómo marcarlo como hecho',
    },
    zimmer: {
      title: 'Habitaciones y plantas',
      subtitle: 'Crear plantas enteras de una vez, corregir números, poner habitaciones fuera de servicio',
    },
    regeln: {
      title: 'Establecimiento y normas',
      subtitle: 'Zona horaria, limpieza diaria, hora límite del check-out, longitud del PIN: las normas del establecimiento',
    },
    gastzugang: {
      title: 'Acceso de huéspedes',
      subtitle: 'Código QR fijo por habitación con PIN o acceso personal por estancia, carteles incluidos',
    },
    aushang: {
      title: 'Carteles y hojas de check-in',
      subtitle: 'Qué se imprime: cartel de habitación, hoja de check-in, tarjeta de acceso, y cuánto tiempo vale cada uno',
    },
    personal: {
      title: 'Personal',
      subtitle: 'Limpieza, recepción y gerentes: crear, finalizar el acceso, imprimir tarjetas de acceso',
    },
    services: {
      title: 'Catálogo de servicios',
      subtitle: 'El catálogo de servicios: lo que los huéspedes pueden pedir en el portal',
    },
    reinigung: {
      title: 'El panel de limpieza',
      subtitle: 'Simulación: inicio de sesión, turno, plantas, controles deslizantes; lo que ve en el móvil la persona de limpieza',
    },
    gast: {
      title: 'Lo que ve el huésped',
      subtitle: 'Simulación: el portal de huéspedes en el móvil (limpieza, «no antes de», renuncia, No molestar, servicios)',
    },
    auswertung: {
      title: 'Estadísticas',
      subtitle: 'Tiempos de trabajo a partir de los registros, anomalías y cuándo quieren limpieza los huéspedes',
    },
    konto: {
      title: 'Plan y facturación',
      subtitle: 'Cuánto cuesta la cuenta, cómo se cuentan las habitaciones y dónde están el método de pago y las facturas',
    },
  },

  steps: {
    'einrichtung.start': {
      title: 'Le damos la bienvenida a RoSe',
      body: 'En los próximos minutos configuraremos su establecimiento: las habitaciones, las normas del establecimiento, cómo acceden sus huéspedes al portal, el personal y los servicios. Puede parar en cualquier momento y continuar más tarde; el progreso se deriva de lo que está realmente configurado, no de casillas marcadas.',
      tun: 'Continúe con el botón «Siguiente», abajo a la derecha. Puede hacer una pausa cuando quiera: una franja en la vista general indica lo que falta y le lleva de vuelta a la configuración.',
    },
    'zimmer.anlegen': {
      title: 'Todo empieza por las habitaciones',
      body: 'Sin habitaciones no hay check-in, ni panel de limpieza, ni carteles. Aquí crea plantas enteras de una vez; no hace falta escribir nada una por una.',
    },
    'zimmer.modus': {
      title: 'Dos maneras de crear muchas habitaciones',
      body: '«Plantas una a una» crea los números indicados en una sola planta: lo adecuado cuando cada planta es distinta. «Plantas idénticas» repite el mismo rango de números en varias plantas.',
    },
    'zimmer.nummern': {
      title: 'Números como lista o como rango',
      body: '«101-110» crea diez habitaciones; «201, 202, 205», exactamente tres. Los ceros iniciales se conservan: «01-10» da de 01 a 10, no de 1 a 10.',
      tun: 'Escriba un rango: debajo del campo verá al instante qué habitaciones se crearán.',
    },
    'zimmer.bestand': {
      title: '¿Una errata? No pasa nada',
      body: 'Habitaciones, plantas y edificios se pueden pulsar, y el diálogo ofrece siempre lo mismo: editar, poner fuera de servicio, eliminar. Al editar se cambian número, planta y edificio sin perder el historial ni los registros de trabajo; «fuera de servicio» es la vía suave para las reformas. Eliminar solo ocurre tras un aviso con cifras.',
    },
    'regeln.zeitzone': {
      title: 'Primero la zona horaria',
      body: 'Todas las horas de esta página se aplican en esta zona horaria. Si está mal configurada, la limpieza diaria toca a la hora equivocada y los límites de día de las estadísticas también se desplazan.',
    },
    'regeln.routine': {
      title: 'Limpieza solo bajo petición, o diaria',
      body: 'De forma predeterminada, la limpieza diaria está desactivada: las habitaciones se limpian cuando el huésped lo pide o después del check-out. Así se ahorra agua, detergente y tiempo de trabajo. Si la activa, las habitaciones ocupadas aparecen solas en el panel de limpieza a la hora elegida a partir del día siguiente a la llegada.',
    },
    'regeln.checkout': {
      title: '«Check-out hasta» es la hora más temprana de la limpieza diaria',
      body: 'Mientras RoSe no sepa si el huésped se va hoy, la limpieza diaria no toca antes de esta hora. Así ninguna habitación de salida se limpia antes del check-out y luego otra vez. Si la estancia tiene una fecha de salida, los días anteriores se aplica la hora normal y el día de la salida no hay limpieza diaria.',
    },
    'regeln.speichern': {
      title: 'No olvide guardar',
      body: 'Las normas se aplican a todo desde el momento en que guarda. Las estancias en curso y las solicitudes ya hechas siguen igual. En cuanto cambie algo, aparece además abajo en la pantalla una barra con Guardar y Descartar, así que no tiene que desplazarse hasta aquí.',
      tun: 'Guarde una vez aunque no cambie nada. Solo entonces el establecimiento registra la zona horaria y el paso cuenta como revisado en la configuración.',
    },
    'gastzugang.wahl': {
      title: 'Dos caminos al portal de huéspedes',
      body: 'Con el código QR fijo por habitación, en la habitación hay un código impreso una sola vez y cada estancia recibe su propio PIN: dos factores. Con el acceso personal, cada estancia recibe su propio enlace sin PIN, que caduca con el check-out: más cómodo, pero quien vea la hoja tiene acceso.',
    },
    'gastzugang.speichern': {
      title: 'Cambiar no afecta a las estancias en curso',
      body: 'El método se guarda con la estancia en el check-in y no se vuelve a leer en cada acceso. Los accesos ya entregados siguen funcionando hasta el check-out; solo el siguiente check-in sigue el nuevo método. No hay fecha de cambio ni conversión de los datos existentes.',
      tun: 'Confirme su elección con este botón, aunque mantenga la opción predeterminada. Solo entonces el paso cuenta como hecho en la configuración.',
    },
    'personal.reinigung': {
      title: 'El personal de limpieza no necesita correo electrónico',
      body: 'Una persona de limpieza recibe un nombre de usuario y un PIN, nada más. El nombre visible aparece en el panel y en la tarjeta; el inicio de sesión usa el nombre de usuario: quien escriba el nombre visible al iniciar sesión será rechazado. Ambos valen solo en este establecimiento; el mismo nombre de usuario puede existir en otro.',
    },
    'personal.liste': {
      title: 'Finalizar el acceso en lugar de eliminar',
      body: 'Cuando alguien se va, termine su acceso: el inicio de sesión se bloquea de inmediato, una sesión abierta también termina y el registro de trabajo queda completo. Si la persona vuelve, el acceso se reactiva y la tarjeta de acceso sigue funcionando. También existe la eliminación definitiva, pero en el caso de la limpieza se lleva los registros; el diálogo muestra antes lo que desaparece.',
    },
    'services.anlegen': {
      title: 'Un servicio es una pieza',
      body: 'Arriba está el servicio («Lavandería», «Servicio técnico») y debajo, las opciones que elige el huésped. Dos casillas deciden el flujo: «urgente» hace parpadear en rojo la campana de la ficha de la habitación y el número de la navegación. «Aviso» es para averías: esas solicitudes pertenecen a la habitación, no a la estancia, y por eso siguen abiertas después del check-out.',
      tun: 'Marque «Aviso» en todo lo que se pueda estropear; el servicio técnico es el caso típico.',
    },
    'services.liste': {
      title: 'Los precios llegan al resumen del check-out',
      body: 'Un servicio sin opciones puede llevar precio propio; si no, cada opción; el huésped lo ve al hacer la solicitud. En el check-out, el diálogo de la habitación muestra el total de los servicios prestados, así que conviene mantener los precios al día aquí mismo. Sin precio, una solicitud no aparece en ningún resumen, y los avisos tampoco aparecen aunque tengan precio: no son un servicio al huésped. RoSe no reserva ni cobra nada, solo suma.',
      tun: 'Indique un precio en el servicio o en una opción: a partir de la siguiente solicitud aparecerá en el resumen del check-out.',
    },
    'einrichtung.ende': {
      title: 'Listo, y esto es lo que sigue',
      body: 'Su establecimiento está configurado. En «Ayuda» encontrará siempre todas las guías y un resumen de lo que aún falta. Cada guía se puede iniciar por separado, tantas veces como quiera. Si algo no funciona o echa algo en falta, escríbanos mediante «Informar de un problema», arriba en esta página o al final del panel que abre el «?».',
    },
    'uebersicht.kpi': {
      title: 'La situación en una línea',
      body: 'Las cifras de arriba muestran de un vistazo el estado del establecimiento: ocupadas, listas, por limpiar, «No molestar», en curso. Se actualizan solas en cuanto un huésped o una persona de limpieza cambia algo.',
    },
    'uebersicht.etage': {
      title: 'Ordenadas por planta',
      body: 'Cada planta es un bloque, la más alta primero. Si alguien de limpieza está registrado en la planta, su nombre aparece en la cabecera: así ve dónde se trabaja sin tener que preguntar.',
    },
    'uebersicht.kachel': {
      title: 'El color es el estado',
      body: 'La barra sobre el número lo dice todo: verde = lista, azul = ocupada, ámbar = limpieza solicitada o limpieza diaria pendiente, naranja = check-out hecho, rosa = «No molestar». Violeta y bandera significan prioritaria; un anillo rojo parpadeante, una solicitud de servicio urgente. Los símbolos pequeños de debajo dan el motivo.',
      tun: 'Pase el ratón por una ficha: la información emergente describe el estado con palabras sencillas.',
    },
    'uebersicht.dialog': {
      title: 'Un clic abre la habitación',
      body: 'El diálogo contiene el check-in y el check-out, el PIN del huésped para leerlo en voz alta, la hoja de check-in para imprimir, la fecha de salida, la prioridad y el historial de los últimos 30 días. El check-in es un clic; la fecha de salida es opcional y se puede añadir en cualquier momento.',
      tun: 'Pulse en una habitación; la guía sigue abierta.',
    },
    'uebersicht.checkout': {
      title: 'En el check-out se muestra el importe',
      body: 'Si el huésped ha pedido servicios de pago, antes de que confirme el diálogo destaca lo que queda por cobrar, con «Detalles» como resumen imprimible: habitación, período, conceptos con horas, total. Sin nombre del huésped ni factura. Si no se pidió nada de pago, solo hay una nota y el check-out se hace como siempre.',
      tun: 'El check-out cierra las solicitudes abiertas como «no realizadas»; marque antes, en el mismo recuadro, lo que realmente se prestó. Más adelante puede volver al resumen desde el historial de la habitación: la entrada «Check-out» lleva el enlace.',
    },
    'kopf.hilfe': {
      title: 'La ayuda y «Informar de un problema»',
      body: 'El «?» abre la explicación junto a cada página. Al final de ese panel está «Informar de un problema»: para un error, un texto poco claro, una pregunta o una idea, con captura de pantalla si lo desea. Nuestra respuesta llega aquí, en RoSe, en «Mis incidencias»; un punto rojo en el «?» le indica que ya está. Transmita del mismo modo lo que noten los huéspedes o el equipo de limpieza.',
      tun: 'Pulse el «?» y eche un vistazo al panel; no tiene que informar de nada.',
    },
    'anfragen.zaehler': {
      title: 'Todo lo que solicitan los huéspedes',
      body: 'Aquí llegan las solicitudes del portal de huéspedes. El mismo número aparece como distintivo en «Solicitudes» en la navegación; parpadea en rojo en cuanto al menos una solicitud corresponde a un servicio urgente, y la ficha de la habitación afectada muestra una campana.',
    },
    'anfragen.liste': {
      title: 'Qué incluye una solicitud',
      body: 'Número de habitación, servicio, opciones elegidas con precio, una nota libre del huésped y la antigüedad de la solicitud. Las solicitudes nuevas aparecen solas: la página se actualiza por la misma conexión en directo que los paneles.',
    },
    'anfragen.erledigt': {
      title: 'La marca decide el importe',
      body: 'Una solicitud está abierta o cerrada; no hay «en curso» ni asignación. Al cerrarla, la diferencia importa: «Realizada» significa que el servicio se prestó, y la solicitud aparece con su importe en el resumen del check-out. Lo que siga abierto en ese momento, RoSe lo cierra como «no realizada»: queda indicado, pero no entra en el total. Los avisos son la excepción: una avería sigue abierta hasta que alguien la marca como hecha, incluso después del check-out, y el siguiente check-in muestra una advertencia.',
      tun: 'Marque enseguida como hecha una solicitud resuelta; si no, faltará en el total al final.',
    },
    'anfragen.verlauf': {
      title: 'Las solicitudes cerradas siguen siendo rastreables',
      body: 'Las solicitudes cerradas pasan a la lista plegada de abajo, con hora y nombre; las no realizadas aparecen marcadas. También figuran en el historial de la habitación, algo útil cuando un huésped pregunta más tarde si su solicitud llegó.',
    },
    'zimmer.bereich': {
      title: 'Edificio y planta',
      body: 'El edificio es opcional y solo tiene sentido en establecimientos que realmente tienen alas separadas. Sí influye en la unicidad: los números de habitación solo deben ser únicos por edificio; «101» puede existir en el edificio principal y en el anexo.',
    },
    'zimmer.praefix': {
      title: 'Anteponer el número de planta',
      body: 'Si todas las plantas usan el mismo rango de números, necesita esta casilla: la planta 2 y «05» dan «205». Sin ella, los números coinciden y solo se crearía la primera planta; la página le avisa antes.',
    },
    'zimmer.absenden': {
      title: 'Primero la vista previa, luego el clic',
      body: 'Encima del botón ve cuántas habitaciones se crearán y cómo se llamarán. No se escribe nada hasta que haga clic; pruebe todo lo que quiera antes.',
    },
    'regeln.logo': {
      title: 'Su logotipo en los impresos',
      body: 'El cartel de habitación y la hoja de check-in llevan su logotipo arriba a la izquierda; sin logotipo, aparece el nombre del establecimiento. PNG, JPG o SVG, 1 MB como máximo. Dos trampas: una imagen demasiado pequeña se ve borrosa a 55 mm, y un logotipo claro pensado para fondos oscuros es invisible en papel blanco; por eso la vista previa lo muestra sobre blanco.',
    },
    'regeln.checkin': {
      title: '«Check-in a partir de» marca el ritmo de las salidas',
      body: 'Las habitaciones de salida deben estar listas a esa hora. El panel de limpieza trabaja con esta hora: cuantas más salidas siguen abiertas y más se acerca el check-in, más atrae al personal de limpieza hacia las plantas con salidas; apenas en días tranquilos, claramente en días de mucho trabajo. Una prioridad marcada por la recepción siempre va primero.',
    },
    'regeln.aufschub': {
      title: '«No antes de»: el huésped aplaza',
      body: 'El huésped quiere limpieza, pero no antes de cierta hora, porque quiere dormir más. Hasta entonces, la habitación no cuenta como abierta en el panel. Elija el límite de modo que después la limpieza todavía quepa en el turno: limpieza hasta las 15:00 significa las 13:00.',
    },
    'regeln.personenbezug': {
      title: 'Por persona de limpieza o solo como equipo',
      body: 'Si en su establecimiento no se puede o no se debe medir el trabajo de cada persona de limpieza, elija «Solo como equipo»: las estadísticas muestran entonces solo el total del establecimiento, el historial de la habitación indica «Equipo de limpieza» y los registros pierden a su persona al terminar el turno; al cambiar, también todos los existentes. Puede volver atrás, pero los nombres de los registros anonimizados no vuelven. Con una sola persona de limpieza en el turno, la protección es de todos modos solo formal.',
    },
    'regeln.fenster': {
      title: 'Solicitudes de limpieza solo en horas fijas',
      body: 'Fuera de la franja, el huésped no puede enviar la solicitud y ve en su lugar su horario de limpieza. «No molestar» y retirar una solicitud siguen siendo posibles siempre; si no, alguien se quedaría con una solicitud de la que no puede deshacerse.',
    },
    'regeln.pin': {
      title: 'Longitud del PIN y finalizaciones olvidadas',
      body: 'La longitud del PIN se aplica a los PIN de huéspedes que se creen a partir de ahora; las estancias en curso conservan el suyo. El segundo valor resuelve las finalizaciones olvidadas: si una limpieza iniciada no se termina, la habitación vuelve a abrirse sola tras este tiempo, y el historial anota que se superó el tiempo límite.',
    },
    'regeln.adresse': {
      title: 'La dirección de su establecimiento',
      body: 'Los huéspedes y el personal de limpieza inician sesión en esta dirección. Forma parte de ambos inicios de sesión, porque los números de habitación y los nombres de usuario solo son únicos dentro del establecimiento. Los códigos QR impresos siguen siendo válidos tras un cambio; solo dejarán de coincidir las direcciones escritas a mano a partir de hojas de check-in antiguas.',
    },
    'gastzugang.sprachen': {
      title: 'Idiomas del establecimiento',
      body: 'El portal de huéspedes muestra a cada huésped el idioma de su móvil, si lo ofrece. Si no, se aplica su idioma de reserva. Las hojas impresas explican el portal con imágenes de sus botones; el texto va en el idioma de reserva y, si lo desea, en un segundo idioma. Imprimir más idiomas en papel ayuda menos de lo que ocupa.',
      tun: 'El idioma principal es aquel en el que crea los contenidos. El idioma de reserva es también el primer idioma de los impresos y del correo de acceso; el segundo solo aparece en el impreso.',
    },
    'gastzugang.aushang': {
      title: 'Los carteles de habitación',
      body: 'Con el método de PIN, cada habitación necesita su cartel: A4 para marcos, atriles o carpetas, o cuatro tarjetas compactas por página para recortar. Se imprime una vez y vale para siempre. Con el acceso personal, los carteles se ocultan: llevarían a una introducción de PIN que nadie puede usar allí.',
    },
    'aushang.karte': {
      title: 'Un cartel por habitación',
      body: 'El cartel va en la habitación, en un atril, un marco o la carpeta: código QR, número de habitación, nombre del establecimiento. El huésped escanea el código QR y solo escribe su PIN. El código pertenece a la habitación, no a la estancia: sigue siendo válido para todos los huéspedes y se imprime una sola vez.',
    },
    'aushang.knopf': {
      title: 'Primero crear, luego imprimir',
      body: 'Aquí se reúnen las habitaciones sin código: el botón crea de una vez todos los que faltan. Cuando ya existen todos, pasa a ser el botón de impresión, con una página por habitación para que cada cartel se pueda usar por separado. Por eso las habitaciones nuevas necesitan una segunda pasada.',
    },
    'aushang.erneuern': {
      title: 'Renovar inutiliza el cartel antiguo',
      body: 'Si un cartel desaparece o un código debe retirarse por otro motivo, «Renovar código» crea uno nuevo, y a partir de ese momento el cartel antiguo deja de funcionar. Por eso solo pueden hacerlo el titular de la cuenta y los gerentes, y siempre afecta a una sola habitación.',
    },
    'aushang.hinweis': {
      title: 'Solo con el método de código QR fijo por habitación',
      body: 'Si su establecimiento usa el acceso personal por estancia, estos carteles llevan a una introducción de PIN que los nuevos huéspedes no pueden usar; entonces no deben estar en las habitaciones. La página lo indica arriba.',
    },
    'aushang.blatt': {
      title: 'La hoja de check-in nace en el check-in',
      body: 'A diferencia del cartel de habitación, pertenece a una sola estancia. La encontrará en el diálogo de la habitación una vez hecho el check-in del huésped: una hoja con PIN, código QR y una breve guía que sigue las normas de su establecimiento. Si el establecimiento limpia a diario las habitaciones ocupadas, el texto lo dice; si no, invita al huésped a solicitar la limpieza en el portal. Lo mismo se puede enviar por correo electrónico; la dirección no se guarda.',
      tun: 'Pulse en una habitación ocupada; el camino a la hoja de check-in está en el diálogo.',
    },
    'aushang.login': {
      title: 'Tarjetas de acceso para el equipo de limpieza',
      body: 'El tercer impreso: una tarjeta por persona de limpieza, con la que se inicia sesión en el panel sin escribir nada. Una tarjeta nueva inutiliza la anterior; justo lo que hay que hacer si se pierde una. La tarjeta sobrevive a «Finalizar acceso» y vuelve a funcionar tras la reactivación.',
    },
    'personal.karte': {
      title: 'Tarjetas de acceso con código QR',
      body: 'En lugar de escribir un PIN, el personal de limpieza puede iniciar sesión con una tarjeta impresa: se escanea una vez y ya está. Una tarjeta nueva inutiliza la anterior; es justo lo que hay que hacer si se pierde una tarjeta.',
    },
    'personal.rezeption': {
      title: 'Cuentas de recepción',
      body: 'La recepción se ocupa del trabajo diario: check-in y check-out, prioridades, solicitudes, impresión de hojas de check-in y tarjetas. Los ajustes, la configuración de habitaciones, los servicios y la gestión del personal no están a su alcance.',
    },
    'personal.manager': {
      title: 'Gerentes: solo el titular de la cuenta',
      body: 'Un gerente tiene en el establecimiento los mismos derechos que usted, pero no accede a la cuenta ni a la facturación. Quien trabaja en varios establecimientos se añade en cada uno; a partir de la segunda vez, sin cuenta nueva. Retirarlo afecta siempre solo a este establecimiento.',
    },
    'services.beispiele': {
      title: 'Empezar con ejemplos',
      body: 'Mientras no exista ningún servicio, puede adoptar dos ya preparados y adaptarlos. Son servicios completamente normales: puede renombrarlos, ampliarlos o archivarlos en cualquier momento.',
    },
    'reinigung.login': {
      title: 'Inicio de sesión sin correo electrónico',
      body: 'Una persona de limpieza tiene nombre de usuario y PIN, o escanea su tarjeta de acceso impresa y queda dentro al instante. Ambos valen solo en este establecimiento; el mismo nombre de usuario puede existir en otro.',
    },
    'reinigung.schicht': {
      title: 'Primero empezar el turno, luego trabajar',
      body: 'Sin un turno empezado no se puede iniciar ninguna limpieza. El inicio del turno es también el primer registro del registro de trabajo; a partir de estos registros, las estadísticas calculan después los tiempos de trabajo, pausa y limpieza.',
      tun: 'Deslice el control hasta el final: solo se activa al 97 % del recorrido.',
    },
    'reinigung.etagen': {
      title: 'Plantas en lugar de una lista larga',
      body: 'Tras empezar el turno aparece primero el nivel de plantas, en el mismo orden fijo que en recepción. Cada fila muestra cuánto queda abierto, si hay una prioridad esperando y quién trabaja ya allí.',
    },
    'reinigung.naechstes': {
      title: '«Siguiente» es una recomendación, no una asignación',
      body: 'Solo una planta lleva el distintivo. Si hay una habitación prioritaria abierta en alguna parte, es esa planta: una decisión de la recepción va primero. Si no, la mayor urgencia abierta dividida por el número de personas de limpieza presentes más uno; las salidas pesan más cuanto más se acerca el check-in. Donde ya trabaja alguien, el desplazamiento compensa menos. Las plantas sin trabajo abierto quedan fuera y, en caso de empate, gana la planta más baja, para que la recomendación no salte de un lado a otro.',
    },
    'reinigung.kacheln': {
      title: 'Elegir una planta es registrarse en ella',
      body: 'Quien se registra aparece desde ese momento en esta planta, en la vista general de recepción y para todo el equipo. Las habitaciones en gris no están bloqueadas, simplemente no tienen tarea: libres, «No molestar», sin limpieza deseada hoy o con una limpieza que solo toca más tarde.',
    },
    'reinigung.starten': {
      title: 'Empezar con un control deslizante, no con un botón',
      body: 'Al tocar la ficha se abre la habitación. La limpieza se inicia con un deslizamiento que debe empezar en el tirador y recorrer casi toda la pista: un móvil en el bolsillo del delantal no debe iniciar una limpieza.',
    },
    'reinigung.tuer': {
      title: '¿El huésped está y ahora no quiere?',
      body: 'No hace falta empezar nada: «En 30 min» o «En 1 h» quita la habitación del panel hasta entonces, para todo el equipo; nadie vuelve a llamar mientras tanto y después se abre sola. «Hoy no» lo deja resuelto por hoy. Si el huésped aún quiere limpieza, la solicita en el portal. Ninguno de los dos cuenta como limpieza, pero ambos aparecen en el historial de la habitación.',
      tun: 'Pruebe uno de los tres botones; la ficha muestra después lo que ha pasado.',
    },
    'reinigung.abschliessen': {
      title: 'Terminar, y qué pasa si se olvida',
      body: 'Entre el inicio y el final, la habitación aparece «en curso» para todos. Si se olvida terminar, la habitación vuelve a abrirse sola tras el tiempo configurado y el historial anota que se superó el tiempo límite, en lugar de que un proceso a medias quede ahí para siempre.',
    },
    'reinigung.status': {
      title: 'Pausa, otra limpieza, fin del turno',
      body: 'Todos los cambios de estado están en una página aparte, no en el panel; así funciona el botón de retroceso del móvil. Las pausas y la otra limpieza son períodos dentro del turno y no pueden solaparse con nada; terminar el turno cierra ambos. Debajo está el balance del día de la persona de limpieza.',
    },
    'reinigung.verlassen': {
      title: 'Salir de una planta es un acto deliberado',
      body: 'La vuelta atrás también es un control deslizante, de derecha a izquierda. Un toque accidental no debe sacar a nadie de la planta: falsearía la indicación de dónde está el equipo.',
    },
    'gast.zugang': {
      title: 'Sin cuenta, sin aplicación',
      body: 'El huésped escanea el cartel de la habitación y escribe el PIN de la hoja de check-in, o abre el enlace personal recibido en el check-in y entra sin PIN. Cuál de los dos se aplica lo decide el establecimiento en «Acceso de huéspedes».',
    },
    'gast.portal': {
      title: 'Una pantalla, nada más',
      body: 'Tras iniciar sesión, el huésped sigue conectado en su dispositivo; no se le pide el PIN una segunda vez. El portal muestra arriba el establecimiento y la habitación.',
    },
    'gast.reinigen': {
      title: 'Basta un toque',
      body: '«Limpiar mi habitación» registra la solicitud, y la habitación aparece al instante en el panel de limpieza y en la vista general de recepción. Un nuevo toque la retira. Nada de esto es una cita: el equipo de limpieza viene cuando encaja en su ronda.',
      tun: 'Púlselo; la simulación responde como el portal real.',
    },
    'gast.aufschub': {
      title: '«No antes de»: para quien se levanta tarde',
      body: 'El huésped quiere limpieza, pero no antes de cierta hora. Hasta entonces, la habitación no cuenta como abierta en el panel y la ficha muestra un reloj. Hasta cuándo se puede aplazar lo fija el establecimiento, y el portal indica que el límite viene del establecimiento.',
    },
    'gast.aktiv': {
      title: 'El huésped ve lo que ha activado',
      body: 'Una solicitud activa sigue visible, con la hora elegida, y la tarjeta de estado de arriba le dice al huésped cómo están las cosas: prevista, a partir de cierta hora, en curso ahora mismo, ya limpiada hoy. Cuándo vendrá alguien exactamente no se muestra a propósito: sin lógica de asignación, RoSe no podría cumplir esa promesa.',
    },
    'gast.verzicht': {
      title: '«Hoy sin limpieza»: solo con limpieza diaria',
      body: 'Si el establecimiento limpia a diario, el huésped renuncia a la de hoy con un toque. No es lo mismo que «No molestar»: la renuncia solo vale hasta medianoche, los servicios y la recepción siguen disponibles y mañana se reanuda la limpieza. En el panel, la habitación se pone gris con una hoja. Si el establecimiento solo limpia bajo petición, el botón no existe: allí, no solicitarla ya es renunciar.',
    },
    'gast.dnd': {
      title: '«No molestar» se impone a todo',
      body: 'Mientras está activo, nadie llama a la puerta, ni siquiera por un servicio, y no hay limpieza diaria. Vale hasta que el huésped lo desactiva, también durante la noche. Desactivarlo siempre es posible: a diferencia de la solicitud de limpieza, «No molestar» nunca se bloquea por una franja horaria; si no, alguien se quedaría atrapado con él.',
    },
    'gast.services': {
      title: 'Servicios del catálogo',
      body: 'El huésped ve exactamente los servicios que ha configurado el establecimiento, con precios a título informativo. Pedir es un toque; la solicitud llega a recepción en «Solicitudes». En RoSe no se cobra nada.',
    },
    'gast.bestellt': {
      title: 'Y después, se acabó',
      body: 'Las solicitudes abiertas siguen visibles para el huésped hasta que la recepción las marca como hechas. En el check-out, el PIN, el enlace y la sesión caducan de inmediato; la estancia sigue siendo anónima, nunca hubo un nombre de por medio.',
    },
    'auswertung.zeitraum': {
      title: 'El período está en la dirección',
      body: 'Desde y hasta, como un formulario normal que escribe el período en la dirección. Así se puede enlazar, reenviar e imprimir un estado, y al imprimir el propio formulario desaparece.',
    },
    'auswertung.kennzahlen': {
      title: 'Todo calculado, nada almacenado',
      body: 'Las cifras salen de los registros del personal de limpieza: inicio y fin del turno, pausas, otra limpieza, inicio y final por habitación. El «Tiempo de trabajo neto» es el turno sin pausas; el «Tiempo restante» es lo que no fue ni habitación ni otra limpieza: desplazamientos y preparación.',
    },
    'auswertung.auffaellig': {
      title: 'Los registros inverosímiles no cuentan en los totales',
      body: 'Un turno de más de 16 horas es un fin de turno olvidado; una pausa de más de cuatro horas, un fin de pausa olvidado; y una limpieza sin final no cuenta como trabajo hecho. Estos casos se cuentan aquí en lugar de incluirse; si no, un turno abierto arrastraría el tiempo de trabajo durante días y haría inútiles todas las estadísticas.',
    },
    'auswertung.tabelle': {
      title: 'Por persona de limpieza, también antiguas',
      body: 'Quien ya no tiene acceso sigue visible en las estadísticas; el registro de trabajo sobrevive a la marcha. Al pulsar el nombre se abre el diario del día con cada registro.',
    },
    'auswertung.nachfrage': {
      title: 'Cuándo llega el trabajo',
      body: 'La segunda parte responde a una pregunta de planificación: ¿a qué horas quieren limpieza los huéspedes, cuándo hacen el check-out y cuántas personas de limpieza había en el turno en ese momento? La cifra «Solicitudes sin nadie de turno» es la verdadera pista. Por eso RoSe no pide a los huéspedes horas preferidas: los datos ya están ahí.',
    },
    'konto.plan': {
      title: 'Un precio, sin paquetes',
      body: 'Se factura por habitación y mes natural, con un importe mínimo por cuenta, no por establecimiento. Una cadena paga, por tanto, la suma de sus habitaciones y no tres veces el mínimo. Todas las funciones están incluidas; no hay nada a lo que tenga que pasarse más adelante.',
    },
    'konto.laufend': {
      title: 'Un recuento generoso, pero claro',
      body: 'Una habitación cuenta para el mes en cuanto ha estado en servicio durante él, aunque sea brevemente: si se pone fuera de servicio hoy, sigue contando; si se crea hoy, también. Por eso el número solo es definitivo a final de mes, y el mes en curso es siempre una previsión.',
    },
    'konto.monate': {
      title: 'Los meses cerrados son fijos',
      body: 'Cuando un mes termina, su importe ya no cambia, aunque elimine habitaciones más tarde: antes de cada eliminación se guarda el número de habitaciones de los meses afectados.',
    },
    'konto.zahlungsweg': {
      title: 'Método de pago y datos de facturación',
      body: 'La tarjeta o la domiciliación SEPA se guardan sin cargo y se cobran en el proceso mensual; si prefiere pagar contra factura, transfiera el importe a los datos bancarios que figuran en la factura. El destinatario de la factura, la dirección y, dentro de la UE fuera de Alemania, el NIF-IVA son obligatorios, porque si no el impuesto no se puede calcular correctamente.',
    },
    'konto.rechnungen': {
      title: 'Las facturas llegan el día 1 de cada mes',
      body: 'Por el mes anterior, en formato electrónico, pagaderas en 14 días. Cada factura está disponible aquí en PDF y como página de consulta. El proveedor las conserva incluso después de eliminar una cuenta; descargue antes los PDF, porque después la página ya no es accesible.',
    },
  },

  setup: {
    zimmer: {
      label: 'Habitaciones configuradas',
      todo: 'Configurar las habitaciones',
      done: { one: '{count} habitación en servicio', other: '{count} habitaciones en servicio' },
      open: 'Sin habitaciones no hay check-in ni panel de limpieza',
    },
    regeln: {
      label: 'Normas del establecimiento revisadas',
      todo: 'Revisar las normas del establecimiento',
      done: 'Zona horaria configurada: la limpieza diaria, la hora límite del check-out y las estadísticas calculan correctamente',
      open: 'Sobre todo la zona horaria: revísela una vez y guarde, aunque no cambie nada',
    },
    gastzugang: {
      label: 'Acceso de huéspedes elegido',
      todo: 'Elegir el acceso de huéspedes',
      done: 'El método está definido: cada check-in lo guarda con la estancia',
      open: 'Código QR fijo por habitación con PIN o acceso personal por estancia: confirme la elección una vez, aunque sea la predeterminada',
    },
    personal: {
      label: 'Persona de limpieza añadida',
      todo: 'Añadir una persona de limpieza',
      done: { one: 'Una cuenta de limpieza', other: '{count} cuentas de limpieza' },
      open: 'Sin cuenta, nadie accede al panel de limpieza',
    },
    services: {
      label: 'Servicios configurados',
      todo: 'Configurar los servicios',
      done: { one: 'Un servicio en el catálogo', other: '{count} servicios en el catálogo' },
      open: 'Opcional: sin servicios, el portal de huéspedes solo muestra la limpieza y «No molestar»',
    },
    checkin: {
      label: 'Primer check-in',
      todo: 'Probar el primer check-in',
      done: 'El proceso se ha recorrido una vez',
      open: 'Pulse en una habitación y luego en «Check-in»: el PIN aparece al instante en pantalla',
    },
    zahlungsweg: {
      label: 'Método de pago añadido',
      todo: 'Añadir un método de pago',
      done: 'Los datos de facturación y el método de pago están definidos',
      open: 'El primer mes es gratuito; puede añadir el método de pago en cualquier momento',
    },
  },
} satisfies Shape<typeof de>
