import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import {
  clampStaleMinutes, isCleaningFresh, isStayoverDue, parseStayoverPolicy, todayStartIso,
} from '@/lib/board'
import RoomGrid, { type FloorGroup, type RoomTileData } from './RoomGrid'

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  const [{ data: rooms }, { data: states }, { data: stays }, { data: hotel }, { data: cleanedToday }, { data: openOrders }] = await Promise.all([
    supabase.from('rooms').select('id, number, floor, building').order('number'),
    supabase.from('room_states').select('room_id, guest_signal, checkout_pending, priority, cleaning_by, cleaning_started_at'),
    supabase.from('stays').select('id, room_id, pin, checked_in_at').is('checked_out_at', null),
    supabase.from('hotels').select('policies').limit(1).maybeSingle(),
    supabase.from('staff_log').select('room_id').eq('kind', 'clean_done').gte('at', todayStartIso()),
    supabase.from('service_orders').select('room_id, service_definitions(urgent)').eq('status', 'open'),
  ])

  const policies = (hotel?.policies ?? {}) as Record<string, unknown>
  const staleMinutes = clampStaleMinutes(policies.cleaningStaleMinutes)
  const stayoverPolicy = parseStayoverPolicy(policies)
  const cleanedRoomsToday = new Set((cleanedToday ?? []).map(c => c.room_id))
  const now = new Date()

  const stateByRoom = new Map((states ?? []).map(s => [s.room_id, s]))
  const stayByRoom = new Map((stays ?? []).map(s => [s.room_id, s]))

  // Offene Service-Anfragen je Zimmer (dringend, wenn mindestens eine
  // auf einem als dringend markierten Service basiert). Der FK-Join kommt
  // je nach Supabase-Version als Objekt oder Array zurück.
  const ordersByRoom = new Map<string, { count: number; urgent: boolean }>()
  for (const o of openOrders ?? []) {
    const def = Array.isArray(o.service_definitions) ? o.service_definitions[0] : o.service_definitions
    const entry = ordersByRoom.get(o.room_id) ?? { count: 0, urgent: false }
    entry.count++
    if (def?.urgent) entry.urgent = true
    ordersByRoom.set(o.room_id, entry)
  }

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
      openOrders: ordersByRoom.get(r.id)?.count ?? 0,
      urgentOrders: ordersByRoom.get(r.id)?.urgent ?? false,
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

  // KPIs — „bereit" = frei & gereinigt (freie ungereinigte Zimmer sind
  // zwangsläufig checkout_pending oder priorisiert und stecken in „zu reinigen").
  const total = tiles.length
  const occupied = tiles.filter(t => t.occupied).length
  const ready = tiles.filter(t => !t.occupied && !t.checkoutPending && !t.priority && !t.cleaningActive).length
  const toClean = tiles.filter(t => t.checkoutPending || t.priority || t.guestSignal === 'please_clean' || t.stayoverDue).length
  const dnd = tiles.filter(t => t.guestSignal === 'dnd').length
  const inProgress = tiles.filter(t => t.cleaningActive).length

  return (
    <div className="flex flex-col gap-5">
      {/* Sticky unterhalb des App-Headers (dessen Höhe = top-Offset, im
          Browser nachgemessen); -mx/-mt + Padding, damit der Hintergrund
          beim Scrollen die Kacheln sauber abdeckt. */}
      <div className="sticky top-[57px] z-30 -mx-4 -mt-4 bg-surface-sunken px-4 pb-2 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-black text-ink">Zimmer-Übersicht</h1>
          <div className="ml-auto flex flex-wrap gap-2 text-sm">
            <Kpi label="Zimmer" value={total} />
            <Kpi label="belegt" value={occupied} tone={occupied > 0 ? 'fresh' : undefined} />
            <Kpi label="bereit" value={ready} tone={ready > 0 ? 'positive' : undefined} />
            <Kpi label="zu reinigen" value={toClean} tone={toClean > 0 ? 'attention' : 'positive'} />
            <Kpi label="DND" value={dnd} tone={dnd > 0 ? 'blocked' : undefined} />
            <Kpi label="in Arbeit" value={inProgress} tone={inProgress > 0 ? 'positive' : undefined} />
          </div>
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
