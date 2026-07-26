import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BarChart3, BedDouble, ChevronRight, ConciergeBell, FlaskConical, KeyRound, QrCode,
  SlidersHorizontal, Users, type LucideIcon,
} from 'lucide-react'
import { getManagementContext } from '@/utils/auth'

type Tile = {
  /** Pfad relativ zum Haus-Bereich — der Slug kommt erst beim Rendern dazu. */
  path: string
  icon: LucideIcon
  title: string
  description: string
  /** Temporäre Bereiche (Test-Szenario) amber markieren. */
  temporary?: boolean
}

const ADMIN_TILES: Tile[] = [
  {
    path: '/einstellungen/hotel', icon: SlidersHorizontal, title: 'Hotel & Regeln',
    description: 'Hotelname, Gast-PIN-Länge, Reinigungs-Timeout, Routine-Reinigung',
  },
  {
    path: '/zimmer', icon: BedDouble, title: 'Zimmer',
    description: 'Zimmer anlegen und verwalten — Nummern, Etagen, Gebäudeteile',
  },
  {
    path: '/personal', icon: Users, title: 'Personal',
    description: 'Reinigungskräfte und Rezeptions-Zugänge, QR-Login-Karten',
  },
  {
    path: '/services', icon: ConciergeBell, title: 'Service-Baukasten',
    description: 'Services konfigurieren, die Gäste anfragen können',
  },
  {
    path: '/auswertung', icon: BarChart3, title: 'Auswertung Reinigung',
    description: 'Arbeits- und Reinigungszeiten je Kraft, Tagesprotokolle',
  },
  {
    path: '/zimmer/aushang', icon: QrCode, title: 'QR-Aushänge',
    description: 'Zimmer-Aushänge mit QR-Code zum Drucken',
  },
  {
    path: '/einstellungen/passwort', icon: KeyRound, title: 'Passwort',
    description: 'Eigenes Anmelde-Passwort ändern',
  },
  {
    path: '/einstellungen/test', icon: FlaskConical, title: 'Test-Szenario',
    description: 'Vorübergehend: fingierte Belegungs- und Reinigungslage zum Testen',
    temporary: true,
  },
]

/** Rezeption: nur die Tagesgeschäft-nahen Bereiche laut Rechtekonzept. */
const RECEPTION_TILES: Tile[] = [
  {
    path: '/zimmer/aushang', icon: QrCode, title: 'QR-Aushänge',
    description: 'Zimmer-Aushänge mit QR-Code zum Drucken',
  },
  {
    path: '/personal', icon: Users, title: 'Personal-Karten',
    description: 'QR-Login-Karten der Reinigungskräfte ansehen und drucken',
  },
  {
    path: '/einstellungen/passwort', icon: KeyRound, title: 'Passwort',
    description: 'Eigenes Anmelde-Passwort ändern',
  },
]

export default async function EinstellungenHubPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const ctx = await getManagementContext(slug)
  if (!ctx) redirect('/admin')

  // Manager hat im Haus dieselben Rechte wie der Inhaber — nur die
  // Rezeption bekommt den verkürzten Hub.
  const base = `/h/${ctx.hotelSlug}/admin`
  const tiles = ctx.role !== 'reception' ? ADMIN_TILES : RECEPTION_TILES

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <h1 className="text-xl font-black text-ink">Einstellungen</h1>

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
                {t.title}
              </span>
              <span className="block truncate text-xs text-ink-muted">{t.description}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
          </Link>
        ))}
      </div>
    </div>
  )
}
