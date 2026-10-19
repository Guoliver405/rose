import type { Shape } from '../../format'
import type { LandingMessages } from '../../de/landing'

/**
 * Page d’accueil (`/`) en français. « Hôtel » pour le secteur,
 * « établissement » pour la maison, « housekeeping » comme service et produit.
 * Prix et chiffres viennent de `pricing.ts` sous forme de variables.
 */
export const page = {
  meta: {
    title: 'RoSe – RoomService pour les hôtels de toutes tailles',
    description:
      'Demandes de ménage, « Ne pas déranger » et demandes de service des clients arrivent en direct à la réception et au housekeeping, sans application client ni projet PMS. {price} par chambre et par mois, au moins un mois complet offert.',
    ogDescription:
      'Check-in en un clic, clients par QR code, ménage bien coordonné. Trois portails pour la réception, le housekeeping et les clients.',
    ogLocale: 'fr_FR',
    siteName: 'RoSe – RoomService',
  },

  header: {
    homeAria: 'RoSe – accueil',
    nav: { product: 'Produit', flow: 'Fonctionnement', pricing: 'Tarifs', faq: 'FAQ' },
    signIn: 'Se connecter',
    start: 'Commencer gratuitement',
  },

  hero: {
    badge: 'De l’auberge à la chaîne hôtelière',
    title: 'Piloter le ménage et proposer des services : <hl>numérique et efficace</hl>',
    text: 'Le client appuie sur « Nettoyer ma chambre », la réception le voit aussitôt, le housekeeping s’en occupe depuis le tableau. RoSe relie tous les services en temps réel, dans un système intuitif, sans formation, sans soucis de données ni projet PMS.',
    start: 'Commencer gratuitement',
    demo: 'Démo du produit',
  },

  painPoints: [
    {
      pain: '« La 204 ne voulait pas de ménage, non ? »',
      fix: 'Les clients demandent eux-mêmes le ménage ou « Ne pas déranger », le tableau l’affiche en direct, sans crier dans le couloir ni accroche-porte.',
    },
    {
      pain: '« Qui est dans quelle chambre en ce moment ? »',
      fix: 'Les agents d’étage confirment le début et la fin d’un simple glissement : la réception et l’équipe voient aussitôt où l’on travaille.',
    },
    {
      pain: '« Encore un système, encore une formation… »',
      fix: 'Trois portails épurés, chacun ne montre que ce dont le rôle a besoin. Les agents d’étage se connectent avec une carte d’accès, les clients n’ont besoin d’aucun compte.',
    },
  ],

  formula: {
    heading: 'La formule RoSe',
    terms: {
      portal: { means: 'Portail client mobile', effect: 'un service de meilleure qualité' },
      cleaning: { means: 'Ménage des chambres piloté', effect: 'réduit les coûts, préserve l’environnement' },
      flow: { means: 'Flux d’information numérique', effect: 'vue d’ensemble et traçabilité' },
    },
    footnote: 'Pas de projet PMS, pas de formation, configuré en quelques minutes : {price} par chambre et par mois, un mois d’essai gratuit.',
  },

  sustainability: {
    sealTop: 'Ménage',
    sealBottom: 'à la demande',
    badge: 'Hôtellerie durable',
    heading: 'Le ménage uniquement quand le client le souhaite',
    text: 'Le ménage quotidien est une habitude, pas un souhait : 70 % des clients n’en ont pas besoin tous les jours. Avec RoSe, le « ménage à la demande » devient la norme de votre établissement : les clients appuient quand ils veulent quelque chose, et le reste n’est pas touché. Vous économisez de l’eau, de la lessive et de l’énergie, et vous disposez d’un argument de durabilité à rendre visible auprès des clients et des plateformes de réservation.',
    wins: {
      water: {
        title: 'Eau et lessive',
        text: 'Chaque recouche évitée économise une machine de draps et de serviettes, et les produits chimiques qui vont avec.',
      },
      energy: {
        title: 'Énergie et déplacements',
        text: 'Pas d’aspirateur, pas de chariot dans le couloir, pas de trajet à la blanchisserie pour une chambre que personne ne voulait faire nettoyer.',
      },
      guests: {
        title: 'Les clients décident eux-mêmes',
        text: 'Un appui dans le portail client au lieu d’un accroche-porte. Qui veut le ménage l’obtient, qui n’en veut pas n’est pas dérangé.',
      },
    },
    footnote: 'Le ménage quotidien à partir de la deuxième nuit reste disponible en option : c’est l’établissement qui décide, pas le logiciel.',
  },

  product: {
    heading: 'Trois portails, trois types d’utilisateurs, un travail d’équipe',
    intro: 'Chaque rôle dispose exactement de l’interface dont il a besoin, reliée en temps réel. Voyez-le ici en direct : un appui, et tout le monde le voit.',
    portals: {
      reception: {
        title: 'Réception',
        lead: 'Un clic pour le check-in, un clic pour le check-out.',
        points: [
          'Le check-in crée aussitôt l’accès client : code PIN à l’écran, feuille d’arrivée à imprimer ou par e-mail',
          'Vue d’ensemble des chambres avec statut en direct ; priorités pour les réclamations et les cas particuliers',
          'Demandes de service en liste de tâches, les urgentes clignotent en rouge',
        ],
      },
      guests: {
        title: 'Clients',
        lead: 'Scanner le QR code, c’est tout. Pas d’application, pas de compte.',
        points: [
          'QR code de chambre et code PIN, ou un lien personnel par séjour : l’établissement choisit',
          '« Nettoyer ma chambre » ou « Ne pas déranger » en un appui',
          'Demander des services, du service de blanchisserie au petit-déjeuner en chambre',
        ],
      },
      housekeeping: {
        title: 'Housekeeping',
        lead: 'Un tableau pour toute l’équipe.',
        points: [
          'Vue par étage : demandes, départs, priorités, avec une recommandation sur l’étage par lequel commencer',
          'Début et fin d’un glissement ; toute l’équipe voit en direct qui est dans quelle chambre',
          'Connexion par carte d’accès, service et pause en deux appuis, statistiques comprises',
        ],
      },
    },
  },

  flow: {
    heading: 'Fonctionnement',
    intro: 'Du check-in au ménage terminé : cinq étapes, sans appel dans le couloir ni bout de papier.',
    panels: {
      checkin: {
        who: 'Réception',
        title: 'Check-in en un clic',
        text: 'Un clic sur la chambre : RoSe crée le séjour anonyme et génère l’accès.',
      },
      access: {
        who: 'Client',
        title: 'L’accès en main',
        text: 'Code PIN sur la feuille d’arrivée, affiche dans la chambre ou lien par e-mail : pas de compte, pas d’application.',
      },
      tap: {
        who: 'Client',
        title: 'Un appui dans la chambre',
        text: '« Nettoyer ma chambre », « Ne pas déranger » ou une demande issue du catalogue de services.',
      },
      visible: {
        who: 'Réception',
        title: 'Visible aussitôt',
        text: 'La cloche sur la vignette de la chambre, la demande dans la liste : ce qui est urgent clignote en rouge.',
      },
      board: {
        who: 'Housekeeping',
        title: 'Ciblé et piloté',
        text: 'Priorisé et attentionné : aligné automatiquement sur les besoins et coordonné entre les membres de l’équipe.',
      },
    },
    checkout: 'Le check-out se fait lui aussi en un clic : l’accès expire immédiatement, la chambre apparaît sur le tableau comme « départ ».',
  },

  comparison: {
    heading: 'La même journée, avec et sans RoSe',
    intro: '100 chambres, les mêmes clients, les mêmes agents d’étage. La seule différence : ce qu’ils savent et la façon dont ils choisissent la chambre suivante, que votre établissement fasse le ménage tous les jours ou seulement à la demande.',
    simulatorTitle: 'Calculer avec les chiffres de votre établissement',
    simulatorText: 'Réglez les étages, les chambres, le personnel, les horaires et le comportement des clients : le Simulateur Housekeeping calcule de nombreuses journées. Gratuit, avec une adresse e-mail, sans données de paiement.',
    simulatorLink: 'Vers le simulateur',
  },

  features: {
    heading: 'Pensé jusque dans les détails',
    items: {
      qr: {
        title: 'Des QR codes selon vos besoins',
        text: 'Accès clients par chambre avec code PIN, ou générés individuellement pour chaque séjour. Le tout en un clic.',
      },
      secure: {
        title: 'Sûr, sans comptes',
        text: 'Codes de chambre impossibles à deviner, code PIN par séjour, blocage après plusieurs erreurs, y compris contre les essais en série depuis Internet.',
      },
      dnd: {
        title: '« Ne pas déranger » est respecté',
        text: '« Ne pas déranger » retire la chambre du tableau du housekeeping : personne ne frappe pour rien.',
      },
      daily: {
        title: 'Ménage quotidien',
        text: 'En option : à partir de la deuxième nuit, RoSe place le ménage quotidien sur le tableau à l’heure de votre choix, y compris dans une plage horaire.',
      },
      services: {
        title: 'Catalogue de services',
        text: 'Créez vos propres services avec options, prix et priorité : les clients les demandent en ligne et sans délai.',
      },
      print: {
        title: 'Prêt à imprimer',
        text: 'Feuille d’arrivée pour le client, affiches de chambre et cartes d’accès pour l’équipe : tout depuis le navigateur, ou par e-mail.',
      },
      green: {
        title: 'Durable à la demande',
        text: 'Le ménage uniquement quand le client le souhaite : moins d’eau, de lessive et de déplacements, et un argument visible pour votre profil de durabilité.',
      },
      proof: {
        title: 'Des preuves plutôt qu’une intuition',
        text: 'Historique des chambres et statistiques de temps de travail par agent d’étage : pour les réclamations, la paie et la planification du personnel.',
      },
    },
  },

  useCases: {
    heading: 'Conçu pour les établissements de toutes tailles',
    intro: 'De l’entreprise familiale à la chaîne : RoSe grandit avec vous, sans jamais nécessiter de service informatique.',
    items: {
      small: {
        title: 'Pension, auberge et locations de vacances',
        text: 'La réception fait souvent aussi office de cuisine, de service et de housekeeping. RoSe garde la vue d’ensemble : qui part, où le ménage est demandé, ce qui a été commandé, sans piles de papiers. À partir de {min} par mois.',
      },
      boutique: {
        title: 'Hôtel boutique et apparthôtel',
        text: 'Séjours plus longs, agents d’étage qui changent : des cartes d’accès plutôt que le chaos des mots de passe, le ménage quotidien apparaît tout seul à partir de la deuxième nuit, et les clients gèrent eux-mêmes « Ne pas déranger » et leurs demandes.',
      },
      city: {
        title: 'Hôtel urbain sur plusieurs étages',
        text: 'Housekeeping interne ou externalisé : le tableau des étages recommande par où commencer, et la réception voit en direct qui travaille où. Les statistiques fournissent les temps de travail et de ménage par agent d’étage.',
      },
      chain: {
        title: 'Chaîne hôtelière et resort',
        text: 'Un compte, autant d’établissements que vous voulez ; les managers voient leurs établissements, la réception uniquement le sien. Les priorités réorientent aussitôt en cas de réclamation, les fins de ménage oubliées expirent automatiquement, sans limite de chambres.',
      },
    },
  },

  pricing: {
    heading: 'Un seul prix. Pas de formules.',
    intro: 'RoSe se facture à la chambre, pas à la fonction. Tout est toujours inclus, que vous ayez huit chambres ou huit cents.',
    badge: 'Au moins un mois complet offert',
    perRoom: 'par chambre et par mois, hors TVA',
    minimum: 'Montant minimum <b>{min}</b> par mois : jusqu’à {rooms} chambres, vous payez donc un forfait.',
    included: [
      'Les trois portails : réception, housekeeping, clients',
      'Établissements, accès et agents d’étage en nombre illimité',
      'Catalogue de services, ménage quotidien, plages horaires',
      'Affiches de chambre, feuilles d’arrivée, cartes d’accès, e-mail aux clients',
      'Historique des chambres et statistiques de temps de travail',
      'Clair, sombre, accessible, sur tous les appareils',
    ],
    whatCounts: '<b>Qu’est-ce qui compte comme chambre ?</b> Toute chambre en service, même temporairement, au cours du mois. Les chambres hors service (rénovation, basse saison) ne comptent pas.',
    terms: '<b>Sans engagement.</b> Résiliable chaque mois, facturation à terme échu par mois civil. Le montant minimum s’applique par compte, pas par établissement. Détails dans les <link>conditions générales</link> (en allemand).',
    start: 'Commencer gratuitement',
  },

  faq: {
    heading: 'Questions fréquentes',
    items: [
      {
        q: 'Les clients ont-ils besoin d’une application ou d’un compte ?',
        a: 'Non. Les clients scannent le QR code dans la chambre et saisissent le code PIN reçu au check-in, ou ouvrent leur lien personnel depuis la feuille d’arrivée ou l’e-mail. Tout fonctionne dans le navigateur.',
      },
      {
        q: 'RoSe remplace-t-il notre système de réservation ou notre PMS ?',
        a: 'Volontairement non. RoSe s’occupe du séjour dans l’établissement : ménage, demandes, services. Réservation, tarifs et facturation restent là où ils sont. Il n’y a rien à intégrer.',
      },
      {
        q: 'Quelles données RoSe enregistre-t-il sur les clients ?',
        a: 'Aucun nom, aucune coordonnée. Un séjour est anonyme : chambre, période, accès. Au check-out, l’accès expire immédiatement. Même une adresse e-mail pour le lien d’accès n’est pas enregistrée.',
      },
      {
        q: 'Où sont stockées les données ?',
        a: 'La base de données et les fonctions serveur tournent dans l’UE (Irlande). Les accès sont séparés par établissement, les connexions chiffrées. Les détails figurent dans la politique de confidentialité (en allemand).',
      },
      {
        q: 'De quoi les agents d’étage ont-ils besoin ?',
        a: 'D’un smartphone ou d’une tablette quelconque. Connexion par carte d’accès imprimée ou par nom d’utilisateur et code PIN, sans adresse e-mail.',
      },
      {
        q: 'Combien coûte RoSe exactement ?',
        a: '{price} par chambre et par mois, au moins {min} par mois, hors TVA. Le mois civil de l’inscription et le premier mois complet qui suit sont gratuits, soit au moins un mois complet. Pas de formules, pas de limite de chambres, résiliable chaque mois.',
      },
      {
        q: 'Combien de temps prend la mise en place ?',
        a: 'Créer les chambres (aussi par plage comme « 301–310 »), imprimer les affiches de chambre, imprimer les cartes d’accès : quelques minutes, réalistement. Des exemples de services sont déjà prêts. Il n’y a rien à installer.',
      },
      {
        q: 'Puis-je déjà essayer RoSe ?',
        a: 'Oui. Pendant la phase de test, l’inscription est encore réservée aux établissements invités : avec un code d’invitation, votre compte est créé en une minute, et au moins le premier mois complet est offert.',
      },
    ],
  },

  signup: {
    heading: 'Créez votre établissement en une minute',
    text: 'Compte, établissement et exemples de services sont créés d’un seul coup ; il ne reste plus qu’à saisir vos chambres. Au moins le premier mois complet est offert ; pendant la phase de test, il vous faut un code d’invitation.',
    start: 'Commencer gratuitement',
    haveAccess: 'J’ai déjà un accès',
  },

  footer: {
    tagline: '– RoomService, tout en légèreté.',
    reception: 'Réception',
    housekeeping: 'Housekeeping',
    guests: 'Portail client',
    imprint: 'Mentions légales (en allemand)',
    privacy: 'Confidentialité (en allemand)',
    terms: 'CGV (en allemand)',
  },

  og: {
    alt: 'RoSe – ménage, demandes et services en parfaite cadence',
    claim: 'Ménage, demandes et services, en parfaite cadence',
    sub: 'Trois portails pour la réception, le housekeeping et les clients. Sans application client, sans projet PMS.',
    price: '{price} par chambre et par mois · premier mois complet offert',
    floor: 'Étage 2',
    counts: '2 en attente · 1 en cours',
    tiles: {
      occupied: 'occupée',
      ready: 'prête',
      wants: 'ménage',
      checkedOut: 'départ',
      priority: 'prioritaire',
      dnd: 'Ne pas déranger',
    },
    checkin: 'Check-in 207',
    pin: 'PIN 4827',
  },
} satisfies Shape<LandingMessages['page']>
