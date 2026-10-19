import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getMessages, intlLocale } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'
import { listAllTickets, supportUserId } from '@/utils/tickets'
import { TicketList } from '@/components/tickets/TicketViews'
import SupportShell from './SupportShell'

export const metadata: Metadata = { robots: { index: false, follow: false } }

/**
 * Alle Meldungen aller Kunden – nur für die Konten in `SUPPORT_USER_IDS`.
 * Für alle anderen gibt es diese Seite nicht (404 statt Anmeldung: Sie soll
 * nicht einmal auffallen).
 */
export default async function SupportPage({ searchParams }: { searchParams: Promise<{ ansicht?: string }> }) {
  if (!(await supportUserId())) notFound()
  const { ansicht } = await searchParams
  const filter = ansicht === 'erledigt' ? 'done' : 'open'
  const locale = await getAdminLocale()
  const m = getMessages(locale)
  const t = m.help.tickets
  const tickets = await listAllTickets(filter)

  const tab = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm font-semibold ${active ? 'border-action bg-action-tint text-ink' : 'border-edge text-ink-soft hover:text-ink'}`

  return (
    <SupportShell title={t.support.title} logout={m.account.houses.shell.logout}>
      <div>
        <h1 className="text-2xl font-black text-ink">{t.support.title}</h1>
        <p className="mt-1 text-sm text-ink-soft">{t.support.intro}</p>
      </div>
      <div className="flex gap-2">
        <Link href="/support" className={tab(filter === 'open')}>{t.support.filterAll}</Link>
        <Link href="/support?ansicht=erledigt" className={tab(filter === 'done')}>{t.support.filterDone}</Link>
      </div>
      <TicketList tickets={tickets} t={t} intl={intlLocale(locale)} href={tk => `/support/${tk.id}`} showPlace mode="support" />
    </SupportShell>
  )
}
