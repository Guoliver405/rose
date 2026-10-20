import type { Shape } from '../format'
import type { SymbolsMessages } from '../de/symbols'

/** Symboles des tuiles de chambre — libellés et textes de légende pour l’aide. Français. */
export const symbols = {
  symbols: {
    deactivated: {
      label: 'Hors service',
      text: 'Aucun check-in n’est possible dans cette chambre et elle n’apparaît sur aucun tableau de suivi du ménage. Son historique est conservé ; vous pouvez la remettre en service sous Chambres et étages.',
    },
    occupied: {
      label: 'Occupée',
      text: 'Un séjour est en cours. Le client dispose d’un code PIN ou d’un lien et peut, sur le portail, demander le ménage, activer « Ne pas déranger » et demander des services.',
    },
    departure: {
      label: 'Départ aujourd’hui',
      text: 'La date de départ saisie au check-in ou plus tard est aujourd’hui. Le ménage quotidien n’a pas lieu ce jour-là — la chambre est nettoyée après le check-out.',
    },
    dnd: {
      label: 'Ne pas déranger',
      text: 'Le client l’a activé sur le portail. Personne ne frappe, le ménage quotidien n’a pas lieu et la chambre est grisée sur le tableau de suivi du ménage. Seul le client peut le désactiver.',
    },
    clean: {
      label: 'Le client demande le ménage',
      text: 'Un appui sur le portail fait apparaître la chambre comme ouverte sur le tableau de suivi du ménage, sans rendez-vous. L’équipe d’étage la nettoie quand cela s’intègre dans sa tournée.',
    },
    deferred: {
      label: 'Ménage à partir de HH:MM',
      text: 'Le client a choisi une heure dans sa demande de ménage, ou a demandé à l’agent d’étage à la porte de repasser plus tard. Jusque-là, la chambre n’est ouverte pour aucun agent d’étage. Elle s’ouvre d’elle-même à l’heure indiquée.',
    },
    declined: {
      label: 'Pas de ménage aujourd’hui',
      text: 'Le client renonce au ménage pour aujourd’hui, d’un appui sur le bouton du portail ou en le disant à l’agent d’étage à la porte. Le ménage quotidien du jour n’a pas lieu et ne compte pas comme un ménage effectué ; il reprend demain. Si le client appuie ensuite sur « Nettoyer ma chambre », la chambre s’ouvre immédiatement.',
    },
    routine: {
      label: 'Ménage quotidien à faire',
      text: 'Uniquement si l’établissement nettoie chaque jour les chambres occupées (sous Établissement et règles) : le ménage s’ouvre à partir de la deuxième nuit, à l’heure réglée. Sans date de départ, pas avant l’heure limite du check-out. Seulement si la chambre n’a pas encore été nettoyée aujourd’hui et que « Ne pas déranger » n’est pas activé.',
    },
    checkout: {
      label: 'Check-out effectué — ménage à faire',
      text: 'Le client a fait son check-out et la chambre n’a pas encore été nettoyée. Elle reste ouverte jusqu’à ce qu’un agent d’étage termine le ménage ou que la réception le marque comme fait.',
    },
    priority: {
      label: 'Prioritaire',
      text: 'Défini manuellement par la réception en cas de réclamation ou de cas particulier. La chambre remonte sur le tableau de suivi du ménage et l’étage affiche un voyant violet. Jamais automatique.',
    },
    cleaning: {
      label: 'Ménage en cours',
      text: 'Un agent d’étage a tiré le curseur de démarrage ; son nom apparaît dans la chambre. S’il oublie de terminer, la chambre se rouvre d’elle-même une fois le délai dépassé.',
    },
    orders: {
      label: 'Demande de service ouverte',
      text: 'Le client a fait une demande qui n’a pas encore été marquée comme faite. Les demandes figurent sous « Demandes » dans la navigation ; marquez-les comme faites à cet endroit ou dans la fenêtre de la chambre.',
    },
    urgent: {
      label: 'Demande de service urgente',
      text: 'Au moins une demande ouverte concerne un service marqué « urgent » dans le catalogue de services. La cloche, l’anneau et le compteur de la navigation clignotent en rouge jusqu’à ce que la demande soit marquée comme faite.',
    },
  },
  bars: {
    priority: {
      label: 'Prioritaire',
      text: 'L’emporte sur tous les autres états. Tant que la priorité est active, la barre reste violette — même après le check-out.',
    },
    working: {
      label: 'En cours',
      text: 'Uniquement sur le tableau de suivi du ménage : un membre de l’équipe se trouve dans la chambre. Sur l’écran de la réception, seul l’indicateur de chargement le montre ; la barre garde sa couleur.',
    },
    checkout: {
      label: 'Check-out effectué',
      text: 'Ménage après le check-out ouvert.',
    },
    wanted: {
      label: 'Ménage demandé ou ménage quotidien dû',
      text: 'Le client a demandé le ménage, ou le ménage quotidien de l’établissement est dû. Une demande reportée (« à partir de HH:MM ») ne change la couleur de la barre qu’à l’heure indiquée.',
    },
    dnd: {
      label: '« Ne pas déranger »',
      text: 'Occupée, et le client ne souhaite pas être dérangé.',
    },
    occupied: {
      label: 'Occupée',
      text: 'Séjour en cours, rien à faire.',
    },
    ready: {
      label: 'Libre et prête',
      text: 'Libre et nettoyée — le check-in tient en un clic.',
    },
    neutral: {
      label: 'Sans tâche',
      text: 'Uniquement sur le tableau de suivi du ménage : libre, occupée sans demande, « Ne pas déranger » ou demande prévue plus tard. La chambre reste visible mais grisée — elle n’est pas bloquée.',
    },
    deactivated: {
      label: 'Hors service',
      text: 'Bordure en pointillés, tuile estompée. Aucun check-in possible.',
    },
  },
  rings: {
    urgent: {
      label: 'Bordure rouge clignotante',
      text: 'Demande de service urgente. L’emporte sur l’anneau violet ; la priorité reste visible par la barre et le drapeau.',
    },
    priority: {
      label: 'Bordure violette clignotante',
      text: 'Ménage prioritaire, tant qu’aucune demande urgente n’est en attente.',
    },
  },
} satisfies Shape<SymbolsMessages>
