import type { Shape } from '../format'
import type { AuthMessages } from '../de/auth'

/** Connexion, inscription et mot de passe — français. Lecteurs : titulaires du compte, managers, réception. */
export const auth = {
  login: {
    title: 'Connexion',
    email: 'E-mail',
    password: 'Mot de passe',
    submit: 'Se connecter',
    submitting: 'Connexion…',
    forgot: 'Mot de passe oublié ?',
    noAccount: 'Pas encore de compte ? <link>Inscrire votre établissement</link>',
  },

  signup: {
    title: 'Créer un compte',
    /** Nur mit Zahlungsweg (Stripe): Schritt 2 ist dann die Seite „Zahlungsweg“. */
    step: 'Étape 1 sur 2 — compte et établissement',
    inviteCode: 'Code d’invitation',
    inviteCodeHint: 'RoSe est en phase de test précoce — l’inscription est encore réservée aux établissements invités.',
    houseName: 'Nom de l’établissement',
    houseNamePlaceholder: 'p. ex. Auberge du Lac',
    yourName: 'Votre nom',
    yourNamePlaceholder: 'p. ex. Anne Martin',
    email: 'E-mail (connexion)',
    password: 'Mot de passe',
    passwordHint: 'Au moins {min} caractères.',
    submit: 'Créer le compte',
    submitting: 'Création…',
    terms:
      'En créant le compte, vous acceptez les <terms>conditions générales</terms> et prenez connaissance de la <privacy>politique de confidentialité</privacy>. Le mois civil de l’inscription et le premier mois complet qui suit sont gratuits.',
    nextStep: 'À l’étape suivante, vous configurez les chambres. Des services d’exemple sont déjà créés et peuvent être modifiés à tout moment.',
    haveAccount: 'Vous avez déjà un compte ? <link>Se connecter</link>',
  },

  forgot: {
    title: 'Réinitialiser le mot de passe',
    linkInvalid: 'Le lien a expiré ou a déjà été utilisé. Veuillez en demander un nouveau.',
    email: 'E-mail',
    submit: 'Envoyer le lien de réinitialisation',
    submitting: 'Envoi…',
    sentTitle: 'L’e-mail est en route',
    sentText:
      'Si un compte existe pour <code>{email}</code>, un lien arrivera sous peu dans cette boîte de réception. Il est valable pour une durée limitée et peut être ouvert sur n’importe quel appareil.',
    sentSpam: 'Rien reçu ? Vérifiez aussi votre dossier spam.',
    again: 'Demander à nouveau',
    againIn: 'Demander à nouveau dans {seconds} s',
    backToLogin: 'Retour à la connexion',
  },

  newPassword: {
    titleInvite: 'Configurer votre accès',
    title: 'Définir un nouveau mot de passe',
    introInvite: 'Bienvenue ! Définissez un mot de passe pour <b>{email}</b>. Après l’enregistrement, la connexion se fait automatiquement.',
    intro: 'Pour <b>{email}</b>. Après l’enregistrement, la connexion se fait automatiquement.',
    linkInvalid: 'Ce lien n’est plus valable — il a expiré ou a déjà été utilisé.',
    requestNew: 'Demander un nouveau lien',
    password: 'Nouveau mot de passe',
    passwordHint: 'Au moins {min} caractères.',
    confirm: 'Confirmer',
    submit: 'Enregistrer le mot de passe',
    submitting: 'Enregistrement…',
    backToLogin: 'Retour à la connexion',
  },

  errors: {
    loginFailed: 'Échec de la connexion — e-mail ou mot de passe incorrect.',
    confirmEmailFirst: 'Veuillez d’abord confirmer votre adresse e-mail — nous vous avons envoyé le lien lors de l’inscription.',
    notForReception: 'Ce compte n’est pas activé pour la réception.',
    invalidEmail: 'Veuillez saisir une adresse e-mail valide.',
    passwordTooShort: 'Le mot de passe doit comporter au moins {min} caractères.',
    houseNameMissing: 'Veuillez saisir le nom de l’établissement.',
    yourNameMissing: 'Veuillez saisir votre nom.',
    emailTaken: 'Un compte existe déjà pour cette adresse e-mail. Veuillez vous connecter.',
    accessNotCreated: 'L’accès n’a pas pu être créé.',
    accountNotCreated: 'Le compte n’a pas pu être créé.',
    signInAfterSignupFailed: 'Le compte a été créé, mais la connexion a échoué. Veuillez vous connecter via la page de connexion.',
    mailNotConfigured: 'L’envoi d’e-mails n’est pas configuré. Veuillez contacter l’exploitant.',
    passwordsDiffer: 'Les deux mots de passe ne correspondent pas.',
    sessionExpired: 'La session a expiré. Veuillez demander un nouveau lien.',
    samePassword: 'C’est déjà votre mot de passe actuel. Veuillez en choisir un autre.',
    signupClosed: 'L’inscription des établissements n’est pas ouverte pour le moment.',
    inviteCodeWrong: 'Le code d’invitation est incorrect.',
    createAccountFailed: 'Le compte n’a pas pu être créé : {detail}',
    createHouseFailed: 'L’établissement n’a pas pu être créé : {detail}',
    createProfileFailed: 'Le profil n’a pas pu être créé : {detail}',
    createOwnerFailed: 'Le titulaire du compte n’a pas pu être ajouté : {detail}',
  },
} satisfies Shape<AuthMessages>
