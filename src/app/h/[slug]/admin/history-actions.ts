'use server'

// ─────────────────────────────────────────────────────────────────────────────
// Zimmer-Verlauf für Arbeitsnachweis und Beschwerde-Aufklärung.
// Führt die vier Protokoll-Quellen zu EINER Zeitleiste zusammen:
//   room_state_transitions (Gast-Signale, Priorität — via DB-Trigger)
//   staff_log              (Reinigung gestartet/abgeschlossen/abgebrochen)
//   stays                  (Check-in / Check-out)
//   service_orders         (Anfrage gestellt / erledigt)
// Wird beim Öffnen des Zimmer-Dialogs nachgeladen (nicht im Board-Loader —
// das würde für jedes Zimmer Historie ziehen, die niemand ansieht).
// ─────────────────────────────────────────────────────────────────────────────

import { createAdminClient } from '@/utils/supabase/service'
import { getManagementContext } from '@/utils/auth'

const HISTORY_DAYS = 30
const MAX_EVENTS = 80

/** Farbfamilie des Zeitleisten-Punkts — bewusst getrennt von der Kachel-Sprache. */
export type EventTone = 'guest' | 'clean' | 'desk' | 'service'

export type RoomHistoryEvent = {
  at: string
  label: string
  /** „Gast", Klarname der Kraft, „Rezeption", … — nie eine Gast-Identität. */
  actor: string
  tone: EventTone
}

export type RoomHistoryResult = { events?: RoomHistoryEvent[]; error?: string }

/**
 * `checkout_pending`-Übergänge werden bewusst übersprungen: sie entstehen
 * ausschließlich zusammen mit einem Check-out (Setzen) oder einem
 * `clean_done` (Löschen) und wären damit immer eine Dopplung.
 */
function transitionLabel(field: string, oldValue: string | null, newValue: string | null): string | null {
  if (field === 'guest_signal') {
    if (newValue === 'please_clean') return 'Reinigung angefordert'
    if (newValue === 'dnd') return '„Nicht stören“ gesetzt'
    if (newValue === 'none') {
      return oldValue === 'dnd' ? '„Nicht stören“ aufgehoben' : 'Reinigungswunsch aufgehoben'
    }
    return null
  }
  if (field === 'priority') {
    return newValue === 'true' ? 'Reinigung priorisiert' : 'Priorisierung aufgehoben'
  }
  return null
}

const STITCH_LABEL: Record<string, string> = {
  clean_start: 'Reinigung gestartet',
  clean_done: 'Reinigung abgeschlossen',
  clean_aborted: 'Reinigung nicht abgeschlossen',
}

export async function getRoomHistoryAction(slug: string, roomId: string): Promise<RoomHistoryResult> {
  // Bewusst Management (nicht Admin-only): Beschwerde-Aufklärung ist
  // Tagesgeschäft der Rezeption.
  const ctx = await getManagementContext(slug)
  if (!ctx) return { error: 'Nicht angemeldet.' }
  const admin = createAdminClient()

  const { data: room } = await admin
    .from('rooms').select('id, hotel_id').eq('id', roomId).maybeSingle()
  if (!room || room.hotel_id !== ctx.hotelId) return { error: 'Zimmer nicht gefunden.' }

  const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString()

  const [{ data: transitions }, { data: stitches }, { data: stayRows }, { data: orders }] =
    await Promise.all([
      admin
        .from('room_state_transitions')
        .select('field, old_value, new_value, source, actor_id, occurred_at')
        .eq('room_id', roomId)
        .gte('occurred_at', since)
        .order('occurred_at', { ascending: false })
        .limit(MAX_EVENTS),
      admin
        .from('staff_log')
        .select('kind, profile_id, at')
        .eq('room_id', roomId)
        .in('kind', ['clean_start', 'clean_done', 'clean_aborted'])
        .gte('at', since)
        .order('at', { ascending: false })
        .limit(MAX_EVENTS),
      admin
        .from('stays')
        .select('checked_in_at, checked_out_at, created_by, checked_out_by')
        .eq('room_id', roomId)
        .gte('checked_in_at', since)
        .order('checked_in_at', { ascending: false })
        .limit(30),
      admin
        .from('service_orders')
        .select('created_at, done_at, done_by, service_definitions(name)')
        .eq('room_id', roomId)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(40),
    ])

  // Namen über die tatsächlich vorkommenden Akteure auflösen — NICHT über
  // profiles.hotel_id: für Management ist das nur das Stammhaus, ein Inhaber
  // oder Manager mit mehreren Häusern erschien in allen anderen als
  // „Rezeption", obwohl die ID korrekt gespeichert war. Die IDs stammen
  // ausschließlich aus Zeilen dieses Zimmers, die Mandantengrenze bleibt.
  const actorIds = new Set<string>()
  for (const t of transitions ?? []) if (t.actor_id) actorIds.add(t.actor_id)
  for (const s of stitches ?? []) actorIds.add(s.profile_id)
  for (const s of stayRows ?? []) {
    if (s.created_by) actorIds.add(s.created_by)
    if (s.checked_out_by) actorIds.add(s.checked_out_by)
  }
  for (const o of orders ?? []) if (o.done_by) actorIds.add(o.done_by)

  const profiles = actorIds.size > 0
    ? (await admin.from('profiles').select('id, display_name').in('id', [...actorIds])).data
    : null
  const nameById = new Map((profiles ?? []).map(p => [p.id, p.display_name]))

  /** Gäste sind anonym — nie eine Person, immer nur „Gast". */
  function actorLabel(source: string | null, actorId: string | null): string {
    if (source === 'guest') return 'Gast'
    if (source === 'system') return 'System'
    const name = actorId ? nameById.get(actorId) : null
    if (name) return name
    return source === 'maid' ? 'Reinigung' : 'Rezeption'
  }

  const events: RoomHistoryEvent[] = []

  for (const t of transitions ?? []) {
    const label = transitionLabel(t.field, t.old_value, t.new_value)
    if (!label) continue
    events.push({
      at: t.occurred_at,
      label,
      actor: actorLabel(t.source, t.actor_id),
      tone: t.source === 'guest' ? 'guest' : 'desk',
    })
  }

  for (const s of stitches ?? []) {
    const label = STITCH_LABEL[s.kind]
    if (!label) continue
    // clean_aborted schreibt ausschließlich der Stale-Timeout
    // (reapStaleCleanings): Akteur ist das System, die Kraft steht im Label.
    const isAbort = s.kind === 'clean_aborted'
    const name = nameById.get(s.profile_id)
    events.push({
      at: s.at,
      label: isAbort ? `${label} (Zeitlimit${name ? `, ${name}` : ''})` : label,
      actor: isAbort ? 'System' : (name ?? 'Reinigung'),
      tone: 'clean',
    })
  }

  for (const s of stayRows ?? []) {
    events.push({
      at: s.checked_in_at,
      label: 'Check-in',
      actor: (s.created_by ? nameById.get(s.created_by) : null) ?? 'Rezeption',
      tone: 'desk',
    })
    if (s.checked_out_at) {
      // Alt-Aufenthalte (vor 04.09.2026) tragen kein checked_out_by → „Rezeption".
      events.push({
        at: s.checked_out_at,
        label: 'Check-out',
        actor: (s.checked_out_by ? nameById.get(s.checked_out_by) : null) ?? 'Rezeption',
        tone: 'desk',
      })
    }
  }

  for (const o of orders ?? []) {
    // FK-Join kommt je nach Supabase-Version als Objekt oder Array zurück.
    const def = Array.isArray(o.service_definitions) ? o.service_definitions[0] : o.service_definitions
    const name = def?.name ?? 'Service'
    events.push({ at: o.created_at, label: `Service angefragt: ${name}`, actor: 'Gast', tone: 'service' })
    if (o.done_at) {
      events.push({
        at: o.done_at,
        label: `Service erledigt: ${name}`,
        actor: (o.done_by ? nameById.get(o.done_by) : null) ?? 'Rezeption',
        tone: 'service',
      })
    }
  }

  events.sort((a, b) => b.at.localeCompare(a.at))
  return { events: events.slice(0, MAX_EVENTS) }
}
