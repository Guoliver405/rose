import { createAdminClient } from '@/utils/supabase/service'
import { getAuthUserId, listAccessibleHotels } from '@/utils/auth'
import {
  canSeeTicket, parseSupportIds, SCREENSHOT_BUCKET, type TicketContext, type TicketKind, type TicketRole,
  type TicketStatus, type ViewerAccess,
} from '@/lib/tickets'

/**
 * „Problem melden“ – der Datenbank- und Storage-Teil. Rechenlogik und Regeln
 * in [lib/tickets.ts](../lib/tickets.ts).
 *
 * Alles läuft über den Admin-Client (die Tabellen haben keine Policies); die
 * Grenze ist `canSeeTicket` bzw. die Support-Liste. Jede Funktion, die ein
 * Ticket herausgibt, prüft vorher – auch die Liste filtert je Zeile, statt
 * sich auf eine Abfrage zu verlassen.
 */

export type TicketRow = {
  id: string
  number: number
  accountId: string
  accountName: string
  hotelId: string | null
  hotelName: string | null
  hotelSlug: string | null
  reporterId: string | null
  reporterName: string
  reporterRole: TicketRole
  kind: TicketKind
  status: TicketStatus
  subject: string
  context: TicketContext
  screenshotPath: string | null
  reporterUnread: boolean
  createdAt: string
  updatedAt: string
}

export type TicketMessage = {
  id: string
  author: 'customer' | 'support'
  authorId: string | null
  authorName: string
  body: string
  createdAt: string
}

const SELECT = 'id, number, account_id, hotel_id, reporter_id, reporter_name, reporter_role, kind, status, subject, context, screenshot_path, reporter_unread, created_at, updated_at, accounts(name), hotels(name, slug)'

type Raw = Record<string, unknown>
const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null)

function toRow(r: Raw): TicketRow {
  const acc = one(r.accounts as { name: string } | { name: string }[] | null)
  const hotel = one(r.hotels as { name: string; slug: string } | { name: string; slug: string }[] | null)
  return {
    id: r.id as string,
    number: Number(r.number),
    accountId: r.account_id as string,
    accountName: acc?.name ?? '',
    hotelId: (r.hotel_id as string | null) ?? null,
    hotelName: hotel?.name ?? null,
    hotelSlug: hotel?.slug ?? null,
    reporterId: (r.reporter_id as string | null) ?? null,
    reporterName: r.reporter_name as string,
    reporterRole: r.reporter_role as TicketRole,
    kind: r.kind as TicketKind,
    status: r.status as TicketStatus,
    subject: r.subject as string,
    context: (r.context ?? {}) as TicketContext,
    screenshotPath: (r.screenshot_path as string | null) ?? null,
    reporterUnread: Boolean(r.reporter_unread),
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }
}

// ─── Wer schaut? ─────────────────────────────────────────────────────────────

/** Zugriff der angemeldeten Person je Haus – Grundlage von `canSeeTicket`. */
export async function viewerAccess(): Promise<{ userId: string; access: ViewerAccess[] } | null> {
  const userId = await getAuthUserId()
  if (!userId) return null
  const hotels = await listAccessibleHotels()
  return { userId, access: hotels.map(h => ({ hotelId: h.id, accountId: h.accountId, role: h.role })) }
}

/** Gehört die angemeldete Person zum RoSe-Team (`SUPPORT_USER_IDS`)? */
export async function supportUserId(): Promise<string | null> {
  const userId = await getAuthUserId()
  if (!userId) return null
  return parseSupportIds(process.env.SUPPORT_USER_IDS).includes(userId.toLowerCase()) ? userId : null
}

/** Ziel der Hinweis-Mails ans RoSe-Team. */
export function supportMailTo(): string {
  return (process.env.SUPPORT_MAIL_TO ?? 'support@rose-roomservice.app').trim()
}

// ─── Lesen ───────────────────────────────────────────────────────────────────

/**
 * Die Meldungen, die diese Person sehen darf – wahlweise nur zu einem Haus.
 * Gefragt wird nach den Konten ihres Zugriffs; was davon sichtbar ist,
 * entscheidet `canSeeTicket` je Zeile.
 */
export async function listVisibleTickets(
  viewer: { userId: string; access: ViewerAccess[] },
  opts: { hotelId?: string } = {},
): Promise<TicketRow[]> {
  const accountIds = [...new Set(viewer.access.map(a => a.accountId))]
  if (accountIds.length === 0) return []
  const admin = createAdminClient()
  let q = admin.from('tickets').select(SELECT).in('account_id', accountIds).order('updated_at', { ascending: false }).limit(200)
  if (opts.hotelId) q = q.eq('hotel_id', opts.hotelId)
  const { data, error } = await q
  if (error) {
    console.error('[tickets] Liste:', error.message)
    return []
  }
  return (data ?? []).map(r => toRow(r as Raw)).filter(t => canSeeTicket(t, viewer.userId, viewer.access))
}

/** Alle Meldungen für `/support`. */
export async function listAllTickets(filter: 'open' | 'done'): Promise<TicketRow[]> {
  const admin = createAdminClient()
  let q = admin.from('tickets').select(SELECT).order('updated_at', { ascending: false }).limit(300)
  q = filter === 'done' ? q.eq('status', 'done') : q.neq('status', 'done')
  const { data, error } = await q
  if (error) {
    console.error('[tickets] Support-Liste:', error.message)
    return []
  }
  return (data ?? []).map(r => toRow(r as Raw))
}

/** Ein Ticket ohne Prüfung – nur für Aufrufer, die selbst prüfen (Hinweis-Mails). */
export async function loadTicketUnchecked(id: string): Promise<TicketRow | null> {
  return loadTicket(id)
}

async function loadTicket(id: string): Promise<TicketRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const admin = createAdminClient()
  const { data } = await admin.from('tickets').select(SELECT).eq('id', id).maybeSingle()
  return data ? toRow(data as Raw) : null
}

export async function loadMessages(ticketId: string): Promise<TicketMessage[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('ticket_messages')
    .select('id, author, author_id, author_name, body, created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
  return (data ?? []).map(m => ({
    id: m.id as string,
    author: m.author as 'customer' | 'support',
    authorId: (m.author_id as string | null) ?? null,
    authorName: m.author_name as string,
    body: m.body as string,
    createdAt: m.created_at as string,
  }))
}

/** Ticket für eine Person aus der Verwaltung – `null`, wenn sie es nicht sehen darf. */
export async function ticketForViewer(id: string): Promise<{ ticket: TicketRow; userId: string } | null> {
  const viewer = await viewerAccess()
  if (!viewer) return null
  const ticket = await loadTicket(id)
  if (!ticket || !canSeeTicket(ticket, viewer.userId, viewer.access)) return null
  return { ticket, userId: viewer.userId }
}

/** Ticket für das RoSe-Team. */
export async function ticketForSupport(id: string): Promise<{ ticket: TicketRow; userId: string } | null> {
  const userId = await supportUserId()
  if (!userId) return null
  const ticket = await loadTicket(id)
  return ticket ? { ticket, userId } : null
}

/** Kurzlebiger Link aufs Bildschirmfoto – erst nach der Prüfung des Aufrufers. */
export async function screenshotUrl(path: string | null): Promise<string | null> {
  if (!path) return null
  const admin = createAdminClient()
  const { data } = await admin.storage.from(SCREENSHOT_BUCKET).createSignedUrl(path, 600)
  return data?.signedUrl ?? null
}

/** Meldungen mit ungelesener Antwort – für den Punkt am „?“. */
export async function unreadTicketCount(userId: string): Promise<number> {
  const admin = createAdminClient()
  const { count } = await admin
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('reporter_id', userId)
    .eq('reporter_unread', true)
  return count ?? 0
}

/** Meldungen dieser Person in der letzten Stunde – Drossel. */
export async function recentTicketCount(userId: string): Promise<number> {
  const admin = createAdminClient()
  const seit = new Date(Date.now() - 3_600_000).toISOString()
  const { count } = await admin
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('reporter_id', userId)
    .gte('created_at', seit)
  return count ?? 0
}

// ─── Schreiben ───────────────────────────────────────────────────────────────

export async function insertTicket(t: {
  accountId: string
  hotelId: string | null
  reporterId: string
  reporterName: string
  reporterRole: TicketRole
  kind: TicketKind
  subject: string
  body: string
  context: TicketContext
}): Promise<{ id: string; number: number } | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('tickets')
    .insert({
      account_id: t.accountId,
      hotel_id: t.hotelId,
      reporter_id: t.reporterId,
      reporter_name: t.reporterName,
      reporter_role: t.reporterRole,
      kind: t.kind,
      subject: t.subject,
      context: t.context,
    })
    .select('id, number')
    .single()
  if (error || !data) {
    console.error('[tickets] anlegen:', error?.message)
    return null
  }
  const { error: msgErr } = await admin.from('ticket_messages').insert({
    ticket_id: data.id, author: 'customer', author_id: t.reporterId, author_name: t.reporterName, body: t.body,
  })
  if (msgErr) {
    // Ein Ticket ohne Text ist keines – lieber ganz zurücknehmen.
    console.error('[tickets] Meldungstext:', msgErr.message)
    await admin.from('tickets').delete().eq('id', data.id)
    return null
  }
  return { id: data.id as string, number: Number(data.number) }
}

/** Bildschirmfoto ablegen und vermerken. Scheitert es, bleibt die Meldung ohne Bild bestehen. */
export async function attachScreenshot(ticketId: string, path: string, bytes: Uint8Array, mime: string): Promise<boolean> {
  const admin = createAdminClient()
  const { error } = await admin.storage.from(SCREENSHOT_BUCKET).upload(path, bytes, { contentType: mime, upsert: false })
  if (error) {
    console.error('[tickets] Bildschirmfoto:', error.message)
    return false
  }
  const { error: dbErr } = await admin.from('tickets').update({ screenshot_path: path }).eq('id', ticketId)
  if (dbErr) {
    await admin.storage.from(SCREENSHOT_BUCKET).remove([path])
    return false
  }
  return true
}

export async function addMessage(m: {
  ticketId: string
  author: 'customer' | 'support'
  authorId: string
  authorName: string
  body: string
  /** Neuer Zustand des Tickets; beim Abschluss geht das Bildschirmfoto. */
  status: TicketStatus
  reporterUnread?: boolean
}): Promise<boolean> {
  const admin = createAdminClient()
  const { error } = await admin.from('ticket_messages').insert({
    ticket_id: m.ticketId, author: m.author, author_id: m.authorId, author_name: m.authorName, body: m.body,
  })
  if (error) {
    console.error('[tickets] Antwort:', error.message)
    return false
  }
  return setTicketStatus(m.ticketId, m.status, m.reporterUnread)
}

/**
 * Zustand setzen. **Mit dem Abschluss wird das Bildschirmfoto gelöscht** – es
 * kann Gäste oder Personal zeigen, und gebraucht wird es nur, solange jemand
 * am Problem arbeitet.
 */
export async function setTicketStatus(ticketId: string, status: TicketStatus, reporterUnread?: boolean): Promise<boolean> {
  const admin = createAdminClient()
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (reporterUnread !== undefined) patch.reporter_unread = reporterUnread

  if (status === 'done') {
    const { data } = await admin.from('tickets').select('screenshot_path').eq('id', ticketId).maybeSingle()
    if (data?.screenshot_path) {
      await admin.storage.from(SCREENSHOT_BUCKET).remove([data.screenshot_path as string])
      patch.screenshot_path = null
    }
  }
  const { error } = await admin.from('tickets').update(patch).eq('id', ticketId)
  if (error) console.error('[tickets] Status:', error.message)
  return !error
}

/** Die meldende Person hat die Antwort gesehen. */
export async function markSeen(ticketId: string): Promise<void> {
  const admin = createAdminClient()
  await admin.from('tickets').update({ reporter_unread: false }).eq('id', ticketId).eq('reporter_unread', true)
}

/** Anmelde-Adresse der meldenden Person – für den Hinweis auf eine Antwort. */
export async function reporterEmail(reporterId: string | null): Promise<string | null> {
  if (!reporterId) return null
  const admin = createAdminClient()
  const { data } = await admin.auth.admin.getUserById(reporterId)
  return data.user?.email ?? null
}

// ─── Löschen ─────────────────────────────────────────────────────────────────

/**
 * Bildschirmfotos eines Hauses oder Kontos entfernen – Storage kennt keinen
 * Fremdschlüssel, die Kaskade nimmt nur die Zeilen mit. Läuft deshalb VOR dem
 * Löschen (dieselbe Falle wie beim Logo).
 */
export async function purgeTicketScreenshots(scope: { hotelId: string } | { accountId: string }): Promise<{ error?: string }> {
  const admin = createAdminClient()
  let q = admin.from('tickets').select('screenshot_path').not('screenshot_path', 'is', null)
  q = 'hotelId' in scope ? q.eq('hotel_id', scope.hotelId) : q.eq('account_id', scope.accountId)
  const { data, error } = await q
  if (error) return { error: error.message }
  const paths = (data ?? []).map(r => r.screenshot_path as string)
  // Beim Konto zusätzlich der ganze Ordner – eine Waise aus einem
  // abgebrochenen Upload trägt keine Zeile.
  if ('accountId' in scope) {
    const { data: files } = await admin.storage.from(SCREENSHOT_BUCKET).list(scope.accountId)
    for (const f of files ?? []) paths.push(`${scope.accountId}/${f.name}`)
  }
  const unique = [...new Set(paths)]
  if (unique.length === 0) return {}
  const { error: rmErr } = await admin.storage.from(SCREENSHOT_BUCKET).remove(unique)
  return rmErr ? { error: rmErr.message } : {}
}
