import type { Shape } from '../../format'
import type { ui as de } from '../../de/help/ui'

/** Aide — commandes : bouton « ? », panneau, page de thème, carte du guide et page d’aide. Français. */
export const ui = {
  button: {
    open: 'Aide',
    openTopic: 'Aide : {title}',
    close: 'Fermer l’aide',
  },

  sidebar: {
    label: 'Aide',
    allTopics: 'Tous les thèmes',
    close: 'Fermer l’aide',
    closeHint: 'Fermer l’aide (Échap)',
    startLotse: 'Lancer le guide',
    asPage: 'Ouvrir en tant que page',
    asPageHint: 'Pour imprimer ou partager',
    noTopic: 'Cette page n’a pas de thème dédié. Choisissez-en un dans la liste — le panneau reste ouvert jusqu’à ce que vous le fermiez.',
  },

  topic: {
    questions: 'Questions',
    seeAlso: 'Voir aussi',
    startLotse: 'Lancer le guide',
    backHub: 'Aide',
    backHouses: 'Établissements',
  },

  pilot: {
    region: 'Guide : {title}',
    progress: '{step} / {total}',
    close: 'Terminer le guide',
    missing: 'La zone décrite n’est pas affichée sur la page pour le moment — elle dépend d’un paramètre réglé autrement dans votre établissement, ou de données qui n’existent pas encore ici.',
    back: 'Retour',
    end: 'Terminer',
    next: 'Suivant',
    done: 'Terminé',
  },

  hub: {
    title: 'Aide et guides',
    intro: 'Chaque domaine dispose d’une explication à consulter — symboles, questions et réponses — et d’un guide : une visite guidée de la vraie page, qui vous montre étape par étape comment elle fonctionne. Vous pouvez continuer à utiliser la page normalement ; rien n’est bloqué. Vous pouvez arrêter le guide à tout moment avec « Terminer ». Le « ? » en haut à droite ouvre l’explication à côté de chaque page.',
    setupTitle: 'Configurer votre établissement',
    setupCount: '{done} sur {total}',
    setupContinue: 'Poursuivre la configuration',
    setupAgain: 'Revoir la configuration',
    optional: 'facultatif',
    catalogTitle: 'Aide par thème',
    catalogIntro: 'Les deux mènent à la page concernée : l’explication s’ouvre dans le panneau latéral, le guide vous fait parcourir la page étape par étape. Vous pouvez utiliser l’un et l’autre aussi souvent que vous le souhaitez.',
    explanation: 'Explication',
    lotse: { one: 'Guide ({count} étape)', other: 'Guide ({count} étapes)' },
  },
} satisfies Shape<typeof de>
