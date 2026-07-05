import { redirect } from 'next/navigation'
import { getGuestContext } from '@/utils/guest'
import GuestLoginForm from './GuestLoginForm'

/** Generischer Einstieg: Zimmernummer + PIN (Baseline ohne Zimmer-QR). */
export default async function GuestEntryPage() {
  const ctx = await getGuestContext()
  if (ctx) redirect('/guest/status')

  return (
    <main className="flex flex-1 flex-col justify-center gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-black text-ink">
          Ro<span className="text-blocked">Se</span>
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Zimmerservice — Anmeldung</p>
      </div>
      <GuestLoginForm />
    </main>
  )
}
