import type { Shape } from '../format'
import type { MailMessages } from '../de/mail'

/**
 * Envío de correos — español: plantillas (invitación, enlace de contraseña,
 * cuenta del simulador), línea de estado bajo los botones de envío y mensajes.
 * El correo de acceso para huéspedes está con las hojas impresas (`sheet.ts`).
 */
export const mail = {
  templates: {
    greeting: 'Hola:',
    fallback: 'Si el botón no se abre:',
    invite: {
      subject: 'Invitación: {role} de {hotel} en RoSe',
      greeting: 'Hola, {name}:',
      invited: 'Ha recibido una invitación como <b>{role}</b> de <b>{hotel}</b> en RoSe.',
      invitedBy: '{by} le ha invitado como <b>{role}</b> de <b>{hotel}</b> en RoSe.',
      body: 'Con el botón de abajo puede establecer su contraseña; después, inicie sesión con esta dirección de correo electrónico.',
      bodyText: 'Con el enlace de abajo puede establecer su contraseña; después, inicie sesión con esta dirección de correo electrónico.',
      button: 'Establecer contraseña',
      note: 'El enlace tiene una validez limitada. Si no esperaba esta invitación, puede ignorar este correo.',
    },
    recovery: {
      subject: 'Nueva contraseña para RoSe',
      subjectInvite: 'Su enlace de contraseña para RoSe',
      intro: 'Se ha solicitado una nueva contraseña para su cuenta de RoSe.',
      introInvite: 'Aquí tiene su nuevo enlace para establecer la contraseña de su cuenta de RoSe.',
      button: 'Establecer nueva contraseña',
      buttonInvite: 'Establecer contraseña',
      note: 'El enlace tiene una validez limitada y puede abrirse en cualquier dispositivo. Si no ha solicitado una nueva contraseña, puede ignorar este correo: su contraseña no cambia.',
    },
    simConfirm: {
      subject: 'Confirme, por favor: su cuenta para el {tool}',
      purpose: 'Confirme su dirección de correo electrónico para poder usar el {tool} de RoSe.',
      marketing:
        'También ha aceptado que RoSe le informe ocasionalmente por correo electrónico sobre nuevas funciones y ofertas, solo sobre RoSe. Al hacer clic confirma también este consentimiento; puede retirarlo en cualquier momento en su cuenta.',
      button: 'Confirmar dirección de correo',
      note: 'El enlace tiene una validez limitada. Si no se ha registrado, ignore este correo: sin confirmación, la cuenta se elimina a los siete días.',
    },
    simExists: {
      subject: 'Ya tiene una cuenta de RoSe',
      text: 'Ya existe una cuenta de RoSe para esta dirección de correo electrónico. No es posible crear una segunda cuenta con la misma dirección. Inicie sesión con su cuenta existente; como titular de la cuenta o gerente de un establecimiento, encontrará el {tool} en {url}.',
      button: 'Iniciar sesión',
      buttonText: 'Iniciar sesión: {url}',
      forgot: '¿Ha olvidado su contraseña? Restablézcala aquí:',
      note: 'Si no se ha vuelto a registrar, puede ignorar este correo: no ha cambiado nada en su cuenta.',
    },
  },

  status: {
    queued: 'Entregando…',
    sent: 'Entregado para su envío; a la espera de la confirmación de recepción…',
    delayed: 'Entrega retrasada: el servidor de destino no acepta en este momento; se volverá a intentar.',
    delivered: 'Entregado.',
    complained: 'El destinatario ha marcado el correo como spam.',
    bounced: 'Rechazado por el servidor de destino.',
    bouncedDetail: 'Rechazado por el servidor de destino: {detail}',
    suppressed: 'No entregado: tras un rechazo anterior, la dirección está en la lista de bloqueo del servicio de envío. Desbloquéela primero y vuelva a enviar.',
    failed: 'No se ha podido enviar.',
    failedDetail: 'No se ha podido enviar: {detail}',
  },

  line: {
    againIn: 'de nuevo en {seconds} s',
    to: ' a {recipient}',
    blockedTitle: 'No enviado: dirección bloqueada',
    origin: {
      bounce: 'El servidor de destino rechazó un correo anterior a esta dirección',
      complaint: 'El destinatario marcó un correo anterior como spam',
      manual: 'La dirección se añadió manualmente a la lista de bloqueo',
      other: 'Un correo anterior a esta dirección no llegó',
    },
    blockedText: '{origin}{since}. El servicio de envío no entregará nada a esta dirección hasta que se desbloquee.',
    reasonThen: 'Motivo en su momento: {detail}',
    canRelease: '¿Es correcta la dirección? Entonces desbloquéela y vuelva a enviar. Si se rechaza de nuevo, el nuevo motivo aparecerá aquí.',
    cannotRelease: 'Por ahora no es posible desbloquearla desde la aplicación. Compruebe la dirección o entregue el acceso por otra vía.',
    providerHint:
      'Aviso: en <code>{domain}</code> se han rechazado recientemente {count} direcciones distintas y no se ha entregado ninguna (desde {since}). Puede que este proveedor no acepte nuestros correos en este momento; si no llega nada, entregue el acceso por otra vía.',
    failedTitle: 'No entregado',
    suppressedHelp: '¿Es correcta la dirección? Entonces desbloquéela y vuelva a enviar; si no, entregue el acceso por otra vía.',
    failedHelp: 'Compruebe la dirección y vuelva a enviar, o entregue el acceso por otra vía. La dirección figura ahora en la lista de bloqueo; un nuevo envío la desbloquea primero.',
    deliveredTitle: 'Entregado',
    deliveredHelp: 'El servidor de destino ha aceptado el correo. Si no está en la bandeja de entrada, conviene revisar la carpeta de spam.',
    delayedTitle: 'Retrasado',
    timedOutTitle: 'Entregado para su envío, recepción aún sin confirmar',
    timedOutHelp: 'Algunos proveedores solo confirman al cabo de unos minutos. Revise la bandeja de entrada (también el spam); si es necesario, vuelva a enviar.',
    sentTitle: 'Entregado para su envío',
    inviteLink: {
      title: 'Enlace de invitación: entréguelo por mensajería, SMS o en papel',
      copy: 'Copiar enlace',
      copied: 'Copiado',
      hide: 'Ocultar',
      help: 'Quien abra este enlace establece la contraseña de esta cuenta. Funciona una sola vez y durante un tiempo limitado. Si otra persona lo usa antes, la persona invitada no podrá acceder y se pondrá en contacto; entonces, simplemente cree uno nuevo.',
    },
  },

  errors: {
    notConfigured: 'El envío de correos no está configurado.',
    invalidAddress: 'Introduzca una dirección de correo electrónico válida.',
    cooldown: 'Acaba de enviarse; espere un momento antes de volver a enviar.',
    sendFailed: 'No se ha podido enviar el correo.',
    sendFailedDetail: 'No se ha podido enviar el correo: {detail}',
    providerAnswered: 'Resend respondió {status}',
    providerUnreachable: 'Resend no está disponible',
    releaseForbidden: 'La clave de Resend guardada no permite desbloquear (se requiere acceso completo).',
    releaseFailed: 'No se ha podido desbloquear (Resend respondió {status}).',
    releaseUnreachable: 'No se ha podido desbloquear: Resend no está disponible.',
  },

  fromVia: '{hotel} vía RoSe',
} satisfies Shape<MailMessages>
