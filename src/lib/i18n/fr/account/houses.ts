import type { Shape } from '../../format'
import type { houses as de } from '../../de/account/houses'

/** Compte — page `/admin` (établissements et encadré du compte), ajout d’établissement, nom du compte, suppression des données, en-tête, contrôle du logo. Français. */
export const houses = {
  shell: {
    logout: 'Se déconnecter',
  },

  account: {
    heading: 'Compte',
    billingLink: 'Offre et facturation',
    houseCount: { one: '{count} établissement', other: '{count} établissements' },
    roomsActive: '{count} chambres en service',
    roomsBillable: '{count} facturables pour le mois en cours',
    expected: 'environ {amount}',
    expectedFree: 'environ {amount} (mois gratuit)',
    invoiceFailed: '<b>Une facture n’a pas pu être émise.</b> {reason} <link>Vers la facturation</link>',
    invoiceOverdue: '<b>La facture {number} est en retard de paiement.</b> Merci de la régler ; à défaut, l’accès peut être suspendu après une relance (article 6, alinéa 6 des conditions générales). <link>Voir la facture</link>',
    noPaymentMethod: '<b>Pas encore de moyen de paiement.</b> Carte, prélèvement SEPA ou virement — <link>en ajouter un maintenant</link>. Rien n’est prélevé avant la fin du mois gratuit.',
    billingRule: 'La facturation se fait par chambre et par mois civil ; toute chambre en service au cours du mois, <em>même brièvement</em>, est comptée.',
    billingNotSetUp: 'La facturation et les moyens de paiement ne sont pas encore configurés — rien n’est facturé pour le moment.',
    billingTestMode: 'Les factures sont émises chaque mois le 1er — actuellement en tant que factures de test ; rien n’est prélevé.',
    billingLive: 'Les factures sont émises chaque mois le 1er pour le mois précédent.',
  },

  list: {
    heading: 'Établissements',
    rooms: '{count} chambres',
    toClean: '{count} à nettoyer',
    allReady: 'tout est prêt',
    manager: 'Manager',
  },

  simulator: {
    text: 'Calculez votre établissement avec d’autres chiffres — personnel, horaires, occupation — sur de nombreux jours, sans coordination et avec RoSe.',
  },

  create: {
    button: 'Ajouter un établissement',
    name: 'Nom de l’établissement',
    namePlaceholder: 'p. ex. Résidence du Parc',
    submit: 'Créer',
    hint: 'L’adresse est générée à partir du nom et peut être modifiée ensuite sous Paramètres → Établissement et règles. Des services d’exemple sont également créés.',
  },

  accountName: {
    rename: 'Renommer le compte',
    save: 'Enregistrer',
    cancel: 'Annuler',
    hint: 'Le nom du compte est indépendant des noms des établissements — à la création du compte, le nom du premier établissement a été repris. Les établissements eux-mêmes se renomment sous Paramètres → Établissement et règles.',
  },

  deletion: {
    summary: 'Supprimer des données',
    summaryHint: 'Supprimer définitivement un établissement ou le compte',
    intro: 'Supprime <b>tout</b> : chambres, séjours, demandes, pointages du ménage, historique des chambres et comptes de connexion des personnes concernées. Cette opération est irréversible et sans restauration possible — il n’existe pas de sauvegarde. <b>Seules les factures sont conservées</b>, car elles sont soumises à une obligation de conservation.',
    singleHouse: 'Un établissement',
    delete: 'Supprimer',
    deleteAccount: 'Supprimer l’ensemble du compte',
    deleteAccountHint: 'Avec tous les établissements et votre propre accès. Il ne sera plus possible de se connecter ensuite.',
    loadFailed: 'Chargement impossible.',
    houseRemoved: '{name} a été entièrement supprimé.',
    headingHouse: 'Supprimer {name} — ceci disparaîtra définitivement :',
    headingAccount: 'Supprimer le compte « {name} » — ceci disparaîtra définitivement :',
    houses: { one: '{count} établissement : {names}', other: '{count} établissements : {names}' },
    rooms: { one: '{count} chambre', other: '{count} chambres' },
    stays: { one: '{count} séjour', other: '{count} séjours' },
    orders: { one: '{count} demande', other: '{count} demandes' },
    staffLog: { one: '{count} pointage d’activité', other: '{count} pointages d’activité' },
    transitions: { one: '{count} entrée d’historique de chambre', other: '{count} entrées d’historique de chambre' },
    snapshots: { one: '{count} mois de facturation enregistré', other: '{count} mois de facturation enregistrés' },
    authUsers: { one: '{count} compte de connexion avec son adresse e-mail', other: '{count} comptes de connexion avec leurs adresses e-mail' },
    authUsersKept: {
      one: '{count} compte de connexion est conservé — cette personne est encore rattachée à d’autres établissements.',
      other: '{count} comptes de connexion sont conservés — ces personnes sont encore rattachées à d’autres établissements.',
    },
    finalBill: 'Résiliation à la fin du mois : lors de la suppression, une facture finale de <b>{amount}</b> HT est émise pour {month} ({rooms}) — prélevée via le moyen de paiement enregistré ou, sans carte ni prélèvement, avec une page de paiement affichée ici après la suppression.',
    finalBillFree: '{month} est votre mois gratuit — rien de plus n’est facturé lors de la suppression.',
    finalBillRooms: { one: '{count} chambre', other: '{count} chambres' },
    accountDeleted: 'Le compte a été supprimé.',
    openInvoicesHint: 'Une facture est encore impayée. Ouvrez la page de paiement et téléchargez-y la facture — une fois cette page quittée, vous n’y aurez plus accès.',
    openInvoiceLink: 'Voir et payer la facture {n}',
    toLogin: 'Vers la connexion',
    confirmLabel: 'Saisissez « {phrase} » pour confirmer',
    deleting: 'Suppression…',
    confirm: 'Oui, supprimer définitivement',
    cancel: 'Annuler',
  },

  logo: {
    empty: 'Le fichier est vide.',
    tooLarge: 'Le fichier est trop volumineux ({kb} Ko). 1 Mo maximum.',
    wrongType: 'PNG, JPG ou SVG uniquement — le fichier n’est dans aucun de ces formats.',
  },

  errors: {
    noPermission: 'Accès non autorisé.',
    accountNameTooShort: 'Le nom du compte doit comporter au moins 2 caractères.',
    accountNameTooLong: 'Le nom du compte peut comporter au maximum 80 caractères.',
    houseNameTooShort: 'Le nom de l’établissement doit comporter au moins 2 caractères.',
    createFailed: 'Échec de la création : {message}',
    ownerOnlyDelete: 'Seul le titulaire du compte peut supprimer des données.',
    ownerOnlyDeleteAccount: 'Seul le titulaire du compte peut supprimer le compte.',
    houseNotFound: 'Établissement introuvable.',
    confirmPhrase: 'Veuillez saisir « {phrase} » pour confirmer.',
    deleteFailed: 'Échec de la suppression : {message}',
    finalInvoiceFailed: 'La facture finale du mois en cours n’a pas pu être créée ({message}). Le compte n’a pas été supprimé — vérifiez les données de facturation sous « Offre et facturation » et réessayez.',
  },
} satisfies Shape<typeof de>
