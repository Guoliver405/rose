import type { Shape } from '../../format'
import type { ui as de } from '../../de/help/ui'

/** Ayuda: controles (botón «?», panel lateral, página de tema, tarjeta de la guía y página de ayuda). Español. */
export const ui = {
  button: {
    open: 'Ayuda',
    openTopic: 'Ayuda: {title}',
    close: 'Cerrar la ayuda',
  },

  sidebar: {
    label: 'Ayuda',
    allTopics: 'Todos los temas',
    close: 'Cerrar la ayuda',
    closeHint: 'Cerrar la ayuda (Esc)',
    startLotse: 'Iniciar la guía',
    asPage: 'Abrir como página',
    asPageHint: 'Para imprimir o compartir',
    noTopic: 'Esta página no tiene un tema propio. Elija uno de la lista; el panel permanece abierto hasta que lo cierre.',
  },

  topic: {
    questions: 'Preguntas',
    seeAlso: 'Véase también',
    startLotse: 'Iniciar la guía',
    backHub: 'Ayuda',
    backHouses: 'Establecimientos',
  },

  pilot: {
    region: 'Guía: {title}',
    progress: '{step} / {total}',
    close: 'Terminar la guía',
    missing: 'La zona descrita no aparece ahora en la página: depende de un ajuste que en su establecimiento es distinto o de datos que aquí todavía no existen.',
    back: 'Atrás',
    end: 'Terminar',
    next: 'Siguiente',
    done: 'Listo',
  },

  hub: {
    title: 'Ayuda y guías',
    intro: 'Cada área tiene una explicación para consultar (símbolos, preguntas y respuestas) y una guía: un recorrido guiado por la página real que le muestra paso a paso cómo funciona. Puede seguir usando la página con normalidad; no se bloquea nada. Puede terminar la guía en cualquier momento con «Terminar». El «?» de arriba a la derecha abre la explicación junto a cualquier página.',
    setupTitle: 'Configurar su establecimiento',
    setupCount: '{done} de {total}',
    setupContinue: 'Continuar la configuración',
    setupAgain: 'Revisar de nuevo la configuración',
    optional: 'opcional',
    catalogTitle: 'Ayuda por temas',
    catalogIntro: 'Ambas llevan a la página correspondiente: la explicación se abre en el panel lateral y la guía le acompaña por la página paso a paso. Puede usar las dos tantas veces como quiera.',
    explanation: 'Explicación',
    lotse: { one: 'Guía ({count} paso)', other: 'Guía ({count} pasos)' },
  },
} satisfies Shape<typeof de>
