import type { Shape } from '../../format'
import type { SimulatorMessages } from '../../de/simulator'

/** Simulateur Housekeeping — compte, français. */
export const account = {
  /**
   * Libellé du consentement marketing — version propre à chaque langue
   * (`MARKETING_TEXT_VERSIONS` dans `lib/sim-account.ts`). Texte modifié ⇒ nouvelle version.
   */
  marketing: {
    text: 'Oui, RoSe peut m’informer de temps en temps par e-mail des nouvelles fonctionnalités et des offres spéciales — uniquement au sujet de RoSe. Mon adresse ne sera pas transmise à des tiers. Je peux me désabonner à tout moment en un clic ou depuis mon compte.',
    optional: '(facultatif)',
  },

  signup: {
    metaTitle: 'Inscription – {tool}',
    intro: 'Gratuit et sans données de paiement. Après l’inscription, vous confirmez votre adresse e-mail via un lien.',
    mailNotReady: 'L’inscription n’est pas possible pour le moment, car l’envoi d’e-mails n’est pas configuré.',
    email: 'E-mail',
    password: 'Mot de passe',
    passwordHint: 'Au moins {min} caractères.',
    submit: 'S’inscrire gratuitement',
    submitting: 'Création…',
    terms:
      'En vous inscrivant, vous acceptez les <terms>conditions d’utilisation du simulateur</terms> (en allemand). La manière dont nous traitons vos données est décrite dans la <privacy>politique de confidentialité</privacy> (en allemand).',
    haveAccount: 'Vous avez déjà un compte ? <link>Se connecter</link>',
    resendLink: 'Renvoyer le lien de confirmation',
    sent: {
      title: 'Veuillez confirmer votre adresse',
      text: 'Nous avons envoyé un e-mail à <code>{email}</code>. Le lien qu’il contient active votre compte et vous connecte. Il peut être ouvert sur n’importe quel appareil.',
      hint: 'Rien reçu ? Vérifiez aussi votre dossier de courrier indésirable. Si un compte existe déjà pour cette adresse, l’e-mail explique la marche à suivre.',
      again: 'Renvoyer l’e-mail',
      againIn: 'Renvoyer dans {seconds} s',
    },
    resend: {
      linkExpired: 'Le lien de confirmation a expiré ou a déjà été utilisé. Demandez-en un nouveau.',
      submit: 'Envoyer un nouveau lien de confirmation',
      signupInstead: 'Vous inscrire à nouveau',
    },
  },

  konto: {
    metaTitle: 'Mon compte – {tool}',
    title: 'Mon compte',
    access: {
      title: 'Accès',
      email: 'E-mail : <code>{email}</code>',
      password: 'Changer de mot de passe : via <link>Mot de passe oublié ?</link> — vous recevrez un lien à cette adresse.',
      hotel: 'Cet accès appartient à un compte d’établissement ; vous l’utilisez pour le simulateur, sans compte distinct.',
    },
    marketing: {
      title: 'Actualités de RoSe par e-mail',
      saved: 'Enregistré — merci !',
      unsubscribed: 'Désabonnement effectué. Vous ne recevrez plus d’e-mails promotionnels.',
      since: 'Consentement donné le {date}.',
      none: 'Aucun consentement donné.',
    },
    delete: {
      titleSim: 'Supprimer le compte',
      titleHotel: 'Supprimer les données du simulateur',
      textSim: 'Supprime immédiatement et définitivement votre accès, vos scénarios enregistrés et votre consentement.',
      textHotel: 'Supprime vos scénarios enregistrés et votre consentement. Votre accès à l’établissement est conservé.',
      confirmLabel: 'Saisissez « {phrase} » pour confirmer',
      submit: 'Supprimer définitivement',
    },
  },

  deletePhrase: 'SUPPRIMER',

  convert: {
    title: 'Démarrer avec RoSe pour votre établissement',
    intro:
      'Essayez RoSe gratuitement pendant au moins un mois — sans données de paiement. S’il ne vous convainc pas, supprimez simplement le compte avant la fin de cette période ; aucun frais. Votre accès et vos scénarios restent inchangés.',
    prices: 'Tarifs',
    next: 'Continuer',
    closed: 'L’inscription d’un établissement se fait actuellement uniquement sur invitation et n’est pas ouverte en ce moment. Écrivez-nous — l’adresse figure dans les mentions légales.',
    houseName: 'Nom de l’établissement',
    yourName: 'Votre nom',
    inviteCode: 'Code d’invitation',
    take: 'Repris du simulateur',
    rooms: {
      one: '{rooms} chambres sur un étage, numérotées 101, 102… — modifiable à tout moment dans la configuration des chambres',
      other: '{rooms} chambres sur {count} étages, numérotées 101, 102… — modifiable à tout moment dans la configuration des chambres',
    },
    rulesDaily: 'Règles : ménage quotidien des chambres en recouche à partir de {from}, check-out jusqu’à {checkout}, check-in à partir de {checkin}',
    rulesOnDemand: 'Règles : ménage des chambres en recouche uniquement à la demande, check-out jusqu’à {checkout}, check-in à partir de {checkin}',
    rulesHint: 'Suit le choix « quotidien / uniquement à la demande » ci-dessus ; modifiable sous « Établissement et règles ».',
    submit: 'Créer le compte d’établissement',
    submitting: 'Création…',
    cancel: 'Annuler',
    after: 'Ensuite : moyen de paiement (facultatif) et configuration. Les conditions générales (en allemand) s’appliquent.',
  },

  errors: {
    emailInvalid: 'Veuillez saisir une adresse e-mail valide.',
    passwordShort: 'Le mot de passe doit comporter au moins {min} caractères.',
    passwordLong: 'Le mot de passe peut comporter au plus {max} caractères.',
    signInAgain: 'Veuillez vous reconnecter.',
    deletePhrase: 'Veuillez saisir « {phrase} » pour confirmer.',
    mailNotReady: 'L’inscription n’est pas possible pour le moment (l’envoi d’e-mails n’est pas configuré).',
    signupThrottled: 'Trop d’inscriptions viennent d’être faites depuis cette connexion. Veuillez réessayer dans une heure.',
    resendThrottled: 'Trop de demandes viennent d’être faites depuis cette connexion. Veuillez réessayer dans une heure.',
    signupFailed: 'Le compte n’a pas pu être créé. Veuillez réessayer plus tard.',
    notSaved: 'Impossible d’enregistrer.',
    confirmFirst: 'Veuillez d’abord confirmer votre adresse e-mail.',
    deleteFailed: 'Le compte n’a pas pu être supprimé. Veuillez réessayer plus tard.',
    scenarioName: 'Veuillez saisir un nom.',
    scenarioSaveFailed: 'Le scénario n’a pas pu être enregistré.',
    scenarioLimit: '{max} scénarios au plus — veuillez d’abord en supprimer un.',
    scenarioRenameFailed: 'Échec du renommage.',
    scenarioDeleteFailed: 'Échec de la suppression.',
    convertConfirmedOnly: 'Uniquement pour les comptes du simulateur confirmés.',
    convertExists: 'Un compte d’établissement existe déjà pour cet accès.',
    convertHouseName: 'Veuillez saisir le nom de l’établissement.',
    convertYourName: 'Veuillez saisir votre nom.',
    convertTooManyRooms:
      '{max} chambres au plus peuvent être reprises directement — veuillez convertir sans chambres et les créer dans la configuration des chambres.',
    convertFailed: 'Le compte d’établissement n’a pas pu être créé.',
  },
} satisfies Shape<SimulatorMessages['account']>
