import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BedDouble, ChevronRight, ConciergeBell, DoorOpen, FlaskConical, KeyRound, QrCode,
  SlidersHorizontal, Users, type LucideIcon,
} from 'lucide-react'
import { getManagementContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { parseGuestAccessMode } from '@/lib/guest-access'
import { getMessages, type AdminMessages } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'

type TileId = keyof AdminMessages['settings']['hub']['tiles']

type Tile = {
  /** Pfad relativ zum Haus-Bereich — der Slug kommt erst beim Rendern dazu. */
  path: string
  icon: LucideIcon
  /** Schlüssel für Titel und Beschreibung in der Sprachdatei. */
  id: TileId
  /** Temporäre Bereiche (Test-Szenario) amber markieren. */
  temporary?: boolean
}

const ADMIN_TILES: Tile[] = [
  { path: '/einstellungen/hotel', icon: SlidersHorizontal, id: 'house' },
  { path: '/einstellungen/gastzugang', icon: DoorOpen, id: 'guestAccess' },
  { path: '/zimmer', icon: BedDouble, id: 'rooms' },
  { path: '/personal', icon: Users, id: 'staff' },
  { path: '/services', icon: ConciergeBell, id: 'services' },
  { path: '/einstellungen/zugang', icon: KeyRound, id: 'myAccess' },
  { path: '/einstellungen/test', icon: FlaskConical, id: 'testScenario', temporary: true },
]

/**
 * Rezeption: nur die Tagesgeschäft-nahen Bereiche laut Rechtekonzept. Die
 * Aushänge stehen hier als eigene Kachel, weil die Rezeption die Seite
 * „Gäste-Zugang" nicht sieht — Inhaber und Manager erreichen sie von dort.
 */
const RECEPTION_TILES: Tile[] = [
  { path: '/zimmer/aushang', icon: QrCode, id: 'notices' },
  { path: '/personal', icon: Users, id: 'staffCards' },
  { path: '/einstellungen/zugang', icon: KeyRound, id: 'myAccess' },
]

export default async function EinstellungenHubPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const ctx = await getManagementContext(slug)
  if (!ctx) redirect('/admin')
  const m = getMessages(await getAdminLocale()).admin.settings

  // Manager hat im Haus dieselben Rechte wie der Inhaber — nur die
  // Rezeption bekommt den verkürzten Hub.
  const base = `/h/${ctx.hotelSlug}/admin`

  // Aushänge gibt es nur im PIN-Verfahren — im Link-Verfahren führten sie
  // auf eine PIN-Eingabe, die niemand bedienen kann.
  const supabase = await createClient()
  const { data: hotel } = await supabase
    .from('hotels').select('policies').eq('id', ctx.hotelId).single()
  const accessMode = parseGuestAccessMode((hotel?.policies ?? {}) as Record<string, unknown>)

  const tiles = (ctx.role !== 'reception' ? ADMIN_TILES : RECEPTION_TILES)
    .filter(t => t.path !== '/zimmer/aushang' || accessMode === 'pin')

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <h1 className="text-xl font-black text-ink">{m.title}</h1>

      <div className="flex flex-col gap-2">
        {tiles.map(t => (
          <Link
            key={t.path}
            href={`${base}${t.path}`}
            className={`flex items-center gap-4 rounded-xl border p-4 hover:border-edge-strong ${
              t.temporary
                ? 'border-attention-tint-edge bg-attention-tint'
                : 'border-edge bg-surface'
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                t.temporary ? 'bg-attention-pill text-attention-deepest' : 'bg-surface-muted text-ink-soft'
              }`}
            >
              <t.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-sm font-bold ${t.temporary ? 'text-attention-deepest' : 'text-ink'}`}>
                {m.hub.tiles[t.id].title}
              </span>
              <span className="block truncate text-xs text-ink-muted">{m.hub.tiles[t.id].description}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
          </Link>
        ))}
      </div>
    </div>
  )
}
