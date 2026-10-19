import type { Shape } from '../../format'
import type { LandingMessages } from '../../de/landing'
import { page } from './page'
import { demo } from './demo'
import { roi } from './roi'
import { day } from './day'

/** Página de inicio (`/`) en español; `day` también la usa el simulador. */
export const landing = { page, demo, roi, day } satisfies Shape<LandingMessages>
