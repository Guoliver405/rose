import { createAdminClient } from '@/utils/supabase/service'
import { slugify, uniqueSlug } from '@/lib/slug'
import { DEFAULT_PIN_LENGTH } from '@/lib/ids'
import serviceTemplates from '@/lib/service-templates.json'
import { ensureStripeCustomer, stripeReady } from '@/utils/stripe'

/*
 * Anlage eines Hotelkontos für einen BESTEHENDEN Auth-Nutzer — gemeinsamer
 * Weg von `/registrieren` (Phase 6b) und der Umwandlung eines Simulator-Kontos
 * (Simulator Phase 4, 26.09.2026). Vorher stand die Logik nur in der
 * Registrierung; zwei Kopien liefen über kurz oder lang auseinander.
 *
 * Erzeugt Konto, erstes Haus (optional mit Regeln und Zimmern), Profil,
 * Inhaberschaft, Beispiel-Services und den Stripe-Kunden. Scheitert ein
 * Pflichtschritt, wird das angelegte Konto wieder entfernt (die Kaskade nimmt
 * Haus, Zimmer und Services mit) — den Auth-Nutzer löscht nur, wer ihn in
 * diesem Aufruf angelegt hat, also der Aufrufer.
 */

export type HotelAccountInput = {
  userId: string
  hotelName: string
  displayName: string
  /** Zusätzliche Regeln des Hauses (werden über die Vorgaben gelegt). */
  policies?: Record<string, unknown>
  /** Zimmer, die gleich mit angelegt werden. */
  rooms?: { floor: number; number: string }[]
}

export type HotelAccountResult = { accountId?: string; hotelId?: string; slug?: string; stripe?: boolean; error?: string }

/**
 * Einladungscode: fehlt die Variable, ist die Anlage ZU — ein vergessenes
 * Env-Var darf das Tor nicht öffnen. Verglichen wird ohne Leer- und
 * unsichtbare Zeichen und ohne Groß-/Kleinschreibung: ein aus Chat oder Mail
 * kopierter Code trägt gern ein Zeichen mit, das niemand sieht (26.09.2026,
 * Umwandlung in Produktion abgewiesen).
 */
export function checkInviteCode(code: string): string | null {
  const erwartet = normalizeCode(process.env.SIGNUP_INVITE_CODE ?? '')
  if (!erwartet) return 'Die Anmeldung als Hotel ist derzeit nicht freigeschaltet.'
  const got = normalizeCode(code)
  if (got !== erwartet) {
    // Nur Längen ins Log, nie der Code.
    console.error('[einladungscode] abgewiesen', { laenge: got.length, erwartet: erwartet.length, roh: code.length })
    return 'Einladungscode stimmt nicht.'
  }
  return null
}

export function normalizeCode(v: string): string {
  return v.replace(/[\s\u200B-\u200D\u2060\uFEFF`"'\u201E\u201C]/g, '').toLowerCase()
}

export const hotelSignupOpen = () => Boolean(normalizeCode(process.env.SIGNUP_INVITE_CODE ?? ''))

/** Höchstens so viele Zimmer in einem Zug — mehr legt das Zimmer-Setup an. */
export const MAX_ROOMS_AT_SIGNUP = 1000

export async function createHotelAccount(input: HotelAccountInput): Promise<HotelAccountResult> {
  const admin = createAdminClient()
  const { userId, hotelName, displayName } = input
  const rollback = async (accountId: string) => { await admin.from('accounts').delete().eq('id', accountId) }

  // ── Konto ────────────────────────────────────────────────────────────────
  const { data: account, error: accErr } = await admin.from('accounts').insert({ name: hotelName }).select('id').single()
  if (accErr || !account) return { error: `Konto konnte nicht angelegt werden: ${accErr?.message}` }

  // ── Erstes Haus. Slugs sind GLOBAL eindeutig (URL-Schlüssel).
  const { data: existing } = await admin.from('hotels').select('slug')
  const slug = uniqueSlug(slugify(hotelName), (existing ?? []).map(h => h.slug))
  const { data: hotel, error: hotelErr } = await admin
    .from('hotels')
    .insert({ name: hotelName, slug, account_id: account.id, policies: { pinLength: DEFAULT_PIN_LENGTH, ...input.policies } })
    .select('id')
    .single()
  if (hotelErr || !hotel) {
    await rollback(account.id)
    return { error: `Haus konnte nicht angelegt werden: ${hotelErr?.message}` }
  }

  // ── Profil. PFLICHT auch für Management: stays.created_by und
  //    service_orders.done_by zeigen darauf. hotel_id = Stammhaus.
  const { error: profileErr } = await admin.from('profiles').insert({ id: userId, hotel_id: hotel.id, display_name: displayName })
  if (profileErr) {
    await rollback(account.id)
    return { error: `Profil konnte nicht angelegt werden: ${profileErr.message}` }
  }
  const dropProfile = () => admin.from('profiles').delete().eq('id', userId)

  // ── Inhaberschaft. Hier hängt die Berechtigung, nicht am Profil.
  const { error: memberErr } = await admin
    .from('account_members')
    .insert({ account_id: account.id, user_id: userId, role: 'owner', display_name: displayName })
  if (memberErr) {
    await dropProfile()
    await rollback(account.id)
    return { error: `Inhaber konnte nicht eingetragen werden: ${memberErr.message}` }
  }

  // ── Zimmer samt room_states (wie das Zimmer-Setup). Nicht fatal: das Haus
  //    ist ohne Zimmer nutzbar, das Zimmer-Setup legt sie an.
  if (input.rooms && input.rooms.length > 0) {
    const rows = input.rooms.slice(0, MAX_ROOMS_AT_SIGNUP)
    for (let i = 0; i < rows.length; i += 250) {
      const { data: inserted, error } = await admin
        .from('rooms')
        .insert(rows.slice(i, i + 250).map(r => ({ hotel_id: hotel.id, number: r.number, floor: r.floor, building: null })))
        .select('id')
      if (error || !inserted) { console.error('[hotel-account] rooms:', error?.message); break }
      await admin.from('room_states').insert(inserted.map(r => ({ room_id: r.id, hotel_id: hotel.id })))
    }
  }

  // ── Beispiel-Services. Nicht fatal.
  for (const t of serviceTemplates) {
    const { data: svc } = await admin
      .from('service_definitions')
      .insert({ hotel_id: hotel.id, name: t.name, description: t.description, urgent: t.urgent })
      .select('id')
      .single()
    if (svc && t.items.length > 0) {
      await admin.from('service_items').insert(
        t.items.map((i, idx) => ({ service_id: svc.id, hotel_id: hotel.id, label: i.label, price_cents: i.price_cents, sort_order: idx })),
      )
    }
  }

  // ── Stripe-Kunde. Nicht fatal: fehlt er, holt ihn die Zahlungsweg-Seite nach.
  const stripe = stripeReady()
  if (stripe) {
    const res = await ensureStripeCustomer(account.id)
    if (res.error) console.error('[hotel-account] Stripe-Kunde nicht angelegt:', res.error)
  }

  return { accountId: account.id, hotelId: hotel.id, slug, stripe }
}
