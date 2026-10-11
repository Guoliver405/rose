import { topics } from './topics'
import { lotsen } from './lotsen'
import { ui } from './ui'
import { sim } from './sim'

/** Hilfe-Bereich: Themen der Kontexthilfe, Lotsen und die Bedienelemente beider. */
export const help = { topics, lotsen, ui, sim }

export type HelpMessages = typeof help
