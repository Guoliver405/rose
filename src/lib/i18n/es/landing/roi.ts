import type { Shape } from '../../format'
import type { LandingMessages } from '../../de/landing'

/** Calculadora de beneficios de la página de inicio (`RoiCalculator`) en español. Los títulos de las fuentes se mantienen en su idioma original. */
export const roi = {
  heading: '¿Qué gana su establecimiento?',
  intro: 'Dos palancas que se pueden cuantificar: limpiezas que dejan de ser necesarias y menos tiempo muerto por limpieza. Todo lo demás (menos lavandería, menos quejas, el registro del trabajo) no lo contamos.',

  inputs: {
    rooms: 'Habitaciones',
    occupancy: 'Ocupación',
    nights: 'Estancia media',
    nightsValue: { one: '{nights} noche', other: '{nights} noches' },
    hourly: 'Coste de una hora de limpieza',
    hourlyHint: 'Salario más costes del empleador*',
  },

  cost: {
    label: 'RoSe cuesta',
    sub: 'al mes, más IVA · al menos un mes completo gratis',
  },
  savings: {
    label: 'RoSe ahorra aprox.',
    sub: 'de tiempo de limpieza al mes, con las hipótesis de abajo*',
  },

  bars: {
    skipped: 'Limpiezas de habitaciones con estancia en curso que se omiten ({count} al mes)',
    coordination: 'Menos tiempo muerto en las {count} limpiezas restantes',
  },
  hours: '{count} h',
  minutes: '{value} min',
  percent: '{value} %',
  planning: 'Las horas ahorradas solo se convierten en costes ahorrados si la planificación del personal se ajusta. Para ello, las estadísticas de RoSe muestran cuánto tiempo de limpieza se necesita realmente.',

  assumptions: {
    toggle: 'Ajustar hipótesis*',
    preset: 'Predefinido:',
    presets: { vorsichtig: 'prudente', typisch: 'típico' },
    a1: {
      label: 'A1 · Duración de la limpieza de una habitación con estancia en curso',
      hint: 'Medido 20–25 min, por habitación en general 15–30 min; 18 min es un cálculo prudente [Q3, Q4, Q7, Q8]',
    },
    a2: {
      label: 'A2 · Huéspedes que renuncian a la limpieza diaria',
      hint: '20 % como valor de planificación, 34 % en un estudio de caso, el 70 % lo desea [Q1–Q3]',
    },
    a3: {
      label: 'A3 · Menos tiempo muerto por limpieza',
      hint: 'Los fabricantes citan un 25–67 %; nosotros tomamos ≈ 7–10 % [Q6]',
    },
    formula: {
      one: 'Proporción de habitaciones con estancia en curso = 1 − 1 / duración de la estancia ({share} de las habitaciones ocupadas con {nights} noche). Mes = {days} días. Coste por hora predeterminado: salario mínimo alemán 13,90 € × 1,23 por costes del empleador [Q5].',
      other: 'Proporción de habitaciones con estancia en curso = 1 − 1 / duración de la estancia ({share} de las habitaciones ocupadas con {nights} noches). Mes = {days} días. Coste por hora predeterminado: salario mínimo alemán 13,90 € × 1,23 por costes del empleador [Q5].',
    },
  },

  sources: {
    summary: '* Fuentes de las hipótesis',
    link: 'Fuente',
    note: 'Los datos de fabricantes están señalados como tales; no conocemos ninguna encuesta alemana sobre la renuncia a la limpieza. Todos los valores son estimaciones, no una garantía.',
    items: {
      Q1: 'AHLA, «Hotel Room Cleaning Practices Reflect Guest Preferences», 2022: el 70 % de los huéspedes no desea limpieza diaria; el 38 % solo bajo petición, el 19 % solo en el check-out.',
      Q2: 'Lodging Magazine, «The Value of Opting Out», 2024: 20 % de renuncia como valor de planificación de un establecimiento Hilton.',
      Q3: 'CityShift Finance, estudio de caso sobre opt-out: 34 % de renuncia tras 18 meses; 25 minutos por habitación con estancia en curso; ahorro solo con una planificación del personal ajustada.',
      Q4: 'Estudio de tiempos de Heath & Company, publicado en Hotel Business, 2018: habitaciones de salida 43 minutos de media, habitaciones con estancia en curso casi 20 minutos menos (EE. UU.).',
      Q5: 'Salario mínimo legal alemán de 13,90 €/h a partir de 2026 (DGB); Destatis: unos 23 € de costes del empleador por cada 100 € de salario bruto.',
      Q6: 'Datos de fabricantes de software de housekeeping: 25–67 % de aumento de productividad (Stayntouch, Flexkeeping vía Lodging Magazine); calculamos a propósito con una fracción de ello.',
      Q7: 'Reinigung Aktuell, 2015: habitaciones de salida unos 35 minutos, habitaciones con estancia en curso unos 25, alrededor de 14 habitaciones por persona de limpieza (hotel de cuatro estrellas, Viena).',
      Q8: 'CCOHS (Centro canadiense de salud y seguridad en el trabajo), «Hotel Housekeeping»: de 15 a 30 minutos por habitación, unas 16 habitaciones por turno.',
    },
  },
} satisfies Shape<LandingMessages['roi']>
