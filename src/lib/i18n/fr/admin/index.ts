import { common } from './common'
import { overview } from './overview'
import { staff } from './staff'
import { rooms } from './rooms'
import { services } from './services'
import { settings } from './settings'

/** Réception (`/h/<slug>/admin`) — français, un fichier par domaine. */
export const admin = { common, overview, staff, rooms, services, settings }
