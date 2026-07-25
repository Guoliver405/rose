import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BedDouble, ChevronRight, ConciergeBell, FlaskConical, KeyRound, QrCode,
  SlidersHorizontal, Users, type LucideIcon,
} from 'lucide-react'
import { getManagementContext } from '@/utils/auth'

type Tile = {
  href: string
  icon: LucideIcon
  title: string
  description: string
  /** Temporäre Bereiche (Test-Szenario) amber markieren. */
  temporary?: boolean
}

const ADMIN_TILES: Tile[] = [
  {
    href: '/admin/einstellungen/hotel', icon: SlidersHorizontal, title: 'Hotel & Regeln',
    description: 'Hotelname, Gast-PIN-Länge, Reinigungs-Timeout, Routine-Reinigung',
  },
  {
    href: '/admin/zimmer', icon: BedDouble, title: 'Zimmer',
    description: 'Zimmer anlegen und verwalten — Nummern, Etagen, Gebäudeteile',
  },
  {
    href: '/admin/personal', icon: Users, title: 'Personal',
    description: 'Reinigungskräfte und Rezeptions-Zugänge, QR-Login-Karten',
  },
  {
    href: '/admin/services', icon: ConciergeBell, title: 'Services',
    description: 'Service-Baukasten für Gast-Bestellungen',
  },
  {
    href: '/admin/zimmer/aushang', icon: QrCode, title: 'QR-Aushänge',
    description: 'Zimmer-Aushänge mit QR-Code zum Drucken',
  },
  {
    href: '/admin/einstellungen/passwort', icon: KeyRound, title: 'Passwort',
    description: 'Eigenes Anmelde-Passwort ändern',
  },
  {
    href: '/admin/einstellungen/test', icon: FlaskConical, title: 'Test-Szenario',
    description: 'Vorübergehend: fingierte Belegungs- und Reinigungslage zum Testen',
    temporary: true,
  },
]

/** Rezeption: nur die Tagesgeschäft-nahen Bereiche laut Rechtekonzept. */
const RECEPTION_TILES: Tile[] = [
  {
    href: '/admin/zimmer/aushang', icon: QrCode, title: 'QR-Aushänge',
    description: 'Zimmer-Aushänge mit QR-Code zum Drucken',
  },
  {
    href: '/admin/personal', icon: Users, title: 'Personal-Karten',
    description: 'QR-Login-Karten der Reinigungskräfte ansehen und drucken',
  },
  {
    href: '/admin/einstellungen/passwort', icon: KeyRound, title: 'Passwort',
    description: 'Eigenes Anmelde-Passwort ändern',
  },
]

export default async function EinstellungenHubPage() {
  const ctx = await getManagementContext()
  if (!ctx) redirect('/login')

  const tiles = ctx.role === 'admin' ? ADMIN_TILES : RECEPTION_TILES

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <h1 className="text-xl font-black text-ink">Einstellungen</h1>

      <div className="flex flex-col gap-2">
        {tiles.map(t => (
          <Link
            key={t.href}
            href={t.href}
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
