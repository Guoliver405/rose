import { billing } from './billing'
import { houses } from './houses'

/** Konto-Bereich (`/admin`), je Teil eine Datei. */
export const account = { billing, houses }

export type AccountMessages = typeof account
