import type { Shape } from '../format'
import type { GuestMessages } from '../de/guest'

/**
 * Portail client — français (19.10.2026). Structure et contexte de chaque
 * texte : `de/guest.ts` et `de/guest.context.ts`. On vouvoie le client,
 * l’établissement parle à la première personne du pluriel. Les libellés des
 * boutons figurent aussi sur la feuille imprimée : ils restent courts.
 */
export const guest = {
  brand: {
    portal: 'Portail client',
    signIn: 'Portail client — Connexion',
  },

  login: {
    room: 'Chambre {number}',
    roomNumber: 'Numéro de chambre',
    roomNumberPlaceholder: 'p. ex. 101',
    pin: 'PIN',
    submit: 'Se connecter',
    submitting: 'Connexion…',
    pinHint: 'Vous recevez votre code PIN au check-in, à la réception.',
    linkModeHint:
      'Nous utilisons des accès personnels : scannez le QR code de la feuille reçue au check-in ou ouvrez le lien de votre e-mail. Le formulaire ci-dessous ne sert que si vous avez reçu un code PIN au check-in.',
    invalidLink: 'Ce lien n’est pas valable.',
    invalidLinkHint: 'Veuillez vous adresser à la réception.',
  },

  entry: {
    scanTitle: 'Veuillez scanner le QR code dans votre chambre.',
    scanText:
      'Vous pouvez aussi utiliser l’adresse web de l’établissement, indiquée sur la feuille reçue au check-in. La réception est à votre disposition.',
    expiredTitle: 'Cet accès n’est plus valable.',
    expiredText:
      'Cet accès valait pour un séjour et a expiré au check-out. Pour un nouveau séjour, la réception vous remettra un nouvel accès et reste à votre disposition.',
  },

  status: {
    room: 'Chambre {number}',
    signOut: 'Se déconnecter',
    inProgress: {
      title: 'Votre chambre est en cours de ménage.',
      text: 'L’équipe d’étage est dans votre chambre.',
    },
    scheduled: {
      title: 'Le ménage est prévu.',
      text: 'L’équipe d’étage passera aujourd’hui.',
    },
    scheduledFrom: {
      title: 'Ménage aujourd’hui à partir de {time}.',
      guest: 'Votre demande est bien reçue — personne ne viendra avant.',
      door: 'Comme convenu à votre porte, personne ne viendra avant.',
      daily: 'Nous faisons le ménage chaque jour. Si vous n’en avez pas besoin aujourd’hui, appuyez sur « Pas de ménage aujourd’hui ».',
    },
    dnd: {
      title: 'Pas de ménage — vous ne souhaitez pas être dérangé.',
      text: 'Désactivez « Ne pas déranger » si vous souhaitez finalement le ménage.',
    },
    done: {
      title: 'Votre chambre a été faite aujourd’hui à {time}.',
      text: 'Vous souhaitez un nouveau ménage ? Appuyez sur « Nettoyer ma chambre ».',
    },
    declined: {
      title: 'Pas de ménage aujourd’hui.',
      text: 'Merci, cela économise eau et lessive. Vous avez changé d’avis ? Appuyez sur « Nettoyer ma chambre ».',
    },
    departure: {
      title: 'Aujourd’hui est votre jour de départ.',
      text: 'La chambre sera faite après le check-out. Vous souhaitez un ménage avant ? Appuyez sur « Nettoyer ma chambre ».',
    },
    none: {
      title: 'Aucun ménage n’est prévu aujourd’hui.',
      firstDay: 'À partir de demain, nous faisons le ménage chaque jour dès {time}. Vous souhaitez un ménage dès aujourd’hui ? Appuyez sur « Nettoyer ma chambre ».',
      onRequest: 'Nous faisons le ménage à la demande : appuyez sur « Nettoyer ma chambre » quand vous le souhaitez.',
    },
  },

  signal: {
    clean: {
      label: 'Nettoyer ma chambre',
      active: 'Demande active — appuyez à nouveau pour l’annuler',
      activeFrom: 'Demande active — pas avant {time}. Appuyez à nouveau pour l’annuler',
      blocked: 'Impossible pour le moment',
      idle: 'L’équipe d’étage sera prévenue',
      idleFrom: 'L’équipe d’étage viendra au plus tôt à {time}',
    },
    defer: {
      title: 'Pas avant',
      now: 'maintenant',
      onlyNow: 'Aujourd’hui, seul « maintenant » est encore possible.',
      limit:
        'Vous pouvez reporter le ménage jusqu’à <b>{limit}</b> au plus tard — personne ne viendra avant. Cette limite nous permet de faire votre chambre le jour même.',
    },
    window:
      'Nous acceptons les demandes de ménage chaque jour entre <b>{start}</b> et <b>{end}</b>. Pendant ces horaires, appuyez de nouveau sur « Nettoyer ma chambre » ou adressez-vous à la réception.',
    skip: {
      label: 'Pas de ménage aujourd’hui',
      active: 'Merci ! Valable aujourd’hui seulement — appuyez à nouveau pour l’annuler',
      idle: 'Les services viennent quand même. Le ménage reprend demain.',
    },
    dnd: {
      label: 'Ne pas déranger',
      active: 'Activé — appuyez à nouveau pour désactiver',
      idle: 'Personne ne frappe, pas même pour un service.',
    },
  },

  services: {
    heading: 'Demander un service',
    links: 'Liens utiles',
    opensExternally: '{host} · s’ouvre dans une nouvelle fenêtre',
    orders: 'Vos demandes',
    notePlaceholder: 'Remarque (facultatif)',
    order: 'Commander',
    report: 'Signaler',
    sending: 'Envoi…',
    sent: 'La réception a bien reçu votre demande.',
    fallbackName: 'Service',
    orderStatus: {
      open: 'en attente',
      done: 'fait',
      cancelled: 'annulé',
    },
  },

  review: {
    hint: 'Votre séjour vous a plu ?',
    button: {
      google: 'Nous évaluer sur Google',
      tripadvisor: 'Nous évaluer sur Tripadvisor',
      booking: 'Nous évaluer sur Booking.com',
      holidaycheck: 'Nous évaluer sur HolidayCheck',
      other: 'Laisser un avis',
    },
  },

  thanks: {
    title: 'Merci pour votre séjour !',
    text: 'Votre séjour est terminé et votre accès au portail client a expiré.',
    review: 'Un avis nous ferait très plaisir — il aide d’autres voyageurs à choisir.',
    signInAgain: 'Nouveau séjour ? Se reconnecter',
  },

  errors: {
    loginFailed: 'Échec de la connexion — numéro de chambre ou code PIN incorrect.',
    pinFormat: 'Veuillez saisir le code PIN (chiffres uniquement).',
    tooManyAttempts: 'Trop de tentatives échouées — veuillez réessayer dans {minutes} min.',
    tooManyFromNetwork: 'Trop de tentatives échouées — veuillez réessayer dans {minutes} min ou vous adresser à la réception.',
    sessionExpired: 'Votre session a expiré — veuillez vous reconnecter.',
    invalidSignal: 'Choix non valable.',
    outsideWindow: 'Les demandes de ménage ne sont possibles qu’entre {start} et {end}.',
    deferNotAllowed: 'Notre établissement ne propose pas le report du ménage.',
    deferPast: 'L’heure choisie est déjà passée.',
    deferTooLate: 'Le ménage ne peut être reporté que jusqu’à {time}.',
    saveFailed: 'Échec de l’enregistrement — veuillez réessayer.',
    serviceUnavailable: 'Ce service n’est plus disponible.',
    serviceIsLink: 'Cette entrée est un lien et n’accepte pas de demandes.',
    pickOption: 'Veuillez choisir au moins une option.',
    sendFailed: 'Votre demande n’a pas pu être envoyée — veuillez réessayer.',
    onRequestOnly: 'Notre établissement fait le ménage uniquement à la demande.',
  },
} satisfies Shape<GuestMessages>
