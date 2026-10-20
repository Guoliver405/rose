import type { Shape } from '../../format'
import type { LandingMessages } from '../../de/landing'

/**
 * Vista del día (`CleaningSimulation`) en español, usada por la página de
 * inicio y por el simulador.
 */
export const day = {
  titles: { paper: 'Sin coordinación', rose: 'Con RoSe' },

  lead: {
    paper: {
      routine: 'Lista en papel por planta. Nadie sabe cuándo se va un huésped; lo que cuelga de las puertas y lo que ha dicho un huésped solo lo sabe quien llega a la planta.',
      onDemand: 'Lista en papel y colgadores «Por favor, limpien», visibles solo para quien está en el pasillo.',
    },
    rose: {
      routine: 'Panel compartido: check-out, petición, «no antes de», «No molestar» y «más tarde», al instante para todos.',
      onDemand: 'Los huéspedes pulsan «Limpiar mi habitación» o «no antes de»: al instante en el panel, para todos.',
    },
  },

  policy: {
    label: 'Limpiar habitaciones ocupadas:',
    aria: 'Limpieza de las habitaciones ocupadas',
    routine: 'a diario',
    onDemand: 'solo bajo petición',
    note: 'se aplica a ambas vistas; solo se compara la coordinación',
  },

  controls: {
    pause: 'Pausa',
    again: 'Repetir',
    play: 'Reproducir',
    reset: 'Volver a las {time}',
    minuteBack: 'Un minuto atrás',
    minuteForward: 'Un minuto adelante',
    minute: '1 min',
    clock: 'Hora',
  },

  legend: {
    states: {
      occupied: 'Huésped en la habitación',
      departed: 'salida',
      wants: 'Huésped fuera, limpieza pendiente',
      dnd: 'No molestar',
      declined: 'rechazada: hoy sin limpieza',
      deferred: '«no antes de»: con RoSe se conoce la hora',
      skipped: 'no desea limpieza',
      empty: 'libre',
      cleaning: 'en limpieza',
      done: 'terminada',
    },
    later: 'Huésped aún dentro, «más tarde» (sin software, solo lo sabe quien llamó a la puerta)',
    repeat: 'vuelve a llamar, aunque alguien del equipo ya lo había oído',
    priority: 'Caso especial (prioritaria)',
    maids: 'Persona de limpieza {range}',
    idle: 'espera, ahora no hay nada que hacer',
    search: 'recorre las plantas buscando trabajo',
  },

  panel: {
    floorSuffix: '',
    departuresReady: 'Salidas listas',
    status: 'Todo terminado a las <b>{time}</b> · visitas inútiles a la puerta <b>{count}×</b>',
  },

  activity: {
    now: 'Ahora: ',
    nobody: 'todavía nadie en marcha',
    item: '<b>{count}</b> {label}',
    labels: {
      clean: 'limpiando',
      door: 'en la puerta',
      walk: 'en camino',
      search: 'buscando trabajo',
      radio: 'en la radio',
      idle: 'esperando',
      done: 'terminado',
    },
    totals: 'Hasta ahora en la puerta <b>{door} min</b> · esperado <b>{idle} min</b>',
    totalsSearch: 'Hasta ahora en la puerta <b>{door} min</b> · esperado <b>{idle} min</b> · plantas recorridas <b>{search} min</b>',
  },

  later: {
    title: '{nr}: huésped aún dentro, «más tarde» ({who})',
    all: 'lo sabe todo el mundo',
    one: 'solo lo sabe la persona de limpieza {name}',
  },

  caption: 'Sin coordinación muestra un procedimiento convencional típico: lista en papel de la mañana, plantas asignadas a cada persona de limpieza, salidas primero en cuanto la lista las indica como libres. Otros procedimientos, como los check-outs comunicados por radio desde recepción o las plantas elegidas libremente, se comparan en el <link>Simulador Housekeeping</link>, con las cifras de su establecimiento. Un día corriente: la mediana de 101 días calculados, medida por la ventaja en las salidas en ambas posiciones del selector. {rooms} habitaciones en {floors} plantas, {maids} personas de limpieza desde las 8:00 (sin software, dos plantas asignadas a cada una), check-out hasta las 11:00, check-in desde las 15:00. Los mismos huéspedes en ambas vistas: se marchan o salen de la habitación entre las 7:00 y las 11:00, de forma uniforme; cuanto más tarde, más probable es que llamar a la puerta sirva de algo. A diario: habitaciones ocupadas en ambas vistas desde las 8:00, sin software según la lista, con RoSe mediante la fecha de salida registrada en el check-in. Hipótesis sobre el comportamiento de los huéspedes: el {signals} % de los huéspedes que desean limpieza lo indica al salir (bajo petición: todos), el {notBefore} % indica «no antes de» en RoSe, el {dnd} % tiene «No molestar» en la puerta por la mañana, un tercio de ellos todo el día. Sin software, una persona de limpieza solo ve colgadores y carteles al llegar a la planta; lo que un huésped dice en la puerta se anota en una lista que se queda en la planta: quien llega la lee (2 min), quien echa una mano pregunta al equipo. Con RoSe, todo esto aparece al instante en el panel, para todos. Cambio de planta con el carro: 5 min. Duración de la limpieza como hipótesis, más bien ajustada: habitaciones de salida 30 min, habitaciones ocupadas 18 min; los tiempos medidos fueron de 35–43 y 20–25 min (fuentes Q4 y Q7 de la calculadora de beneficios).',
} satisfies Shape<LandingMessages['day']>
