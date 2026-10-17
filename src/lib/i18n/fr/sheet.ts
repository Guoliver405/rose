import type { Shape } from '../format'
import type { SheetMessages } from '../de/sheet'

/** Feuilles imprimées et e-mail d’accès client — français. Structure : `de/sheet.ts`. */
export const sheet = {
  langLabel: 'Français',
  heading: 'Comment ça marche',
  sheet: {
    welcome: 'Bienvenue',
    room: 'Chambre',
    scan: 'Scannez le QR code',
    pin: 'Votre code PIN',
    pinFromReception: 'Vous recevez votre code PIN à l’arrivée.',
    qrAlt: 'QR code vers le portail client',
    withoutQr: 'Sans QR code',
    keep: 'Conservez cette feuille : c’est votre accès.',
  },
  buttonHints: {
    clean: 'Appuyez quand vous souhaitez le ménage.',
    dnd: 'Personne ne frappe, pas même pour un service.',
    services: 'Serviettes, réparations et plus : la réception le voit aussitôt.',
  },
  sustainabilityNeutral:
    'Chaque ménage inutile économise eau, lessive et énergie — c’est vous qui décidez sur le portail.',
  footer: 'Toutes les informations et les horaires actuels sont sur le portail.',
  labels: {
    cleaning: 'Ménage',
    sustainability: 'Durabilité',
    dnd: 'Tranquillité',
    services: 'Services',
    access: 'Accès',
  },
  purpose:
    'Le portail client vous met en relation avec la réception depuis votre chambre, 24 h/24 et sans appel téléphonique.',
  dnd: '« Ne pas déranger » sur le portail tient le personnel à l’écart de votre chambre jusqu’à ce que vous le désactiviez.',
  services:
    'Demandez des serviettes propres, signalez une panne ou commandez d’autres services directement sur le portail — la réception voit votre demande immédiatement.',
  cleaningRoutine:
    'Votre chambre est nettoyée chaque jour à partir de {due}, le jour du départ après le check-out — vous n’avez rien à demander. Vous souhaitez un ménage supplémentaire ? Demandez-le sur le portail.',
  cleaningOnRequest:
    'Votre chambre est nettoyée à la demande : demandez le ménage sur le portail quand cela vous convient — sans demande, nous n’entrons pas dans la chambre.',
  window: ' Le portail accepte les demandes de ménage tous les jours de {start} à {end}.',
  defer: ' Vous pouvez aussi reporter le ménage jusqu’à {limit} au plus tard : personne ne viendra avant.',
  sustainabilityRoutine:
    'Pas besoin de ménage aujourd’hui ? Un appui sur « {skip} » (pas de ménage aujourd’hui) dans le portail économise eau, lessive et énergie — le ménage reprend demain.',
  sustainabilityOnRequest:
    'Moins de ménage, moins de consommation : chaque ménage inutile économise de l’eau, de la lessive et de l’énergie. C’est pourquoi nous ne venons que si vous le souhaitez.',
  access: {
    link: 'Cet accès est personnel et ne nécessite pas de code PIN — merci de ne pas le partager. Il n’est valable que pour ce séjour et expire au check-out.',
    pinDeep: 'Scannez le QR code et saisissez le code PIN — vous restez ensuite connecté. Le code PIN est valable jusqu’au check-out.',
    pinManual: 'Ouvrez l’adresse, saisissez le numéro de chambre et le code PIN — vous restez ensuite connecté. Le code PIN est valable jusqu’au check-out.',
  },
  mail: {
    subject: 'Votre accès au portail client – {hotel}, chambre {room}',
    greeting: 'Bonjour,',
    intro: 'voici votre accès au portail client de <b>{hotel}</b>, chambre <b>{room}</b>.',
    open: 'Ouvrir le portail client',
    pin: 'Votre code PIN :',
    fallback: 'Si le bouton ne fonctionne pas, ouvrez cette adresse :',
    howTo: 'Comment fonctionne le portail',
  },
} satisfies Shape<SheetMessages>
