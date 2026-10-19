import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAccountContext, listAccessibleHotels } from '@/utils/auth'
import { getMessages, intlLocale } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'
import { listVisibleTickets, viewerAccess } from '@/utils/tickets'
import { TicketList } from '@/components/tickets/TicketViews'
import TicketButton from '@/components/tickets/TicketDialog'
import KontoShell from '../KontoShell'

/**
 * Alle Meldungen, die die Person sehen darf – über alle Häuser und die
 * Meldungen zum Konto selbst. Inhaber und Manager; die Rezeption kennt diesen
 * Bereich nicht.
 */
export default async function KontoMeldungenPage() {
  const [viewer, hotels, account] = await Promise.all([viewerAccess(), listAccessibleHotels(), getAccountContext()])
  if (!viewer) redirect('/login')
  if (!hotels.some(h => h.role !== 'reception')) redirect('/admin')
  const locale = await getAdminLocale()
  const m = getMessages(locale)
  const t = m.help.tickets
  const tickets = await listVisibleTickets(viewer)

  return (
    <KontoShell who={account?.displayName ?? hotels[0]?.displayName} istInhaber={Boolean(account)}>
      <Link href="/admin" className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> {m.help.ui.topic.backHouses}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-ink">{t.list.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t.list.intro}</p>
        </div>
        <TicketButton
          slug={null}
          label={t.list.newReport}
          className="flex items-center gap-2 rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong"
        />
      </div>
      <TicketList tickets={tickets} t={t} intl={intlLocale(locale)} href={tk => `/admin/meldungen/${tk.id}`} showPlace mode="customer" />
    </KontoShell>
  )
}
