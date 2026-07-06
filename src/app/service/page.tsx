import { redirect } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { getMaidContext } from '@/utils/maid-auth'
import { createAdminClient } from '@/utils/supabase/service'
import { deriveShiftState } from '@/lib/shift'
import { clampStaleMinutes, isCleaningFresh, isRoomActive, roomScore } from '@/lib/board'
import RealtimeListener from '@/components/RealtimeListener'
import { maidLogoutAction } from './login/actions'
import ServiceBoard, { type BoardFloor, type BoardRoom } from './ServiceBoard'

export default async function ServiceBoardPage() {
  const ctx = await getMaidContext()
  if (!ctx) redirect('/service/login')

  // Board-Daten über den Admin-Client: die Maid-RLS sieht fremde profiles
  // nicht („Kollegin in Zimmer X" braucht aber deren Namen) und stays gar
  // nicht. Auth ist über getMaidContext() bereits geprüft.
  const admin = createAdminClient()
  const [{ data: rooms }, { data: states }, { data: stays }, { data: maids }, { data: myLog }] =
    await Promise.all([
      admin.from('rooms').select('id, number, floor, building').eq('hotel_id', ctx.hotelId),
      admin
        .from('room_states')
        .select('room_id, guest_signal, checkout_pending, priority, cleaning_by, cleaning_started_at')
        .eq('hotel_id', ctx.hotelId),
      admin.from('stays').select('room_id').eq('hotel_id', ctx.hotelId).is('checked_out_at', null),
      admin.from('profiles').select('id, display_name').eq('hotel_id', ctx.hotelId),
      admin
        .from('staff_log')
        .select('kind, at')
        .eq('profile_id', ctx.profileId)
        .in('kind', ['shift_start', 'shift_end', 'break_start', 'break_end'])
        .order('at', { ascending: false })
        .limit(50),
    ])

  const staleMinutes = clampStaleMinutes(ctx.policies.cleaningStaleMinutes)
  const now = new Date()
  const shift = deriveShiftState(myLog ?? [])

  const stateByRoom = new Map((states ?? []).map(s => [s.room_id, s]))
  const occupiedRooms = new Set((stays ?? []).map(s => s.room_id))
  const nameByProfile = new Map((maids ?? []).map(p => [p.id, p.display_name]))

  const myCleaningRoomId =
    (states ?? []).find(
      s => s.cleaning_by === ctx.profileId && isCleaningFresh(s, staleMinutes, now),
    )?.room_id ?? null

  const boardRooms: BoardRoom[] = (rooms ?? []).map(r => {
    const state = stateByRoom.get(r.id)
    const signal = (state?.guest_signal ?? 'none') as BoardRoom['guestSignal']
    const checkoutPending = state?.checkout_pending ?? false
    const priority = state?.priority ?? false
    const stateLike = { guest_signal: signal, checkout_pending: checkoutPending, priority }

    // Stale-Timeout: vergessene Abschlüsse gelten als offen (Ableitung im
    // Loader — kein Cron). Die stale Besitzerin wird trotzdem angezeigt.
    const cleaningFresh = state
      ? isCleaningFresh(state, staleMinutes, now)
      : false
    const cleaningStale = Boolean(state?.cleaning_by) && !cleaningFresh

    return {
      id: r.id,
      number: r.number,
      floor: r.floor,
      building: r.building,
      occupied: occupiedRooms.has(r.id),
      guestSignal: signal,
      checkoutPending,
      priority,
      active: isRoomActive(stateLike),
      score: roomScore(stateLike),
      cleaningByName: state?.cleaning_by
        ? (nameByProfile.get(state.cleaning_by) ?? 'Kollegin')
        : null,
      cleaningByMe: state?.cleaning_by === ctx.profileId,
      cleaningFresh,
      cleaningStale,
    }
  })

  // Gruppierung Gebäude → Etage; Sortierung nach Etagenscore (Priorisierungshilfe).
  const groups = new Map<string, BoardFloor>()
  for (const room of boardRooms) {
    const key = `${room.building ?? ''}#${room.floor}`
    if (!groups.has(key)) {
      groups.set(key, { building: room.building, floor: room.floor, score: 0, rooms: [] })
    }
    const g = groups.get(key)!
    g.rooms.push(room)
    g.score += room.score
  }
  const floors = [...groups.values()].sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score
    const ba = a.building ?? ''
    const bb = b.building ?? ''
    if (ba !== bb) return ba.localeCompare(bb, 'de')
    return b.floor - a.floor
  })
  for (const f of floors) {
    f.rooms.sort((a, b) => a.number.localeCompare(b.number, 'de', { numeric: true }))
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-surface-sunken">
      <header className="sticky top-0 z-40 border-b border-edge bg-surface">
        <div className="mx-auto flex max-w-[1100px] items-center gap-4 px-4 py-3">
          <span className="text-lg font-black text-ink">
            Ro<span className="text-blocked">Se</span>
            <span className="ml-2 hidden text-sm font-semibold text-ink-muted sm:inline">
              Reinigungsboard · {ctx.hotelName}
            </span>
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm font-semibold text-ink-soft">{ctx.displayName}</span>
            <form action={maidLogoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink"
              >
                <LogOut className="h-4 w-4" />
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </header>

      <RealtimeListener token={ctx.accessToken} />

      <main className="mx-auto w-full max-w-[1100px] flex-1 p-4">
        <ServiceBoard
          floors={floors}
          shift={{
            onShift: shift.onShift,
            onBreak: shift.onBreak,
            shiftStartedAt: shift.shiftStartedAt,
          }}
          myCleaningRoomId={myCleaningRoomId}
        />
      </main>
    </div>
  )
}
