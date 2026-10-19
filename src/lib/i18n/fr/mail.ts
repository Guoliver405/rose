import type { Shape } from '../format'
import type { MailMessages } from '../de/mail'

/**
 * Envoi d’e-mails — français : modèles (invitation, lien de mot de passe,
 * compte du simulateur), ligne d’état sous les boutons d’envoi et messages.
 * L’e-mail d’accès client se trouve avec les feuilles imprimées (`sheet.ts`).
 */
export const mail = {
  templates: {
    greeting: 'Bonjour,',
    fallback: 'Si le bouton ne s’ouvre pas :',
    invite: {
      subject: 'Invitation : {role} pour {hotel} dans RoSe',
      greeting: 'Bonjour {name},',
      invited: 'Une invitation vous a été adressée en tant que <b>{role}</b> pour <b>{hotel}</b> dans RoSe.',
      invitedBy: '{by} vous invite en tant que <b>{role}</b> pour <b>{hotel}</b> dans RoSe.',
      body: 'Le bouton ci-dessous vous permet de définir votre mot de passe ; connectez-vous ensuite avec cette adresse e-mail.',
      bodyText: 'Le lien ci-dessous vous permet de définir votre mot de passe ; connectez-vous ensuite avec cette adresse e-mail.',
      button: 'Définir le mot de passe',
      note: 'Le lien est valable pour une durée limitée. Si vous n’attendiez pas cette invitation, vous pouvez ignorer cet e-mail.',
    },
    recovery: {
      subject: 'Nouveau mot de passe pour RoSe',
      subjectInvite: 'Votre lien de mot de passe pour RoSe',
      intro: 'Un nouveau mot de passe a été demandé pour votre compte RoSe.',
      introInvite: 'Voici votre nouveau lien pour définir le mot de passe de votre compte RoSe.',
      button: 'Définir un nouveau mot de passe',
      buttonInvite: 'Définir le mot de passe',
      note: 'Le lien est valable pour une durée limitée et peut être ouvert sur n’importe quel appareil. Si vous n’avez pas demandé de nouveau mot de passe, vous pouvez ignorer cet e-mail — votre mot de passe reste inchangé.',
    },
    simConfirm: {
      subject: 'Merci de confirmer : votre compte pour le {tool}',
      purpose: 'Merci de confirmer votre adresse e-mail pour pouvoir utiliser le {tool} de RoSe.',
      marketing:
        'Vous avez également accepté que RoSe vous informe de temps en temps par e-mail des nouvelles fonctionnalités et offres — uniquement au sujet de RoSe. Le clic confirme aussi ce consentement ; vous pouvez le retirer à tout moment dans votre compte.',
      button: 'Confirmer l’adresse e-mail',
      note: 'Le lien est valable pour une durée limitée. Si vous n’êtes pas à l’origine de cette inscription, ignorez simplement cet e-mail — sans confirmation, le compte est supprimé au bout de sept jours.',
    },
    simExists: {
      subject: 'Vous avez déjà un compte RoSe',
      text: 'Un compte RoSe existe déjà pour cette adresse e-mail. Il n’est pas possible de créer un second compte avec la même adresse. Connectez-vous avec votre compte existant — en tant que titulaire du compte ou manager d’un établissement, vous trouverez le {tool} à l’adresse {url}.',
      button: 'Se connecter',
      buttonText: 'Se connecter : {url}',
      forgot: 'Mot de passe oublié ? Réinitialisez-le ici :',
      note: 'Si vous n’êtes pas à l’origine de cette nouvelle inscription, vous pouvez ignorer cet e-mail — rien n’a changé dans votre compte.',
    },
  },

  status: {
    queued: 'Transmission…',
    sent: 'Transmis pour envoi — en attente de la confirmation de remise…',
    delayed: 'Remise retardée : le serveur destinataire n’accepte pas pour le moment ; une nouvelle tentative aura lieu.',
    delivered: 'Remis.',
    complained: 'Le destinataire a signalé l’e-mail comme spam.',
    bounced: 'Refusé par le serveur destinataire.',
    bouncedDetail: 'Refusé par le serveur destinataire : {detail}',
    suppressed: 'Non remis : après un refus antérieur, l’adresse figure sur la liste de blocage du service d’envoi. Débloquez-la d’abord, puis renvoyez.',
    failed: 'Envoi impossible.',
    failedDetail: 'Envoi impossible : {detail}',
  },

  line: {
    againIn: 'à nouveau dans {seconds} s',
    to: ' à {recipient}',
    blockedTitle: 'Non envoyé — adresse bloquée',
    origin: {
      bounce: 'Le serveur destinataire a refusé un précédent e-mail à cette adresse',
      complaint: 'Le destinataire a signalé un précédent e-mail comme spam',
      manual: 'L’adresse a été ajoutée manuellement à la liste de blocage',
      other: 'Un précédent e-mail à cette adresse n’est pas arrivé',
    },
    blockedText: '{origin}{since}. Le service d’envoi ne remet plus rien à cette adresse tant qu’elle n’est pas débloquée.',
    reasonThen: 'Motif à l’époque : {detail}',
    canRelease: 'L’adresse est-elle correcte ? Débloquez-la alors et renvoyez. Si elle est de nouveau refusée, le nouveau motif s’affichera ici.',
    cannotRelease: 'Le déblocage n’est pas possible depuis l’application pour le moment — vérifiez l’adresse ou transmettez l’accès par un autre moyen.',
    providerHint:
      'Remarque : chez <code>{domain}</code>, {count} adresses différentes ont récemment été refusées et aucune n’a été remise (depuis {since}). Ce fournisseur n’accepte peut-être pas nos e-mails en ce moment — si rien n’arrive, transmettez l’accès par un autre moyen.',
    failedTitle: 'Non remis',
    suppressedHelp: 'L’adresse est-elle correcte ? Débloquez-la alors et renvoyez — sinon, transmettez l’accès par un autre moyen.',
    failedHelp: 'Vérifiez l’adresse et renvoyez — ou transmettez l’accès par un autre moyen. L’adresse figure désormais sur la liste de blocage ; un nouvel envoi la débloque d’abord.',
    deliveredTitle: 'Remis',
    deliveredHelp: 'Le serveur destinataire a accepté l’e-mail. S’il n’est pas dans la boîte de réception, pensez à vérifier le dossier spam.',
    delayedTitle: 'Retardé',
    timedOutTitle: 'Transmis, remise pas encore confirmée',
    timedOutHelp: 'Certains fournisseurs ne confirment qu’au bout de quelques minutes. Vérifiez la boîte de réception (y compris le spam) ; renvoyez si nécessaire.',
    sentTitle: 'Transmis',
    inviteLink: {
      title: 'Lien d’invitation — à transmettre par messagerie, SMS ou sur papier',
      copy: 'Copier le lien',
      copied: 'Copié',
      hide: 'Masquer',
      help: 'La personne qui ouvre ce lien définit le mot de passe de ce compte. Il ne fonctionne qu’une fois et pour une durée limitée. Si quelqu’un d’autre l’utilise en premier, la personne invitée échouera et se manifestera — créez alors simplement un nouveau lien.',
    },
  },

  errors: {
    notConfigured: 'L’envoi d’e-mails n’est pas configuré.',
    invalidAddress: 'Veuillez saisir une adresse e-mail valide.',
    cooldown: 'Envoi effectué à l’instant — veuillez patienter un moment avant de renvoyer.',
    sendFailed: 'L’e-mail n’a pas pu être envoyé.',
    sendFailedDetail: 'L’e-mail n’a pas pu être envoyé : {detail}',
    providerAnswered: 'Resend a répondu {status}',
    providerUnreachable: 'Resend injoignable',
    releaseForbidden: 'Le déblocage n’est pas autorisé avec la clé Resend enregistrée (accès complet requis).',
    releaseFailed: 'Échec du déblocage (Resend a répondu {status}).',
    releaseUnreachable: 'Échec du déblocage : Resend injoignable.',
  },

  fromVia: '{hotel} via RoSe',
} satisfies Shape<MailMessages>
