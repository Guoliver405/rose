import type { Shape } from '../../format'
import type { common as de } from '../../de/admin/common'

/** Réception — textes communs à plusieurs domaines. Français. */
export const common = {
  back: 'Retour',
  backToOverview: 'Retour à la vue d’ensemble',
  backToSettings: 'Retour aux paramètres',
  save: 'Enregistrer',
  saving: 'Enregistrement…',
  cancel: 'Annuler',
  close: 'Fermer',
  edit: 'Modifier',
  delete: 'Supprimer',
  errors: {
    notSignedIn: 'Non connecté.',
    noPermission: 'Accès non autorisé.',
    roomNotFound: 'Chambre introuvable.',
  },
} satisfies Shape<typeof de>
