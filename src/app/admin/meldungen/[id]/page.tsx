import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAccountContext, listAccessibleHotels } from '@/utils/auth'
import { getMessages, intlLocale } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'
import { loadMessages, screenshotUrl, ticketForViewer } from '@/utils/tickets'
import { TicketHeader, TicketMessages } from '@/components/tickets/TicketViews'
import { CustomerReply, MarkSeen } from '@/components/tickets/TicketClient'
import KontoShell from '../../KontoShell'

export default async function KontoMeldungPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [hotels, account] = await Promise.all([listAccessibleHotels(), getAccountContext()])
  if (!hotels.some(h => h.role !== 'reception')) redirect('/admin')
  const found = await ticketForViewer(id)
  if (!found) notFound()
  const { ticket, userId } = found
  const locale = await getAdminLocale()
  const t = getMessages(locale).help.tickets
  const intl = intlLocale(locale)
  const [messages, shot] = await Promise.all([loadMessages(ticket.id), screenshotUrl(ticket.screenshotPath)])

  return (
    <KontoShell who={account?.displayName ?? hotels[0]?.displayName} istInhaber={Boolean(account)}>
      <Link href="/admin/meldungen" className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> {t.list.back}
      </Link>
      <TicketHeader ticket={ticket} t={t} intl={intl} />
      <TicketMessages
        messages={messages} t={t} intl={intl} mode="customer" userId={userId}
        screenshot={shot} screenshotGone={ticket.status === 'done' && !ticket.screenshotPath}
      />
      <CustomerReply ticketId={ticket.id} status={ticket.status} t={t} />
      {ticket.reporterUnread && ticket.reporterId === userId && <MarkSeen ticketId={ticket.id} />}
    </KontoShell>
  )
}
