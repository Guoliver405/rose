import { common } from './common'
import { overview } from './overview'
import { staff } from './staff'
import { rooms } from './rooms'
import { services } from './services'
import { settings } from './settings'

/** Front desk (`/h/<slug>/admin`) — American English, one file per area. */
export const admin = { common, overview, staff, rooms, services, settings }
