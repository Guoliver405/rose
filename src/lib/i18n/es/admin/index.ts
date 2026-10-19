import { common } from './common'
import { overview } from './overview'
import { staff } from './staff'
import { rooms } from './rooms'
import { services } from './services'
import { settings } from './settings'

/** Recepción (`/h/<slug>/admin`): español, un archivo por área. */
export const admin = { common, overview, staff, rooms, services, settings }
