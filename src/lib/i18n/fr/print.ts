import type { Shape } from '../format'
import type { PrintMessages } from '../de/print'

/**
 * Pages d’impression de la réception — français : commandes autour de la
 * feuille d’arrivée, des affiches de chambre et de la carte d’accès, et le
 * récapitulatif du check-out. La feuille client elle-même est dans `sheet.ts`.
 */
export const print = {
  backToOverview: 'Retour à la vue d’ensemble',

  checkinSheet: {
    notOccupied: 'La chambre {number} n’est pas occupée actuellement — faites d’abord le check-in, puis imprimez la feuille d’arrivée.',
    formatA4: 'A4 — classeur, présentoir, cadre',
    formatCompact: 'Compact — à remettre',
    printA4: 'Imprimer la feuille d’arrivée (A4)',
    printCompact: 'Imprimer la feuille d’arrivée (compact)',
    mailTitle: 'Envoyer plutôt par e-mail',
    mailPlaceholder: 'adresse@exemple.fr',
    send: 'Envoyer',
    mailHint:
      'L’adresse n’est <b>pas enregistrée</b> — elle sert uniquement à cet e-mail. L’e-mail part dans la première langue de l’établissement ; les pictogrammes et la deuxième langue ne figurent que sur la version imprimée.',
    release: 'Débloquer l’adresse et renvoyer',
    orPrint: 'Ou : imprimez la feuille d’arrivée — elle comporte le même accès.',
    mailNotConfigured:
      'L’envoi par e-mail n’est pas configuré — il nécessite <code>RESEND_API_KEY</code> et <code>GUEST_MAIL_FROM</code> dans les variables d’environnement.',
  },

  roomSigns: {
    backToGuestAccess: 'Retour à l’accès clients',
    backToSettings: 'Retour aux paramètres',
    linkModeWarning:
      'Cet établissement utilise un accès personnel par séjour. Les affiches de chambre mènent à une saisie de code PIN que les nouveaux clients ne peuvent pas utiliser — elles n’ont pas leur place dans les chambres tant que ce mode s’applique.',
    title: 'Affiches de chambre',
    createMissing: {
      one: 'Créer le QR code manquant',
      other: 'Créer les {count} QR codes manquants',
    },
    formatA4: 'A4 — une page par chambre',
    formatCompact: 'Compact — quatre par page',
    printAll: {
      one: 'Tout imprimer (1 page)',
      other: 'Tout imprimer ({count} pages)',
    },
    hint:
      'À imprimer une fois, puis à poser dans la chambre, à accrocher ou à glisser dans le classeur — le client scanne et ne saisit que le code PIN reçu au check-in. Le format compact se découpe. Un nouveau code rend l’ancienne affiche de la chambre inutilisable.',
    noRooms: 'Aucune chambre configurée pour le moment.',
    allHaveCodes: 'Toutes les chambres ont déjà un QR code.',
    created: {
      one: 'Un QR code créé.',
      other: '{count} QR codes créés.',
    },
    renewed: 'Nouveau QR code pour la chambre {number} — l’ancienne affiche ne fonctionne plus.',
    noCode: 'Chambre {number} : pas encore de QR code — créez-le ci-dessus.',
    renew: 'Renouveler le code',
    errors: {
      notSignedIn: 'Non connecté.',
      noPermission: 'Accès non autorisé.',
      roomNotFound: 'Chambre introuvable.',
    },
  },

  accessCard: {
    back: 'Retour au personnel',
    title: 'Carte d’accès du personnel d’étage',
    scan: 'Scanner le QR code → connexion automatique',
    qrAlt: 'QR code vers le tableau du ménage',
    manual: 'Connexion manuelle → identifiants',
    username: 'Nom d’utilisateur',
    pin: 'PIN',
    address: 'Adresse : {url}',
    help:
      'Scannez le QR code avec la tablette, ou saisissez le nom d’utilisateur et le code PIN à l’adresse ci-dessus — le nom d’utilisateur est <code>{username}</code>, pas le nom en haut de la carte. Gardez cette carte confidentielle : elle ouvre le tableau du ménage sans autre confirmation.',
    target: 'Destination du QR code : {url}',
    print: 'Imprimer la carte',
  },

  statement: {
    title: 'Récapitulatif des prestations supplémentaires',
    room: 'Chambre',
    arrival: 'Arrivée',
    departure: 'Départ',
    stayRunning: 'Séjour en cours',
    created: 'Établi le',
    none: 'Aucune prestation supplémentaire payante n’a été utilisée pendant ce séjour.',
    service: 'Prestation',
    ordered: 'Demandée',
    done: 'Effectuée',
    amount: 'Montant',
    openNotCharged: 'en cours — non facturé',
    notProvidedNotCharged: 'non effectuée — non facturée',
    total: 'Total',
    excludedNote: 'Les prestations non effectuées ou encore en cours sont signalées et ne sont pas incluses dans le total.',
    footer:
      'Ce récapitulatif n’est <b>pas une facture</b> ni un justificatif fiscal. Il ne liste que les prestations supplémentaires de cette chambre demandées via le portail client ; l’hébergement, les autres postes et la facturation relèvent du système propre de l’établissement.',
    print: 'Imprimer le récapitulatif',
  },
} satisfies Shape<PrintMessages>
