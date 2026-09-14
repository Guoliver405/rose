import {
  Ban, BedDouble, Clock, ConciergeBell, DoorOpen, Flag, Loader2, Luggage, PowerOff, RefreshCw,
  Sparkles, type LucideIcon,
} from 'lucide-react'
import { ROOM_SYMBOLS, type RoomSymbolId } from '@/lib/room-symbols'

/**
 * Das Kachel-Symbol — Icon plus Farbe aus `room-symbols.ts`.
 *
 * Beide Boards und die Legende der Hilfe zeichnen hierüber. Das `Record` über
 * alle IDs ist der Vollständigkeits-Check: Wer in `room-symbols.ts` ein Symbol
 * ergänzt, muss hier ein Icon nennen, sonst kompiliert es nicht.
 */
const ICONS: Record<RoomSymbolId, LucideIcon> = {
  deactivated: PowerOff,
  occupied: BedDouble,
  departure: Luggage,
  dnd: Ban,
  clean: Sparkles,
  deferred: Clock,
  routine: RefreshCw,
  checkout: DoorOpen,
  priority: Flag,
  cleaning: Loader2,
  orders: ConciergeBell,
  urgent: ConciergeBell,
}

/** Rezeption 14 px, Reinigungsboard 16 px, Legende 20 px. */
const SIZE = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' } as const

export default function RoomSymbol({
  id, size = 'sm', 'aria-label': ariaLabel,
}: {
  id: RoomSymbolId
  size?: keyof typeof SIZE
  'aria-label'?: string
}) {
  const symbol = ROOM_SYMBOLS[id]
  const Icon = ICONS[id]
  return (
    <Icon
      className={`${SIZE[size]} ${symbol.className}${symbol.spin ? ' animate-spin' : ''}`}
      aria-label={ariaLabel}
    />
  )
}
