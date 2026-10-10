import { common } from './common'
import { overview } from './overview'
import { staff } from './staff'
import { rooms } from './rooms'
import { services } from './services'
import { settings } from './settings'

/** Rezeption (`/h/<slug>/admin`), je Bereich eine Datei. */
export const admin = { common, overview, staff, rooms, services, settings }

export type AdminMessages = typeof admin
