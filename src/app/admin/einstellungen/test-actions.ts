'use server'

// ─────────────────────────────────────────────────────────────────────────────
// VORÜBERGEHEND — Test-Szenario-Seeding für den Testplan-Walkthrough.
// Erzeugt mit wenigen Angaben eine praxisnahe Belegungs-/Reinigungslage über
// die ganz normalen Tabellen (stays, room_states, service_orders), damit
// Realtime, Audit-Trigger und Board-Ableitung exakt wie im Betrieb reagieren.
// Rückbau: diese Datei + TestScenarioPanel.tsx löschen, Einbindung in
// einstellungen/page.tsx entfernen.
// ─────────────────────────────────────────────────────────────────────────────

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/utils/supabase/service'
import { getAdminContext } from '@/utils/auth'
import { generatePin, generateToken, clampPinLength } from '@/lib/ids'

export type SeedInput = {
  occupied: number
  pleaseClean: number
  dnd: number
  checkedOut: number
  priority: number
  orders: number
}

export type SeedSummary = {
  stays: { room: string; pin: string; sinceYesterday: boolean; signal: 'none' | 'please_clean' | 'dnd' }[]
  checkedOut: string[]
  priority: string[]
  orders: number
  notes: string[]
}

function auditFields(userId: string) {
  return {
    last_updated_at: new Date().toISOString(),
    last_update_source: 'admin',
    last_updated_by: userId,
  }
}

/** Nicht-negative Ganzzahl, geclampt auf [0, max]. */
function toCount(value: number, max: number): number {
  const n = Math.floor(Number(value))
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(max, n)
}

/**
 * Räumt die komplette Testlage des Hotels ab: alle aktiven Stays auschecken
 * (ohne checkout_pending zu setzen!), alle room_states neutralisieren,
 * offene Bestellungen löschen. Erledigte Bestellungen + staff_log bleiben.
 */
async function resetScenario(admin: SupabaseClient, hotelId: string, userId: string) {
  await admin
    .from('stays')
    .update({ checked_out_at: new Date().toISOString() })
    .eq('hotel_id', hotelId)
    .is('checked_out_at', null)

  await admin
    .from('room_states')
    .update({
      guest_signal: 'none',
      checkout_pending: false,
      priority: false,
      cleaning_by: null,
      cleaning_started_at: null,
      ...auditFields(userId),
    })
    .eq('hotel_id', hotelId)

  await admin
    .from('service_orders')
    .delete()
    .eq('hotel_id', hotelId)
    .eq('status', 'open')
}

/** Nur aufräumen — deckt das „Testreste beseitigen" aus dem Testplan ab. */
export async function resetTestScenarioAction(): Promise<{ error?: string }> {
  const ctx = await getAdminContext()
  if (!ctx) return { error: 'Keine Berechtigung.' }

  await resetScenario(createAdminClient(), ctx.hotelId, ctx.userId)

  revalidatePath('/admin', 'layout')
  revalidatePath('/service')
  return {}
}

/**
 * Setzt zuerst alles zurück und baut dann deterministisch ein Szenario auf.
 * Die Zustände werden reihum über die Etagen gestreut, damit sich die
 * Etagenscores auf dem Reinigungsboard sichtbar unterscheiden.
 */
export async function seedTestScenarioAction(
  input: SeedInput,
): Promise<{ summary?: SeedSummary; error?: string }> {
  const ctx = await getAdminContext()
  if (!ctx) return { error: 'Keine Berechtigung.' }
  const admin = createAdminClient()
  const notes: string[] = []

  const { data: roomRows } = await admin
    .from('rooms')
    .select('id, number, floor, sort_order')
    .eq('hotel_id', ctx.hotelId)
    .order('floor')
    .order('sort_order')
    .order('number')
  if (!roomRows || roomRows.length === 0) return { error: 'Keine Zimmer angelegt.' }

  await resetScenario(admin, ctx.hotelId, ctx.userId)

  // Reihum über die Etagen verteilen statt Etage für Etage abzufüllen.
  const byFloor = new Map<number, typeof roomRows>()
  for (const r of roomRows) {
    const list = byFloor.get(r.floor) ?? []
    list.push(r)
    byFloor.set(r.floor, list)
  }
  const floors = [...byFloor.values()]
  const interleaved: typeof roomRows = []
  for (let i = 0; interleaved.length < roomRows.length; i++) {
    for (const floorRooms of floors) if (i < floorRooms.length) interleaved.push(floorRooms[i])
  }

  const checkedOutCount = toCount(input.checkedOut, roomRows.length)
  const occupiedCount = toCount(input.occupied, roomRows.length - checkedOutCount)
  const pleaseCleanCount = toCount(input.pleaseClean, occupiedCount)
  const dndCount = toCount(input.dnd, occupiedCount - pleaseCleanCount)
  const ordersCount = toCount(input.orders, occupiedCount)
  if (toCount(input.checkedOut, 999) + toCount(input.occupied, 999) > roomRows.length) {
    notes.push(`Mehr Zimmer angefragt als vorhanden (${roomRows.length}) — Zahlen wurden gekappt.`)
  }

  const checkedOutRooms = interleaved.slice(0, checkedOutCount)
  const occupiedRooms = interleaved.slice(checkedOutCount, checkedOutCount + occupiedCount)
  const freeRooms = interleaved.slice(checkedOutCount + occupiedCount)

  // Gast-Signale: erst die Reinigungswünsche, dann die DNDs.
  const signalByRoom = new Map<string, 'none' | 'please_clean' | 'dnd'>()
  occupiedRooms.forEach((r, i) => {
    signalByRoom.set(r.id, i < pleaseCleanCount ? 'please_clean' : i < pleaseCleanCount + dndCount ? 'dnd' : 'none')
  })

  // Priorität: bevorzugt ausgecheckte Zimmer (typischer Rezeptions-Eingriff),
  // dann belegte ohne DND, zuletzt freie.
  const priorityPool = [
    ...checkedOutRooms,
    ...occupiedRooms.filter(r => signalByRoom.get(r.id) !== 'dnd'),
    ...freeRooms,
  ]
  const priorityRooms = priorityPool.slice(0, toCount(input.priority, priorityPool.length))
  const prioritySet = new Set(priorityRooms.map(r => r.id))

  // PINs: kollisionsfrei zu aktiven Aufenthalten auf Zimmern gleicher Nummer
  // (Nummern sind nur je Gebäudeteil eindeutig) und untereinander eindeutig.
  const takenPins = new Set<string>()
  if (occupiedRooms.length > 0) {
    const { data: sameNumberRooms } = await admin
      .from('rooms')
      .select('id')
      .in('number', occupiedRooms.map(r => r.number))
    const foreignIds = (sameNumberRooms ?? [])
      .map(r => r.id)
      .filter(id => !occupiedRooms.some(o => o.id === id))
    if (foreignIds.length > 0) {
      const { data: siblingStays } = await admin
        .from('stays').select('pin').in('room_id', foreignIds).is('checked_out_at', null)
      for (const s of siblingStays ?? []) takenPins.add(s.pin)
    }
  }

  const { data: hotel } = await admin.from('hotels').select('policies').eq('id', ctx.hotelId).single()
  const pinLength = clampPinLength((hotel?.policies as { pinLength?: number } | null)?.pinLength)

  // Jeder zweite Aufenthalt ist "seit gestern" da — so lässt sich auch die
  // Stayover-Routine (ab der zweiten Nacht) direkt mittesten. checked_in_at
  // immer explizit setzen: supabase-js füllt beim Bulk-Insert fehlende
  // Spalten mit NULL auf, der DB-Default greift dann nicht.
  const yesterday = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()
  const stayRows = occupiedRooms.map((r, i) => {
    let pin = generatePin(pinLength)
    for (let tries = 0; tries < 50 && takenPins.has(pin); tries++) pin = generatePin(pinLength)
    takenPins.add(pin)
    return {
      hotel_id: ctx.hotelId,
      room_id: r.id,
      pin,
      session_token: generateToken(24),
      created_by: ctx.userId,
      checked_in_at: i % 2 === 0 ? yesterday : new Date().toISOString(),
    }
  })

  let insertedStays: { id: string; room_id: string }[] = []
  if (stayRows.length > 0) {
    const { data, error } = await admin.from('stays').insert(stayRows).select('id, room_id')
    if (error) return { error: `Stays anlegen fehlgeschlagen: ${error.message}` }
    insertedStays = data ?? []
  }

  // room_states: gleiche Ziel-Kombination in einem Update bündeln.
  const targetByRoom = new Map<string, { guest_signal: string; checkout_pending: boolean; priority: boolean }>()
  for (const r of checkedOutRooms) {
    targetByRoom.set(r.id, { guest_signal: 'none', checkout_pending: true, priority: prioritySet.has(r.id) })
  }
  for (const r of occupiedRooms) {
    const signal = signalByRoom.get(r.id) ?? 'none'
    if (signal !== 'none' || prioritySet.has(r.id)) {
      targetByRoom.set(r.id, { guest_signal: signal, checkout_pending: false, priority: prioritySet.has(r.id) })
    }
  }
  for (const r of freeRooms) {
    if (prioritySet.has(r.id)) {
      targetByRoom.set(r.id, { guest_signal: 'none', checkout_pending: false, priority: true })
    }
  }
  const groups = new Map<string, { target: { guest_signal: string; checkout_pending: boolean; priority: boolean }; ids: string[] }>()
  for (const [roomId, target] of targetByRoom) {
    const key = `${target.guest_signal}|${target.checkout_pending}|${target.priority}`
    const group = groups.get(key) ?? { target, ids: [] }
    group.ids.push(roomId)
    groups.set(key, group)
  }
  for (const { target, ids } of groups.values()) {
    const { error } = await admin
      .from('room_states')
      .update({ ...target, ...auditFields(ctx.userId) })
      .in('room_id', ids)
      .eq('hotel_id', ctx.hotelId)
    if (error) return { error: `Zimmerstatus setzen fehlgeschlagen: ${error.message}` }
  }

  // Bestellungen: erster aktiver Service mit seinen Optionen als Vorlage.
  let placedOrders = 0
  if (ordersCount > 0) {
    const { data: service } = await admin
      .from('service_definitions')
      .select('id')
      .eq('hotel_id', ctx.hotelId)
      .is('archived_at', null)
      .order('sort_order')
      .limit(1)
      .maybeSingle()
    if (!service) {
      notes.push('Keine Services definiert — Bestellungen übersprungen.')
    } else {
      const { data: items } = await admin
        .from('service_items')
        .select('label, price_cents')
        .eq('service_id', service.id)
        .is('archived_at', null)
        .order('sort_order')
        .limit(2)
      const stayByRoom = new Map(insertedStays.map(s => [s.room_id, s.id]))
      const orderRows = occupiedRooms.slice(0, ordersCount).map(r => ({
        hotel_id: ctx.hotelId,
        room_id: r.id,
        stay_id: stayByRoom.get(r.id) ?? null,
        service_id: service.id,
        items_snapshot: (items ?? []).map(i => ({ label: i.label, price_cents: i.price_cents })),
        note: 'Testbestellung (Szenario-Seed)',
      }))
      const { error } = await admin.from('service_orders').insert(orderRows)
      if (error) notes.push(`Bestellungen fehlgeschlagen: ${error.message}`)
      else placedOrders = orderRows.length
    }
  }

  revalidatePath('/admin', 'layout')
  revalidatePath('/service')

  return {
    summary: {
      stays: occupiedRooms.map((r, i) => ({
        room: r.number,
        pin: stayRows[i].pin,
        sinceYesterday: i % 2 === 0,
        signal: signalByRoom.get(r.id) ?? 'none',
      })),
      checkedOut: checkedOutRooms.map(r => r.number),
      priority: priorityRooms.map(r => r.number),
      orders: placedOrders,
      notes,
    },
  }
}
