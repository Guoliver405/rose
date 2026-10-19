import type { Shape } from '../../format'
import type { billing as de } from '../../de/account/billing'

/**
 * Compte — offre et facturation, moyen de paiement, données de facturation,
 * factures. Français. Les textes de la facture Stripe (`invoice`) s’adressent
 * aux clients francophones (`invoiceLocale` dans `lib/invoice.ts`).
 */
export const billing = {
  kinds: {
    card: 'Carte',
    sepa_debit: 'Prélèvement SEPA',
    bank_transfer: 'Facture (virement)',
  },

  page: {
    title: 'Offre et facturation',
    backToHouses: 'Établissements',
    notice: {
      testTitle: 'Mode test — rien n’est prélevé.',
      testText:
        'Les factures sont émises chaque mois le 1er pour le mois précédent, mais actuellement via l’environnement de test de notre prestataire de paiement : ce sont des factures de test, et les cartes et comptes enregistrés ne sont pas débités. Nous vous en informerons par écrit avant le passage en exploitation réelle.',
      noneTitle: 'Rien n’est facturé pour le moment.',
      noneText:
        'La facturation et les moyens de paiement ne sont pas encore configurés. Les montants de cette page indiquent ce que le compte coûterait selon le modèle tarifaire. Avant le premier prélèvement, nous vous en informerons par écrit et vous pourrez ajouter un moyen de paiement — d’ici là, aucun coût.',
    },
    free: {
      label: 'gratuit',
      title: 'Mois gratuit : le mois civil de l’inscription et le premier mois complet qui suit.',
    },
    insteadOf: 'au lieu de {amount}',
    plusVat: 'HT',
    plan: {
      title: 'Votre offre',
      perRoom: 'par chambre et par mois, HT',
      minimum: 'Montant minimum de <b>{amount}</b> par compte et par mois — un prix forfaitaire jusqu’à {rooms} chambres.',
      text:
        'Un seul prix pour toutes les tailles d’établissement, toutes les fonctionnalités comprises. Il n’y a pas de formules ni rien à quoi il faudrait passer plus tard. Votre compte existe depuis le {registered} et est gratuit jusqu’à la fin de {freeUntil} — le mois de l’inscription et le premier mois civil complet qui suit ne coûtent rien.',
    },
    current: {
      title: 'Mois en cours — {month}',
      colHouse: 'Établissement',
      colRooms: 'Chambres facturables',
      total: 'Total',
      expected: 'Montant estimé :',
      note:
        'Toute chambre en service au cours du mois, même brièvement, est comptée — une chambre mise hors service aujourd’hui compte encore pour ce mois, tout comme une chambre créée aujourd’hui. Le nombre n’est définitif qu’à la fin du mois.',
    },
    closed: {
      title: 'Mois clôturés',
      empty: 'Aucun mois clôturé pour le moment — le premier apparaîtra ici à partir du 1er du mois suivant.',
      colMonth: 'Mois',
      colRooms: 'Chambres',
      colAmount: 'Montant',
      colStatus: 'Statut',
      fixed: 'enregistré',
      fixedTitle: 'Enregistré avant la suppression de chambres — ce nombre ne change plus.',
      notCharged: 'non facturé',
      note:
        'Les mois clôturés sont enregistrés dès que des chambres sont supprimées — sinon, une chambre supprimée disparaîtrait rétroactivement de périodes déjà facturées. Tant que rien n’est supprimé, le décompte à partir des chambres elles-mêmes fait tout autant foi.',
    },
    paymentMethod: {
      title: 'Moyen de paiement',
      unavailable:
        'Pas encore de moyen de paiement — et aucun ne peut être choisi pour le moment. Dès que la facturation sera configurée, vous pourrez en ajouter un ici. Nous vous en informerons par écrit au préalable.',
      none: 'Pas encore de moyen de paiement.',
      invoiceTo: 'Facture à <b>{name}</b>, {postalCode} {city}, {country}',
      vatId: ' · N° de TVA intracommunautaire {vatId}',
      detailsMissing: 'Les données de facturation manquent encore.',
      change: 'Modifier le moyen de paiement et les données de facturation',
      add: 'Ajouter un moyen de paiement',
    },
    invoices: {
      title: 'Factures',
      emptyStripe:
        'Pas encore de facture. La première est émise le 1er du mois suivant le mois gratuit — mensuellement à terme échu, par voie électronique, payable sous 14 jours sans escompte.',
      emptyNone:
        'Pas encore de factures. Elles apparaîtront ici dès que la facturation sera configurée — mensuellement à terme échu, par voie électronique, payables sous 14 jours sans escompte.',
      net: '{amount} HT',
      due: 'échéance le {date}',
      pdf: 'PDF',
      view: 'Voir',
      viewPay: 'Voir / payer',
    },
    status: {
      draft: 'en préparation',
      open: 'à payer',
      paid: 'payée',
      uncollectible: 'irrécouvrable',
      void: 'annulée',
      overdue: 'en retard',
    },
    terms: {
      title: 'Modalités de facturation',
      interval:
        '<b>Période de facturation :</b> mois civil, mensuellement à terme échu — la facture arrive par e-mail le 1er du mois suivant et apparaît ici.',
      payment:
        '<b>Paiement :</b> avec une carte ou un prélèvement enregistré, le paiement est encaissé à l’émission de la facture (prélèvement après pré-notification) ; sinon sous 14 jours par virement ou via la page de paiement.',
      minimum: '<b>Montant minimum par compte,</b> et non par établissement — plusieurs établissements paient la somme de leurs chambres.',
      inactive: '<b>Les chambres hors service</b> (travaux, saison) ne comptent pas tant qu’elles sont hors service pendant tout le mois.',
      cancel:
        '<b>Sans durée minimale :</b> résiliable chaque mois pour la fin du mois. La suppression du compte sous « Supprimer des données » vaut également résiliation.',
      net: '<b>Tous les prix sont hors taxes,</b> TVA légale en sus.',
      details: 'Détails dans les <link>conditions générales</link>, articles 6 et 7.',
    },
  },

  paymentPage: {
    backToBilling: 'Offre et facturation',
    title: 'Moyen de paiement et données de facturation',
    step: {
      title: 'Étape 2 sur 2 — moyen de paiement',
      text:
        'Votre compte et votre établissement sont créés. Ajoutez maintenant les données de facturation et un moyen de paiement — rien n’est prélevé ; le mois de l’inscription et le premier mois complet qui suit sont gratuits. Vous pouvez aussi effectuer cette étape plus tard sur la page « Offre et facturation ».',
      later: 'Plus tard — continuer vers la configuration des chambres',
    },
    saveFailed: 'La carte ou le compte n’a pas pu être enregistré : {error}',
    confirmCancelled: 'La confirmation de la carte ou du compte a été interrompue. Veuillez réessayer.',
  },

  details: {
    title: 'Données de facturation',
    intro:
      'Elles figurent sur chaque facture. L’adresse détermine la TVA : Allemagne 19 % ; entreprises de l’UE disposant d’un numéro de TVA intracommunautaire sans TVA allemande (autoliquidation) ; hors UE sans TVA allemande. La langue de la facture dépend également du pays : allemand, français ou espagnol pour les pays qui les parlent, anglais sinon.',
    name: 'Destinataire de la facture (société)',
    line1: 'Rue et numéro',
    line2: 'Complément d’adresse (facultatif)',
    postalCode: 'Code postal',
    city: 'Ville',
    country: 'Pays',
    vatId: 'Numéro de TVA intracommunautaire {suffix}',
    vatRequired: '(obligatoire)',
    vatOptional: '(facultatif)',
    vatNotApplicable: '(sans objet)',
    vatStatus: 'Statut : {status}',
    vatStatusText: {
      pending: 'vérification en cours',
      verified: 'vérifié',
      unverified: 'échec de la vérification — veuillez vérifier le numéro',
      unavailable: 'service de vérification indisponible, nouvelle tentative ultérieure',
    },
    vatHint:
      'Les entreprises de l’UE hors Allemagne ont besoin d’un numéro de TVA intracommunautaire — c’est seulement ainsi que la facture peut être émise sans TVA allemande.',
    submit: 'Enregistrer les données de facturation',
    submitting: 'Enregistrement…',
    saved: 'Enregistré',
  },

  panel: {
    title: 'Moyen de paiement',
    remove: 'Retirer',
    none:
      'Pas encore de moyen de paiement. Trois possibilités, toutes via notre prestataire de paiement Stripe : la carte ou le prélèvement SEPA sont enregistrés ici et débités chaque mois ; avec la facture et le virement, rien n’est enregistré, et chaque facture indique des coordonnées bancaires avec une référence de paiement.',
    detailsFirst:
      'Veuillez d’abord enregistrer les données de facturation ci-dessus — elles figurent sur la facture et déterminent la TVA.',
    change: 'Modifier la carte ou le prélèvement',
    add: 'Ajouter une carte ou un prélèvement SEPA',
    bankTransfer: 'Facture (virement)',
    bankTransferChosen: 'Facture (virement) sélectionnée.',
    saved: '{label} enregistré.',
    stripeUnreachable: 'Stripe injoignable.',
    notes:
      'Virement : la facture indique les coordonnées bancaires de notre prestataire de paiement avec une référence de paiement ; les paiements reçus sont rapprochés automatiquement, délai de paiement 14 jours. Prélèvement : débité à l’émission de la facture, après pré-notification. Carte : débitée à l’émission de la facture.',
    next: 'Continuer vers la configuration des chambres',
    form: {
      confirmFailed: 'La confirmation a échoué.',
      notConfirmed: 'Carte ou compte pas encore confirmé ({status}).',
      unknownStatus: 'inconnu',
      submit: 'Enregistrer la carte ou le compte',
      submitting: 'Enregistrement…',
      cancel: 'Annuler',
      preferTransfer:
        'Vous préférez ne pas enregistrer de carte ni de compte ? <link>Choisir la facture (virement)</link> — chaque facture indique alors des coordonnées bancaires et une référence de paiement, délai de paiement 14 jours.',
      noCharge:
        'Rien n’est prélevé. La carte ou le compte est enregistré chez Stripe et utilisé pour les factures mensuelles ; RoSe ne voit jamais les données de carte ou de compte.',
    },
  },

  labels: {
    card: '{brand} •••• {last4}',
    sepaDebit: 'Prélèvement SEPA •••• {last4}',
    bankTransfer: 'Facture (virement)',
  },

  invoice: {
    rooms: { one: '{count} chambre', other: '{count} chambres' },
    line: 'RoSe — utilisation en {month} : {rooms} × {price}',
    lineMinimum: 'RoSe — utilisation en {month} : {rooms} (montant minimum de {minimum} par mois)',
    memo: 'Période de prestation : {range}. Toute chambre en service au cours du mois, même brièvement, est facturée.',
    periodField: 'Période de prestation',
    managingDirector: 'Gérant : {name}',
    vatId: 'N° de TVA intracommunautaire : {vatId}',
    due: 'Payable sous {days} jours, sans escompte.',
  },

  errors: {
    noPermission: 'Accès non autorisé.',
    notReady: 'Les moyens de paiement ne sont pas encore configurés.',
    stripeUnreachable: 'Stripe injoignable.',
    invalidId: 'Identifiant non valide.',
    vat: {
      nameMissing: 'Veuillez indiquer le destinataire de la facture.',
      countryMissing: 'Veuillez sélectionner un pays.',
      line1Missing: 'Veuillez indiquer la rue et le numéro.',
      postalCodeMissing: 'Veuillez indiquer le code postal.',
      cityMissing: 'Veuillez indiquer la ville.',
      outsideEu: 'Les numéros de TVA intracommunautaire n’existent que pour les entreprises de l’UE. Veuillez laisser le champ vide.',
      format: 'Le numéro de TVA intracommunautaire ne correspond pas au format de {country} (préfixe {prefix}).',
      required:
        'Les entreprises de l’UE hors Allemagne doivent indiquer un numéro de TVA intracommunautaire — sinon, nous devrions facturer la TVA allemande.',
    },
    stripe: {
      notConfigured: 'Stripe n’est pas configuré.',
      accountNotFound: 'Compte introuvable.',
      unreachable: 'Stripe injoignable.',
      customerFailed: 'Le client Stripe n’a pas pu être créé.',
      detailsFailed: 'Les données de facturation n’ont pas pu être transmises.',
      noCustomer: 'Aucun client Stripe pour ce compte.',
      wrongAccount: 'Les données de paiement n’appartiennent pas à ce compte RoSe.',
      notConfirmed: 'Carte ou compte pas encore confirmé ({status}).',
      missingOnIntent: 'La carte ou le compte manque dans la confirmation.',
      unsupported: 'Le moyen de paiement {type} n’est pas pris en charge.',
      saveFailed: 'La carte ou le compte n’a pas pu être enregistré.',
      detachFailed: 'La carte ou le compte n’a pas pu être retiré.',
    },
    invoicing: {
      noCustomer: 'Aucun client Stripe — veuillez ouvrir la page « Moyen de paiement ».',
      detailsMissing: 'Les données de facturation manquent.',
    },
  },
} satisfies Shape<typeof de>
