import type { Shape } from '../../format'
import type { SimMessages } from '../../de/help/sim'

/**
 * Aide — simulations du tableau du ménage et du portail client. Les boutons et
 * lignes d’état viennent de `service.ts` et `guest.ts` ; ici seulement ce que les
 * vrais portails n’ont pas : en-tête de page, explications, exemples. Français.
 */
export const sim = {
  house: 'Résidence Vue des Alpes',

  frame: {
    badge: 'Simulation',
  },

  reinigung: {
    page: {
      title: 'Le tableau du ménage',
      intro:
        'Voici le tableau que vos agents d’étage utilisent sur leur téléphone. Il s’agit d’une simulation avec des chambres d’exemple ; rien n’est enregistré et personne n’est averti. Essayez tout librement. Le guide rétablit la vue adaptée à chaque étape.',
      why:
        'Pourquoi une simulation plutôt qu’une visite du vrai tableau ? Le tableau du ménage a sa propre connexion et sa propre session : il n’est pas accessible depuis la réception. Pour voir le vrai tableau, connectez-vous à <code>{path}</code> avec le compte d’un agent d’étage.',
    },
    frame: {
      login: 'Ménage — connexion',
      status: 'Ménage — mon statut',
    },
    scanCard: 'Scanner la carte d’accès',
    or: 'ou',
    withinShift: 'Les pauses et l’autre nettoyage ont lieu pendant le service.',
    nothingToDo: 'rien à faire',
    noTask: 'Aucun ménage n’est ouvert pour cette chambre — elle n’est pas bloquée, il n’y a simplement rien à faire pour le moment.',
  },

  gast: {
    page: {
      title: 'Ce que voit le client',
      intro:
        'Voici à quoi ressemble le portail client sur le téléphone d’un client. Il s’agit d’une simulation avec des données d’exemple ; l’établissement, la chambre et les services ne proviennent pas de vos données, si bien que l’écran affiche quelque chose même avant la fin de la configuration. Rien n’est enregistré.',
      differs:
        'Chez vous, deux points diffèrent : les services affichés se règlent dans le catalogue de services, et la proposition de « Pas avant » — avec son heure limite — se règle sous Établissement et règles.',
    },
    frame: {
      portal: 'Portail client — téléphone',
    },
    scanned: 'Affiche de chambre scannée — il ne reste qu’à saisir le code PIN de la feuille d’arrivée.',
    otherMode: 'Avec l’autre méthode, cette étape disparaît : le lien personnel ouvre directement le portail client.',
    onlyDaily: 'Ce bouton n’existe que dans les établissements avec ménage quotidien.',
    services: {
      towels: { name: 'Serviettes supplémentaires', meta: 'gratuit' },
      breakfast: { name: 'Petit-déjeuner en chambre', meta: '14,50 €' },
      technician: { name: 'Service technique', meta: 'urgent' },
    },
    requested: 'demandé',
    openRequests: {
      one: 'Une demande est ouverte — la réception s’en occupe.',
      other: '{count} demandes sont ouvertes — la réception s’en occupe.',
    },
    noRequests: 'Aucune demande ouverte. L’accès expire de lui-même au check-out.',
  },
} satisfies Shape<SimMessages>
