import { topics } from './topics'
import { lotsen } from './lotsen'
import { ui } from './ui'
import { sim } from './sim'
import { tickets } from './tickets'

/** Hilfe-Bereich: Themen der Kontexthilfe, Lotsen und die Bedienelemente beider. */
export const help = { topics, lotsen, ui, sim, tickets }

export type HelpMessages = typeof help
