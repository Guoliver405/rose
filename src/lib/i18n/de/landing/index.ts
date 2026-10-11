import { page } from './page'
import { demo } from './demo'
import { roi } from './roi'
import { day } from './day'

/** Landing Page (`/`), je Teil eine Datei; `day` nutzt auch der Simulator (Tagesbild). */
export const landing = { page, demo, roi, day }

export type LandingMessages = typeof landing
