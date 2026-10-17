import type { Shape } from '../../format'
import type { SimulatorMessages } from '../../de/simulator'
import { app } from './app'
import { account } from './account'

/** Housekeeping Simulator (`/simulator`), American English. */
export const simulator = { app, account } satisfies Shape<SimulatorMessages>
