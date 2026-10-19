'use server'

import { getManagementContext, listAccessibleHotels } from '@/utils/auth'
import { format, getMessages, isLocale, type Locale } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'
import { siteBase, sendTicketMail } from '@/utils/mail'
import { ticketNoticeMail } from '@/lib/mail-templates'
import {
  cleanBody, isTicketStatus, mailableAddress, parseContext, screenshotPath, TICKETS_PER_HOUR, validateScreenshot,
  validateTicketInput, type ScreenshotMime, type TicketRole, type TicketStatus,
} from '@/lib/tickets'
import {
  addMessage, attachScreenshot, insertTicket, loadTicketUnchecked, markSeen, recentTicketCount, reporterEmail, setTicketStatus,
  supportMailTo, ticketForSupport, ticketForViewer, unreadTicketCount, viewerAccess, type TicketRow,
} from '@/utils/tickets'

/**
 * „Problem melden“ – Server-Actions für Verwaltung und RoSe-Team. Jede prüft
 * selbst, wer fragt; die IDs kommen aus dem Browser.
 */

async function texts() {
  return getMessages(await getAdminLocale()).help.tickets
}

/** Wo die Person ihre Meldung findet – im Haus oder im Konto-Bereich. */
function viewerUrl(t: Pick<TicketRow, 'id' | 'hotelSlug'>): string {
  return t.hotelSlug ? `/h/${t.hotelSlug}/admin/meldungen/${t.id}` : `/admin/meldungen/${t.id}`
}

/** Mails ans RoSe-Team gehen auf Deutsch. */
const SUPPORT_LOCALE: Locale = 'de'

export type ReportResult = { number: number; url: string } | { error: string }

export async function reportProblemAction(formData: FormData): Promise<ReportResult> {
  const e = (await texts()).errors

  // Wer meldet, und zu welchem Haus? Im Haus aus dem Slug, im Konto-Bereich
  // aus den erreichbaren Häusern (Inhaber vor Manager).
  const slug = String(formData.get('slug') ?? '')
  let scope: { userId: string; accountId: string; hotelId: string | null; role: TicketRole; name: string; hotelSlug: string | null }
  if (slug) {
    const ctx = await getManagementContext(slug)
    if (!ctx) return { error: e.failed }
    scope = { userId: ctx.userId, accountId: ctx.accountId, hotelId: ctx.hotelId, role: ctx.role, name: ctx.displayName, hotelSlug: ctx.hotelSlug }
  } else {
    const viewer = await viewerAccess()
    const hotels = await listAccessibleHotels()
    const h = hotels.find(x => x.role === 'admin') ?? hotels.find(x => x.role === 'manager')
    if (!viewer || !h) return { error: e.failed }
    scope = { userId: viewer.userId, accountId: h.accountId, hotelId: null, role: h.role, name: h.displayName, hotelSlug: null }
  }

  const input = validateTicketInput({ kind: formData.get('kind'), subject: formData.get('subject'), body: formData.get('body') })
  if ('error' in input) return { error: e[input.error] }

  if ((await recentTicketCount(scope.userId)) >= TICKETS_PER_HOUR) return { error: e.tooMany }

  // Bildschirmfoto vorab prüfen – eine falsche Datei soll nicht erst nach dem
  // Anlegen auffallen.
  const file = formData.get('screenshot')
  let bild: { bytes: Uint8Array; mime: ScreenshotMime } | null = null
  if (file instanceof File && file.size > 0) {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const check = validateScreenshot(bytes.byteLength, bytes.subarray(0, 16))
    if ('error' in check) return { error: check.error === 'tooLarge' ? e.screenshotTooLarge : e.screenshotWrongType }
    bild = { bytes, mime: check.mime }
  }

  const ticket = await insertTicket({
    accountId: scope.accountId,
    hotelId: scope.hotelId,
    reporterId: scope.userId,
    reporterName: scope.name || '—',
    reporterRole: scope.role,
    kind: input.kind,
    subject: input.subject,
    body: input.body,
    context: parseContext(formData.get('context')),
  })
  if (!ticket) return { error: e.failed }

  if (bild) {
    await attachScreenshot(ticket.id, screenshotPath(scope.accountId, ticket.id, bild.mime), bild.bytes, bild.mime)
  }

  await notifySupport('ticket_new', ticket.id)
  return { number: ticket.number, url: viewerUrl({ id: ticket.id, hotelSlug: scope.hotelSlug }) }
}

/** Antwort der meldenden Person (oder ihrer Leitung) im Verlauf. */
export async function replyTicketAction(ticketId: string, body: string): Promise<{ error?: string }> {
  const t = await texts()
  const found = await ticketForViewer(ticketId)
  if (!found) return { error: t.errors.notFound }
  const text = cleanBody(body)
  if (!text) return { error: t.errors.body }

  const hotels = await listAccessibleHotels()
  const name = hotels.find(h => h.accountId === found.ticket.accountId)?.displayName || '—'
  // Eine Antwort des Kunden holt die Meldung zurück auf den Tisch.
  const status: TicketStatus = found.ticket.status === 'new' ? 'new' : 'open'
  const ok = await addMessage({ ticketId, author: 'customer', authorId: found.userId, authorName: name, body: text, status })
  if (!ok) return { error: t.errors.failed }

  await notifySupport('ticket_reply', ticketId, name)
  return {}
}

/** Die meldende Person öffnet ihr Ticket – der Punkt am „?“ verschwindet. */
export async function markTicketSeenAction(ticketId: string): Promise<void> {
  const found = await ticketForViewer(ticketId)
  if (found && found.ticket.reporterId === found.userId) await markSeen(ticketId)
}

/** Für den Punkt am „?“ – außerhalb des Seitenaufbaus, damit keine Seite darauf wartet. */
export async function unreadTicketsAction(): Promise<number> {
  const viewer = await viewerAccess()
  return viewer ? unreadTicketCount(viewer.userId) : 0
}

// ─── RoSe-Team ───────────────────────────────────────────────────────────────

export async function supportReplyAction(ticketId: string, body: string, status: string): Promise<{ error?: string }> {
  const t = await texts()
  const found = await ticketForSupport(ticketId)
  if (!found) return { error: t.errors.notFound }
  const text = cleanBody(body)
  if (!text) return { error: t.errors.body }
  if (!isTicketStatus(status)) return { error: t.errors.failed }

  const ok = await addMessage({
    ticketId, author: 'support', authorId: found.userId, authorName: getMessages(SUPPORT_LOCALE).help.tickets.thread.support,
    body: text, status, reporterUnread: true,
  })
  if (!ok) return { error: t.errors.failed }

  await notifyReporter(found.ticket)
  return {}
}

export async function supportStatusAction(ticketId: string, status: string): Promise<{ error?: string }> {
  const t = await texts()
  const found = await ticketForSupport(ticketId)
  if (!found || !isTicketStatus(status)) return { error: t.errors.notFound }
  return (await setTicketStatus(ticketId, status)) ? {} : { error: t.errors.failed }
}

/** Öffnet das RoSe-Team eine neue Meldung, steht sie danach „in Bearbeitung“. */
export async function supportOpenedAction(ticketId: string): Promise<void> {
  const found = await ticketForSupport(ticketId)
  if (found?.ticket.status === 'new') await setTicketStatus(ticketId, 'open')
}

// ─── Hinweis-Mails ───────────────────────────────────────────────────────────

/**
 * An support@ – nur Art, wer und wo, nie der Text. Ein gescheiterter Versand
 * hält nichts auf: Die Meldung steht in RoSe, die Support-Seite zeigt sie.
 */
async function notifySupport(purpose: 'ticket_new' | 'ticket_reply', ticketId: string, replier?: string): Promise<void> {
  try {
    const found = await loadTicketUnchecked(ticketId)
    if (!found) return
    const m = getMessages(SUPPORT_LOCALE).help.tickets
    const where = found.hotelName
      ? format(m.mails.house, { house: found.hotelName })
      : format(m.mails.accountWide, { account: found.accountName })
    const vars = { number: found.number, name: replier ?? found.reporterName, role: m.support.role[found.reporterRole], where, kind: m.kinds[found.kind] }
    const content = ticketNoticeMail({
      subject: format(purpose === 'ticket_new' ? m.mails.newSubject : m.mails.replySubject, vars),
      lines: [format(purpose === 'ticket_new' ? m.mails.newIntro : m.mails.replyIntro, vars)],
      url: `${siteBase()}/support/${found.id}`,
      button: m.mails.open,
      locale: SUPPORT_LOCALE,
    })
    const r = await sendTicketMail({ purpose, to: supportMailTo(), content, hotelId: found.hotelId })
    if (r.error) console.error('[tickets] Mail an support:', r.error)
  } catch (err) {
    console.error('[tickets] Mail an support:', err)
  }
}

/** An die meldende Person – in der Sprache, in der sie gemeldet hat. */
async function notifyReporter(ticket: TicketRow): Promise<void> {
  try {
    const to = mailableAddress(await reporterEmail(ticket.reporterId))
    if (!to) return
    const locale: Locale = isLocale(ticket.context.locale) ? ticket.context.locale : 'de'
    const m = getMessages(locale).help.tickets.mails
    const vars = { number: ticket.number, subject: ticket.subject }
    const content = ticketNoticeMail({
      subject: format(m.answerSubject, vars),
      lines: [format(m.answerIntro, vars), m.answerNote],
      url: `${siteBase()}${viewerUrl(ticket)}`,
      button: m.open,
      locale,
    })
    const r = await sendTicketMail({ purpose: 'ticket_answer', to, content, hotelId: ticket.hotelId, userId: ticket.reporterId })
    if (r.error) console.error('[tickets] Mail an Kunden:', r.error)
  } catch (err) {
    console.error('[tickets] Mail an Kunden:', err)
  }
}

