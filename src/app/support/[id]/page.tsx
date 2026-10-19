import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { getMessages, intlLocale } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'
import { loadMessages, screenshotUrl, ticketForSupport } from '@/utils/tickets'
import { TicketHeader, TicketMessages } from '@/components/tickets/TicketViews'
import { SupportControls, SupportOpened } from '@/components/tickets/TicketClient'
import SupportShell from '../SupportShell'

export const metadata: Metadata = { robots: { index: false, follow: false } }

/** Eine Meldung mit Kontext, Verlauf, Antwort und Zustand – für das RoSe-Team. */
export default async function SupportTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const found = await ticketForSupport(id)
  if (!found) notFound()
  const { ticket, userId } = found
  const locale = await getAdminLocale()
  const m = getMessages(locale)
  const t = m.help.tickets
  const s = t.support
  const intl = intlLocale(locale)
  const [messages, shot] = await Promise.all([loadMessages(ticket.id), screenshotUrl(ticket.screenshotPath)])
  const c = ticket.context

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-32 shrink-0 text-xs font-bold uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-ink">{value}</dd>
    </div>
  )

  return (
    <SupportShell title={s.title} logout={m.account.houses.shell.logout}>
      <Link href="/support" className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> {s.back}
      </Link>
      <TicketHeader ticket={ticket} t={t} intl={intl} mode="support" />

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <TicketMessages
            messages={messages} t={t} intl={intl} mode="support" userId={userId}
            screenshot={shot} screenshotGone={ticket.status === 'done' && !ticket.screenshotPath}
          />
          <SupportControls ticketId={ticket.id} status={ticket.status} t={t} />
        </div>

        <aside className="flex flex-col gap-3 self-start rounded-xl border border-edge bg-surface p-4">
          <dl className="flex flex-col gap-2">
            {row(s.account, ticket.accountName)}
            {row(s.house, ticket.hotelName ?? '—')}
            {row(s.reporter, `${ticket.reporterName} (${s.role[ticket.reporterRole]})`)}
          </dl>
          <h2 className="mt-2 text-sm font-bold text-ink-soft">{s.context}</h2>
          <dl className="flex flex-col gap-2">
            {row(s.contextPath, c.path ?? '—')}
            {row(s.contextLocale, c.locale ?? '—')}
            {row(s.contextViewport, c.viewport ?? '—')}
            {row(s.contextBrowser, <span className="text-xs">{c.userAgent ?? '—'}</span>)}
            {row(s.contextErrors, c.errors?.length
              ? <ul className="flex flex-col gap-1 font-mono text-xs">{c.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
              : s.noErrors)}
          </dl>
        </aside>
      </div>

      {ticket.status === 'new' && <SupportOpened ticketId={ticket.id} />}
    </SupportShell>
  )
}
