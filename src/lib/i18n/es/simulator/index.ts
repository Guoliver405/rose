import type { Shape } from '../../format'
import type { SimulatorMessages } from '../../de/simulator'
import { app } from './app'
import { account } from './account'

/** Simulador Housekeeping (`/simulator`), español de España con vocabulario neutro. */
export const simulator = { app, account } satisfies Shape<SimulatorMessages>
