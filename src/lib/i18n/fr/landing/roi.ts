import type { Shape } from '../../format'
import type { LandingMessages } from '../../de/landing'

/** Calculateur de gains de la page d’accueil (`RoiCalculator`) en français. Les titres des sources restent dans leur langue d’origine. */
export const roi = {
  heading: 'Que gagne votre établissement ?',
  intro: 'Deux leviers chiffrables : les ménages qui ne sont plus nécessaires et moins de temps mort par ménage. Tout le reste (moins de linge, moins de réclamations, la preuve du travail effectué), nous ne le comptons pas.',

  inputs: {
    rooms: 'Chambres',
    occupancy: 'Taux d’occupation',
    nights: 'Durée moyenne de séjour',
    nightsValue: { one: '{nights} nuit', other: '{nights} nuits' },
    hourly: 'Coût d’une heure de ménage',
    hourlyHint: 'Salaire plus charges patronales*',
  },

  cost: {
    label: 'RoSe coûte',
    sub: 'par mois, hors TVA · au moins un mois complet offert',
  },
  savings: {
    label: 'RoSe économise environ',
    sub: 'de temps de ménage par mois, selon les hypothèses ci-dessous*',
  },

  bars: {
    skipped: 'Recouches évitées ({count} par mois)',
    coordination: 'Moins de temps mort sur les {count} ménages restants',
  },
  hours: '{count} h',
  minutes: '{value} min',
  percent: '{value} %',
  planning: 'Les heures économisées ne deviennent des coûts économisés que si la planification du personnel suit. Pour cela, les statistiques de RoSe montrent combien de temps de ménage est réellement nécessaire.',

  assumptions: {
    toggle: 'Ajuster les hypothèses*',
    preset: 'Préréglage :',
    presets: { vorsichtig: 'prudent', typisch: 'typique' },
    a1: {
      label: 'A1 · Durée du ménage d’une chambre en recouche',
      hint: 'Mesuré 20–25 min, par chambre en général 15–30 min : 18 min est une estimation prudente [Q3, Q4, Q7, Q8]',
    },
    a2: {
      label: 'A2 · Clients qui renoncent au ménage quotidien',
      hint: '20 % comme valeur de planification, 34 % dans une étude de cas, 70 % le souhaitent [Q1–Q3]',
    },
    a3: {
      label: 'A3 · Moins de temps mort par ménage',
      hint: 'Les éditeurs avancent 25–67 %, nous retenons ≈ 7–10 % [Q6]',
    },
    formula: {
      one: 'Part des chambres en recouche = 1 − 1 / durée de séjour ({share} des chambres occupées pour {nights} nuit). Mois = {days} jours. Coût horaire par défaut : salaire minimum allemand 13,90 € × 1,23 pour les charges patronales [Q5].',
      other: 'Part des chambres en recouche = 1 − 1 / durée de séjour ({share} des chambres occupées pour {nights} nuits). Mois = {days} jours. Coût horaire par défaut : salaire minimum allemand 13,90 € × 1,23 pour les charges patronales [Q5].',
    },
  },

  sources: {
    summary: '* Sources des hypothèses',
    link: 'Source',
    note: 'Les chiffres des éditeurs sont signalés comme tels ; nous ne connaissons pas d’enquête allemande sur le renoncement au ménage. Toutes les valeurs sont des estimations, pas une garantie.',
    items: {
      Q1: 'AHLA, « Hotel Room Cleaning Practices Reflect Guest Preferences », 2022 : 70 % des clients ne souhaitent pas de ménage quotidien ; 38 % uniquement sur demande, 19 % uniquement au check-out.',
      Q2: 'Lodging Magazine, « The Value of Opting Out », 2024 : 20 % de renoncement comme valeur de planification d’un établissement Hilton.',
      Q3: 'CityShift Finance, étude de cas sur l’opt-out : 34 % de renoncement après 18 mois ; 25 minutes par chambre en recouche ; économies seulement avec une planification du personnel adaptée.',
      Q4: 'Étude de temps Heath & Company, rapportée dans Hotel Business, 2018 : chambres de départ 43 minutes en moyenne, chambres en recouche près de 20 minutes de moins (États-Unis).',
      Q5: 'Salaire minimum légal allemand de 13,90 €/h à partir de 2026 (DGB) ; Destatis : environ 23 € de charges patronales pour 100 € de salaire brut.',
      Q6: 'Chiffres des éditeurs de logiciels de housekeeping : 25–67 % de gain de productivité (Stayntouch, Flexkeeping via Lodging Magazine), nous calculons volontairement avec une fraction de ce chiffre.',
      Q7: 'Reinigung Aktuell, 2015 : chambres de départ environ 35, chambres en recouche environ 25 minutes, environ 14 chambres par agent d’étage (hôtel quatre étoiles, Vienne).',
      Q8: 'CCOHS (Centre canadien d’hygiène et de sécurité au travail), « Hotel Housekeeping » : 15 à 30 minutes par chambre, environ 16 chambres par service.',
    },
  },
} satisfies Shape<LandingMessages['roi']>
