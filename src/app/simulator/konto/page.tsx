import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import LegalFooter from '@/components/LegalFooter'
import { createClient } from '@/utils/supabase/server'
import { getSimContext } from '@/utils/auth'
import { simulatorName } from '@/lib/sim-account'
import { format, getMessages, intlLocale } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'
import SimHeader from '../SimHeader'
import KontoForms from './KontoForms'

export async function generateMetadata(): Promise<Metadata> {
  const m = getMessages(await getAdminLocale()).simulator.account.konto
  return {
    title: format(m.metaTitle, { tool: simulatorName(await getAdminLocale()) }),
    robots: { index: false, follow: false },
  }
}

/** „Mein Konto" des Simulators: Adresse, Werbe-Einwilligung, Passwort, Löschen. */
export default async function SimKontoPage() {
  const ctx = await getSimContext()
  if (!ctx) redirect('/login')
  // Die Adresse steht nicht im Token-Anspruch, den `getSimContext` liest — hier einmal beim Auth-Server fragen.
  const { data } = await (await createClient()).auth.getUser()
  const locale = await getAdminLocale()
  const m = getMessages(locale).simulator.account

  return (
    <>
      <SimHeader signedIn hotel={ctx.kind === 'hotel'} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
        <h1 className="text-2xl font-black text-ink">{m.konto.title}</h1>
        <KontoForms email={data.user?.email ?? ''} kind={ctx.kind} marketingOptInAt={ctx.marketingOptInAt}
          m={m.konto} marketing={m.marketing} deletePhrase={m.deletePhrase} intlLocale={intlLocale(locale)} />
      </main>
      <LegalFooter />
    </>
  )
}
