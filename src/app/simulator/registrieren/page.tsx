import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import LegalFooter from '@/components/LegalFooter'
import { getSimContext } from '@/utils/auth'
import { mailReady } from '@/utils/mail'
import { simulatorName } from '@/lib/sim-account'
import { format, getMessages } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'
import SimHeader from '../SimHeader'
import SimSignupForm from './SimSignupForm'

export async function generateMetadata(): Promise<Metadata> {
  const m = getMessages(await getAdminLocale()).simulator.account.signup
  return { title: format(m.metaTitle, { tool: simulatorName(await getAdminLocale()) }) }
}

export default async function SimRegistrierenPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [ctx, sp] = await Promise.all([getSimContext(), searchParams])
  if (ctx) redirect('/simulator')
  const locale = await getAdminLocale()
  const m = getMessages(locale).simulator.account

  return (
    <>
      <SimHeader signedIn={false} />
      <main className="flex flex-1 flex-col items-center gap-6 px-4 py-10">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-black text-ink">{simulatorName(locale)}</h1>
          <p className="mt-2 text-sm text-ink-soft">{m.signup.intro}</p>
        </div>
        <SimSignupForm linkExpired={sp.fehler === 'link'} mailReady={mailReady()} m={m.signup} marketingText={m.marketing} />
      </main>
      <LegalFooter />
    </>
  )
}
