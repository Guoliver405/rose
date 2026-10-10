import { app } from './app'
import { account } from './account'

/** Housekeeping-Simulator (`/simulator`), je Teil eine Datei. */
export const simulator = { app, account }

export type SimulatorMessages = typeof simulator
