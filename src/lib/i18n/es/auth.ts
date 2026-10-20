import type { Shape } from '../format'
import type { AuthMessages } from '../de/auth'

/** Inicio de sesión, registro y contraseña — español. Lectores: titulares de la cuenta, gerentes, recepción. */
export const auth = {
  login: {
    title: 'Iniciar sesión',
    email: 'Correo electrónico',
    password: 'Contraseña',
    submit: 'Iniciar sesión',
    submitting: 'Iniciando sesión…',
    forgot: '¿Ha olvidado su contraseña?',
    noAccount: '¿Aún no tiene cuenta? <link>Registre su establecimiento</link>',
  },

  signup: {
    title: 'Crear cuenta',
    /** Nur mit Zahlungsweg (Stripe): Schritt 2 ist dann die Seite „Zahlungsweg“. */
    step: 'Paso 1 de 2: cuenta y establecimiento',
    inviteCode: 'Código de invitación',
    inviteCodeHint: 'RoSe está en una fase de prueba temprana; por ahora, el registro está limitado a establecimientos invitados.',
    houseName: 'Nombre del establecimiento',
    houseNamePlaceholder: 'p. ej. Pensión Vista Alegre',
    yourName: 'Su nombre',
    yourNamePlaceholder: 'p. ej. Ana García',
    email: 'Correo electrónico (inicio de sesión)',
    password: 'Contraseña',
    passwordHint: 'Al menos {min} caracteres.',
    submit: 'Crear cuenta',
    submitting: 'Creando…',
    terms:
      'Al crear la cuenta, acepta las <terms>condiciones generales</terms> y toma conocimiento de la <privacy>política de privacidad</privacy>. El mes natural del registro y el primer mes completo siguiente son gratuitos.',
    nextStep: 'En el siguiente paso configurará las habitaciones. Ya hay servicios de ejemplo creados, que puede modificar en cualquier momento.',
    haveAccount: '¿Ya tiene una cuenta? <link>Iniciar sesión</link>',
  },

  forgot: {
    title: 'Restablecer contraseña',
    linkInvalid: 'El enlace ha caducado o ya se ha utilizado. Solicite uno nuevo.',
    email: 'Correo electrónico',
    submit: 'Enviar enlace de restablecimiento',
    submitting: 'Enviando…',
    sentTitle: 'El correo está en camino',
    sentText:
      'Si existe una cuenta para <code>{email}</code>, en breve llegará un enlace a esa bandeja de entrada. Tiene una validez limitada y puede abrirse en cualquier dispositivo.',
    sentSpam: '¿No ha llegado nada? Revise también la carpeta de spam.',
    again: 'Volver a solicitar',
    againIn: 'Volver a solicitar en {seconds} s',
    backToLogin: 'Volver al inicio de sesión',
  },

  newPassword: {
    titleInvite: 'Configure su acceso',
    title: 'Establecer una nueva contraseña',
    introInvite: '¡Le damos la bienvenida! Establezca una contraseña para <b>{email}</b>. Después de guardarla, habrá iniciado sesión directamente.',
    intro: 'Para <b>{email}</b>. Después de guardarla, habrá iniciado sesión directamente.',
    linkInvalid: 'Este enlace ya no es válido: ha caducado o ya se ha utilizado.',
    requestNew: 'Solicitar un enlace nuevo',
    password: 'Nueva contraseña',
    passwordHint: 'Al menos {min} caracteres.',
    confirm: 'Repetir',
    submit: 'Guardar contraseña',
    submitting: 'Guardando…',
    backToLogin: 'Volver al inicio de sesión',
  },

  errors: {
    loginFailed: 'No se ha podido iniciar sesión: el correo electrónico o la contraseña no son correctos.',
    confirmEmailFirst: 'Confirme primero su dirección de correo electrónico; le enviamos el enlace al registrarse.',
    notForReception: 'Esta cuenta no está habilitada para recepción.',
    invalidEmail: 'Introduzca una dirección de correo electrónico válida.',
    passwordTooShort: 'La contraseña debe tener al menos {min} caracteres.',
    houseNameMissing: 'Introduzca el nombre del establecimiento.',
    yourNameMissing: 'Introduzca su nombre.',
    emailTaken: 'Ya existe una cuenta para esta dirección de correo electrónico. Inicie sesión.',
    accessNotCreated: 'No se ha podido crear el acceso.',
    accountNotCreated: 'No se ha podido crear la cuenta.',
    signInAfterSignupFailed: 'La cuenta se ha creado, pero no se ha podido iniciar sesión. Inicie sesión desde la página de inicio de sesión.',
    mailNotConfigured: 'El envío de correos no está configurado. Póngase en contacto con el operador.',
    passwordsDiffer: 'Las dos contraseñas no coinciden.',
    sessionExpired: 'La sesión ha caducado. Solicite un enlace nuevo.',
    samePassword: 'Esa ya es su contraseña actual. Elija otra distinta.',
    signupClosed: 'El registro de establecimientos no está abierto en este momento.',
    inviteCodeWrong: 'El código de invitación no es correcto.',
    createAccountFailed: 'No se ha podido crear la cuenta: {detail}',
    createHouseFailed: 'No se ha podido crear el establecimiento: {detail}',
    createProfileFailed: 'No se ha podido crear el perfil: {detail}',
    createOwnerFailed: 'No se ha podido añadir al titular de la cuenta: {detail}',
  },
} satisfies Shape<AuthMessages>
