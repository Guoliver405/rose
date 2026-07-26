'use server'

// ─────────────────────────────────────────────────────────────────────────────
// VORÜBERGEHEND — Test-Szenario-Seeding für den Testplan-Walkthrough.
// Erzeugt aus Prozent-Angaben + Zufalls-Seed eine praxisnahe Belegungs-/
// Reinigungslage über die ganz normalen Tabellen (stays, room_states,
// service_orders), damit Realtime, Audit-Trigger und Board-Ableitung exakt
// wie im Betrieb reagieren. Gleicher Seed ⇒ identische Verteilung.
// Rückbau: diese Datei + TestScenarioPanel.tsx löschen, Einbindung in
// einstellungen/page.tsx entfernen.
// ─────────────────────────────────────────────────────────────────────────────

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/utils/supabase/service'
import { getAdminContext } from '@/utils/auth'
import { generatePin, generateToken, clampPinLength } from '@/lib/ids'

export type SeedInput = {
  seed: number
  /** Anteil belegter Zimmer an allen Zimmern (0–100). */
  occupiedPct: number
  /** Anteil der belegten Zimmer mit Reinigungswunsch (0–100). */
  pleaseCleanPct: number
  /** Anteil der belegten Zimmer mit DND (0–100). */
  dndPct: number
  /** Anteil der FREIEN Zimmer, die ausgecheckt & ungereinigt sind (0–100). */
  checkedOutPct: number
  /** Absolut, über alle Zimmer. */
  priority: number
  /** Absolut, auf belegte Zimmer verteilt. */
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

/** Deterministischer PRNG (mulberry32) — gleicher Seed, gleiche Verteilung. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher-Yates auf einer Kopie. */
function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function clampPct(value: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, n))
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
export async function resetTestScenarioAction(slug: string): Promise<{ error?: string }> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }

  await resetScenario(createAdminClient(), ctx.hotelId, ctx.userId)

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  revalidatePath(`/h/${ctx.hotelSlug}/service`)
  return {}
}

/**
 * Setzt zuerst alles zurück und baut dann eine seed-randomisierte Lage auf:
 * die Zimmer werden deterministisch gemischt, die Prozent-Angaben in
 * absolute Zahlen gerundet und auf die gemischte Reihenfolge verteilt.
 */
export async function seedTestScenarioAction(
  slug: string,
  input: SeedInput,
): Promise<{ summary?: SeedSummary; error?: string }> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }
  const admin = createAdminClient()
  const notes: string[] = []
  const rng = mulberry32(Math.floor(Number(input.seed)) || 1)

  const { data: roomRows } = await admin
    .from('rooms')
    .select('id, number, floor')
    .eq('hotel_id', ctx.hotelId)
    .order('floor')
    .order('number')
  if (!roomRows || roomRows.length === 0) return { error: 'Keine Zimmer angelegt.' }

  await resetScenario(admin, ctx.hotelId, ctx.userId)

  const shuffled = shuffle(roomRows, rng)

  // Prozent → absolute Zahlen (gerundet), Bezugsgrößen wie in der UI:
  // belegt bezieht sich auf alle Zimmer, Signale auf die belegten,
  // ausgecheckt auf die freien.
  const occupiedCount = Math.round(roomRows.length * clampPct(input.occupiedPct) / 100)
  const freeCount = roomRows.length - occupiedCount
  const checkedOutCount = Math.round(freeCount * clampPct(input.checkedOutPct) / 100)
  const pleaseCleanCount = Math.round(occupiedCount * clampPct(input.pleaseCleanPct) / 100)
  const dndCount = Math.min(
    Math.round(occupiedCount * clampPct(input.dndPct) / 100),
    occupiedCount - pleaseCleanCount,
  )
  const ordersCount = toCount(input.orders, occupiedCount)
  if (toCount(input.orders, 999) > occupiedCount) {
    notes.push(`Nur ${occupiedCount} belegte Zimmer — Bestellungen auf ${ordersCount} gekappt.`)
  }

  const occupiedRooms = shuffled.slice(0, occupiedCount)
  const checkedOutRooms = shuffled.slice(occupiedCount, occupiedCount + checkedOutCount)

  // Signale auf die (bereits zufällig geordneten) belegten Zimmer verteilen.
  const signalByRoom = new Map<string, 'none' | 'please_clean' | 'dnd'>()
  occupiedRooms.forEach((r, i) => {
    signalByRoom.set(r.id, i < pleaseCleanCount ? 'please_clean' : i < pleaseCleanCount + dndCount ? 'dnd' : 'none')
  })

  // Priorität: absolut, zufällig über ALLE Zimmer (eigene Mischung, damit
  // die Auswahl nicht mit der Belegungs-Zuteilung korreliert).
  const priorityRooms = shuffle(roomRows, rng).slice(0, toCount(input.priority, roomRows.length))
  const prioritySet = new Set(priorityRooms.map(r => r.id))

  // PINs: kollisionsfrei zu aktiven Aufenthalten auf Zimmern gleicher Nummer
  // (Nummern sind nur je Gebäudeteil eindeutig) und untereinander eindeutig.
  const takenPins = new Set<string>()
  if (occupiedRooms.length > 0) {
    const { data: sameNumberRooms } = await admin
      .from('rooms')
      .select('id')
      .eq('hotel_id', ctx.hotelId)
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

  // Rund die Hälfte der Aufenthalte ist "seit gestern" da — so lässt sich
  // die Stayover-Routine (ab der zweiten Nacht) direkt mittesten.
  // checked_in_at immer explizit setzen: supabase-js füllt beim Bulk-Insert
  // fehlende Spalten mit NULL auf, der DB-Default greift dann nicht.
  const yesterday = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()
  const sinceYesterdayByRoom = new Map(occupiedRooms.map(r => [r.id, rng() < 0.5]))
  const stayRows = occupiedRooms.map(r => {
    let pin = generatePin(pinLength)
    for (let tries = 0; tries < 50 && takenPins.has(pin); tries++) pin = generatePin(pinLength)
    takenPins.add(pin)
    return {
      hotel_id: ctx.hotelId,
      room_id: r.id,
      pin,
      session_token: generateToken(24),
      created_by: ctx.userId,
      checked_in_at: sinceYesterdayByRoom.get(r.id) ? yesterday : new Date().toISOString(),
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
  for (const r of priorityRooms) {
    if (!targetByRoom.has(r.id)) {
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

  // Bestellungen: erster aktiver Service mit seinen Optionen als Vorlage,
  // verteilt auf die ersten N der (zufällig geordneten) belegten Zimmer.
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

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  revalidatePath(`/h/${ctx.hotelSlug}/service`)

  const numberByRoom = new Map(roomRows.map(r => [r.id, r.number]))
  return {
    summary: {
      stays: occupiedRooms
        .map((r, i) => ({
          room: r.number,
          pin: stayRows[i].pin,
          sinceYesterday: sinceYesterdayByRoom.get(r.id) ?? false,
          signal: signalByRoom.get(r.id) ?? 'none' as const,
        }))
        .sort((a, b) => a.room.localeCompare(b.room, undefined, { numeric: true })),
      checkedOut: checkedOutRooms.map(r => r.number).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
      priority: priorityRooms.map(r => numberByRoom.get(r.id) ?? '?').sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
      orders: placedOrders,
      notes,
    },
  }
}
