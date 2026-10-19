import type { Shape } from '../../format'
import type { SimulatorMessages } from '../../de/simulator'

/** Simulador Housekeeping: cuenta, en español. */
export const account = {
  /**
   * Texto del consentimiento publicitario, con versión propia por idioma
   * (`MARKETING_TEXT_VERSIONS` en `lib/sim-account.ts`). Texto modificado ⇒ nueva versión.
   */
  marketing: {
    text: 'Sí, RoSe puede informarme ocasionalmente por correo electrónico sobre nuevas funciones y ofertas especiales, exclusivamente sobre RoSe. Mi dirección no se cederá a terceros. Puedo darme de baja en cualquier momento con un clic o desde mi cuenta.',
    optional: '(opcional)',
  },

  signup: {
    metaTitle: 'Registro – {tool}',
    intro: 'Gratis y sin datos de pago. Tras el registro, confirmará su dirección de correo electrónico mediante un enlace.',
    mailNotReady: 'En este momento no es posible registrarse porque el envío de correos electrónicos no está configurado.',
    email: 'Correo electrónico',
    password: 'Contraseña',
    passwordHint: 'Al menos {min} caracteres.',
    submit: 'Registrarse gratis',
    submitting: 'Creando…',
    terms:
      'Al registrarse, acepta las <terms>condiciones de uso del simulador</terms> (en alemán). Cómo tratamos sus datos se describe en la <privacy>política de privacidad</privacy> (en alemán).',
    haveAccount: '¿Ya tiene una cuenta? <link>Iniciar sesión</link>',
    resendLink: 'Reenviar el enlace de confirmación',
    sent: {
      title: 'Confirme su dirección',
      text: 'Le hemos enviado un correo electrónico a <code>{email}</code>. El enlace que contiene activa su cuenta e inicia la sesión. Puede abrirse en cualquier dispositivo.',
      hint: '¿No ha recibido nada? Revise también la carpeta de correo no deseado. Si ya existe una cuenta con esta dirección, el correo le explica cómo continuar.',
      again: 'Volver a enviar el correo',
      againIn: 'Volver a enviar en {seconds} s',
    },
    resend: {
      linkExpired: 'El enlace de confirmación ha caducado o ya se ha utilizado. Solicite uno nuevo.',
      submit: 'Enviar un nuevo enlace de confirmación',
      signupInstead: 'Registrarse de nuevo',
    },
  },

  konto: {
    metaTitle: 'Mi cuenta – {tool}',
    title: 'Mi cuenta',
    access: {
      title: 'Acceso',
      email: 'Correo electrónico: <code>{email}</code>',
      password: 'Cambiar la contraseña: mediante <link>¿Ha olvidado su contraseña?</link>; recibirá un enlace en esta dirección.',
      hotel: 'Este acceso pertenece a una cuenta de establecimiento; con él utiliza el simulador, sin una cuenta aparte.',
    },
    marketing: {
      title: 'Novedades de RoSe por correo electrónico',
      saved: 'Guardado. ¡Gracias!',
      unsubscribed: 'Se ha dado de baja. Ya no recibirá correos publicitarios.',
      since: 'Consentimiento otorgado el {date}.',
      none: 'No se ha otorgado ningún consentimiento.',
    },
    delete: {
      titleSim: 'Eliminar la cuenta',
      titleHotel: 'Eliminar los datos del simulador',
      textSim: 'Elimina de forma inmediata y definitiva su acceso, sus escenarios guardados y su consentimiento.',
      textHotel: 'Elimina sus escenarios guardados y su consentimiento. Su acceso al establecimiento se mantiene.',
      confirmLabel: 'Escriba «{phrase}» para confirmar',
      submit: 'Eliminar definitivamente',
    },
  },

  deletePhrase: 'ELIMINAR',

  convert: {
    title: 'Empezar con RoSe como establecimiento',
    intro:
      'Pruebe RoSe gratis durante al menos un mes, sin datos de pago. Si no le convence, simplemente elimine la cuenta antes de que termine ese plazo; no hay costes. Su acceso y sus escenarios se mantienen tal como están.',
    prices: 'Precios',
    next: 'Continuar',
    closed: 'El registro como establecimiento solo es posible actualmente por invitación y en este momento no está abierto. Escríbanos; la dirección figura en el aviso legal.',
    houseName: 'Nombre del establecimiento',
    yourName: 'Su nombre',
    inviteCode: 'Código de invitación',
    take: 'Tomado del simulador',
    rooms: {
      one: '{rooms} habitaciones en una planta, numeradas 101, 102…; se puede cambiar en cualquier momento en la configuración de habitaciones',
      other: '{rooms} habitaciones en {count} plantas, numeradas 101, 102…; se puede cambiar en cualquier momento en la configuración de habitaciones',
    },
    rulesDaily: 'Normas: limpieza diaria de las habitaciones ocupadas desde las {from}, check-out hasta las {checkout}, check-in desde las {checkin}',
    rulesOnDemand: 'Normas: limpieza de las habitaciones ocupadas solo bajo petición, check-out hasta las {checkout}, check-in desde las {checkin}',
    rulesHint: 'Sigue la opción «diaria / solo bajo petición» de arriba; se puede cambiar en «Establecimiento y normas».',
    submit: 'Crear la cuenta de establecimiento',
    submitting: 'Creando…',
    cancel: 'Cancelar',
    after: 'A continuación: método de pago (opcional) y configuración. Se aplican las condiciones generales (en alemán).',
  },

  errors: {
    emailInvalid: 'Introduzca una dirección de correo electrónico válida.',
    passwordShort: 'La contraseña debe tener al menos {min} caracteres.',
    passwordLong: 'La contraseña puede tener como máximo {max} caracteres.',
    signInAgain: 'Vuelva a iniciar sesión.',
    deletePhrase: 'Escriba «{phrase}» para confirmar.',
    mailNotReady: 'En este momento no es posible registrarse (el envío de correos electrónicos no está configurado).',
    signupThrottled: 'Se han hecho demasiados registros desde esta conexión hace poco. Inténtelo de nuevo dentro de una hora.',
    resendThrottled: 'Se han hecho demasiadas solicitudes desde esta conexión hace poco. Inténtelo de nuevo dentro de una hora.',
    signupFailed: 'No se ha podido crear la cuenta. Inténtelo de nuevo más tarde.',
    notSaved: 'No se ha podido guardar.',
    confirmFirst: 'Confirme primero su dirección de correo electrónico.',
    deleteFailed: 'No se ha podido eliminar la cuenta. Inténtelo de nuevo más tarde.',
    scenarioName: 'Introduzca un nombre.',
    scenarioSaveFailed: 'No se ha podido guardar el escenario.',
    scenarioLimit: 'Como máximo {max} escenarios; elimine primero uno.',
    scenarioRenameFailed: 'No se ha podido cambiar el nombre.',
    scenarioDeleteFailed: 'No se ha podido eliminar.',
    convertConfirmedOnly: 'Solo para cuentas del simulador confirmadas.',
    convertExists: 'Ya existe una cuenta de establecimiento para este acceso.',
    convertHouseName: 'Introduzca el nombre del establecimiento.',
    convertYourName: 'Introduzca su nombre.',
    convertTooManyRooms:
      'Como máximo se pueden tomar directamente {max} habitaciones; convierta la cuenta sin habitaciones y créelas en la configuración de habitaciones.',
    convertFailed: 'No se ha podido crear la cuenta de establecimiento.',
  },
} satisfies Shape<SimulatorMessages['account']>
