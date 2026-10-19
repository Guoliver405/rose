import type { Shape } from '../../format'
import type { SimulatorMessages } from '../../de/simulator'
import { app } from './app'
import { account } from './account'

/** Simulateur Housekeeping (`/simulator`), français (France). */
export const simulator = { app, account } satisfies Shape<SimulatorMessages>
