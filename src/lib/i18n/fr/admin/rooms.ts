import type { Shape } from '../../format'
import type { rooms as de } from '../../de/admin/rooms'

/** Réception — configuration des chambres : créer, modifier et supprimer chambres, étages et bâtiments. Français. */
export const rooms = {
  page: {
    title: 'Gérer les chambres',
  },

  create: {
    heading: 'Ajouter des chambres',
    modeAria: 'Mode de création',
    modeIndividual: 'Étages un par un',
    modeIdentical: 'Étages identiques',
    modeIndividualHint: 'Les numéros de chambre s’appliquent à l’étage indiqué.',
    modeIdenticalHint: 'La même plage de numéros est créée à chaque étage indiqué.',
    buildingLabel: 'Bâtiment (facultatif)',
    buildingPlaceholder: 'p. ex. Bâtiment principal',
    floorLabel: 'Étage',
    floorsLabel: 'Étages — liste séparée par des virgules ou plage',
    floorsPlaceholder: 'p. ex. 1-3',
    numbersLabelIndividual: 'Numéros de chambre — un seul, liste ou plage',
    numbersLabelIdentical: 'Numéros de chambre par étage — un seul, liste ou plage',
    numbersPlaceholderIndividual: 'p. ex. 101-110 ou 201, 202, 205',
    numbersPlaceholderIdentical: 'p. ex. 01-10',
    prefixFloor: 'Faire précéder du numéro d’étage (étage 2 + « 05 » → « 205 »)',
    collisionWarning:
      'Sans le numéro d’étage devant, un même numéro ne peut pas exister à plusieurs étages : les numéros de chambre sont uniques par bâtiment. Seul le premier étage serait créé.',
    planned: {
      one: '{count} chambre sera créée : {list}',
      other: '{count} chambres seront créées : {list}',
    },
    plannedMore: '{list}… (+{more})',
    submit: 'Créer',
    submitting: 'Création…',
    created: {
      one: '{count} chambre créée.',
      other: '{count} chambres créées.',
    },
    createdSkipped: {
      one: '{count} chambre créée, {skipped} ignorée(s) (numéro déjà existant).',
      other: '{count} chambres créées, {skipped} ignorée(s) (numéro déjà existant).',
    },
    errors: {
      invalidFloors: 'Veuillez indiquer un ou plusieurs étages valides.',
    },
  },

  list: {
    empty: 'Aucune chambre pour l’instant.',
    intro:
      'Cliquez sur une chambre, un étage ou un bâtiment pour <b>modifier</b>, <b>mettre hors service</b> ou <b>supprimer</b> l’élément. Une faute de frappe ? La modification change le numéro, l’étage et le bâtiment sans rien perdre.',
    noBuilding: 'Sans bâtiment',
    floor: 'Étage {floor}',
    room: 'Chambre {number}',
    roomCount: {
      one: '{count} chambre',
      other: '{count} chambres',
    },
    buildingSubtitle: {
      one: '{rooms} chambres sur {count} étage',
      other: '{rooms} chambres sur {count} étages',
    },
    separator: ' · ',
    deactivatedCount: '{count} hors service',
    occupiedCount: '{count} occupée(s)',
    deactivatedTitle: 'Hors service',
    occupiedAria: 'occupée',
    deactivatedAria: 'hors service',
  },

  dialog: {
    editHintRoom: 'Corriger le numéro, l’étage ou le bâtiment — rien n’est perdu',
    editHintFloor: 'Déplacer l’étage ou changer de bâtiment — rien n’est perdu',
    editHintBuilding: 'Renommer le bâtiment — rien n’est perdu',
    deactivate: 'Mettre hors service',
    deactivateHint: 'Disparaît des tableaux et des affiches, l’historique reste complet',
    reactivate: 'Remettre en service',
    reactivateHint: {
      one: 'Remettre {count} chambre en service',
      other: 'Remettre {count} chambres en service',
    },
    deleteForever: 'Supprimer définitivement',
    deleteHint: 'Avec tous les séjours et justificatifs — irréversible',
    deleting: 'Suppression…',

    roomNumber: 'Numéro de chambre',
    floor: 'Étage',
    buildingOrNone: 'Bâtiment (vide = aucun)',
    buildingPlaceholder: 'p. ex. Bâtiment principal',
    appliesToAll: {
      one: 'S’applique à {count} chambre de cette zone.',
      other: 'S’applique aux {count} chambres de cette zone.',
    },
    reprintWarning:
      'Les QR codes restent valables : ils appartiennent à la chambre, pas au numéro. En revanche, les affiches de chambre et feuilles d’arrivée déjà <b>imprimées</b> montrent l’ancienne désignation et devraient être réimprimées.',

    checkingImpact: 'Vérification des conséquences…',
    occupiedBlocks: {
      one: 'La chambre est occupée et ne peut pas être supprimée : veuillez d’abord faire le check-out.',
      other: '{count} chambres sont occupées et ne peuvent pas être supprimées : veuillez d’abord faire le check-out.',
    },
    confirmLabel: 'Saisissez « {phrase} » pour confirmer',
    deactivateInstead: 'Plutôt mettre hors service — l’historique est conservé',

    reactivated: {
      one: '{count} chambre remise en service.',
      other: '{count} chambres remises en service.',
    },
    deactivated: {
      one: '{count} chambre hors service — l’historique est conservé.',
      other: '{count} chambres hors service — l’historique est conservé.',
    },
    deactivatedSkipped: {
      one: '{count} chambre hors service, {skipped} occupée(s) ignorée(s) — l’historique est conservé.',
      other: '{count} chambres hors service, {skipped} occupée(s) ignorée(s) — l’historique est conservé.',
    },
    noChange: 'Aucune modification : tout était déjà ainsi.',
    edited: {
      one: '{count} chambre modifiée.',
      other: '{count} chambres modifiées.',
    },
    deleted: {
      one: 'Suppression effectuée : {label} ({count} chambre).',
      other: 'Suppression effectuée : {label} ({count} chambres).',
    },
    errors: {
      invalidFloor: 'Veuillez indiquer un étage valide.',
    },
  },

  impact: {
    rooms: {
      one: '{count} chambre',
      other: '{count} chambres',
    },
    stays: {
      one: '{count} séjour',
      other: '{count} séjours',
    },
    ordersOpen: {
      one: '{count} demande de service ouverte',
      other: '{count} demandes de service ouvertes',
    },
    ordersDone: {
      one: '{count} demande de service terminée',
      other: '{count} demandes de service terminées',
    },
    ordersDoneAmount: {
      one: '{count} demande de service terminée ({amount})',
      other: '{count} demandes de service terminées ({amount})',
    },
    transitions: {
      one: '{count} entrée de l’historique de chambre',
      other: '{count} entrées de l’historique de chambre',
    },
    qrPosters: {
      one: '{count} QR code — les affiches de chambre imprimées ne fonctionneront plus',
      other: '{count} QR codes — les affiches de chambre imprimées ne fonctionneront plus',
    },
    neverUsed: 'Jamais utilisée : la suppression ne fait perdre aucune donnée.',
    willBeDeleted: 'Seront également supprimés définitivement :',
    cleaningLogsKept: {
      one: '{count} pointage du ménage est <b>conservé</b> : les temps de travail dans les statistiques perdent seulement le lien avec la chambre.',
      other: '{count} pointages du ménage sont <b>conservés</b> : les temps de travail dans les statistiques perdent seulement le lien avec la chambre.',
    },
  },

  scope: {
    room: 'Chambre {number}',
    floor: 'Étage {floor}',
    floorInBuilding: '{building} · Étage {floor}',
    unnamedBuilding: 'Chambres sans bâtiment',
    confirmFloor: 'Étage {floor}',
    confirmUnnamedBuilding: 'SUPPRIMER',
  },

  errors: {
    noRoomNumbers: 'Aucun numéro de chambre indiqué.',
    invalidFloor: 'Étage non valide.',
    tooMany: '{max} chambres au maximum par opération.',
    createFailed: 'Échec de la création : {message}',
    roomStatesFailed: 'Échec de la création de l’état des chambres : {message}',
    loadFailed: 'Échec du chargement : {message}',
    roomOccupied: 'La chambre est occupée : veuillez d’abord faire le check-out.',
    roomsOccupied: {
      one: '{count} chambre est occupée : veuillez d’abord faire le check-out.',
      other: '{count} chambres sont occupées : veuillez d’abord faire le check-out.',
    },
    noRoomsFound: '{label} : aucune chambre trouvée.',
    numberEmpty: 'Le numéro de chambre ne peut pas être vide.',
    numberTooLong: 'Le numéro de chambre est trop long ({max} caractères au maximum).',
    numberSingleOnly: 'Un numéro de chambre ne peut être attribué qu’individuellement.',
    buildingTooLong: 'Le nom du bâtiment est trop long ({max} caractères au maximum).',
    nothingToChange: 'Rien à modifier.',
    numberTakenInBuilding: 'Le numéro de chambre {number} est déjà attribué dans le bâtiment « {building} » (étage {floor}).',
    numberTakenNoBuilding: 'Le numéro de chambre {number} est déjà attribué sans bâtiment (étage {floor}).',
    numberDuplicate: 'Le numéro de chambre {number} apparaîtrait deux fois : les numéros sont uniques par bâtiment.',
    editFailed: 'Échec de la modification : {message}',
    noRoomsInScope: 'Aucune chambre dans cette zone.',
    confirmMismatch: 'Veuillez saisir « {phrase} » pour confirmer.',
    snapshotFailed: 'L’enregistrement pour la facturation n’a pas pu être effectué : {message}',
    historyDeleteFailed: 'Échec de la suppression de l’historique : {message}',
    deleteFailed: 'Échec de la suppression : {message}',
  },
} satisfies Shape<typeof de>
