import type { Shape } from '../../format'
import type { LandingMessages } from '../../de/landing'

/** Aperçu interactif du produit (`LiveDemo`) en français, avec les libellés des vrais portails. */
export const demo = {
  hotel: 'Hôtel Vue des Alpes',
  maid: 'Maria',

  services: {
    towels: { name: 'Serviettes supplémentaires', meta: 'gratuit' },
    breakfast: { name: 'Petit-déjeuner en chambre', meta: '14,50 €' },
    repair: { name: 'Service technique', meta: 'urgent' },
  },

  events: {
    initial: 'Situation de départ : la chambre 202 est libre et prête.',
    checkin: 'Check-in chambre {nr} : séjour créé, code PIN {pin}.',
    checkout: 'Check-out chambre {nr} : accès expiré, ménage après départ en attente.',
    signal: 'Client de la {nr} : {label}.',
    signalClean: 'ménage demandé',
    signalDnd: 'Ne pas déranger',
    signalNone: 'demande retirée',
    order: 'Le client de la {nr} demande « {name} ».',
    report: 'Le client de la {nr} signale « {name} » — urgent.',
    orderDone: 'Réception : demande de la {nr} traitée.',
    priorityOn: 'Réception : chambre {nr} prioritaire.',
    priorityOff: 'Réception : chambre {nr} n’est plus prioritaire.',
    start: '{maid} commence le ménage de la {nr}.',
    finish: '{maid} a terminé la {nr} : chambre prête.',
  },

  tone: {
    priority: 'prioritaire',
    checkedOut: 'départ',
    wants: 'ménage demandé',
    dnd: 'Ne pas déranger',
    occupied: 'occupée',
    ready: 'prête',
  },

  story: {
    checkin: {
      who: 'Réception',
      title: 'Check-in en un clic',
      text: 'Un clic sur la chambre {nr} : RoSe crée le séjour anonyme et affiche le code PIN.',
    },
    access: {
      who: 'Client',
      title: 'L’accès en main',
      text: 'Code PIN sur la feuille d’arrivée, affiche dans la chambre ou lien par e-mail : pas de compte, pas d’application.',
    },
    tap: {
      who: 'Client',
      title: 'Un appui dans la chambre',
      text: '« Nettoyer ma chambre », il n’en faut pas plus.',
    },
    visible: {
      who: 'Réception',
      title: 'Visible aussitôt',
      text: 'La vignette passe à l’ambre ; une demande fait apparaître la cloche et le compteur.',
    },
    board: {
      who: 'Housekeeping',
      title: 'Ciblé et piloté',
      text: '{maid} commence d’un glissement et termine : la réception voit du vert.',
    },
  },

  head: {
    step: 'Étape {step} sur {total} · {who}',
    ended: 'Terminé : à vous d’essayer.',
    tryIt: 'Essayez vous-même.',
    hint: 'Un appui dans le portail client, un clic à la réception, un glissement sur le tableau.',
    free: 'Essayer moi-même',
    play: 'Lancer l’histoire',
    reset: 'Réinitialiser',
  },

  reception: {
    title: 'Réception – vue d’ensemble',
    badge: 'Demandes {count}',
    floor: 'Étage 2',
    counts: '{open} en attente · {inWork} en cours',
    checkin: 'Check-in {nr}',
    checkout: 'Check-out {nr}',
    priority: 'Prio {nr}',
    stay: 'Séjour {nr}',
    pin: 'PIN {pin}',
    done: 'Traité',
  },

  guest: {
    frame: 'Portail client – smartphone',
    room: 'Chambre {nr}',
    noStay: 'Pas encore de séjour : l’accès est créé lors du check-in à la réception.',
    checkin: 'Faire le check-in à la réception',
    sheet: 'Feuille d’arrivée : QR + PIN {pin}',
    clean: 'Nettoyer ma chambre',
    dnd: 'Ne pas déranger',
    services: 'Services',
    order: 'Commander',
    report: 'Signaler',
    openRequests: { one: '{count} demande ouverte', other: '{count} demandes ouvertes' },
  },

  board: {
    title: 'Tableau de suivi du ménage',
    floor: 'Étage 2',
    next: 'À suivre · {count} en attente',
    inWork: '{count} en cours',
    allDone: 'tout est fait',
    empty: 'Aucun ménage en attente à cet étage.',
    room: 'Chambre {nr}',
    maidIn: '{maid} dans la {nr}',
    finish: 'Terminer le ménage',
    start: 'Commencer le ménage',
  },

  tile: {
    cleaning: 'ménage en cours',
    request: 'Demande de service',
  },
} satisfies Shape<LandingMessages['demo']>
