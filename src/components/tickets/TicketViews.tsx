import Link from 'next/link'
import { ImageIcon } from 'lucide-react'
import { format, type HelpMessages } from '@/lib/i18n'
import { ticketRef, type TicketStatus } from '@/lib/tickets'
import type { TicketMessage, TicketRow } from '@/utils/tickets'

/**
 * Liste und Gesprächsverlauf der Meldungen – gemeinsam für „Meine Meldungen“
 * (Haus und Konto) und die Support-Seite. Reine Darstellung; wer was sehen
 * darf, hat die Seite vorher geprüft.
 */

type T = HelpMessages['tickets']

const STATUS_TONE: Record<TicketStatus, string> = {
  new: 'bg-attention-pill text-attention-deepest',
  open: 'bg-fresh-pill text-fresh-deepest',
  waiting: 'bg-accent-pill text-accent-deep',
  done: 'bg-positive-pill text-positive-deepest',
}

export function StatusPill({ status, label }: { status: TicketStatus; label: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_TONE[status]}`}>{label}</span>
}

const dateTime = (iso: string, intl: string) =>
  new Date(iso).toLocaleString(intl, { dateStyle: 'medium', timeStyle: 'short' })

export function TicketList({
  tickets, t, intl, href, showPlace, mode,
}: {
  tickets: TicketRow[]
  t: T
  intl: string
  href: (ticket: TicketRow) => string
  /** Haus bzw. Konto in der Zeile nennen (Konto-Bereich, Support). */
  showPlace: boolean
  mode: 'customer' | 'support'
}) {
  if (tickets.length === 0) {
    return <p className="rounded-xl border border-edge bg-surface p-4 text-sm text-ink-soft">{mode === 'support' ? t.support.empty : t.list.empty}</p>
  }
  // Dieselben Zustände, für den Kunden und für das Team verschieden benannt.
  return (
    <ul className="flex flex-col divide-y divide-edge rounded-xl border border-edge bg-surface">
      {tickets.map(tk => (
        <li key={tk.id}>
          <Link href={href(tk)} className="flex flex-col gap-1 px-4 py-3 hover:bg-surface-sunken sm:flex-row sm:items-center sm:gap-4">
            <span className="w-16 shrink-0 font-mono text-sm font-bold text-ink-muted">{ticketRef(tk.number)}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-ink">{tk.subject}</span>
              <span className="block text-xs text-ink-muted">
                {t.kinds[tk.kind]} · {format(t.list.by, { name: tk.reporterName })}
                {showPlace && ` · ${tk.hotelName ?? `${t.list.account} ${tk.accountName}`}`}
                {mode === 'support' && tk.hotelName && ` (${tk.accountName})`}
                {' · '}{dateTime(tk.updatedAt, intl)}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {mode === 'customer' && tk.reporterUnread && (
                <span className="rounded-full bg-critical-pill px-2 py-0.5 text-xs font-bold text-critical-deepest">{t.list.unread}</span>
              )}
              <StatusPill status={tk.status} label={(mode === 'support' ? t.support.status : t.status)[tk.status]} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function TicketHeader({ ticket, t, intl, mode = 'customer' }: { ticket: TicketRow; t: T; intl: string; mode?: 'customer' | 'support' }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-bold text-ink-muted">{ticketRef(ticket.number)}</span>
        <StatusPill status={ticket.status} label={(mode === 'support' ? t.support.status : t.status)[ticket.status]} />
        <span className="text-xs font-semibold text-ink-muted">{t.kinds[ticket.kind]}</span>
      </div>
      <h1 className="text-2xl font-black text-ink">{ticket.subject}</h1>
      <p className="text-sm text-ink-muted">
        {format(t.thread.reportedBy, { name: ticket.reporterName, date: dateTime(ticket.createdAt, intl) })}
        {' · '}
        {ticket.hotelName ? format(t.thread.house, { name: ticket.hotelName }) : t.thread.accountWide}
      </p>
    </div>
  )
}

export function TicketMessages({
  messages, t, intl, mode, userId, screenshot, screenshotGone,
}: {
  messages: TicketMessage[]
  t: T
  intl: string
  mode: 'customer' | 'support'
  userId: string
  screenshot: string | null
  /** Abgeschlossen und das Foto ist weg – erklären statt verschweigen. */
  screenshotGone: boolean
}) {
  return (
    <ol className="flex flex-col gap-3">
      {messages.map((msg, i) => {
        const fromSupport = msg.author === 'support'
        const name = fromSupport
          ? t.thread.support
          : mode === 'customer' && msg.authorId === userId ? t.thread.you : msg.authorName
        return (
          <li
            key={msg.id}
            className={`rounded-xl border p-4 ${fromSupport ? 'border-action-tint-edge bg-action-tint' : 'border-edge bg-surface'}`}
          >
            <p className="mb-2 text-xs font-semibold text-ink-muted">
              <span className="font-bold text-ink">{name}</span> · {dateTime(msg.createdAt, intl)}
            </p>
            <p className="whitespace-pre-wrap break-words text-sm text-ink">{msg.body}</p>
            {i === 0 && screenshot && (
              <a href={screenshot} target="_blank" rel="noopener noreferrer" className="mt-3 block">
                {/* eslint-disable-next-line @next/next/no-img-element -- kurzlebiger signierter Link aus dem privaten Bucket */}
                <img src={screenshot} alt={t.thread.screenshot} className="max-h-80 rounded-lg border border-edge" />
              </a>
            )}
            {i === 0 && !screenshot && screenshotGone && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
                <ImageIcon className="h-3.5 w-3.5" /> {t.thread.screenshotGone}
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}
