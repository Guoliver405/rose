import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import LegalFooter from '@/components/LegalFooter'
import { getSimContext } from '@/utils/auth'
import { simulatorName } from '@/lib/sim-account'
import { listScenarios } from '@/utils/sim-scenarios'
import { hotelSignupOpen } from '@/utils/hotel-account'
import { getMessages, intlLocale, type SimulatorMessages } from '@/lib/i18n'
import { format } from '@/lib/i18n/format'
import { getAdminLocale } from '@/utils/locale'
import Rich from '@/components/i18n/Rich'
import SimHeader from './SimHeader'
import SimulatorApp from './SimulatorApp'

export async function generateMetadata(): Promise<Metadata> {
  const m = getMessages(await getAdminLocale()).simulator.app.page
  return {
    title: format(m.metaTitle, { name: simulatorName(await getAdminLocale()) }),
    description: m.metaDescription,
  }
}

/**
 * Housekeeping-Simulator (Phase 1 und 2, 26.09.2026). Angemeldet — eigenes
 * Simulator-Konto oder ein Hotelzugang — gibt es das Werkzeug, sonst die
 * Vorstellung mit Registrierung. Der feste Tagesvergleich bleibt öffentlich
 * auf der Landing Page.
 */
export default async function SimulatorPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [ctx, sp, locale] = await Promise.all([getSimContext(), searchParams, getAdminLocale()])
  const messages = getMessages(locale).simulator
  const day = getMessages(locale).landing.day
  const m = messages.app
  const scenarios = ctx ? await listScenarios(ctx.userId) : []

  return (
    <>
      <SimHeader signedIn={!!ctx} hotel={ctx?.kind === 'hotel'} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
        {sp.willkommen && ctx && (
          <p className="flex items-center gap-2 rounded-xl border border-positive-pill-edge bg-positive-tint px-4 py-3 text-sm font-semibold text-positive-deep">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden /> {format(m.page.welcome, { name: simulatorName(locale) })}
          </p>
        )}
        {sp.geloescht && ctx && (
          <p className="rounded-xl border border-edge bg-surface-sunken px-4 py-3 text-sm text-ink">
            {m.page.deleted}
          </p>
        )}
        <div>
          <h1 className="text-3xl font-black text-ink">{simulatorName(locale)}</h1>
          <p className="mt-2 max-w-3xl text-ink-soft">
            {m.page.intro}
          </p>
        </div>
        {ctx
          ? <SimulatorApp initialScenarios={scenarios} m={m} day={day} intlLocale={intlLocale(locale)}
              convert={ctx.kind === 'sim' ? { open: hotelSignupOpen(), m: messages.account.convert } : undefined} />
          : <Intro m={m.page.teaser} />}
      </main>
      <LegalFooter />
    </>
  )
}

function Intro({ m }: { m: SimulatorMessages['app']['page']['teaser'] }) {
  const points = m.points
  return (
    <section className="grid gap-6 rounded-2xl border border-edge bg-surface-elevated p-6 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <h2 className="text-xl font-bold text-ink">{m.heading}</h2>
        <ul className="mt-3 flex flex-col gap-2 text-ink-soft">
          {points.map(p => (
            <li key={p} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-positive-strong" aria-hidden /> {p}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink-muted">
          <Rich text={m.example} tags={{ link: c => <Link href="/#vergleich" className="font-semibold text-action-strong hover:underline">{c}</Link> }} />
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Link href="/simulator/registrieren"
          className="rounded-lg bg-action px-5 py-3 text-center font-bold text-action-foreground hover:bg-action-strong">
          {m.signup}
        </Link>
        <Link href="/login" className="rounded-lg border border-edge px-5 py-2.5 text-center font-semibold text-ink hover:border-edge-strong">
          {m.signIn}
        </Link>
      </div>
    </section>
  )
}
