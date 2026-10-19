import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getManagementContext } from '@/utils/auth'
import { getMessages, intlLocale } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'
import { loadMessages, screenshotUrl, ticketForViewer } from '@/utils/tickets'
import { TicketHeader, TicketMessages } from '@/components/tickets/TicketViews'
import { CustomerReply, MarkSeen } from '@/components/tickets/TicketClient'

export default async function MeldungPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const ctx = await getManagementContext(slug)
  if (!ctx) redirect('/admin')
  const found = await ticketForViewer(id)
  if (!found) notFound()
  const { ticket, userId } = found
  const locale = await getAdminLocale()
  const t = getMessages(locale).help.tickets
  const intl = intlLocale(locale)
  const [messages, shot] = await Promise.all([loadMessages(ticket.id), screenshotUrl(ticket.screenshotPath)])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link href={`/h/${ctx.hotelSlug}/admin/meldungen`} className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> {t.list.back}
      </Link>
      <TicketHeader ticket={ticket} t={t} intl={intl} />
      <TicketMessages
        messages={messages} t={t} intl={intl} mode="customer" userId={userId}
        screenshot={shot} screenshotGone={ticket.status === 'done' && !ticket.screenshotPath}
      />
      <CustomerReply ticketId={ticket.id} status={ticket.status} t={t} />
      {ticket.reporterUnread && ticket.reporterId === userId && <MarkSeen ticketId={ticket.id} />}
    </div>
  )
}
