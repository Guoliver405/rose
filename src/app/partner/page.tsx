import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Check, Info } from 'lucide-react'
import LegalFooter from '@/components/LegalFooter'
import LanguageSwitch from '@/components/LanguageSwitch'
import { RoseLogo } from '@/components/brand/RoseLogo'
import { getPartnerContext, type PartnerContext } from '@/utils/auth'
import { getPartnerOverview } from '@/utils/affiliate'
import { DEFAULT_RATE_BPS, HOLD_DAYS, PARTNER_CONTACT, affiliateEnabled, withRef } from '@/lib/affiliate'
import { formatCents } from '@/lib/money'
import { siteUrl } from '@/lib/site'
import { ADMIN_LOCALES, format, getMessages, intlLocale, type PartnerMessages } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'
import JoinForm from './JoinForm'
import PartnerLink from './PartnerLink'
import { partnerLogoutAction } from './actions'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: getMessages(await getAdminLocale()).partner.metaTitle,
    robots: { index: false, follow: false },
  }
}

/**
 * Partnerbereich (Partnerprogramm, 15.11.2026). Eigene Fläche außerhalb von
 * `/h/<slug>/` und `/admin`, weil ein Partner kein Haus haben muss
 * (Simulator-Konto). Wer noch kein Partner ist, sieht das Angebot; wer es
 * ist, Link, QR-Code und Zahlen — ausdrücklich ohne Namen der geworbenen
 * Häuser. Ausgezahlt wird noch nichts; die Seite sagt das.
 */
export default async function PartnerPage() {
  if (!affiliateEnabled()) redirect('/')
  const ctx = await getPartnerContext()
  if (!ctx) redirect('/login')
  const locale = await getAdminLocale()
  const intl = intlLocale(locale)
  const m = getMessages(locale).partner
  const percent = (bps: number) => new Intl.NumberFormat(intl, { style: 'percent', maximumFractionDigits: 2 }).format(bps / 10000)

  return (
    <>
      <Header ctx={ctx} m={m.header} locale={locale} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
        {ctx.partner
          ? <Dashboard partner={ctx.partner} m={m} intl={intl} />
          : (
            <section className="flex flex-col gap-4 rounded-2xl border border-edge bg-surface-elevated p-6">
              <h1 className="text-2xl font-black text-ink">{m.join.title}</h1>
              <p className="text-ink-soft">{format(m.join.intro, { rate: percent(DEFAULT_RATE_BPS) })}</p>
              <ul className="flex flex-col gap-1.5">
                {m.join.points.map(p => (
                  <li key={p} className="flex items-start gap-2 text-sm text-ink">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-positive-strong" aria-hidden /> {p}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-ink-muted">{m.join.payoutNote}</p>
              <JoinForm m={m.join} />
            </section>
          )}
      </main>
      <LegalFooter />
    </>
  )
}

async function Dashboard({ partner, m, intl }: {
  partner: NonNullable<PartnerContext['partner']>
  m: PartnerMessages
  intl: string
}) {
  const o = await getPartnerOverview(partner.id)
  const s = o.summary
  const month = (key: string) =>
    new Intl.DateTimeFormat(intl, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${key}T00:00:00Z`))
  const url = `${siteUrl()}${withRef('/', partner.code)}`

  return (
    <>
      <h1 className="text-2xl font-black text-ink">{m.header.title}</h1>

      {!partner.approved && (
        <div className="flex items-start gap-3 rounded-xl border border-caution-tint-edge bg-caution-tint p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-caution-strong" aria-hidden />
          <div>
            <p className="font-bold text-ink">{m.notApproved.title}</p>
            <p className="text-sm text-ink">{format(m.notApproved.text, { email: PARTNER_CONTACT })}</p>
          </div>
        </div>
      )}

      <section className="flex flex-col gap-3 rounded-2xl border border-edge bg-surface-elevated p-5" aria-labelledby="partner-link">
        <h2 id="partner-link" className="text-lg font-bold text-ink">{m.link.title}</h2>
        <p className="text-sm text-ink-soft">{m.link.text}</p>
        <PartnerLink url={url} code={partner.code} m={m.link} />
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="partner-zahlen">
        <h2 id="partner-zahlen" className="text-lg font-bold text-ink">{m.stats.title}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label={m.stats.accounts} value={String(o.accounts)} hint={format(m.stats.accountsPaying, { count: o.accountsPaying })} />
          <Tile label={m.stats.rooms} value={String(o.rooms?.count ?? 0)}
            hint={o.rooms ? format(m.stats.roomsHint, { month: month(o.rooms.periodStart) }) : m.stats.roomsNone} />
          <Tile label={m.stats.pending} value={formatCents(s.pendingCents, intl)} hint={format(m.stats.pendingHint, { days: HOLD_DAYS })} />
          <Tile label={m.stats.available} value={formatCents(s.availableCents, intl)} hint={m.stats.availableHint} />
        </div>
        {s.reversedCents > 0 && (
          <p className="text-sm text-ink-soft">
            {m.stats.reversed}: <span className="font-semibold text-ink">{formatCents(s.reversedCents, intl)}</span> ({m.stats.reversedHint})
          </p>
        )}
        <p className="text-xs text-ink-muted">{m.stats.privacy}</p>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="partner-monate">
        <h2 id="partner-monate" className="text-lg font-bold text-ink">{m.months.title}</h2>
        {s.months.length === 0
          ? <p className="rounded-xl border border-edge bg-surface-sunken p-4 text-sm text-ink-soft">{m.months.empty}</p>
          : (
            <div className="overflow-x-auto rounded-xl border border-edge">
              <table className="w-full text-sm">
                <thead className="bg-surface-sunken text-left text-ink-soft">
                  <tr>
                    <th className="px-3 py-2 font-semibold">{m.months.month}</th>
                    <th className="px-3 py-2 text-right font-semibold">{m.months.amount}</th>
                    <th className="px-3 py-2 text-right font-semibold">{m.months.pending}</th>
                    <th className="px-3 py-2 text-right font-semibold">{m.months.reversed}</th>
                  </tr>
                </thead>
                <tbody>
                  {s.months.map(row => (
                    <tr key={row.periodStart} className="border-t border-edge text-ink">
                      <td className="px-3 py-2">{month(row.periodStart)}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatCents(row.netCents, intl)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-ink-soft">{formatCents(row.pendingCents, intl)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-ink-soft">{row.reversedCents > 0 ? formatCents(row.reversedCents, intl) : '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>
    </>
  )
}

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-edge bg-surface p-3">
      <span className="text-xs font-semibold text-ink-soft">{label}</span>
      <span className="text-xl font-black tabular-nums text-ink">{value}</span>
      <span className="text-xs text-ink-muted">{hint}</span>
    </div>
  )
}

function Header({ ctx, m, locale }: { ctx: PartnerContext; m: PartnerMessages['header']; locale: Parameters<typeof intlLocale>[0] }) {
  const back = ctx.home?.kind === 'houses' ? { href: '/admin', label: m.backHouses }
    : ctx.home?.kind === 'house' ? { href: `/h/${ctx.home.slug}/admin`, label: m.backHouse }
    : ctx.home?.kind === 'simulator' ? { href: '/simulator', label: m.backSimulator }
    : null
  return (
    <header className="border-b border-edge bg-surface-elevated">
      <div className="mx-auto flex h-[52px] w-full max-w-3xl items-center justify-between gap-3 px-4">
        <span className="flex items-center gap-3 leading-none text-ink">
          <RoseLogo size="header" />
          <span className="hidden text-sm font-semibold text-ink-soft sm:inline">{m.title}</span>
        </span>
        <nav className="flex items-center gap-2 text-sm">
          <LanguageSwitch current={locale} offered={ADMIN_LOCALES} inline />
          {back && (
            <Link href={back.href} className="rounded-lg px-2 py-1.5 font-semibold text-ink-soft hover:bg-surface-sunken hover:text-ink">
              {back.label}
            </Link>
          )}
          <form action={partnerLogoutAction}>
            <button type="submit" className="rounded-lg border border-edge px-3 py-1.5 font-semibold text-ink hover:border-edge-strong">
              {m.signOut}
            </button>
          </form>
        </nav>
      </div>
    </header>
  )
}
