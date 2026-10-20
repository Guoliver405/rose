import type { Shape } from '../../format'
import type { services as de } from '../../de/admin/services'

/** Réception — catalogue de services et liens. Français. */
export const services = {
  title: 'Catalogue de services',
  count: {
    one: '{count} service',
    other: '{count} services',
  },

  create: {
    heading: 'Ajouter un service',
    kindAria: 'Type de service',
    kindOrder: 'À commander',
    kindLink: 'Lien',
    templates: 'Modèles :',
    name: 'Nom',
    namePlaceholder: 'p. ex. Serviettes supplémentaires',
    description: 'Description (facultatif)',
    descriptionPlaceholder: 'Courte indication pour le client',
    price: 'Prix en {currency} (facultatif)',
    linkUrl: 'Adresse (lien)',
    urgent: 'Urgent',
    maintenance: 'Signalement',
    submit: 'Créer',
    linkExplanation:
      'Un <b>lien</b> est une tuile du portail client qui ouvre un site externe : application de pourboires pour l’équipe d’étage, livraison de repas, taxi. Il ne crée pas de demande et n’apparaît ni sur le tableau de la réception ni sur le récapitulatif du check-out. Le prestataire est responsable du contenu et de la protection des données du site cible ; le portail n’intègre rien, il ne fait que renvoyer vers lui.',
    urgentExplanation:
      'Les demandes urgentes clignotent en rouge à la réception, sur la tuile de la chambre et dans la navigation. Vous ajoutez les options avec leur propre prix (par exemple des tailles) sur le service après l’avoir créé.',
    maintenanceExplanation:
      'Un <b>signalement</b> sert aux pannes et réparations : il concerne la chambre, pas le séjour. Ces demandes restent ouvertes au check-out (une panne ne disparaît pas avec le client), n’apparaissent sur aucun récapitulatif et déclenchent un avertissement au check-in suivant.',
  },

  empty: {
    title: 'Aucun service pour l’instant.',
    text: 'Les clients voient les services dans le portail client et envoient leur demande d’un simple geste.',
    examples: 'Créer des services d’exemple',
  },

  service: {
    urgentBadge: 'urgent',
    maintenanceBadge: 'Signalement',
    linkBadge: 'Lien',
    /** Beschriftung der Schalter – die Eigenschaft, nicht die Aktion. */
    urgent: 'Urgent',
    maintenance: 'Signalement',
    archive: 'Archiver',
    archiveConfirm:
      'Archiver « {name} » ? Le service disparaît du portail client ; les demandes existantes sont conservées.',
    archiveYes: 'Oui, archiver',
    address: 'Adresse',
    saveAddress: 'Enregistrer l’adresse',
    test: 'Tester',
    archiveOption: 'Archiver l’option',
    archiveOptionAria: 'Archiver {label}',
    noOptions: 'Aucune option : le client commande le service dans son ensemble.',
    option: 'Option',
    optionPlaceholder: 'p. ex. Grande serviette',
    price: 'Prix en {currency} (facultatif)',
    wholePrice: 'Prix du service en {currency} (facultatif)',
    savePrice: 'Enregistrer le prix',
    /** `{price}` = Preis des Service, z. B. „14,50 €“. */
    wholePriceIgnored: 'Ce service a des options : leurs prix s’appliquent. Le prix du service ({price}) n’est pas facturé.',
    addOption: 'Ajouter',
  },

  languages: {
    label: 'Langues :',
    home: 'texte source',
    missing: 'manquant',
    /** Sprache, die das Haus nicht gewählt hat – übersetzbar, aber ohne Mahnung. */
    optional: 'facultatif',
    editTitle: 'Modifier la traduction en {lang}',
    editorTitle: 'Traduction en {lang}',
    editorIntro:
      'Les clients qui voient le portail client en {lang} reçoivent ces textes. Les champs laissés vides s’affichent en {home}. Vous pouvez traduire avec l’outil de votre choix, puis simplement coller le résultat ici.',
    name: 'Nom',
    description: 'Description',
    options: 'Options',
    original: 'Texte source : {text}',
    save: 'Enregistrer la traduction',
    close: 'Fermer',
    saved: 'Enregistré.',
    banner: {
      one: '<b>{count} service</b> n’est pas encore entièrement traduit en {lang}.',
      other: '<b>{count} services</b> ne sont pas encore entièrement traduits en {lang}.',
    },
    bannerHint: 'Les clients en {lang} y voient les textes en {home}. Vous pouvez tout de même enregistrer et traduire quand cela vous convient.',
    bannerJump: 'Aller au premier',
  },

  linkTemplates: {
    names: {
      tip: 'Pourboire pour l’équipe d’étage',
      food: 'Commander à manger — {brand}',
    },
    descriptions: {
      tip: 'Dites merci sans espèces : le pourboire va à l’équipe d’étage.',
      food: 'Les restaurants des environs livrent directement à notre établissement.',
    },
    regions: {
      everywhere: 'partout',
      germany: 'Allemagne',
      germanyNordicsJapan: 'Allemagne, Europe du Nord, Japon',
      worldwide: 'monde entier',
      southeastAsia: 'Asie du Sud-Est',
      asia: 'Asie',
    },
    hints: {
      tip: 'Saisissez l’adresse de votre application de pourboires (le QR code de l’application contient exactement ce lien). Un seul lien pour toute l’équipe : le portail client n’affiche aucun nom.',
      lieferando:
        'Mieux que la page d’accueil : l’adresse pour votre rue ou votre code postal issue de la recherche de {brand}, pour que le client voie tout de suite les restaurants qui livrent chez vous.',
      wolt: 'Utilisez la page de votre ville sur {brand} (p. ex. …/fr/fra/paris), pour que le client n’arrive pas sur le choix du pays.',
      ubereats: 'Utilisez l’adresse avec votre ville issue de la recherche de {brand}.',
      grab: 'Utilisez la page du pays ou de la ville sur {brand}.',
      foodpanda: 'Utilisez la page du pays sur {brand}.',
    },
  },

  errors: {
    invalidUrl: 'Adresse illisible : elle doit commencer par « https:// ».',
    serviceNotFound: 'Service introuvable.',
    notALink: 'Ce service n’est pas un lien.',
    examplesExist: 'Les services d’exemple existent déjà (éventuellement archivés).',
    nameTooShort: 'Le nom doit comporter au moins {min} caractères.',
    labelMissing: 'Libellé manquant.',
    priceInvalid: 'Prix illisible : p. ex. « {example} » ou laisser vide.',
    unknownLanguage: 'Langue inconnue.',
  },
} satisfies Shape<typeof de>
