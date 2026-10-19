import type { Shape } from '../../format'
import type { LandingMessages } from '../../de/landing'

/**
 * Vue de la journée (`CleaningSimulation`) en français, utilisée par la page
 * d’accueil et par le simulateur.
 */
export const day = {
  titles: { paper: 'Sans coordination', rose: 'Avec RoSe' },

  lead: {
    paper: {
      routine: 'Liste papier par étage. Personne ne sait quand un client part ; ce qui est accroché aux portes et ce qu’un client a dit, seul le sait celui qui vient à l’étage.',
      onDemand: 'Liste papier et accroche-portes « Merci de faire la chambre », visibles seulement pour qui se trouve dans le couloir.',
    },
    rose: {
      routine: 'Tableau partagé : check-out, demande, « pas avant », « Ne pas déranger » et « plus tard », aussitôt pour tous.',
      onDemand: 'Les clients appuient sur « Nettoyer ma chambre » ou « pas avant » : aussitôt sur le tableau, pour tous.',
    },
  },

  policy: {
    label: 'Ménage des recouches :',
    aria: 'Ménage des chambres en recouche',
    routine: 'quotidien',
    onDemand: 'uniquement à la demande',
    note: 'vaut pour les deux vues, seule la coordination est comparée',
  },

  controls: {
    pause: 'Pause',
    again: 'Rejouer',
    play: 'Lecture',
    reset: 'Revenir à {time}',
    minuteBack: 'Une minute en arrière',
    minuteForward: 'Une minute en avant',
    minute: '1 min',
    clock: 'Heure',
  },

  legend: {
    states: {
      occupied: 'Client dans la chambre',
      departed: 'départ',
      wants: 'Client sorti, ménage à faire',
      dnd: 'Ne pas déranger',
      declined: 'refusé, pas de ménage aujourd’hui',
      deferred: '« pas avant » : connu comme heure avec RoSe',
      skipped: 'pas de ménage souhaité',
      empty: 'libre',
      cleaning: 'ménage en cours',
      done: 'terminé',
    },
    later: 'Client encore là, « plus tard » (sans logiciel, seul le sait qui a frappé)',
    repeat: 'frappe à nouveau, alors que quelqu’un de l’équipe l’a déjà entendu',
    priority: 'Cas particulier (prioritaire)',
    maids: 'Agent d’étage {range}',
    idle: 'attend, rien à faire pour l’instant',
    search: 'parcourt les étages en cherchant du travail',
  },

  panel: {
    floorSuffix: '',
    departuresReady: 'Départs prêts',
    status: 'Tout terminé <b>{time}</b> · passages inutiles à la porte <b>{count}×</b>',
  },

  activity: {
    now: 'Maintenant : ',
    nobody: 'personne n’est encore en route',
    item: '<b>{count}</b> {label}',
    labels: {
      clean: 'en ménage',
      door: 'à la porte',
      walk: 'en route',
      search: 'cherchent du travail',
      radio: 'à la radio',
      idle: 'attendent',
      done: 'terminé',
    },
    totals: 'Jusqu’ici à la porte <b>{door} min</b> · attente <b>{idle} min</b>',
    totalsSearch: 'Jusqu’ici à la porte <b>{door} min</b> · attente <b>{idle} min</b> · étages parcourus <b>{search} min</b>',
  },

  later: {
    title: '{nr} : client encore là, « plus tard » — {who}',
    all: 'tout le monde le sait',
    one: 'seul l’agent d’étage {name} le sait',
  },

  caption: 'Sans coordination montre une organisation classique typique : liste papier du matin, étages attribués à chaque agent d’étage, départs en premier dès que la liste les indique comme libres. D’autres organisations, comme les check-outs annoncés à la radio par la réception ou les étages choisis librement, sont comparées dans le <link>Simulateur Housekeeping</link>, avec les chiffres de votre établissement. Une journée ordinaire : la médiane de 101 journées calculées, mesurée à l’avance prise sur les départs dans les deux positions du sélecteur. {rooms} chambres sur {floors} étages, {maids} agents d’étage à partir de 8:00 (sans logiciel, deux étages attribués chacun), check-out jusqu’à 11:00, check-in à partir de 15:00. Les mêmes clients dans les deux vues : ils partent ou quittent leur chambre entre 7:00 et 11:00, de façon uniformément répartie ; plus il est tard, plus frapper a de chances d’aboutir. Ménage quotidien : recouches dans les deux vues à partir de 8:00, sans logiciel selon la liste, avec RoSe grâce à la date de départ saisie au check-in. Hypothèses sur le comportement des clients : {signals} % des clients qui souhaitent le ménage le signalent en sortant (à la demande : tous), {notBefore} % indiquent « pas avant » dans RoSe, {dnd} % ont « Ne pas déranger » sur la porte le matin, dont un tiers toute la journée. Sans logiciel, un agent d’étage ne voit accroche-portes et panneaux qu’une fois à l’étage ; ce qu’un client dit à la porte est noté sur une liste qui reste à l’étage : qui y vient la lit (2 min), qui vient en renfort demande à l’équipe. Avec RoSe, tout cela est aussitôt sur le tableau, pour tous. Changement d’étage avec le chariot : 5 min. Durées de ménage retenues comme hypothèse, plutôt serrées : chambres de départ 30 min, recouches 18 min ; les durées mesurées étaient de 35–43 et 20–25 min (sources Q4 et Q7 du calculateur de gains).',
} satisfies Shape<LandingMessages['day']>
