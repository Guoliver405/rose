import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import {
  clampStaleMinutes, isCleaningFresh, isStayoverDue, parseStayoverPolicy, todayStartIso,
} from '@/lib/board'
import RoomGrid, { type FloorGroup, type RoomTileData } from './RoomGrid'

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  const [{ data: rooms }, { data: states }, { data: stays }, { data: hotel }, { data: cleanedToday }] = await Promise.all([
    supabase.from('rooms').select('id, number, floor, building').order('number'),
    supabase.from('room_states').select('room_id, guest_signal, checkout_pending, priority, cleaning_by, cleaning_started_at'),
    supabase.from('stays').select('id, room_id, pin, checked_in_at').is('checked_out_at', null),
    supabase.from('hotels').select('policies').limit(1).maybeSingle(),
    supabase.from('staff_log').select('room_id').eq('kind', 'clean_done').gte('at', todayStartIso()),
  ])

  const policies = (hotel?.policies ?? {}) as Record<string, unknown>
  const staleMinutes = clampStaleMinutes(policies.cleaningStaleMinutes)
  const stayoverPolicy = parseStayoverPolicy(policies)
  const cleanedRoomsToday = new Set((cleanedToday ?? []).map(c => c.room_id))
  const now = new Date()

  const stateByRoom = new Map((states ?? []).map(s => [s.room_id, s]))
  const stayByRoom = new Map((stays ?? []).map(s => [s.room_id, s]))

  const tiles: RoomTileData[] = (rooms ?? []).map(r => {
    const state = stateByRoom.get(r.id)
    const stay = stayByRoom.get(r.id)
    const guestSignal = (state?.guest_signal ?? 'none') as RoomTileData['guestSignal']
    return {
      id: r.id,
      number: r.number,
      floor: r.floor,
      building: r.building,
      occupied: Boolean(stay),
      pin: stay?.pin ?? null,
      checkedInAt: stay?.checked_in_at ?? null,
      guestSignal,
      checkoutPending: state?.checkout_pending ?? false,
      priority: state?.priority ?? false,
      // Stale-Timeout (vergessener Abschluss) zählt nicht mehr als „in Arbeit"
      cleaningActive: state ? isCleaningFresh(state, staleMinutes, now) : false,
      stayoverDue: isStayoverDue({
        policy: stayoverPolicy,
        occupied: Boolean(stay),
        checkedInAt: stay?.checked_in_at ?? null,
        guestSignal,
        cleanedToday: cleanedRoomsToday.has(r.id),
        now,
      }),
    }
  })

  // Gruppierung: Gebäude (alphabetisch, ohne zuerst) → Etage absteigend
  const groups = new Map<string, FloorGroup>()
  for (const t of tiles) {
    const key = `${t.building ?? ''}#${t.floor}`
    if (!groups.has(key)) {
      groups.set(key, { building: t.building, floor: t.floor, rooms: [] })
    }
    groups.get(key)!.rooms.push(t)
  }
  const floorGroups = [...groups.values()].sort((a, b) => {
    const ba = a.building ?? ''
    const bb = b.building ?? ''
    if (ba !== bb) return ba.localeCompare(bb, 'de')
    return b.floor - a.floor
  })
  for (const g of floorGroups) {
    g.rooms.sort((a, b) => a.number.localeCompare(b.number, 'de', { numeric: true }))
  }

  // KPIs
  const total = tiles.length
  const occupied = tiles.filter(t => t.occupied).length
  const toClean = tiles.filter(t => t.checkoutPending || t.priority || t.guestSignal === 'please_clean' || t.stayoverDue).length
  const dnd = tiles.filter(t => t.guestSignal === 'dnd').length
  const inProgress = tiles.filter(t => t.cleaningActive).length

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-black text-ink">Zimmer-Übersicht</h1>
        <div className="ml-auto flex flex-wrap gap-2 text-sm">
          <Kpi label="Zimmer" value={total} />
          <Kpi label="belegt" value={occupied} tone={occupied > 0 ? 'fresh' : undefined} />
          <Kpi label="frei" value={total - occupied} />
          <Kpi label="zu reinigen" value={toClean} tone={toClean > 0 ? 'attention' : 'positive'} />
          <Kpi label="DND" value={dnd} tone={dnd > 0 ? 'blocked' : undefined} />
          <Kpi label="in Arbeit" value={inProgress} tone={inProgress > 0 ? 'positive' : undefined} />
        </div>
      </div>

      {total === 0 ? (
        <div className="rounded-xl border border-edge bg-surface p-8 text-center">
          <p className="font-semibold text-ink">Noch keine Zimmer angelegt.</p>
          <p className="mt-1 text-sm text-ink-muted">
            Lege unter{' '}
            <Link href="/admin/zimmer" className="font-semibold text-action underline">
              Zimmer
            </Link>{' '}
            die Zimmer deines Hauses an — Nummer, Etage, optional Gebäudeteil.
          </p>
        </div>
      ) : (
        <RoomGrid floorGroups={floorGroups} />
      )}
    </div>
  )
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: 'fresh' | 'attention' | 'blocked' | 'positive' }) {
  const toneClass =
    tone === 'fresh' ? 'text-fresh-deep bg-fresh-pill' :
    tone === 'attention' ? 'text-attention-deepest bg-attention-pill' :
    tone === 'blocked' ? 'text-blocked-deepest bg-blocked-pill' :
    tone === 'positive' ? 'text-positive-deepest bg-positive-pill' :
    'text-ink-soft bg-surface-muted'
  return (
    <span className={`rounded-full px-3 py-1 font-semibold ${toneClass}`}>
      {value} {label}
    </span>
  )
}
