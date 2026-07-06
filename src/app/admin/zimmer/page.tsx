import Link from 'next/link'
import { QrCode } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import RoomSetup, { type SetupRoom } from './RoomSetup'

export default async function RoomSetupPage() {
  const supabase = await createClient()

  const [{ data: rooms }, { data: stays }] = await Promise.all([
    supabase.from('rooms').select('id, number, floor, building').order('number'),
    supabase.from('stays').select('room_id').is('checked_out_at', null),
  ])

  const occupiedRooms = new Set((stays ?? []).map(s => s.room_id))

  const setupRooms: SetupRoom[] = (rooms ?? []).map(r => ({
    id: r.id,
    number: r.number,
    floor: r.floor,
    building: r.building,
    occupied: occupiedRooms.has(r.id),
  }))

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-black text-ink">Zimmer verwalten</h1>
        <Link
          href="/admin/zimmer/aushang"
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink"
        >
          <QrCode className="h-4 w-4" /> QR-Aushänge
        </Link>
      </div>
      <RoomSetup rooms={setupRooms} />
    </div>
  )
}
