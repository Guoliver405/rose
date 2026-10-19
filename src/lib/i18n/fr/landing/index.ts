import type { Shape } from '../../format'
import type { LandingMessages } from '../../de/landing'
import { page } from './page'
import { demo } from './demo'
import { roi } from './roi'
import { day } from './day'

/** Page d’accueil (`/`) en français ; `day` sert aussi au simulateur. */
export const landing = { page, demo, roi, day } satisfies Shape<LandingMessages>
