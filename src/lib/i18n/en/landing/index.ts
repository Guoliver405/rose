import type { Shape } from '../../format'
import type { LandingMessages } from '../../de/landing'
import { page } from './page'
import { demo } from './demo'
import { roi } from './roi'
import { day } from './day'

/** Landing page (`/`) in American English; `day` is also used by the simulator. */
export const landing = { page, demo, roi, day } satisfies Shape<LandingMessages>
