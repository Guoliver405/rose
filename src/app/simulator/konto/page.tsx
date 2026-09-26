import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import LegalFooter from '@/components/LegalFooter'
import { createClient } from '@/utils/supabase/server'
import { getSimContext } from '@/utils/auth'
import { SIMULATOR_NAME } from '@/lib/sim-account'
import SimHeader from '../SimHeader'
import KontoForms from './KontoForms'

export const metadata: Metadata = {
  title: `Mein Konto – ${SIMULATOR_NAME}`,
  robots: { index: false, follow: false },
}

/** „Mein Konto" des Simulators: Adresse, Werbe-Einwilligung, Passwort, Löschen. */
export default async function SimKontoPage() {
  const ctx = await getSimContext()
  if (!ctx) redirect('/login')
  // Die Adresse steht nicht im Token-Anspruch, den `getSimContext` liest — hier einmal beim Auth-Server fragen.
  const { data } = await (await createClient()).auth.getUser()

  return (
    <>
      <SimHeader signedIn />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
        <h1 className="text-2xl font-black text-ink">Mein Konto</h1>
        <KontoForms email={data.user?.email ?? ''} kind={ctx.kind} marketingOptInAt={ctx.marketingOptInAt} />
      </main>
      <LegalFooter />
    </>
  )
}
