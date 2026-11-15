import type { Shape } from '../format'
import type { PartnerMessages } from '../de/partner'

/** Programme partenaires — français (France), vouvoiement. Lecteurs : propriétaires, managers, réception, comptes du simulateur. */
export const partner = {
  metaTitle: 'Programme partenaires – RoSe',

  header: {
    title: 'Programme partenaires',
    backHouses: 'Établissements',
    backHouse: 'Vers la vue d’ensemble',
    backSimulator: 'Simulateur',
    signOut: 'Se déconnecter',
  },

  entry: {
    title: 'Programme partenaires',
    text: 'Recommandez RoSe et touchez une part de chaque facture payée.',
    open: 'Ouvrir',
  },

  join: {
    title: 'Recommandez RoSe et gagnez avec nous',
    intro: 'Recommandez RoSe aux établissements que vous connaissez. Pour chaque établissement qui s’inscrit via votre lien, vous recevez {rate} de chaque facture payée — durablement, tant que l’établissement reste client.',
    points: [
      'Votre lien personnel et un code QR à transmettre',
      'Une commission sur chaque facture payée, sans limite de durée',
      'Une vue d’ensemble des comptes parrainés et de votre commission',
    ],
    payoutNote: 'Les versements suivront dans une étape ultérieure. Votre commission est cumulée dès le premier jour.',
    terms: 'J’ai lu les <terms>conditions du programme partenaires</terms> et je les accepte.',
    submit: 'Devenir partenaire',
    submitting: 'Création en cours …',
  },

  link: {
    title: 'Votre lien',
    text: 'Toute personne qui s’inscrit via ce lien vous est attribuée. Le code peut aussi être saisi à la main sous « Recommandé par » lors de l’inscription.',
    linkLabel: 'Lien',
    codeLabel: 'Code',
    copy: 'Copier',
    copied: 'Copié',
    qrAlt: 'Code QR avec votre lien partenaire',
    qrHint: 'Pour imprimer ou transmettre : clic droit ou appui long sur le code QR, puis enregistrer.',
  },

  notApproved: {
    title: 'Pas encore validé',
    text: 'L’inscription n’est actuellement ouverte que sur invitation. Votre lien attribue déjà les inscriptions, mais il n’ouvre l’inscription qu’une fois que nous vous avons validé. Pour cela, écrivez-nous à {email}.',
  },

  stats: {
    title: 'Vos chiffres',
    accounts: 'Comptes parrainés',
    accountsPaying: 'dont {count} avec une facture payée',
    rooms: 'Chambres',
    roomsHint: 'facturées pour {month}',
    roomsNone: 'pas encore de facturation',
    pending: 'En attente',
    pendingHint: 'disponible {days} jours après le paiement',
    available: 'Disponible',
    availableHint: 'les versements suivront',
    reversed: 'Annulé',
    reversedHint: 'après un remboursement ou une contestation',
    privacy: 'Vous voyez des chiffres, pas les noms des établissements parrainés.',
  },

  months: {
    title: 'Commission par mois',
    month: 'Mois de prestation',
    amount: 'Commission',
    pending: 'dont en attente',
    reversed: 'annulé',
    empty: 'Pas encore de commission. Elle naît dès qu’un établissement parrainé a payé sa première facture.',
  },

  errors: {
    signInAgain: 'Veuillez vous reconnecter.',
    notEligible: 'Vous ne pouvez pas devenir partenaire avec ce compte.',
    termsMissing: 'Veuillez accepter les conditions du programme partenaires.',
    failed: 'Cela n’a pas fonctionné. Veuillez réessayer.',
  },
} satisfies Shape<PartnerMessages>
