import { cache } from 'react'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/utils/supabase/service'

/**
 * Gast-Session: Cookie trägt den `stays.session_token` des Aufenthalts.
 * Check-out beendet den Stay → der Lookup schlägt fehl → Zugang tot.
 * Gäste sind anonym (kein Supabase-Auth), alle Zugriffe laufen
 * serverseitig über den Admin-Client.
 */
export const GUEST_COOKIE = 'rose_guest'

export type GuestContext = {
  stayId: string
  roomId: string
  roomNumber: string
  hotelId: string
  hotelName: string
  /** Mandant in der URL — für Redirects nach `/h/<slug>/guest/…`. */
  hotelSlug: string
  guestSignal: 'none' | 'please_clean' | 'dnd'
  /** „Frühestens ab" des aktiven Wunsches (ISO), sonst null. */
  cleanNotBefore: string | null
  /** Verzicht für heute (`YYYY-MM-DD` vor Ort) — „Heute keine Reinigung". */
  cleanDeclinedOn: string | null
  /** Rezeption hat die Reinigung priorisiert — für den Gast: „vorgesehen". */
  priority: boolean
  cleaningActive: boolean
  cleaningStartedAt: string | null
  /** Check-in-Zeitpunkt (ISO) — „heute gereinigt" zählt erst ab hier. */
  checkedInAt: string
  /** Geplanter Abreisetag (`YYYY-MM-DD`), optional. */
  expectedCheckout: string | null
  policies: Record<string, unknown>
}

/** PostgREST liefert eingebettete Zeilen je nach Kardinalität als Objekt oder Array. */
function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null
  return v ?? null
}

/**
 * Ein einziger Roundtrip: Aufenthalt samt Zimmer (→ dessen `room_states`)
 * und Haus über die Fremdschlüssel-Einbettung. Vorher waren es zwei Stufen
 * (Aufenthalt, dann Zimmer ‖ Status ‖ Haus) — bei jedem Gast-Seitenaufruf.
 * `cache` dedupliziert je Request (Layout und Seite fragen beide).
 */
export const getGuestContext = cache(async (): Promise<GuestContext | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(GUEST_COOKIE)?.value
  if (!token) return null

  const admin = createAdminClient()
  const { data: stay } = await admin
    .from('stays')
    .select(
      'id, room_id, hotel_id, checked_in_at, expected_checkout, rooms(number, room_states(guest_signal, clean_not_before, clean_declined_on, priority, cleaning_by, cleaning_started_at)), hotels(name, slug, policies)',
    )
    .eq('session_token', token)
    .is('checked_out_at', null)
    .maybeSingle()
  if (!stay) return null

  // Ohne generierte DB-Typen rät supabase-js bei Einbettungen „Array" —
  // tatsächlich kommt bei 1:1 ein Objekt. `one` fängt beides, der Cast über
  // `unknown` ist deshalb nötig.
  type RoomEmbed = { number: string; room_states: unknown }
  type HotelEmbed = { name: string | null; slug: string; policies: unknown }
  type StateEmbed = {
    guest_signal: string | null; clean_not_before: string | null; clean_declined_on: string | null; priority: boolean | null
    cleaning_by: string | null; cleaning_started_at: string | null
  }
  const room = one(stay.rooms as unknown as RoomEmbed | RoomEmbed[] | null)
  const hotel = one(stay.hotels as unknown as HotelEmbed | HotelEmbed[] | null)
  if (!room || !hotel) return null
  const state = one(room.room_states as StateEmbed | StateEmbed[] | null)

  return {
    stayId: stay.id,
    roomId: stay.room_id,
    roomNumber: room.number,
    hotelId: stay.hotel_id,
    hotelName: hotel.name ?? 'Hotel',
    hotelSlug: hotel.slug,
    guestSignal: (state?.guest_signal ?? 'none') as GuestContext['guestSignal'],
    cleanNotBefore: state?.clean_not_before ?? null,
    cleanDeclinedOn: state?.clean_declined_on ?? null,
    priority: Boolean(state?.priority),
    cleaningActive: Boolean(state?.cleaning_by),
    cleaningStartedAt: state?.cleaning_started_at ?? null,
    checkedInAt: stay.checked_in_at,
    expectedCheckout: stay.expected_checkout ?? null,
    policies: (hotel.policies ?? {}) as Record<string, unknown>,
  }
})
