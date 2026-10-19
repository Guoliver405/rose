import { redirect } from 'next/navigation'
import { getManagementContext } from '@/utils/auth'
import { getMessages, intlLocale } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'
import { listVisibleTickets, viewerAccess } from '@/utils/tickets'
import { TicketList } from '@/components/tickets/TicketViews'
import TicketButton from '@/components/tickets/TicketDialog'

/**
 * „Meine Meldungen“ im Haus: die eigenen Meldungen zu diesem Haus, für Inhaber
 * und Manager auch die ihres Teams (`canSeeTicket`).
 */
export default async function MeldungenPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ctx = await getManagementContext(slug)
  if (!ctx) redirect('/admin')
  const viewer = await viewerAccess()
  if (!viewer) redirect('/login')
  const locale = await getAdminLocale()
  const t = getMessages(locale).help.tickets
  const tickets = await listVisibleTickets(viewer, { hotelId: ctx.hotelId })

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-ink">{t.list.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t.list.intro}</p>
        </div>
        <TicketButton
          slug={ctx.hotelSlug}
          label={t.list.newReport}
          className="flex items-center gap-2 rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong"
        />
      </div>
      <TicketList
        tickets={tickets}
        t={t}
        intl={intlLocale(locale)}
        href={tk => `/h/${ctx.hotelSlug}/admin/meldungen/${tk.id}`}
        showPlace={false}
        mode="customer"
      />
    </div>
  )
}
